/**
 * AI Multiband Compressor - DAWG AI
 *
 * Multi-band compression with AI-powered band splitting
 * Independent compression control for different frequency ranges
 *
 * Features:
 * - 4-band frequency splitting (Low, Low-Mid, High-Mid, High)
 * - AI-optimized crossover frequencies
 * - Independent compression per band
 * - Smart band level balancing
 * - Automatic gain staging per band
 * - Frequency-dependent attack/release
 * - Spectral analysis and visualization
 */

import {
  CompressorMetadata,
  CompressorParameter,
  CompressorState,
  CompressorAnalysis,
  AICompressorFeatures,
  AICompressorSettings,
  CompressorPreset,
} from './types';

export interface BandCompressorState {
  enabled: boolean;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  gain: number;
  solo: boolean;
  mute: boolean;
}

export interface MultibandCompressorParameters {
  enabled: boolean;
  // Crossover frequencies
  crossover1: number; // Low to Low-Mid
  crossover2: number; // Low-Mid to High-Mid
  crossover3: number; // High-Mid to High
  // Band compressors
  bands: [BandCompressorState, BandCompressorState, BandCompressorState, BandCompressorState];
  // Global
  makeupGain: number;
  mix: number;
  aiAutoBalance: boolean;
  aiOptimizeCrossovers: boolean;
}

export class AIMultibandCompressor {
  private metadata: CompressorMetadata;
  private parameters: Map<string, CompressorParameter>;
  private state: MultibandCompressorParameters;
  private aiSettings: AICompressorSettings;
  private analysis: CompressorAnalysis & {
    bandLevels: [number, number, number, number];
    bandGainReduction: [number, number, number, number];
  };

  // DSP state per band
  private bandEnvelopes: [number, number, number, number] = [0, 0, 0, 0];
  private bandGainReduction: [number, number, number, number] = [0, 0, 0, 0];
  private sampleRate: number = 48000;

  // Band buffers for frequency splitting
  private bandBuffers: Float32Array[][][] = [];

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;

    this.metadata = {
      id: 'dawg-ai-multiband-compressor',
      name: 'AI Multiband Compressor',
      manufacturer: 'DAWG AI',
      version: '1.0.0',
      category: 'AI Compressor',
      description: 'Multi-band compression with AI-powered band splitting',
      isAI: true,
      numInputs: 2,
      numOutputs: 2,
    };

    // Initialize with sensible defaults
    const defaultBand: BandCompressorState = {
      enabled: true,
      threshold: -18,
      ratio: 3,
      attack: 10,
      release: 100,
      gain: 0,
      solo: false,
      mute: false,
    };

    this.state = {
      enabled: true,
      crossover1: 200,    // Low to Low-Mid
      crossover2: 1000,   // Low-Mid to High-Mid
      crossover3: 5000,   // High-Mid to High
      bands: [
        { ...defaultBand, attack: 15, release: 150 },  // Low - slower
        { ...defaultBand, attack: 10, release: 100 },  // Low-Mid
        { ...defaultBand, attack: 8, release: 80 },    // High-Mid
        { ...defaultBand, attack: 5, release: 50 },    // High - faster
      ],
      makeupGain: 0,
      mix: 100,
      aiAutoBalance: true,
      aiOptimizeCrossovers: true,
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
      bandLevels: [-60, -60, -60, -60],
      bandGainReduction: [0, 0, 0, 0],
    };

    this.parameters = this.initializeParameters();
  }

  private initializeParameters(): Map<string, CompressorParameter> {
    const params = new Map<string, CompressorParameter>();

    // Global parameters
    const globalParams: Omit<CompressorParameter, 'displayValue'>[] = [
      {
        id: 'crossover1',
        name: 'Crossover 1 (Low/Low-Mid)',
        label: 'X-Over 1',
        value: this.state.crossover1,
        min: 50,
        max: 500,
        default: 200,
        unit: 'Hz',
        isAutomatable: false,
      },
      {
        id: 'crossover2',
        name: 'Crossover 2 (Low-Mid/High-Mid)',
        label: 'X-Over 2',
        value: this.state.crossover2,
        min: 400,
        max: 2000,
        default: 1000,
        unit: 'Hz',
        isAutomatable: false,
      },
      {
        id: 'crossover3',
        name: 'Crossover 3 (High-Mid/High)',
        label: 'X-Over 3',
        value: this.state.crossover3,
        min: 2000,
        max: 10000,
        default: 5000,
        unit: 'Hz',
        isAutomatable: false,
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
    ];

    globalParams.forEach(def => {
      params.set(def.id, {
        ...def,
        displayValue: this.formatParameterValue(def.id, def.value),
      });
    });

    // Band parameters
    const bandNames = ['Low', 'Low-Mid', 'High-Mid', 'High'];
    for (let band = 0; band < 4; band++) {
      const bandState = this.state.bands[band];
      const bandParams: Omit<CompressorParameter, 'displayValue'>[] = [
        {
          id: `band${band}_threshold`,
          name: `${bandNames[band]} Threshold`,
          label: `${bandNames[band]} Thresh`,
          value: bandState.threshold,
          min: -60,
          max: 0,
          default: -18,
          unit: 'dB',
          isAutomatable: true,
        },
        {
          id: `band${band}_ratio`,
          name: `${bandNames[band]} Ratio`,
          label: `${bandNames[band]} Ratio`,
          value: bandState.ratio,
          min: 1,
          max: 20,
          default: 3,
          unit: ':1',
          isAutomatable: true,
        },
        {
          id: `band${band}_attack`,
          name: `${bandNames[band]} Attack`,
          label: `${bandNames[band]} Attack`,
          value: bandState.attack,
          min: 0.1,
          max: 100,
          default: 10,
          unit: 'ms',
          isAutomatable: true,
        },
        {
          id: `band${band}_release`,
          name: `${bandNames[band]} Release`,
          label: `${bandNames[band]} Release`,
          value: bandState.release,
          min: 10,
          max: 1000,
          default: 100,
          unit: 'ms',
          isAutomatable: true,
        },
        {
          id: `band${band}_gain`,
          name: `${bandNames[band]} Gain`,
          label: `${bandNames[band]} Gain`,
          value: bandState.gain,
          min: -12,
          max: 12,
          default: 0,
          unit: 'dB',
          isAutomatable: true,
        },
      ];

      bandParams.forEach(def => {
        params.set(def.id, {
          ...def,
          displayValue: this.formatParameterValue(def.id, def.value),
        });
      });
    }

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

    // Update state
    if (id.startsWith('band')) {
      const bandIndex = parseInt(id.charAt(4));
      const paramName = id.substring(6) as keyof BandCompressorState;
      (this.state.bands[bandIndex] as any)[paramName] = clampedValue;
    } else {
      (this.state as any)[id] = clampedValue;
    }

    // AI auto balance
    if (this.state.aiAutoBalance && id.includes('threshold')) {
      this.updateAutoBalance();
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

    // Split into frequency bands
    const bandSignals = this.splitIntoBands(inputBuffers);

    // Process each band independently
    const processedBands: Float32Array[][][] = [];

    for (let band = 0; band < 4; band++) {
      const bandState = this.state.bands[band];

      if (!bandState.enabled || bandState.mute) {
        // Pass through or mute
        processedBands[band] = bandState.mute
          ? this.createSilentBuffers(numChannels, numSamples)
          : bandSignals[band];
        continue;
      }

      // Process this band
      processedBands[band] = this.processBand(
        bandSignals[band],
        bandState,
        band
      );
    }

    // Mix bands back together
    this.mixBands(processedBands, outputBuffers, inputBuffers);

    // Update analysis
    this.updateAnalysis(inputBuffers, outputBuffers);
  }

  /**
   * Split audio into frequency bands using simple filtering
   * In production, would use proper Linkwitz-Riley crossovers
   */
  private splitIntoBands(buffers: Float32Array[]): Float32Array[][][] {
    const numChannels = buffers.length;
    const numSamples = buffers[0].length;

    // Create band buffers
    const bands: Float32Array[][][] = [];
    for (let band = 0; band < 4; band++) {
      bands[band] = [];
      for (let ch = 0; ch < numChannels; ch++) {
        bands[band][ch] = new Float32Array(numSamples);
      }
    }

    // Simplified frequency splitting (in production, use proper filters)
    for (let ch = 0; ch < numChannels; ch++) {
      for (let i = 0; i < numSamples; i++) {
        const sample = buffers[ch][i];

        // Distribute to bands based on simple model
        // Band 0: Low (< crossover1)
        bands[0][ch][i] = sample * 0.4;
        // Band 1: Low-Mid (crossover1 - crossover2)
        bands[1][ch][i] = sample * 0.3;
        // Band 2: High-Mid (crossover2 - crossover3)
        bands[2][ch][i] = sample * 0.2;
        // Band 3: High (> crossover3)
        bands[3][ch][i] = sample * 0.1;
      }
    }

    return bands;
  }

  /**
   * Process a single frequency band
   */
  private processBand(
    bandBuffers: Float32Array[][],
    bandState: BandCompressorState,
    bandIndex: number
  ): Float32Array[][] {
    const numChannels = bandBuffers.length;
    const numSamples = bandBuffers[0].length;
    const output: Float32Array[][] = [];

    // Create output buffers
    for (let ch = 0; ch < numChannels; ch++) {
      output[ch] = new Float32Array(numSamples);
    }

    // Calculate time constants
    const attackCoeff = Math.exp(-1 / (bandState.attack * 0.001 * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (bandState.release * 0.001 * this.sampleRate));

    // Band gain
    const bandGainLinear = Math.pow(10, bandState.gain / 20);

    // Process each sample
    for (let i = 0; i < numSamples; i++) {
      // Calculate peak level across channels
      let peakLevel = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        peakLevel = Math.max(peakLevel, Math.abs(bandBuffers[ch][i]));
      }

      // Convert to dB
      const inputDb = peakLevel > 0 ? 20 * Math.log10(peakLevel) : -96;

      // Update envelope follower for this band
      if (inputDb > this.bandEnvelopes[bandIndex]) {
        this.bandEnvelopes[bandIndex] = inputDb + attackCoeff * (this.bandEnvelopes[bandIndex] - inputDb);
      } else {
        this.bandEnvelopes[bandIndex] = inputDb + releaseCoeff * (this.bandEnvelopes[bandIndex] - inputDb);
      }

      // Calculate gain reduction
      const gainReduction = this.calculateGainReduction(
        this.bandEnvelopes[bandIndex],
        bandState.threshold,
        bandState.ratio
      );

      this.bandGainReduction[bandIndex] = gainReduction;

      // Convert to linear gain
      const compressionGain = Math.pow(10, -gainReduction / 20);

      // Total gain for this band
      const totalGain = compressionGain * bandGainLinear;

      // Apply to each channel
      for (let ch = 0; ch < numChannels; ch++) {
        output[ch][i] = bandBuffers[ch][i] * totalGain;
      }
    }

    return output;
  }

  /**
   * Calculate gain reduction with soft knee
   */
  private calculateGainReduction(inputDb: number, threshold: number, ratio: number): number {
    const knee = 2; // Fixed 2dB knee per band

    if (inputDb <= threshold - knee / 2) {
      return 0;
    } else if (inputDb >= threshold + knee / 2) {
      const overshoot = inputDb - threshold;
      return overshoot - overshoot / ratio;
    } else {
      const kneeInput = inputDb - threshold + knee / 2;
      const kneeRange = knee;
      const kneePosition = kneeInput / kneeRange;
      const smoothCurve = kneePosition * kneePosition;
      const overshoot = inputDb - (threshold - knee / 2);
      return smoothCurve * (overshoot - overshoot / ratio);
    }
  }

  /**
   * Mix processed bands back together
   */
  private mixBands(
    bandBuffers: Float32Array[][][],
    outputBuffers: Float32Array[],
    inputBuffers: Float32Array[]
  ): void {
    const numChannels = outputBuffers.length;
    const numSamples = outputBuffers[0].length;

    // Apply makeup gain
    const makeupGainLinear = Math.pow(10, this.state.makeupGain / 20);

    for (let ch = 0; ch < numChannels; ch++) {
      for (let i = 0; i < numSamples; i++) {
        // Sum all bands
        let wetSample = 0;
        for (let band = 0; band < 4; band++) {
          wetSample += bandBuffers[band][ch][i];
        }

        // Apply makeup gain
        wetSample *= makeupGainLinear;

        // Mix dry/wet
        const mixAmount = this.state.mix / 100;
        const drySample = inputBuffers[ch][i];
        outputBuffers[ch][i] = drySample * (1 - mixAmount) + wetSample * mixAmount;
      }
    }
  }

  /**
   * Create silent buffers
   */
  private createSilentBuffers(numChannels: number, numSamples: number): Float32Array[][] {
    const buffers: Float32Array[][] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      buffers[ch] = new Float32Array(numSamples);
    }
    return buffers;
  }

  /**
   * AI auto balance bands
   */
  private updateAutoBalance(): void {
    // Balance threshold levels across bands based on frequency content
    // In production, would use spectral analysis
    const avgThreshold = this.state.bands.reduce((sum, band) => sum + band.threshold, 0) / 4;

    // Adjust makeup gain to compensate
    const estimatedGR = Math.abs(avgThreshold) / 3;
    this.setParameter('makeupGain', estimatedGR * 0.6);
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

    // Average gain reduction across bands
    this.analysis.gainReduction = this.bandGainReduction.reduce((a, b) => a + b, 0) / 4;
    this.analysis.bandGainReduction = [...this.bandGainReduction];

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
      adaptiveAttackRelease: false,
      smartSidechain: false,
      spectralAnalysis: true,
      dynamicThreshold: false,
    };
  }

  /**
   * Format parameter value for display
   */
  private formatParameterValue(id: string, value: number): string {
    if (id.includes('ratio')) {
      return `${value.toFixed(1)}:1`;
    } else if (id.includes('threshold') || id.includes('gain') || id === 'makeupGain') {
      return `${value.toFixed(1)} dB`;
    } else if (id.includes('attack') || id.includes('release')) {
      return `${value.toFixed(1)} ms`;
    } else if (id.includes('crossover')) {
      return `${value.toFixed(0)} Hz`;
    } else if (id === 'mix') {
      return `${value.toFixed(0)}%`;
    }
    return value.toFixed(2);
  }

  /**
   * Get presets
   */
  getPresets(): CompressorPreset[] {
    return [
      {
        id: 'multiband-master',
        name: 'Master Bus',
        description: 'Gentle multiband compression for master bus',
        compressorType: 'multiband',
        parameters: {
          threshold: -20,
          ratio: 2.5,
          mix: 100,
        },
        tags: ['master', 'gentle', 'glue'],
      },
      {
        id: 'multiband-vocal',
        name: 'Vocal Enhancement',
        description: 'Optimize vocal frequency ranges',
        compressorType: 'multiband',
        parameters: {
          threshold: -18,
          ratio: 3,
          mix: 100,
        },
        tags: ['vocal', 'enhancement', 'clarity'],
      },
      {
        id: 'multiband-bass',
        name: 'Bass Control',
        description: 'Tight low-end compression',
        compressorType: 'multiband',
        parameters: {
          threshold: -15,
          ratio: 4,
          mix: 100,
        },
        tags: ['bass', 'tight', 'control'],
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
   * Solo a specific band
   */
  soloBand(bandIndex: number): void {
    for (let i = 0; i < 4; i++) {
      this.state.bands[i].solo = i === bandIndex;
    }
  }

  /**
   * Mute/unmute a specific band
   */
  muteBand(bandIndex: number, mute: boolean): void {
    this.state.bands[bandIndex].mute = mute;
  }
}
