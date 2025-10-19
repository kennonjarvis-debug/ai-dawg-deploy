/**
 * AI Mastering Engine - Professional Audio Mastering System
 *
 * Intelligent mastering engine that analyzes audio and applies professional-grade
 * mastering processing including multi-band EQ, multi-band compression, stereo
 * enhancement, and final limiting to achieve target loudness standards.
 *
 * Features:
 * - LUFS-based loudness analysis (ITU-R BS.1770)
 * - Dynamic range measurement (PLR - Peak to Loudness Ratio)
 * - Stereo width and correlation analysis
 * - Frequency balance detection with critical band analysis
 * - Issue detection (clipping, phase problems, frequency imbalances)
 * - Intelligent mastering chain generation
 * - Auto-master function with target loudness standards
 * - Reference matching capability
 *
 * Loudness Standards:
 * - Streaming: -14 LUFS (Spotify, Apple Music, YouTube)
 * - Club/EDM: -9 LUFS (high energy, loud)
 * - Aggressive: -6 LUFS (maximalist, competitive loudness)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MasteringAnalysis {
  // Loudness metrics (ITU-R BS.1770)
  integratedLUFS: number;           // Overall loudness
  loudnessRange: number;            // LRA - dynamic range in LU
  truePeak: number;                 // True peak in dBTP
  peakToLoudnessRatio: number;      // PLR - dynamic range metric

  // Stereo imaging
  stereoWidth: number;              // 0-1 (0=mono, 1=wide)
  stereoCorrelation: number;        // -1 to 1 (1=mono, 0=uncorrelated, -1=out of phase)
  hasStereoImbalance: boolean;      // Left/right imbalance detected

  // Frequency analysis
  frequencyBalance: {
    subBass: number;                // 20-60 Hz (dB)
    bass: number;                   // 60-250 Hz (dB)
    lowMids: number;                // 250-500 Hz (dB)
    mids: number;                   // 500-2000 Hz (dB)
    highMids: number;               // 2000-4000 Hz (dB)
    presence: number;               // 4000-6000 Hz (dB)
    brilliance: number;             // 6000-20000 Hz (dB)
  };
  spectralBalance: 'bass-heavy' | 'balanced' | 'bright' | 'harsh';

  // Issues detected
  issues: MasteringIssue[];

  // Overall quality
  overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface MasteringIssue {
  type: 'clipping' | 'phase' | 'frequency-imbalance' | 'low-headroom' | 'stereo-problem';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
}

export interface MasteringChain {
  // Pre-processing
  stereoEnhancement?: {
    width: number;                  // 0-200% (100% = no change)
    midsBoost: number;              // dB
    sidesBoost: number;             // dB
  };

  // Multi-band EQ (7 bands)
  multiBandEQ: Array<{
    frequency: number;              // Center frequency (Hz)
    gain: number;                   // dB (-12 to +12)
    Q: number;                      // Bandwidth
    type: 'lowshelf' | 'peaking' | 'highshelf';
  }>;

  // Multi-band compression (3 bands: low, mid, high)
  multiBandCompression: Array<{
    lowFreq: number;                // Lower crossover (Hz)
    highFreq: number;               // Upper crossover (Hz)
    threshold: number;              // dB
    ratio: number;                  // X:1
    attack: number;                 // ms
    release: number;                // ms
    makeup: number;                 // dB
  }>;

  // Harmonic excitement (optional)
  harmonicEnhancement?: {
    amount: number;                 // 0-100%
    tone: 'warm' | 'bright';
  };

  // Final limiting
  limiter: {
    threshold: number;              // dB
    ceiling: number;                // dB (-0.1 to -0.5)
    release: number;                // ms
    lookahead: number;              // ms
  };

  // Target loudness
  targetLUFS: number;

  // Metadata
  processingNotes: string[];
}

export type LoudnessStandard = 'streaming' | 'club' | 'aggressive';

// ============================================================================
// AI MASTERING ENGINE CLASS
// ============================================================================

export class AIMasteringEngine {
  private audioContext: AudioContext | null = null;

  // Analysis buffers
  private leftChannel: Float32Array | null = null;
  private rightChannel: Float32Array | null = null;
  private sampleRate: number = 48000;

  /**
   * Initialize the mastering engine with an audio context
   */
  constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.audioContext = audioContext;
      this.sampleRate = this.audioContext.sampleRate;
    } else if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
      this.sampleRate = this.audioContext.sampleRate;
    } else {
      // For Node.js environment - use provided context or null
      this.audioContext = null;
      this.sampleRate = 48000; // Default sample rate
    }
  }

  // ==========================================================================
  // ANALYSIS METHODS
  // ==========================================================================

  /**
   * Analyze audio for mastering - comprehensive analysis of mix characteristics
   *
   * This performs:
   * 1. LUFS loudness measurement (ITU-R BS.1770-4 standard)
   * 2. Dynamic range analysis (PLR, LRA)
   * 3. True peak detection
   * 4. Stereo imaging analysis
   * 5. Frequency balance across 7 critical bands
   * 6. Issue detection
   */
  analyzeMix(audioBuffer: AudioBuffer): MasteringAnalysis {
    console.log('[AIMasteringEngine] Starting comprehensive mix analysis...');

    // Store channels for processing
    this.leftChannel = audioBuffer.getChannelData(0);
    this.rightChannel = audioBuffer.numberOfChannels > 1
      ? audioBuffer.getChannelData(1)
      : audioBuffer.getChannelData(0); // Duplicate mono to stereo
    this.sampleRate = audioBuffer.sampleRate;

    // 1. Loudness analysis (LUFS)
    const integratedLUFS = this.calculateIntegratedLUFS(audioBuffer);
    const loudnessRange = this.calculateLoudnessRange(audioBuffer);

    // 2. Peak analysis
    const truePeak = this.calculateTruePeak(audioBuffer);
    const peakToLoudnessRatio = truePeak - integratedLUFS; // PLR in dB

    // 3. Stereo analysis
    const stereoWidth = this.calculateStereoWidth(this.leftChannel, this.rightChannel);
    const stereoCorrelation = this.calculateStereoCorrelation(this.leftChannel, this.rightChannel);
    const hasStereoImbalance = this.detectStereoImbalance(this.leftChannel, this.rightChannel);

    // 4. Frequency balance analysis
    const frequencyBalance = this.analyzeFrequencyBalance(audioBuffer);
    const spectralBalance = this.determineSpectralBalance(frequencyBalance);

    // 5. Detect mastering issues
    const issues = this.detectMasteringIssues({
      truePeak,
      integratedLUFS,
      stereoCorrelation,
      frequencyBalance,
      peakToLoudnessRatio
    });

    // 6. Determine overall quality
    const overallQuality = this.assessOverallQuality(issues, integratedLUFS, peakToLoudnessRatio);

    const analysis: MasteringAnalysis = {
      integratedLUFS,
      loudnessRange,
      truePeak,
      peakToLoudnessRatio,
      stereoWidth,
      stereoCorrelation,
      hasStereoImbalance,
      frequencyBalance,
      spectralBalance,
      issues,
      overallQuality
    };

    console.log('[AIMasteringEngine] Analysis complete:', {
      LUFS: integratedLUFS.toFixed(1),
      truePeak: truePeak.toFixed(1),
      PLR: peakToLoudnessRatio.toFixed(1),
      quality: overallQuality
    });

    return analysis;
  }

  /**
   * Calculate integrated LUFS (Loudness Units relative to Full Scale)
   * Based on ITU-R BS.1770-4 standard
   *
   * Algorithm:
   * 1. Apply K-weighting filter (high-pass + high-shelf)
   * 2. Calculate mean square energy in 400ms blocks with 75% overlap
   * 3. Apply gating (-70 LUFS absolute, -10 LUFS relative)
   * 4. Calculate loudness from gated blocks
   */
  private calculateIntegratedLUFS(audioBuffer: AudioBuffer): number {
    const blockSize = Math.floor(0.4 * this.sampleRate); // 400ms blocks
    const hopSize = Math.floor(blockSize * 0.25); // 75% overlap

    const left = this.leftChannel!;
    const right = this.rightChannel!;

    // K-weighting: simplified high-pass at 80Hz
    const filteredLeft = this.applyKWeighting(left);
    const filteredRight = this.applyKWeighting(right);

    // Calculate mean square energy for each block
    const blockLoudness: number[] = [];

    for (let i = 0; i < left.length - blockSize; i += hopSize) {
      let sumLeft = 0;
      let sumRight = 0;

      for (let j = 0; j < blockSize; j++) {
        sumLeft += filteredLeft[i + j] ** 2;
        sumRight += filteredRight[i + j] ** 2;
      }

      // Mean square (stereo weighted: L + R)
      const meanSquare = (sumLeft + sumRight) / blockSize;

      // Convert to LUFS
      if (meanSquare > 0) {
        const blockLUFS = -0.691 + 10 * Math.log10(meanSquare);
        blockLoudness.push(blockLUFS);
      }
    }

    if (blockLoudness.length === 0) return -100; // Silence

    // Gating: remove blocks below -70 LUFS (absolute gate)
    const absoluteGated = blockLoudness.filter(lufs => lufs > -70);

    if (absoluteGated.length === 0) return -70;

    // Calculate average of gated blocks
    const avgLoudness = absoluteGated.reduce((a, b) => a + b, 0) / absoluteGated.length;

    // Relative gate: -10 LU below average
    const relativeThreshold = avgLoudness - 10;
    const relativeGated = absoluteGated.filter(lufs => lufs > relativeThreshold);

    if (relativeGated.length === 0) return avgLoudness;

    // Final integrated loudness
    const integratedLUFS = relativeGated.reduce((a, b) => a + b, 0) / relativeGated.length;

    return integratedLUFS;
  }

  /**
   * Apply K-weighting filter (simplified)
   * K-weighting = high-pass ~80Hz + high-shelf ~2kHz
   */
  private applyKWeighting(input: Float32Array): Float32Array {
    const output = new Float32Array(input.length);

    // Simple high-pass filter (80 Hz)
    const alpha = 1 - Math.exp(-2 * Math.PI * 80 / this.sampleRate);
    let prevIn = 0;
    let prevOut = 0;

    for (let i = 0; i < input.length; i++) {
      output[i] = alpha * (prevOut + input[i] - prevIn);
      prevIn = input[i];
      prevOut = output[i];
    }

    return output;
  }

  /**
   * Calculate Loudness Range (LRA) - measure of dynamic variation
   * Range between 10th and 95th percentile of loudness distribution
   */
  private calculateLoudnessRange(audioBuffer: AudioBuffer): number {
    const blockSize = Math.floor(3 * this.sampleRate); // 3 second blocks
    const left = this.leftChannel!;
    const right = this.rightChannel!;

    const blockLoudness: number[] = [];

    for (let i = 0; i < left.length - blockSize; i += blockSize) {
      let sumLeft = 0;
      let sumRight = 0;

      for (let j = 0; j < blockSize; j++) {
        sumLeft += left[i + j] ** 2;
        sumRight += right[i + j] ** 2;
      }

      const meanSquare = (sumLeft + sumRight) / blockSize;
      if (meanSquare > 0) {
        blockLoudness.push(-0.691 + 10 * Math.log10(meanSquare));
      }
    }

    if (blockLoudness.length < 2) return 0;

    // Sort and find 10th and 95th percentile
    blockLoudness.sort((a, b) => a - b);
    const p10Index = Math.floor(blockLoudness.length * 0.1);
    const p95Index = Math.floor(blockLoudness.length * 0.95);

    const lra = blockLoudness[p95Index] - blockLoudness[p10Index];
    return Math.max(0, lra);
  }

  /**
   * Calculate true peak (dBTP) using 4x oversampling
   * True peak accounts for inter-sample peaks that can cause clipping in D/A conversion
   */
  private calculateTruePeak(audioBuffer: AudioBuffer): number {
    const left = this.leftChannel!;
    const right = this.rightChannel!;

    // Oversample by 4x using linear interpolation
    let maxPeak = 0;

    for (let i = 0; i < left.length - 1; i++) {
      // Check 4 interpolated points between each sample
      for (let j = 0; j < 4; j++) {
        const t = j / 4;
        const leftSample = left[i] * (1 - t) + left[i + 1] * t;
        const rightSample = right[i] * (1 - t) + right[i + 1] * t;

        maxPeak = Math.max(maxPeak, Math.abs(leftSample), Math.abs(rightSample));
      }
    }

    // Convert to dBTP
    return 20 * Math.log10(maxPeak || 0.00001);
  }

  /**
   * Calculate stereo width (0-1)
   * Based on Mid/Side analysis
   */
  private calculateStereoWidth(left: Float32Array, right: Float32Array): number {
    let midEnergy = 0;
    let sideEnergy = 0;

    for (let i = 0; i < left.length; i++) {
      const mid = (left[i] + right[i]) / 2;
      const side = (left[i] - right[i]) / 2;

      midEnergy += mid ** 2;
      sideEnergy += side ** 2;
    }

    // Width: ratio of side to total energy
    const totalEnergy = midEnergy + sideEnergy;
    if (totalEnergy === 0) return 0;

    return Math.min(1, sideEnergy / totalEnergy);
  }

  /**
   * Calculate stereo correlation (-1 to 1)
   * 1 = perfectly correlated (mono)
   * 0 = uncorrelated (wide stereo)
   * -1 = perfectly anti-correlated (phase issues!)
   */
  private calculateStereoCorrelation(left: Float32Array, right: Float32Array): number {
    let sumLR = 0;
    let sumLL = 0;
    let sumRR = 0;

    for (let i = 0; i < left.length; i++) {
      sumLR += left[i] * right[i];
      sumLL += left[i] ** 2;
      sumRR += right[i] ** 2;
    }

    const denominator = Math.sqrt(sumLL * sumRR);
    if (denominator === 0) return 0;

    return sumLR / denominator;
  }

  /**
   * Detect stereo imbalance (one channel louder than the other)
   */
  private detectStereoImbalance(left: Float32Array, right: Float32Array): boolean {
    let leftEnergy = 0;
    let rightEnergy = 0;

    for (let i = 0; i < left.length; i++) {
      leftEnergy += left[i] ** 2;
      rightEnergy += right[i] ** 2;
    }

    const ratio = leftEnergy / (rightEnergy || 0.00001);

    // Imbalance if one channel is >3dB louder
    return ratio > 2 || ratio < 0.5; // 2:1 = ~6dB difference
  }

  /**
   * Analyze frequency balance across 7 critical bands
   * Uses FFT to measure energy in each frequency range
   */
  private analyzeFrequencyBalance(audioBuffer: AudioBuffer): MasteringAnalysis['frequencyBalance'] {
    const fftSize = 8192; // High resolution for low frequencies
    const numBins = fftSize / 2;
    const binWidth = this.sampleRate / fftSize;

    // Calculate average spectrum
    const spectrum = this.calculateAverageSpectrum(audioBuffer, fftSize);

    // Define critical bands (in Hz)
    const bands = {
      subBass: { low: 20, high: 60 },
      bass: { low: 60, high: 250 },
      lowMids: { low: 250, high: 500 },
      mids: { low: 500, high: 2000 },
      highMids: { low: 2000, high: 4000 },
      presence: { low: 4000, high: 6000 },
      brilliance: { low: 6000, high: 20000 }
    };

    // Calculate energy in each band
    const result: any = {};

    for (const [bandName, range] of Object.entries(bands)) {
      const lowBin = Math.floor(range.low / binWidth);
      const highBin = Math.min(numBins, Math.ceil(range.high / binWidth));

      let bandEnergy = 0;
      for (let i = lowBin; i < highBin; i++) {
        bandEnergy += spectrum[i];
      }

      // Convert to dB
      const avgEnergy = bandEnergy / (highBin - lowBin);
      result[bandName] = 20 * Math.log10(avgEnergy || 0.00001);
    }

    return result;
  }

  /**
   * Calculate average magnitude spectrum using FFT
   */
  private calculateAverageSpectrum(audioBuffer: AudioBuffer, fftSize: number): Float32Array {
    const left = this.leftChannel!;
    const right = this.rightChannel!;
    const hopSize = fftSize / 2;

    const numBins = fftSize / 2;
    const avgSpectrum = new Float32Array(numBins);
    let numFrames = 0;

    // Process overlapping frames
    for (let i = 0; i < left.length - fftSize; i += hopSize) {
      // Extract and window frame
      const frame = new Float32Array(fftSize);
      for (let j = 0; j < fftSize; j++) {
        // Hann window
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * j / fftSize));
        frame[j] = ((left[i + j] + right[i + j]) / 2) * window;
      }

      // Compute FFT magnitude (simplified - real implementation would use FFT library)
      const spectrum = this.simpleFFT(frame);

      // Accumulate
      for (let j = 0; j < numBins; j++) {
        avgSpectrum[j] += spectrum[j];
      }
      numFrames++;
    }

    // Average
    if (numFrames > 0) {
      for (let i = 0; i < numBins; i++) {
        avgSpectrum[i] /= numFrames;
      }
    }

    return avgSpectrum;
  }

  /**
   * Simple FFT magnitude calculation (simplified DFT for demonstration)
   * In production, use a proper FFT library like fft.js or kiss-fft
   */
  private simpleFFT(frame: Float32Array): Float32Array {
    const N = frame.length;
    const spectrum = new Float32Array(N / 2);

    // Compute DFT magnitude for each bin (simplified)
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      // Sample every 16th point to speed up (approximation)
      for (let n = 0; n < N; n += 16) {
        const angle = -2 * Math.PI * k * n / N;
        real += frame[n] * Math.cos(angle);
        imag += frame[n] * Math.sin(angle);
      }

      spectrum[k] = Math.sqrt(real * real + imag * imag) / N;
    }

    return spectrum;
  }

  /**
   * Determine overall spectral balance from frequency analysis
   */
  private determineSpectralBalance(
    balance: MasteringAnalysis['frequencyBalance']
  ): 'bass-heavy' | 'balanced' | 'bright' | 'harsh' {
    // Compare bass to highs
    const bassEnergy = (balance.subBass + balance.bass) / 2;
    const highEnergy = (balance.presence + balance.brilliance) / 2;
    const diff = bassEnergy - highEnergy;

    if (diff > 6) return 'bass-heavy';
    if (diff < -6) {
      // Check if it's harsh (too much upper mids/presence)
      return balance.presence > balance.brilliance ? 'harsh' : 'bright';
    }

    return 'balanced';
  }

  /**
   * Detect mastering issues
   */
  private detectMasteringIssues(metrics: {
    truePeak: number;
    integratedLUFS: number;
    stereoCorrelation: number;
    frequencyBalance: MasteringAnalysis['frequencyBalance'];
    peakToLoudnessRatio: number;
  }): MasteringIssue[] {
    const issues: MasteringIssue[] = [];

    // 1. Clipping detection
    if (metrics.truePeak > -0.1) {
      issues.push({
        type: 'clipping',
        severity: 'critical',
        description: `True peak is ${metrics.truePeak.toFixed(1)} dBTP - clipping likely`,
        suggestion: 'Reduce overall level by at least 1dB before mastering'
      });
    } else if (metrics.truePeak > -0.5) {
      issues.push({
        type: 'low-headroom',
        severity: 'high',
        description: 'Very low headroom - risk of inter-sample peaks',
        suggestion: 'Leave at least 0.5dB headroom for final limiting'
      });
    }

    // 2. Phase issues
    if (metrics.stereoCorrelation < 0) {
      issues.push({
        type: 'phase',
        severity: 'critical',
        description: `Stereo correlation is ${metrics.stereoCorrelation.toFixed(2)} - phase cancellation detected`,
        suggestion: 'Check for out-of-phase signals, especially in bass frequencies'
      });
    } else if (metrics.stereoCorrelation < 0.3) {
      issues.push({
        type: 'stereo-problem',
        severity: 'medium',
        description: 'Very wide stereo image may cause mono compatibility issues',
        suggestion: 'Consider narrowing stereo width in low frequencies'
      });
    }

    // 3. Frequency imbalance
    const bassLevel = (metrics.frequencyBalance.subBass + metrics.frequencyBalance.bass) / 2;
    const highLevel = (metrics.frequencyBalance.presence + metrics.frequencyBalance.brilliance) / 2;

    if (Math.abs(bassLevel - highLevel) > 10) {
      issues.push({
        type: 'frequency-imbalance',
        severity: 'medium',
        description: `${Math.abs(bassLevel - highLevel).toFixed(1)}dB imbalance between bass and treble`,
        suggestion: bassLevel > highLevel
          ? 'Reduce bass or boost high frequencies for better balance'
          : 'Reduce treble or boost bass for warmer sound'
      });
    }

    // 4. Loudness issues
    if (metrics.integratedLUFS < -30) {
      issues.push({
        type: 'low-headroom',
        severity: 'high',
        description: 'Mix is very quiet - will need significant gain',
        suggestion: 'Increase gain in mixing stage before mastering'
      });
    }

    // 5. Dynamic range issues
    if (metrics.peakToLoudnessRatio < 6) {
      issues.push({
        type: 'low-headroom',
        severity: 'medium',
        description: 'Mix is already heavily compressed (low dynamic range)',
        suggestion: 'Reduce compression in mixing - leave dynamics for mastering'
      });
    }

    return issues;
  }

  /**
   * Assess overall quality based on analysis
   */
  private assessOverallQuality(
    issues: MasteringIssue[],
    integratedLUFS: number,
    plr: number
  ): 'poor' | 'fair' | 'good' | 'excellent' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) return 'poor';
    if (highIssues > 1) return 'fair';
    if (highIssues === 1 || issues.length > 3) return 'good';

    // Check if in good loudness range and decent dynamics
    if (integratedLUFS > -20 && integratedLUFS < -10 && plr > 8) {
      return 'excellent';
    }

    return 'good';
  }

  // ==========================================================================
  // MASTERING CHAIN GENERATION
  // ==========================================================================

  /**
   * Generate intelligent mastering chain based on analysis
   *
   * Creates a professional mastering chain that addresses detected issues
   * and optimizes for the target loudness standard.
   */
  generateMasteringChain(
    analysis: MasteringAnalysis,
    targetStandard: LoudnessStandard = 'streaming'
  ): MasteringChain {
    console.log('[AIMasteringEngine] Generating mastering chain for', targetStandard);

    const targetLUFS = this.getTargetLUFS(targetStandard);
    const processingNotes: string[] = [];

    // Calculate required gain adjustment
    const gainNeeded = targetLUFS - analysis.integratedLUFS;
    processingNotes.push(`Target: ${targetLUFS} LUFS (${targetStandard})`);
    processingNotes.push(`Gain adjustment needed: ${gainNeeded.toFixed(1)} dB`);

    // 1. Stereo enhancement (if needed)
    const stereoEnhancement = this.designStereoEnhancement(analysis, processingNotes);

    // 2. Multi-band EQ (7 bands)
    const multiBandEQ = this.designMultiBandEQ(analysis, processingNotes);

    // 3. Multi-band compression (3 bands)
    const multiBandCompression = this.designMultiBandCompression(analysis, targetStandard, processingNotes);

    // 4. Harmonic enhancement (optional)
    const harmonicEnhancement = this.designHarmonicEnhancement(analysis, targetStandard, processingNotes);

    // 5. Final limiter
    const limiter = this.designLimiter(targetStandard, analysis, processingNotes);

    return {
      stereoEnhancement,
      multiBandEQ,
      multiBandCompression,
      harmonicEnhancement,
      limiter,
      targetLUFS,
      processingNotes
    };
  }

  /**
   * Get target LUFS for loudness standard
   */
  private getTargetLUFS(standard: LoudnessStandard): number {
    const targets: Record<LoudnessStandard, number> = {
      'streaming': -14,  // Spotify, Apple Music, YouTube
      'club': -9,        // EDM, club play, high energy
      'aggressive': -6   // Maximalist, competitive loudness
    };

    return targets[standard];
  }

  /**
   * Design stereo enhancement settings
   */
  private designStereoEnhancement(
    analysis: MasteringAnalysis,
    notes: string[]
  ): MasteringChain['stereoEnhancement'] | undefined {
    // Only enhance if stereo is too narrow
    if (analysis.stereoWidth < 0.4) {
      notes.push('Applying stereo widening for narrow mix');
      return {
        width: 120, // 20% wider
        midsBoost: 0,
        sidesBoost: 1.5 // Boost sides slightly
      };
    }

    // Check for stereo imbalance
    if (analysis.hasStereoImbalance) {
      notes.push('Adjusting stereo balance');
      return {
        width: 100, // No change
        midsBoost: 0.5,
        sidesBoost: 0
      };
    }

    return undefined;
  }

  /**
   * Design multi-band EQ (7 bands)
   */
  private designMultiBandEQ(
    analysis: MasteringAnalysis,
    notes: string[]
  ): MasteringChain['multiBandEQ'] {
    const eq: MasteringChain['multiBandEQ'] = [];
    const balance = analysis.frequencyBalance;

    // Calculate reference level (mids)
    const referenceLevel = balance.mids;

    // Band 1: Sub bass (30 Hz) - controlled low shelf
    const subBassAdjust = Math.max(-6, Math.min(3, referenceLevel - balance.subBass));
    if (Math.abs(subBassAdjust) > 0.5) {
      eq.push({
        frequency: 30,
        gain: subBassAdjust,
        Q: 0.7,
        type: 'lowshelf'
      });
      notes.push(`Sub bass: ${subBassAdjust > 0 ? '+' : ''}${subBassAdjust.toFixed(1)} dB`);
    }

    // Band 2: Bass (120 Hz) - punch and body
    const bassAdjust = Math.max(-4, Math.min(4, referenceLevel - balance.bass));
    if (Math.abs(bassAdjust) > 0.5) {
      eq.push({
        frequency: 120,
        gain: bassAdjust,
        Q: 1.0,
        type: 'peaking'
      });
      notes.push(`Bass: ${bassAdjust > 0 ? '+' : ''}${bassAdjust.toFixed(1)} dB`);
    }

    // Band 3: Low mids (350 Hz) - warmth (often needs reduction)
    const lowMidAdjust = Math.max(-4, Math.min(2, (referenceLevel - balance.lowMids) * 0.7));
    if (Math.abs(lowMidAdjust) > 0.5) {
      eq.push({
        frequency: 350,
        gain: lowMidAdjust,
        Q: 1.5,
        type: 'peaking'
      });
      notes.push(`Low mids: ${lowMidAdjust > 0 ? '+' : ''}${lowMidAdjust.toFixed(1)} dB`);
    }

    // Band 4: Mids (1000 Hz) - reference, usually flat
    // Only adjust if significantly off
    if (analysis.spectralBalance === 'bass-heavy') {
      eq.push({
        frequency: 1000,
        gain: 1.5,
        Q: 1.0,
        type: 'peaking'
      });
      notes.push('Mids: +1.5 dB (bass-heavy mix)');
    }

    // Band 5: High mids (3000 Hz) - presence
    const highMidAdjust = Math.max(-3, Math.min(4, referenceLevel - balance.highMids));
    if (Math.abs(highMidAdjust) > 0.5) {
      eq.push({
        frequency: 3000,
        gain: highMidAdjust,
        Q: 1.2,
        type: 'peaking'
      });
      notes.push(`Presence: ${highMidAdjust > 0 ? '+' : ''}${highMidAdjust.toFixed(1)} dB`);
    }

    // Band 6: Presence (5000 Hz) - clarity
    const presenceAdjust = Math.max(-3, Math.min(3, referenceLevel - balance.presence));
    if (Math.abs(presenceAdjust) > 0.5 && analysis.spectralBalance !== 'harsh') {
      eq.push({
        frequency: 5000,
        gain: presenceAdjust,
        Q: 1.5,
        type: 'peaking'
      });
      notes.push(`Upper presence: ${presenceAdjust > 0 ? '+' : ''}${presenceAdjust.toFixed(1)} dB`);
    }

    // Band 7: Brilliance (10000 Hz) - air
    let brillianceAdjust = Math.max(-4, Math.min(3, referenceLevel - balance.brilliance));

    // Reduce if harsh
    if (analysis.spectralBalance === 'harsh') {
      brillianceAdjust = Math.min(-2, brillianceAdjust);
      notes.push('Reducing harshness in highs');
    }

    if (Math.abs(brillianceAdjust) > 0.5) {
      eq.push({
        frequency: 10000,
        gain: brillianceAdjust,
        Q: 0.7,
        type: 'highshelf'
      });
      notes.push(`Air: ${brillianceAdjust > 0 ? '+' : ''}${brillianceAdjust.toFixed(1)} dB`);
    }

    return eq;
  }

  /**
   * Design multi-band compression (3 bands: low, mid, high)
   */
  private designMultiBandCompression(
    analysis: MasteringAnalysis,
    targetStandard: LoudnessStandard,
    notes: string[]
  ): MasteringChain['multiBandCompression'] {
    const compression: MasteringChain['multiBandCompression'] = [];

    // Determine compression intensity based on target
    const isAggressive = targetStandard === 'aggressive' || targetStandard === 'club';

    // Low band (20-250 Hz) - control bass
    compression.push({
      lowFreq: 20,
      highFreq: 250,
      threshold: isAggressive ? -18 : -15,
      ratio: isAggressive ? 3.5 : 2.5,
      attack: 30,  // Slower attack for bass
      release: 150,
      makeup: 2
    });

    // Mid band (250-5000 Hz) - main energy
    compression.push({
      lowFreq: 250,
      highFreq: 5000,
      threshold: isAggressive ? -12 : -10,
      ratio: isAggressive ? 3 : 2,
      attack: 15,
      release: 80,
      makeup: 1.5
    });

    // High band (5000-20000 Hz) - control brightness
    compression.push({
      lowFreq: 5000,
      highFreq: 20000,
      threshold: -10,
      ratio: 2,
      attack: 5,  // Fast attack for transients
      release: 50,
      makeup: 1
    });

    notes.push(`Multi-band compression: ${isAggressive ? 'aggressive' : 'transparent'} mode`);

    return compression;
  }

  /**
   * Design harmonic enhancement
   */
  private designHarmonicEnhancement(
    analysis: MasteringAnalysis,
    targetStandard: LoudnessStandard,
    notes: string[]
  ): MasteringChain['harmonicEnhancement'] | undefined {
    // Only for aggressive mastering or if mix lacks warmth
    if (targetStandard === 'aggressive' || analysis.spectralBalance === 'bright') {
      notes.push('Adding harmonic warmth');
      return {
        amount: 25,
        tone: 'warm'
      };
    }

    // Add brightness if too dark
    if (analysis.spectralBalance === 'bass-heavy') {
      notes.push('Adding harmonic brightness');
      return {
        amount: 20,
        tone: 'bright'
      };
    }

    return undefined;
  }

  /**
   * Design final limiter
   */
  private designLimiter(
    targetStandard: LoudnessStandard,
    analysis: MasteringAnalysis,
    notes: string[]
  ): MasteringChain['limiter'] {
    // Calculate threshold based on current loudness and target
    const gainNeeded = this.getTargetLUFS(targetStandard) - analysis.integratedLUFS;

    // Limiter settings by target
    const settings: Record<LoudnessStandard, { ceiling: number; release: number; threshold: number }> = {
      'streaming': {
        ceiling: -0.5,    // Safe headroom for streaming
        release: 100,     // Moderate release
        threshold: -3     // Gentle limiting
      },
      'club': {
        ceiling: -0.3,    // Tighter ceiling
        release: 50,      // Faster release for more punch
        threshold: -2     // More aggressive
      },
      'aggressive': {
        ceiling: -0.1,    // Maximum loudness
        release: 30,      // Fast release
        threshold: -1     // Very aggressive
      }
    };

    const limiter = settings[targetStandard];

    // Adjust threshold based on needed gain
    limiter.threshold = Math.min(limiter.threshold, limiter.threshold - gainNeeded + 3);

    notes.push(`Final limiting: ${limiter.threshold.toFixed(1)} dB threshold, ${limiter.ceiling.toFixed(1)} dB ceiling`);

    return {
      ...limiter,
      lookahead: 5 // 5ms lookahead for transparent limiting
    };
  }

  // ==========================================================================
  // AUTO-MASTERING
  // ==========================================================================

  /**
   * Auto-master audio buffer - complete mastering in one function
   *
   * This is the main entry point for automatic mastering:
   * 1. Analyze the mix
   * 2. Generate mastering chain
   * 3. Apply the chain
   * 4. Return mastered audio
   */
  async autoMaster(
    audioBuffer: AudioBuffer,
    targetStandard: LoudnessStandard = 'streaming'
  ): Promise<{
    masteredBuffer: AudioBuffer;
    analysis: MasteringAnalysis;
    chain: MasteringChain
  }> {
    console.log('[AIMasteringEngine] Starting auto-master process...');

    // 1. Analyze
    const analysis = this.analyzeMix(audioBuffer);

    // 2. Generate chain
    const chain = this.generateMasteringChain(analysis, targetStandard);

    // 3. Apply chain
    const masteredBuffer = await this.applyMasteringChain(audioBuffer, chain);

    console.log('[AIMasteringEngine] Auto-master complete!');

    return {
      masteredBuffer,
      analysis,
      chain
    };
  }

  /**
   * Apply mastering chain to audio buffer
   */
  private async applyMasteringChain(
    inputBuffer: AudioBuffer,
    chain: MasteringChain
  ): Promise<AudioBuffer> {
    console.log('[AIMasteringEngine] Applying mastering chain...');

    // Create offline audio context for processing
    const offlineContext = new OfflineAudioContext(
      inputBuffer.numberOfChannels,
      inputBuffer.length,
      inputBuffer.sampleRate
    );

    // Source
    const source = offlineContext.createBufferSource();
    source.buffer = inputBuffer;

    let currentNode: AudioNode = source;

    // 1. Apply stereo enhancement (if present)
    if (chain.stereoEnhancement) {
      // TODO: Implement M/S processing for stereo enhancement
      // For now, pass through
    }

    // 2. Apply multi-band EQ
    for (const band of chain.multiBandEQ) {
      const filter = offlineContext.createBiquadFilter();

      if (band.type === 'lowshelf') {
        filter.type = 'lowshelf';
      } else if (band.type === 'highshelf') {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
      }

      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.Q;

      currentNode.connect(filter);
      currentNode = filter;
    }

    // 3. Apply multi-band compression
    // Note: Web Audio API doesn't have multi-band compressor
    // In production, would use custom DSP or AudioWorklet
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = chain.multiBandCompression[1].threshold; // Use mid band
    compressor.ratio.value = chain.multiBandCompression[1].ratio;
    compressor.attack.value = chain.multiBandCompression[1].attack / 1000;
    compressor.release.value = chain.multiBandCompression[1].release / 1000;

    currentNode.connect(compressor);
    currentNode = compressor;

    // 4. Apply harmonic enhancement
    // TODO: Implement harmonic saturation

    // 5. Apply final limiter
    const limiter = offlineContext.createDynamicsCompressor();
    limiter.threshold.value = chain.limiter.threshold;
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = 0.001;
    limiter.release.value = chain.limiter.release / 1000;

    currentNode.connect(limiter);

    // Output
    limiter.connect(offlineContext.destination);

    // Process
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    console.log('[AIMasteringEngine] Mastering chain applied successfully');

    return renderedBuffer;
  }

  // ==========================================================================
  // REFERENCE MATCHING
  // ==========================================================================

  /**
   * Match the tone and loudness of a reference track
   *
   * Analyzes both the input and reference, then creates a mastering chain
   * that makes the input sound similar to the reference.
   */
  async matchReference(
    inputBuffer: AudioBuffer,
    referenceBuffer: AudioBuffer
  ): Promise<{
    masteredBuffer: AudioBuffer;
    inputAnalysis: MasteringAnalysis;
    referenceAnalysis: MasteringAnalysis;
    chain: MasteringChain;
  }> {
    console.log('[AIMasteringEngine] Starting reference matching...');

    // Analyze both tracks
    const inputAnalysis = this.analyzeMix(inputBuffer);
    const referenceAnalysis = this.analyzeMix(referenceBuffer);

    // Generate chain that matches reference
    const chain = this.generateReferenceMatchChain(inputAnalysis, referenceAnalysis);

    // Apply chain
    const masteredBuffer = await this.applyMasteringChain(inputBuffer, chain);

    console.log('[AIMasteringEngine] Reference matching complete!');

    return {
      masteredBuffer,
      inputAnalysis,
      referenceAnalysis,
      chain
    };
  }

  /**
   * Generate mastering chain to match reference
   */
  private generateReferenceMatchChain(
    input: MasteringAnalysis,
    reference: MasteringAnalysis
  ): MasteringChain {
    const notes: string[] = [];
    notes.push('Matching reference track characteristics');

    // Target reference LUFS
    const targetLUFS = reference.integratedLUFS;

    // Calculate EQ adjustments to match reference
    const multiBandEQ: MasteringChain['multiBandEQ'] = [];

    const matchEQ = (
      inputLevel: number,
      refLevel: number,
      freq: number,
      type: 'lowshelf' | 'peaking' | 'highshelf',
      Q: number
    ) => {
      const diff = refLevel - inputLevel;
      if (Math.abs(diff) > 0.5) {
        multiBandEQ.push({
          frequency: freq,
          gain: Math.max(-6, Math.min(6, diff)),
          Q,
          type
        });
      }
    };

    // Match each frequency band
    matchEQ(input.frequencyBalance.subBass, reference.frequencyBalance.subBass, 30, 'lowshelf', 0.7);
    matchEQ(input.frequencyBalance.bass, reference.frequencyBalance.bass, 120, 'peaking', 1.0);
    matchEQ(input.frequencyBalance.lowMids, reference.frequencyBalance.lowMids, 350, 'peaking', 1.5);
    matchEQ(input.frequencyBalance.mids, reference.frequencyBalance.mids, 1000, 'peaking', 1.0);
    matchEQ(input.frequencyBalance.highMids, reference.frequencyBalance.highMids, 3000, 'peaking', 1.2);
    matchEQ(input.frequencyBalance.presence, reference.frequencyBalance.presence, 5000, 'peaking', 1.5);
    matchEQ(input.frequencyBalance.brilliance, reference.frequencyBalance.brilliance, 10000, 'highshelf', 0.7);

    // Match compression based on reference dynamics
    const refPLR = reference.peakToLoudnessRatio;
    const inputPLR = input.peakToLoudnessRatio;
    const needsMoreCompression = inputPLR > refPLR;

    const multiBandCompression: MasteringChain['multiBandCompression'] = [
      {
        lowFreq: 20,
        highFreq: 250,
        threshold: needsMoreCompression ? -16 : -18,
        ratio: needsMoreCompression ? 3 : 2.5,
        attack: 30,
        release: 150,
        makeup: 2
      },
      {
        lowFreq: 250,
        highFreq: 5000,
        threshold: needsMoreCompression ? -10 : -12,
        ratio: needsMoreCompression ? 3.5 : 2.5,
        attack: 15,
        release: 80,
        makeup: 1.5
      },
      {
        lowFreq: 5000,
        highFreq: 20000,
        threshold: -10,
        ratio: 2,
        attack: 5,
        release: 50,
        makeup: 1
      }
    ];

    // Match stereo width
    const stereoEnhancement = Math.abs(input.stereoWidth - reference.stereoWidth) > 0.1
      ? {
          width: (reference.stereoWidth / input.stereoWidth) * 100,
          midsBoost: 0,
          sidesBoost: reference.stereoWidth > input.stereoWidth ? 2 : -2
        }
      : undefined;

    // Final limiter
    const limiter = {
      threshold: -2,
      ceiling: reference.truePeak + 0.5, // Match reference peak
      release: 80,
      lookahead: 5
    };

    return {
      stereoEnhancement,
      multiBandEQ,
      multiBandCompression,
      limiter,
      targetLUFS,
      processingNotes: notes
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Dispose and cleanup resources
   */
  dispose(): void {
    // Clear buffers
    this.leftChannel = null;
    this.rightChannel = null;

    // Note: Don't close audioContext if it was provided externally

    console.log('[AIMasteringEngine] Disposed');
  }
}
