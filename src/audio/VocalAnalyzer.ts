/**
 * Vocal Analyzer - Analyzes vocal timbre and characteristics
 * Extracts features from vocal recordings for AI-powered processing
 */

export interface TimbreProfile {
  brightness: number;       // 0-1: High-frequency content
  warmth: number;           // 0-1: Low-mid frequency richness
  roughness: number;        // 0-1: Noise/distortion content
  spectralCentroid: number; // Hz: Center of mass of spectrum
  spectralRolloff: number;  // Hz: Frequency below which 85% of energy is contained
  harmonicRichness: number; // 0-1: Strength of harmonic content
}

export interface VocalCharacteristics {
  timbre: TimbreProfile;
  fundamentalFrequency: number; // Hz: Average pitch
  dynamicRange: number;         // dB
  breathiness: number;          // 0-1
  nasality: number;             // 0-1
  hoarseness: number;           // 0-1
}

export class VocalAnalyzer {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = 4096;
    this.analyserNode.smoothingTimeConstant = 0.8;
  }

  /**
   * Analyze vocal timbre from audio buffer
   */
  analyzeTimbre(audioBuffer: AudioBuffer): TimbreProfile {
    const channelData = audioBuffer.getChannelData(0);
    const fftData = this.performFFT(channelData);

    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid(fftData, audioBuffer.sampleRate);
    const spectralRolloff = this.calculateSpectralRolloff(fftData, audioBuffer.sampleRate);
    const brightness = this.calculateBrightness(fftData, audioBuffer.sampleRate);
    const warmth = this.calculateWarmth(fftData, audioBuffer.sampleRate);
    const roughness = this.calculateRoughness(channelData);
    const harmonicRichness = this.calculateHarmonicRichness(fftData);

    return {
      brightness,
      warmth,
      roughness,
      spectralCentroid,
      spectralRolloff,
      harmonicRichness
    };
  }

  /**
   * Analyze complete vocal characteristics
   */
  analyzeVocal(audioBuffer: AudioBuffer): VocalCharacteristics {
    const channelData = audioBuffer.getChannelData(0);
    const timbre = this.analyzeTimbre(audioBuffer);

    return {
      timbre,
      fundamentalFrequency: this.estimateFundamentalFrequency(channelData, audioBuffer.sampleRate),
      dynamicRange: this.calculateDynamicRange(channelData),
      breathiness: this.estimateBreathiness(channelData, audioBuffer.sampleRate),
      nasality: this.estimateNasality(timbre),
      hoarseness: this.estimateHoarseness(channelData)
    };
  }

  /**
   * Perform FFT on audio data
   */
  private performFFT(audioData: Float32Array): Float32Array {
    const fftSize = Math.min(4096, Math.pow(2, Math.floor(Math.log2(audioData.length))));
    const fftData = new Float32Array(fftSize / 2);

    // Use Web Audio API for FFT if available, otherwise simple DFT
    const tempBuffer = this.audioContext.createBuffer(1, fftSize, this.audioContext.sampleRate);
    const tempChannelData = tempBuffer.getChannelData(0);
    tempChannelData.set(audioData.slice(0, fftSize));

    // Create a temporary analyser for this analysis
    const tempAnalyser = this.audioContext.createAnalyser();
    tempAnalyser.fftSize = fftSize;

    // Note: In production, you'd connect a source to the analyser
    // For now, we'll do a simplified frequency analysis
    this.simpleDFT(audioData.slice(0, fftSize), fftData);

    return fftData;
  }

  /**
   * Simple DFT implementation for frequency analysis
   */
  private simpleDFT(timeData: Float32Array, freqData: Float32Array): void {
    const N = timeData.length;
    const M = freqData.length;

    for (let k = 0; k < M; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += timeData[n] * Math.cos(angle);
        imag += timeData[n] * Math.sin(angle);
      }

      freqData[k] = Math.sqrt(real * real + imag * imag) / N;
    }
  }

  /**
   * Calculate spectral centroid (center of mass of spectrum)
   */
  private calculateSpectralCentroid(spectrum: Float32Array, sampleRate: number): number {
    let weightedSum = 0;
    let totalSum = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      weightedSum += frequency * spectrum[i];
      totalSum += spectrum[i];
    }

    return totalSum > 0 ? weightedSum / totalSum : 0;
  }

  /**
   * Calculate spectral rolloff (frequency below which 85% of energy is contained)
   */
  private calculateSpectralRolloff(spectrum: Float32Array, sampleRate: number): number {
    const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
    const threshold = totalEnergy * 0.85;

    let cumulativeEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i];
      if (cumulativeEnergy >= threshold) {
        return (i * sampleRate) / (2 * spectrum.length);
      }
    }

    return sampleRate / 2;
  }

  /**
   * Calculate brightness (high-frequency content)
   */
  private calculateBrightness(spectrum: Float32Array, sampleRate: number): number {
    const cutoffFreq = 2000; // Hz
    const cutoffBin = Math.floor((cutoffFreq * 2 * spectrum.length) / sampleRate);

    let highFreqEnergy = 0;
    let totalEnergy = 0;

    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i];
      if (i >= cutoffBin) {
        highFreqEnergy += spectrum[i];
      }
    }

    return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
  }

  /**
   * Calculate warmth (low-mid frequency richness)
   */
  private calculateWarmth(spectrum: Float32Array, sampleRate: number): number {
    const lowFreq = 200;
    const highFreq = 600;
    const lowBin = Math.floor((lowFreq * 2 * spectrum.length) / sampleRate);
    const highBin = Math.floor((highFreq * 2 * spectrum.length) / sampleRate);

    let warmEnergy = 0;
    let totalEnergy = 0;

    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i];
      if (i >= lowBin && i <= highBin) {
        warmEnergy += spectrum[i];
      }
    }

    return totalEnergy > 0 ? warmEnergy / totalEnergy : 0;
  }

  /**
   * Calculate roughness (noise/distortion content)
   */
  private calculateRoughness(waveform: Float32Array): number {
    // Calculate zero-crossing rate as a proxy for roughness
    let crossings = 0;
    for (let i = 1; i < waveform.length; i++) {
      if ((waveform[i] >= 0 && waveform[i - 1] < 0) ||
          (waveform[i] < 0 && waveform[i - 1] >= 0)) {
        crossings++;
      }
    }

    const zcr = crossings / waveform.length;
    return Math.min(zcr * 10, 1); // Normalize to 0-1
  }

  /**
   * Calculate harmonic richness
   */
  private calculateHarmonicRichness(spectrum: Float32Array): number {
    // Simple measure: ratio of peak energy to average energy
    const maxValue = Math.max(...Array.from(spectrum));
    const avgValue = spectrum.reduce((sum, val) => sum + val, 0) / spectrum.length;

    return avgValue > 0 ? Math.min(maxValue / avgValue / 10, 1) : 0;
  }

  /**
   * Estimate fundamental frequency using autocorrelation
   */
  private estimateFundamentalFrequency(waveform: Float32Array, sampleRate: number): number {
    const minFreq = 80; // Hz
    const maxFreq = 400; // Hz
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let maxCorrelation = -Infinity;
    let bestPeriod = minPeriod;

    // Autocorrelation to find periodicity
    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
      let correlation = 0;
      for (let i = 0; i < waveform.length - lag; i++) {
        correlation += waveform[i] * waveform[i + lag];
      }

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }

    return sampleRate / bestPeriod;
  }

  /**
   * Calculate dynamic range
   */
  private calculateDynamicRange(waveform: Float32Array): number {
    const windowSize = 2048;
    const rmsValues: number[] = [];

    for (let i = 0; i < waveform.length - windowSize; i += windowSize) {
      const window = waveform.slice(i, i + windowSize);
      const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
      if (rms > 0.001) rmsValues.push(rms);
    }

    if (rmsValues.length === 0) return 0;

    const max = Math.max(...rmsValues);
    const min = Math.min(...rmsValues);

    return 20 * Math.log10(max / (min || 0.001));
  }

  /**
   * Estimate breathiness (high-frequency noise during phonation)
   */
  private estimateBreathiness(waveform: Float32Array, sampleRate: number): number {
    // Simplified: measure high-frequency energy during voiced segments
    const fftData = this.performFFT(waveform);
    const highFreqCutoff = Math.floor((4000 * 2 * fftData.length) / sampleRate);

    let highFreqNoise = 0;
    for (let i = highFreqCutoff; i < fftData.length; i++) {
      highFreqNoise += fftData[i];
    }

    const totalEnergy = fftData.reduce((sum, val) => sum + val, 0);
    return totalEnergy > 0 ? Math.min((highFreqNoise / totalEnergy) * 3, 1) : 0;
  }

  /**
   * Estimate nasality from timbre characteristics
   */
  private estimateNasality(timbre: TimbreProfile): number {
    // Nasal voices typically have specific formant patterns
    // Simplified: high spectral centroid with moderate warmth suggests nasality
    return timbre.spectralCentroid > 1500 && timbre.warmth < 0.6
      ? 0.7
      : 0.3;
  }

  /**
   * Estimate hoarseness (vocal fry, irregular vibration)
   */
  private estimateHoarseness(waveform: Float32Array): number {
    // Hoarseness shows up as irregular amplitude variations
    const windowSize = 512;
    let irregularity = 0;

    for (let i = 0; i < waveform.length - windowSize * 2; i += windowSize) {
      const window1 = waveform.slice(i, i + windowSize);
      const window2 = waveform.slice(i + windowSize, i + windowSize * 2);

      const rms1 = Math.sqrt(window1.reduce((sum, val) => sum + val * val, 0) / window1.length);
      const rms2 = Math.sqrt(window2.reduce((sum, val) => sum + val * val, 0) / window2.length);

      const diff = Math.abs(rms1 - rms2);
      irregularity += diff;
    }

    return Math.min(irregularity * 10, 1);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.analyserNode.disconnect();
  }
}
