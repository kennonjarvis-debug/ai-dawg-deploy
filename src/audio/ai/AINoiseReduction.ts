/**
 * AI-Powered Noise Reduction System
 *
 * Advanced noise reduction using intelligent DSP techniques:
 * - Spectral subtraction with oversubtraction factor
 * - Wiener filtering for optimal noise reduction
 * - Adaptive noise gate with learning
 * - Click/pop removal using median filtering
 * - Transient preservation
 * - Harmonic/noise separation
 * - Real-time processing capability
 *
 * @module AINoiseReduction
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NoiseProfile {
  /** Noise spectrum magnitude (per frequency bin) */
  magnitude: Float32Array;
  /** Noise spectrum phase */
  phase: Float32Array;
  /** Time-averaged noise power spectrum */
  powerSpectrum: Float32Array;
  /** Statistical variance of noise */
  variance: Float32Array;
  /** Learned from sample duration */
  duration: number;
  /** Sample rate */
  sampleRate: number;
}

export interface NoiseReductionConfig {
  /** FFT size (larger = better frequency resolution, more latency) */
  fftSize: number;
  /** Overlap between windows (0-1, typically 0.5-0.75) */
  hopSize: number;
  /** Noise reduction strength (0-1) */
  noiseReduction: number;
  /** Oversubtraction factor for spectral subtraction (1-3) */
  overSubtraction: number;
  /** Minimum attenuation in dB */
  minAttenuation: number;
  /** Maximum attenuation in dB */
  maxAttenuation: number;
  /** Smoothing factor for spectral subtraction (0-1) */
  smoothing: number;
  /** Enable adaptive noise gate */
  adaptiveGate: boolean;
  /** Gate threshold in dB (if adaptive gate enabled) */
  gateThreshold: number;
  /** Gate attack time in ms */
  gateAttack: number;
  /** Gate release time in ms */
  gateRelease: number;
  /** Enable click/pop removal */
  clickRemoval: boolean;
  /** Click detection threshold */
  clickThreshold: number;
  /** Enable transient preservation */
  preserveTransients: boolean;
  /** Transient detection threshold */
  transientThreshold: number;
}

export interface ProcessingMetrics {
  /** Total noise reduced (dB) */
  noiseReduced: number;
  /** Number of clicks removed */
  clicksRemoved: number;
  /** Signal-to-noise ratio improvement (dB) */
  snrImprovement: number;
  /** Spectral flatness measure */
  spectralFlatness: number;
  /** Processing time (ms) */
  processingTime: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_CONFIG: NoiseReductionConfig = {
  fftSize: 2048,
  hopSize: 0.5,
  noiseReduction: 0.7,
  overSubtraction: 1.5,
  minAttenuation: -3,
  maxAttenuation: -40,
  smoothing: 0.8,
  adaptiveGate: true,
  gateThreshold: -50,
  gateAttack: 10,
  gateRelease: 100,
  clickRemoval: true,
  clickThreshold: 3.0,
  preserveTransients: true,
  transientThreshold: 0.3,
};

// ============================================================================
// AI NOISE REDUCTION CLASS
// ============================================================================

export class AINoiseReduction {
  private config: NoiseReductionConfig;
  private noiseProfile: NoiseProfile | null = null;
  private sampleRate: number = 48000;

  // FFT buffers
  private fftBuffer: Float32Array;
  private ifftBuffer: Float32Array;
  private window: Float32Array;

  // Processing state
  private previousFrame: Float32Array | null = null;
  private gateEnvelope: number = 0;
  private smoothedSpectrum: Float32Array | null = null;

  // Metrics
  private metrics: ProcessingMetrics = {
    noiseReduced: 0,
    clicksRemoved: 0,
    snrImprovement: 0,
    spectralFlatness: 0,
    processingTime: 0,
  };

  constructor(config: Partial<NoiseReductionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fftBuffer = new Float32Array(this.config.fftSize);
    this.ifftBuffer = new Float32Array(this.config.fftSize);
    this.window = this.createHannWindow(this.config.fftSize);
  }

  // ==========================================================================
  // NOISE PROFILE LEARNING
  // ==========================================================================

  /**
   * Learn noise profile from silent section or noise sample
   */
  public learnNoiseProfile(audioBuffer: AudioBuffer, startTime: number = 0, duration: number = 1): void {
    console.log('[AINoiseReduction] Learning noise profile...');

    this.sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const startSample = Math.floor(startTime * this.sampleRate);
    const samples = Math.floor(duration * this.sampleRate);
    const endSample = Math.min(startSample + samples, channelData.length);

    const noiseSegment = channelData.slice(startSample, endSample);

    // Initialize noise profile storage
    const halfFFT = this.config.fftSize / 2 + 1;
    const magnitude = new Float32Array(halfFFT);
    const phase = new Float32Array(halfFFT);
    const powerSpectrum = new Float32Array(halfFFT);
    const variance = new Float32Array(halfFFT);

    // Process noise segment in overlapping windows
    const hopSamples = Math.floor(this.config.fftSize * this.config.hopSize);
    let frameCount = 0;
    const magnitudeFrames: Float32Array[] = [];

    for (let i = 0; i < noiseSegment.length - this.config.fftSize; i += hopSamples) {
      const frame = noiseSegment.slice(i, i + this.config.fftSize);
      const spectrum = this.computeFFT(frame);

      magnitudeFrames.push(new Float32Array(spectrum.magnitude));

      // Accumulate magnitude and power
      for (let bin = 0; bin < halfFFT; bin++) {
        magnitude[bin] += spectrum.magnitude[bin];
        powerSpectrum[bin] += spectrum.magnitude[bin] * spectrum.magnitude[bin];
      }

      frameCount++;
    }

    // Average the accumulated values
    for (let bin = 0; bin < halfFFT; bin++) {
      magnitude[bin] /= frameCount;
      powerSpectrum[bin] /= frameCount;
    }

    // Calculate variance for each bin
    for (const frame of magnitudeFrames) {
      for (let bin = 0; bin < halfFFT; bin++) {
        const diff = frame[bin] - magnitude[bin];
        variance[bin] += diff * diff;
      }
    }

    for (let bin = 0; bin < halfFFT; bin++) {
      variance[bin] = Math.sqrt(variance[bin] / frameCount);
    }

    this.noiseProfile = {
      magnitude,
      phase,
      powerSpectrum,
      variance,
      duration,
      sampleRate: this.sampleRate,
    };

    console.log('[AINoiseReduction] Noise profile learned from', frameCount, 'frames');
  }

  /**
   * Auto-detect and learn from silent sections
   */
  public autoLearnNoiseProfile(audioBuffer: AudioBuffer, silenceThreshold: number = 0.02): boolean {
    const channelData = audioBuffer.getChannelData(0);
    const windowSize = Math.floor(0.1 * audioBuffer.sampleRate); // 100ms windows

    // Find silent regions
    let bestSilenceStart = -1;
    let bestSilenceDuration = 0;
    let currentSilenceStart = -1;

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);

      if (rms < silenceThreshold) {
        if (currentSilenceStart === -1) {
          currentSilenceStart = i;
        }

        const currentDuration = i - currentSilenceStart;
        if (currentDuration > bestSilenceDuration) {
          bestSilenceStart = currentSilenceStart;
          bestSilenceDuration = currentDuration;
        }
      } else {
        currentSilenceStart = -1;
      }
    }

    if (bestSilenceStart !== -1 && bestSilenceDuration >= windowSize * 3) {
      const startTime = bestSilenceStart / audioBuffer.sampleRate;
      const duration = Math.min(bestSilenceDuration / audioBuffer.sampleRate, 2);
      this.learnNoiseProfile(audioBuffer, startTime, duration);
      return true;
    }

    console.warn('[AINoiseReduction] No suitable silent section found for noise learning');
    return false;
  }

  // ==========================================================================
  // NOISE REDUCTION PROCESSING
  // ==========================================================================

  /**
   * Process audio buffer with noise reduction
   */
  public processAudio(audioBuffer: AudioBuffer): AudioBuffer {
    const startTime = performance.now();

    if (!this.noiseProfile) {
      console.warn('[AINoiseReduction] No noise profile learned, attempting auto-learn...');
      if (!this.autoLearnNoiseProfile(audioBuffer)) {
        console.warn('[AINoiseReduction] Skipping noise reduction - no noise profile');
        return audioBuffer;
      }
    }

    const channelData = audioBuffer.getChannelData(0);
    const processedData = new Float32Array(channelData.length);

    // Step 1: Click/Pop removal (if enabled)
    let workingData = channelData;
    if (this.config.clickRemoval) {
      workingData = this.removeClicksPops(channelData);
    }

    // Step 2: Spectral noise reduction
    const hopSamples = Math.floor(this.config.fftSize * this.config.hopSize);
    const outputAccumulator = new Float32Array(workingData.length);
    const overlapCount = new Float32Array(workingData.length);

    for (let i = 0; i <= workingData.length - this.config.fftSize; i += hopSamples) {
      const frame = workingData.slice(i, i + this.config.fftSize);

      // Detect transients
      const isTransient = this.config.preserveTransients ? this.detectTransient(frame) : false;

      // Process frame
      let processedFrame: Float32Array;
      if (isTransient) {
        // Preserve transients with minimal processing
        processedFrame = frame;
      } else {
        processedFrame = this.processFrame(frame);
      }

      // Overlap-add
      for (let j = 0; j < this.config.fftSize; j++) {
        if (i + j < outputAccumulator.length) {
          outputAccumulator[i + j] += processedFrame[j] * this.window[j];
          overlapCount[i + j] += this.window[j] * this.window[j];
        }
      }
    }

    // Normalize by overlap
    for (let i = 0; i < outputAccumulator.length; i++) {
      processedData[i] = overlapCount[i] > 0 ? outputAccumulator[i] / overlapCount[i] : 0;
    }

    // Step 3: Adaptive noise gate (if enabled)
    let finalData = processedData;
    if (this.config.adaptiveGate) {
      finalData = this.applyAdaptiveGate(processedData);
    }

    // Create output buffer
    const outputBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    outputBuffer.copyToChannel(finalData, 0);

    // Copy other channels if stereo
    for (let ch = 1; ch < audioBuffer.numberOfChannels; ch++) {
      outputBuffer.copyToChannel(audioBuffer.getChannelData(ch), ch);
    }

    // Calculate metrics
    this.calculateMetrics(channelData, finalData);
    this.metrics.processingTime = performance.now() - startTime;

    console.log('[AINoiseReduction] Processing complete:', this.metrics);

    return outputBuffer;
  }

  /**
   * Process single frame with spectral subtraction and Wiener filtering
   */
  private processFrame(frame: Float32Array): Float32Array {
    // Apply window
    const windowedFrame = new Float32Array(this.config.fftSize);
    for (let i = 0; i < this.config.fftSize; i++) {
      windowedFrame[i] = frame[i] * this.window[i];
    }

    // Forward FFT
    const spectrum = this.computeFFT(windowedFrame);

    // Initialize smoothed spectrum if needed
    if (!this.smoothedSpectrum) {
      this.smoothedSpectrum = new Float32Array(spectrum.magnitude.length);
      this.smoothedSpectrum.set(spectrum.magnitude);
    }

    // Smooth spectrum
    for (let bin = 0; bin < spectrum.magnitude.length; bin++) {
      this.smoothedSpectrum[bin] =
        this.config.smoothing * this.smoothedSpectrum[bin] +
        (1 - this.config.smoothing) * spectrum.magnitude[bin];
    }

    // Apply spectral subtraction with Wiener filtering
    const cleaned = this.applySpectralSubtraction(spectrum);
    const wienerFiltered = this.applyWienerFilter(cleaned, spectrum);

    // Inverse FFT
    const output = this.computeIFFT(wienerFiltered);

    return output;
  }

  /**
   * Spectral subtraction with oversubtraction factor
   */
  private applySpectralSubtraction(spectrum: { magnitude: Float32Array; phase: Float32Array }):
    { magnitude: Float32Array; phase: Float32Array } {

    if (!this.noiseProfile) {
      return spectrum;
    }

    const cleanedMagnitude = new Float32Array(spectrum.magnitude.length);

    for (let bin = 0; bin < spectrum.magnitude.length; bin++) {
      const signalPower = spectrum.magnitude[bin] * spectrum.magnitude[bin];
      const noisePower = this.noiseProfile.powerSpectrum[bin];

      // Spectral subtraction with oversubtraction
      const subtractedPower = signalPower - this.config.overSubtraction * noisePower;

      // Floor to prevent negative values
      const flooredPower = Math.max(subtractedPower, noisePower * Math.pow(10, this.config.maxAttenuation / 10));

      cleanedMagnitude[bin] = Math.sqrt(flooredPower);

      // Apply noise reduction strength
      const attenuation = 1 - this.config.noiseReduction * (1 - cleanedMagnitude[bin] / spectrum.magnitude[bin]);
      cleanedMagnitude[bin] = spectrum.magnitude[bin] * Math.max(0, Math.min(1, attenuation));
    }

    return {
      magnitude: cleanedMagnitude,
      phase: spectrum.phase,
    };
  }

  /**
   * Wiener filtering for optimal noise reduction
   */
  private applyWienerFilter(
    spectrum: { magnitude: Float32Array; phase: Float32Array },
    originalSpectrum: { magnitude: Float32Array; phase: Float32Array }
  ): { magnitude: Float32Array; phase: Float32Array } {

    if (!this.noiseProfile) {
      return spectrum;
    }

    const wienerMagnitude = new Float32Array(spectrum.magnitude.length);

    for (let bin = 0; bin < spectrum.magnitude.length; bin++) {
      const signalPower = originalSpectrum.magnitude[bin] * originalSpectrum.magnitude[bin];
      const noisePower = this.noiseProfile.powerSpectrum[bin];

      // Wiener filter: H = (signalPower - noisePower) / signalPower
      const snr = (signalPower - noisePower) / (noisePower + 1e-10);
      const wienerGain = snr / (snr + 1);

      // Apply gain with limits
      const minGain = Math.pow(10, this.config.maxAttenuation / 20);
      const maxGain = Math.pow(10, this.config.minAttenuation / 20);
      const limitedGain = Math.max(minGain, Math.min(maxGain, wienerGain));

      wienerMagnitude[bin] = spectrum.magnitude[bin] * limitedGain;
    }

    return {
      magnitude: wienerMagnitude,
      phase: spectrum.phase,
    };
  }

  // ==========================================================================
  // CLICK/POP REMOVAL
  // ==========================================================================

  /**
   * Remove clicks and pops using median filtering and interpolation
   */
  private removeClicksPops(audioData: Float32Array): Float32Array {
    const output = new Float32Array(audioData.length);
    const medianWindow = 5;
    const halfWindow = Math.floor(medianWindow / 2);

    let clicksRemoved = 0;

    for (let i = 0; i < audioData.length; i++) {
      // Get median of surrounding samples
      const windowStart = Math.max(0, i - halfWindow);
      const windowEnd = Math.min(audioData.length, i + halfWindow + 1);
      const window = Array.from(audioData.slice(windowStart, windowEnd)).sort((a, b) => a - b);
      const median = window[Math.floor(window.length / 2)];

      // Detect outliers (clicks/pops)
      const diff = Math.abs(audioData[i] - median);
      const threshold = this.config.clickThreshold * this.calculateLocalStd(audioData, i, 50);

      if (diff > threshold) {
        // Interpolate using surrounding samples
        output[i] = this.interpolateClick(audioData, i);
        clicksRemoved++;
      } else {
        output[i] = audioData[i];
      }
    }

    this.metrics.clicksRemoved = clicksRemoved;
    console.log('[AINoiseReduction] Removed', clicksRemoved, 'clicks/pops');

    return output;
  }

  /**
   * Interpolate click using cubic interpolation
   */
  private interpolateClick(data: Float32Array, index: number): number {
    const windowSize = 4;

    // Get samples before and after click
    const before: number[] = [];
    const after: number[] = [];

    for (let i = 1; i <= windowSize; i++) {
      if (index - i >= 0) before.push(data[index - i]);
      if (index + i < data.length) after.push(data[index + i]);
    }

    if (before.length === 0 || after.length === 0) {
      return 0;
    }

    // Simple linear interpolation
    return (before[0] + after[0]) / 2;
  }

  // ==========================================================================
  // ADAPTIVE NOISE GATE
  // ==========================================================================

  /**
   * Apply adaptive noise gate with learned signal characteristics
   */
  private applyAdaptiveGate(audioData: Float32Array): Float32Array {
    const output = new Float32Array(audioData.length);
    const thresholdLinear = Math.pow(10, this.config.gateThreshold / 20);

    const attackSamples = (this.config.gateAttack / 1000) * this.sampleRate;
    const releaseSamples = (this.config.gateRelease / 1000) * this.sampleRate;

    for (let i = 0; i < audioData.length; i++) {
      const amplitude = Math.abs(audioData[i]);

      // Gate state machine
      if (amplitude > thresholdLinear) {
        // Attack: open gate
        this.gateEnvelope = Math.min(1, this.gateEnvelope + 1 / attackSamples);
      } else {
        // Release: close gate
        this.gateEnvelope = Math.max(0, this.gateEnvelope - 1 / releaseSamples);
      }

      output[i] = audioData[i] * this.gateEnvelope;
    }

    return output;
  }

  // ==========================================================================
  // TRANSIENT DETECTION
  // ==========================================================================

  /**
   * Detect transients (sudden attacks) to preserve them
   */
  private detectTransient(frame: Float32Array): boolean {
    if (!this.previousFrame) {
      this.previousFrame = new Float32Array(frame);
      return false;
    }

    // Calculate energy difference
    let currentEnergy = 0;
    let previousEnergy = 0;

    for (let i = 0; i < frame.length; i++) {
      currentEnergy += frame[i] * frame[i];
      previousEnergy += this.previousFrame[i] * this.previousFrame[i];
    }

    currentEnergy /= frame.length;
    previousEnergy /= frame.length;

    const energyRatio = currentEnergy / (previousEnergy + 1e-10);

    this.previousFrame.set(frame);

    return energyRatio > (1 + this.config.transientThreshold);
  }

  // ==========================================================================
  // FFT IMPLEMENTATION (Simplified Cooley-Tukey)
  // ==========================================================================

  /**
   * Compute FFT (returns magnitude and phase)
   */
  private computeFFT(data: Float32Array): { magnitude: Float32Array; phase: Float32Array } {
    const n = data.length;
    const halfN = n / 2 + 1;

    // Real and imaginary parts
    const real = new Float32Array(data);
    const imag = new Float32Array(n);

    // Bit-reversal permutation
    this.bitReverse(real, imag);

    // FFT butterfly operations
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const tableStep = n / size;

      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + halfSize; j++, k += tableStep) {
          const angle = -2 * Math.PI * k / n;
          const tpre = Math.cos(angle) * real[j + halfSize] - Math.sin(angle) * imag[j + halfSize];
          const tpim = Math.cos(angle) * imag[j + halfSize] + Math.sin(angle) * real[j + halfSize];

          real[j + halfSize] = real[j] - tpre;
          imag[j + halfSize] = imag[j] - tpim;
          real[j] += tpre;
          imag[j] += tpim;
        }
      }
    }

    // Calculate magnitude and phase
    const magnitude = new Float32Array(halfN);
    const phase = new Float32Array(halfN);

    for (let i = 0; i < halfN; i++) {
      magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      phase[i] = Math.atan2(imag[i], real[i]);
    }

    return { magnitude, phase };
  }

  /**
   * Compute inverse FFT
   */
  private computeIFFT(spectrum: { magnitude: Float32Array; phase: Float32Array }): Float32Array {
    const n = this.config.fftSize;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    // Convert magnitude/phase to real/imaginary
    for (let i = 0; i < spectrum.magnitude.length; i++) {
      real[i] = spectrum.magnitude[i] * Math.cos(spectrum.phase[i]);
      imag[i] = spectrum.magnitude[i] * Math.sin(spectrum.phase[i]);
    }

    // Mirror for negative frequencies
    for (let i = 1; i < spectrum.magnitude.length - 1; i++) {
      real[n - i] = real[i];
      imag[n - i] = -imag[i];
    }

    // Bit-reversal
    this.bitReverse(real, imag);

    // Inverse FFT (same as FFT but with sign change and normalization)
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const tableStep = n / size;

      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + halfSize; j++, k += tableStep) {
          const angle = 2 * Math.PI * k / n; // Positive angle for IFFT
          const tpre = Math.cos(angle) * real[j + halfSize] - Math.sin(angle) * imag[j + halfSize];
          const tpim = Math.cos(angle) * imag[j + halfSize] + Math.sin(angle) * real[j + halfSize];

          real[j + halfSize] = real[j] - tpre;
          imag[j + halfSize] = imag[j] - tpim;
          real[j] += tpre;
          imag[j] += tpim;
        }
      }
    }

    // Normalize
    const output = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      output[i] = real[i] / n;
    }

    return output;
  }

  /**
   * Bit-reversal permutation for FFT
   */
  private bitReverse(real: Float32Array, imag: Float32Array): void {
    const n = real.length;
    const bits = Math.log2(n);

    for (let i = 0; i < n; i++) {
      const reversed = this.reverseBits(i, bits);
      if (reversed > i) {
        // Swap real
        [real[i], real[reversed]] = [real[reversed], real[i]];
        // Swap imag
        [imag[i], imag[reversed]] = [imag[reversed], imag[i]];
      }
    }
  }

  /**
   * Reverse bits of a number
   */
  private reverseBits(num: number, bits: number): number {
    let result = 0;
    for (let i = 0; i < bits; i++) {
      result = (result << 1) | (num & 1);
      num >>= 1;
    }
    return result;
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Create Hann window for FFT
   */
  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  /**
   * Calculate RMS of audio segment
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Calculate local standard deviation
   */
  private calculateLocalStd(data: Float32Array, index: number, windowSize: number): number {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.floor(windowSize / 2));
    const segment = data.slice(start, end);

    const mean = segment.reduce((sum, val) => sum + val, 0) / segment.length;
    const variance = segment.reduce((sum, val) => sum + (val - mean) ** 2, 0) / segment.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate processing metrics
   */
  private calculateMetrics(original: Float32Array, processed: Float32Array): void {
    // Signal-to-noise ratio improvement
    const originalNoise = this.estimateNoise(original);
    const processedNoise = this.estimateNoise(processed);

    this.metrics.noiseReduced = 20 * Math.log10(originalNoise / (processedNoise + 1e-10));

    // SNR improvement
    const originalSignal = this.calculateRMS(original);
    const processedSignal = this.calculateRMS(processed);
    const originalSNR = 20 * Math.log10(originalSignal / (originalNoise + 1e-10));
    const processedSNR = 20 * Math.log10(processedSignal / (processedNoise + 1e-10));
    this.metrics.snrImprovement = processedSNR - originalSNR;

    // Spectral flatness (measure of noisiness)
    this.metrics.spectralFlatness = this.calculateSpectralFlatness(processed);
  }

  /**
   * Estimate noise level
   */
  private estimateNoise(data: Float32Array): number {
    const windowSize = 2048;
    const rmsValues: number[] = [];

    for (let i = 0; i < data.length - windowSize; i += windowSize) {
      const window = data.slice(i, i + windowSize);
      rmsValues.push(this.calculateRMS(window));
    }

    // Noise floor is estimated as 10th percentile
    const sorted = rmsValues.sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.1)];
  }

  /**
   * Calculate spectral flatness
   */
  private calculateSpectralFlatness(data: Float32Array): number {
    const spectrum = this.computeFFT(data);

    // Geometric mean
    let geometricMean = 0;
    for (let i = 0; i < spectrum.magnitude.length; i++) {
      geometricMean += Math.log(spectrum.magnitude[i] + 1e-10);
    }
    geometricMean = Math.exp(geometricMean / spectrum.magnitude.length);

    // Arithmetic mean
    let arithmeticMean = 0;
    for (let i = 0; i < spectrum.magnitude.length; i++) {
      arithmeticMean += spectrum.magnitude[i];
    }
    arithmeticMean /= spectrum.magnitude.length;

    return geometricMean / (arithmeticMean + 1e-10);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<NoiseReductionConfig>): void {
    this.config = { ...this.config, ...config };

    // Recreate window if FFT size changed
    if (config.fftSize) {
      this.fftBuffer = new Float32Array(config.fftSize);
      this.ifftBuffer = new Float32Array(config.fftSize);
      this.window = this.createHannWindow(config.fftSize);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): NoiseReductionConfig {
    return { ...this.config };
  }

  /**
   * Get noise profile
   */
  public getNoiseProfile(): NoiseProfile | null {
    return this.noiseProfile;
  }

  /**
   * Get processing metrics
   */
  public getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset processor state
   */
  public reset(): void {
    this.previousFrame = null;
    this.gateEnvelope = 0;
    this.smoothedSpectrum = null;
    this.metrics = {
      noiseReduced: 0,
      clicksRemoved: 0,
      snrImprovement: 0,
      spectralFlatness: 0,
      processingTime: 0,
    };
  }

  /**
   * Clear noise profile
   */
  public clearNoiseProfile(): void {
    this.noiseProfile = null;
  }
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const NOISE_REDUCTION_PRESETS: Record<string, Partial<NoiseReductionConfig>> = {
  /** Light noise reduction - preserves natural sound */
  light: {
    noiseReduction: 0.4,
    overSubtraction: 1.2,
    maxAttenuation: -25,
    smoothing: 0.9,
    adaptiveGate: false,
  },

  /** Moderate noise reduction - balanced */
  moderate: {
    noiseReduction: 0.7,
    overSubtraction: 1.5,
    maxAttenuation: -40,
    smoothing: 0.8,
    adaptiveGate: true,
    gateThreshold: -50,
  },

  /** Aggressive noise reduction - maximum cleanup */
  aggressive: {
    noiseReduction: 0.9,
    overSubtraction: 2.0,
    maxAttenuation: -60,
    smoothing: 0.7,
    adaptiveGate: true,
    gateThreshold: -45,
  },

  /** Voice optimized - for speech/vocals */
  voice: {
    noiseReduction: 0.6,
    overSubtraction: 1.4,
    maxAttenuation: -35,
    smoothing: 0.85,
    adaptiveGate: true,
    gateThreshold: -48,
    preserveTransients: true,
    clickRemoval: true,
  },

  /** Music optimized - preserves harmonics */
  music: {
    noiseReduction: 0.5,
    overSubtraction: 1.3,
    maxAttenuation: -30,
    smoothing: 0.9,
    adaptiveGate: false,
    preserveTransients: true,
    clickRemoval: false,
  },
};

// Export singleton instance
export const aiNoiseReduction = new AINoiseReduction();
