/**
 * Audio Effects Chain - Professional DSP
 * Audio Engineer (Claude #2)
 *
 * Real-time audio effects processing for vocal recording
 * - Dynamics: Compressor, Limiter, DeEsser, Gate
 * - EQ: Parametric 4-band EQ with High/Low pass
 * - Time: Reverb, Delay, Chorus
 * - Utility: Gain, Pan, Phase
 */

import type {
  ToneNode,
  ToneGain,
  ToneFilter,
  ToneCompressor,
  ToneGate,
  ToneReverb,
  ToneDelay,
  ToneMultibandCompressor,
} from '../../types/audio';

// Lazy-load Tone.js to avoid AudioContext autoplay policy violations
let Tone: typeof import('tone') | null = null;

async function loadTone() {
  if (!Tone) {
    Tone = await import('tone');
  }
  return Tone;
}

// ============================================================================
// EFFECT PARAMETERS
// ============================================================================

export interface CompressorParams {
  threshold: number;    // dB (-60 to 0)
  ratio: number;        // ratio (1 to 20)
  attack: number;       // seconds (0.001 to 1)
  release: number;      // seconds (0.01 to 1)
  knee: number;         // dB (0 to 40)
}

export interface EQBand {
  frequency: number;    // Hz
  gain: number;         // dB (-12 to 12)
  Q: number;            // Q factor (0.1 to 10)
  type: 'lowshelf' | 'peaking' | 'highshelf';
}

export interface ReverbParams {
  decay: number;        // seconds (0.1 to 10)
  preDelay: number;     // seconds (0 to 0.1)
  wet: number;          // 0 to 1
}

export interface DelayParams {
  delayTime: string;    // Tone.js time (e.g., "8n", "250ms")
  feedback: number;     // 0 to 1
  wet: number;          // 0 to 1
}

export interface GateParams {
  threshold: number;    // dB
  attack: number;       // seconds
  release: number;      // seconds
}

export interface EffectChainConfig {
  // Pre-processing
  gate?: GateParams;
  highPass?: number;    // Hz
  lowPass?: number;     // Hz

  // Dynamics
  compressor?: CompressorParams;
  deEsser?: {
    frequency: number;  // Hz (usually 5000-8000)
    threshold: number;  // dB
  };

  // EQ
  eq?: EQBand[];

  // Time-based
  reverb?: ReverbParams;
  delay?: DelayParams;

  // Output
  outputGain?: number;  // dB
}

// ============================================================================
// AUDIO EFFECTS CHAIN CLASS
// ============================================================================

export class AudioEffectsChain {
  // Signal chain nodes
  private input: ToneGain | null = null;
  private output: ToneGain | null = null;

  // Pre-processing
  private gate: ToneGate | null = null;
  private highPassFilter: ToneFilter | null = null;
  private lowPassFilter: ToneFilter | null = null;

  // Dynamics
  private compressor: ToneCompressor | null = null;
  private deEsser: ToneMultibandCompressor | null = null;

  // EQ
  private eqBands: ToneFilter | null = null;
  private parametricEQ: ToneFilter[] = [];

  // Time-based
  private reverb: ToneReverb | null = null;
  private delay: ToneDelay | null = null;

  // Utility
  private outputGain: ToneGain | null = null;

  // Bypass state
  private bypassed = false;
  private bypassGain: ToneGain | null = null;

  // Initialization flag
  private initialized = false;

  constructor() {
    // Defer initialization until Tone.js is loaded
  }

  /**
   * Initialize the effects chain (lazy loads Tone.js)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const T = await loadTone();

    this.input = new T.Gain(1) as unknown as ToneGain;
    this.output = new T.Gain(1) as unknown as ToneGain;
    this.outputGain = new T.Gain(1) as unknown as ToneGain;
    this.bypassGain = new T.Gain(1) as unknown as ToneGain;

    // Initialize with input -> output (bypass)
    this.input.connect(this.bypassGain);
    this.bypassGain.connect(this.output);

    this.initialized = true;
    console.log('[AudioEffectsChain] Initialized with Tone.js');
  }

  /**
   * Build effects chain from configuration
   */
  async buildChain(config: EffectChainConfig): Promise<void> {
    // Ensure Tone.js is loaded and chain is initialized
    await this.ensureInitialized();

    const T = await loadTone();

    // Disconnect and dispose old chain
    this.disposeChain();

    let currentNode: ToneNode | null = this.input;

    // === PRE-PROCESSING ===

    // Gate (noise gate)
    if (config.gate) {
      this.gate = new T.Gate(
        config.gate.threshold,
        config.gate.attack,
        config.gate.release
      );
      currentNode.connect(this.gate);
      currentNode = this.gate;
    }

    // High-pass filter (remove rumble)
    if (config.highPass) {
      this.highPassFilter = new T.Filter({
        type: 'highpass',
        frequency: config.highPass,
        rolloff: -24
      });
      currentNode.connect(this.highPassFilter);
      currentNode = this.highPassFilter;
    }

    // Low-pass filter (remove harshness)
    if (config.lowPass) {
      this.lowPassFilter = new T.Filter({
        type: 'lowpass',
        frequency: config.lowPass,
        rolloff: -24
      });
      currentNode.connect(this.lowPassFilter);
      currentNode = this.lowPassFilter;
    }

    // === DYNAMICS ===

    // Compressor
    if (config.compressor) {
      this.compressor = new T.Compressor({
        threshold: config.compressor.threshold,
        ratio: config.compressor.ratio,
        attack: config.compressor.attack,
        release: config.compressor.release,
        knee: config.compressor.knee
      });
      currentNode.connect(this.compressor);
      currentNode = this.compressor;
    }

    // De-esser (reduce sibilance)
    if (config.deEsser) {
      this.deEsser = new T.MultibandCompressor({
        lowFrequency: config.deEsser.frequency - 1000,
        highFrequency: config.deEsser.frequency + 2000,
        low: { threshold: 0 },
        mid: { threshold: 0 },
        high: {
          threshold: config.deEsser.threshold,
          ratio: 6,
          attack: 0.001,
          release: 0.05
        }
      });
      currentNode.connect(this.deEsser);
      currentNode = this.deEsser;
    }

    // === EQ ===

    // Parametric EQ (custom bands)
    if (config.eq && config.eq.length > 0) {
      for (const band of config.eq) {
        const filter = new T.Filter({
          type: band.type,
          frequency: band.frequency,
          Q: band.Q,
          gain: band.gain
        });
        this.parametricEQ.push(filter);
        currentNode.connect(filter);
        currentNode = filter;
      }
    }

    // === TIME-BASED EFFECTS ===

    // Reverb
    if (config.reverb) {
      this.reverb = new T.Reverb({
        decay: config.reverb.decay,
        preDelay: config.reverb.preDelay,
        wet: config.reverb.wet
      });

      // Reverb needs to generate impulse response
      await this.reverb.generate();

      currentNode.connect(this.reverb);
      currentNode = this.reverb;
    }

    // Delay
    if (config.delay) {
      this.delay = new T.FeedbackDelay({
        delayTime: config.delay.delayTime,
        feedback: config.delay.feedback,
        wet: config.delay.wet
      });
      currentNode.connect(this.delay);
      currentNode = this.delay;
    }

    // === OUTPUT ===

    // Output gain
    if (config.outputGain !== undefined) {
      this.outputGain.gain.value = T.gainToDb(config.outputGain);
    }
    currentNode.connect(this.outputGain);

    // Connect to output
    this.outputGain.connect(this.output);

    console.log('Effects chain built successfully');
  }

  /**
   * Update single effect parameter
   */
  async updateParameter(effect: string, param: string, value: number): Promise<void> {
    await this.ensureInitialized();
    const T = await loadTone();

    switch (effect) {
      case 'compressor':
        if (this.compressor && param in this.compressor) {
          const compParam = this.compressor[param as keyof ToneCompressor];
          if (compParam && typeof compParam === 'object' && 'value' in compParam) {
            (compParam as { value: number }).value = value;
          }
        }
        break;
      case 'reverb':
        if (this.reverb && param in this.reverb) {
          (this.reverb as Record<string, unknown>)[param] = value;
        }
        break;
      case 'delay':
        if (this.delay && param in this.delay) {
          (this.delay as Record<string, unknown>)[param] = value;
        }
        break;
      case 'gate':
        if (this.gate && param in this.gate) {
          (this.gate as Record<string, unknown>)[param] = value;
        }
        break;
      case 'outputGain':
        if (this.outputGain) {
          this.outputGain.gain.value = T.gainToDb(value);
        }
        break;
    }
  }

  /**
   * Bypass entire effects chain
   */
  async setBypass(bypass: boolean): Promise<void> {
    await this.ensureInitialized();

    this.bypassed = bypass;

    if (bypass) {
      // Direct input -> output
      this.input.disconnect();
      this.input.connect(this.bypassGain);
      this.bypassGain.disconnect();
      this.bypassGain.connect(this.output);
    } else {
      // Route through effects chain
      this.bypassGain.disconnect();
      // Chain is already connected via buildChain()
    }
  }

  /**
   * Get input/output nodes for connection
   */
  async getInput(): Promise<ToneGain | null> {
    await this.ensureInitialized();
    return this.input;
  }

  async getOutput(): Promise<ToneGain | null> {
    await this.ensureInitialized();
    return this.output;
  }

  /**
   * Dispose all effects
   */
  private disposeChain(): void {
    this.gate?.dispose();
    this.highPassFilter?.dispose();
    this.lowPassFilter?.dispose();
    this.compressor?.dispose();
    this.deEsser?.dispose();
    this.parametricEQ.forEach(eq => eq.dispose());
    this.reverb?.dispose();
    this.delay?.dispose();

    this.gate = null;
    this.highPassFilter = null;
    this.lowPassFilter = null;
    this.compressor = null;
    this.deEsser = null;
    this.parametricEQ = [];
    this.reverb = null;
    this.delay = null;
  }

  /**
   * Complete cleanup
   */
  dispose(): void {
    this.disposeChain();
    if (this.initialized) {
      this.input?.dispose();
      this.output?.dispose();
      this.outputGain?.dispose();
      this.bypassGain?.dispose();
      this.initialized = false;
    }
  }
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const EFFECT_PRESETS: Record<string, EffectChainConfig> = {
  // Clean vocal with minimal processing
  clean: {
    highPass: 80,
    compressor: {
      threshold: -18,
      ratio: 3,
      attack: 0.005,
      release: 0.1,
      knee: 6
    },
    eq: [
      { frequency: 200, gain: -2, Q: 1, type: 'peaking' },  // Reduce mud
      { frequency: 3000, gain: 3, Q: 1.5, type: 'peaking' }, // Presence boost
      { frequency: 8000, gain: 2, Q: 0.7, type: 'highshelf' } // Air
    ],
    outputGain: 0
  },

  // Broadcast-quality vocal
  broadcast: {
    gate: {
      threshold: -50,
      attack: 0.001,
      release: 0.1
    },
    highPass: 100,
    compressor: {
      threshold: -12,
      ratio: 4,
      attack: 0.003,
      release: 0.05,
      knee: 12
    },
    deEsser: {
      frequency: 6500,
      threshold: -20
    },
    eq: [
      { frequency: 150, gain: -3, Q: 0.8, type: 'lowshelf' },
      { frequency: 1000, gain: -1, Q: 2, type: 'peaking' },
      { frequency: 4000, gain: 4, Q: 1.2, type: 'peaking' },
      { frequency: 10000, gain: 3, Q: 0.5, type: 'highshelf' }
    ],
    outputGain: 2
  },

  // Warm & rich vocal
  warm: {
    highPass: 60,
    compressor: {
      threshold: -16,
      ratio: 2.5,
      attack: 0.01,
      release: 0.15,
      knee: 8
    },
    eq: [
      { frequency: 250, gain: 2, Q: 1, type: 'lowshelf' },  // Warmth
      { frequency: 500, gain: -2, Q: 2, type: 'peaking' },  // Reduce boxiness
      { frequency: 5000, gain: -1, Q: 1, type: 'peaking' }, // Smooth highs
      { frequency: 12000, gain: 1, Q: 0.5, type: 'highshelf' }
    ],
    reverb: {
      decay: 1.5,
      preDelay: 0.02,
      wet: 0.15
    },
    outputGain: 0
  },

  // Modern pop vocal
  pop: {
    highPass: 90,
    compressor: {
      threshold: -14,
      ratio: 6,
      attack: 0.002,
      release: 0.08,
      knee: 10
    },
    deEsser: {
      frequency: 7000,
      threshold: -18
    },
    eq: [
      { frequency: 100, gain: -4, Q: 0.7, type: 'lowshelf' },
      { frequency: 3500, gain: 5, Q: 1.5, type: 'peaking' },
      { frequency: 9000, gain: 4, Q: 0.8, type: 'highshelf' }
    ],
    delay: {
      delayTime: '8n.',
      feedback: 0.3,
      wet: 0.2
    },
    reverb: {
      decay: 2.0,
      preDelay: 0.03,
      wet: 0.25
    },
    outputGain: 1
  },

  // Lo-fi/vintage vocal
  lofi: {
    highPass: 200,
    lowPass: 8000,
    compressor: {
      threshold: -20,
      ratio: 8,
      attack: 0.02,
      release: 0.2,
      knee: 4
    },
    eq: [
      { frequency: 400, gain: 3, Q: 1.5, type: 'peaking' },
      { frequency: 2000, gain: -3, Q: 2, type: 'peaking' },
      { frequency: 6000, gain: -6, Q: 1, type: 'highshelf' }
    ],
    reverb: {
      decay: 0.8,
      preDelay: 0.01,
      wet: 0.4
    },
    outputGain: -2
  }
};
