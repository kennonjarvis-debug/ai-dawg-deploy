/**
 * AudioEngine - Web Audio API based recording and playback engine
 * Handles audio input, recording, monitoring, and clip management
 */

import { VocalProcessor } from './VocalProcessor';
import { AudioEffectsChain } from './dsp/AudioEffectsChain';
import type { VocalAnalysis } from './VocalProcessor';
import { StemSeparator, type StemSeparationResult } from './ai/StemSeparator';
import { AINoiseReduction, NOISE_REDUCTION_PRESETS } from './ai/AINoiseReduction';
import type { NoiseProfile, ProcessingMetrics } from './ai/AINoiseReduction';
import { BeatAnalyzer, type BeatAnalysisResult, type QuantizeOptions, type MIDIExtractionResult } from './ai/BeatAnalyzer';
import { AdaptiveEQ, type EQAnalysisResult, type ReferenceMatch, type GenreEQStyle, type GenreEQTemplate } from './ai/AdaptiveEQ';
import { AIMasteringEngine } from './ai/AIMasteringEngine';

export interface RecordingState {
  isRecording: boolean;
  isPunched: boolean;
  startTime: number;
  recordedBuffer: AudioBuffer | null;
  recordedChunks: Float32Array[];
  trackId: string | null;
}

export interface PunchRegion {
  startTime: number;
  endTime: number;
  trackId: string;
}

export interface MultiTrackRecordingState {
  isRecording: boolean;
  startTime: number;
  tracks: Map<string, {
    chunks: Float32Array[];
    buffer: AudioBuffer | null;
  }>;
}

export interface AudioEngineConfig {
  sampleRate?: number;
  bufferSize?: number;
  inputChannels?: number;
  outputChannels?: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlayingState: boolean = false;
  private routingEngine: any | null = null; // RoutingEngine reference for plugin processing
  private monitoringTrackId: string | null = null; // Track being monitored

  // Custom AI Plugins
  private vocalProcessor: VocalProcessor | null = null;
  private effectsChain: AudioEffectsChain | null = null;
  private lastVocalAnalysis: VocalAnalysis | null = null;
  private stemSeparator: StemSeparator | null = null;
  private aiNoiseReduction: AINoiseReduction | null = null;
  private beatAnalyzer: BeatAnalyzer | null = null;
  private masteringEngine: AIMasteringEngine | null = null;
  private adaptiveEQ: AdaptiveEQ | null = null;

  private recordingState: RecordingState = {
    isRecording: false,
    isPunched: false,
    startTime: 0,
    recordedBuffer: null,
    recordedChunks: [],
    trackId: null,
  };

  private multiTrackRecording: MultiTrackRecordingState = {
    isRecording: false,
    startTime: 0,
    tracks: new Map(),
  };

  private lastPunchRegion: PunchRegion | null = null;
  private punchStartTime: number | null = null;
  private liveWaveformInterval: number | null = null;

  private config: Required<AudioEngineConfig> = {
    sampleRate: 48000,
    bufferSize: 4096,
    inputChannels: 2,
    outputChannels: 2,
  };

  private onRecordingComplete?: (buffer: AudioBuffer, trackId: string) => void;
  private onMultiTrackComplete?: (recordings: Map<string, AudioBuffer>) => void;
  private onLevelUpdate?: (level: number) => void;
  private onLiveWaveformUpdate?: (trackId: string, waveformData: Float32Array, duration: number) => void;

  constructor(config?: AudioEngineConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the audio engine (defers AudioContext creation until user gesture)
   */
  async initialize(): Promise<void> {
    try {
      // NOTE: AudioContext creation deferred to first user gesture
      // This avoids browser autoplay policy violations

      // Initialize AI plugins that don't require AudioContext yet
      this.vocalProcessor = new VocalProcessor();
      this.aiNoiseReduction = new AINoiseReduction();
      this.beatAnalyzer = new BeatAnalyzer();

      // Note: effectsChain, stemSeparator, masteringEngine, adaptiveEQ
      // will be initialized lazily when AudioContext is created

      console.log('[AudioEngine] Initialized (AudioContext deferred until user gesture)');
    } catch (error) {
      console.error('[AudioEngine] Failed to initialize:', error);
      throw new Error('Failed to initialize audio engine');
    }
  }

  /**
   * Ensure AudioContext is created (call on user gesture)
   * @private
   */
  private async ensureAudioContext(): Promise<void> {
    if (this.audioContext) {
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return;
    }

    // Create audio context (requires user gesture)
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: this.config.sampleRate,
    });

    console.log('[AudioEngine] AudioContext created - Sample Rate:', this.audioContext.sampleRate);
    console.log('[AudioEngine] Context State:', this.audioContext.state);

    // Initialize plugins that need AudioContext
    if (!this.effectsChain) {
      this.effectsChain = new AudioEffectsChain();
    }

    if (!this.stemSeparator) {
      this.stemSeparator = new StemSeparator();
      await this.stemSeparator.initialize(this.audioContext);
    }

    if (!this.masteringEngine) {
      this.masteringEngine = new AIMasteringEngine(this.audioContext);
    }

    if (!this.adaptiveEQ) {
      this.adaptiveEQ = new AdaptiveEQ(this.audioContext.sampleRate);
    }

    console.log('[AudioEngine] AudioContext-dependent plugins initialized');
  }

  /**
   * Get or create the shared AudioContext (public method)
   * This ensures all audio operations use the same AudioContext
   */
  async getOrCreateAudioContext(): Promise<AudioContext> {
    await this.ensureAudioContext();
    if (!this.audioContext) {
      throw new Error('Failed to create AudioContext');
    }
    return this.audioContext;
  }

  /**
   * Request microphone access
   */
  async requestMicrophoneAccess(): Promise<void> {
    // Ensure AudioContext is created (user gesture)
    await this.ensureAudioContext();

    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.config.sampleRate,
          channelCount: this.config.inputChannels,
        },
      });

      // Create source node from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create analyser for level metering
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Create gain node for monitoring volume
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Connect: source → analyser → gain → destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);

      console.log('[AudioEngine] Microphone access granted');
    } catch (error: any) {
      console.error('[AudioEngine] Microphone access denied:', error);

      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
        throw new Error('NotAllowedError: Microphone access denied. Please grant permission in browser settings.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      }

      throw error;
    }
  }

  /**
   * Set routing engine for plugin processing
   */
  setRoutingEngine(routingEngine: any, trackId?: string): void {
    this.routingEngine = routingEngine;
    if (trackId) {
      this.monitoringTrackId = trackId;
    }
    console.log('[AudioEngine] Routing engine set', trackId ? `for track ${trackId}` : '');
  }

  /**
   * Set input monitoring mode (with plugin support)
   */
  setInputMonitoring(mode: 'auto' | 'input-only' | 'off', isPlaying: boolean = false, trackId?: string): void {
    if (!this.gainNode || !this.audioContext) return;

    // Update monitoring track ID if provided
    if (trackId) {
      this.monitoringTrackId = trackId;
    }

    // Disconnect existing connections
    this.gainNode.disconnect();

    // Monitor when: mode is 'input-only' OR (mode is 'auto' AND either not playing OR currently recording)
    const shouldMonitor =
      mode === 'input-only' ||
      (mode === 'auto' && (!isPlaying || this.recordingState.isRecording));

    if (shouldMonitor) {
      // Route through plugins if routing engine is available
      if (this.routingEngine && this.monitoringTrackId) {
        try {
          // Connect input to track's channel strip for plugin processing
          this.routingEngine.connectInputMonitoring?.(
            this.gainNode,
            this.monitoringTrackId,
            this.audioContext.destination
          );
          console.log('[AudioEngine] Input monitoring with plugins:', mode, 'trackId:', this.monitoringTrackId);
        } catch (error) {
          console.warn('[AudioEngine] Failed to route through plugins, using direct connection:', error);
          // Fallback to direct connection
          this.gainNode.connect(this.audioContext.destination);
        }
      } else {
        // Direct connection without plugins
        this.gainNode.connect(this.audioContext.destination);
        console.log('[AudioEngine] Input monitoring (direct):', mode);
      }
    } else {
      console.log('[AudioEngine] Input monitoring off');
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(trackId: string): Promise<void> {
    // Ensure AudioContext is created (user gesture)
    await this.ensureAudioContext();

    if (!this.audioContext || !this.sourceNode) {
      throw new Error('Audio engine not initialized or no input source');
    }

    // Validate: Prevent double recording (check BOTH single and multi-track recording)
    if (this.recordingState.isRecording) {
      throw new Error('Already recording. Stop current recording first.');
    }

    if (this.multiTrackRecording.isRecording) {
      throw new Error('Multi-track recording in progress. Stop it before starting single-track recording.');
    }

    // Check and resume AudioContext if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.audioContext.state === 'closed') {
      throw new Error('AudioContext is closed. Cannot start recording.');
    }

    // Reset recording state
    this.recordingState = {
      isRecording: true,
      isPunched: false,
      startTime: this.audioContext.currentTime,
      recordedBuffer: null,
      recordedChunks: [],
      trackId,
    };

    // Create script processor for recording
    this.processorNode = this.audioContext.createScriptProcessor(
      this.config.bufferSize,
      this.config.inputChannels,
      this.config.outputChannels
    );

    // Process audio chunks
    this.processorNode.onaudioprocess = (event) => {
      if (!this.recordingState.isRecording) return;

      // Get input data (left channel)
      const inputData = event.inputBuffer.getChannelData(0);

      // Copy to recorded chunks
      const chunk = new Float32Array(inputData.length);
      chunk.set(inputData);
      this.recordingState.recordedChunks.push(chunk);

      // Update level meter
      if (this.onLevelUpdate) {
        const rms = this.calculateRMS(inputData);
        this.onLevelUpdate(rms);
      }
    };

    // Connect for recording: source → processor → (nowhere, we're just capturing)
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    // Set up live waveform update interval (every 100ms)
    this.liveWaveformInterval = window.setInterval(() => {
      if (!this.recordingState.isRecording || !this.recordingState.trackId) return;

      // Generate waveform from accumulated chunks
      const totalLength = this.recordingState.recordedChunks.reduce(
        (sum, chunk) => sum + chunk.length,
        0
      );

      if (totalLength > 0 && this.audioContext) {
        // Combine chunks into single Float32Array
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.recordingState.recordedChunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        // Generate waveform data (500 samples for visualization)
        const waveformData = new Float32Array(500);
        const samplesPerBar = Math.floor(combined.length / 500);

        for (let i = 0; i < 500; i++) {
          const start = i * samplesPerBar;
          const end = Math.min(start + samplesPerBar, combined.length);

          let min = 1.0;
          let max = -1.0;

          for (let j = start; j < end; j++) {
            const value = combined[j];
            if (value < min) min = value;
            if (value > max) max = value;
          }

          // Use peak value
          waveformData[i] = Math.max(Math.abs(min), Math.abs(max));
        }

        // Calculate duration in seconds
        const duration = combined.length / this.audioContext.sampleRate;

        // Trigger live waveform callback
        if (this.onLiveWaveformUpdate) {
          this.onLiveWaveformUpdate(this.recordingState.trackId, waveformData, duration);
        }
      }
    }, 100);

    console.log('[AudioEngine] Recording started on track:', trackId);
  }

  /**
   * Stop recording and return recorded buffer
   */
  stopRecording(): AudioBuffer | null {
    if (!this.recordingState.isRecording || !this.audioContext) {
      return null;
    }

    this.recordingState.isRecording = false;

    // Clear live waveform interval
    if (this.liveWaveformInterval !== null) {
      window.clearInterval(this.liveWaveformInterval);
      this.liveWaveformInterval = null;
    }

    // Disconnect processor
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    // Combine all chunks into one buffer
    if (this.recordingState.recordedChunks.length === 0) {
      console.warn('[AudioEngine] No audio recorded');
      return null;
    }

    const totalLength = this.recordingState.recordedChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0
    );

    // Create audio buffer
    const buffer = this.audioContext.createBuffer(
      1, // Mono for now
      totalLength,
      this.audioContext.sampleRate
    );

    // Copy chunks into buffer
    const channelData = buffer.getChannelData(0);
    let offset = 0;
    for (const chunk of this.recordingState.recordedChunks) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }

    this.recordingState.recordedBuffer = buffer;

    console.log('[AudioEngine] Recording stopped - Duration:', buffer.duration.toFixed(2), 's');

    // Trigger completion callback
    if (this.onRecordingComplete && this.recordingState.trackId) {
      this.onRecordingComplete(buffer, this.recordingState.trackId);
    }

    return buffer;
  }

  /**
   * Punch in - start recording at specific time
   */
  async punchIn(trackId: string): Promise<void> {
    // Ensure AudioContext is created (user gesture)
    await this.ensureAudioContext();

    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Validate: Can only punch in during playback
    if (!this.isPlayingState) {
      throw new Error('Cannot punch in while not playing. Start playback first.');
    }

    if (!this.recordingState.isRecording) {
      // Use logical playback time, not audio context time
      this.punchStartTime = this.getCurrentTime();
      this.startRecording(trackId);
      this.recordingState.isPunched = true;
      console.log('[AudioEngine] Punched in at', this.punchStartTime);
    }
  }

  /**
   * Punch out - stop recording at specific time
   */
  punchOut(): AudioBuffer | null {
    if (!this.audioContext) {
      return null;
    }

    if (this.recordingState.isRecording && this.recordingState.isPunched) {
      // Use logical playback time, not audio context time
      const punchEndTime = this.getCurrentTime();
      const buffer = this.stopRecording();

      // Store punch region
      if (this.punchStartTime !== null && this.recordingState.trackId) {
        this.lastPunchRegion = {
          startTime: this.punchStartTime,
          endTime: punchEndTime,
          trackId: this.recordingState.trackId,
        };
        console.log('[AudioEngine] Punched out at', punchEndTime, 'duration:', punchEndTime - this.punchStartTime);
      }

      this.punchStartTime = null;
      return buffer;
    }
    return null;
  }

  /**
   * Get the last punch region
   */
  getLastPunchRegion(): PunchRegion | null {
    return this.lastPunchRegion;
  }

  /**
   * Get current recording duration
   */
  getRecordingDuration(): number {
    if (!this.audioContext || !this.recordingState.isRecording) {
      return 0;
    }
    return this.audioContext.currentTime - this.recordingState.startTime;
  }

  /**
   * Check if currently playing
   */
  isPlaying(): boolean {
    return this.isPlayingState;
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    // Ensure AudioContext is created (user gesture)
    await this.ensureAudioContext();

    // Resume AudioContext if suspended (required by Chrome autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioEngine] AudioContext resumed');
    }

    this.isPlayingState = true;
    if (this.audioContext) {
      this.playbackStartTime = this.audioContext.currentTime;
    }
    console.log('[AudioEngine] Playing');
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.isPlayingState && this.audioContext) {
      // Update current time before stopping
      this.currentPlaybackTime = this.getCurrentTime();
    }
    this.isPlayingState = false;
    console.log('[AudioEngine] Stopped');
  }

  private currentPlaybackTime: number = 0;
  private playbackStartTime: number = 0;

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (this.isPlayingState && this.audioContext) {
      // Calculate current time based on when playback started
      return this.currentPlaybackTime + (this.audioContext.currentTime - this.playbackStartTime);
    }
    return this.currentPlaybackTime;
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    this.currentPlaybackTime = time;
    if (this.audioContext) {
      this.playbackStartTime = this.audioContext.currentTime;
    }
    console.log('[AudioEngine] Seek to', time);
  }

  /**
   * Get recording track ID
   */
  getRecordingTrackId(): string | null {
    return this.recordingState.trackId;
  }

  /**
   * Get recording track IDs (multi-track)
   */
  getRecordingTrackIds(): string[] {
    // Return multi-track IDs if multi-track recording is active
    if (this.multiTrackRecording.isRecording) {
      return Array.from(this.multiTrackRecording.tracks.keys());
    }
    // Return single-track ID if single-track recording is active
    if (this.recordingState.isRecording && this.recordingState.trackId) {
      return [this.recordingState.trackId];
    }
    return [];
  }

  /**
   * Get recording buffer for a track
   */
  getRecordingBuffer(trackId: string): AudioBuffer | null {
    if (this.recordingState.trackId === trackId) {
      return this.recordingState.recordedBuffer;
    }
    const trackState = this.multiTrackRecording.tracks.get(trackId);
    return trackState?.buffer || null;
  }

  /**
   * Get recorded chunks for a track
   */
  getRecordedChunks(trackId: string): Float32Array[] {
    if (this.recordingState.trackId === trackId) {
      return this.recordingState.recordedChunks;
    }
    const trackState = this.multiTrackRecording.tracks.get(trackId);
    return trackState?.chunks || [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    console.log('[AudioEngine] Cleaned up');
  }

  /**
   * Test helper: Inject audio data for testing
   */
  _testInjectAudioData(data: Float32Array): void {
    // Inject into single-track recording
    if (this.recordingState.isRecording) {
      const chunk = new Float32Array(data.length);
      chunk.set(data);
      this.recordingState.recordedChunks.push(chunk);
    }

    // Inject into multi-track recording
    if (this.multiTrackRecording.isRecording) {
      this.multiTrackRecording.tracks.forEach((trackState) => {
        const chunk = new Float32Array(data.length);
        chunk.set(data);
        trackState.chunks.push(chunk);
      });
    }
  }

  /**
   * Test helper: Simulate error
   */
  simulateError(error: Error): void {
    // Cleanup recording state
    this.cleanupRecording();
    console.error('[AudioEngine] Simulated error:', error);
  }

  /**
   * Internal cleanup of recording resources
   */
  private cleanupRecording(): void {
    // Stop all processors
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    // Clear multi-track recordings
    this.multiTrackRecording.tracks.forEach((trackState) => {
      // Clear chunks
      trackState.chunks = [];
      trackState.buffer = null;
    });
    this.multiTrackRecording.tracks.clear();
    this.multiTrackRecording.isRecording = false;

    // Clear single-track recording
    this.recordingState.isRecording = false;
    this.recordingState.recordedChunks = [];
    this.recordingState.recordedBuffer = null;
    this.recordingState.trackId = null;
  }


  /**
   * Get current input level (0-1)
   */
  getInputLevel(): number {
    if (!this.analyserNode) return 0;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    return rms;
  }

  /**
   * Get waveform data for visualization
   */
  getWaveformData(buffer: AudioBuffer, width: number): Float32Array {
    const data = buffer.getChannelData(0);
    const step = Math.floor(data.length / width);
    const waveform = new Float32Array(width);

    for (let i = 0; i < width; i++) {
      const start = i * step;
      const end = start + step;
      let min = 1.0;
      let max = -1.0;

      for (let j = start; j < end && j < data.length; j++) {
        const value = data[j];
        if (value < min) min = value;
        if (value > max) max = value;
      }

      // Use peak value (max of abs)
      waveform[i] = Math.max(Math.abs(min), Math.abs(max));
    }

    return waveform;
  }

  /**
   * Export buffer as WAV blob
   * @alias exportToWAV
   */
  exportAsWAV(buffer: AudioBuffer): Blob {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Export buffer as WAV blob (alias for exportAsWAV)
   */
  exportToWAV(buffer: AudioBuffer): Blob {
    return this.exportAsWAV(buffer);
  }

  /**
   * Calculate RMS (Root Mean Square) for level metering
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Set callback for recording completion
   */
  onComplete(callback: (buffer: AudioBuffer, trackId: string) => void): void {
    this.onRecordingComplete = callback;
  }

  /**
   * Set callback for level updates
   */
  onLevel(callback: (level: number) => void): void {
    this.onLevelUpdate = callback;
  }

  /**
   * Set callback for live waveform updates during recording
   */
  onLiveWaveform(callback: (trackId: string, waveformData: Float32Array, duration: number) => void): void {
    this.onLiveWaveformUpdate = callback;
  }

  /**
   * Check if recording (single or multi-track)
   */
  isRecording(): boolean {
    return this.recordingState.isRecording || this.multiTrackRecording.isRecording;
  }

  /**
   * Get recording state
   */
  getRecordingState(): RecordingState {
    // If multi-track recording, update single-track state to reflect it
    if (this.multiTrackRecording.isRecording) {
      return {
        ...this.recordingState,
        isRecording: true,
      };
    }
    return { ...this.recordingState };
  }

  /**
   * Start multi-track recording
   */
  async startMultiTrackRecording(trackIds: string[]): Promise<void> {
    // Ensure AudioContext is created (user gesture)
    await this.ensureAudioContext();

    if (!this.audioContext || !this.sourceNode) {
      throw new Error('Audio engine not initialized or no input source');
    }

    // Validate: Prevent conflict with single-track recording
    if (this.recordingState.isRecording) {
      throw new Error('Single-track recording in progress. Stop it before starting multi-track recording.');
    }

    if (this.multiTrackRecording.isRecording) {
      throw new Error('Multi-track recording already in progress.');
    }

    console.log('[AudioEngine] Starting multi-track recording for', trackIds.length, 'tracks');

    // Reset multi-track state
    this.multiTrackRecording = {
      isRecording: true,
      startTime: this.audioContext.currentTime,
      tracks: new Map(),
    };

    // Initialize recording state for each track
    trackIds.forEach(trackId => {
      this.multiTrackRecording.tracks.set(trackId, {
        chunks: [],
        buffer: null,
      });
    });

    // Create script processor for recording
    this.processorNode = this.audioContext.createScriptProcessor(
      this.config.bufferSize,
      this.config.inputChannels,
      this.config.outputChannels
    );

    // Process audio chunks for all tracks
    this.processorNode.onaudioprocess = (event) => {
      if (!this.multiTrackRecording.isRecording) return;

      // Get input data (left channel)
      const inputData = event.inputBuffer.getChannelData(0);

      // Copy to all track chunks
      this.multiTrackRecording.tracks.forEach((trackState) => {
        const chunk = new Float32Array(inputData.length);
        chunk.set(inputData);
        trackState.chunks.push(chunk);
      });

      // Update level meter
      if (this.onLevelUpdate) {
        const rms = this.calculateRMS(inputData);
        this.onLevelUpdate(rms);
      }
    };

    // Connect for recording
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  /**
   * Stop multi-track recording
   */
  stopMultiTrackRecording(): Map<string, AudioBuffer> | null {
    if (!this.multiTrackRecording.isRecording || !this.audioContext) {
      return null;
    }

    console.log('[AudioEngine] Stopping multi-track recording');

    this.multiTrackRecording.isRecording = false;

    // Disconnect processor
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    const results = new Map<string, AudioBuffer>();

    // Process each track's recordings
    this.multiTrackRecording.tracks.forEach((trackState, trackId) => {
      if (trackState.chunks.length === 0) {
        console.warn('[AudioEngine] No audio recorded for track:', trackId);
        return;
      }

      const totalLength = trackState.chunks.reduce(
        (sum, chunk) => sum + chunk.length,
        0
      );

      // Create audio buffer
      const buffer = this.audioContext!.createBuffer(
        1, // Mono
        totalLength,
        this.audioContext!.sampleRate
      );

      // Copy chunks into buffer
      const channelData = buffer.getChannelData(0);
      let offset = 0;
      for (const chunk of trackState.chunks) {
        channelData.set(chunk, offset);
        offset += chunk.length;
      }

      trackState.buffer = buffer;
      results.set(trackId, buffer);

      console.log('[AudioEngine] Track', trackId, 'recorded:', buffer.duration.toFixed(2), 's');
    });

    // Trigger completion callback
    if (this.onMultiTrackComplete && results.size > 0) {
      this.onMultiTrackComplete(results);
    }

    return results;
  }

  /**
   * Set callback for multi-track recording completion
   */
  onMultiTrackRecordingComplete(callback: (recordings: Map<string, AudioBuffer>) => void): void {
    this.onMultiTrackComplete = callback;
  }

  /**
   * Cleanup and release resources
   */
  async dispose(): Promise<void> {
    // Stop recording if active
    if (this.recordingState.isRecording) {
      this.stopRecording();
    }

    // Disconnect all nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    // Dispose AI plugins
    if (this.effectsChain) {
      this.effectsChain.dispose();
      this.effectsChain = null;
    }
    this.vocalProcessor = null;
    this.lastVocalAnalysis = null;

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
    }

    console.log('[AudioEngine] Disposed');
  }

  /**
   * Analyze vocal recording and get AI recommendations
   */
  analyzeVocal(audioBuffer: AudioBuffer, genre?: string): VocalAnalysis | null {
    if (!this.vocalProcessor) {
      console.warn('[AudioEngine] VocalProcessor not initialized');
      return null;
    }

    try {
      const analysis = this.vocalProcessor.analyzeVocal(audioBuffer);
      this.lastVocalAnalysis = analysis;
      console.log('[AudioEngine] Vocal analysis complete:', analysis);
      return analysis;
    } catch (error) {
      console.error('[AudioEngine] Vocal analysis failed:', error);
      return null;
    }
  }

  /**
   * Get AI-recommended effects chain for vocal
   */
  getRecommendedEffects(
    audioBuffer: AudioBuffer,
    genre: 'country' | 'pop' | 'rock' | 'rnb' | 'hip-hop' | 'indie' | 'folk' | 'jazz',
    userPreferences?: { naturalSound?: boolean; heavyProduction?: boolean }
  ) {
    if (!this.vocalProcessor) {
      console.warn('[AudioEngine] VocalProcessor not initialized');
      return null;
    }

    try {
      const analysis = this.analyzeVocal(audioBuffer);
      if (!analysis) return null;

      const effectChain = this.vocalProcessor.recommendEffects(analysis, genre, userPreferences);
      console.log('[AudioEngine] Effect chain recommended:', effectChain);
      return effectChain;
    } catch (error) {
      console.error('[AudioEngine] Effect recommendation failed:', error);
      return null;
    }
  }

  /**
   * Get last vocal analysis
   */
  getLastVocalAnalysis(): VocalAnalysis | null {
    return this.lastVocalAnalysis;
  }

  /**
   * Get effects chain instance for direct control
   */
  getEffectsChain(): AudioEffectsChain | null {
    return this.effectsChain;
  }

  // ============================================================================
  // STEM SEPARATION AI ENGINE
  // ============================================================================

  /**
   * Separate audio into stems: vocals, drums, bass, other
   */
  async separateStems(audioBuffer: AudioBuffer): Promise<StemSeparationResult | null> {
    if (!this.stemSeparator) {
      console.warn('[AudioEngine] StemSeparator not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Starting stem separation...');
      const result = await this.stemSeparator.separateStems(audioBuffer);
      console.log('[AudioEngine] Stem separation complete:', result.metadata);
      return result;
    } catch (error) {
      console.error('[AudioEngine] Stem separation failed:', error);
      return null;
    }
  }

  /**
   * Isolate a specific stem from audio
   */
  async isolateStem(
    audioBuffer: AudioBuffer,
    stemType: 'vocals' | 'drums' | 'bass' | 'other'
  ): Promise<AudioBuffer | null> {
    if (!this.stemSeparator) {
      console.warn('[AudioEngine] StemSeparator not initialized');
      return null;
    }

    try {
      console.log(`[AudioEngine] Isolating ${stemType}...`);
      const result = await this.stemSeparator.isolateStem(audioBuffer, stemType);
      console.log(`[AudioEngine] ${stemType} isolated successfully`);
      return result;
    } catch (error) {
      console.error(`[AudioEngine] Failed to isolate ${stemType}:`, error);
      return null;
    }
  }

  /**
   * Remove vocals from audio (create instrumental)
   */
  async removeVocals(audioBuffer: AudioBuffer): Promise<AudioBuffer | null> {
    if (!this.stemSeparator || !this.audioContext) {
      console.warn('[AudioEngine] StemSeparator not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Removing vocals...');
      const result = await this.stemSeparator.separateStems(audioBuffer);

      // Combine drums, bass, and other (everything except vocals)
      const instrumental = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const instrumentalData = instrumental.getChannelData(ch);
        const drumsData = result.drums.getChannelData(ch);
        const bassData = result.bass.getChannelData(ch);
        const otherData = result.other.getChannelData(ch);

        for (let i = 0; i < instrumentalData.length; i++) {
          instrumentalData[i] = drumsData[i] + bassData[i] + otherData[i];
        }
      }

      console.log('[AudioEngine] Vocals removed successfully');
      return instrumental;
    } catch (error) {
      console.error('[AudioEngine] Failed to remove vocals:', error);
      return null;
    }
  }

  /**
   * Remove drums from audio
   */
  async removeDrums(audioBuffer: AudioBuffer): Promise<AudioBuffer | null> {
    if (!this.stemSeparator || !this.audioContext) {
      console.warn('[AudioEngine] StemSeparator not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Removing drums...');
      const result = await this.stemSeparator.separateStems(audioBuffer);

      // Combine vocals, bass, and other (everything except drums)
      const noDrums = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const noDrumsData = noDrums.getChannelData(ch);
        const vocalsData = result.vocals.getChannelData(ch);
        const bassData = result.bass.getChannelData(ch);
        const otherData = result.other.getChannelData(ch);

        for (let i = 0; i < noDrumsData.length; i++) {
          noDrumsData[i] = vocalsData[i] + bassData[i] + otherData[i];
        }
      }

      console.log('[AudioEngine] Drums removed successfully');
      return noDrums;
    } catch (error) {
      console.error('[AudioEngine] Failed to remove drums:', error);
      return null;
    }
  }

  /**
   * Extract bass from audio
   */
  async extractBass(audioBuffer: AudioBuffer): Promise<AudioBuffer | null> {
    return this.isolateStem(audioBuffer, 'bass');
  }

  /**
   * Create acapella (vocals only)
   */
  async createAcapella(audioBuffer: AudioBuffer): Promise<AudioBuffer | null> {
    return this.isolateStem(audioBuffer, 'vocals');
  }

  /**
   * Get stem separator instance
   */
  getStemSeparator(): StemSeparator | null {
    return this.stemSeparator;
  }

  // ============================================================================
  // AI NOISE REDUCTION
  // ============================================================================

  /**
   * Learn noise profile from silent section or noise sample
   */
  learnNoiseProfile(
    audioBuffer: AudioBuffer,
    startTime?: number,
    duration?: number
  ): NoiseProfile | null {
    if (!this.aiNoiseReduction) {
      console.warn('[AudioEngine] AINoiseReduction not initialized');
      return null;
    }

    try {
      if (startTime !== undefined && duration !== undefined) {
        this.aiNoiseReduction.learnNoiseProfile(audioBuffer, startTime, duration);
      } else {
        // Auto-detect silent section
        const success = this.aiNoiseReduction.autoLearnNoiseProfile(audioBuffer);
        if (!success) {
          console.warn('[AudioEngine] Failed to auto-learn noise profile');
          return null;
        }
      }

      const profile = this.aiNoiseReduction.getNoiseProfile();
      console.log('[AudioEngine] Noise profile learned successfully');
      return profile;
    } catch (error) {
      console.error('[AudioEngine] Noise profile learning failed:', error);
      return null;
    }
  }

  /**
   * Apply AI-powered noise reduction
   */
  applyNoiseReduction(
    audioBuffer: AudioBuffer,
    preset: 'light' | 'moderate' | 'aggressive' | 'voice' | 'music' = 'moderate',
    autoLearn: boolean = true
  ): AudioBuffer | null {
    if (!this.aiNoiseReduction) {
      console.warn('[AudioEngine] AINoiseReduction not initialized');
      return null;
    }

    try {
      // Apply preset configuration
      const presetConfig = NOISE_REDUCTION_PRESETS[preset];
      if (presetConfig) {
        this.aiNoiseReduction.updateConfig(presetConfig);
      }

      // Auto-learn noise profile if requested and no profile exists
      if (autoLearn && !this.aiNoiseReduction.getNoiseProfile()) {
        console.log('[AudioEngine] Auto-learning noise profile...');
        this.aiNoiseReduction.autoLearnNoiseProfile(audioBuffer);
      }

      // Process audio
      const processedBuffer = this.aiNoiseReduction.processAudio(audioBuffer);
      const metrics = this.aiNoiseReduction.getMetrics();

      console.log('[AudioEngine] Noise reduction applied:', {
        preset,
        noiseReduced: metrics.noiseReduced.toFixed(2) + ' dB',
        clicksRemoved: metrics.clicksRemoved,
        snrImprovement: metrics.snrImprovement.toFixed(2) + ' dB',
        processingTime: metrics.processingTime.toFixed(2) + ' ms',
      });

      return processedBuffer;
    } catch (error) {
      console.error('[AudioEngine] Noise reduction failed:', error);
      return null;
    }
  }

  /**
   * Remove clicks and pops from audio
   */
  removeClicksPops(
    audioBuffer: AudioBuffer,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): AudioBuffer | null {
    if (!this.aiNoiseReduction) {
      console.warn('[AudioEngine] AINoiseReduction not initialized');
      return null;
    }

    try {
      // Configure for click removal only
      const thresholds = {
        low: 4.0,
        medium: 3.0,
        high: 2.0,
      };

      this.aiNoiseReduction.updateConfig({
        clickRemoval: true,
        clickThreshold: thresholds[sensitivity],
        noiseReduction: 0, // Disable noise reduction
        adaptiveGate: false, // Disable gate
      });

      const processedBuffer = this.aiNoiseReduction.processAudio(audioBuffer);
      const metrics = this.aiNoiseReduction.getMetrics();

      console.log('[AudioEngine] Click/pop removal complete:', {
        sensitivity,
        clicksRemoved: metrics.clicksRemoved,
        processingTime: metrics.processingTime.toFixed(2) + ' ms',
      });

      // Reset configuration
      this.aiNoiseReduction.updateConfig({
        clickRemoval: true,
        clickThreshold: 3.0,
      });

      return processedBuffer;
    } catch (error) {
      console.error('[AudioEngine] Click/pop removal failed:', error);
      return null;
    }
  }

  /**
   * Get noise reduction metrics
   */
  getNoiseReductionMetrics(): ProcessingMetrics | null {
    if (!this.aiNoiseReduction) {
      return null;
    }
    return this.aiNoiseReduction.getMetrics();
  }

  /**
   * Get current noise profile
   */
  getNoiseProfile(): NoiseProfile | null {
    if (!this.aiNoiseReduction) {
      return null;
    }
    return this.aiNoiseReduction.getNoiseProfile();
  }

  /**
   * Clear learned noise profile
   */
  clearNoiseProfile(): void {
    if (this.aiNoiseReduction) {
      this.aiNoiseReduction.clearNoiseProfile();
      console.log('[AudioEngine] Noise profile cleared');
    }
  }

  /**
   * Get AI noise reduction instance for advanced control
   */
  getNoiseReduction(): AINoiseReduction | null {
    return this.aiNoiseReduction;
  }

  // ============================================================================
  // SMART MIX ASSISTANT
  // ============================================================================

  /**
   * Get Smart Mix Assistant instance for mix analysis
   * Note: This is a placeholder - actual implementation would integrate SmartMixAssistant
   */
  getSmartMixAssistant() {
    // Placeholder for integration with SmartMixAssistant
    // In production, this would be initialized like other AI plugins
    console.log('[AudioEngine] Smart Mix Assistant access - to be integrated');
    return null;
  }

  // ============================================================================
  // ADAPTIVE EQ AI ENGINE
  // ============================================================================

  /**
   * Analyze audio and get intelligent EQ recommendations
   */
  analyzeEQ(audioBuffer: AudioBuffer): EQAnalysisResult | null {
    if (!this.adaptiveEQ) {
      console.warn('[AudioEngine] AdaptiveEQ not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Analyzing audio for EQ recommendations...');
      const analysis = this.adaptiveEQ.analyzeAudio(audioBuffer);

      console.log('[AudioEngine] EQ Analysis complete:', {
        resonances: analysis.resonances.length,
        maskingIssues: analysis.maskingIssues.length,
        problems: analysis.problems.length,
        recommendations: analysis.recommendations.length,
        isBalanced: analysis.overall.isBalanced,
      });

      return analysis;
    } catch (error) {
      console.error('[AudioEngine] EQ analysis failed:', error);
      return null;
    }
  }

  /**
   * Auto-EQ for clarity and balance
   */
  autoEQForClarity(audioBuffer: AudioBuffer): EQAnalysisResult['recommendations'] | null {
    if (!this.adaptiveEQ) {
      console.warn('[AudioEngine] AdaptiveEQ not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Applying auto-EQ for clarity...');
      const recommendations = this.adaptiveEQ.autoEQForClarity(audioBuffer);

      console.log('[AudioEngine] Auto-EQ complete:', {
        recommendations: recommendations.length,
      });

      return recommendations;
    } catch (error) {
      console.error('[AudioEngine] Auto-EQ failed:', error);
      return null;
    }
  }

  /**
   * Match EQ to reference track
   */
  matchEQReference(
    sourceBuffer: AudioBuffer,
    referenceBuffer: AudioBuffer
  ): ReferenceMatch | null {
    if (!this.adaptiveEQ) {
      console.warn('[AudioEngine] AdaptiveEQ not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Matching EQ to reference...');
      const match = this.adaptiveEQ.matchReference(sourceBuffer, referenceBuffer);

      console.log('[AudioEngine] EQ matching complete:', {
        matchQuality: match.matchQuality.toFixed(1) + '%',
        recommendations: match.recommendations.length,
        tiltDifference: match.tiltDifference.toFixed(2) + ' dB/oct',
      });

      return match;
    } catch (error) {
      console.error('[AudioEngine] EQ matching failed:', error);
      return null;
    }
  }

  /**
   * Get genre-specific EQ template
   */
  getGenreEQTemplate(genre: GenreEQStyle): GenreEQTemplate | null {
    if (!this.adaptiveEQ) {
      console.warn('[AudioEngine] AdaptiveEQ not initialized');
      return null;
    }

    try {
      const template = this.adaptiveEQ.getGenreTemplate(genre);
      console.log(`[AudioEngine] Genre EQ template: ${template.name}`);
      return template;
    } catch (error) {
      console.error('[AudioEngine] Failed to get genre template:', error);
      return null;
    }
  }

  /**
   * Apply dynamic EQ analysis (adapts to loud vs quiet sections)
   */
  getDynamicEQ(audioBuffer: AudioBuffer): ReturnType<AdaptiveEQ['getDynamicEQ']> | null {
    if (!this.adaptiveEQ) {
      console.warn('[AudioEngine] AdaptiveEQ not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Analyzing for dynamic EQ...');
      const dynamicEQ = this.adaptiveEQ.getDynamicEQ(audioBuffer);

      console.log('[AudioEngine] Dynamic EQ analysis complete:', {
        loudSections: dynamicEQ.loudSections.length + ' recommendations',
        quietSections: dynamicEQ.quietSections.length + ' recommendations',
      });

      return dynamicEQ;
    } catch (error) {
      console.error('[AudioEngine] Dynamic EQ analysis failed:', error);
      return null;
    }
  }

  /**
   * Get Adaptive EQ instance for advanced control
   */
  getAdaptiveEQ(): AdaptiveEQ | null {
    return this.adaptiveEQ;
  }

  // ============================================================================
  // BEAT DETECTION & ANALYSIS
  // ============================================================================

  /**
   * Detect BPM (tempo) of audio
   */
  async detectBPM(audioBuffer: AudioBuffer): Promise<{ bpm: number; confidence: number } | null> {
    if (!this.beatAnalyzer) {
      console.warn('[AudioEngine] BeatAnalyzer not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Detecting BPM...');
      const analysis = await this.beatAnalyzer.analyzeBeat(audioBuffer);
      console.log('[AudioEngine] BPM detected:', analysis.bpm, 'confidence:', analysis.confidence.toFixed(3));
      return {
        bpm: analysis.bpm,
        confidence: analysis.confidence
      };
    } catch (error) {
      console.error('[AudioEngine] BPM detection failed:', error);
      return null;
    }
  }

  /**
   * Comprehensive beat analysis
   */
  async analyzeBeat(audioBuffer: AudioBuffer): Promise<BeatAnalysisResult | null> {
    if (!this.beatAnalyzer) {
      console.warn('[AudioEngine] BeatAnalyzer not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Analyzing beats...');
      const analysis = await this.beatAnalyzer.analyzeBeat(audioBuffer);
      console.log('[AudioEngine] Beat analysis complete:', {
        bpm: analysis.bpm,
        timeSignature: `${analysis.timeSignature.numerator}/${analysis.timeSignature.denominator}`,
        beats: analysis.beats.length,
        measures: analysis.measures.length
      });
      return analysis;
    } catch (error) {
      console.error('[AudioEngine] Beat analysis failed:', error);
      return null;
    }
  }

  /**
   * Quantize audio to grid
   */
  async quantizeToGrid(
    audioBuffer: AudioBuffer,
    options: QuantizeOptions
  ): Promise<AudioBuffer | null> {
    if (!this.beatAnalyzer) {
      console.warn('[AudioEngine] BeatAnalyzer not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Quantizing audio...', options);

      // First analyze beats
      const beatAnalysis = await this.beatAnalyzer.analyzeBeat(audioBuffer);

      // Then quantize
      const quantized = await this.beatAnalyzer.quantizeAudio(audioBuffer, beatAnalysis, options);

      console.log('[AudioEngine] Quantization complete');
      return quantized;
    } catch (error) {
      console.error('[AudioEngine] Quantization failed:', error);
      return null;
    }
  }

  /**
   * Extract MIDI from monophonic audio
   */
  async extractMIDI(audioBuffer: AudioBuffer): Promise<MIDIExtractionResult | null> {
    if (!this.beatAnalyzer) {
      console.warn('[AudioEngine] BeatAnalyzer not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Extracting MIDI...');
      const result = await this.beatAnalyzer.extractMIDI(audioBuffer);
      console.log('[AudioEngine] MIDI extraction complete:', {
        notes: result.notes.length,
        key: result.key,
        scale: result.scale
      });
      return result;
    } catch (error) {
      console.error('[AudioEngine] MIDI extraction failed:', error);
      return null;
    }
  }

  /**
   * Detect musical key
   */
  async detectKey(audioBuffer: AudioBuffer): Promise<{ key: string; scale: string } | null> {
    if (!this.beatAnalyzer) {
      console.warn('[AudioEngine] BeatAnalyzer not initialized');
      return null;
    }

    try {
      console.log('[AudioEngine] Detecting key...');
      const midiResult = await this.beatAnalyzer.extractMIDI(audioBuffer);
      console.log('[AudioEngine] Key detected:', midiResult.key, midiResult.scale);
      return {
        key: midiResult.key,
        scale: midiResult.scale
      };
    } catch (error) {
      console.error('[AudioEngine] Key detection failed:', error);
      return null;
    }
  }

  /**
   * Get beat analyzer instance for advanced control
   */
  getBeatAnalyzer(): BeatAnalyzer | null {
    return this.beatAnalyzer;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export const getAudioEngine = (): AudioEngine => {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
};

export const initializeAudioEngine = async (): Promise<AudioEngine> => {
  const engine = getAudioEngine();
  await engine.initialize();
  await engine.requestMicrophoneAccess();
  return engine;
};
