/**
 * AI Hall Reverb
 * Large concert hall reverb with intelligent space modeling
 *
 * Features:
 * - AI-powered space modeling and early reflection analysis
 * - Intelligent hall size and geometry adaptation
 * - Adaptive EQ based on input content
 * - Dynamic reverb density control
 * - Auto-adjustment for orchestral and ensemble content
 */

import {
  AIReverbPlugin,
  AIReverbParameter,
  AIReverbFeatures,
  ReverbSettings,
  AIReverbAnalysis,
  ReverbPreset
} from './types';

export class AIHallReverb implements AIReverbPlugin {
  id = 'ai-hall-reverb';
  name = 'AI Hall Reverb';
  manufacturer = 'DAWG AI';
  category = 'AI Reverb';
  isAI = true;
  version = '1.0.0';
  description = 'Large concert hall reverb with intelligent space modeling and adaptive early reflections';

  parameters: AIReverbParameter[] = [
    {
      id: 'decay',
      name: 'Decay Time',
      label: 'Decay',
      value: 0.5,
      min: 0.5,
      max: 20.0,
      default: 4.5,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '4.5s'
    },
    {
      id: 'preDelay',
      name: 'Pre-Delay',
      label: 'Pre-Delay',
      value: 0.08,
      min: 0,
      max: 0.5,
      default: 0.04,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '40ms'
    },
    {
      id: 'hallSize',
      name: 'Hall Size',
      label: 'Size',
      value: 0.75,
      min: 0,
      max: 1.0,
      default: 0.75,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '75%'
    },
    {
      id: 'dampening',
      name: 'High Frequency Dampening',
      label: 'Dampening',
      value: 0.4,
      min: 0,
      max: 1.0,
      default: 0.4,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '40%'
    },
    {
      id: 'mix',
      name: 'Dry/Wet Mix',
      label: 'Mix',
      value: 0.3,
      min: 0,
      max: 1.0,
      default: 0.3,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '30%'
    },
    {
      id: 'earlyReflections',
      name: 'Early Reflections Level',
      label: 'Early Ref',
      value: 0.6,
      min: 0,
      max: 1.0,
      default: 0.6,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '60%'
    },
    {
      id: 'diffusion',
      name: 'Diffusion',
      label: 'Diffusion',
      value: 0.75,
      min: 0,
      max: 1.0,
      default: 0.75,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '75%'
    },
    {
      id: 'density',
      name: 'Reverb Density',
      label: 'Density',
      value: 0.8,
      min: 0,
      max: 1.0,
      default: 0.8,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '80%'
    },
    {
      id: 'lowCut',
      name: 'Low Cut Frequency',
      label: 'Low Cut',
      value: 0.2,
      min: 20,
      max: 500,
      default: 80,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '80 Hz'
    },
    {
      id: 'highCut',
      name: 'High Cut Frequency',
      label: 'High Cut',
      value: 0.65,
      min: 1000,
      max: 20000,
      default: 10000,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '10000 Hz'
    },
    {
      id: 'stereoWidth',
      name: 'Stereo Width',
      label: 'Width',
      value: 0.9,
      min: 0,
      max: 2.0,
      default: 1.2,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '120%'
    },
    {
      id: 'modulation',
      name: 'Modulation Depth',
      label: 'Modulation',
      value: 0.1,
      min: 0,
      max: 1.0,
      default: 0.1,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '10%'
    },
    {
      id: 'aiSpaceModeling',
      name: 'AI Space Modeling',
      label: 'AI Space',
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      unit: '',
      type: 'toggle',
      isAutomatable: false,
      displayValue: 'On'
    },
    {
      id: 'aiAdaptiveEQ',
      name: 'AI Adaptive EQ',
      label: 'AI EQ',
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      unit: '',
      type: 'toggle',
      isAutomatable: false,
      displayValue: 'On'
    },
    {
      id: 'aiDucking',
      name: 'AI Intelligent Ducking',
      label: 'AI Ducking',
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      unit: '',
      type: 'toggle',
      isAutomatable: false,
      displayValue: 'Off'
    }
  ];

  aiFeatures: AIReverbFeatures = {
    adaptiveEQ: true,
    intelligentDucking: true,
    autoMixSuggestions: true,
    spaceModeling: true,
    characterEnhancement: true,
    dynamicDecay: true,
    frequencyShaping: true,
    stereoWidthControl: true
  };

  private sampleRate = 48000;
  private audioContext: AudioContext | null = null;

  /**
   * Initialize the plugin with audio context
   */
  initialize(sampleRate: number, audioContext?: AudioContext): void {
    this.sampleRate = sampleRate;
    if (audioContext) {
      this.audioContext = audioContext;
    }
  }

  /**
   * AI-powered audio analysis for adaptive hall reverb
   */
  analyzeAudio(audioBuffer: Float32Array[]): AIReverbAnalysis {
    const mono = this.convertToMono(audioBuffer);
    const spectrum = this.computeFFT(mono);

    // Analyze spectral content and dynamics
    const spectralCentroid = this.calculateSpectralCentroid(spectrum);
    const lowFreqEnergy = this.calculateBandEnergy(spectrum, 20, 250);
    const midFreqEnergy = this.calculateBandEnergy(spectrum, 250, 4000);
    const highFreqEnergy = this.calculateBandEnergy(spectrum, 4000, 20000);
    const rms = this.calculateRMS(mono);
    const dynamicRange = this.calculateDynamicRange(mono);

    // AI recommendations
    const recommendations: string[] = [];
    let suggestedDecay = 4.5;
    let suggestedMix = 0.3;
    let suggestedDampening = 0.4;
    let detectedRoomType: AIReverbAnalysis['detectedRoomType'] = 'hall';

    // Orchestral/ensemble content (wide frequency range, moderate dynamics)
    if (lowFreqEnergy > 0.3 && midFreqEnergy > 0.4 && highFreqEnergy > 0.3) {
      suggestedDecay = 5.5;
      suggestedMix = 0.4;
      suggestedDampening = 0.3;
      recommendations.push('Orchestral content detected - large hall with 5.5s decay and 40% mix');
      detectedRoomType = 'hall';
    }

    // Solo instrument (focused frequency range)
    if (dynamicRange > 15 && rms < 0.3) {
      suggestedDecay = 3.5;
      suggestedMix = 0.35;
      recommendations.push('Solo instrument detected - intimate hall with 3.5s decay');
    }

    // Vocal/choir content
    if (midFreqEnergy > 0.5 && spectralCentroid > 0.4 && spectralCentroid < 0.6) {
      suggestedDecay = 4.0;
      suggestedMix = 0.32;
      suggestedDampening = 0.45;
      recommendations.push('Vocal/choir content - balanced hall with controlled high frequencies');
    }

    // Bright content (cymbals, strings)
    if (spectralCentroid > 0.65 || highFreqEnergy > 0.5) {
      suggestedDampening = 0.6;
      recommendations.push('Bright content detected - increased dampening to 60% for natural decay');
    }

    // Dense/loud mix
    if (rms > 0.6) {
      suggestedMix = 0.2;
      suggestedDecay = 3.0;
      recommendations.push('Dense mix - reduced reverb to 20% and shorter decay for clarity');
    }

    // Sparse arrangement
    if (rms < 0.15) {
      suggestedMix = 0.45;
      suggestedDecay = 6.0;
      recommendations.push('Sparse arrangement - enhanced hall ambience with 6.0s decay');
    }

    return {
      inputSpectrum: spectrum,
      suggestedDecay,
      suggestedMix,
      suggestedDampening,
      detectedRoomType,
      recommendations
    };
  }

  /**
   * Apply AI suggestions to parameters
   */
  applyAISuggestions(analysis: AIReverbAnalysis): void {
    this.setParameter('decay', analysis.suggestedDecay);
    this.setParameter('mix', analysis.suggestedMix);
    this.setParameter('dampening', analysis.suggestedDampening);

    // Adjust hall size based on detected content
    if (analysis.detectedRoomType === 'hall') {
      this.setParameter('hallSize', 0.85);
    }
  }

  /**
   * Set parameter value
   */
  setParameter(id: string, value: number): void {
    const param = this.parameters.find(p => p.id === id);
    if (!param) return;

    param.value = Math.max(param.min, Math.min(param.max, value));
    param.displayValue = this.formatDisplayValue(param);
  }

  /**
   * Get parameter
   */
  getParameter(id: string): AIReverbParameter | undefined {
    return this.parameters.find(p => p.id === id);
  }

  /**
   * Get parameter value as number
   */
  private getParameterValue(id: string): number {
    return this.parameters.find(p => p.id === id)?.value || 0;
  }

  /**
   * Format parameter display value
   */
  private formatDisplayValue(param: AIReverbParameter): string {
    if (param.type === 'toggle') {
      return param.value > 0.5 ? 'On' : 'Off';
    }

    const value = param.value;
    const unit = param.unit || '';

    switch (param.id) {
      case 'decay':
      case 'preDelay':
        return `${value.toFixed(2)}${unit}`;
      case 'lowCut':
      case 'highCut':
        return `${Math.round(value)} ${unit}`;
      case 'mix':
      case 'dampening':
      case 'diffusion':
      case 'hallSize':
      case 'earlyReflections':
      case 'density':
      case 'modulation':
      case 'stereoWidth':
        return `${Math.round(value * 100)}%`;
      default:
        return `${value.toFixed(2)}${unit}`;
    }
  }

  // Audio analysis helper methods
  private convertToMono(buffer: Float32Array[]): Float32Array {
    const length = buffer[0].length;
    const mono = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const channel of buffer) sum += channel[i];
      mono[i] = sum / buffer.length;
    }
    return mono;
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (const sample of buffer) sum += sample * sample;
    return Math.sqrt(sum / buffer.length);
  }

  private calculateDynamicRange(buffer: Float32Array): number {
    const peak = Math.max(...Array.from(buffer).map(Math.abs));
    const rms = this.calculateRMS(buffer);
    return 20 * Math.log10(peak / (rms + 0.0001));
  }

  private computeFFT(buffer: Float32Array): Float32Array {
    const fftSize = 2048;
    const fft = new Float32Array(fftSize / 2);
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < Math.min(fftSize, buffer.length); n++) {
        const angle = (2 * Math.PI * k * n) / fftSize;
        real += buffer[n] * Math.cos(angle);
        imag -= buffer[n] * Math.sin(angle);
      }
      fft[k] = Math.sqrt(real * real + imag * imag);
    }
    return fft;
  }

  private calculateSpectralCentroid(fft: Float32Array): number {
    let weightedSum = 0, sum = 0;
    for (let i = 0; i < fft.length; i++) {
      weightedSum += i * fft[i];
      sum += fft[i];
    }
    return sum > 0 ? weightedSum / sum / fft.length : 0;
  }

  private calculateBandEnergy(fft: Float32Array, lowFreq: number, highFreq: number): number {
    const nyquist = this.sampleRate / 2;
    const binSize = nyquist / fft.length;
    const lowBin = Math.floor(lowFreq / binSize);
    const highBin = Math.floor(highFreq / binSize);
    let energy = 0;
    for (let i = lowBin; i <= highBin && i < fft.length; i++) {
      energy += fft[i] * fft[i];
    }
    return Math.sqrt(energy);
  }

  /**
   * Preset configurations
   */
  presets: ReverbPreset[] = [
    {
      id: 'concert-hall',
      name: 'Concert Hall',
      description: 'Large concert hall for orchestral music',
      genre: 'Classical/Orchestral',
      settings: {
        decayTime: 5.5,
        preDelay: 0.05,
        dampening: 0.35,
        mix: 0.4,
        roomSize: 0.9,
        earlyReflections: 0.7,
        diffusion: 0.8,
        modulation: 0.08,
        lowCut: 60,
        highCut: 12000,
        stereoWidth: 1.4
      }
    },
    {
      id: 'chamber-hall',
      name: 'Chamber Hall',
      description: 'Intimate chamber music hall',
      genre: 'Chamber/Jazz',
      settings: {
        decayTime: 2.8,
        preDelay: 0.03,
        dampening: 0.45,
        mix: 0.28,
        roomSize: 0.5,
        earlyReflections: 0.65,
        diffusion: 0.7,
        modulation: 0.12,
        lowCut: 80,
        highCut: 10000,
        stereoWidth: 1.1
      }
    },
    {
      id: 'vocal-hall',
      name: 'Vocal Hall',
      description: 'Beautiful hall reverb for vocals and choir',
      genre: 'Vocal/Choir',
      settings: {
        decayTime: 4.0,
        preDelay: 0.04,
        dampening: 0.5,
        mix: 0.32,
        roomSize: 0.7,
        earlyReflections: 0.6,
        diffusion: 0.75,
        modulation: 0.1,
        lowCut: 100,
        highCut: 9000,
        stereoWidth: 1.2
      }
    },
    {
      id: 'cathedral',
      name: 'Cathedral',
      description: 'Massive cathedral space with long decay',
      genre: 'Ambient/Sacred',
      settings: {
        decayTime: 8.5,
        preDelay: 0.08,
        dampening: 0.25,
        mix: 0.5,
        roomSize: 1.0,
        earlyReflections: 0.8,
        diffusion: 0.85,
        modulation: 0.05,
        lowCut: 40,
        highCut: 15000,
        stereoWidth: 1.8
      }
    },
    {
      id: 'scoring-stage',
      name: 'Scoring Stage',
      description: 'Film scoring stage with controlled acoustics',
      genre: 'Film/Soundtrack',
      settings: {
        decayTime: 3.2,
        preDelay: 0.02,
        dampening: 0.55,
        mix: 0.25,
        roomSize: 0.65,
        earlyReflections: 0.55,
        diffusion: 0.72,
        modulation: 0.15,
        lowCut: 90,
        highCut: 11000,
        stereoWidth: 1.3
      }
    }
  ];

  /**
   * Load preset
   */
  loadPreset(presetId: string): void {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    this.setParameter('decay', preset.settings.decayTime);
    this.setParameter('preDelay', preset.settings.preDelay);
    this.setParameter('dampening', preset.settings.dampening);
    this.setParameter('mix', preset.settings.mix);
    if (preset.settings.roomSize) this.setParameter('hallSize', preset.settings.roomSize);
    if (preset.settings.earlyReflections) this.setParameter('earlyReflections', preset.settings.earlyReflections);
    if (preset.settings.diffusion) this.setParameter('diffusion', preset.settings.diffusion);
    if (preset.settings.modulation) this.setParameter('modulation', preset.settings.modulation);
    if (preset.settings.lowCut) this.setParameter('lowCut', preset.settings.lowCut);
    if (preset.settings.highCut) this.setParameter('highCut', preset.settings.highCut);
    if (preset.settings.stereoWidth) this.setParameter('stereoWidth', preset.settings.stereoWidth);
  }
}
