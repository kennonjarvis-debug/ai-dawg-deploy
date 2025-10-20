/**
 * Vocal Effects Processors - Instance 2 (Audio Engine)
 *
 * Advanced vocal processing effects for professional sound
 * Integrates with pitch detection system from Stage 5
 *
 * Features:
 * - Pitch correction (Auto-Tune style)
 * - Vocal doubling (chorus/ADT)
 * - De-esser (sibilance reduction)
 * - Vocal presets (radio, telephone, etc.)
 */

import { PitchDetector, midiNoteToFrequency } from './pitchDetection';

export interface PitchCorrectionParams {
  enabled: boolean;
  /** Correction strength (0-1, 0=off, 1=hard tune) */
  strength: number;
  /** Correction speed in ms (0=instant, 100=natural) */
  speed: number;
  /** Target scale (chromatic, major, minor, etc.) */
  scale: 'chromatic' | 'major' | 'minor' | 'pentatonic';
  /** Root note for scale (0-11, C=0) */
  rootNote: number;
  /** Formant preservation (prevents chipmunk effect) */
  preserveFormants: boolean;
}

export interface VocalDoublerParams {
  enabled: boolean;
  /** Wet/dry mix (0-1) */
  mix: number;
  /** Delay time in ms (5-50ms for natural doubling) */
  delay: number;
  /** Pitch variation in cents (±10 cents typical) */
  pitchVariation: number;
  /** Stereo width (0-1, 0=mono, 1=wide) */
  width: number;
  /** Number of voices (1-4) */
  voices: number;
}

export interface DeEsserParams {
  enabled: boolean;
  /** Frequency to target (4000-10000 Hz typical) */
  frequency: number;
  /** Threshold in dB (-40 to 0) */
  threshold: number;
  /** Reduction amount in dB (0-20) */
  reduction: number;
  /** Listen mode (hear only sibilants) */
  listenMode: boolean;
}

// Scale definitions (semitone intervals from root)
const SCALES = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

/**
 * Pitch Correction Processor (Auto-Tune style)
 * Uses real-time pitch detection and pitch shifting
 */
export class PitchCorrection {
  private context: AudioContext;
  private params: PitchCorrectionParams;

  // Audio nodes
  public input: GainNode;
  public output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;

  // Pitch shifting (using AudioWorklet)
  private workletNode: AudioWorkletNode | null = null;
  private workletInitialized: boolean = false;

  // Pitch detection
  private pitchDetector: PitchDetector;
  private detectionBuffer: Float32Array;
  private analyserNode: AnalyserNode;

  // Pitch correction state
  private targetPitch: number = 0;
  private currentPitch: number = 0;

  constructor(context: AudioContext, initialParams?: Partial<PitchCorrectionParams>) {
    this.context = context;
    this.params = {
      enabled: false,
      strength: 0.5,
      speed: 50,
      scale: 'chromatic',
      rootNote: 0, // C
      preserveFormants: true,
      ...initialParams,
    };

    // Create audio nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.dryGain = context.createGain();
    this.wetGain = context.createGain();

    // Create analyser for pitch detection
    this.analyserNode = context.createAnalyser();
    this.analyserNode.fftSize = 4096;
    this.detectionBuffer = new Float32Array(4096);

    // Initialize pitch detector
    this.pitchDetector = new PitchDetector({
      sampleRate: context.sampleRate,
      minFrequency: 80,
      maxFrequency: 1000,
      confidenceThreshold: 0.85,
    });

    // Initialize AudioWorklet
    this.initializeWorklet();

    // Setup audio routing (will be updated when worklet loads)
    this.input.connect(this.dryGain);
    this.input.connect(this.analyserNode);
    this.dryGain.connect(this.output);

    // Start pitch detection loop
    this.startPitchDetection();

    this.updateMix();
  }

  /**
   * Initialize AudioWorklet processor
   */
  private async initializeWorklet(): Promise<void> {
    try {
      // Load the worklet module
      await this.context.audioWorklet.addModule('/worklets/pitch-correction.worklet.js');

      // Create the worklet node
      this.workletNode = new AudioWorkletNode(this.context, 'pitch-correction-processor');

      // Connect worklet to audio graph
      this.input.connect(this.workletNode);
      this.workletNode.connect(this.wetGain);
      this.wetGain.connect(this.output);

      this.workletInitialized = true;

      // Send initial parameters
      this.sendParamsToWorklet();
    } catch (error) {
      console.error('Failed to initialize pitch correction worklet:', error);
      // Fallback: direct connection (bypass)
      this.input.connect(this.output);
    }
  }

  /**
   * Send parameters to worklet processor
   */
  private sendParamsToWorklet(): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'updateParams',
      data: {
        enabled: this.params.enabled,
        strength: this.params.strength,
        speed: this.params.speed,
      },
    });
  }

  /**
   * Start pitch detection loop using analyser
   */
  private startPitchDetection(): void {
    const detectPitch = () => {
      if (!this.params.enabled) {
        requestAnimationFrame(detectPitch);
        return;
      }

      // Get time domain data from analyser
      this.analyserNode.getFloatTimeDomainData(this.detectionBuffer);

      // Detect pitch
      const pitchResult = this.pitchDetector.detect(this.detectionBuffer);

      if (pitchResult.frequency > 0 && pitchResult.midiNote !== null) {
        // Find nearest note in scale
        const targetMidiNote = this.findNearestScaleNote(pitchResult.midiNote);
        this.targetPitch = midiNoteToFrequency(targetMidiNote);
        this.currentPitch = pitchResult.frequency;

        // Send pitch data to worklet
        if (this.workletNode) {
          this.workletNode.port.postMessage({
            type: 'setPitch',
            data: {
              targetPitch: this.targetPitch,
              currentPitch: this.currentPitch,
            },
          });
        }
      }

      requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }


  /**
   * Find nearest note in selected scale
   */
  private findNearestScaleNote(midiNote: number): number {
    const scale = SCALES[this.params.scale];
    const octave = Math.floor(midiNote / 12);
    const noteInOctave = midiNote % 12;

    // Transpose to root note
    const transposedNote = (noteInOctave - this.params.rootNote + 12) % 12;

    // Find nearest scale degree
    let nearestScaleDegree = scale[0] ?? 0;
    let minDistance = Math.abs(transposedNote - (scale[0] ?? 0));

    for (const degree of scale) {
      const distance = Math.abs(transposedNote - degree);
      if (distance < minDistance) {
        minDistance = distance;
        nearestScaleDegree = degree;
      }
    }

    // Transpose back
    const targetNote = (nearestScaleDegree + this.params.rootNote) % 12;
    return octave * 12 + targetNote;
  }


  /**
   * Update wet/dry mix based on enabled state
   */
  private updateMix(): void {
    if (this.params.enabled) {
      this.dryGain.gain.value = 0;
      this.wetGain.gain.value = 1;
    } else {
      this.dryGain.gain.value = 1;
      this.wetGain.gain.value = 0;
    }
  }

  updateParams(params: Partial<PitchCorrectionParams>): void {
    this.params = { ...this.params, ...params };
    this.updateMix();

    // Send updated parameters to worklet
    if (params.strength !== undefined || params.speed !== undefined || params.enabled !== undefined) {
      this.sendParamsToWorklet();
    }

    if (params.scale !== undefined || params.rootNote !== undefined) {
      // Reset smoothing buffer in worklet when scale changes
      if (this.workletNode) {
        this.workletNode.port.postMessage({ type: 'reset' });
      }
    }
  }


  setEnabled(enabled: boolean): void {
    this.params.enabled = enabled;
    this.updateMix();
    this.sendParamsToWorklet();
  }


  getParams(): PitchCorrectionParams {
    return { ...this.params };
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  destroy(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.close();
    }
    this.analyserNode.disconnect();
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
  }
}

/**
 * Vocal Doubler (Chorus/ADT effect)
 * Creates multiple delayed and pitch-shifted copies for thick vocal sound
 */
export class VocalDoubler {
  private context: AudioContext;
  private params: VocalDoublerParams;

  public input: GainNode;
  public output: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;

  // Delay lines for each voice
  private delays: DelayNode[] = [];
  private delayGains: GainNode[] = [];
  private panners: StereoPannerNode[] = [];

  constructor(context: AudioContext, initialParams?: Partial<VocalDoublerParams>) {
    this.context = context;
    this.params = {
      enabled: false,
      mix: 0.5,
      delay: 25, // 25ms typical for doubling
      pitchVariation: 5, // ±5 cents
      width: 0.7,
      voices: 2,
      ...initialParams,
    };

    // Create nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.dryGain = context.createGain();
    this.wetGain = context.createGain();

    // Connect dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);

    // Create voice processing chains
    this.createVoices();
    this.updateMix();
  }

  private createVoices(): void {
    // Clean up existing voices
    this.delays.forEach((delay, i) => {
      delay.disconnect();
      const gain = this.delayGains[i];
      const panner = this.panners[i];
      if (gain) gain.disconnect();
      if (panner) panner.disconnect();
    });

    this.delays = [];
    this.delayGains = [];
    this.panners = [];

    // Create new voices
    for (let i = 0; i < this.params.voices; i++) {
      const delay = this.context.createDelay(1);
      const gain = this.context.createGain();
      const panner = this.context.createStereoPanner();

      // Set delay time with slight variation
      const delayVariation = (Math.random() - 0.5) * 5; // ±5ms variation
      delay.delayTime.value = (this.params.delay + delayVariation) / 1000;

      // Set pan position
      const panPosition = ((i / (this.params.voices - 1)) - 0.5) * 2 * this.params.width;
      panner.pan.value = isNaN(panPosition) ? 0 : Math.max(-1, Math.min(1, panPosition));

      // Set gain (equal power distribution)
      gain.gain.value = 1 / Math.sqrt(this.params.voices);

      // Connect chain: input -> delay -> gain -> panner -> wetGain -> output
      this.input.connect(delay);
      delay.connect(gain);
      gain.connect(panner);
      panner.connect(this.wetGain);

      this.delays.push(delay);
      this.delayGains.push(gain);
      this.panners.push(panner);
    }

    this.wetGain.connect(this.output);
  }

  private updateMix(): void {
    this.dryGain.gain.value = this.params.enabled ? (1 - this.params.mix) : 1;
    this.wetGain.gain.value = this.params.enabled ? this.params.mix : 0;
  }

  updateParams(params: Partial<VocalDoublerParams>): void {
    const oldVoices = this.params.voices;
    this.params = { ...this.params, ...params };

    // Recreate voices if count changed
    if (params.voices !== undefined && params.voices !== oldVoices) {
      this.createVoices();
    }

    // Update delay times
    if (params.delay !== undefined) {
      this.delays.forEach((delay) => {
        const delayVariation = (Math.random() - 0.5) * 5;
        delay.delayTime.value = (this.params.delay + delayVariation) / 1000;
      });
    }

    // Update panning
    if (params.width !== undefined) {
      this.panners.forEach((panner, i) => {
        const panPosition = ((i / (this.params.voices - 1)) - 0.5) * 2 * this.params.width;
        panner.pan.value = isNaN(panPosition) ? 0 : Math.max(-1, Math.min(1, panPosition));
      });
    }

    this.updateMix();
  }

  setEnabled(enabled: boolean): void {
    this.params.enabled = enabled;
    this.updateMix();
  }

  getParams(): VocalDoublerParams {
    return { ...this.params };
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  destroy(): void {
    this.delays.forEach((delay, i) => {
      delay.disconnect();
      const gain = this.delayGains[i];
      const panner = this.panners[i];
      if (gain) gain.disconnect();
      if (panner) panner.disconnect();
    });
    this.input.disconnect();
    this.output.disconnect();
    this.dryGain.disconnect();
    this.wetGain.disconnect();
  }
}

/**
 * De-Esser (Sibilance Reduction)
 * Reduces harsh "s" and "t" sounds in vocal recordings
 */
export class DeEsser {
  private _context: AudioContext;
  private params: DeEsserParams;

  public input: GainNode;
  public output: GainNode;

  // Detection path
  private detectorFilter: BiquadFilterNode;
  private detectorGain: GainNode;

  // Compression path
  private compressor: DynamicsCompressorNode;
  private sideChainFilter: BiquadFilterNode;

  // Listen mode
  private listenGain: GainNode;
  private mainGain: GainNode;

  constructor(context: AudioContext, initialParams?: Partial<DeEsserParams>) {
    this._context = context;
    this.params = {
      enabled: false,
      frequency: 6000, // 6kHz typical for sibilance
      threshold: -30,
      reduction: 10,
      listenMode: false,
      ...initialParams,
    };

    // Create nodes
    this.input = context.createGain();
    this.output = context.createGain();
    this.mainGain = context.createGain();
    this.listenGain = context.createGain();

    // Detection filter (bandpass around sibilance frequency)
    this.detectorFilter = context.createBiquadFilter();
    this.detectorFilter.type = 'bandpass';
    this.detectorFilter.frequency.value = this.params.frequency;
    this.detectorFilter.Q.value = 2;

    this.detectorGain = context.createGain();

    // Compressor for reducing sibilants
    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = this.params.threshold;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.001; // 1ms
    this.compressor.release.value = 0.1; // 100ms
    this.compressor.knee.value = 10;

    // Side-chain filter (same frequency as detector)
    this.sideChainFilter = context.createBiquadFilter();
    this.sideChainFilter.type = 'bandpass';
    this.sideChainFilter.frequency.value = this.params.frequency;
    this.sideChainFilter.Q.value = 2;

    // Setup routing
    // Main path: input -> compressor -> mainGain -> output
    this.input.connect(this.compressor);
    this.compressor.connect(this.mainGain);
    this.mainGain.connect(this.output);

    // Listen path: input -> detectorFilter -> listenGain -> output
    this.input.connect(this.detectorFilter);
    this.detectorFilter.connect(this.listenGain);
    this.listenGain.connect(this.output);

    this.updateMix();
  }

  private updateMix(): void {
    if (this.params.listenMode) {
      this.mainGain.gain.value = 0;
      this.listenGain.gain.value = 1;
    } else {
      this.mainGain.gain.value = this.params.enabled ? 1 : 1;
      this.listenGain.gain.value = 0;
    }
  }

  updateParams(params: Partial<DeEsserParams>): void {
    this.params = { ...this.params, ...params };

    if (params.frequency !== undefined) {
      this.detectorFilter.frequency.value = params.frequency;
      this.sideChainFilter.frequency.value = params.frequency;
    }

    if (params.threshold !== undefined) {
      this.compressor.threshold.value = params.threshold;
    }

    if (params.reduction !== undefined) {
      // Map reduction to ratio (0dB = 1:1, 20dB = 20:1)
      this.compressor.ratio.value = Math.max(1, params.reduction / 2);
    }

    this.updateMix();
  }

  setEnabled(enabled: boolean): void {
    this.params.enabled = enabled;
    this.updateMix();
  }

  getParams(): DeEsserParams {
    return { ...this.params };
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  destroy(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.compressor.disconnect();
    this.detectorFilter.disconnect();
    this.detectorGain.disconnect();
    this.sideChainFilter.disconnect();
    this.mainGain.disconnect();
    this.listenGain.disconnect();
  }
}

/**
 * Vocal Presets
 */
export const VOCAL_PRESETS = {
  natural: {
    pitchCorrection: { enabled: false },
    doubler: { enabled: false },
    deEsser: { enabled: true, frequency: 6000, threshold: -30, reduction: 6 },
  },
  radio: {
    pitchCorrection: { enabled: false },
    doubler: { enabled: false },
    deEsser: { enabled: true, frequency: 7000, threshold: -25, reduction: 10 },
  },
  autoTune: {
    pitchCorrection: { enabled: true, strength: 0.8, speed: 0, scale: 'chromatic' as const },
    doubler: { enabled: false },
    deEsser: { enabled: true, frequency: 6500, threshold: -28, reduction: 8 },
  },
  thick: {
    pitchCorrection: { enabled: false },
    doubler: { enabled: true, mix: 0.6, voices: 3, delay: 30, width: 0.8 },
    deEsser: { enabled: true, frequency: 6000, threshold: -30, reduction: 6 },
  },
  telephone: {
    pitchCorrection: { enabled: false },
    doubler: { enabled: false },
    deEsser: { enabled: false },
  },
};
