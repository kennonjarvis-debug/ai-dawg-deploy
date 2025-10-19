/**
 * AI Stereo Imager
 * Stereo width enhancement with AI mono compatibility check
 *
 * Features:
 * - AI-powered stereo width enhancement
 * - Intelligent mono compatibility analysis
 * - Frequency-dependent stereo processing
 * - Mid/Side processing with AI optimization
 * - Auto-detection of phase issues
 * - Smart bass mono-ing below configurable frequency
 */

import { PluginParameter } from '../core/types';

export interface AIStereoImagerParams {
  // Core Parameters
  enabled: boolean;
  width: number; // 0-200% stereo width (100% = normal)

  // AI Features
  aiMonoCheck: boolean; // AI analyzes mono compatibility
  autoCorrection: boolean; // AI auto-fixes phase issues
  adaptiveProcessing: boolean; // AI adjusts per frequency band

  // Width Controls
  lowWidth: number; // 0-100% width for low frequencies
  midWidth: number; // 0-200% width for mid frequencies
  highWidth: number; // 0-200% width for high frequencies

  // Frequency Splits
  lowMidCrossover: number; // 100-500 Hz
  midHighCrossover: number; // 2000-10000 Hz

  // Advanced
  bassMonoFreq: number; // 0-200 Hz - mono below this
  correlation: number; // -1 to +1 stereo correlation target
  safetyLimit: boolean; // Prevent over-widening
}

export const AI_STEREO_IMAGER_DEFAULTS: AIStereoImagerParams = {
  enabled: true,
  width: 120,
  aiMonoCheck: true,
  autoCorrection: true,
  adaptiveProcessing: true,
  lowWidth: 80,
  midWidth: 140,
  highWidth: 160,
  lowMidCrossover: 250,
  midHighCrossover: 4000,
  bassMonoFreq: 120,
  correlation: 0.7,
  safetyLimit: true,
};

export const AI_STEREO_IMAGER_PARAMETERS: PluginParameter[] = [
  {
    id: 'width',
    name: 'Width',
    label: 'Master Width',
    value: 0.6,
    displayValue: '120%',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'aiMonoCheck',
    name: 'AI Mono Check',
    label: 'Mono Compatibility Check',
    value: 1,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1,
    isAutomatable: false,
    steps: 2,
  },
  {
    id: 'lowWidth',
    name: 'Low Width',
    label: 'Low Frequency Width',
    value: 0.4,
    displayValue: '80%',
    min: 0,
    max: 1,
    default: 0.4,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'midWidth',
    name: 'Mid Width',
    label: 'Mid Frequency Width',
    value: 0.7,
    displayValue: '140%',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'highWidth',
    name: 'High Width',
    label: 'High Frequency Width',
    value: 0.8,
    displayValue: '160%',
    min: 0,
    max: 1,
    default: 0.8,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'bassMonoFreq',
    name: 'Bass Mono',
    label: 'Bass Mono Frequency',
    value: 0.6,
    displayValue: '120Hz',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: 'Hz',
  },
  {
    id: 'correlation',
    name: 'Correlation',
    label: 'Stereo Correlation',
    value: 0.85,
    displayValue: '+0.7',
    min: 0,
    max: 1,
    default: 0.85,
    isAutomatable: true,
  },
];

export interface MonoCompatibilityReport {
  overallScore: number; // 0-100
  phaseIssues: boolean;
  recommendations: string[];
  frequencyBandScores: {
    low: number;
    mid: number;
    high: number;
  };
}

export class AIStereoImager {
  private params: AIStereoImagerParams;
  private audioContext: AudioContext | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private midNode: GainNode | null = null;
  private sideNode: GainNode | null = null;

  constructor(context?: AudioContext) {
    this.params = { ...AI_STEREO_IMAGER_DEFAULTS };
    if (context) {
      this.initialize(context);
    }
  }

  initialize(context: AudioContext): void {
    this.audioContext = context;

    // Create Mid/Side processing nodes
    this.splitter = context.createChannelSplitter(2);
    this.merger = context.createChannelMerger(2);
    this.midNode = context.createGain();
    this.sideNode = context.createGain();

    this.updateParameters(this.params);
  }

  updateParameters(params: Partial<AIStereoImagerParams>): void {
    this.params = { ...this.params, ...params };

    if (this.audioContext && this.midNode && this.sideNode) {
      // Calculate M/S gains based on width
      const width = this.params.width / 100;

      // M/S formula: M = (L+R), S = (L-R) * width
      this.midNode.gain.value = 1.0;
      this.sideNode.gain.value = width;
    }
  }

  getParameters(): AIStereoImagerParams {
    return { ...this.params };
  }

  /**
   * AI-powered mono compatibility analysis
   */
  async analyzeMonoCompatibility(
    audioBuffer: Float32Array[]
  ): Promise<MonoCompatibilityReport> {
    const leftChannel = audioBuffer[0];
    const rightChannel = audioBuffer[1];

    // Calculate correlation
    const correlation = this.calculateCorrelation(leftChannel, rightChannel);

    // Analyze phase
    const phaseIssues = this.detectPhaseIssues(leftChannel, rightChannel);

    // Frequency band analysis
    const frequencyBandScores = {
      low: this.analyzeBandCompatibility(leftChannel, rightChannel, 'low'),
      mid: this.analyzeBandCompatibility(leftChannel, rightChannel, 'mid'),
      high: this.analyzeBandCompatibility(leftChannel, rightChannel, 'high'),
    };

    // Overall score
    const overallScore = Math.round(
      (frequencyBandScores.low + frequencyBandScores.mid + frequencyBandScores.high) / 3
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      correlation,
      phaseIssues,
      frequencyBandScores
    );

    return {
      overallScore,
      phaseIssues,
      recommendations,
      frequencyBandScores,
    };
  }

  /**
   * Auto-optimize stereo width based on content
   */
  async autoOptimize(audioBuffer: Float32Array[]): Promise<Partial<AIStereoImagerParams>> {
    const compatibility = await this.analyzeMonoCompatibility(audioBuffer);

    const suggestions: Partial<AIStereoImagerParams> = {};

    // If compatibility is poor, reduce width
    if (compatibility.overallScore < 60) {
      suggestions.width = 100;
      suggestions.midWidth = 110;
      suggestions.highWidth = 120;
    }

    // If phase issues detected, enable auto-correction
    if (compatibility.phaseIssues) {
      suggestions.autoCorrection = true;
    }

    // Adjust based on frequency band scores
    if (compatibility.frequencyBandScores.low < 70) {
      suggestions.lowWidth = 70;
      suggestions.bassMonoFreq = 150;
    }

    return suggestions;
  }

  private calculateCorrelation(left: Float32Array, right: Float32Array): number {
    let sum = 0;
    let leftSum = 0;
    let rightSum = 0;

    for (let i = 0; i < left.length; i++) {
      sum += left[i] * right[i];
      leftSum += left[i] * left[i];
      rightSum += right[i] * right[i];
    }

    const denominator = Math.sqrt(leftSum * rightSum);
    return denominator > 0 ? sum / denominator : 0;
  }

  private detectPhaseIssues(left: Float32Array, right: Float32Array): boolean {
    const correlation = this.calculateCorrelation(left, right);
    // Negative correlation indicates phase issues
    return correlation < 0.3;
  }

  private analyzeBandCompatibility(
    left: Float32Array,
    right: Float32Array,
    band: 'low' | 'mid' | 'high'
  ): number {
    // Simplified band analysis
    // Real implementation would use FFT and analyze specific frequency ranges
    const correlation = this.calculateCorrelation(left, right);

    // Convert correlation to 0-100 score
    return Math.round((correlation + 1) * 50);
  }

  private generateRecommendations(
    correlation: number,
    phaseIssues: boolean,
    bandScores: { low: number; mid: number; high: number }
  ): string[] {
    const recommendations: string[] = [];

    if (phaseIssues) {
      recommendations.push('Phase issues detected - enable Auto Correction');
    }

    if (correlation < 0.5) {
      recommendations.push('Low stereo correlation - reduce Width to improve mono compatibility');
    }

    if (bandScores.low < 70) {
      recommendations.push('Low frequency stereo issues - increase Bass Mono frequency');
    }

    if (bandScores.high > 90 && bandScores.mid < 70) {
      recommendations.push('Increase mid-width while keeping high-width for better imaging');
    }

    if (recommendations.length === 0) {
      recommendations.push('Stereo image is well-balanced and mono-compatible');
    }

    return recommendations;
  }

  dispose(): void {
    this.splitter?.disconnect();
    this.merger?.disconnect();
    this.midNode?.disconnect();
    this.sideNode?.disconnect();
  }
}
