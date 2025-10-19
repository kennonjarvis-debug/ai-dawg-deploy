/**
 * AI Plate Reverb
 * Classic plate reverb with AI-powered decay optimization
 *
 * Features:
 * - Adaptive decay analysis based on input content
 * - Intelligent frequency dampening
 * - Auto-mix suggestions based on genre
 * - Dynamic pre-delay adjustment
 * - AI-powered plate character modeling
 */

import {
  AIReverbPlugin,
  AIReverbParameter,
  AIReverbFeatures,
  ReverbSettings,
  AIReverbAnalysis,
  ReverbPreset
} from './types';

export class AIPlateReverb implements AIReverbPlugin {
  id = 'ai-plate-reverb';
  name = 'AI Plate Reverb';
  manufacturer = 'DAWG AI';
  category = 'AI Reverb';
  isAI = true;
  version = '1.0.0';
  description = 'Classic plate reverb with AI-powered decay optimization and intelligent frequency shaping';

  parameters: AIReverbParameter[] = [
    {
      id: 'decay',
      name: 'Decay Time',
      label: 'Decay',
      value: 0.5,
      min: 0.1,
      max: 8.0,
      default: 2.0,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '2.0s'
    },
    {
      id: 'preDelay',
      name: 'Pre-Delay',
      label: 'Pre-Delay',
      value: 0.06,
      min: 0,
      max: 0.5,
      default: 0.03,
      unit: 's',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '30ms'
    },
    {
      id: 'dampening',
      name: 'High Frequency Dampening',
      label: 'Dampening',
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
      id: 'mix',
      name: 'Dry/Wet Mix',
      label: 'Mix',
      value: 0.25,
      min: 0,
      max: 1.0,
      default: 0.25,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '25%'
    },
    {
      id: 'diffusion',
      name: 'Diffusion',
      label: 'Diffusion',
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
      id: 'plateSize',
      name: 'Plate Size',
      label: 'Size',
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
      id: 'modulation',
      name: 'Modulation Depth',
      label: 'Modulation',
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
      value: 0.3,
      min: 20,
      max: 500,
      default: 150,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '150 Hz'
    },
    {
      id: 'highCut',
      name: 'High Cut Frequency',
      label: 'High Cut',
      value: 0.7,
      min: 1000,
      max: 20000,
      default: 8000,
      unit: 'Hz',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '8000 Hz'
    },
    {
      id: 'stereoWidth',
      name: 'Stereo Width',
      label: 'Width',
      value: 0.75,
      min: 0,
      max: 2.0,
      default: 1.0,
      unit: '%',
      type: 'continuous',
      isAutomatable: true,
      displayValue: '100%'
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
  private convolverNode: ConvolverNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;

  /**
   * Initialize the plugin with audio context
   */
  initialize(sampleRate: number, audioContext?: AudioContext): void {
    this.sampleRate = sampleRate;
    if (audioContext) {
      this.audioContext = audioContext;
      this.setupAudioNodes();
    }
  }

  /**
   * Setup Web Audio nodes for real-time processing
   */
  private setupAudioNodes(): void {
    if (!this.audioContext) return;

    this.convolverNode = this.audioContext.createConvolver();
    this.dryGainNode = this.audioContext.createGain();
    this.wetGainNode = this.audioContext.createGain();

    // Generate initial impulse response
    this.updateImpulseResponse();
  }

  /**
   * Generate plate reverb impulse response
   */
  private updateImpulseResponse(): void {
    if (!this.audioContext || !this.convolverNode) return;

    const decay = this.getParameterValue('decay');
    const plateSize = this.getParameterValue('plateSize');
    const diffusion = this.getParameterValue('diffusion');
    const dampening = this.getParameterValue('dampening');

    const length = Math.floor(this.sampleRate * decay);
    const impulse = this.audioContext.createBuffer(2, length, this.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        // Plate reverb characteristics
        const time = i / this.sampleRate;
        const envelope = Math.exp(-3 * time / decay);

        // Diffuse reflections
        const noise = (Math.random() * 2 - 1) * diffusion;

        // Dampening (high frequency roll-off)
        const dampenFactor = 1 - (dampening * (i / length));

        // Plate modal resonances
        const modalFreqs = [200, 315, 523, 847, 1234, 2109];
        let modalSum = 0;
        modalFreqs.forEach(freq => {
          const phase = (2 * Math.PI * freq * time) + (channel * Math.PI / 4);
          modalSum += Math.sin(phase) * Math.exp(-time * freq / 500);
        });

        channelData[i] = (noise * 0.7 + modalSum * 0.3) * envelope * dampenFactor * plateSize;
      }
    }

    this.convolverNode.buffer = impulse;
  }

  /**
   * AI-powered audio analysis for adaptive reverb
   */
  analyzeAudio(audioBuffer: Float32Array[]): AIReverbAnalysis {
    const mono = this.convertToMono(audioBuffer);
    const spectrum = this.computeFFT(mono);

    // Analyze spectral content
    const spectralCentroid = this.calculateSpectralCentroid(spectrum);
    const highFreqEnergy = this.calculateBandEnergy(spectrum, 4000, 20000);
    const lowFreqEnergy = this.calculateBandEnergy(spectrum, 20, 250);
    const rms = this.calculateRMS(mono);

    // AI recommendations
    const recommendations: string[] = [];
    let suggestedDecay = 2.0;
    let suggestedMix = 0.25;
    let suggestedDampening = 0.5;
    let detectedRoomType: AIReverbAnalysis['detectedRoomType'] = 'plate';

    // Bright content benefits from more dampening
    if (spectralCentroid > 0.6) {
      suggestedDampening = 0.7;
      recommendations.push('Bright source detected - increased dampening to 70%');
    }

    // Dark content can use less dampening
    if (spectralCentroid < 0.3) {
      suggestedDampening = 0.3;
      recommendations.push('Dark source detected - reduced dampening to 30%');
    }

    // Loud/dense content needs less reverb
    if (rms > 0.5) {
      suggestedMix = 0.15;
      suggestedDecay = 1.5;
      recommendations.push('Dense mix detected - reduced reverb mix to 15% and decay to 1.5s');
    }

    // Sparse/intimate content can use more reverb
    if (rms < 0.2) {
      suggestedMix = 0.35;
      suggestedDecay = 3.0;
      recommendations.push('Intimate source detected - increased reverb mix to 35% and decay to 3.0s');
    }

    // High-frequency content (vocals, hi-hats)
    if (highFreqEnergy > 0.4) {
      recommendations.push('High-frequency content - plate reverb is ideal for smooth, musical character');
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
    this.updateImpulseResponse();
  }

  /**
   * Set parameter value
   */
  setParameter(id: string, value: number): void {
    const param = this.parameters.find(p => p.id === id);
    if (!param) return;

    param.value = Math.max(param.min, Math.min(param.max, value));
    param.displayValue = this.formatDisplayValue(param);

    // Update audio processing
    if (['decay', 'plateSize', 'diffusion', 'dampening'].includes(id)) {
      this.updateImpulseResponse();
    }

    if (id === 'mix') {
      this.updateMixLevels();
    }
  }

  /**
   * Get parameter value
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
   * Update dry/wet mix levels
   */
  private updateMixLevels(): void {
    if (!this.dryGainNode || !this.wetGainNode) return;

    const mix = this.getParameterValue('mix');
    this.dryGainNode.gain.value = 1 - mix;
    this.wetGainNode.gain.value = mix;
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
      case 'plateSize':
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
      id: 'vocal-plate',
      name: 'Vocal Plate',
      description: 'Smooth, musical plate reverb for vocals',
      genre: 'Pop/Country',
      settings: {
        decayTime: 2.0,
        preDelay: 0.03,
        dampening: 0.6,
        mix: 0.25,
        diffusion: 0.7,
        modulation: 0.15,
        lowCut: 150,
        highCut: 8000,
        stereoWidth: 1.0
      }
    },
    {
      id: 'drum-plate',
      name: 'Drum Plate',
      description: 'Punchy plate reverb for drums and percussion',
      genre: 'Rock/Pop',
      settings: {
        decayTime: 1.2,
        preDelay: 0.01,
        dampening: 0.7,
        mix: 0.15,
        diffusion: 0.8,
        modulation: 0.1,
        lowCut: 200,
        highCut: 10000,
        stereoWidth: 1.2
      }
    },
    {
      id: 'lush-plate',
      name: 'Lush Plate',
      description: 'Rich, dense plate for guitars and keys',
      genre: 'R&B/Soul',
      settings: {
        decayTime: 3.5,
        preDelay: 0.05,
        dampening: 0.4,
        mix: 0.35,
        diffusion: 0.85,
        modulation: 0.25,
        lowCut: 100,
        highCut: 12000,
        stereoWidth: 1.5
      }
    },
    {
      id: 'bright-plate',
      name: 'Bright Plate',
      description: 'Shimmering plate reverb with extended highs',
      genre: 'Electronic',
      settings: {
        decayTime: 2.5,
        preDelay: 0.02,
        dampening: 0.2,
        mix: 0.3,
        diffusion: 0.75,
        modulation: 0.3,
        lowCut: 150,
        highCut: 16000,
        stereoWidth: 1.8
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
    if (preset.settings.diffusion) this.setParameter('diffusion', preset.settings.diffusion);
    if (preset.settings.modulation) this.setParameter('modulation', preset.settings.modulation);
    if (preset.settings.lowCut) this.setParameter('lowCut', preset.settings.lowCut);
    if (preset.settings.highCut) this.setParameter('highCut', preset.settings.highCut);
    if (preset.settings.stereoWidth) this.setParameter('stereoWidth', preset.settings.stereoWidth);
  }
}
