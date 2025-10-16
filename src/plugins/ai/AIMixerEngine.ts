/**
 * AI Mixer/Master Engine
 *
 * Analyzes audio and automatically controls plugin parameters
 * for professional mixing and mastering
 */

import {
  AIAnalysisRequest,
  AIPluginRecommendation,
  AIMixerSettings,
  PluginChain,
  AIPluginControl
} from '../core/types';

export interface AudioFeatures {
  rms: number; // Root mean square (loudness)
  peak: number; // Peak level
  crestFactor: number; // Peak/RMS ratio
  spectralCentroid: number; // Brightness
  spectralRolloff: number; // High frequency content
  zeroCrossingRate: number; // Noisiness
  dynamicRange: number; // dB
  bassEnergy: number; // 20-250 Hz
  midEnergy: number; // 250-4000 Hz
  highEnergy: number; // 4000+ Hz
  lufs: number; // Integrated loudness
}

export class AIMixerEngine {
  private sampleRate: number = 48000;

  /**
   * Analyze audio buffer and extract features
   */
  analyzeAudio(audioBuffer: Float32Array[]): AudioFeatures {
    const mono = this.convertToMono(audioBuffer);
    const fft = this.computeFFT(mono);

    return {
      rms: this.calculateRMS(mono),
      peak: this.calculatePeak(mono),
      crestFactor: this.calculateCrestFactor(mono),
      spectralCentroid: this.calculateSpectralCentroid(fft),
      spectralRolloff: this.calculateSpectralRolloff(fft),
      zeroCrossingRate: this.calculateZeroCrossingRate(mono),
      dynamicRange: this.calculateDynamicRange(mono),
      bassEnergy: this.calculateBandEnergy(fft, 20, 250),
      midEnergy: this.calculateBandEnergy(fft, 250, 4000),
      highEnergy: this.calculateBandEnergy(fft, 4000, 20000),
      lufs: this.calculateLUFS(mono)
    };
  }

  /**
   * Generate plugin recommendations based on audio analysis
   */
  async recommendPlugins(
    features: AudioFeatures,
    genre: string,
    currentChain?: PluginChain
  ): Promise<AIPluginRecommendation[]> {
    const recommendations: AIPluginRecommendation[] = [];

    // Check if vocals need de-essing
    if (features.highEnergy > 0.3 && features.spectralRolloff > 0.7) {
      recommendations.push({
        action: 'add',
        pluginId: 'vst3-vocal-de-esser',
        pluginName: 'Vocal De-Esser',
        slotIndex: 5,
        reason: 'High sibilance detected - de-essing recommended',
        confidence: 0.85,
        parameters: {
          frequency: 0.7,
          threshold: 0.5,
          range: 0.4
        }
      });
    }

    // Check if compression needed
    if (features.crestFactor > 6) {
      recommendations.push({
        action: 'add',
        pluginId: 'vst3-fabfilter-pro-c-2',
        pluginName: 'FabFilter Pro-C 2',
        slotIndex: 3,
        reason: 'High dynamic range - compression recommended for consistency',
        confidence: 0.9,
        parameters: {
          threshold: 0.45,
          ratio: 0.4,
          attack: 0.2,
          release: 0.4
        }
      });
    }

    // Check if low-end needs work
    if (features.bassEnergy < 0.15) {
      recommendations.push({
        action: 'add',
        pluginId: 'vst3-fabfilter-pro-q-4',
        pluginName: 'FabFilter Pro-Q 4',
        slotIndex: 2,
        reason: 'Low bass energy - EQ boost recommended',
        confidence: 0.75,
        parameters: {
          'band_1_freq': 0.2,
          'band_1_gain': 0.6,
          'band_1_q': 0.5
        }
      });
    }

    // Check if too dark/bright
    if (features.spectralCentroid < 0.3) {
      recommendations.push({
        action: 'add',
        pluginId: 'vst3-slate-digital-fresh-air',
        pluginName: 'Slate Digital Fresh Air',
        slotIndex: 8,
        reason: 'Dark sound detected - adding air and brightness',
        confidence: 0.8,
        parameters: {
          amount: 0.6,
          freq: 0.65
        }
      });
    }

    // Genre-specific recommendations
    if (genre === 'Pop Country') {
      recommendations.push({
        action: 'add',
        pluginId: 'au-uad-neve-1073',
        pluginName: 'UAD Neve 1073',
        slotIndex: 1,
        reason: 'Pop country benefits from Neve warmth and character',
        confidence: 0.9,
        parameters: {
          input_gain: 0.65,
          low_gain: 0.55,
          mid_gain: 0.6,
          high_gain: 0.58
        }
      });
    }

    if (genre === 'Hip-Hop/R&B') {
      recommendations.push({
        action: 'add',
        pluginId: 'au-uad-ssl-e-channel-strip',
        pluginName: 'UAD SSL E Channel Strip',
        slotIndex: 1,
        reason: 'SSL E Channel provides modern hip-hop punch and clarity',
        confidence: 0.92,
        parameters: {
          input_gain: 0.6,
          lf_gain: 0.55,
          hmf_gain: 0.65,
          comp_ratio: 0.45
        }
      });
    }

    return recommendations;
  }

  /**
   * Auto-adjust plugin parameters based on audio analysis
   */
  async autoAdjustParameters(
    instanceId: string,
    pluginId: string,
    features: AudioFeatures,
    settings: AIMixerSettings
  ): Promise<AIPluginControl> {
    const parameterChanges: AIPluginControl['parameterChanges'] = [];

    // Auto-Tune adjustments
    if (pluginId.includes('auto-tune')) {
      const retuneSpeed = this.calculateAutoTuneSpeed(settings.genre, features);
      parameterChanges.push({
        parameterId: 'retune_speed',
        value: retuneSpeed,
        timestamp: Date.now()
      });

      const humanize = settings.genre === 'Pop Country' ? 0.7 : 0.4;
      parameterChanges.push({
        parameterId: 'humanize',
        value: humanize,
        timestamp: Date.now()
      });
    }

    // Compressor adjustments
    if (pluginId.includes('pro-c-2')) {
      const threshold = this.calculateCompThreshold(features, settings);
      const ratio = this.calculateCompRatio(features, settings);

      parameterChanges.push(
        {
          parameterId: 'threshold',
          value: threshold,
          timestamp: Date.now()
        },
        {
          parameterId: 'ratio',
          value: ratio,
          timestamp: Date.now()
        }
      );
    }

    // EQ adjustments
    if (pluginId.includes('pro-q')) {
      const eqAdjustments = this.calculateEQAdjustments(features, settings);
      eqAdjustments.forEach(adj => {
        parameterChanges.push({
          parameterId: adj.parameterId,
          value: adj.value,
          timestamp: Date.now()
        });
      });
    }

    // Reverb adjustments
    if (pluginId.includes('reverb')) {
      const reverbMix = this.calculateReverbMix(settings.genre, settings.spatialWidth);
      parameterChanges.push({
        parameterId: 'mix',
        value: reverbMix,
        timestamp: Date.now()
      });
    }

    // Limiter adjustments (mastering)
    if (pluginId.includes('pro-l-2')) {
      const ceiling = this.calculateLimiterCeiling(settings.targetLoudness);
      const gain = this.calculateLimiterGain(features.lufs, settings.targetLoudness);

      parameterChanges.push(
        {
          parameterId: 'threshold',
          value: ceiling,
          timestamp: Date.now()
        },
        {
          parameterId: 'gain',
          value: gain,
          timestamp: Date.now()
        }
      );
    }

    return {
      instanceId,
      parameterChanges
    };
  }

  /**
   * Master track with AI-controlled chain
   */
  async masterTrack(
    audioBuffer: Float32Array[],
    settings: AIMixerSettings
  ): Promise<{
    controls: AIPluginControl[];
    recommendations: AIPluginRecommendation[];
    features: AudioFeatures;
  }> {
    const features = this.analyzeAudio(audioBuffer);
    const recommendations = await this.recommendPlugins(features, settings.genre);

    const controls: AIPluginControl[] = [
      await this.autoAdjustParameters('master-eq', 'ozone-12-eq', features, settings),
      await this.autoAdjustParameters('master-comp', 'pro-c-2', features, settings),
      await this.autoAdjustParameters('master-limiter', 'pro-l-2', features, settings)
    ];

    return { controls, recommendations, features };
  }

  // ==================== PRIVATE ANALYSIS METHODS ====================

  private convertToMono(buffer: Float32Array[]): Float32Array {
    const length = buffer[0].length;
    const mono = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const channel of buffer) {
        sum += channel[i];
      }
      mono[i] = sum / buffer.length;
    }

    return mono;
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (const sample of buffer) {
      sum += sample * sample;
    }
    return Math.sqrt(sum / buffer.length);
  }

  private calculatePeak(buffer: Float32Array): number {
    let peak = 0;
    for (const sample of buffer) {
      peak = Math.max(peak, Math.abs(sample));
    }
    return peak;
  }

  private calculateCrestFactor(buffer: Float32Array): number {
    const peak = this.calculatePeak(buffer);
    const rms = this.calculateRMS(buffer);
    return rms > 0 ? peak / rms : 0;
  }

  private calculateZeroCrossingRate(buffer: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i - 1] >= 0 && buffer[i] < 0) || (buffer[i - 1] < 0 && buffer[i] >= 0)) {
        crossings++;
      }
    }
    return crossings / buffer.length;
  }

  private calculateDynamicRange(buffer: Float32Array): number {
    const peak = this.calculatePeak(buffer);
    const rms = this.calculateRMS(buffer);
    return 20 * Math.log10(peak / (rms + 0.0001)); // dB
  }

  private calculateLUFS(buffer: Float32Array): number {
    // Simplified LUFS calculation (K-weighted)
    const rms = this.calculateRMS(buffer);
    return -23 + 20 * Math.log10(rms + 0.0001);
  }

  private computeFFT(buffer: Float32Array): Float32Array {
    // Simplified FFT (use real FFT library in production)
    const fftSize = 2048;
    const fft = new Float32Array(fftSize / 2);

    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0;
      let imag = 0;

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
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < fft.length; i++) {
      weightedSum += i * fft[i];
      sum += fft[i];
    }

    return sum > 0 ? weightedSum / sum / fft.length : 0;
  }

  private calculateSpectralRolloff(fft: Float32Array): number {
    const threshold = 0.85;
    let sum = 0;
    for (const val of fft) sum += val;

    let cumulativeSum = 0;
    for (let i = 0; i < fft.length; i++) {
      cumulativeSum += fft[i];
      if (cumulativeSum >= threshold * sum) {
        return i / fft.length;
      }
    }

    return 1.0;
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

  // ==================== AI PARAMETER CALCULATION ====================

  private calculateAutoTuneSpeed(genre: string, features: AudioFeatures): number {
    if (genre === 'Pop Country') {
      return 0.25; // Natural (25ms)
    } else if (genre === 'Hip-Hop/R&B') {
      return features.dynamicRange > 15 ? 0.15 : 0.1; // Faster for hip-hop
    }
    return 0.2;
  }

  private calculateCompThreshold(features: AudioFeatures, settings: AIMixerSettings): number {
    const targetRMS = Math.pow(10, settings.targetLoudness / 20);
    const currentRMS = features.rms;

    if (currentRMS > targetRMS) {
      return 0.4; // Lower threshold for loud signals
    } else {
      return 0.5; // Higher threshold for quiet signals
    }
  }

  private calculateCompRatio(features: AudioFeatures, settings: AIMixerSettings): number {
    if (settings.aggressiveness > 70) {
      return 0.6; // 6:1 aggressive
    } else if (settings.aggressiveness > 40) {
      return 0.4; // 4:1 moderate
    } else {
      return 0.25; // 2:1 gentle
    }
  }

  private calculateEQAdjustments(
    features: AudioFeatures,
    settings: AIMixerSettings
  ): Array<{ parameterId: string; value: number }> {
    const adjustments: Array<{ parameterId: string; value: number }> = [];

    // Bass adjustment
    if (features.bassEnergy < 0.2) {
      adjustments.push({
        parameterId: 'band_1_gain',
        value: 0.6 + settings.tonalBalance.bass * 0.2
      });
    }

    // Mid adjustment
    if (features.midEnergy < 0.3) {
      adjustments.push({
        parameterId: 'band_2_gain',
        value: 0.55 + settings.tonalBalance.mids * 0.15
      });
    }

    // High adjustment
    if (features.highEnergy < 0.25) {
      adjustments.push({
        parameterId: 'band_3_gain',
        value: 0.6 + settings.tonalBalance.highs * 0.2
      });
    }

    return adjustments;
  }

  private calculateReverbMix(genre: string, spatialWidth: number): number {
    const baseMap: Record<string, number> = {
      'Pop Country': 0.18,
      'Hip-Hop/R&B': 0.22,
      'Pop': 0.2,
      'Rock': 0.15
    };

    const base = baseMap[genre] || 0.2;
    return base * (spatialWidth / 100);
  }

  private calculateLimiterCeiling(targetLoudness: number): number {
    // Convert LUFS to ceiling (normalized 0-1)
    return 0.75 + (targetLoudness + 14) / 20 * 0.2;
  }

  private calculateLimiterGain(currentLUFS: number, targetLUFS: number): number {
    const diff = targetLUFS - currentLUFS;
    return 0.5 + diff / 20; // Normalize gain adjustment
  }
}
