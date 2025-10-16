/**
 * Core Audio Engine - Main class for AI DAW
 * Handles real-time audio processing, routing, and playback
 */

import {
  AudioEngineConfig,
  TrackConfig,
  TransportState,
  ExportOptions,
  AudioEngineStats
} from './types';
import { Track } from '../routing/Track';
import { AudioRouter } from '../routing/AudioRouter';
import { MIDIManager } from '../midi/MIDIManager';

export class AudioEngine {
  private context: AudioContext | null = null;
  private tracks: Map<string, Track> = new Map();
  private router: AudioRouter;
  private midiManager: MIDIManager;
  private config: AudioEngineConfig;
  private transport: TransportState;
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<AudioEngineConfig>) {
    this.config = {
      sampleRate: config?.sampleRate || 48000,
      bufferSize: config?.bufferSize || 512,
      maxTracks: config?.maxTracks || 64,
      latencyHint: config?.latencyHint || 'interactive'
    };

    this.transport = {
      isPlaying: false,
      isRecording: false,
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      position: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0
    };

    this.router = new AudioRouter();
    this.midiManager = new MIDIManager();
  }

  /**
   * Initialize the audio engine and Web Audio context
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AudioEngine already initialized');
      return;
    }

    try {
      // Create AudioContext with specified configuration
      this.context = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint
      });

      // Create master output gain node
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      // Initialize MIDI
      await this.midiManager.initialize();

      this.isInitialized = true;
      console.log(`[AUDIO-ENGINE] Initialized - Sample Rate: ${this.context.sampleRate}Hz, Buffer Size: ${this.config.bufferSize}`);
    } catch (error) {
      throw new Error(`Failed to initialize AudioEngine: ${error}`);
    }
  }

  /**
   * Process audio buffer - main real-time audio callback
   */
  processBuffer(inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void {
    if (!this.isInitialized || !this.context) {
      return;
    }

    const bufferSize = inputBuffer[0].length;

    // Clear output buffers
    for (let ch = 0; ch < outputBuffer.length; ch++) {
      outputBuffer[ch].fill(0);
    }

    // Process all active tracks
    this.tracks.forEach(track => {
      if (!track.isMuted() && track.hasAudio()) {
        const trackOutput = track.process(bufferSize, this.transport.position);

        // Mix track output into master output
        for (let ch = 0; ch < Math.min(outputBuffer.length, trackOutput.length); ch++) {
          for (let i = 0; i < bufferSize; i++) {
            outputBuffer[ch][i] += trackOutput[ch][i];
          }
        }
      }
    });

    // Advance playhead if playing
    if (this.transport.isPlaying) {
      this.transport.position += bufferSize;

      // Handle looping
      if (this.transport.loopEnabled && this.transport.position >= this.transport.loopEnd) {
        this.transport.position = this.transport.loopStart;
      }
    }
  }

  /**
   * Add a new track to the engine
   */
  addTrack(trackConfig: TrackConfig): string {
    if (this.tracks.size >= this.config.maxTracks) {
      throw new Error(`Maximum track limit reached (${this.config.maxTracks})`);
    }

    if (!this.context) {
      throw new Error('AudioEngine not initialized');
    }

    const track = new Track(trackConfig, this.context);
    this.tracks.set(trackConfig.id, track);

    console.log(`[AUDIO-ENGINE] Track added: ${trackConfig.name} (${trackConfig.id})`);
    return trackConfig.id;
  }

  /**
   * Remove a track
   */
  removeTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.dispose();
    this.tracks.delete(trackId);
    this.router.removeNode(trackId);

    console.log(`[AUDIO-ENGINE] Track removed: ${trackId}`);
    return true;
  }

  /**
   * Route audio from source to destination
   */
  routeAudio(sourceId: string, destinationId: string): void {
    const sourceTrack = this.tracks.get(sourceId);
    const destTrack = this.tracks.get(destinationId);

    if (!sourceTrack || !destTrack) {
      throw new Error('Invalid source or destination track');
    }

    this.router.connect(sourceId, destinationId);
    console.log(`[AUDIO-ENGINE] Routed: ${sourceId} -> ${destinationId}`);
  }

  /**
   * Disconnect audio routing
   */
  disconnectAudio(sourceId: string, destinationId: string): void {
    this.router.disconnect(sourceId, destinationId);
    console.log(`[AUDIO-ENGINE] Disconnected: ${sourceId} -> ${destinationId}`);
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm: number): void {
    if (bpm < 20 || bpm > 999) {
      throw new Error('Tempo must be between 20 and 999 BPM');
    }
    this.transport.tempo = bpm;
    console.log(`[AUDIO-ENGINE] Tempo set to ${bpm} BPM`);
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.isInitialized) {
      throw new Error('AudioEngine not initialized');
    }
    this.transport.isPlaying = true;
    console.log(`[AUDIO-ENGINE] Playback started`);
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.transport.isPlaying = false;
    this.transport.position = 0;
    console.log(`[AUDIO-ENGINE] Playback stopped`);
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.transport.isPlaying = false;
    console.log(`[AUDIO-ENGINE] Playback paused`);
  }

  /**
   * Start recording
   */
  record(): void {
    if (!this.isInitialized) {
      throw new Error('AudioEngine not initialized');
    }
    this.transport.isRecording = true;
    this.transport.isPlaying = true;
    console.log(`[AUDIO-ENGINE] Recording started`);
  }

  /**
   * Export mix to audio file
   */
  async exportMix(format: ExportOptions['format'], quality: ExportOptions['quality']): Promise<Blob> {
    if (!this.isInitialized || !this.context) {
      throw new Error('AudioEngine not initialized');
    }

    console.log(`[AUDIO-ENGINE] Exporting mix as ${format} (${quality})`);

    // TODO: Implement offline rendering and export
    // This is a placeholder that will be implemented with offline audio context
    throw new Error('Export functionality not yet implemented');
  }

  /**
   * Get current engine statistics
   */
  getStats(): AudioEngineStats {
    if (!this.context) {
      return {
        cpuUsage: 0,
        bufferUtilization: 0,
        activeVoices: 0,
        latency: 0
      };
    }

    return {
      cpuUsage: 0, // TODO: Calculate actual CPU usage
      bufferUtilization: 0, // TODO: Calculate buffer utilization
      activeVoices: this.countActiveVoices(),
      latency: this.context.baseLatency * 1000 // Convert to ms
    };
  }

  /**
   * Get transport state
   */
  getTransport(): TransportState {
    return { ...this.transport };
  }

  /**
   * Get all tracks
   */
  getTracks(): Map<string, Track> {
    return this.tracks;
  }

  /**
   * Get specific track
   */
  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Clean up and dispose
   */
  async dispose(): Promise<void> {
    this.stop();

    // Dispose all tracks
    this.tracks.forEach(track => track.dispose());
    this.tracks.clear();

    // Close audio context
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    this.isInitialized = false;
    console.log(`[AUDIO-ENGINE] Disposed`);
  }

  /**
   * Private helper to count active voices across all tracks
   */
  private countActiveVoices(): number {
    let count = 0;
    this.tracks.forEach(track => {
      if (!track.isMuted() && track.hasAudio()) {
        count++;
      }
    });
    return count;
  }
}
