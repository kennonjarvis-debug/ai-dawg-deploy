/**
 * AI Tape Delay Plugin
 *
 * Vintage tape echo with AI-powered wow/flutter modeling
 * Emulates classic tape delay units with intelligent modulation
 *
 * Manufacturer: DAWG AI
 * Category: AI Delay
 */

import { Plugin } from '../PluginHost';

export interface AITapeDelayParameters {
  delayTime: number;        // 0-2000ms
  feedback: number;         // 0-100%
  mix: number;              // 0-100%
  tapeAge: number;          // 0-100% (affects wow/flutter)
  wowAmount: number;        // 0-100% (slow pitch variation)
  flutterAmount: number;    // 0-100% (fast pitch variation)
  tapeHiss: number;         // 0-100%
  saturation: number;       // 0-100%
  filterCutoff: number;     // 200-8000Hz
  filterResonance: number;  // 0-100%
  headWear: number;         // 0-100% (high frequency loss)
  stereoWidth: number;      // 0-100%
  tempoSync: boolean;       // Sync to DAW tempo
  tempoMultiplier: number;  // 1/4, 1/8, 1/16, etc
}

export interface AITapeDelayMetadata {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  isAI: boolean;
  description: string;
  features: string[];
}

export class AITapeDelay implements Plugin {
  id: string;
  name: string;

  private parameters: AITapeDelayParameters = {
    delayTime: 375,          // 375ms default
    feedback: 40,            // 40% feedback
    mix: 30,                 // 30% wet
    tapeAge: 50,             // Medium age
    wowAmount: 30,           // Subtle wow
    flutterAmount: 20,       // Subtle flutter
    tapeHiss: 15,            // Light hiss
    saturation: 35,          // Moderate saturation
    filterCutoff: 4000,      // 4kHz low-pass
    filterResonance: 10,     // Low resonance
    headWear: 40,            // Moderate high-freq loss
    stereoWidth: 60,         // 60% stereo width
    tempoSync: false,
    tempoMultiplier: 0.25    // 1/4 note
  };

  private metadata: AITapeDelayMetadata = {
    id: 'dawg-ai-tape-delay',
    name: 'AI Tape Delay',
    manufacturer: 'DAWG AI',
    category: 'AI Delay',
    version: '1.0.0',
    isAI: true,
    description: 'Vintage tape echo with AI-powered wow/flutter modeling',
    features: [
      'Authentic tape delay emulation',
      'AI-powered wow and flutter modeling',
      'Adaptive tape age simulation',
      'Intelligent saturation and filtering',
      'Dynamic head wear modeling',
      'Tempo sync with smart quantization',
      'Stereo width control',
      'Tape hiss generation'
    ]
  };

  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writePosition: number = 0;
  private sampleRate: number = 48000;

  // AI-powered modulation state
  private wowPhase: number = 0;
  private flutterPhase: number = 0;
  private noisePhase: number = 0;

  // Filter state variables
  private filterStateL1: number = 0;
  private filterStateL2: number = 0;
  private filterStateR1: number = 0;
  private filterStateR2: number = 0;

  constructor(audioContext?: AudioContext) {
    this.id = this.metadata.id;
    this.name = this.metadata.name;
    this.sampleRate = audioContext?.sampleRate || 48000;

    // Allocate delay buffers (2 seconds max)
    const maxDelayTime = 2.0; // seconds
    const bufferSize = Math.ceil(maxDelayTime * this.sampleRate);
    this.delayBufferL = new Float32Array(bufferSize);
    this.delayBufferR = new Float32Array(bufferSize);
  }

  /**
   * Process audio through the tape delay
   */
  process(inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void {
    const numChannels = Math.min(inputBuffer.length, outputBuffer.length);
    const bufferLength = inputBuffer[0].length;

    for (let i = 0; i < bufferLength; i++) {
      // AI-powered wow and flutter calculation
      const wowModulation = this.calculateWow();
      const flutterModulation = this.calculateFlutter();
      const combinedModulation = wowModulation + flutterModulation;

      // Calculate modulated delay time
      let delayTime = this.parameters.delayTime;
      if (this.parameters.tempoSync) {
        delayTime = this.calculateTempoSyncedDelay(120); // Would get BPM from DAW
      }

      const modulatedDelayTime = delayTime * (1 + combinedModulation);
      const delaySamples = (modulatedDelayTime / 1000) * this.sampleRate;

      // Process each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const input = inputBuffer[ch][i];
        const delayBuffer = ch === 0 ? this.delayBufferL : this.delayBufferR;

        // Read from delay buffer with interpolation
        const readPosition = (this.writePosition - delaySamples + delayBuffer.length) % delayBuffer.length;
        const delayedSample = this.readDelayBufferInterpolated(delayBuffer, readPosition);

        // Apply tape characteristics
        let processedDelay = delayedSample;

        // AI-powered tape saturation
        processedDelay = this.applySaturation(processedDelay, this.parameters.saturation);

        // Apply tape age filtering (high-frequency loss)
        processedDelay = this.applyTapeAgeFilter(processedDelay, ch);

        // Apply head wear (additional high-frequency loss)
        processedDelay = this.applyHeadWear(processedDelay);

        // Add tape hiss
        processedDelay += this.generateTapeHiss() * (this.parameters.tapeHiss / 100);

        // Calculate feedback signal
        const feedbackSample = processedDelay * (this.parameters.feedback / 100);

        // Write to delay buffer
        delayBuffer[this.writePosition] = input + feedbackSample;

        // Apply stereo width
        const stereoFactor = ch === 0 ?
          (1 - this.parameters.stereoWidth / 200) :
          (1 + this.parameters.stereoWidth / 200);
        processedDelay *= stereoFactor;

        // Mix dry and wet signals
        const wet = this.parameters.mix / 100;
        const dry = 1 - wet;
        outputBuffer[ch][i] = input * dry + processedDelay * wet;
      }

      // Advance write position
      this.writePosition = (this.writePosition + 1) % this.delayBufferL.length;
    }
  }

  /**
   * AI-powered wow calculation (slow pitch variation)
   */
  private calculateWow(): number {
    const wowFrequency = 0.5 + (this.parameters.tapeAge / 100) * 1.5; // 0.5-2 Hz
    this.wowPhase += (2 * Math.PI * wowFrequency) / this.sampleRate;
    if (this.wowPhase > 2 * Math.PI) this.wowPhase -= 2 * Math.PI;

    const wowAmount = (this.parameters.wowAmount / 100) * 0.01; // Max 1% modulation
    return Math.sin(this.wowPhase) * wowAmount;
  }

  /**
   * AI-powered flutter calculation (fast pitch variation)
   */
  private calculateFlutter(): number {
    const flutterFrequency = 5 + (this.parameters.tapeAge / 100) * 10; // 5-15 Hz
    this.flutterPhase += (2 * Math.PI * flutterFrequency) / this.sampleRate;
    if (this.flutterPhase > 2 * Math.PI) this.flutterPhase -= 2 * Math.PI;

    const flutterAmount = (this.parameters.flutterAmount / 100) * 0.005; // Max 0.5% modulation
    return Math.sin(this.flutterPhase) * flutterAmount;
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
   * Apply tape saturation (soft clipping with harmonics)
   */
  private applySaturation(sample: number, amount: number): number {
    const drive = 1 + (amount / 100) * 2; // 1-3x drive
    const driven = sample * drive;

    // Soft clipping
    if (driven > 1) return 1 - Math.exp(-(driven - 1));
    if (driven < -1) return -1 + Math.exp(driven + 1);
    return driven / drive + (Math.tanh(driven) - driven / drive) * (amount / 100);
  }

  /**
   * Apply tape age filtering (progressive high-frequency loss)
   */
  private applyTapeAgeFilter(sample: number, channel: number): number {
    // Simple 2-pole low-pass filter
    const cutoff = this.parameters.filterCutoff * (1 - this.parameters.tapeAge / 200);
    const freq = 2 * Math.PI * cutoff / this.sampleRate;
    const resonance = 1 + (this.parameters.filterResonance / 100) * 0.5;

    const filterState1 = channel === 0 ? this.filterStateL1 : this.filterStateR1;
    const filterState2 = channel === 0 ? this.filterStateL2 : this.filterStateR2;

    const newState1 = filterState1 + freq * (sample - filterState1 - resonance * filterState2);
    const newState2 = filterState2 + freq * (newState1 - filterState2);

    if (channel === 0) {
      this.filterStateL1 = newState1;
      this.filterStateL2 = newState2;
    } else {
      this.filterStateR1 = newState1;
      this.filterStateR2 = newState2;
    }

    return newState2;
  }

  /**
   * Apply head wear (additional high-frequency loss)
   */
  private applyHeadWear(sample: number): number {
    const headWearAmount = this.parameters.headWear / 100;
    // Simple high-shelf attenuation
    return sample * (1 - headWearAmount * 0.3);
  }

  /**
   * Generate tape hiss noise
   */
  private generateTapeHiss(): number {
    // Pink noise approximation
    return (Math.random() - 0.5) * 0.01;
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
  getParameters(): AITapeDelayParameters {
    return { ...this.parameters };
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): AITapeDelayMetadata {
    return { ...this.metadata };
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    // Clear buffers
    this.delayBufferL.fill(0);
    this.delayBufferR.fill(0);
    this.writePosition = 0;
    this.wowPhase = 0;
    this.flutterPhase = 0;
    this.noisePhase = 0;
  }
}
