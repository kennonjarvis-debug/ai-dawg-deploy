/**
 * AI EQ Engine - Core audio analysis and processing engine for AI EQ plugins
 *
 * Provides:
 * - Real-time spectral analysis
 * - Problem frequency detection
 * - Tonal balance analysis
 * - Automatic EQ curve generation
 * - Source type detection
 * - Genre classification
 */

import { AudioFeatures } from '../ai/AIMixerEngine';

export interface FrequencyBand {
  frequency: number;
  magnitude: number; // dB
  phase: number;
  label: string;
}

export interface ProblemFrequency {
  frequency: number;
  type: 'resonance' | 'mud' | 'harshness' | 'boxiness' | 'sibilance';
  severity: 'mild' | 'moderate' | 'severe';
  suggestedGain: number; // dB (negative for cut)
  suggestedQ: number;
  description: string;
}

export interface TonalBalance {
  subBass: number; // 20-60 Hz
  bass: number; // 60-250 Hz
  lowMids: number; // 250-500 Hz
  mids: number; // 500-2000 Hz
  highMids: number; // 2000-4000 Hz
  presence: number; // 4000-6000 Hz
  brilliance: number; // 6000-10000 Hz
  air: number; // 10000-20000 Hz
}

export interface EQCurvePoint {
  frequency: number;
  gain: number; // dB
  q: number;
  type: 'bell' | 'shelf' | 'highpass' | 'lowpass' | 'notch';
  enabled: boolean;
}

export interface SourceCharacteristics {
  type: 'vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'strings' | 'brass' | 'mix' | 'unknown';
  confidence: number;
  harmonicContent: number; // 0-1
  transientContent: number; // 0-1
  fundamentalFrequency: number | null; // Hz
  spectralCentroid: number; // Hz
  isDynamic: boolean;
}

export class AIEQEngine {
  private sampleRate: number = 48000;
  private fftSize: number = 8192;

  constructor(sampleRate: number = 48000) {
    this.sampleRate = sampleRate;
  }

  // ========================================================================
  // SPECTRAL ANALYSIS
  // ========================================================================

  /**
   * Analyze audio buffer and extract frequency spectrum
   */
  analyzeSpectrum(audioBuffer: Float32Array[]): FrequencyBand[] {
    const mono = this.convertToMono(audioBuffer);
    const fft = this.computeFFT(mono);
    const bands = this.createFrequencyBands(fft);
    return bands;
  }

  /**
   * Detect problem frequencies in audio
   */
  detectProblems(audioBuffer: Float32Array[]): ProblemFrequency[] {
    const spectrum = this.analyzeSpectrum(audioBuffer);
    const problems: ProblemFrequency[] = [];

    // Detect resonances (narrow peaks)
    const resonances = this.detectResonances(spectrum);
    problems.push(...resonances);

    // Detect muddiness (200-500 Hz)
    const mud = this.detectMuddiness(spectrum);
    if (mud) problems.push(mud);

    // Detect harshness (2-5 kHz)
    const harshness = this.detectHarshness(spectrum);
    if (harshness) problems.push(harshness);

    // Detect boxiness (400-800 Hz)
    const boxiness = this.detectBoxiness(spectrum);
    if (boxiness) problems.push(boxiness);

    // Detect sibilance (5-8 kHz)
    const sibilance = this.detectSibilance(spectrum);
    if (sibilance) problems.push(sibilance);

    return problems;
  }

  /**
   * Analyze tonal balance across frequency spectrum
   */
  analyzeTonalBalance(audioBuffer: Float32Array[]): TonalBalance {
    const spectrum = this.analyzeSpectrum(audioBuffer);

    return {
      subBass: this.calculateBandEnergy(spectrum, 20, 60),
      bass: this.calculateBandEnergy(spectrum, 60, 250),
      lowMids: this.calculateBandEnergy(spectrum, 250, 500),
      mids: this.calculateBandEnergy(spectrum, 500, 2000),
      highMids: this.calculateBandEnergy(spectrum, 2000, 4000),
      presence: this.calculateBandEnergy(spectrum, 4000, 6000),
      brilliance: this.calculateBandEnergy(spectrum, 6000, 10000),
      air: this.calculateBandEnergy(spectrum, 10000, 20000)
    };
  }

  /**
   * Generate automatic EQ curve based on analysis
   */
  generateAutoEQCurve(
    audioBuffer: Float32Array[],
    goal: 'clarity' | 'warmth' | 'brightness' | 'punch' | 'balance'
  ): EQCurvePoint[] {
    const problems = this.detectProblems(audioBuffer);
    const balance = this.analyzeTonalBalance(audioBuffer);
    const curve: EQCurvePoint[] = [];

    // Always add high-pass filter
    curve.push({
      frequency: 30,
      gain: 0,
      q: 0.7,
      type: 'highpass',
      enabled: true
    });

    // Fix detected problems
    problems.forEach(problem => {
      curve.push({
        frequency: problem.frequency,
        gain: problem.suggestedGain,
        q: problem.suggestedQ,
        type: problem.type === 'resonance' ? 'notch' : 'bell',
        enabled: true
      });
    });

    // Apply goal-based enhancements
    const goalCurve = this.getGoalCurve(goal, balance);
    curve.push(...goalCurve);

    return curve;
  }

  /**
   * Detect source type from audio characteristics
   */
  detectSourceType(audioBuffer: Float32Array[]): SourceCharacteristics {
    const mono = this.convertToMono(audioBuffer);
    const fft = this.computeFFT(mono);

    const harmonicContent = this.calculateHarmonicContent(fft);
    const transientContent = this.calculateTransientContent(mono);
    const fundamentalFrequency = this.detectFundamental(fft);
    const spectralCentroid = this.calculateSpectralCentroid(fft);
    const isDynamic = this.calculateDynamicRange(mono) > 12;

    // Simple heuristic-based classification
    let type: SourceCharacteristics['type'] = 'unknown';
    let confidence = 0.5;

    if (harmonicContent > 0.7 && fundamentalFrequency && fundamentalFrequency > 80 && fundamentalFrequency < 1000) {
      type = 'vocal';
      confidence = 0.85;
    } else if (transientContent > 0.7 && !fundamentalFrequency) {
      type = 'drums';
      confidence = 0.8;
    } else if (fundamentalFrequency && fundamentalFrequency < 200) {
      type = 'bass';
      confidence = 0.75;
    } else if (harmonicContent > 0.6 && fundamentalFrequency && fundamentalFrequency > 200) {
      type = 'guitar';
      confidence = 0.7;
    } else if (spectralCentroid > 2000) {
      type = 'keys';
      confidence = 0.65;
    }

    return {
      type,
      confidence,
      harmonicContent,
      transientContent,
      fundamentalFrequency,
      spectralCentroid,
      isDynamic
    };
  }

  /**
   * Match tonal balance to a reference
   */
  matchReference(
    sourceBuffer: Float32Array[],
    referenceBuffer: Float32Array[]
  ): EQCurvePoint[] {
    const sourceBalance = this.analyzeTonalBalance(sourceBuffer);
    const refBalance = this.analyzeTonalBalance(referenceBuffer);

    const curve: EQCurvePoint[] = [];

    // Calculate differences and create correction curve
    const bands = [
      { name: 'bass', freq: 100, source: sourceBalance.bass, ref: refBalance.bass },
      { name: 'lowMids', freq: 350, source: sourceBalance.lowMids, ref: refBalance.lowMids },
      { name: 'mids', freq: 1000, source: sourceBalance.mids, ref: refBalance.mids },
      { name: 'highMids', freq: 2500, source: sourceBalance.highMids, ref: refBalance.highMids },
      { name: 'presence', freq: 5000, source: sourceBalance.presence, ref: refBalance.presence },
      { name: 'air', freq: 12000, source: sourceBalance.air, ref: refBalance.air }
    ];

    bands.forEach(band => {
      const diff = band.ref - band.source;
      if (Math.abs(diff) > 2) { // Only correct differences > 2dB
        curve.push({
          frequency: band.freq,
          gain: diff * 0.7, // Apply 70% of difference
          q: 1.5,
          type: 'bell',
          enabled: true
        });
      }
    });

    return curve;
  }

  // ========================================================================
  // PRIVATE ANALYSIS METHODS
  // ========================================================================

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

  private computeFFT(waveform: Float32Array): Float32Array {
    // Simplified FFT - use real FFT library in production (e.g., fft.js)
    const spectrum = new Float32Array(this.fftSize / 2);

    for (let k = 0; k < this.fftSize / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < Math.min(this.fftSize, waveform.length); n++) {
        const angle = (2 * Math.PI * k * n) / this.fftSize;
        real += waveform[n] * Math.cos(angle);
        imag -= waveform[n] * Math.sin(angle);
      }

      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
  }

  private createFrequencyBands(spectrum: Float32Array): FrequencyBand[] {
    const bands: FrequencyBand[] = [];
    const freqResolution = (this.sampleRate / 2) / spectrum.length;

    // Create logarithmically-spaced bands
    const numBands = 100;
    for (let i = 0; i < numBands; i++) {
      const freq = 20 * Math.pow(1000, i / numBands); // 20 Hz to 20 kHz
      const bin = Math.floor(freq / freqResolution);

      if (bin < spectrum.length) {
        const magnitude = 20 * Math.log10(spectrum[bin] + 1e-10); // Convert to dB

        bands.push({
          frequency: freq,
          magnitude,
          phase: 0,
          label: this.getFrequencyLabel(freq)
        });
      }
    }

    return bands;
  }

  private getFrequencyLabel(freq: number): string {
    if (freq < 60) return 'Sub Bass';
    if (freq < 250) return 'Bass';
    if (freq < 500) return 'Low Mids';
    if (freq < 2000) return 'Mids';
    if (freq < 4000) return 'High Mids';
    if (freq < 6000) return 'Presence';
    if (freq < 10000) return 'Brilliance';
    return 'Air';
  }

  private detectResonances(spectrum: FrequencyBand[]): ProblemFrequency[] {
    const resonances: ProblemFrequency[] = [];

    for (let i = 2; i < spectrum.length - 2; i++) {
      const current = spectrum[i];
      const prev = spectrum[i - 1];
      const next = spectrum[i + 1];

      // Check for narrow peaks
      const peakAmount = current.magnitude - (prev.magnitude + next.magnitude) / 2;

      if (peakAmount > 8) {
        const severity: ProblemFrequency['severity'] =
          peakAmount > 15 ? 'severe' :
          peakAmount > 12 ? 'moderate' : 'mild';

        resonances.push({
          frequency: current.frequency,
          type: 'resonance',
          severity,
          suggestedGain: -peakAmount * 0.7,
          suggestedQ: 8.0,
          description: `${severity} resonance at ${current.frequency.toFixed(0)}Hz`
        });
      }
    }

    return resonances;
  }

  private detectMuddiness(spectrum: FrequencyBand[]): ProblemFrequency | null {
    const mudBands = spectrum.filter(b => b.frequency >= 200 && b.frequency <= 500);
    if (mudBands.length === 0) return null;

    const avgEnergy = mudBands.reduce((sum, b) => sum + b.magnitude, 0) / mudBands.length;
    const overallAvg = spectrum.reduce((sum, b) => sum + b.magnitude, 0) / spectrum.length;

    if (avgEnergy > overallAvg + 6) {
      return {
        frequency: 350,
        type: 'mud',
        severity: avgEnergy > overallAvg + 12 ? 'severe' : 'moderate',
        suggestedGain: -4,
        suggestedQ: 2.0,
        description: 'Muddy low-mids (200-500Hz)'
      };
    }

    return null;
  }

  private detectHarshness(spectrum: FrequencyBand[]): ProblemFrequency | null {
    const harshBands = spectrum.filter(b => b.frequency >= 2000 && b.frequency <= 5000);
    if (harshBands.length === 0) return null;

    const avgEnergy = harshBands.reduce((sum, b) => sum + b.magnitude, 0) / harshBands.length;
    const overallAvg = spectrum.reduce((sum, b) => sum + b.magnitude, 0) / spectrum.length;

    if (avgEnergy > overallAvg + 8) {
      return {
        frequency: 3500,
        type: 'harshness',
        severity: avgEnergy > overallAvg + 12 ? 'severe' : 'moderate',
        suggestedGain: -3,
        suggestedQ: 1.5,
        description: 'Harsh mid-highs (2-5kHz)'
      };
    }

    return null;
  }

  private detectBoxiness(spectrum: FrequencyBand[]): ProblemFrequency | null {
    const boxyBands = spectrum.filter(b => b.frequency >= 400 && b.frequency <= 800);
    if (boxyBands.length === 0) return null;

    const avgEnergy = boxyBands.reduce((sum, b) => sum + b.magnitude, 0) / boxyBands.length;
    const overallAvg = spectrum.reduce((sum, b) => sum + b.magnitude, 0) / spectrum.length;

    if (avgEnergy > overallAvg + 6) {
      return {
        frequency: 600,
        type: 'boxiness',
        severity: avgEnergy > overallAvg + 10 ? 'severe' : 'moderate',
        suggestedGain: -2.5,
        suggestedQ: 2.0,
        description: 'Boxy sound (400-800Hz)'
      };
    }

    return null;
  }

  private detectSibilance(spectrum: FrequencyBand[]): ProblemFrequency | null {
    const sibBands = spectrum.filter(b => b.frequency >= 5000 && b.frequency <= 8000);
    if (sibBands.length === 0) return null;

    const avgEnergy = sibBands.reduce((sum, b) => sum + b.magnitude, 0) / sibBands.length;
    const overallAvg = spectrum.reduce((sum, b) => sum + b.magnitude, 0) / spectrum.length;

    if (avgEnergy > overallAvg + 10) {
      return {
        frequency: 6500,
        type: 'sibilance',
        severity: avgEnergy > overallAvg + 15 ? 'severe' : 'moderate',
        suggestedGain: -4,
        suggestedQ: 3.0,
        description: 'Excessive sibilance (5-8kHz)'
      };
    }

    return null;
  }

  private calculateBandEnergy(spectrum: FrequencyBand[], lowFreq: number, highFreq: number): number {
    const bands = spectrum.filter(b => b.frequency >= lowFreq && b.frequency <= highFreq);
    if (bands.length === 0) return 0;

    return bands.reduce((sum, b) => sum + b.magnitude, 0) / bands.length;
  }

  private getGoalCurve(goal: string, balance: TonalBalance): EQCurvePoint[] {
    const curve: EQCurvePoint[] = [];

    switch (goal) {
      case 'clarity':
        // Reduce muddiness, enhance presence
        if (balance.lowMids > balance.mids + 3) {
          curve.push({ frequency: 350, gain: -2, q: 2.0, type: 'bell', enabled: true });
        }
        curve.push({ frequency: 3000, gain: 2, q: 1.2, type: 'bell', enabled: true });
        break;

      case 'warmth':
        // Enhance low-mids, gentle high roll-off
        curve.push({ frequency: 150, gain: 2, q: 0.7, type: 'shelf', enabled: true });
        curve.push({ frequency: 8000, gain: -1, q: 0.7, type: 'shelf', enabled: true });
        break;

      case 'brightness':
        // Enhance highs
        curve.push({ frequency: 5000, gain: 2, q: 1.0, type: 'bell', enabled: true });
        curve.push({ frequency: 10000, gain: 2.5, q: 0.7, type: 'shelf', enabled: true });
        break;

      case 'punch':
        // Enhance lows and upper mids
        curve.push({ frequency: 100, gain: 2.5, q: 0.7, type: 'shelf', enabled: true });
        curve.push({ frequency: 350, gain: -2, q: 2.0, type: 'bell', enabled: true });
        curve.push({ frequency: 2500, gain: 2, q: 1.5, type: 'bell', enabled: true });
        break;

      case 'balance':
        // Gentle balancing adjustments
        if (balance.bass < balance.mids - 3) {
          curve.push({ frequency: 100, gain: 1.5, q: 0.7, type: 'shelf', enabled: true });
        }
        if (balance.air < balance.mids - 5) {
          curve.push({ frequency: 10000, gain: 2, q: 0.7, type: 'shelf', enabled: true });
        }
        break;
    }

    return curve;
  }

  private calculateHarmonicContent(fft: Float32Array): number {
    // Simplified: ratio of tonal vs noise content
    const peaks = this.findPeaks(fft, 10);
    const peakEnergy = peaks.reduce((sum, p) => sum + fft[p], 0);
    const totalEnergy = fft.reduce((sum, val) => sum + val, 0);
    return peakEnergy / (totalEnergy + 1e-10);
  }

  private calculateTransientContent(waveform: Float32Array): number {
    // Calculate envelope and detect transients
    let transientCount = 0;
    const windowSize = 512;

    for (let i = windowSize; i < waveform.length - windowSize; i += windowSize) {
      const prevRMS = this.calculateRMSWindow(waveform, i - windowSize, windowSize);
      const currentRMS = this.calculateRMSWindow(waveform, i, windowSize);

      if (currentRMS > prevRMS * 3) { // Sharp increase
        transientCount++;
      }
    }

    return Math.min(transientCount / 100, 1.0);
  }

  private calculateRMSWindow(waveform: Float32Array, start: number, length: number): number {
    let sum = 0;
    for (let i = start; i < start + length && i < waveform.length; i++) {
      sum += waveform[i] * waveform[i];
    }
    return Math.sqrt(sum / length);
  }

  private detectFundamental(fft: Float32Array): number | null {
    const freqResolution = (this.sampleRate / 2) / fft.length;
    const maxSearchBin = Math.floor(500 / freqResolution); // Search up to 500 Hz

    let maxBin = 0;
    let maxVal = 0;

    for (let i = 1; i < maxSearchBin && i < fft.length; i++) {
      if (fft[i] > maxVal) {
        maxVal = fft[i];
        maxBin = i;
      }
    }

    if (maxVal > 0.01) {
      return maxBin * freqResolution;
    }

    return null;
  }

  private calculateSpectralCentroid(fft: Float32Array): number {
    const freqResolution = (this.sampleRate / 2) / fft.length;
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < fft.length; i++) {
      const freq = i * freqResolution;
      weightedSum += freq * fft[i];
      sum += fft[i];
    }

    return sum > 0 ? weightedSum / sum : 0;
  }

  private calculateDynamicRange(waveform: Float32Array): number {
    const peak = Math.max(...Array.from(waveform).map(Math.abs));
    let sum = 0;
    for (const sample of waveform) {
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / waveform.length);
    return 20 * Math.log10(peak / (rms + 1e-10));
  }

  private findPeaks(data: Float32Array, count: number): number[] {
    const peaks: Array<{ index: number; value: number }> = [];

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push({ index: i, value: data[i] });
      }
    }

    peaks.sort((a, b) => b.value - a.value);
    return peaks.slice(0, count).map(p => p.index);
  }
}

// Export singleton instance
export const aiEQEngine = new AIEQEngine();
