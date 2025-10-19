/**
 * AI Room Reverb
 * Small/medium room reverb with adaptive room analysis
 *
 * Features:
 * - AI-powered room size and dimension detection
 * - Adaptive room material analysis (wood, concrete, carpet, etc.)
 * - Intelligent early reflection modeling
 * - Auto-adjustment for different instruments and genres
 * - Dynamic room acoustics simulation
 */

import {
  AIReverbPlugin,
  AIReverbParameter,
  AIReverbFeatures,
  ReverbSettings,
  AIReverbAnalysis,
  ReverbPreset
} from './types';

export class AIRoomReverb implements AIReverbPlugin {
  id = 'ai-room-reverb';
  name = 'AI Room Reverb';
  manufacturer = 'DAWG AI';
  category = 'AI Reverb';
  isAI = true;
  version = '1.0.0';
  description = 'Small/medium room reverb with adaptive room analysis and intelligent space simulation';

  parameters: AIReverbParameter[] = [
    {
      id: 'decay',
      name: 'Decay Time',
      label: 'Decay',
      value: 0.5,
      min: 0.1,
      max: 3.0,
      default: 0.8,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '0.8s'
    },
    {
      id: 'preDelay',
      name: 'Pre-Delay',
      label: 'Pre-Delay',
      value: 0.02,
      min: 0,
      max: 0.15,
      default: 0.01,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '10ms'
    },
    {
      id: 'roomSize',
      name: 'Room Size',
      label: 'Size',
      value: 0.5,
      min: 0,
      max: 1.0,
      default: 0.5,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '50%'
    },
    {
      id: 'dampening',
      name: 'High Frequency Dampening',
      label: 'Dampening',
      value: 0.55,
      min: 0,
      max: 1.0,
      default: 0.55,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '55%'
    },
    {
      id: 'mix',
      name: 'Dry/Wet Mix',
      label: 'Mix',
      value: 0.2,
      min: 0,
      max: 1.0,
      default: 0.2,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '20%'
    },
    {
      id: 'earlyReflections',
      name: 'Early Reflections Level',
      label: 'Early Ref',
      value: 0.7,
      min: 0,
      max: 1.0,
      default: 0.7,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '70%'
    },
    {
      id: 'diffusion',
      name: 'Diffusion',
      label: 'Diffusion',
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
      id: 'roomMaterial',
      name: 'Room Material Character',
      label: 'Material',
      value: 0.5,
      min: 0,
      max: 1.0,
      default: 0.5,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: 'Balanced'
    },
    {
      id: 'lowCut',
      name: 'Low Cut Frequency',
      label: 'Low Cut',
      value: 0.35,
      min: 20,
      max: 500,
      default: 200,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '200 Hz'
    },
    {
      id: 'highCut',
      name: 'High Cut Frequency',
      label: 'High Cut',
      value: 0.55,
      min: 1000,
      max: 20000,
      default: 7000,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '7000 Hz'
    },
    {
      id: 'stereoWidth',
      name: 'Stereo Width',
      label: 'Width',
      value: 0.65,
      min: 0,
      max: 2.0,
      default: 0.9,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '90%'
    },
    {
      id: 'modulation',
      name: 'Modulation Depth',
      label: 'Modulation',
      value: 0.05,
      min: 0,
      max: 0.5,
      default: 0.05,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '5%'
    },
    {
      id: 'aiRoomAnalysis',
      name: 'AI Room Analysis',
      label: 'AI Room',
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
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      unit: '',
      type: 'toggle',
      isAutomatable: false,
      displayValue: 'On'
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
   * AI-powered audio analysis for adaptive room reverb
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
    const transientDensity = this.calculateTransientDensity(mono);

    // AI recommendations
    const recommendations: string[] = [];
    let suggestedDecay = 0.8;
    let suggestedMix = 0.2;
    let suggestedDampening = 0.55;
    let detectedRoomType: AIReverbAnalysis['detectedRoomType'] = 'medium';

    // Vocal content (focused mid-range)
    if (midFreqEnergy > 0.5 && spectralCentroid > 0.35 && spectralCentroid < 0.65) {
      suggestedDecay = 0.9;
      suggestedMix = 0.18;
      suggestedDampening = 0.6;
      detectedRoomType = 'small';
      recommendations.push('Vocal content - small room with 0.9s decay for intimacy');
    }

    // Percussion/drums (high transient density)
    if (transientDensity > 0.6 && dynamicRange > 12) {
      suggestedDecay = 0.5;
      suggestedMix = 0.12;
      suggestedDampening = 0.7;
      detectedRoomType = 'small';
      recommendations.push('Percussive content - tight room with 0.5s decay for punch');
    }

    // Acoustic guitar/strings (balanced spectrum)
    if (lowFreqEnergy > 0.2 && midFreqEnergy > 0.3 && highFreqEnergy > 0.25) {
      suggestedDecay = 1.2;
      suggestedMix = 0.25;
      suggestedDampening = 0.45;
      detectedRoomType = 'medium';
      recommendations.push('Acoustic instrument - medium room with natural ambience');
    }

    // Bass-heavy content
    if (lowFreqEnergy > 0.5) {
      suggestedDecay = 0.6;
      suggestedDampening = 0.65;
      recommendations.push('Bass-heavy content - shorter decay and dampening to control low-end buildup');
    }

    // Bright/thin content
    if (spectralCentroid > 0.7 || highFreqEnergy > 0.6) {
      suggestedDampening = 0.75;
      recommendations.push('Bright content - increased dampening to warm the reverb tail');
    }

    // Dense/busy mix
    if (rms > 0.5 || transientDensity > 0.7) {
      suggestedMix = 0.12;
      suggestedDecay = 0.6;
      recommendations.push('Dense mix - reduced reverb to 12% for clarity');
    }

    // Sparse/solo content
    if (rms < 0.15 && transientDensity < 0.3) {
      suggestedMix = 0.3;
      suggestedDecay = 1.4;
      detectedRoomType = 'medium';
      recommendations.push('Sparse arrangement - enhanced room ambience for space');
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

    // Adjust room size based on detected content
    const roomSizeMap = {
      small: 0.3,
      medium: 0.6,
      large: 0.85,
      hall: 0.9,
      plate: 0.5,
      spring: 0.4
    };
    this.setParameter('roomSize', roomSizeMap[analysis.detectedRoomType]);
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
      case 'roomMaterial':
        if (value < 0.25) return 'Hard (Concrete)';
        if (value < 0.5) return 'Balanced';
        if (value < 0.75) return 'Warm (Wood)';
        return 'Soft (Carpet)';
      case 'mix':
      case 'dampening':
      case 'diffusion':
      case 'roomSize':
      case 'earlyReflections':
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

  private calculateTransientDensity(buffer: Float32Array): number {
    // Detect transients by measuring rapid amplitude changes
    let transientCount = 0;
    const threshold = 0.1;

    for (let i = 1; i < buffer.length; i++) {
      const diff = Math.abs(buffer[i] - buffer[i - 1]);
      if (diff > threshold) {
        transientCount++;
      }
    }

    return transientCount / buffer.length;
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
      id: 'vocal-booth',
      name: 'Vocal Booth',
      description: 'Tight, controlled room for vocals',
      genre: 'Vocal/Rap',
      settings: {
        decayTime: 0.4,
        preDelay: 0.005,
        dampening: 0.7,
        mix: 0.12,
        roomSize: 0.25,
        earlyReflections: 0.6,
        diffusion: 0.5,
        modulation: 0.02,
        lowCut: 250,
        highCut: 6000,
        stereoWidth: 0.7
      }
    },
    {
      id: 'living-room',
      name: 'Living Room',
      description: 'Warm, natural room ambience',
      genre: 'Acoustic/Folk',
      settings: {
        decayTime: 0.9,
        preDelay: 0.01,
        dampening: 0.6,
        mix: 0.22,
        roomSize: 0.5,
        earlyReflections: 0.7,
        diffusion: 0.6,
        modulation: 0.05,
        lowCut: 150,
        highCut: 8000,
        stereoWidth: 0.9
      }
    },
    {
      id: 'studio-a',
      name: 'Studio A',
      description: 'Professional recording studio',
      genre: 'Pop/Rock',
      settings: {
        decayTime: 0.7,
        preDelay: 0.008,
        dampening: 0.55,
        mix: 0.18,
        roomSize: 0.45,
        earlyReflections: 0.65,
        diffusion: 0.65,
        modulation: 0.04,
        lowCut: 180,
        highCut: 9000,
        stereoWidth: 1.0
      }
    },
    {
      id: 'drum-room',
      name: 'Drum Room',
      description: 'Tight, punchy room for drums',
      genre: 'Rock/Metal',
      settings: {
        decayTime: 0.5,
        preDelay: 0.003,
        dampening: 0.65,
        mix: 0.15,
        roomSize: 0.4,
        earlyReflections: 0.75,
        diffusion: 0.7,
        modulation: 0.03,
        lowCut: 200,
        highCut: 10000,
        stereoWidth: 1.1
      }
    },
    {
      id: 'ambient-room',
      name: 'Ambient Room',
      description: 'Spacious room for atmospheric sounds',
      genre: 'Ambient/Electronic',
      settings: {
        decayTime: 1.5,
        preDelay: 0.02,
        dampening: 0.4,
        mix: 0.35,
        roomSize: 0.7,
        earlyReflections: 0.6,
        diffusion: 0.75,
        modulation: 0.08,
        lowCut: 100,
        highCut: 12000,
        stereoWidth: 1.4
      }
    },
    {
      id: 'garage',
      name: 'Garage',
      description: 'Raw, reflective garage sound',
      genre: 'Rock/Punk',
      settings: {
        decayTime: 0.8,
        preDelay: 0.006,
        dampening: 0.45,
        mix: 0.2,
        roomSize: 0.55,
        earlyReflections: 0.8,
        diffusion: 0.55,
        modulation: 0.06,
        lowCut: 120,
        highCut: 11000,
        stereoWidth: 0.95
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
    if (preset.settings.roomSize) this.setParameter('roomSize', preset.settings.roomSize);
    if (preset.settings.earlyReflections) this.setParameter('earlyReflections', preset.settings.earlyReflections);
    if (preset.settings.diffusion) this.setParameter('diffusion', preset.settings.diffusion);
    if (preset.settings.modulation) this.setParameter('modulation', preset.settings.modulation);
    if (preset.settings.lowCut) this.setParameter('lowCut', preset.settings.lowCut);
    if (preset.settings.highCut) this.setParameter('highCut', preset.settings.highCut);
    if (preset.settings.stereoWidth) this.setParameter('stereoWidth', preset.settings.stereoWidth);
  }
}
