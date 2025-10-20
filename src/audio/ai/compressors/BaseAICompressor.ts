/**
 * Base AI Compressor - DAWG AI
 *
 * Abstract base class for all AI compressor implementations
 * Provides shared functionality and enforces consistent interface
 *
 * Features:
 * - Common parameter management
 * - Shared analysis and metering
 * - Preset system
 * - Auto makeup gain
 * - Enable/disable functionality
 * - Consistent logging
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
import { logger } from '../../../utils/logger';

/**
 * Abstract base class for AI compressor plugins
 */
export abstract class BaseAICompressor<TState extends CompressorState = CompressorState> {
  protected metadata: CompressorMetadata;
  protected parameters: Map<string, CompressorParameter>;
  protected state: TState;
  protected aiSettings: AICompressorSettings;
  protected analysis: CompressorAnalysis;

  // DSP state
  protected envelopeFollower: number = 0;
  protected gainReduction: number = 0;
  protected sampleRate: number;

  constructor(
    metadata: CompressorMetadata,
    initialState: TState,
    aiSettings: AICompressorSettings,
    sampleRate: number = 48000
  ) {
    this.metadata = metadata;
    this.state = initialState;
    this.aiSettings = aiSettings;
    this.sampleRate = sampleRate;

    // Initialize default analysis
    this.analysis = {
      inputLevel: -60,
      outputLevel: -60,
      gainReduction: 0,
      rmsLevel: 0,
      peakLevel: 0,
      spectralCentroid: 2000,
      dynamicRange: 12,
    };

    // Initialize parameters (to be populated by subclass)
    this.parameters = new Map<string, CompressorParameter>();

    logger.debug(`Initialized ${this.metadata.name} at ${sampleRate}Hz`, {
      compressor: this.metadata.id,
      sampleRate,
    });
  }

  /**
   * Initialize parameters - to be implemented by subclass
   */
  protected abstract initializeParameters(): Map<string, CompressorParameter>;

  /**
   * Process audio buffer - to be implemented by subclass
   */
  abstract process(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void;

  /**
   * Get AI features - to be implemented by subclass
   */
  abstract getAIFeatures(): AICompressorFeatures;

  /**
   * Get presets - to be implemented by subclass
   */
  abstract getPresets(): CompressorPreset[];

  /**
   * Format parameter value for display - to be implemented by subclass
   */
  protected abstract formatParameterValue(id: string, value: number): string;

  /**
   * Update auto makeup gain - to be implemented by subclass
   */
  protected abstract updateAutoMakeupGain(): void;

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
   * Set parameter value with validation and clamping
   */
  setParameter(id: string, value: number): void {
    const param = this.parameters.get(id);
    if (!param) {
      logger.warn(`Parameter ${id} not found in ${this.metadata.name}`, {
        compressor: this.metadata.id,
        parameterId: id,
      });
      return;
    }

    // Clamp value to valid range
    const clampedValue = Math.max(param.min, Math.min(param.max, value));

    // Update parameter
    param.value = clampedValue;
    param.displayValue = this.formatParameterValue(id, clampedValue);

    // Update state
    (this.state as any)[id] = clampedValue;

    logger.debug(`Parameter updated: ${id} = ${clampedValue}`, {
      compressor: this.metadata.id,
      parameterId: id,
      value: clampedValue,
      displayValue: param.displayValue,
    });

    // Trigger any parameter-specific callbacks
    this.onParameterChanged(id, clampedValue);
  }

  /**
   * Hook for parameter change notifications - can be overridden by subclass
   */
  protected onParameterChanged(id: string, value: number): void {
    // Default implementation - can be overridden
  }

  /**
   * Get current analysis
   */
  getAnalysis(): CompressorAnalysis {
    return { ...this.analysis };
  }

  /**
   * Load preset
   */
  loadPreset(preset: CompressorPreset): void {
    logger.info(`Loading preset: ${preset.name}`, {
      compressor: this.metadata.id,
      presetId: preset.id,
      presetName: preset.name,
    });

    Object.entries(preset.parameters).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setParameter(key, value);
      }
    });

    // Update AI settings if provided
    if (preset.aiSettings) {
      this.aiSettings = { ...this.aiSettings, ...preset.aiSettings };
      logger.debug(`Updated AI settings from preset`, {
        compressor: this.metadata.id,
        aiSettings: this.aiSettings,
      });
    }
  }

  /**
   * Enable/disable plugin
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    logger.info(`Compressor ${enabled ? 'enabled' : 'disabled'}`, {
      compressor: this.metadata.id,
      enabled,
    });
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Update analysis metrics - shared implementation
   */
  protected updateAnalysis(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
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
   * Calculate gain reduction with soft knee - shared implementation
   */
  protected calculateGainReduction(
    inputDb: number,
    threshold: number,
    ratio: number,
    knee: number
  ): number {
    if (inputDb <= threshold - knee / 2) {
      return 0;
    } else if (inputDb >= threshold + knee / 2) {
      const overshoot = inputDb - threshold;
      return overshoot - overshoot / ratio;
    } else {
      // Smooth knee curve
      const kneeInput = inputDb - threshold + knee / 2;
      const kneeRange = knee;
      const kneePosition = kneeInput / kneeRange;
      const smoothCurve = kneePosition * kneePosition * (3 - 2 * kneePosition);
      const overshoot = inputDb - (threshold - knee / 2);
      return smoothCurve * (overshoot - overshoot / ratio);
    }
  }

  /**
   * Soft limiting to prevent clipping - shared implementation
   */
  protected softLimit(sample: number, threshold: number = 0.95): number {
    if (Math.abs(sample) > threshold) {
      const overshoot = Math.abs(sample) - threshold;
      const limited = threshold + (1 - threshold) * Math.tanh(overshoot / 0.1);
      return Math.sign(sample) * limited;
    }
    return sample;
  }

  /**
   * Bypass processing - copy input to output
   */
  protected bypassProcess(inputBuffers: Float32Array[], outputBuffers: Float32Array[]): void {
    for (let ch = 0; ch < Math.min(inputBuffers.length, outputBuffers.length); ch++) {
      outputBuffers[ch].set(inputBuffers[ch]);
    }
  }

  /**
   * Create parameter definition helper
   */
  protected createParameter(definition: Omit<CompressorParameter, 'displayValue'>): CompressorParameter {
    return {
      ...definition,
      displayValue: this.formatParameterValue(definition.id, definition.value),
    };
  }

  /**
   * Add parameter to the parameters map
   */
  protected addParameter(definition: Omit<CompressorParameter, 'displayValue'>): void {
    const param = this.createParameter(definition);
    this.parameters.set(param.id, param);
  }

  /**
   * Get sample rate
   */
  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Get current state (for serialization)
   */
  getState(): TState {
    return { ...this.state };
  }

  /**
   * Set state (for deserialization)
   */
  setState(state: Partial<TState>): void {
    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined && key in this.state) {
        const param = this.parameters.get(key);
        if (param && typeof value === 'number') {
          this.setParameter(key, value);
        } else {
          (this.state as any)[key] = value;
        }
      }
    });

    logger.info(`State restored`, {
      compressor: this.metadata.id,
      stateKeys: Object.keys(state),
    });
  }
}
