/**
 * AudioEngine - Web Audio API based recording and playback engine
 * Handles audio input, recording, monitoring, and clip management
 */

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

  private config: Required<AudioEngineConfig> = {
    sampleRate: 48000,
    bufferSize: 4096,
    inputChannels: 2,
    outputChannels: 2,
  };

  private onRecordingComplete?: (buffer: AudioBuffer, trackId: string) => void;
  private onMultiTrackComplete?: (recordings: Map<string, AudioBuffer>) => void;
  private onLevelUpdate?: (level: number) => void;

  constructor(config?: AudioEngineConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the audio engine and request microphone access
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      });

      // Note: Don't resume here - Chrome's autoplay policy requires user gesture
      // Context will auto-resume on first user interaction (play, record, etc.)
      console.log('[AudioEngine] Initialized - Sample Rate:', this.audioContext.sampleRate);
      console.log('[AudioEngine] Context State:', this.audioContext.state);
    } catch (error) {
      console.error('[AudioEngine] Failed to initialize:', error);
      throw new Error('Failed to initialize audio context');
    }
  }

  /**
   * Request microphone access
   */
  async requestMicrophoneAccess(): Promise<void> {
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
   * Set input monitoring mode
   */
  setInputMonitoring(mode: 'auto' | 'input-only' | 'off', isPlaying: boolean = false): void {
    if (!this.gainNode || !this.audioContext) return;

    switch (mode) {
      case 'auto':
        // Monitor input when stopped or recording, silence when playing
        this.gainNode.disconnect();
        if (!isPlaying) {
          this.gainNode.connect(this.audioContext.destination);
        }
        break;

      case 'input-only':
        // Always monitor input
        this.gainNode.disconnect();
        this.gainNode.connect(this.audioContext.destination);
        break;

      case 'off':
        // Never monitor input
        this.gainNode.disconnect();
        break;
    }

    console.log('[AudioEngine] Input monitoring:', mode, 'playing:', isPlaying);
  }

  /**
   * Start recording audio
   */
  startRecording(trackId: string): void {
    if (!this.audioContext || !this.sourceNode) {
      throw new Error('Audio engine not initialized or no input source');
    }

    // Validate: Prevent double recording
    if (this.recordingState.isRecording) {
      throw new Error('Already recording. Stop current recording first.');
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
  punchIn(trackId: string): void {
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
  startMultiTrackRecording(trackIds: string[]): void {
    if (!this.audioContext || !this.sourceNode) {
      throw new Error('Audio engine not initialized or no input source');
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

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
    }

    console.log('[AudioEngine] Disposed');
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
