/**
 * LoopRecorder - Pro Tools-style loop recording automation
 *
 * Features:
 * - Detect loop pass transitions
 * - Event-based loop notifications
 * - Position tracking within loop
 * - Seamless loop boundaries
 * - BPM and time signature aware
 *
 * Use Cases:
 * - Loop recording: Trigger new playlist creation per loop
 * - Pre-roll before loop start
 * - Loop duration calculations
 */

export interface LoopRecorderConfig {
  loopStart: number; // seconds
  loopEnd: number; // seconds
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
}

export type LoopEventListener = (loopPass: number) => void;

export class LoopRecorder {
  private config: LoopRecorderConfig;
  private currentLoopPass: number = 0;
  private recordingStartTime: number | null = null;
  private eventListeners: Map<string, LoopEventListener[]> = new Map();

  constructor(config: LoopRecorderConfig) {
    this.config = config;
  }

  /**
   * Get current loop pass based on elapsed time
   * Returns 0 if before loop start, 1+ during loop
   */
  getCurrentLoopPass(currentTime: number): number {
    if (currentTime < this.config.loopStart) {
      return 0; // Before loop
    }

    const loopDuration = this.config.loopEnd - this.config.loopStart;
    const elapsedInLoop = currentTime - this.config.loopStart;
    return Math.floor(elapsedInLoop / loopDuration) + 1;
  }

  /**
   * Update current time and detect loop transitions
   * Emits 'newLoopPass' event when crossing loop boundary
   */
  update(currentTime: number): void {
    const newLoopPass = this.getCurrentLoopPass(currentTime);

    // Only emit event if loop pass increased (forward playback)
    if (newLoopPass !== this.currentLoopPass && newLoopPass > this.currentLoopPass) {
      this.currentLoopPass = newLoopPass;
      this.emit('newLoopPass', newLoopPass);
    }
  }

  /**
   * Start loop recording
   */
  startRecording(startTime: number): void {
    this.recordingStartTime = startTime;
    this.currentLoopPass = this.getCurrentLoopPass(startTime);
    console.log('[LoopRecorder] Started recording at loop pass:', this.currentLoopPass);
  }

  /**
   * Stop loop recording
   */
  stopRecording(): void {
    this.recordingStartTime = null;
    this.currentLoopPass = 0;
    console.log('[LoopRecorder] Stopped recording');
  }

  /**
   * Get loop duration in seconds
   */
  getLoopDuration(): number {
    return this.config.loopEnd - this.config.loopStart;
  }

  /**
   * Get loop duration in bars
   */
  getLoopDurationInBars(): number {
    const secondsPerBeat = 60 / this.config.bpm;
    const beatsPerBar = this.config.timeSignature.numerator;
    const secondsPerBar = secondsPerBeat * beatsPerBar;
    const loopDuration = this.getLoopDuration();
    return Math.round(loopDuration / secondsPerBar);
  }

  /**
   * Calculate time position within current loop (0 to loopDuration)
   */
  getPositionInLoop(currentTime: number): number {
    const loopDuration = this.getLoopDuration();
    const elapsedInLoop = currentTime - this.config.loopStart;
    return elapsedInLoop % loopDuration;
  }

  /**
   * Check if near loop boundary (for crossfade detection)
   * @param currentTime - Current playback time
   * @param thresholdMs - Threshold in milliseconds (default 50ms)
   */
  isNearLoopBoundary(currentTime: number, thresholdMs: number = 50): boolean {
    const position = this.getPositionInLoop(currentTime);
    const loopDuration = this.getLoopDuration();
    const thresholdSec = thresholdMs / 1000;

    return position < thresholdSec || position > loopDuration - thresholdSec;
  }

  /**
   * Register event listener
   * Supported events: 'newLoopPass'
   */
  on(event: string, listener: LoopEventListener): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Unregister event listener
   */
  off(event: string, listener: LoopEventListener): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    this.eventListeners.set(event, listeners);
  }

  /**
   * Emit event to all registered listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  /**
   * Reset loop recorder state
   */
  reset(): void {
    this.currentLoopPass = 0;
    this.recordingStartTime = null;
    console.log('[LoopRecorder] Reset');
  }

  /**
   * Update loop configuration
   */
  updateConfig(config: Partial<LoopRecorderConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[LoopRecorder] Config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): LoopRecorderConfig {
    return { ...this.config };
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recordingStartTime !== null;
  }

  /**
   * Get recording start time
   */
  getRecordingStartTime(): number | null {
    return this.recordingStartTime;
  }

  /**
   * Get current loop pass number
   */
  getCurrentLoopPassNumber(): number {
    return this.currentLoopPass;
  }

  /**
   * Calculate next loop boundary time
   */
  getNextLoopBoundary(currentTime: number): number {
    if (currentTime < this.config.loopStart) {
      return this.config.loopStart;
    }

    const loopDuration = this.getLoopDuration();
    const elapsedInLoop = currentTime - this.config.loopStart;
    const currentLoopIndex = Math.floor(elapsedInLoop / loopDuration);
    return this.config.loopStart + (currentLoopIndex + 1) * loopDuration;
  }

  /**
   * Calculate previous loop boundary time
   */
  getPreviousLoopBoundary(currentTime: number): number {
    if (currentTime <= this.config.loopStart) {
      return this.config.loopStart;
    }

    const loopDuration = this.getLoopDuration();
    const elapsedInLoop = currentTime - this.config.loopStart;
    const currentLoopIndex = Math.floor(elapsedInLoop / loopDuration);
    return this.config.loopStart + currentLoopIndex * loopDuration;
  }

  /**
   * Check if time is within loop region
   */
  isInLoopRegion(time: number): boolean {
    return time >= this.config.loopStart && time < this.config.loopEnd;
  }
}

// Factory function for common use case
export function createLoopRecorder(
  loopStart: number,
  loopEnd: number,
  bpm: number,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): LoopRecorder {
  return new LoopRecorder({ loopStart, loopEnd, bpm, timeSignature });
}
