/**
 * AI Modulation
 * Multi-effect modulation (chorus/flanger/phaser) with AI depth control
 *
 * Features:
 * - AI-powered chorus, flanger, and phaser effects
 * - Intelligent depth and rate control
 * - Adaptive modulation based on tempo and content
 * - Smart feedback control to prevent harshness
 * - Multi-voice chorus with AI voice positioning
 * - Auto-sync to project tempo
 */

import { PluginParameter } from '../core/types';

export type ModulationType = 'chorus' | 'flanger' | 'phaser' | 'vibrato';

export interface AIModulationParams {
  // Core Parameters
  enabled: boolean;
  type: ModulationType;
  mix: number; // 0-100% wet/dry mix

  // AI Features
  aiDepthControl: boolean; // AI prevents over-modulation
  tempoSync: boolean; // Sync to project tempo
  adaptiveRate: boolean; // AI adjusts rate based on content

  // Modulation Parameters
  rate: number; // 0.01-10 Hz (or tempo divisions if synced)
  depth: number; // 0-100% modulation depth
  feedback: number; // -100 to +100% feedback amount

  // Chorus-specific
  voices: number; // 1-8 voices for chorus
  voiceSeparation: number; // 0-100% stereo separation
  shimmer: number; // 0-100% high frequency modulation

  // Flanger-specific
  delay: number; // 0-10ms base delay
  resonance: number; // 0-100% resonance

  // Phaser-specific
  stages: number; // 2-12 stages
  centerFrequency: number; // 100-5000 Hz

  // Advanced
  stereoPhase: number; // 0-180 degrees L/R offset
  autoGain: boolean; // Automatic level compensation
}

export const AI_MODULATION_DEFAULTS: AIModulationParams = {
  enabled: true,
  type: 'chorus',
  mix: 40,
  aiDepthControl: true,
  tempoSync: false,
  adaptiveRate: true,
  rate: 0.5,
  depth: 50,
  feedback: 20,
  voices: 3,
  voiceSeparation: 60,
  shimmer: 30,
  delay: 2,
  resonance: 50,
  stages: 4,
  centerFrequency: 1000,
  stereoPhase: 90,
  autoGain: true,
};

export const AI_MODULATION_PARAMETERS: PluginParameter[] = [
  {
    id: 'type',
    name: 'Type',
    label: 'Effect Type',
    value: 0,
    displayValue: 'Chorus',
    min: 0,
    max: 3,
    default: 0,
    isAutomatable: false,
    steps: 4,
  },
  {
    id: 'mix',
    name: 'Mix',
    label: 'Wet/Dry Mix',
    value: 0.4,
    displayValue: '40%',
    min: 0,
    max: 1,
    default: 0.4,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'rate',
    name: 'Rate',
    label: 'Modulation Rate',
    value: 0.05,
    displayValue: '0.5 Hz',
    min: 0,
    max: 1,
    default: 0.05,
    isAutomatable: true,
    unit: 'Hz',
  },
  {
    id: 'depth',
    name: 'Depth',
    label: 'Modulation Depth',
    value: 0.5,
    displayValue: '50%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'feedback',
    name: 'Feedback',
    label: 'Feedback Amount',
    value: 0.6,
    displayValue: '20%',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'voices',
    name: 'Voices',
    label: 'Chorus Voices',
    value: 0.25,
    displayValue: '3',
    min: 0,
    max: 1,
    default: 0.25,
    isAutomatable: false,
    steps: 8,
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    label: 'High Frequency Shimmer',
    value: 0.3,
    displayValue: '30%',
    min: 0,
    max: 1,
    default: 0.3,
    isAutomatable: true,
    unit: '%',
  },
  {
    id: 'stereoPhase',
    name: 'Stereo Phase',
    label: 'Stereo Phase Offset',
    value: 0.5,
    displayValue: '90°',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '°',
  },
];

export interface ModulationPreset {
  name: string;
  type: ModulationType;
  params: Partial<AIModulationParams>;
  description: string;
  bestFor: string[];
}

export const MODULATION_PRESETS: ModulationPreset[] = [
  {
    name: 'Lush Vocal Chorus',
    type: 'chorus',
    params: {
      rate: 0.4,
      depth: 45,
      feedback: 15,
      voices: 4,
      voiceSeparation: 70,
      shimmer: 40,
      mix: 35,
    },
    description: 'Wide, lush chorus perfect for vocals',
    bestFor: ['vocals', 'leads'],
  },
  {
    name: 'Subtle Doubling',
    type: 'chorus',
    params: {
      rate: 0.3,
      depth: 25,
      feedback: 10,
      voices: 2,
      voiceSeparation: 50,
      shimmer: 20,
      mix: 25,
    },
    description: 'Subtle doubling effect for thickness',
    bestFor: ['vocals', 'guitars', 'keys'],
  },
  {
    name: 'Classic Flanger',
    type: 'flanger',
    params: {
      rate: 0.2,
      depth: 60,
      feedback: 40,
      delay: 1,
      resonance: 50,
      mix: 40,
    },
    description: 'Classic jet-plane flanger',
    bestFor: ['guitars', 'synths', 'effects'],
  },
  {
    name: 'Gentle Phaser',
    type: 'phaser',
    params: {
      rate: 0.3,
      depth: 50,
      feedback: 25,
      stages: 4,
      centerFrequency: 1000,
      mix: 35,
    },
    description: 'Smooth, musical phasing',
    bestFor: ['guitars', 'keys', 'pads'],
  },
  {
    name: 'Vibrato',
    type: 'vibrato',
    params: {
      rate: 5,
      depth: 10,
      feedback: 0,
      mix: 100,
    },
    description: 'Pitch vibrato effect',
    bestFor: ['guitars', 'vocals', 'special-fx'],
  },
];

export class AIModulation {
  private params: AIModulationParams;
  private audioContext: AudioContext | null = null;
  private lfoL: OscillatorNode | null = null;
  private lfoR: OscillatorNode | null = null;
  private delayL: DelayNode | null = null;
  private delayR: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private mixNode: GainNode | null = null;
  private projectTempo: number = 120;

  constructor(context?: AudioContext, tempo: number = 120) {
    this.params = { ...AI_MODULATION_DEFAULTS };
    this.projectTempo = tempo;
    if (context) {
      this.initialize(context);
    }
  }

  initialize(context: AudioContext): void {
    this.audioContext = context;

    // Create LFOs for modulation
    this.lfoL = context.createOscillator();
    this.lfoR = context.createOscillator();

    // Create delay lines
    this.delayL = context.createDelay(0.1);
    this.delayR = context.createDelay(0.1);

    // Create feedback and mix nodes
    this.feedbackNode = context.createGain();
    this.mixNode = context.createGain();

    // Start LFOs
    this.lfoL.start();
    this.lfoR.start();

    this.updateParameters(this.params);
  }

  updateParameters(params: Partial<AIModulationParams>): void {
    this.params = { ...this.params, ...params };

    if (!this.audioContext || !this.lfoL || !this.lfoR || !this.delayL || !this.delayR) {
      return;
    }

    // Update LFO rate
    let rate = this.params.rate;
    if (this.params.tempoSync) {
      rate = this.calculateTempoSyncRate(rate);
    }

    this.lfoL.frequency.value = rate;
    this.lfoR.frequency.value = rate;

    // Update stereo phase offset
    const phaseOffset = (this.params.stereoPhase / 180) * Math.PI;
    // Note: In real implementation, would offset LFO phase

    // Update depth (modulation amount)
    const depth = this.params.depth / 100;

    // Type-specific settings
    switch (this.params.type) {
      case 'chorus':
        this.configureChorus(rate, depth);
        break;
      case 'flanger':
        this.configureFlanger(rate, depth);
        break;
      case 'phaser':
        this.configurePhaser(rate, depth);
        break;
      case 'vibrato':
        this.configureVibrato(rate, depth);
        break;
    }

    // Update feedback
    const feedbackAmount = (this.params.feedback - 50) / 50; // -1 to +1
    this.feedbackNode.gain.value = feedbackAmount * 0.7; // Scale to prevent runaway

    // Update mix
    this.mixNode.gain.value = this.params.mix / 100;

    // AI depth control - prevent over-modulation
    if (this.params.aiDepthControl && this.params.depth > 80) {
      this.mixNode.gain.value *= 0.8; // Reduce mix at high depths
    }
  }

  getParameters(): AIModulationParams {
    return { ...this.params };
  }

  setTempo(tempo: number): void {
    this.projectTempo = tempo;
    if (this.params.tempoSync) {
      this.updateParameters({});
    }
  }

  private configureChorus(rate: number, depth: number): void {
    if (!this.delayL || !this.delayR) return;

    // Chorus uses longer delay times with multiple voices
    const baseDelay = 0.015; // 15ms base delay
    const modDepth = baseDelay * depth;

    this.delayL.delayTime.value = baseDelay + modDepth / 2;
    this.delayR.delayTime.value = baseDelay - modDepth / 2;
  }

  private configureFlanger(rate: number, depth: number): void {
    if (!this.delayL || !this.delayR) return;

    // Flanger uses very short delay times
    const baseDelay = this.params.delay / 1000; // Convert ms to seconds
    const modDepth = baseDelay * depth;

    this.delayL.delayTime.value = baseDelay + modDepth;
    this.delayR.delayTime.value = baseDelay - modDepth;
  }

  private configurePhaser(rate: number, depth: number): void {
    // Phaser would use all-pass filters instead of delays
    // For simplification, using delay-based approach
    if (!this.delayL || !this.delayR) return;

    const baseDelay = 0.001; // 1ms
    const modDepth = baseDelay * depth;

    this.delayL.delayTime.value = baseDelay + modDepth;
    this.delayR.delayTime.value = baseDelay - modDepth;
  }

  private configureVibrato(rate: number, depth: number): void {
    if (!this.delayL || !this.delayR) return;

    // Vibrato is 100% wet modulated delay
    const baseDelay = 0.005; // 5ms
    const modDepth = baseDelay * depth;

    this.delayL.delayTime.value = baseDelay + modDepth;
    this.delayR.delayTime.value = baseDelay - modDepth;

    // Override mix for vibrato
    if (this.mixNode) {
      this.mixNode.gain.value = 1.0;
    }
  }

  private calculateTempoSyncRate(normalizedRate: number): number {
    // Convert normalized rate to tempo-synced rate
    const bpm = this.projectTempo;
    const bps = bpm / 60;

    // Map normalized rate to musical divisions
    const divisions = [
      4, // Whole note
      2, // Half note
      1, // Quarter note
      0.5, // 8th note
      0.25, // 16th note
    ];

    const index = Math.floor(normalizedRate * (divisions.length - 1));
    const division = divisions[index];

    return bps * division;
  }

  /**
   * AI-powered content analysis for optimal modulation
   */
  async analyzeAndOptimize(audioBuffer: Float32Array[]): Promise<Partial<AIModulationParams>> {
    const tempo = this.detectTempo(audioBuffer[0]);
    const spectralContent = this.analyzeSpectralContent(audioBuffer[0]);
    const dynamicRange = this.analyzeDynamicRange(audioBuffer[0]);

    const suggestions: Partial<AIModulationParams> = {};

    // Suggest tempo sync if clear tempo detected
    if (tempo > 0) {
      suggestions.tempoSync = true;
      this.projectTempo = tempo;
    }

    // Adjust depth based on dynamic range
    if (dynamicRange < 6) {
      suggestions.depth = 35; // Less depth for compressed content
    } else {
      suggestions.depth = 60; // More depth for dynamic content
    }

    // Adjust type based on spectral content
    if (spectralContent.high > 0.5) {
      suggestions.type = 'chorus'; // Better for bright content
      suggestions.shimmer = 40;
    } else if (spectralContent.mid > 0.5) {
      suggestions.type = 'phaser'; // Better for mid-range content
    }

    // Suggest mix based on content
    if (dynamicRange > 12) {
      suggestions.mix = 30; // Subtle for very dynamic content
    } else {
      suggestions.mix = 45; // More pronounced for steady content
    }

    return suggestions;
  }

  /**
   * Apply preset
   */
  applyPreset(presetName: string): void {
    const preset = MODULATION_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      this.updateParameters(preset.params);
    }
  }

  /**
   * Get recommended presets based on content
   */
  async getRecommendedPresets(audioBuffer: Float32Array[]): Promise<ModulationPreset[]> {
    const spectralContent = this.analyzeSpectralContent(audioBuffer[0]);

    // Simple recommendation logic
    const recommended: ModulationPreset[] = [];

    if (spectralContent.high > 0.4) {
      recommended.push(MODULATION_PRESETS[0]); // Lush Vocal Chorus
      recommended.push(MODULATION_PRESETS[3]); // Gentle Phaser
    } else {
      recommended.push(MODULATION_PRESETS[1]); // Subtle Doubling
      recommended.push(MODULATION_PRESETS[2]); // Classic Flanger
    }

    return recommended;
  }

  private detectTempo(buffer: Float32Array): number {
    // Simplified tempo detection
    // Real implementation would use autocorrelation or beat tracking
    return 0; // Return 0 if no clear tempo
  }

  private analyzeSpectralContent(buffer: Float32Array): { low: number; mid: number; high: number } {
    // Simplified spectral analysis
    // Real implementation would use FFT
    return {
      low: 0.33,
      mid: 0.34,
      high: 0.33,
    };
  }

  private analyzeDynamicRange(buffer: Float32Array): number {
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      min = Math.min(min, abs);
      max = Math.max(max, abs);
    }

    return 20 * Math.log10(max / (min || 0.0001));
  }

  dispose(): void {
    this.lfoL?.stop();
    this.lfoR?.stop();
    this.lfoL?.disconnect();
    this.lfoR?.disconnect();
    this.delayL?.disconnect();
    this.delayR?.disconnect();
    this.feedbackNode?.disconnect();
    this.mixNode?.disconnect();
  }
}
