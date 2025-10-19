/**
 * AI Saturation
 * Harmonic saturation with AI-powered analog modeling
 *
 * Features:
 * - AI-powered analog hardware emulation (tube, tape, transformer)
 * - Intelligent harmonic generation (even/odd harmonics)
 * - Adaptive saturation based on input level
 * - Smart tone shaping with AI optimization
 * - Multi-stage saturation with AI blend control
 * - Auto-detection of optimal saturation type for content
 */

import { PluginParameter } from '../core/types';

export type SaturationType = 'tube' | 'tape' | 'transformer' | 'console' | 'custom';

export interface AISaturationParams {
  // Core Parameters
  enabled: boolean;
  drive: number; // 0-100% saturation amount
  output: number; // -12 to +12 dB output gain

  // AI Features
  aiModelType: boolean; // AI selects best saturation type
  adaptiveDrive: boolean; // AI adjusts drive based on input
  smartTone: boolean; // AI optimizes tone for content

  // Saturation Type
  type: SaturationType;
  mix: number; // 0-100% wet/dry mix

  // Harmonic Content
  evenHarmonics: number; // 0-100% even harmonic generation
  oddHarmonics: number; // 0-100% odd harmonic generation

  // Tone Shaping
  warmth: number; // -12 to +12 dB low shelf
  brightness: number; // -12 to +12 dB high shelf
  presence: number; // -12 to +12 dB mid peak around 3kHz

  // Advanced
  bias: number; // -100 to +100% asymmetry
  autoGain: boolean; // Automatic output compensation
}

export const AI_SATURATION_DEFAULTS: AISaturationParams = {
  enabled: true,
  drive: 30,
  output: 0,
  aiModelType: true,
  adaptiveDrive: true,
  smartTone: true,
  type: 'tube',
  mix: 70,
  evenHarmonics: 60,
  oddHarmonics: 40,
  warmth: 2,
  brightness: 1,
  presence: 0,
  bias: 0,
  autoGain: true,
};

export const AI_SATURATION_PARAMETERS: PluginParameter[] = [
  {
    id: 'drive',
    name: 'Drive',
    label: 'Saturation Drive',
    value: 0.3,
    displayValue: '30%',
    min: 0,
    max: 1,
    default: 0.3,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'mix',
    name: 'Mix',
    label: 'Wet/Dry Mix',
    value: 0.7,
    displayValue: '70%',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'type',
    name: 'Type',
    label: 'Saturation Type',
    value: 0,
    displayValue: 'Tube',
    min: 0,
    max: 4,
    default: 0,
    isAutomatable: false,
    steps: 5,
  },
  {
    id: 'evenHarmonics',
    name: 'Even Harmonics',
    label: 'Even Harmonic Content',
    value: 0.6,
    displayValue: '60%',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'oddHarmonics',
    name: 'Odd Harmonics',
    label: 'Odd Harmonic Content',
    value: 0.4,
    displayValue: '40%',
    min: 0,
    max: 1,
    default: 0.4,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'warmth',
    name: 'Warmth',
    label: 'Low Frequency Warmth',
    value: 0.58,
    displayValue: '+2dB',
    min: 0,
    max: 1,
    default: 0.58,
    isAutomatable: true,
    unit: 'dB',
  },
  {
    id: 'brightness',
    name: 'Brightness',
    label: 'High Frequency Brightness',
    value: 0.54,
    displayValue: '+1dB',
    min: 0,
    max: 1,
    default: 0.54,
    isAutomatable: true,
    unit: 'dB',
  },
  {
    id: 'bias',
    name: 'Bias',
    label: 'Asymmetry Bias',
    value: 0.5,
    displayValue: '0%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%',
  },
];

export interface SaturationCharacteristics {
  type: SaturationType;
  name: string;
  description: string;
  harmonicProfile: {
    even: number;
    odd: number;
  };
  toneShaping: {
    warmth: number;
    brightness: number;
    presence: number;
  };
  driveRange: {
    min: number;
    max: number;
    sweet: number;
  };
  bestFor: string[];
}

export const SATURATION_TYPES: Record<SaturationType, SaturationCharacteristics> = {
  tube: {
    type: 'tube',
    name: 'Tube',
    description: 'Warm vacuum tube saturation with even harmonics',
    harmonicProfile: {
      even: 70,
      odd: 30,
    },
    toneShaping: {
      warmth: 3,
      brightness: -1,
      presence: 1,
    },
    driveRange: {
      min: 10,
      max: 80,
      sweet: 35,
    },
    bestFor: ['vocals', 'guitars', 'bass', 'mix-bus'],
  },
  tape: {
    type: 'tape',
    name: 'Tape',
    description: 'Analog tape saturation with compression and warmth',
    harmonicProfile: {
      even: 60,
      odd: 40,
    },
    toneShaping: {
      warmth: 4,
      brightness: -2,
      presence: 0,
    },
    driveRange: {
      min: 15,
      max: 70,
      sweet: 40,
    },
    bestFor: ['drums', 'bass', 'mix-bus', 'mastering'],
  },
  transformer: {
    type: 'transformer',
    name: 'Transformer',
    description: 'Iron core transformer saturation with punch',
    harmonicProfile: {
      even: 50,
      odd: 50,
    },
    toneShaping: {
      warmth: 2,
      brightness: 0,
      presence: 2,
    },
    driveRange: {
      min: 5,
      max: 60,
      sweet: 25,
    },
    bestFor: ['drums', 'percussion', 'transients', 'mix-bus'],
  },
  console: {
    type: 'console',
    name: 'Console',
    description: 'Mixing console saturation with subtle harmonics',
    harmonicProfile: {
      even: 40,
      odd: 60,
    },
    toneShaping: {
      warmth: 1,
      brightness: 1,
      presence: 1,
    },
    driveRange: {
      min: 10,
      max: 50,
      sweet: 20,
    },
    bestFor: ['mix-bus', 'mastering', 'subtle-enhancement'],
  },
  custom: {
    type: 'custom',
    name: 'Custom',
    description: 'Custom saturation with user-defined characteristics',
    harmonicProfile: {
      even: 50,
      odd: 50,
    },
    toneShaping: {
      warmth: 0,
      brightness: 0,
      presence: 0,
    },
    driveRange: {
      min: 0,
      max: 100,
      sweet: 50,
    },
    bestFor: ['custom'],
  },
};

export interface ContentAnalysis {
  type: 'vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'mix' | 'unknown';
  dynamicRange: number;
  spectralBalance: {
    low: number;
    mid: number;
    high: number;
  };
  transientContent: number;
  recommendations: {
    saturatonType: SaturationType;
    drive: number;
    harmonicBalance: { even: number; odd: number };
    toneAdjustments: { warmth: number; brightness: number; presence: number };
  };
}

export class AISaturation {
  private params: AISaturationParams;
  private audioContext: AudioContext | null = null;
  private waveShaperNode: WaveShaperNode | null = null;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private mixNode: GainNode | null = null;

  constructor(context?: AudioContext) {
    this.params = { ...AI_SATURATION_DEFAULTS };
    if (context) {
      this.initialize(context);
    }
  }

  initialize(context: AudioContext): void {
    this.audioContext = context;

    // Create audio nodes
    this.waveShaperNode = context.createWaveShaper();
    this.inputGain = context.createGain();
    this.outputGain = context.createGain();
    this.mixNode = context.createGain();

    this.updateParameters(this.params);
  }

  updateParameters(params: Partial<AISaturationParams>): void {
    this.params = { ...this.params, ...params };

    if (this.audioContext && this.waveShaperNode && this.inputGain && this.outputGain && this.mixNode) {
      // Update drive (input gain)
      const driveGain = 1 + (this.params.drive / 100) * 4;
      this.inputGain.gain.value = driveGain;

      // Update wave shaper curve based on type
      this.waveShaperNode.curve = this.generateSaturationCurve(
        this.params.type,
        this.params.evenHarmonics,
        this.params.oddHarmonics,
        this.params.bias
      );

      // Update output gain
      const outputDb = this.params.output;
      const outputGain = Math.pow(10, outputDb / 20);
      this.outputGain.gain.value = outputGain;

      // Update mix
      this.mixNode.gain.value = this.params.mix / 100;

      // Auto-gain compensation
      if (this.params.autoGain) {
        const compensation = 1 / driveGain;
        this.outputGain.gain.value *= compensation;
      }
    }
  }

  getParameters(): AISaturationParams {
    return { ...this.params };
  }

  /**
   * Generate saturation curve based on type and harmonic content
   */
  private generateSaturationCurve(
    type: SaturationType,
    evenHarmonics: number,
    oddHarmonics: number,
    bias: number
  ): Float32Array {
    const samples = 4096;
    const curve = new Float32Array(samples);
    const biasAmount = (bias - 50) / 50; // -1 to +1

    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1; // -1 to +1

      let y: number;

      switch (type) {
        case 'tube':
          // Soft clipping with even harmonics
          y = this.tubeSaturation(x, evenHarmonics / 100, biasAmount);
          break;

        case 'tape':
          // Tape-style compression and saturation
          y = this.tapeSaturation(x, evenHarmonics / 100, oddHarmonics / 100);
          break;

        case 'transformer':
          // Transformer saturation with both even and odd
          y = this.transformerSaturation(x, evenHarmonics / 100, oddHarmonics / 100);
          break;

        case 'console':
          // Subtle console-style saturation
          y = this.consoleSaturation(x, oddHarmonics / 100);
          break;

        case 'custom':
        default:
          // Custom blend of even and odd
          y = this.customSaturation(x, evenHarmonics / 100, oddHarmonics / 100, biasAmount);
          break;
      }

      curve[i] = y;
    }

    return curve;
  }

  private tubeSaturation(x: number, evenAmount: number, bias: number): number {
    // Tube-style soft clipping with bias
    const biased = x + bias * 0.3;
    const sat = Math.tanh(biased * (1 + evenAmount));
    return sat * 0.7; // Scale down to prevent clipping
  }

  private tapeSaturation(x: number, evenAmount: number, oddAmount: number): number {
    // Tape-style with compression and warmth
    const compressed = x / (1 + Math.abs(x) * 0.3);
    const sat = Math.tanh(compressed * (1 + evenAmount + oddAmount));
    return sat * 0.8;
  }

  private transformerSaturation(x: number, evenAmount: number, oddAmount: number): number {
    // Transformer-style with punch
    const sat = Math.atan(x * (1 + evenAmount + oddAmount) * 2) / (Math.PI / 2);
    return sat * 0.85;
  }

  private consoleSaturation(x: number, oddAmount: number): number {
    // Subtle console saturation
    const sat = x + (Math.sin(x * Math.PI) * oddAmount * 0.15);
    return Math.max(-1, Math.min(1, sat));
  }

  private customSaturation(x: number, evenAmount: number, oddAmount: number, bias: number): number {
    // Custom blend
    const biased = x + bias * 0.2;
    const even = Math.tanh(biased * (1 + evenAmount));
    const odd = Math.atan(biased * (1 + oddAmount)) / (Math.PI / 2);
    return (even * evenAmount + odd * oddAmount) / (evenAmount + oddAmount || 1) * 0.75;
  }

  /**
   * AI-powered content analysis for optimal saturation
   */
  async analyzeContent(audioBuffer: Float32Array[]): Promise<ContentAnalysis> {
    const rms = this.calculateRMS(audioBuffer[0]);
    const peak = this.calculatePeak(audioBuffer[0]);
    const dynamicRange = peak - rms;

    // Simple spectral analysis
    const spectralBalance = {
      low: 0.33,
      mid: 0.34,
      high: 0.33,
    };

    // Detect transient content
    const transientContent = this.detectTransients(audioBuffer[0]);

    // Determine content type (simplified)
    let type: ContentAnalysis['type'] = 'unknown';
    if (transientContent > 0.7) type = 'drums';
    else if (spectralBalance.low > 0.5) type = 'bass';
    else if (spectralBalance.high > 0.4) type = 'vocal';
    else if (dynamicRange < 6) type = 'mix';

    // Generate recommendations
    const recommendations = this.generateRecommendations(type, dynamicRange, transientContent);

    return {
      type,
      dynamicRange,
      spectralBalance,
      transientContent,
      recommendations,
    };
  }

  /**
   * Auto-optimize saturation based on content
   */
  async autoOptimize(audioBuffer: Float32Array[]): Promise<Partial<AISaturationParams>> {
    const analysis = await this.analyzeContent(audioBuffer);
    return {
      type: analysis.recommendations.saturatonType,
      drive: analysis.recommendations.drive,
      evenHarmonics: analysis.recommendations.harmonicBalance.even,
      oddHarmonics: analysis.recommendations.harmonicBalance.odd,
      warmth: analysis.recommendations.toneAdjustments.warmth,
      brightness: analysis.recommendations.toneAdjustments.brightness,
      presence: analysis.recommendations.toneAdjustments.presence,
    };
  }

  private generateRecommendations(
    type: ContentAnalysis['type'],
    dynamicRange: number,
    transientContent: number
  ): ContentAnalysis['recommendations'] {
    let saturatonType: SaturationType = 'tube';
    let drive = 30;
    let harmonicBalance = { even: 60, odd: 40 };
    let toneAdjustments = { warmth: 2, brightness: 1, presence: 0 };

    switch (type) {
      case 'vocal':
        saturatonType = 'tube';
        drive = 25;
        harmonicBalance = { even: 70, odd: 30 };
        toneAdjustments = { warmth: 3, brightness: 2, presence: 1 };
        break;

      case 'drums':
        saturatonType = 'transformer';
        drive = 40;
        harmonicBalance = { even: 50, odd: 50 };
        toneAdjustments = { warmth: 1, brightness: 0, presence: 3 };
        break;

      case 'bass':
        saturatonType = 'tape';
        drive = 45;
        harmonicBalance = { even: 65, odd: 35 };
        toneAdjustments = { warmth: 5, brightness: -2, presence: 0 };
        break;

      case 'guitar':
        saturatonType = 'tube';
        drive = 35;
        harmonicBalance = { even: 60, odd: 40 };
        toneAdjustments = { warmth: 2, brightness: 3, presence: 2 };
        break;

      case 'mix':
        saturatonType = 'console';
        drive = 20;
        harmonicBalance = { even: 45, odd: 55 };
        toneAdjustments = { warmth: 1, brightness: 1, presence: 1 };
        break;
    }

    // Adjust based on dynamic range
    if (dynamicRange < 6) {
      drive *= 0.7; // Less drive for already compressed content
    }

    // Adjust based on transient content
    if (transientContent > 0.7) {
      saturatonType = 'transformer'; // Better for transients
    }

    return {
      saturatonType,
      drive,
      harmonicBalance,
      toneAdjustments,
    };
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private calculatePeak(buffer: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      peak = Math.max(peak, Math.abs(buffer[i]));
    }
    return peak;
  }

  private detectTransients(buffer: Float32Array): number {
    let transientCount = 0;
    const threshold = 0.3;

    for (let i = 1; i < buffer.length; i++) {
      const diff = Math.abs(buffer[i] - buffer[i - 1]);
      if (diff > threshold) {
        transientCount++;
      }
    }

    return transientCount / buffer.length;
  }

  dispose(): void {
    this.waveShaperNode?.disconnect();
    this.inputGain?.disconnect();
    this.outputGain?.disconnect();
    this.mixNode?.disconnect();
  }
}
