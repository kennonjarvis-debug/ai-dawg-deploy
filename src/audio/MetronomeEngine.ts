/**
 * MetronomeEngine - Click track generation for recording
 * Provides count-in and metronome functionality
 */

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private clickSources: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private clickInterval: NodeJS.Timeout | null = null;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || null;
  }

  /**
   * Initialize metronome engine with audio context (optional, can defer)
   */
  initialize(audioContext?: AudioContext): void {
    if (audioContext) {
      this.audioContext = audioContext;
    }
    // Note: If audioContext is null, it will be created lazily on first use
    console.log('[MetronomeEngine] Initialized (AudioContext will be created on first use)');
  }

  /**
   * Ensure audio context is available (lazy initialization)
   * @private
   */
  private ensureAudioContext(): void {
    if (!this.audioContext) {
      throw new Error('AudioContext not available. Metronome requires AudioContext.');
    }
  }

  /**
   * Generate a click sound at specific time
   */
  private generateClick(when: number, isDownbeat: boolean = false, volume: number = 0.5): void {
    if (!this.audioContext) return;

    const audioContext = this.audioContext;

    // Create oscillator for click
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Downbeat = higher pitch, upbeat = lower pitch
    osc.frequency.value = isDownbeat ? 1200 : 800;
    osc.type = 'sine';

    // Short click envelope
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.01, when + 0.05);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(when);
    osc.stop(when + 0.05);

    this.clickSources.push(osc);

    // Clean up after click
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      const index = this.clickSources.indexOf(osc);
      if (index > -1) {
        this.clickSources.splice(index, 1);
      }
    };
  }

  /**
   * Play count-in clicks
   */
  playCountIn(bars: number, bpm: number, timeSignature: number, volume: number = 0.5): Promise<void> {
    return new Promise((resolve) => {
      // Ensure audio context is available
      this.ensureAudioContext();

      if (!this.audioContext || bars === 0) {
        resolve();
        return;
      }

      console.log('[MetronomeEngine] Count-in:', bars, 'bars at', bpm, 'BPM');

      const audioContext = this.audioContext;
      const secondsPerBeat = 60 / bpm;
      const totalBeats = bars * timeSignature;
      let beatCount = 0;

      const startTime = audioContext.currentTime;

      // Schedule all count-in clicks
      for (let i = 0; i < totalBeats; i++) {
        const when = startTime + (i * secondsPerBeat);
        const isDownbeat = (i % timeSignature) === 0;
        this.generateClick(when, isDownbeat, volume);
      }

      // Resolve after count-in completes
      const countInDuration = totalBeats * secondsPerBeat * 1000;
      setTimeout(() => resolve(), countInDuration);
    });
  }

  /**
   * Start metronome
   */
  start(bpm: number, timeSignature: number, volume: number = 0.5): void {
    // Ensure audio context is available
    this.ensureAudioContext();

    if (!this.audioContext) return;

    this.stop(); // Stop any existing metronome

    console.log('[MetronomeEngine] Starting at', bpm, 'BPM');

    this.isPlaying = true;
    const secondsPerBeat = 60 / bpm;
    let beatCount = 0;

    const tick = () => {
      if (!this.isPlaying || !this.audioContext) return;

      const when = this.audioContext.currentTime;
      const isDownbeat = (beatCount % timeSignature) === 0;
      this.generateClick(when, isDownbeat, volume);

      beatCount++;
    };

    // Initial tick
    tick();

    // Schedule recurring ticks
    this.clickInterval = setInterval(tick, secondsPerBeat * 1000);
  }

  /**
   * Stop metronome
   */
  stop(): void {
    console.log('[MetronomeEngine] Stopped');

    this.isPlaying = false;

    if (this.clickInterval) {
      clearInterval(this.clickInterval);
      this.clickInterval = null;
    }

    // Stop all active clicks
    this.clickSources.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.clickSources = [];
  }

  /**
   * Check if playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    console.log('[MetronomeEngine] Disposed');
  }
}

// Singleton
let metronomeEngineInstance: MetronomeEngine | null = null;

export const getMetronomeEngine = (): MetronomeEngine => {
  if (!metronomeEngineInstance) {
    metronomeEngineInstance = new MetronomeEngine();
  }
  return metronomeEngineInstance;
};
