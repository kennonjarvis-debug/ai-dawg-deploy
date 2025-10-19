/**
 * AI Spring Reverb
 * Vintage spring reverb with AI character enhancement
 *
 * Features:
 * - AI-powered spring character modeling (vintage to modern)
 * - Intelligent drip/boing effect simulation
 * - Adaptive spring tension and resonance
 * - Auto-adjustment for different instruments
 * - Dynamic spring noise and artifacts control
 */

import {
  AIReverbPlugin,
  AIReverbParameter,
  AIReverbFeatures,
  ReverbSettings,
  AIReverbAnalysis,
  ReverbPreset
} from './types';

export class AISpringReverb implements AIReverbPlugin {
  id = 'ai-spring-reverb';
  name = 'AI Spring Reverb';
  manufacturer = 'DAWG AI';
  category = 'AI Reverb';
  isAI = true;
  version = '1.0.0';
  description = 'Vintage spring reverb with AI character enhancement and intelligent spring modeling';

  parameters: AIReverbParameter[] = [
    {
      id: 'decay',
      name: 'Decay Time',
      label: 'Decay',
      value: 0.5,
      min: 0.1,
      max: 5.0,
      default: 1.5,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '1.5s'
    },
    {
      id: 'preDelay',
      name: 'Pre-Delay',
      label: 'Pre-Delay',
      value: 0.005,
      min: 0,
      max: 0.1,
      default: 0.005,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '5ms'
    },
    {
      id: 'springTension',
      name: 'Spring Tension',
      label: 'Tension',
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
      id: 'dampening',
      name: 'High Frequency Dampening',
      label: 'Dampening',
      value: 0.65,
      min: 0,
      max: 1.0,
      default: 0.65,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '65%'
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
      id: 'character',
      name: 'Spring Character',
      label: 'Character',
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
      id: 'drip',
      name: 'Drip Amount',
      label: 'Drip',
      value: 0.3,
      min: 0,
      max: 1.0,
      default: 0.3,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '30%'
    },
    {
      id: 'boing',
      name: 'Boing Effect',
      label: 'Boing',
      value: 0.25,
      min: 0,
      max: 1.0,
      default: 0.25,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '25%'
    },
    {
      id: 'springNoise',
      name: 'Spring Noise',
      label: 'Noise',
      value: 0.15,
      min: 0,
      max: 1.0,
      default: 0.15,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '15%'
    },
    {
      id: 'lowCut',
      name: 'Low Cut Frequency',
      label: 'Low Cut',
      value: 0.4,
      min: 20,
      max: 500,
      default: 250,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '250 Hz'
    },
    {
      id: 'highCut',
      name: 'High Cut Frequency',
      label: 'High Cut',
      value: 0.45,
      min: 1000,
      max: 20000,
      default: 5000,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '5000 Hz'
    },
    {
      id: 'stereoWidth',
      name: 'Stereo Width',
      label: 'Width',
      value: 0.5,
      min: 0,
      max: 2.0,
      default: 0.7,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '70%'
    },
    {
      id: 'modulation',
      name: 'Modulation Depth',
      label: 'Modulation',
      value: 0.2,
      min: 0,
      max: 1.0,
      default: 0.2,
      unit: '',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '20%'
    },
    {
      id: 'aiCharacterEnhance',
      name: 'AI Character Enhancement',
      label: 'AI Character',
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
      id: 'aiAutoMix',
      name: 'AI Auto-Mix Suggestions',
      label: 'AI Mix',
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
    intelligentDucking: false,
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
   * AI-powered audio analysis for adaptive spring reverb
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
    let suggestedDecay = 1.5;
    let suggestedMix = 0.3;
    let suggestedDampening = 0.65;
    let detectedRoomType: AIReverbAnalysis['detectedRoomType'] = 'spring';

    // Guitar content (classic spring reverb use case)
    if (lowFreqEnergy > 0.2 && midFreqEnergy > 0.3 && transientDensity > 0.3) {
      suggestedDecay = 1.8;
      suggestedMix = 0.35;
      suggestedDampening = 0.6;
      recommendations.push('Guitar detected - classic spring reverb with 1.8s decay and 35% mix');
      this.setParameter('drip', 0.4);
      this.setParameter('character', 0.4); // Vintage
    }

    // Vocals
    if (midFreqEnergy > 0.5 && spectralCentroid > 0.35 && spectralCentroid < 0.65) {
      suggestedDecay = 1.2;
      suggestedMix = 0.25;
      suggestedDampening = 0.7;
      recommendations.push('Vocal content - smooth spring with 1.2s decay and reduced drip');
      this.setParameter('drip', 0.2);
      this.setParameter('character', 0.6); // Modern
    }

    // Surf/rockabilly vibes (high transients)
    if (transientDensity > 0.6 && dynamicRange > 12) {
      suggestedDecay = 2.0;
      suggestedMix = 0.4;
      suggestedDampening = 0.55;
      recommendations.push('Percussive/surf sound - authentic spring with pronounced drip and boing');
      this.setParameter('drip', 0.5);
      this.setParameter('boing', 0.4);
      this.setParameter('character', 0.3); // Very vintage
    }

    // Organ/keys
    if (lowFreqEnergy > 0.25 && midFreqEnergy > 0.4 && transientDensity < 0.3) {
      suggestedDecay = 1.6;
      suggestedMix = 0.3;
      suggestedDampening = 0.6;
      recommendations.push('Keys/organ detected - warm spring reverb');
      this.setParameter('character', 0.5);
    }

    // Bass-heavy content
    if (lowFreqEnergy > 0.6) {
      suggestedDampening = 0.75;
      recommendations.push('Bass-heavy content - increased dampening to control low-end spring resonance');
    }

    // Bright/thin content
    if (spectralCentroid > 0.7 || highFreqEnergy > 0.6) {
      suggestedDampening = 0.8;
      recommendations.push('Bright content - high dampening for vintage lo-fi spring character');
    }

    // Dense mix
    if (rms > 0.5) {
      suggestedMix = 0.2;
      recommendations.push('Dense mix - reduced spring to 20% for clarity');
    }

    // Sparse/solo
    if (rms < 0.2) {
      suggestedMix = 0.45;
      suggestedDecay = 2.2;
      recommendations.push('Sparse arrangement - enhanced spring ambience');
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
      case 'character':
        if (value < 0.25) return 'Vintage 60s';
        if (value < 0.5) return 'Classic 70s';
        if (value < 0.75) return 'Modern';
        return 'Hi-Fi';
      case 'mix':
      case 'dampening':
      case 'springTension':
      case 'drip':
      case 'boing':
      case 'springNoise':
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
    let transientCount = 0;
    const threshold = 0.1;
    for (let i = 1; i < buffer.length; i++) {
      const diff = Math.abs(buffer[i] - buffer[i - 1]);
      if (diff > threshold) transientCount++;
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
      id: 'surf-guitar',
      name: 'Surf Guitar',
      description: 'Classic surf/rockabilly spring reverb',
      genre: 'Surf/Rockabilly',
      settings: {
        decayTime: 2.0,
        preDelay: 0.003,
        dampening: 0.55,
        mix: 0.45,
        character: 0.25,
        lowCut: 200,
        highCut: 4500,
        stereoWidth: 0.8
      }
    },
    {
      id: 'clean-guitar',
      name: 'Clean Guitar',
      description: 'Smooth spring for clean electric guitar',
      genre: 'Rock/Blues',
      settings: {
        decayTime: 1.6,
        preDelay: 0.005,
        dampening: 0.6,
        mix: 0.32,
        character: 0.4,
        lowCut: 220,
        highCut: 5500,
        stereoWidth: 0.9
      }
    },
    {
      id: 'vintage-vocal',
      name: 'Vintage Vocal',
      description: '60s style spring reverb for vocals',
      genre: 'Vintage/Doo-Wop',
      settings: {
        decayTime: 1.3,
        preDelay: 0.008,
        dampening: 0.7,
        mix: 0.28,
        character: 0.2,
        lowCut: 250,
        highCut: 4000,
        stereoWidth: 0.6
      }
    },
    {
      id: 'dub-spring',
      name: 'Dub Spring',
      description: 'Long, washy spring for dub effects',
      genre: 'Dub/Reggae',
      settings: {
        decayTime: 2.5,
        preDelay: 0.01,
        dampening: 0.5,
        mix: 0.5,
        character: 0.35,
        lowCut: 180,
        highCut: 6000,
        stereoWidth: 1.2
      }
    },
    {
      id: 'modern-spring',
      name: 'Modern Spring',
      description: 'Clean, hi-fi spring reverb',
      genre: 'Modern/Pop',
      settings: {
        decayTime: 1.4,
        preDelay: 0.006,
        dampening: 0.65,
        mix: 0.25,
        character: 0.75,
        lowCut: 200,
        highCut: 8000,
        stereoWidth: 1.0
      }
    },
    {
      id: 'amp-spring',
      name: 'Amp Spring',
      description: 'Authentic guitar amp spring tank',
      genre: 'Rock/Country',
      settings: {
        decayTime: 1.7,
        preDelay: 0.004,
        dampening: 0.6,
        mix: 0.35,
        character: 0.3,
        lowCut: 230,
        highCut: 5000,
        stereoWidth: 0.7
      }
    },
    {
      id: 'lo-fi-spring',
      name: 'Lo-Fi Spring',
      description: 'Grungy, degraded spring character',
      genre: 'Lo-Fi/Indie',
      settings: {
        decayTime: 1.8,
        preDelay: 0.007,
        dampening: 0.8,
        mix: 0.4,
        character: 0.15,
        lowCut: 280,
        highCut: 3500,
        stereoWidth: 0.65
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
    if (preset.settings.character) this.setParameter('character', preset.settings.character);
    if (preset.settings.lowCut) this.setParameter('lowCut', preset.settings.lowCut);
    if (preset.settings.highCut) this.setParameter('highCut', preset.settings.highCut);
    if (preset.settings.stereoWidth) this.setParameter('stereoWidth', preset.settings.stereoWidth);
  }
}
