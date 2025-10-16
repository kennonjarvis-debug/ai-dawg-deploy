/**
 * Track - Represents a single audio or MIDI track in the DAW
 */

import { TrackConfig, ProcessorConfig } from '../core/types';

export class Track {
  private config: TrackConfig;
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private audioBuffer: AudioBuffer | null = null;
  private processors: Map<string, ProcessorConfig> = new Map();
  private playheadPosition: number = 0;

  constructor(config: TrackConfig, audioContext: AudioContext) {
    this.config = config;
    this.audioContext = audioContext;

    // Create audio nodes for this track
    this.gainNode = audioContext.createGain();
    this.panNode = audioContext.createStereoPanner();

    // Set initial values
    this.gainNode.gain.value = config.volume;
    this.panNode.pan.value = config.pan;

    // Connect nodes: pan -> gain
    this.panNode.connect(this.gainNode);
  }

  /**
   * Process audio for this track
   * Returns processed audio buffer
   */
  process(bufferSize: number, globalPosition: number): Float32Array[] {
    const outputBuffer: Float32Array[] = [
      new Float32Array(bufferSize),
      new Float32Array(bufferSize)
    ];

    if (!this.audioBuffer || !this.hasAudio()) {
      return outputBuffer;
    }

    // TODO: Implement actual audio playback from buffer
    // This is a placeholder for the processing logic

    // Apply volume
    const volume = this.config.volume;
    for (let ch = 0; ch < outputBuffer.length; ch++) {
      for (let i = 0; i < bufferSize; i++) {
        outputBuffer[ch][i] *= volume;
      }
    }

    // Apply pan (simple constant power pan)
    const pan = this.config.pan; // -1 to 1
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    if (outputBuffer.length >= 2) {
      for (let i = 0; i < bufferSize; i++) {
        const mono = (outputBuffer[0][i] + outputBuffer[1][i]) / 2;
        outputBuffer[0][i] = mono * leftGain;
        outputBuffer[1][i] = mono * rightGain;
      }
    }

    return outputBuffer;
  }

  /**
   * Load audio data into this track
   */
  async loadAudio(audioData: ArrayBuffer): Promise<void> {
    this.audioBuffer = await this.audioContext.decodeAudioData(audioData);
    console.log(`Track ${this.config.id}: Audio loaded, duration: ${this.audioBuffer.duration}s`);
  }

  /**
   * Set track volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.config.volume;
  }

  /**
   * Set track pan (-1.0 to 1.0)
   */
  setPan(pan: number): void {
    this.config.pan = Math.max(-1, Math.min(1, pan));
    this.panNode.pan.value = this.config.pan;
  }

  /**
   * Mute this track
   */
  mute(): void {
    this.config.mute = true;
  }

  /**
   * Unmute this track
   */
  unmute(): void {
    this.config.mute = false;
  }

  /**
   * Solo this track
   */
  solo(): void {
    this.config.solo = true;
  }

  /**
   * Unsolo this track
   */
  unsolo(): void {
    this.config.solo = false;
  }

  /**
   * Arm track for recording
   */
  arm(): void {
    this.config.armed = true;
  }

  /**
   * Disarm track
   */
  disarm(): void {
    this.config.armed = false;
  }

  /**
   * Check if track is muted
   */
  isMuted(): boolean {
    return this.config.mute;
  }

  /**
   * Check if track is soloed
   */
  isSoloed(): boolean {
    return this.config.solo;
  }

  /**
   * Check if track is armed
   */
  isArmed(): boolean {
    return this.config.armed;
  }

  /**
   * Check if track has audio loaded
   */
  hasAudio(): boolean {
    return this.audioBuffer !== null;
  }

  /**
   * Get track configuration
   */
  getConfig(): TrackConfig {
    return { ...this.config };
  }

  /**
   * Get audio nodes for manual routing
   */
  getOutputNode(): GainNode {
    return this.gainNode;
  }

  /**
   * Add an effect processor to this track
   */
  addProcessor(processor: ProcessorConfig): void {
    this.processors.set(processor.id, processor);
    console.log(`Track ${this.config.id}: Processor added - ${processor.type}`);
  }

  /**
   * Remove a processor
   */
  removeProcessor(processorId: string): boolean {
    return this.processors.delete(processorId);
  }

  /**
   * Get all processors on this track
   */
  getProcessors(): ProcessorConfig[] {
    return Array.from(this.processors.values());
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.gainNode.disconnect();
    this.panNode.disconnect();
    this.audioBuffer = null;
    this.processors.clear();
  }
}
