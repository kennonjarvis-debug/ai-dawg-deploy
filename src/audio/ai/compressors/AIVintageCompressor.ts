/**
 * AI Vintage Compressor - DAWG AI
 *
 * Classic analog-style compression with AI tube saturation
 * Emulates vintage hardware compressors with warm, musical character
 *
 * Features:
 * - Analog-modeled compression curve
 * - AI-powered tube saturation and harmonic enhancement
 * - Adaptive attack/release times based on input dynamics
 * - Auto makeup gain compensation
 * - Vintage-style soft knee
 * - Color/character controls
 */

import {
  CompressorMetadata,
  CompressorParameter,
  CompressorState,
  CompressorAnalysis,
  AICompressorFeatures,
  AICompressorSettings,
  CompressorPreset,
  COMMON_COMPRESSOR_PRESETS,
} from './types';

export interface VintageCompressorParameters extends CompressorState {
  tubeSaturation: number;    // 0-100% (AI tube harmonics)
  color: number;             // 0-100% (vintage character)
  warmth: number;            // 0-100% (low-end emphasis)
  aiMode: boolean;           // Enable AI auto-adjustments
}

export class AIVintageCompressor {
  private metadata: CompressorMetadata;
  private parameters: Map<string, CompressorParameter>;
  private state: VintageCompressorParameters;
  private aiSettings: AICompressorSettings;
  private analysis: CompressorAnalysis;

  // DSP state
  private envelopeFollower: number = -96; // Initialize to silence level in dB
  private gainReduction: number = 0;
  private sampleRate: number = 48000;

  // Tube saturation state
  private tubeBuffer: Float32Array[] = [];
  private harmonicEnhancer: Map<number, number> = new Map();

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;

    this.metadata = {
      id: 'dawg-ai-vintage-compressor',
      name: 'AI Vintage Compressor',
      manufacturer: 'DAWG AI',
      version: '1.0.0',
      category: 'AI Compressor',
      description: 'Classic analog-style compression with AI tube saturation',
      isAI: true,
      numInputs: 2,
      numOutputs: 2,
    };

    this.state = {
      threshold: -12,
      ratio: 4,
      attack: 10,
      release: 100,
      knee: 3,
      makeupGain: 0,
      mix: 100,
      lookahead: 0,
      enabled: true,
      // Vintage-specific
      tubeSaturation: 30,
      color: 50,
      warmth: 40,
      aiMode: true,
    };

    this.aiSettings = {
      autoAdjustThreshold: true,
      autoAdjustRatio: false,
      autoAdjustAttackRelease: true,
      intelligenceLevel: 'moderate',
    };

    this.analysis = {
      inputLevel: -60,
      outputLevel: -60,
      gainReduction: 0,
      rmsLevel: 0,
      peakLevel: 0,
      spectralCentroid: 1000,
      dynamicRange: 12,
    };

    this.parameters = this.initializeParameters();
  }

  private initializeParameters(): Map<string, CompressorParameter> {
    const params = new Map<string, CompressorParameter>();

    const paramDefinitions: Omit<CompressorParameter, 'displayValue'>[] = [
      {
        id: 'threshold',
        name: 'Threshold',
        label: 'Threshold',
        value: this.state.threshold,
        min: -60,
        max: 0,
        default: -12,
        unit: 'dB',
        isAutomatable: true,
      },
      {
        id: 'ratio',
        name: 'Ratio',
        label: 'Ratio',
        value: this.state.ratio,
        min: 1,
        max: 20,
        default: 4,
        unit: ':1',
        isAutomatable: true,
      },
      {
        id: 'attack',
        name: 'Attack',
        label: 'Attack',
        value: this.state.attack,
        min: 0.1,
        max: 100,
        default: 10,
        unit: 'ms',
        isAutomatable: true,
      },
      {
        id: 'release',
        name: 'Release',
        label: 'Release',
        value: this.state.release,
        min: 10,
        max: 1000,
        default: 100,
        unit: 'ms',
        isAutomatable: true,
      },
      {
        id: 'knee',
        name: 'Knee',
        label: 'Knee',
        value: this.state.knee,
        min: 0,
        max: 12,
        default: 3,
        unit: 'dB',
        isAutomatable: true,
      },
      {
        id: 'makeupGain',
        name: 'Makeup Gain',
        label: 'Makeup',
        value: this.state.makeupGain,
        min: 0,
        max: 24,
        default: 0,
        unit: 'dB',
        isAutomatable: true,
      },
      {
        id: 'mix',
        name: 'Mix',
        label: 'Mix',
        value: this.state.mix,
        min: 0,
        max: 100,
        default: 100,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'tubeSaturation',
        name: 'Tube Saturation',
        label: 'Tube',
        value: this.state.tubeSaturation,
        min: 0,
        max: 100,
        default: 30,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'color',
        name: 'Color',
        label: 'Color',
        value: this.state.color,
        min: 0,
        max: 100,
        default: 50,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'warmth',
        name: 'Warmth',
        label: 'Warmth',
        value: this.state.warmth,
        min: 0,
        max: 100,
        default: 40,
        unit: '%',
        isAutomatable: true,
      },
    ];

    paramDefinitions.forEach(def => {
      params.set(def.id, {
        ...def,
        displayValue: this.formatParameterValue(def.id, def.value),
      });
    });

    return params;
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): CompressorMetadata {
    return { ...this.metadata };
  }

  /**
   * Get all parameters
   */
  getParameters(): CompressorParameter[] {
    return Array.from(this.parameters.values());
  }

  /**
   * Get parameter by ID
   */
  getParameter(id: string): CompressorParameter | undefined {
    return this.parameters.get(id);
  }

  /**
   * Set parameter value
   */
  setParameter(id: string, value: number): void {
    const param = this.parameters.get(id);
    if (!param) return;

    // Clamp value to range
    const clampedValue = Math.max(param.min, Math.min(param.max, value));

    // Update parameter
    param.value = clampedValue;
    param.displayValue = this.formatParameterValue(id, clampedValue);

    // Update state
    (this.state as any)[id] = clampedValue;

    // Auto makeup gain if AI mode enabled
    if (this.state.aiMode && (id === 'threshold' || id === 'ratio')) {
      this.updateAutoMakeupGain();
    }
  }

  /**
   * Process audio buffer
   */
  process(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
    if (!this.state.enabled || inputBuffers.length === 0) {
      // Bypass - copy input to output
      for (let ch = 0; ch < Math.min(inputBuffers.length, outputBuffers.length); ch++) {
        outputBuffers[ch].set(inputBuffers[ch]);
      }
      return;
    }

    const numChannels = Math.min(inputBuffers.length, outputBuffers.length);
    const numSamples = inputBuffers[0].length;

    // Convert time constants to coefficients
    const attackCoeff = Math.exp(-1 / (this.state.attack * 0.001 * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (this.state.release * 0.001 * this.sampleRate));

    // AI adaptive time constants based on input dynamics
    const adaptiveAttackCoeff = this.state.aiMode
      ? this.getAdaptiveAttackCoeff(attackCoeff)
      : attackCoeff;
    const adaptiveReleaseCoeff = this.state.aiMode
      ? this.getAdaptiveReleaseCoeff(releaseCoeff)
      : releaseCoeff;

    // Process each sample
    for (let i = 0; i < numSamples; i++) {
      // Calculate stereo peak level
      let peakLevel = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        peakLevel = Math.max(peakLevel, Math.abs(inputBuffers[ch][i]));
      }

      // Convert to dB
      const inputDb = peakLevel > 0 ? 20 * Math.log10(peakLevel) : -96;

      // Update envelope follower
      if (inputDb > this.envelopeFollower) {
        this.envelopeFollower = inputDb + adaptiveAttackCoeff * (this.envelopeFollower - inputDb);
      } else {
        this.envelopeFollower = inputDb + adaptiveReleaseCoeff * (this.envelopeFollower - inputDb);
      }

      // Calculate gain reduction with vintage soft knee
      this.gainReduction = this.calculateVintageGainReduction(this.envelopeFollower);

      // Convert gain reduction to linear gain
      const compressionGain = Math.pow(10, -this.gainReduction / 20);

      // Apply makeup gain
      const makeupGainLinear = Math.pow(10, this.state.makeupGain / 20);

      // Total gain
      const totalGain = compressionGain * makeupGainLinear;

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = inputBuffers[ch][i];
        const drySample = sample;

        // Apply compression
        sample *= totalGain;

        // Apply AI tube saturation
        if (this.state.tubeSaturation > 0) {
          sample = this.applyTubeSaturation(sample, this.state.tubeSaturation / 100);
        }

        // Apply vintage color
        if (this.state.color > 0) {
          sample = this.applyVintageColor(sample, this.state.color / 100);
        }

        // Apply warmth (low-end emphasis)
        if (this.state.warmth > 0) {
          sample = this.applyWarmth(sample, ch, i, this.state.warmth / 100);
        }

        // Mix dry/wet
        const mixAmount = this.state.mix / 100;
        sample = drySample * (1 - mixAmount) + sample * mixAmount;

        // Soft clip to prevent digital clipping
        sample = this.softClip(sample);

        outputBuffers[ch][i] = sample;
      }
    }

    // Update analysis
    this.updateAnalysis(inputBuffers, outputBuffers);
  }

  /**
   * Calculate vintage-style gain reduction with soft knee
   */
  private calculateVintageGainReduction(inputDb: number): number {
    const threshold = this.state.threshold;
    const ratio = this.state.ratio;
    const knee = this.state.knee;

    if (inputDb <= threshold - knee / 2) {
      // Below threshold - no compression
      return 0;
    } else if (inputDb >= threshold + knee / 2) {
      // Above threshold + knee - full compression
      const overshoot = inputDb - threshold;
      return overshoot - overshoot / ratio;
    } else {
      // In knee region - smooth transition (quadratic)
      const kneeInput = inputDb - threshold + knee / 2;
      const kneeRange = knee;
      const kneePosition = kneeInput / kneeRange; // 0 to 1

      // Quadratic soft knee curve
      const compressionAmount = kneePosition * kneePosition;
      const overshoot = inputDb - (threshold - knee / 2);
      return compressionAmount * (overshoot - overshoot / ratio);
    }
  }

  /**
   * AI-powered tube saturation with harmonic enhancement
   * UPGRADE: Replaced incorrect additive synthesis with proper nonlinear waveshaping
   * that generates natural harmonics through asymmetric distortion
   */
  private applyTubeSaturation(sample: number, amount: number): number {
    if (amount === 0) return sample;

    // Asymmetric tube-style waveshaping (generates even harmonics naturally)
    const drive = 1 + amount * 3; // 1x to 4x drive

    // Pre-emphasis for natural tube response
    const emphasized = sample * drive;

    // Asymmetric clipping (tube characteristic - different curves for +/-)
    let saturated: number;
    if (emphasized > 0) {
      // Positive half: softer clipping (more headroom)
      saturated = emphasized / (1 + emphasized * emphasized * 0.3);
    } else {
      // Negative half: harder clipping (generates even harmonics)
      saturated = emphasized / (1 + Math.abs(emphasized) * 1.5);
    }

    // Add subtle grid bias (tube DC offset characteristic)
    const bias = amount * 0.05;
    saturated = saturated + bias * (1 - saturated * saturated);

    // Normalize and apply makeup gain
    const normalized = saturated / (drive * 0.5 + 0.5);

    return normalized;
  }

  /**
   * Apply vintage color/character
   */
  private applyVintageColor(sample: number, amount: number): number {
    if (amount === 0) return sample;

    // Subtle asymmetric clipping for analog character
    const colored = sample + amount * 0.1 * sample * sample * Math.sign(sample);

    return colored;
  }

  /**
   * Apply warmth (low-end emphasis)
   */
  private applyWarmth(sample: number, channel: number, index: number, amount: number): number {
    // Simple warmth using subtle low-pass filtering
    // In production, would use proper filter implementation
    return sample * (1 + amount * 0.1);
  }

  /**
   * Soft clipping to prevent digital clipping
   */
  private softClip(sample: number): number {
    const threshold = 0.9;
    if (Math.abs(sample) > threshold) {
      return Math.sign(sample) * (threshold + (1 - threshold) * Math.tanh((Math.abs(sample) - threshold) / (1 - threshold)));
    }
    return sample;
  }

  /**
   * Get adaptive attack coefficient based on input dynamics
   */
  private getAdaptiveAttackCoeff(baseCoeff: number): number {
    // Faster attack for transient-rich material
    const transientFactor = this.analysis.peakLevel / (this.analysis.rmsLevel + 0.001);
    if (transientFactor > 3) {
      return baseCoeff * 0.5; // Faster attack for transients
    }
    return baseCoeff;
  }

  /**
   * Get adaptive release coefficient based on input dynamics
   */
  private getAdaptiveReleaseCoeff(baseCoeff: number): number {
    // Slower release for sustained material
    const sustainedFactor = this.analysis.rmsLevel / (this.analysis.peakLevel + 0.001);
    if (sustainedFactor > 0.7) {
      return baseCoeff * 1.5; // Slower release for sustained material
    }
    return baseCoeff;
  }

  /**
   * Auto makeup gain compensation
   */
  private updateAutoMakeupGain(): void {
    // Estimate gain reduction and compensate
    const estimatedGR = Math.abs(this.state.threshold) / this.state.ratio;
    const autoGain = estimatedGR * 0.7; // 70% compensation
    this.setParameter('makeupGain', autoGain);
  }

  /**
   * Update analysis metrics
   */
  private updateAnalysis(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
    // Calculate RMS and peak levels
    let inputRms = 0;
    let inputPeak = 0;
    let outputRms = 0;
    let outputPeak = 0;

    for (let ch = 0; ch < inputBuffers.length; ch++) {
      for (let i = 0; i < inputBuffers[ch].length; i++) {
        const inputSample = Math.abs(inputBuffers[ch][i]);
        const outputSample = Math.abs(outputBuffers[ch][i]);

        inputRms += inputSample * inputSample;
        outputRms += outputSample * outputSample;
        inputPeak = Math.max(inputPeak, inputSample);
        outputPeak = Math.max(outputPeak, outputSample);
      }
    }

    const numSamples = inputBuffers[0].length * inputBuffers.length;
    inputRms = Math.sqrt(inputRms / numSamples);
    outputRms = Math.sqrt(outputRms / numSamples);

    this.analysis.rmsLevel = inputRms;
    this.analysis.peakLevel = inputPeak;
    this.analysis.inputLevel = inputRms > 0 ? 20 * Math.log10(inputRms) : -96;
    this.analysis.outputLevel = outputRms > 0 ? 20 * Math.log10(outputRms) : -96;
    this.analysis.gainReduction = this.gainReduction;
    this.analysis.dynamicRange = this.analysis.peakLevel > 0
      ? 20 * Math.log10(this.analysis.peakLevel / (inputRms + 0.001))
      : 12;
  }

  /**
   * Get current analysis
   */
  getAnalysis(): CompressorAnalysis {
    return { ...this.analysis };
  }

  /**
   * Get AI features
   */
  getAIFeatures(): AICompressorFeatures {
    return {
      autoMakeupGain: true,
      adaptiveAttackRelease: true,
      smartSidechain: false,
      spectralAnalysis: false,
      dynamicThreshold: false,
    };
  }

  /**
   * Format parameter value for display
   */
  private formatParameterValue(id: string, value: number): string {
    // Don't try to access this.parameters during initialization
    switch (id) {
      case 'ratio':
        return `${value.toFixed(1)}:1`;
      case 'threshold':
      case 'makeupGain':
      case 'knee':
        return `${value.toFixed(1)} dB`;
      case 'attack':
      case 'release':
        return `${value.toFixed(1)} ms`;
      case 'mix':
      case 'tubeSaturation':
      case 'color':
      case 'warmth':
        return `${value.toFixed(0)}%`;
      default:
        return value.toFixed(2);
    }
  }

  /**
   * Get presets
   */
  getPresets(): CompressorPreset[] {
    return [
      {
        id: 'vintage-gentle',
        name: 'Gentle Vintage',
        description: 'Subtle compression with warm tube character',
        compressorType: 'vintage',
        parameters: {
          ...COMMON_COMPRESSOR_PRESETS.gentle,
          tubeSaturation: 20,
          color: 40,
          warmth: 30,
        },
        tags: ['gentle', 'warm', 'subtle'],
      },
      {
        id: 'vintage-medium',
        name: 'Classic Vintage',
        description: 'Medium compression with rich tube saturation',
        compressorType: 'vintage',
        parameters: {
          ...COMMON_COMPRESSOR_PRESETS.medium,
          tubeSaturation: 40,
          color: 60,
          warmth: 50,
        },
        tags: ['classic', 'warm', 'rich'],
      },
      {
        id: 'vintage-slam',
        name: 'Vintage Slam',
        description: 'Aggressive vintage compression with heavy saturation',
        compressorType: 'vintage',
        parameters: {
          ...COMMON_COMPRESSOR_PRESETS.aggressive,
          tubeSaturation: 70,
          color: 80,
          warmth: 60,
        },
        tags: ['aggressive', 'heavy', 'saturated'],
      },
      {
        id: 'vintage-parallel',
        name: 'Vintage Parallel',
        description: 'Parallel compression with tube character',
        compressorType: 'vintage',
        parameters: {
          ...COMMON_COMPRESSOR_PRESETS.parallel,
          tubeSaturation: 50,
          color: 70,
          warmth: 40,
          mix: 35,
        },
        tags: ['parallel', 'vintage', 'blend'],
      },
    ];
  }

  /**
   * Load preset
   */
  loadPreset(preset: CompressorPreset): void {
    Object.entries(preset.parameters).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setParameter(key, value);
      }
    });
  }

  /**
   * Enable/disable plugin
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }
}
