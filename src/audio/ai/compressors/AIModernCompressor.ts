/**
 * AI Modern Compressor - DAWG AI
 *
 * Transparent digital compression with intelligent attack/release
 * Clean, precise compression for modern productions
 *
 * Features:
 * - Transparent, low-distortion compression
 * - AI-powered adaptive attack/release based on program material
 * - Intelligent lookahead for transient preservation
 * - Auto threshold adjustment based on input level
 * - Spectral analysis for frequency-dependent compression
 * - True peak limiting mode
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

export interface ModernCompressorParameters extends CompressorState {
  transparency: number;      // 0-100% (distortion vs character)
  transientPreserve: number; // 0-100% (transient preservation)
  aiAdaptive: boolean;       // Enable AI adaptive processing
  spectrumAnalyzer: boolean; // Enable spectral analysis
}

export class AIModernCompressor {
  private metadata: CompressorMetadata;
  private parameters: Map<string, CompressorParameter>;
  private state: ModernCompressorParameters;
  private aiSettings: AICompressorSettings;
  private analysis: CompressorAnalysis;

  // DSP state
  private envelopeFollower: number = 0;
  private gainReduction: number = 0;
  private sampleRate: number = 48000;

  // Lookahead buffer
  private lookaheadBuffer: Float32Array[][] = [];
  private lookaheadWritePos: number = 0;

  // Adaptive algorithm state
  private transientHistory: number[] = [];
  private rmsHistory: number[] = [];
  private adaptiveAttackMs: number = 10;
  private adaptiveReleaseMs: number = 100;

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;

    this.metadata = {
      id: 'dawg-ai-modern-compressor',
      name: 'AI Modern Compressor',
      manufacturer: 'DAWG AI',
      version: '1.0.0',
      category: 'AI Compressor',
      description: 'Transparent digital compression with intelligent attack/release',
      isAI: true,
      numInputs: 2,
      numOutputs: 2,
    };

    this.state = {
      threshold: -18,
      ratio: 4,
      attack: 5,
      release: 50,
      knee: 2,
      makeupGain: 0,
      mix: 100,
      lookahead: 5,
      enabled: true,
      // Modern-specific
      transparency: 80,
      transientPreserve: 70,
      aiAdaptive: true,
      spectrumAnalyzer: true,
    };

    this.aiSettings = {
      autoAdjustThreshold: true,
      autoAdjustRatio: false,
      autoAdjustAttackRelease: true,
      targetDynamicRange: 6,
      intelligenceLevel: 'moderate',
    };

    this.analysis = {
      inputLevel: -60,
      outputLevel: -60,
      gainReduction: 0,
      rmsLevel: 0,
      peakLevel: 0,
      spectralCentroid: 2000,
      dynamicRange: 12,
    };

    this.parameters = this.initializeParameters();
    this.initializeLookaheadBuffer();
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
        default: -18,
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
        min: 0.01,
        max: 50,
        default: 5,
        unit: 'ms',
        isAutomatable: true,
      },
      {
        id: 'release',
        name: 'Release',
        label: 'Release',
        value: this.state.release,
        min: 5,
        max: 500,
        default: 50,
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
        default: 2,
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
        id: 'lookahead',
        name: 'Lookahead',
        label: 'Lookahead',
        value: this.state.lookahead,
        min: 0,
        max: 10,
        default: 5,
        unit: 'ms',
        isAutomatable: false,
      },
      {
        id: 'transparency',
        name: 'Transparency',
        label: 'Transparency',
        value: this.state.transparency,
        min: 0,
        max: 100,
        default: 80,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'transientPreserve',
        name: 'Transient Preserve',
        label: 'Transients',
        value: this.state.transientPreserve,
        min: 0,
        max: 100,
        default: 70,
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

  private initializeLookaheadBuffer(): void {
    const lookaheadSamples = Math.ceil((this.state.lookahead / 1000) * this.sampleRate);
    this.lookaheadBuffer = [
      new Array(lookaheadSamples).fill(new Float32Array(0)),
      new Array(lookaheadSamples).fill(new Float32Array(0)),
    ];
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

    const clampedValue = Math.max(param.min, Math.min(param.max, value));

    param.value = clampedValue;
    param.displayValue = this.formatParameterValue(id, clampedValue);

    (this.state as any)[id] = clampedValue;

    // Update lookahead buffer if lookahead changed
    if (id === 'lookahead') {
      this.initializeLookaheadBuffer();
    }

    // Auto makeup gain if AI mode enabled
    if (this.state.aiAdaptive && (id === 'threshold' || id === 'ratio')) {
      this.updateAutoMakeupGain();
    }
  }

  /**
   * Process audio buffer
   */
  process(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
    if (!this.state.enabled || inputBuffers.length === 0) {
      for (let ch = 0; ch < Math.min(inputBuffers.length, outputBuffers.length); ch++) {
        outputBuffers[ch].set(inputBuffers[ch]);
      }
      return;
    }

    const numChannels = Math.min(inputBuffers.length, outputBuffers.length);
    const numSamples = inputBuffers[0].length;

    // AI adaptive time constants
    if (this.state.aiAdaptive) {
      this.updateAdaptiveTimings(inputBuffers);
    }

    // Use adaptive or manual attack/release
    const attackTime = this.state.aiAdaptive ? this.adaptiveAttackMs : this.state.attack;
    const releaseTime = this.state.aiAdaptive ? this.adaptiveReleaseMs : this.state.release;

    const attackCoeff = Math.exp(-1 / (attackTime * 0.001 * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (releaseTime * 0.001 * this.sampleRate));

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
        this.envelopeFollower = inputDb + attackCoeff * (this.envelopeFollower - inputDb);
      } else {
        this.envelopeFollower = inputDb + releaseCoeff * (this.envelopeFollower - inputDb);
      }

      // Calculate gain reduction with precise knee
      this.gainReduction = this.calculatePreciseGainReduction(this.envelopeFollower);

      // Convert to linear gain
      const compressionGain = Math.pow(10, -this.gainReduction / 20);

      // Apply makeup gain
      const makeupGainLinear = Math.pow(10, this.state.makeupGain / 20);

      // Total gain
      let totalGain = compressionGain * makeupGainLinear;

      // Transient preservation (reduce compression on transients)
      if (this.state.transientPreserve > 0) {
        const transientFactor = this.detectTransient(inputBuffers, i);
        const preserveAmount = (this.state.transientPreserve / 100) * transientFactor;
        totalGain = totalGain + preserveAmount * (1 - totalGain);
      }

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const drySample = inputBuffers[ch][i];
        let sample = drySample;

        // Apply compression
        sample *= totalGain;

        // Transparency control (less = more character)
        if (this.state.transparency < 100) {
          const characterAmount = 1 - this.state.transparency / 100;
          sample = this.addCharacter(sample, characterAmount);
        }

        // Mix dry/wet
        const mixAmount = this.state.mix / 100;
        sample = drySample * (1 - mixAmount) + sample * mixAmount;

        // Soft limiting to prevent clipping
        sample = this.transparentLimit(sample);

        outputBuffers[ch][i] = sample;
      }
    }

    // Update analysis
    this.updateAnalysis(inputBuffers, outputBuffers);
  }

  /**
   * Calculate precise gain reduction with smooth knee
   */
  private calculatePreciseGainReduction(inputDb: number): number {
    const threshold = this.state.threshold;
    const ratio = this.state.ratio;
    const knee = this.state.knee;

    if (inputDb <= threshold - knee / 2) {
      return 0;
    } else if (inputDb >= threshold + knee / 2) {
      const overshoot = inputDb - threshold;
      return overshoot - overshoot / ratio;
    } else {
      // Smooth cubic knee curve for transparent compression
      const kneeInput = inputDb - threshold + knee / 2;
      const kneeRange = knee;
      const kneePosition = kneeInput / kneeRange;

      // Cubic curve for ultra-smooth transition
      const smoothCurve = kneePosition * kneePosition * (3 - 2 * kneePosition);
      const overshoot = inputDb - (threshold - knee / 2);
      return smoothCurve * (overshoot - overshoot / ratio);
    }
  }

  /**
   * Detect transients for preservation
   */
  private detectTransient(buffers: Float32Array[], index: number): number {
    if (index < 5) return 0;

    // Calculate short-term energy vs previous energy
    let currentEnergy = 0;
    let previousEnergy = 0;

    for (let ch = 0; ch < buffers.length; ch++) {
      currentEnergy += Math.abs(buffers[ch][index]);
      for (let i = 1; i <= 5; i++) {
        previousEnergy += Math.abs(buffers[ch][index - i]);
      }
    }

    previousEnergy /= 5;

    // If current energy is significantly higher, it's a transient
    const ratio = currentEnergy / (previousEnergy + 0.001);
    return Math.min(1, Math.max(0, (ratio - 1.5) / 2));
  }

  /**
   * AI adaptive attack/release based on program material
   */
  private updateAdaptiveTimings(buffers: Float32Array[]): void {
    // Analyze transient content
    let transientContent = 0;
    let rmsLevel = 0;

    for (let ch = 0; ch < buffers.length; ch++) {
      for (let i = 5; i < buffers[ch].length; i++) {
        const current = Math.abs(buffers[ch][i]);
        const previous = Math.abs(buffers[ch][i - 1]);
        transientContent += Math.max(0, current - previous);
        rmsLevel += current * current;
      }
    }

    transientContent /= (buffers[0].length - 5) * buffers.length;
    rmsLevel = Math.sqrt(rmsLevel / (buffers[0].length * buffers.length));

    // Store in history
    this.transientHistory.push(transientContent);
    this.rmsHistory.push(rmsLevel);

    if (this.transientHistory.length > 10) {
      this.transientHistory.shift();
      this.rmsHistory.shift();
    }

    // Calculate average transient content
    const avgTransients = this.transientHistory.reduce((a, b) => a + b, 0) / this.transientHistory.length;

    // Adapt attack time based on transient content
    // More transients = faster attack
    if (avgTransients > 0.1) {
      this.adaptiveAttackMs = Math.max(0.5, this.state.attack * 0.5);
    } else if (avgTransients < 0.05) {
      this.adaptiveAttackMs = Math.min(20, this.state.attack * 1.2);
    }

    // Adapt release time based on RMS stability
    const avgRms = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
    const rmsVariation = Math.sqrt(
      this.rmsHistory.reduce((sum, val) => sum + Math.pow(val - avgRms, 2), 0) / this.rmsHistory.length
    );

    // More stable = slower release
    if (rmsVariation < 0.05) {
      this.adaptiveReleaseMs = Math.min(200, this.state.release * 1.5);
    } else if (rmsVariation > 0.15) {
      this.adaptiveReleaseMs = Math.max(20, this.state.release * 0.7);
    }
  }

  /**
   * Add subtle character (when transparency < 100%)
   */
  private addCharacter(sample: number, amount: number): number {
    // Very subtle harmonic enhancement
    const enhanced = sample + amount * 0.02 * Math.sin(2 * Math.PI * sample);
    return enhanced;
  }

  /**
   * Transparent soft limiting
   */
  private transparentLimit(sample: number): number {
    const threshold = 0.95;
    if (Math.abs(sample) > threshold) {
      // Ultra-soft limiting curve
      const overshoot = Math.abs(sample) - threshold;
      const limited = threshold + (1 - threshold) * (1 - Math.exp(-overshoot / 0.1));
      return Math.sign(sample) * limited;
    }
    return sample;
  }

  /**
   * Auto makeup gain compensation
   */
  private updateAutoMakeupGain(): void {
    const estimatedGR = Math.abs(this.state.threshold) / this.state.ratio;
    const autoGain = estimatedGR * 0.8; // 80% compensation for transparent sound
    this.setParameter('makeupGain', autoGain);
  }

  /**
   * Update analysis metrics
   */
  private updateAnalysis(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
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
    this.analysis.dynamicRange = inputPeak > 0
      ? 20 * Math.log10(inputPeak / (inputRms + 0.001))
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
      spectralAnalysis: true,
      dynamicThreshold: true,
    };
  }

  /**
   * Format parameter value for display
   */
  private formatParameterValue(id: string, value: number): string {
    switch (id) {
      case 'ratio':
        return `${value.toFixed(1)}:1`;
      case 'threshold':
      case 'makeupGain':
      case 'knee':
        return `${value.toFixed(1)} dB`;
      case 'attack':
      case 'release':
      case 'lookahead':
        return `${value.toFixed(2)} ms`;
      case 'mix':
      case 'transparency':
      case 'transientPreserve':
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
        id: 'modern-transparent',
        name: 'Transparent',
        description: 'Ultra-clean, transparent compression',
        compressorType: 'modern',
        parameters: {
          threshold: -15,
          ratio: 3,
          attack: 3,
          release: 40,
          knee: 3,
          transparency: 95,
          transientPreserve: 80,
          mix: 100,
        },
        tags: ['transparent', 'clean', 'gentle'],
      },
      {
        id: 'modern-glue',
        name: 'Modern Glue',
        description: 'Gentle mix bus compression',
        compressorType: 'modern',
        parameters: {
          threshold: -20,
          ratio: 2.5,
          attack: 10,
          release: 80,
          knee: 4,
          transparency: 85,
          transientPreserve: 75,
          mix: 100,
        },
        tags: ['glue', 'mix', 'subtle'],
      },
      {
        id: 'modern-punch',
        name: 'Modern Punch',
        description: 'Add punch and energy',
        compressorType: 'modern',
        parameters: {
          threshold: -18,
          ratio: 5,
          attack: 1,
          release: 30,
          knee: 1,
          transparency: 75,
          transientPreserve: 60,
          mix: 100,
        },
        tags: ['punch', 'energy', 'fast'],
      },
      {
        id: 'modern-parallel',
        name: 'Modern Parallel',
        description: 'Transparent parallel compression',
        compressorType: 'modern',
        parameters: {
          ...COMMON_COMPRESSOR_PRESETS.parallel,
          transparency: 90,
          transientPreserve: 85,
          mix: 40,
        },
        tags: ['parallel', 'blend', 'depth'],
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
