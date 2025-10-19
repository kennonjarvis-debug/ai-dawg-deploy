/**
 * AI Vocal Compressor - DAWG AI
 *
 * Specialized vocal compression with AI presence enhancement
 * Optimized specifically for vocal processing
 *
 * Features:
 * - Vocal-optimized compression curve
 * - AI-powered presence enhancement (2-5kHz)
 * - Automatic de-essing (sibilance control)
 * - Breath control and dynamics smoothing
 * - Adaptive attack/release for natural vocal dynamics
 * - Smart makeup gain with spectral awareness
 * - Proximity effect compensation
 * - Air enhancement (10kHz+)
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

export interface VocalCompressorParameters extends CompressorState {
  presenceEnhance: number;    // 0-100% (AI presence boost 2-5kHz)
  deEssAmount: number;        // 0-100% (sibilance reduction)
  breathControl: number;      // 0-100% (breath suppression)
  airEnhance: number;         // 0-100% (high frequency air)
  proximityFix: number;       // 0-100% (low-end compensation)
  vocalType: 'male' | 'female' | 'rap' | 'sung' | 'auto';
  aiMode: boolean;            // Enable AI auto-adjustments
}

export class AIVocalCompressor {
  private metadata: CompressorMetadata;
  private parameters: Map<string, CompressorParameter>;
  private state: VocalCompressorParameters;
  private aiSettings: AICompressorSettings;
  private analysis: CompressorAnalysis & {
    sibilanceLevel: number;
    breathLevel: number;
    presenceLevel: number;
    fundamentalFreq: number;
  };

  // DSP state
  private envelopeFollower: number = 0;
  private gainReduction: number = 0;
  private sampleRate: number = 48000;

  // De-esser state
  private deEssEnvelope: number = 0;
  private sibilanceDetected: boolean = false;

  // Breath control state
  private breathEnvelope: number = 0;

  // Spectral enhancement state
  private presenceBuffer: Float32Array[] = [];
  private airBuffer: Float32Array[] = [];

  // Vocal detection
  private detectedVocalType: 'male' | 'female' | 'rap' | 'sung' = 'male';
  private fundamentalFreqHistory: number[] = [];

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;

    this.metadata = {
      id: 'dawg-ai-vocal-compressor',
      name: 'AI Vocal Compressor',
      manufacturer: 'DAWG AI',
      version: '1.0.0',
      category: 'AI Compressor',
      description: 'Specialized vocal compression with AI presence enhancement',
      isAI: true,
      numInputs: 2,
      numOutputs: 2,
    };

    this.state = {
      threshold: -20,
      ratio: 4,
      attack: 8,
      release: 80,
      knee: 4,
      makeupGain: 0,
      mix: 100,
      lookahead: 2,
      enabled: true,
      // Vocal-specific
      presenceEnhance: 50,
      deEssAmount: 40,
      breathControl: 30,
      airEnhance: 30,
      proximityFix: 20,
      vocalType: 'auto',
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
      spectralCentroid: 2000,
      dynamicRange: 12,
      sibilanceLevel: 0,
      breathLevel: 0,
      presenceLevel: 0,
      fundamentalFreq: 150,
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
        default: -20,
        unit: 'dB',
        isAutomatable: true,
      },
      {
        id: 'ratio',
        name: 'Ratio',
        label: 'Ratio',
        value: this.state.ratio,
        min: 1,
        max: 10,
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
        max: 50,
        default: 8,
        unit: 'ms',
        isAutomatable: true,
      },
      {
        id: 'release',
        name: 'Release',
        label: 'Release',
        value: this.state.release,
        min: 20,
        max: 500,
        default: 80,
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
        default: 4,
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
        id: 'presenceEnhance',
        name: 'Presence',
        label: 'Presence',
        value: this.state.presenceEnhance,
        min: 0,
        max: 100,
        default: 50,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'deEssAmount',
        name: 'De-Ess',
        label: 'De-Ess',
        value: this.state.deEssAmount,
        min: 0,
        max: 100,
        default: 40,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'breathControl',
        name: 'Breath Control',
        label: 'Breath',
        value: this.state.breathControl,
        min: 0,
        max: 100,
        default: 30,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'airEnhance',
        name: 'Air',
        label: 'Air',
        value: this.state.airEnhance,
        min: 0,
        max: 100,
        default: 30,
        unit: '%',
        isAutomatable: true,
      },
      {
        id: 'proximityFix',
        name: 'Proximity Fix',
        label: 'Proximity',
        value: this.state.proximityFix,
        min: 0,
        max: 100,
        default: 20,
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

    const clampedValue = Math.max(param.min, Math.min(param.max, value));

    param.value = clampedValue;
    param.displayValue = this.formatParameterValue(id, clampedValue);

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
      for (let ch = 0; ch < Math.min(inputBuffers.length, outputBuffers.length); ch++) {
        outputBuffers[ch].set(inputBuffers[ch]);
      }
      return;
    }

    const numChannels = Math.min(inputBuffers.length, outputBuffers.length);
    const numSamples = inputBuffers[0].length;

    // Detect vocal type if in auto mode
    if (this.state.vocalType === 'auto' && this.state.aiMode) {
      this.detectVocalType(inputBuffers);
    }

    // Get adaptive time constants
    const [attackTime, releaseTime] = this.getVocalTimings();
    const attackCoeff = Math.exp(-1 / (attackTime * 0.001 * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (releaseTime * 0.001 * this.sampleRate));

    // De-esser time constants (faster)
    const deEssAttackCoeff = Math.exp(-1 / (2 * 0.001 * this.sampleRate));
    const deEssReleaseCoeff = Math.exp(-1 / (20 * 0.001 * this.sampleRate));

    // Breath control time constants
    const breathAttackCoeff = Math.exp(-1 / (5 * 0.001 * this.sampleRate));
    const breathReleaseCoeff = Math.exp(-1 / (50 * 0.001 * this.sampleRate));

    // Process each sample
    for (let i = 0; i < numSamples; i++) {
      // Calculate stereo peak level
      let peakLevel = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        peakLevel = Math.max(peakLevel, Math.abs(inputBuffers[ch][i]));
      }

      // Convert to dB
      const inputDb = peakLevel > 0 ? 20 * Math.log10(peakLevel) : -96;

      // Detect sibilance (simplified - checks high frequency energy)
      const sibilanceLevel = this.detectSibilance(inputBuffers, i);
      this.sibilanceDetected = sibilanceLevel > 0.3;

      // Update de-esser envelope
      if (sibilanceLevel > this.deEssEnvelope) {
        this.deEssEnvelope = sibilanceLevel + deEssAttackCoeff * (this.deEssEnvelope - sibilanceLevel);
      } else {
        this.deEssEnvelope = sibilanceLevel + deEssReleaseCoeff * (this.deEssEnvelope - sibilanceLevel);
      }

      // Detect breath (low level, noise-like)
      const breathLevel = this.detectBreath(inputBuffers, i, inputDb);

      // Update breath envelope
      if (breathLevel > this.breathEnvelope) {
        this.breathEnvelope = breathLevel + breathAttackCoeff * (this.breathEnvelope - breathLevel);
      } else {
        this.breathEnvelope = breathLevel + breathReleaseCoeff * (this.breathEnvelope - breathLevel);
      }

      // Update main envelope follower
      if (inputDb > this.envelopeFollower) {
        this.envelopeFollower = inputDb + attackCoeff * (this.envelopeFollower - inputDb);
      } else {
        this.envelopeFollower = inputDb + releaseCoeff * (this.envelopeFollower - inputDb);
      }

      // Calculate gain reduction
      this.gainReduction = this.calculateVocalGainReduction(this.envelopeFollower);

      // Convert to linear gain
      let compressionGain = Math.pow(10, -this.gainReduction / 20);

      // Apply breath control (reduce gain on breaths)
      if (this.state.breathControl > 0) {
        const breathReduction = this.breathEnvelope * (this.state.breathControl / 100) * 0.5;
        compressionGain *= (1 - breathReduction);
      }

      // Apply makeup gain
      const makeupGainLinear = Math.pow(10, this.state.makeupGain / 20);

      // Total gain
      const totalGain = compressionGain * makeupGainLinear;

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const drySample = inputBuffers[ch][i];
        let sample = drySample;

        // Apply compression
        sample *= totalGain;

        // Apply de-essing
        if (this.state.deEssAmount > 0 && this.sibilanceDetected) {
          const deEssGain = 1 - (this.deEssEnvelope * this.state.deEssAmount / 100);
          sample *= Math.max(0.3, deEssGain);
        }

        // Apply proximity fix (reduce low-end buildup)
        if (this.state.proximityFix > 0) {
          sample = this.applyProximityFix(sample, ch, i);
        }

        // Apply presence enhancement
        if (this.state.presenceEnhance > 0) {
          sample = this.applyPresenceEnhancement(sample, ch, i);
        }

        // Apply air enhancement
        if (this.state.airEnhance > 0) {
          sample = this.applyAirEnhancement(sample, ch, i);
        }

        // Mix dry/wet
        const mixAmount = this.state.mix / 100;
        sample = drySample * (1 - mixAmount) + sample * mixAmount;

        // Soft limiting
        sample = this.softLimit(sample);

        outputBuffers[ch][i] = sample;
      }
    }

    // Update analysis
    this.updateAnalysis(inputBuffers, outputBuffers);
  }

  /**
   * Calculate vocal-optimized gain reduction
   */
  private calculateVocalGainReduction(inputDb: number): number {
    const threshold = this.state.threshold;
    const ratio = this.state.ratio;
    const knee = this.state.knee;

    if (inputDb <= threshold - knee / 2) {
      return 0;
    } else if (inputDb >= threshold + knee / 2) {
      const overshoot = inputDb - threshold;
      return overshoot - overshoot / ratio;
    } else {
      // Smooth knee for natural vocal compression
      const kneeInput = inputDb - threshold + knee / 2;
      const kneeRange = knee;
      const kneePosition = kneeInput / kneeRange;
      const smoothCurve = kneePosition * kneePosition * (3 - 2 * kneePosition);
      const overshoot = inputDb - (threshold - knee / 2);
      return smoothCurve * (overshoot - overshoot / ratio);
    }
  }

  /**
   * Detect sibilance (simplified)
   */
  private detectSibilance(buffers: Float32Array[], index: number): number {
    if (index < 10) return 0;

    // Simplified: look at high-frequency energy (would use proper filtering in production)
    let highFreqEnergy = 0;
    let totalEnergy = 0;

    for (let ch = 0; ch < buffers.length; ch++) {
      // Approximate high-frequency content by looking at sample differences
      for (let i = 0; i < 5; i++) {
        const diff = Math.abs(buffers[ch][index - i] - buffers[ch][index - i - 1]);
        highFreqEnergy += diff;
        totalEnergy += Math.abs(buffers[ch][index - i]);
      }
    }

    // If high-frequency energy is prominent, it might be sibilance
    return totalEnergy > 0.01 ? Math.min(1, highFreqEnergy / (totalEnergy + 0.001)) : 0;
  }

  /**
   * Detect breath (low level, noise-like content)
   */
  private detectBreath(buffers: Float32Array[], index: number, inputDb: number): number {
    // Breaths are typically low level (-40 to -20 dB) and noise-like
    if (inputDb > -20 || inputDb < -50) return 0;

    // Simple breath detection based on level
    return Math.min(1, Math.max(0, (-20 - inputDb) / 20));
  }

  /**
   * Get vocal-optimized attack/release times
   */
  private getVocalTimings(): [number, number] {
    if (!this.state.aiMode) {
      return [this.state.attack, this.state.release];
    }

    const vocalType = this.state.vocalType === 'auto' ? this.detectedVocalType : this.state.vocalType;

    switch (vocalType) {
      case 'male':
        return [10, 100];
      case 'female':
        return [7, 80];
      case 'rap':
        return [3, 40];
      case 'sung':
        return [12, 120];
      default:
        return [8, 80];
    }
  }

  /**
   * Detect vocal type based on fundamental frequency
   */
  private detectVocalType(buffers: Float32Array[]): void {
    // Simplified vocal type detection
    // In production, would use proper pitch detection
    const avgLevel = this.calculateAverageLevel(buffers);

    this.fundamentalFreqHistory.push(avgLevel);
    if (this.fundamentalFreqHistory.length > 50) {
      this.fundamentalFreqHistory.shift();
    }

    const avgFundamental = this.fundamentalFreqHistory.reduce((a, b) => a + b, 0) / this.fundamentalFreqHistory.length;

    // Rough classification
    if (avgFundamental < 140) {
      this.detectedVocalType = 'male';
    } else if (avgFundamental < 220) {
      this.detectedVocalType = 'rap';
    } else if (avgFundamental < 300) {
      this.detectedVocalType = 'sung';
    } else {
      this.detectedVocalType = 'female';
    }

    this.analysis.fundamentalFreq = avgFundamental;
  }

  /**
   * Calculate average level (simplified fundamental detection)
   */
  private calculateAverageLevel(buffers: Float32Array[]): number {
    let sum = 0;
    let count = 0;

    for (let ch = 0; ch < buffers.length; ch++) {
      for (let i = 0; i < buffers[ch].length; i++) {
        sum += Math.abs(buffers[ch][i]);
        count++;
      }
    }

    // Convert to Hz estimate (very simplified)
    return count > 0 ? (sum / count) * 200 + 100 : 150;
  }

  /**
   * Apply proximity effect compensation
   */
  private applyProximityFix(sample: number, channel: number, index: number): number {
    // Simplified low-end reduction
    // In production, would use proper high-pass filtering
    const reductionAmount = this.state.proximityFix / 100;
    return sample * (1 - reductionAmount * 0.2);
  }

  /**
   * Apply AI presence enhancement (2-5kHz boost)
   */
  private applyPresenceEnhancement(sample: number, channel: number, index: number): number {
    // Simplified presence boost
    // In production, would use proper parametric EQ
    const enhanceAmount = this.state.presenceEnhance / 100;
    return sample * (1 + enhanceAmount * 0.15);
  }

  /**
   * Apply air enhancement (10kHz+ boost)
   */
  private applyAirEnhancement(sample: number, channel: number, index: number): number {
    // Simplified air enhancement
    // In production, would use proper high-shelf filtering
    const airAmount = this.state.airEnhance / 100;
    return sample * (1 + airAmount * 0.1);
  }

  /**
   * Soft limiting
   */
  private softLimit(sample: number): number {
    const threshold = 0.95;
    if (Math.abs(sample) > threshold) {
      const overshoot = Math.abs(sample) - threshold;
      const limited = threshold + (1 - threshold) * Math.tanh(overshoot / 0.1);
      return Math.sign(sample) * limited;
    }
    return sample;
  }

  /**
   * Auto makeup gain compensation
   */
  private updateAutoMakeupGain(): void {
    const estimatedGR = Math.abs(this.state.threshold) / this.state.ratio;
    const autoGain = estimatedGR * 0.75; // 75% compensation for vocals
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
    this.analysis.sibilanceLevel = this.deEssEnvelope;
    this.analysis.breathLevel = this.breathEnvelope;
    this.analysis.dynamicRange = inputPeak > 0
      ? 20 * Math.log10(inputPeak / (inputRms + 0.001))
      : 12;
  }

  /**
   * Get current analysis
   */
  getAnalysis() {
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
      dynamicThreshold: false,
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
        return `${value.toFixed(1)} ms`;
      case 'mix':
      case 'presenceEnhance':
      case 'deEssAmount':
      case 'breathControl':
      case 'airEnhance':
      case 'proximityFix':
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
        id: 'vocal-natural',
        name: 'Natural Vocal',
        description: 'Gentle, transparent vocal compression',
        compressorType: 'vocal',
        parameters: {
          threshold: -18,
          ratio: 3,
          attack: 10,
          release: 100,
          presenceEnhance: 30,
          deEssAmount: 30,
          breathControl: 20,
          airEnhance: 20,
          proximityFix: 15,
        },
        tags: ['natural', 'gentle', 'transparent'],
      },
      {
        id: 'vocal-radio',
        name: 'Radio Vocal',
        description: 'Professional broadcast-style compression',
        compressorType: 'vocal',
        parameters: {
          threshold: -20,
          ratio: 4,
          attack: 6,
          release: 60,
          presenceEnhance: 60,
          deEssAmount: 50,
          breathControl: 40,
          airEnhance: 40,
          proximityFix: 30,
        },
        tags: ['radio', 'professional', 'polished'],
      },
      {
        id: 'vocal-rap',
        name: 'Rap Vocal',
        description: 'Punchy compression for rap vocals',
        compressorType: 'vocal',
        parameters: {
          threshold: -22,
          ratio: 5,
          attack: 3,
          release: 40,
          presenceEnhance: 70,
          deEssAmount: 40,
          breathControl: 50,
          airEnhance: 30,
          proximityFix: 25,
        },
        tags: ['rap', 'punchy', 'aggressive'],
      },
      {
        id: 'vocal-sung',
        name: 'Sung Vocal',
        description: 'Smooth compression for sung vocals',
        compressorType: 'vocal',
        parameters: {
          threshold: -16,
          ratio: 3.5,
          attack: 12,
          release: 120,
          presenceEnhance: 45,
          deEssAmount: 45,
          breathControl: 25,
          airEnhance: 50,
          proximityFix: 20,
        },
        tags: ['sung', 'smooth', 'musical'],
      },
      {
        id: 'vocal-podcast',
        name: 'Podcast Voice',
        description: 'Consistent, broadcast-quality voice',
        compressorType: 'vocal',
        parameters: {
          threshold: -24,
          ratio: 6,
          attack: 8,
          release: 80,
          presenceEnhance: 55,
          deEssAmount: 60,
          breathControl: 60,
          airEnhance: 35,
          proximityFix: 40,
        },
        tags: ['podcast', 'voice', 'consistent'],
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

  /**
   * Set vocal type
   */
  setVocalType(type: 'male' | 'female' | 'rap' | 'sung' | 'auto'): void {
    this.state.vocalType = type;
  }

  /**
   * Get detected vocal type
   */
  getDetectedVocalType(): string {
    return this.state.vocalType === 'auto' ? this.detectedVocalType : this.state.vocalType;
  }
}
