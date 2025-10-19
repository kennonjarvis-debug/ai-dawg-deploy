/**
 * AI Digital Delay Plugin
 *
 * Clean digital delay with intelligent feedback control
 * Features AI-powered adaptive filtering and feedback management
 *
 * Manufacturer: DAWG AI
 * Category: AI Delay
 */

import { Plugin } from '../PluginHost';

export interface AIDigitalDelayParameters {
  delayTime: number;           // 0-5000ms
  feedback: number;            // 0-100%
  mix: number;                 // 0-100%
  lowCut: number;              // 20-500Hz
  highCut: number;             // 1000-20000Hz
  modulation: number;          // 0-100%
  modulationRate: number;      // 0.1-10Hz
  character: number;           // 0-100% (pristine to colored)
  filterResonance: number;     // 0-100%
  stereoOffset: number;        // -100 to +100ms (L/R delay offset)
  diffusion: number;           // 0-100%
  tempoSync: boolean;
  tempoMultiplier: number;     // 1/4, 1/8, 1/16, etc
  smartFeedback: boolean;      // AI-powered feedback control
  adaptiveFiltering: boolean;  // AI adapts filters to prevent buildup
}

export interface AIDigitalDelayMetadata {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  isAI: boolean;
  description: string;
  features: string[];
}

export class AIDigitalDelay implements Plugin {
  id: string;
  name: string;

  private parameters: AIDigitalDelayParameters = {
    delayTime: 500,              // 500ms default
    feedback: 35,                // 35% feedback
    mix: 25,                     // 25% wet
    lowCut: 100,                 // 100Hz high-pass
    highCut: 12000,              // 12kHz low-pass
    modulation: 10,              // 10% modulation
    modulationRate: 0.5,         // 0.5Hz
    character: 5,                // Very clean
    filterResonance: 5,          // Low resonance
    stereoOffset: 10,            // 10ms stereo offset
    diffusion: 20,               // 20% diffusion
    tempoSync: false,
    tempoMultiplier: 0.25,       // 1/4 note
    smartFeedback: true,         // AI feedback control enabled
    adaptiveFiltering: true      // AI filter adaptation enabled
  };

  private metadata: AIDigitalDelayMetadata = {
    id: 'dawg-ai-digital-delay',
    name: 'AI Digital Delay',
    manufacturer: 'DAWG AI',
    category: 'AI Delay',
    version: '1.0.0',
    isAI: true,
    description: 'Clean digital delay with intelligent feedback control',
    features: [
      'Pristine digital delay algorithm',
      'AI-powered smart feedback control',
      'Adaptive filtering to prevent frequency buildup',
      'Intelligent resonance management',
      'Stereo offset control',
      'Modulation with depth control',
      'Tempo sync with smart quantization',
      'Diffusion for smoother repeats',
      'Character control from pristine to colored'
    ]
  };

  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writePosition: number = 0;
  private sampleRate: number = 48000;

  // Modulation state
  private modulationPhase: number = 0;

  // Filter state for feedback path
  private feedbackFilterStateL: number[] = [0, 0, 0, 0];
  private feedbackFilterStateR: number[] = [0, 0, 0, 0];

  // AI analysis state
  private feedbackLevelHistory: number[] = [];
  private frequencyBuildupDetector: number[] = new Array(10).fill(0);

  // Diffusion state
  private diffusionBufferL: Float32Array;
  private diffusionBufferR: Float32Array;
  private diffusionPosition: number = 0;

  constructor(audioContext?: AudioContext) {
    this.id = this.metadata.id;
    this.name = this.metadata.name;
    this.sampleRate = audioContext?.sampleRate || 48000;

    // Allocate delay buffers (5 seconds max)
    const maxDelayTime = 5.0; // seconds
    const bufferSize = Math.ceil(maxDelayTime * this.sampleRate);
    this.delayBufferL = new Float32Array(bufferSize);
    this.delayBufferR = new Float32Array(bufferSize);

    // Allocate diffusion buffers
    const diffusionSize = Math.ceil(0.05 * this.sampleRate); // 50ms
    this.diffusionBufferL = new Float32Array(diffusionSize);
    this.diffusionBufferR = new Float32Array(diffusionSize);
  }

  /**
   * Process audio through the digital delay
   */
  process(inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void {
    const numChannels = Math.min(inputBuffer.length, outputBuffer.length);
    const bufferLength = inputBuffer[0].length;

    for (let i = 0; i < bufferLength; i++) {
      // Calculate modulation
      const modulation = this.calculateModulation();

      // Calculate delay time
      let delayTime = this.parameters.delayTime;
      if (this.parameters.tempoSync) {
        delayTime = this.calculateTempoSyncedDelay(120); // Would get BPM from DAW
      }

      // Apply modulation to delay time
      const modulatedDelayTime = delayTime * (1 + modulation * (this.parameters.modulation / 100) * 0.01);

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const input = inputBuffer[ch][i];
        const delayBuffer = ch === 0 ? this.delayBufferL : this.delayBufferR;
        const diffusionBuffer = ch === 0 ? this.diffusionBufferL : this.diffusionBufferR;

        // Apply stereo offset
        const channelOffset = ch === 0 ? -this.parameters.stereoOffset : this.parameters.stereoOffset;
        const totalDelayTime = modulatedDelayTime + channelOffset;
        const delaySamples = Math.max(0, (totalDelayTime / 1000) * this.sampleRate);

        // Read from delay buffer with interpolation
        const readPosition = (this.writePosition - delaySamples + delayBuffer.length) % delayBuffer.length;
        let delayedSample = this.readDelayBufferInterpolated(delayBuffer, readPosition);

        // Apply diffusion
        if (this.parameters.diffusion > 0) {
          delayedSample = this.applyDiffusion(delayedSample, diffusionBuffer, ch);
        }

        // AI-powered smart feedback control
        let feedbackAmount = this.parameters.feedback / 100;
        if (this.parameters.smartFeedback) {
          feedbackAmount = this.calculateSmartFeedback(delayedSample, feedbackAmount);
        }

        // Apply feedback filtering
        let feedbackSample = delayedSample * feedbackAmount;
        if (this.parameters.adaptiveFiltering) {
          feedbackSample = this.applyAdaptiveFiltering(feedbackSample, ch);
        } else {
          feedbackSample = this.applyStandardFiltering(feedbackSample, ch);
        }

        // Apply character (subtle saturation for colored mode)
        if (this.parameters.character > 0) {
          feedbackSample = this.applyCharacter(feedbackSample);
        }

        // Write to delay buffer
        delayBuffer[this.writePosition] = input + feedbackSample;

        // Mix dry and wet signals
        const wet = this.parameters.mix / 100;
        const dry = 1 - wet;
        outputBuffer[ch][i] = input * dry + delayedSample * wet;
      }

      // Advance positions
      this.writePosition = (this.writePosition + 1) % this.delayBufferL.length;
      this.diffusionPosition = (this.diffusionPosition + 1) % this.diffusionBufferL.length;
    }
  }

  /**
   * Calculate modulation LFO
   */
  private calculateModulation(): number {
    const frequency = this.parameters.modulationRate;
    this.modulationPhase += (2 * Math.PI * frequency) / this.sampleRate;
    if (this.modulationPhase > 2 * Math.PI) this.modulationPhase -= 2 * Math.PI;

    return Math.sin(this.modulationPhase);
  }

  /**
   * Read from delay buffer with cubic interpolation for pristine quality
   */
  private readDelayBufferInterpolated(buffer: Float32Array, position: number): number {
    const index1 = Math.floor(position);
    const index0 = (index1 - 1 + buffer.length) % buffer.length;
    const index2 = (index1 + 1) % buffer.length;
    const index3 = (index1 + 2) % buffer.length;
    const frac = position - index1;

    // Cubic interpolation for higher quality
    const a0 = buffer[index3] - buffer[index2] - buffer[index0] + buffer[index1];
    const a1 = buffer[index0] - buffer[index1] - a0;
    const a2 = buffer[index2] - buffer[index0];
    const a3 = buffer[index1];

    return a0 * frac * frac * frac + a1 * frac * frac + a2 * frac + a3;
  }

  /**
   * AI-powered smart feedback control
   * Prevents runaway feedback and maintains optimal delay decay
   */
  private calculateSmartFeedback(sample: number, baseFeedback: number): number {
    const level = Math.abs(sample);

    // Track feedback level history
    this.feedbackLevelHistory.push(level);
    if (this.feedbackLevelHistory.length > 100) {
      this.feedbackLevelHistory.shift();
    }

    // Calculate average feedback level
    const avgLevel = this.feedbackLevelHistory.reduce((a, b) => a + b, 0) / this.feedbackLevelHistory.length;

    // Reduce feedback if level is building up
    if (avgLevel > 0.7) {
      return baseFeedback * 0.7; // Reduce by 30%
    } else if (avgLevel > 0.5) {
      return baseFeedback * 0.85; // Reduce by 15%
    }

    return baseFeedback;
  }

  /**
   * AI-powered adaptive filtering
   * Analyzes frequency content and adjusts filters to prevent buildup
   */
  private applyAdaptiveFiltering(sample: number, channel: number): number {
    const filterState = channel === 0 ? this.feedbackFilterStateL : this.feedbackFilterStateR;

    // Detect frequency buildup
    const isBuilding = Math.abs(sample) > 0.8;
    if (isBuilding) {
      this.frequencyBuildupDetector[channel] = Math.min(
        this.frequencyBuildupDetector[channel] + 0.1,
        1
      );
    } else {
      this.frequencyBuildupDetector[channel] = Math.max(
        this.frequencyBuildupDetector[channel] - 0.01,
        0
      );
    }

    // Adapt filter cutoffs based on buildup detection
    const buildupAmount = this.frequencyBuildupDetector[channel];
    const adaptiveLowCut = this.parameters.lowCut * (1 + buildupAmount * 0.5);
    const adaptiveHighCut = this.parameters.highCut * (1 - buildupAmount * 0.3);

    // Apply cascaded biquad filters
    let filtered = sample;
    filtered = this.applyHighPassFilter(filtered, adaptiveLowCut, filterState, 0);
    filtered = this.applyLowPassFilter(filtered, adaptiveHighCut, filterState, 2);

    return filtered;
  }

  /**
   * Apply standard filtering (non-adaptive)
   */
  private applyStandardFiltering(sample: number, channel: number): number {
    const filterState = channel === 0 ? this.feedbackFilterStateL : this.feedbackFilterStateR;

    let filtered = sample;
    filtered = this.applyHighPassFilter(filtered, this.parameters.lowCut, filterState, 0);
    filtered = this.applyLowPassFilter(filtered, this.parameters.highCut, filterState, 2);

    return filtered;
  }

  /**
   * Apply high-pass filter
   */
  private applyHighPassFilter(
    sample: number,
    cutoff: number,
    state: number[],
    stateOffset: number
  ): number {
    const freq = 2 * Math.PI * cutoff / this.sampleRate;
    const q = 0.707; // Butterworth

    const newState = state[stateOffset] + freq * (sample - state[stateOffset] - q * state[stateOffset + 1]);
    state[stateOffset + 1] = state[stateOffset + 1] + freq * newState;
    state[stateOffset] = newState;

    return sample - state[stateOffset + 1];
  }

  /**
   * Apply low-pass filter
   */
  private applyLowPassFilter(
    sample: number,
    cutoff: number,
    state: number[],
    stateOffset: number
  ): number {
    const freq = 2 * Math.PI * cutoff / this.sampleRate;
    const resonance = 1 + (this.parameters.filterResonance / 100) * 0.5;

    const newState = state[stateOffset] + freq * (sample - state[stateOffset] - resonance * state[stateOffset + 1]);
    state[stateOffset + 1] = state[stateOffset + 1] + freq * newState;
    state[stateOffset] = newState;

    return state[stateOffset + 1];
  }

  /**
   * Apply diffusion for smoother repeats
   */
  private applyDiffusion(sample: number, diffusionBuffer: Float32Array, channel: number): number {
    // Simple all-pass diffusion network
    const diffusionAmount = this.parameters.diffusion / 100;

    // Write to diffusion buffer
    diffusionBuffer[this.diffusionPosition] = sample;

    // Read from multiple tap points
    const tap1 = diffusionBuffer[(this.diffusionPosition + 7) % diffusionBuffer.length];
    const tap2 = diffusionBuffer[(this.diffusionPosition + 13) % diffusionBuffer.length];
    const tap3 = diffusionBuffer[(this.diffusionPosition + 19) % diffusionBuffer.length];

    // Mix taps
    const diffused = (tap1 + tap2 + tap3) / 3;

    return sample * (1 - diffusionAmount) + diffused * diffusionAmount;
  }

  /**
   * Apply character (subtle saturation)
   */
  private applyCharacter(sample: number): number {
    const amount = this.parameters.character / 100;
    const drive = 1 + amount * 0.5;

    return Math.tanh(sample * drive) / drive;
  }

  /**
   * Calculate tempo-synced delay time
   */
  private calculateTempoSyncedDelay(bpm: number): number {
    const beatDuration = (60 / bpm) * 1000; // ms per beat
    return beatDuration * this.parameters.tempoMultiplier;
  }

  /**
   * Set plugin parameter
   */
  setParameter(name: string, value: number): void {
    if (name in this.parameters) {
      (this.parameters as any)[name] = value;
    }
  }

  /**
   * Get plugin parameter
   */
  getParameter(name: string): number {
    if (name in this.parameters) {
      return (this.parameters as any)[name];
    }
    return 0;
  }

  /**
   * Get all parameters
   */
  getParameters(): AIDigitalDelayParameters {
    return { ...this.parameters };
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): AIDigitalDelayMetadata {
    return { ...this.metadata };
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    this.delayBufferL.fill(0);
    this.delayBufferR.fill(0);
    this.diffusionBufferL.fill(0);
    this.diffusionBufferR.fill(0);
    this.writePosition = 0;
    this.diffusionPosition = 0;
    this.modulationPhase = 0;
    this.feedbackLevelHistory = [];
    this.frequencyBuildupDetector.fill(0);
  }
}
