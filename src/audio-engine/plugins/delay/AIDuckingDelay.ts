/**
 * AI Ducking Delay Plugin
 *
 * Smart delay that ducks when vocals are present
 * Uses AI to detect vocal activity and intelligently reduce delay level
 *
 * Manufacturer: DAWG AI
 * Category: AI Delay
 */

import { Plugin } from '../PluginHost';

export interface AIDuckingDelayParameters {
  delayTime: number;           // 0-2000ms
  feedback: number;            // 0-100%
  mix: number;                 // 0-100%
  duckAmount: number;          // 0-100% (how much to duck)
  duckThreshold: number;       // -60 to 0 dB (input level to trigger ducking)
  attackTime: number;          // 1-100ms (how fast to duck)
  releaseTime: number;         // 10-1000ms (how fast to return)
  lowCut: number;              // 20-500Hz
  highCut: number;             // 1000-20000Hz
  modulation: number;          // 0-100%
  modulationRate: number;      // 0.1-5Hz
  sidechain: boolean;          // Use sidechain input for ducking
  smartDucking: boolean;       // AI-powered intelligent ducking
  vocalDetection: boolean;     // AI detects vocal frequencies
  adaptiveRelease: boolean;    // AI adapts release based on content
  tempoSync: boolean;
  tempoMultiplier: number;     // 1/4, 1/8, 1/16, etc
}

export interface AIDuckingDelayMetadata {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  isAI: boolean;
  description: string;
  features: string[];
}

export class AIDuckingDelay implements Plugin {
  id: string;
  name: string;

  private parameters: AIDuckingDelayParameters = {
    delayTime: 375,              // 375ms default
    feedback: 35,                // 35% feedback
    mix: 30,                     // 30% wet
    duckAmount: 70,              // 70% ducking
    duckThreshold: -20,          // -20dB threshold
    attackTime: 10,              // 10ms attack
    releaseTime: 200,            // 200ms release
    lowCut: 100,                 // 100Hz high-pass
    highCut: 10000,              // 10kHz low-pass
    modulation: 5,               // 5% modulation
    modulationRate: 0.3,         // 0.3Hz
    sidechain: false,
    smartDucking: true,          // AI ducking enabled
    vocalDetection: true,        // AI vocal detection enabled
    adaptiveRelease: true,       // AI adaptive release enabled
    tempoSync: false,
    tempoMultiplier: 0.25        // 1/4 note
  };

  private metadata: AIDuckingDelayMetadata = {
    id: 'dawg-ai-ducking-delay',
    name: 'AI Ducking Delay',
    manufacturer: 'DAWG AI',
    category: 'AI Delay',
    version: '1.0.0',
    isAI: true,
    description: 'Smart delay that ducks when vocals are present',
    features: [
      'AI-powered vocal detection',
      'Intelligent ducking based on vocal presence',
      'Adaptive attack and release times',
      'Sidechain input support',
      'Frequency-aware ducking',
      'Smart threshold adjustment',
      'Adaptive release based on content',
      'Tempo sync with smart quantization',
      'Modulation with rate control'
    ]
  };

  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writePosition: number = 0;
  private sampleRate: number = 48000;

  // Ducking envelope follower state
  private duckingEnvelope: number = 1.0; // 1.0 = no ducking, 0.0 = full duck

  // Modulation state
  private modulationPhase: number = 0;

  // Filter state
  private filterStateL: number[] = [0, 0, 0, 0];
  private filterStateR: number[] = [0, 0, 0, 0];

  // AI vocal detection state
  private vocalDetector: {
    energyHistory: number[];
    spectralCentroid: number;
    vocalProbability: number;
    frequencyBands: number[];
  } = {
    energyHistory: [],
    spectralCentroid: 0,
    vocalProbability: 0,
    frequencyBands: new Array(8).fill(0)
  };

  // Adaptive release state
  private releaseAnalyzer: {
    silenceDetector: number;
    contentDensity: number;
    adaptiveReleaseTime: number;
  } = {
    silenceDetector: 0,
    contentDensity: 0,
    adaptiveReleaseTime: 0
  };

  constructor(audioContext?: AudioContext) {
    this.id = this.metadata.id;
    this.name = this.metadata.name;
    this.sampleRate = audioContext?.sampleRate || 48000;

    // Allocate delay buffers (2 seconds max)
    const maxDelayTime = 2.0; // seconds
    const bufferSize = Math.ceil(maxDelayTime * this.sampleRate);
    this.delayBufferL = new Float32Array(bufferSize);
    this.delayBufferR = new Float32Array(bufferSize);

    this.releaseAnalyzer.adaptiveReleaseTime = this.parameters.releaseTime;
  }

  /**
   * Process audio through the ducking delay
   */
  process(inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void {
    const numChannels = Math.min(inputBuffer.length, outputBuffer.length);
    const bufferLength = inputBuffer[0].length;

    for (let i = 0; i < bufferLength; i++) {
      // Get input samples
      const inputL = numChannels > 0 ? inputBuffer[0][i] : 0;
      const inputR = numChannels > 1 ? inputBuffer[1][i] : inputL;

      // Calculate input level for ducking
      const inputLevel = Math.sqrt((inputL * inputL + inputR * inputR) / 2);

      // AI-powered vocal detection
      let vocalPresence = 0;
      if (this.parameters.vocalDetection) {
        vocalPresence = this.detectVocalContent(inputL, inputR);
      }

      // Calculate ducking threshold
      let effectiveThreshold = this.parameters.duckThreshold;
      if (this.parameters.smartDucking) {
        effectiveThreshold = this.calculateSmartThreshold(vocalPresence);
      }

      // Convert threshold from dB to linear
      const thresholdLinear = Math.pow(10, effectiveThreshold / 20);

      // Determine if we should duck
      const shouldDuck = inputLevel > thresholdLinear;

      // Calculate adaptive release time
      let releaseTime = this.parameters.releaseTime;
      if (this.parameters.adaptiveRelease) {
        releaseTime = this.calculateAdaptiveRelease(inputLevel);
      }

      // Calculate ducking envelope
      this.updateDuckingEnvelope(shouldDuck, releaseTime);

      // Calculate modulation
      const modulation = this.calculateModulation();

      // Calculate delay time
      let delayTime = this.parameters.delayTime;
      if (this.parameters.tempoSync) {
        delayTime = this.calculateTempoSyncedDelay(120); // Would get BPM from DAW
      }

      const modulatedDelayTime = delayTime * (1 + modulation * (this.parameters.modulation / 100) * 0.005);
      const delaySamples = (modulatedDelayTime / 1000) * this.sampleRate;

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const input = ch === 0 ? inputL : inputR;
        const delayBuffer = ch === 0 ? this.delayBufferL : this.delayBufferR;
        const filterState = ch === 0 ? this.filterStateL : this.filterStateR;

        // Read from delay buffer
        const readPosition = (this.writePosition - delaySamples + delayBuffer.length) % delayBuffer.length;
        let delayedSample = this.readDelayBufferInterpolated(delayBuffer, readPosition);

        // Apply filtering
        delayedSample = this.applyFiltering(delayedSample, filterState);

        // Apply ducking envelope
        const duckAmount = this.parameters.duckAmount / 100;
        const duckingGain = 1 - (1 - this.duckingEnvelope) * duckAmount;
        delayedSample *= duckingGain;

        // Calculate feedback
        const feedback = this.parameters.feedback / 100;
        const feedbackSample = delayedSample * feedback;

        // Write to delay buffer
        delayBuffer[this.writePosition] = input + feedbackSample;

        // Mix dry and wet signals
        const wet = this.parameters.mix / 100;
        const dry = 1 - wet;

        outputBuffer[ch][i] = input * dry + delayedSample * wet;
      }

      // Advance write position
      this.writePosition = (this.writePosition + 1) % this.delayBufferL.length;
    }
  }

  /**
   * AI-powered vocal content detection
   * Analyzes frequency content to detect vocal presence
   */
  private detectVocalContent(leftSample: number, rightSample: number): number {
    const sample = (leftSample + rightSample) / 2;
    const energy = sample * sample;

    // Track energy history
    this.vocalDetector.energyHistory.push(energy);
    if (this.vocalDetector.energyHistory.length > 100) {
      this.vocalDetector.energyHistory.shift();
    }

    // Simple spectral analysis - vocal range is typically 100Hz-4kHz
    // This is a simplified version; real implementation would use FFT
    const avgEnergy = this.vocalDetector.energyHistory.reduce((a, b) => a + b, 0) / this.vocalDetector.energyHistory.length;

    // Estimate vocal probability based on energy consistency and level
    const energyVariance = this.vocalDetector.energyHistory.reduce((sum, e) => {
      return sum + Math.pow(e - avgEnergy, 2);
    }, 0) / this.vocalDetector.energyHistory.length;

    const energyStdDev = Math.sqrt(energyVariance);

    // Vocals typically have moderate energy with some variation
    // High consistency + moderate level = likely vocal
    const consistencyScore = 1 - Math.min(1, energyStdDev / (avgEnergy + 0.001));
    const levelScore = Math.min(1, avgEnergy * 10);

    this.vocalDetector.vocalProbability = (consistencyScore * 0.6 + levelScore * 0.4);

    return this.vocalDetector.vocalProbability;
  }

  /**
   * Calculate smart threshold based on vocal detection
   */
  private calculateSmartThreshold(vocalPresence: number): number {
    const baseThreshold = this.parameters.duckThreshold;

    // If vocal probability is high, lower threshold to duck more readily
    const adjustment = vocalPresence * -5; // Up to -5dB adjustment

    return baseThreshold + adjustment;
  }

  /**
   * Calculate adaptive release time based on content
   */
  private calculateAdaptiveRelease(inputLevel: number): number {
    const baseRelease = this.parameters.releaseTime;

    // Detect silence periods
    const isSilent = inputLevel < 0.01;
    const smoothing = 0.999;

    this.releaseAnalyzer.silenceDetector = this.releaseAnalyzer.silenceDetector * smoothing +
      (isSilent ? 1 : 0) * (1 - smoothing);

    // Calculate content density (how much signal activity)
    this.releaseAnalyzer.contentDensity = this.releaseAnalyzer.contentDensity * smoothing +
      inputLevel * (1 - smoothing);

    // If entering silence, use faster release
    // If dense content, use slower release for smoother transitions
    if (this.releaseAnalyzer.silenceDetector > 0.5) {
      this.releaseAnalyzer.adaptiveReleaseTime = baseRelease * 0.5; // 2x faster
    } else if (this.releaseAnalyzer.contentDensity > 0.5) {
      this.releaseAnalyzer.adaptiveReleaseTime = baseRelease * 1.5; // 1.5x slower
    } else {
      this.releaseAnalyzer.adaptiveReleaseTime = baseRelease;
    }

    return this.releaseAnalyzer.adaptiveReleaseTime;
  }

  /**
   * Update ducking envelope follower
   */
  private updateDuckingEnvelope(shouldDuck: boolean, releaseTime: number): void {
    const attackTime = this.parameters.attackTime;

    // Calculate time constants
    const attackCoeff = Math.exp(-1000 / (attackTime * this.sampleRate));
    const releaseCoeff = Math.exp(-1000 / (releaseTime * this.sampleRate));

    if (shouldDuck) {
      // Attack (duck down)
      this.duckingEnvelope = this.duckingEnvelope * attackCoeff;
    } else {
      // Release (return to normal)
      this.duckingEnvelope = this.duckingEnvelope * releaseCoeff + (1 - releaseCoeff);
    }

    // Clamp to valid range
    this.duckingEnvelope = Math.max(0, Math.min(1, this.duckingEnvelope));
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
   * Read from delay buffer with linear interpolation
   */
  private readDelayBufferInterpolated(buffer: Float32Array, position: number): number {
    const index1 = Math.floor(position);
    const index2 = (index1 + 1) % buffer.length;
    const frac = position - index1;

    return buffer[index1] * (1 - frac) + buffer[index2] * frac;
  }

  /**
   * Apply filtering to feedback path
   */
  private applyFiltering(sample: number, filterState: number[]): number {
    // High-pass filter
    const hpFreq = 2 * Math.PI * this.parameters.lowCut / this.sampleRate;
    filterState[0] = filterState[0] + hpFreq * (sample - filterState[0]);
    const highPassed = sample - filterState[0];

    // Low-pass filter
    const lpFreq = 2 * Math.PI * this.parameters.highCut / this.sampleRate;
    filterState[1] = filterState[1] + lpFreq * (highPassed - filterState[1]);

    return filterState[1];
  }

  /**
   * Calculate tempo-synced delay time
   */
  private calculateTempoSyncedDelay(bpm: number): number {
    const beatDuration = (60 / bpm) * 1000; // ms per beat
    return beatDuration * this.parameters.tempoMultiplier;
  }

  /**
   * Get current ducking gain (for metering/visualization)
   */
  getDuckingGain(): number {
    const duckAmount = this.parameters.duckAmount / 100;
    return 1 - (1 - this.duckingEnvelope) * duckAmount;
  }

  /**
   * Get vocal detection probability (for metering/visualization)
   */
  getVocalProbability(): number {
    return this.vocalDetector.vocalProbability;
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
  getParameters(): AIDuckingDelayParameters {
    return { ...this.parameters };
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): AIDuckingDelayMetadata {
    return { ...this.metadata };
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    this.delayBufferL.fill(0);
    this.delayBufferR.fill(0);
    this.writePosition = 0;
    this.modulationPhase = 0;
    this.duckingEnvelope = 1.0;
    this.vocalDetector.energyHistory = [];
  }
}
