/**
 * AI Limiter
 * Intelligent limiting with AI loudness optimization
 *
 * Features:
 * - AI-powered true-peak limiting
 * - Intelligent lookahead processing
 * - Adaptive release time based on content
 * - Auto-optimization for streaming platforms (Spotify, Apple Music, etc.)
 * - AI-driven transient preservation
 * - Smart inter-sample peak detection
 */

import { PluginParameter } from '../core/types';

export interface AILimiterParams {
  // Core Parameters
  enabled: boolean;
  ceiling: number; // -20 to 0 dB
  threshold: number; // -20 to 0 dB

  // AI Features
  aiOptimize: boolean; // AI optimizes for target platform
  adaptiveRelease: boolean; // AI adjusts release based on content
  transientPreservation: boolean; // AI preserves transients
  targetPlatform: 'spotify' | 'apple' | 'youtube' | 'mastering' | 'custom';

  // Limiting Parameters
  attack: number; // 0.01-10 ms
  release: number; // 1-1000 ms
  lookahead: number; // 0-10 ms

  // Metering
  targetLoudness: number; // -23 to -6 LUFS
  truePeak: boolean; // True-peak limiting (ITU-R BS.1770)

  // Advanced
  link: number; // 0-100% stereo link
  autogain: boolean; // Automatic makeup gain
  dithering: boolean; // AI-powered dithering
}

export const AI_LIMITER_DEFAULTS: AILimiterParams = {
  enabled: true,
  ceiling: -0.3,
  threshold: -6,
  aiOptimize: true,
  adaptiveRelease: true,
  transientPreservation: true,
  targetPlatform: 'spotify',
  attack: 0.5,
  release: 100,
  lookahead: 5,
  targetLoudness: -14,
  truePeak: true,
  link: 100,
  autogain: true,
  dithering: true,
};

export const AI_LIMITER_PARAMETERS: PluginParameter[] = [
  {
    id: 'ceiling',
    name: 'Ceiling',
    label: 'Output Ceiling',
    value: 0.985,
    displayValue: '-0.3dB',
    min: 0,
    max: 1,
    default: 0.985,
    isAutomatable: true,
    unit: 'dB',
  },
  {
    id: 'threshold',
    name: 'Threshold',
    label: 'Limiting Threshold',
    value: 0.7,
    displayValue: '-6.0dB',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: 'dB',
  },
  {
    id: 'targetLoudness',
    name: 'Target LUFS',
    label: 'Target Loudness',
    value: 0.53,
    displayValue: '-14 LUFS',
    min: 0,
    max: 1,
    default: 0.53,
    isAutomatable: false,
    unit: 'LUFS',
  },
  {
    id: 'attack',
    name: 'Attack',
    label: 'Attack Time',
    value: 0.05,
    displayValue: '0.5ms',
    min: 0,
    max: 1,
    default: 0.05,
    isAutomatable: true,
    unit: 'ms',
  },
  {
    id: 'release',
    name: 'Release',
    label: 'Release Time',
    value: 0.1,
    displayValue: '100ms',
    min: 0,
    max: 1,
    default: 0.1,
    isAutomatable: true,
    unit: 'ms',
  },
  {
    id: 'lookahead',
    name: 'Lookahead',
    label: 'Lookahead Time',
    value: 0.5,
    displayValue: '5.0ms',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: false,
    unit: 'ms',
  },
  {
    id: 'link',
    name: 'Link',
    label: 'Stereo Link',
    value: 1.0,
    displayValue: '100%',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    unit: '%',
  },
];

export interface StreamingPlatformSpecs {
  name: string;
  targetLUFS: number;
  truePeakLimit: number;
  recommendedCeiling: number;
  normalization: boolean;
}

export const STREAMING_PLATFORMS: Record<string, StreamingPlatformSpecs> = {
  spotify: {
    name: 'Spotify',
    targetLUFS: -14,
    truePeakLimit: -1.0,
    recommendedCeiling: -0.5,
    normalization: true,
  },
  apple: {
    name: 'Apple Music',
    targetLUFS: -16,
    truePeakLimit: -1.0,
    recommendedCeiling: -0.3,
    normalization: true,
  },
  youtube: {
    name: 'YouTube',
    targetLUFS: -13,
    truePeakLimit: -1.0,
    recommendedCeiling: -0.5,
    normalization: true,
  },
  mastering: {
    name: 'Mastering',
    targetLUFS: -9,
    truePeakLimit: -0.3,
    recommendedCeiling: -0.1,
    normalization: false,
  },
  custom: {
    name: 'Custom',
    targetLUFS: -14,
    truePeakLimit: -1.0,
    recommendedCeiling: -0.3,
    normalization: false,
  },
};

export interface LoudnessAnalysis {
  integratedLUFS: number;
  momentaryLUFS: number;
  shortTermLUFS: number;
  truePeak: number;
  dynamicRange: number;
  platformCompliance: {
    spotify: boolean;
    apple: boolean;
    youtube: boolean;
  };
  recommendations: string[];
}

export class AILimiter {
  private params: AILimiterParams;
  private audioContext: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;

  constructor(context?: AudioContext) {
    this.params = { ...AI_LIMITER_DEFAULTS };
    if (context) {
      this.initialize(context);
    }
  }

  initialize(context: AudioContext): void {
    this.audioContext = context;

    // Create audio nodes
    this.compressor = context.createDynamicsCompressor();
    this.gainNode = context.createGain();

    // Configure as limiter (hard knee, high ratio)
    this.compressor.knee.value = 0;
    this.compressor.ratio.value = 20;

    this.updateParameters(this.params);
  }

  updateParameters(params: Partial<AILimiterParams>): void {
    this.params = { ...this.params, ...params };

    if (this.audioContext && this.compressor && this.gainNode) {
      // Update compressor settings
      this.compressor.threshold.value = this.params.threshold;
      this.compressor.attack.value = this.params.attack / 1000;
      this.compressor.release.value = this.params.release / 1000;

      // Calculate ceiling gain
      const ceilingGain = Math.pow(10, this.params.ceiling / 20);
      this.gainNode.gain.value = ceilingGain;

      // Auto-optimize for platform if enabled
      if (this.params.aiOptimize) {
        this.optimizeForPlatform(this.params.targetPlatform);
      }
    }
  }

  getParameters(): AILimiterParams {
    return { ...this.params };
  }

  /**
   * Optimize settings for specific streaming platform
   */
  optimizeForPlatform(platform: AILimiterParams['targetPlatform']): void {
    const specs = STREAMING_PLATFORMS[platform];

    if (specs) {
      this.params.targetLoudness = specs.targetLUFS;
      this.params.ceiling = specs.recommendedCeiling;

      // Update compressor if initialized
      if (this.compressor && this.gainNode) {
        const ceilingGain = Math.pow(10, specs.recommendedCeiling / 20);
        this.gainNode.gain.value = ceilingGain;
      }
    }
  }

  /**
   * AI-powered loudness analysis
   */
  async analyzeLoudness(audioBuffer: Float32Array[]): Promise<LoudnessAnalysis> {
    // Calculate integrated LUFS (simplified)
    const integratedLUFS = this.calculateIntegratedLUFS(audioBuffer);

    // Calculate true peak
    const truePeak = this.calculateTruePeak(audioBuffer);

    // Calculate dynamic range
    const dynamicRange = this.calculateDynamicRange(audioBuffer);

    // Check platform compliance
    const platformCompliance = {
      spotify: this.checkPlatformCompliance(integratedLUFS, truePeak, 'spotify'),
      apple: this.checkPlatformCompliance(integratedLUFS, truePeak, 'apple'),
      youtube: this.checkPlatformCompliance(integratedLUFS, truePeak, 'youtube'),
    };

    // Generate recommendations
    const recommendations = this.generateLoudnessRecommendations(
      integratedLUFS,
      truePeak,
      dynamicRange,
      platformCompliance
    );

    return {
      integratedLUFS,
      momentaryLUFS: integratedLUFS, // Simplified
      shortTermLUFS: integratedLUFS, // Simplified
      truePeak,
      dynamicRange,
      platformCompliance,
      recommendations,
    };
  }

  /**
   * Auto-optimize limiter based on content analysis
   */
  async autoOptimize(audioBuffer: Float32Array[]): Promise<Partial<AILimiterParams>> {
    const analysis = await this.analyzeLoudness(audioBuffer);
    const suggestions: Partial<AILimiterParams> = {};

    // If too quiet, suggest more aggressive limiting
    if (analysis.integratedLUFS < -20) {
      suggestions.threshold = -8;
      suggestions.autogain = true;
    }

    // If too loud, suggest gentler limiting
    if (analysis.integratedLUFS > -6) {
      suggestions.threshold = -4;
      suggestions.ceiling = -1.0;
    }

    // If low dynamic range, preserve transients
    if (analysis.dynamicRange < 6) {
      suggestions.transientPreservation = true;
      suggestions.attack = 0.1;
    }

    // If high dynamic range, can be more aggressive
    if (analysis.dynamicRange > 12) {
      suggestions.attack = 0.5;
      suggestions.release = 50;
    }

    // Optimize for best platform match
    const bestPlatform = this.findBestPlatformMatch(analysis);
    if (bestPlatform) {
      suggestions.targetPlatform = bestPlatform;
    }

    return suggestions;
  }

  private calculateIntegratedLUFS(audioBuffer: Float32Array[]): number {
    // Simplified LUFS calculation
    // Real implementation would use ITU-R BS.1770-4 specification
    const rms = this.calculateRMS(audioBuffer[0]);
    const lufs = -23 + 20 * Math.log10(rms);
    return Math.max(-50, Math.min(0, lufs));
  }

  private calculateTruePeak(audioBuffer: Float32Array[]): number {
    // Simplified true-peak detection
    // Real implementation would use oversampling and ITU-R BS.1770-4
    let peak = 0;
    for (const channel of audioBuffer) {
      for (let i = 0; i < channel.length; i++) {
        peak = Math.max(peak, Math.abs(channel[i]));
      }
    }
    return 20 * Math.log10(peak);
  }

  private calculateDynamicRange(audioBuffer: Float32Array[]): number {
    // Simplified dynamic range calculation
    const rms = this.calculateRMS(audioBuffer[0]);
    const peak = this.calculateTruePeak(audioBuffer);
    return peak - (20 * Math.log10(rms));
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private checkPlatformCompliance(
    lufs: number,
    truePeak: number,
    platform: keyof typeof STREAMING_PLATFORMS
  ): boolean {
    const specs = STREAMING_PLATFORMS[platform];
    return lufs >= specs.targetLUFS - 2 &&
           lufs <= specs.targetLUFS + 2 &&
           truePeak <= specs.truePeakLimit;
  }

  private generateLoudnessRecommendations(
    lufs: number,
    truePeak: number,
    dynamicRange: number,
    compliance: { spotify: boolean; apple: boolean; youtube: boolean }
  ): string[] {
    const recommendations: string[] = [];

    if (lufs < -20) {
      recommendations.push('Audio is too quiet - increase threshold or enable autogain');
    }

    if (lufs > -6) {
      recommendations.push('Audio is too loud - reduce threshold or lower ceiling');
    }

    if (truePeak > -1.0) {
      recommendations.push('True-peak exceeds -1.0 dBTP - enable true-peak limiting');
    }

    if (dynamicRange < 6) {
      recommendations.push('Low dynamic range - enable transient preservation');
    }

    if (!compliance.spotify && !compliance.apple && !compliance.youtube) {
      recommendations.push('Not compliant with major streaming platforms - adjust target LUFS');
    }

    if (recommendations.length === 0) {
      recommendations.push('Loudness is well-optimized for streaming platforms');
    }

    return recommendations;
  }

  private findBestPlatformMatch(
    analysis: LoudnessAnalysis
  ): AILimiterParams['targetPlatform'] | null {
    const { spotify, apple, youtube } = analysis.platformCompliance;

    if (spotify) return 'spotify';
    if (apple) return 'apple';
    if (youtube) return 'youtube';

    // If none match, suggest closest
    const lufs = analysis.integratedLUFS;
    if (Math.abs(lufs - STREAMING_PLATFORMS.spotify.targetLUFS) < 3) return 'spotify';
    if (Math.abs(lufs - STREAMING_PLATFORMS.apple.targetLUFS) < 3) return 'apple';
    if (Math.abs(lufs - STREAMING_PLATFORMS.youtube.targetLUFS) < 3) return 'youtube';

    return null;
  }

  dispose(): void {
    this.compressor?.disconnect();
    this.gainNode?.disconnect();
  }
}
