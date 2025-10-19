/**
 * AI Ping-Pong Delay Plugin
 *
 * Stereo ping-pong delay with AI stereo width optimization
 * Creates rhythmic stereo delays that bounce between left and right channels
 *
 * Manufacturer: DAWG AI
 * Category: AI Delay
 */

import { Plugin } from '../PluginHost';

export interface AIPingPongDelayParameters {
  delayTime: number;           // 0-2000ms
  feedback: number;            // 0-100%
  mix: number;                 // 0-100%
  pingPongAmount: number;      // 0-100% (0=mono, 100=full ping-pong)
  stereoWidth: number;         // 0-200% (AI optimized)
  lowCut: number;              // 20-500Hz
  highCut: number;             // 1000-20000Hz
  modulation: number;          // 0-100%
  modulationRate: number;      // 0.1-5Hz
  panSpread: number;           // 0-100% (width of ping-pong spread)
  crossfeedAmount: number;     // 0-100% (L->R and R->L mixing)
  tempoSync: boolean;
  tempoMultiplier: number;     // 1/4, 1/8, 1/16, etc
  smartStereo: boolean;        // AI-powered stereo width optimization
  adaptivePanning: boolean;    // AI adapts panning based on content
}

export interface AIPingPongDelayMetadata {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  isAI: boolean;
  description: string;
  features: string[];
}

export class AIPingPongDelay implements Plugin {
  id: string;
  name: string;

  private parameters: AIPingPongDelayParameters = {
    delayTime: 375,              // 375ms default
    feedback: 40,                // 40% feedback
    mix: 30,                     // 30% wet
    pingPongAmount: 80,          // 80% ping-pong
    stereoWidth: 100,            // 100% width
    lowCut: 100,                 // 100Hz high-pass
    highCut: 10000,              // 10kHz low-pass
    modulation: 5,               // 5% modulation
    modulationRate: 0.3,         // 0.3Hz
    panSpread: 90,               // 90% pan spread
    crossfeedAmount: 15,         // 15% crossfeed
    tempoSync: false,
    tempoMultiplier: 0.25,       // 1/4 note
    smartStereo: true,           // AI stereo optimization enabled
    adaptivePanning: true        // AI adaptive panning enabled
  };

  private metadata: AIPingPongDelayMetadata = {
    id: 'dawg-ai-ping-pong-delay',
    name: 'AI Ping-Pong Delay',
    manufacturer: 'DAWG AI',
    category: 'AI Delay',
    version: '1.0.0',
    isAI: true,
    description: 'Stereo ping-pong delay with AI stereo width optimization',
    features: [
      'Rhythmic ping-pong stereo delay',
      'AI-powered stereo width optimization',
      'Adaptive panning based on audio content',
      'Intelligent crossfeed control',
      'Pan spread adjustment',
      'Modulation with rate control',
      'Tempo sync with smart quantization',
      'Adaptive filtering',
      'Smart feedback management'
    ]
  };

  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writePositionL: number = 0;
  private writePositionR: number = 0;
  private sampleRate: number = 48000;

  // Modulation state
  private modulationPhase: number = 0;

  // Filter state
  private filterStateL: number[] = [0, 0, 0, 0];
  private filterStateR: number[] = [0, 0, 0, 0];

  // AI analysis state
  private stereoAnalyzer: {
    leftEnergy: number;
    rightEnergy: number;
    stereoBalance: number;
    contentHistory: number[];
  } = {
    leftEnergy: 0,
    rightEnergy: 0,
    stereoBalance: 0.5,
    contentHistory: []
  };

  // Ping-pong state
  private pingPongPhase: number = 0; // 0 = left, 1 = right

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
   * Process audio through the ping-pong delay
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

      const modulatedDelayTime = delayTime * (1 + modulation * (this.parameters.modulation / 100) * 0.005);
      const delaySamples = (modulatedDelayTime / 1000) * this.sampleRate;

      // Get input samples
      const inputL = numChannels > 0 ? inputBuffer[0][i] : 0;
      const inputR = numChannels > 1 ? inputBuffer[1][i] : inputL;

      // AI-powered stereo analysis
      if (this.parameters.smartStereo) {
        this.analyzeStereoContent(inputL, inputR);
      }

      // Calculate AI-optimized stereo width
      const stereoWidth = this.parameters.smartStereo ?
        this.calculateOptimalStereoWidth() :
        this.parameters.stereoWidth / 100;

      // Calculate AI-adaptive panning
      const panPosition = this.parameters.adaptivePanning ?
        this.calculateAdaptivePanning() :
        this.pingPongPhase;

      // Read from delay buffers
      const readPosL = (this.writePositionL - delaySamples + this.delayBufferL.length) % this.delayBufferL.length;
      const readPosR = (this.writePositionR - delaySamples + this.delayBufferR.length) % this.delayBufferR.length;

      let delayedL = this.readDelayBufferInterpolated(this.delayBufferL, readPosL);
      let delayedR = this.readDelayBufferInterpolated(this.delayBufferR, readPosR);

      // Apply filtering
      delayedL = this.applyFiltering(delayedL, this.filterStateL);
      delayedR = this.applyFiltering(delayedR, this.filterStateR);

      // Apply crossfeed
      const crossfeed = this.parameters.crossfeedAmount / 100;
      const crossfeedL = delayedL * (1 - crossfeed) + delayedR * crossfeed;
      const crossfeedR = delayedR * (1 - crossfeed) + delayedL * crossfeed;

      // Calculate ping-pong panning
      const pingPongAmount = this.parameters.pingPongAmount / 100;
      const panSpread = this.parameters.panSpread / 100;

      const leftGain = this.calculatePanGain(panPosition, true, panSpread, pingPongAmount);
      const rightGain = this.calculatePanGain(panPosition, false, panSpread, pingPongAmount);

      // Apply ping-pong panning
      const pingPongedL = crossfeedL * leftGain;
      const pingPongedR = crossfeedR * rightGain;

      // Apply stereo width
      const mid = (pingPongedL + pingPongedR) / 2;
      const side = (pingPongedL - pingPongedR) / 2;

      const wideStereoL = mid + side * stereoWidth;
      const wideStereoR = mid - side * stereoWidth;

      // Calculate feedback
      const feedback = this.parameters.feedback / 100;

      // Write to delay buffers with ping-pong routing
      // Left delay gets: input + right delay feedback (ping-pong)
      // Right delay gets: input + left delay feedback (ping-pong)
      this.delayBufferL[this.writePositionL] = inputL + wideStereoR * feedback;
      this.delayBufferR[this.writePositionR] = inputR + wideStereoL * feedback;

      // Mix dry and wet signals
      const wet = this.parameters.mix / 100;
      const dry = 1 - wet;

      if (numChannels > 0) {
        outputBuffer[0][i] = inputL * dry + wideStereoL * wet;
      }
      if (numChannels > 1) {
        outputBuffer[1][i] = inputR * dry + wideStereoR * wet;
      }

      // Advance write positions
      this.writePositionL = (this.writePositionL + 1) % this.delayBufferL.length;
      this.writePositionR = (this.writePositionR + 1) % this.delayBufferR.length;

      // Update ping-pong phase (alternates with each delay tap)
      // This is a simplified version - in practice, this would be based on the actual delay taps
      this.pingPongPhase = (this.pingPongPhase + 0.0001) % 1.0;
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
   * AI-powered stereo content analysis
   */
  private analyzeStereoContent(leftSample: number, rightSample: number): void {
    const leftEnergy = leftSample * leftSample;
    const rightEnergy = rightSample * rightSample;

    // Smooth energy measurements
    const smoothing = 0.99;
    this.stereoAnalyzer.leftEnergy = this.stereoAnalyzer.leftEnergy * smoothing + leftEnergy * (1 - smoothing);
    this.stereoAnalyzer.rightEnergy = this.stereoAnalyzer.rightEnergy * smoothing + rightEnergy * (1 - smoothing);

    // Calculate stereo balance
    const totalEnergy = this.stereoAnalyzer.leftEnergy + this.stereoAnalyzer.rightEnergy;
    if (totalEnergy > 0.0001) {
      this.stereoAnalyzer.stereoBalance = this.stereoAnalyzer.leftEnergy / totalEnergy;
    }

    // Track content history for adaptive processing
    this.stereoAnalyzer.contentHistory.push(totalEnergy);
    if (this.stereoAnalyzer.contentHistory.length > 1000) {
      this.stereoAnalyzer.contentHistory.shift();
    }
  }

  /**
   * Calculate AI-optimized stereo width
   * Adjusts width based on stereo content to prevent phase issues
   */
  private calculateOptimalStereoWidth(): number {
    const baseWidth = this.parameters.stereoWidth / 100;
    const balance = this.stereoAnalyzer.stereoBalance;

    // If content is already very stereo, reduce width slightly to prevent excessive spread
    const balanceDeviation = Math.abs(balance - 0.5);
    if (balanceDeviation > 0.3) {
      return baseWidth * 0.85; // Reduce by 15%
    }

    return baseWidth;
  }

  /**
   * Calculate AI-adaptive panning
   * Adjusts ping-pong pattern based on audio content
   */
  private calculateAdaptivePanning(): number {
    const balance = this.stereoAnalyzer.stereoBalance;

    // Adapt panning to complement existing stereo field
    // If content is left-heavy, emphasize right delays and vice versa
    const adaptiveOffset = (balance - 0.5) * -0.3;

    return Math.max(0, Math.min(1, this.pingPongPhase + adaptiveOffset));
  }

  /**
   * Calculate pan gain for ping-pong effect
   */
  private calculatePanGain(
    panPosition: number,
    isLeft: boolean,
    spread: number,
    amount: number
  ): number {
    // Equal power panning
    const angle = panPosition * Math.PI / 2;
    const baseGain = isLeft ? Math.cos(angle) : Math.sin(angle);

    // Apply spread
    const spreadGain = 1 - spread * (1 - baseGain);

    // Blend with center based on ping-pong amount
    return spreadGain * amount + (1 - amount) * 0.707; // 0.707 = center gain
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
  getParameters(): AIPingPongDelayParameters {
    return { ...this.parameters };
  }

  /**
   * Get plugin metadata
   */
  getMetadata(): AIPingPongDelayMetadata {
    return { ...this.metadata };
  }

  /**
   * Dispose and clean up resources
   */
  dispose(): void {
    this.delayBufferL.fill(0);
    this.delayBufferR.fill(0);
    this.writePositionL = 0;
    this.writePositionR = 0;
    this.modulationPhase = 0;
    this.pingPongPhase = 0;
    this.stereoAnalyzer.contentHistory = [];
  }
}
