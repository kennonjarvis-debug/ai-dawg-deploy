/**
 * Melody Extractor with PitchFinder Integration
 *
 * Enhanced version that can use the pitchfinder library (already installed)
 * as an alternative to the built-in YIN implementation.
 *
 * Usage:
 *   const extractor = new MelodyExtractorPF({
 *     algorithm: 'YIN',        // or 'AMDF', 'DynamicWavelet', 'Autocorrelation'
 *     usePitchFinder: true     // Use pitchfinder library
 *   });
 */

import PitchFinder from 'pitchfinder';
import {
  MelodyExtractor,
  type PitchFrame,
  type PitchContour,
  type PitchTrackingOptions,
  type ExtractionOptions,
} from './melody-extractor';

// ==================== TYPES ====================

export interface PitchFinderOptions extends ExtractionOptions {
  /** Use pitchfinder library instead of built-in YIN */
  usePitchFinder?: boolean;
  /** Algorithm to use from pitchfinder */
  algorithm?: 'YIN' | 'AMDF' | 'DynamicWavelet' | 'Autocorrelation';
  /** PitchFinder-specific options */
  pitchFinderConfig?: {
    threshold?: number;
    probabilityThreshold?: number;
    minVolumeDecibels?: number;
  };
}

// ==================== ENHANCED MELODY EXTRACTOR ====================

export class MelodyExtractorPF extends MelodyExtractor {
  private usePitchFinder: boolean;
  private algorithm: string;
  private pitchFinderConfig: any;

  constructor(options: PitchFinderOptions = {}) {
    super(options);
    this.usePitchFinder = options.usePitchFinder ?? false;
    this.algorithm = options.algorithm || 'YIN';
    this.pitchFinderConfig = options.pitchFinderConfig || {};
  }

  /**
   * Override trackPitch to use pitchfinder library
   */
  async trackPitch(
    audio: AudioBuffer,
    options: Partial<PitchTrackingOptions> = {}
  ): Promise<PitchContour> {
    if (this.usePitchFinder) {
      return this.trackPitchWithPitchFinder(audio, options);
    } else {
      // Use built-in YIN implementation
      return super.trackPitch(audio, options);
    }
  }

  /**
   * Track pitch using pitchfinder library
   */
  private async trackPitchWithPitchFinder(
    audio: AudioBuffer,
    options: Partial<PitchTrackingOptions> = {}
  ): Promise<PitchContour> {
    const sampleRate = audio.sampleRate;
    const samples = audio.getChannelData(0);
    const frames: PitchFrame[] = [];

    // Configure pitch detector
    const detectorConfig = {
      sampleRate,
      threshold: this.pitchFinderConfig.threshold || 0.1,
      probabilityThreshold:
        this.pitchFinderConfig.probabilityThreshold || 0.9,
      minVolumeDecibels: this.pitchFinderConfig.minVolumeDecibels || -100,
    };

    // Select algorithm
    let detectPitch: (buffer: Float32Array) => number | null;

    switch (this.algorithm) {
      case 'YIN':
        detectPitch = PitchFinder.YIN(detectorConfig);
        break;

      case 'AMDF':
        detectPitch = PitchFinder.AMDF(detectorConfig);
        break;

      case 'DynamicWavelet':
        detectPitch = PitchFinder.DynamicWavelet(detectorConfig);
        break;

      case 'Autocorrelation':
        detectPitch = PitchFinder.ACF2PLUS(detectorConfig);
        break;

      default:
        detectPitch = PitchFinder.YIN(detectorConfig);
    }

    // Process audio in frames
    const hopSize = options.hopSize || 512;
    const bufferSize = 2048;

    for (let i = 0; i < samples.length - bufferSize; i += hopSize) {
      const time = i / sampleRate;
      const buffer = samples.slice(i, i + bufferSize);

      // Calculate amplitude
      const amplitude = this.calculateRMS(buffer);

      // Detect pitch
      const frequency = detectPitch(buffer);

      // Determine if voiced
      const voiced = frequency !== null && frequency > 0;
      const confidenceEstimate = voiced ? this.estimateConfidence(buffer, frequency!) : 0;

      frames.push({
        time,
        frequency: frequency || 0,
        confidence: confidenceEstimate,
        voiced,
        amplitude,
      });
    }

    // Apply smoothing
    const smoothedFrames = this.smoothPitchContour(
      frames,
      this.options.smoothingWindow
    );

    // Calculate statistics
    const voicedFrames = smoothedFrames.filter((f) => f.voiced);
    const frequencies = voicedFrames.map((f) => f.frequency);

    const avgFrequency =
      frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length || 0;

    const pitchRange = {
      min: frequencies.length > 0 ? Math.min(...frequencies) : 0,
      max: frequencies.length > 0 ? Math.max(...frequencies) : 0,
    };

    const voicedPercentage = voicedFrames.length / smoothedFrames.length || 0;

    return {
      frames: smoothedFrames,
      avgFrequency,
      pitchRange,
      voicedPercentage,
    };
  }

  /**
   * Estimate confidence based on signal clarity
   */
  private estimateConfidence(buffer: Float32Array, frequency: number): number {
    // Calculate signal-to-noise ratio
    const rms = this.calculateRMS(buffer);
    if (rms < 0.01) return 0; // Too quiet

    // Calculate periodicity strength via autocorrelation
    const period = Math.round(44100 / frequency);
    const autocorr = this.calculateAutocorrelation(buffer, period);

    // Normalize to 0-1
    return Math.max(0, Math.min(1, autocorr));
  }

  /**
   * Calculate autocorrelation at specific lag
   */
  private calculateAutocorrelation(buffer: Float32Array, lag: number): number {
    let sum = 0;
    let norm = 0;

    for (let i = 0; i < buffer.length - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      norm += buffer[i] * buffer[i];
    }

    return norm > 0 ? sum / norm : 0;
  }

  /**
   * Calculate RMS amplitude
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Smooth pitch contour to reduce vibrato
   */
  private smoothPitchContour(
    frames: PitchFrame[],
    windowSize: number
  ): PitchFrame[] {
    const smoothed: PitchFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(frames.length, i + Math.ceil(windowSize / 2));
      const window = frames.slice(start, end).filter((f) => f.voiced);

      if (window.length === 0) {
        smoothed.push(frames[i]);
        continue;
      }

      // Median frequency
      const frequencies = window.map((f) => f.frequency).sort((a, b) => a - b);
      const medianFreq = frequencies[Math.floor(frequencies.length / 2)];

      // Average confidence and amplitude
      const avgConfidence =
        window.reduce((sum, f) => sum + f.confidence, 0) / window.length;
      const avgAmplitude =
        window.reduce((sum, f) => sum + f.amplitude, 0) / window.length;

      smoothed.push({
        ...frames[i],
        frequency: frames[i].voiced ? medianFreq : 0,
        confidence: avgConfidence,
        amplitude: avgAmplitude,
      });
    }

    return smoothed;
  }
}

// ==================== ALGORITHM COMPARISON ====================

/**
 * Compare different pitch detection algorithms on same audio
 */
export async function compareAlgorithms(
  audioBuffer: AudioBuffer,
  options: Partial<ExtractionOptions> = {}
): Promise<{
  algorithm: string;
  avgConfidence: number;
  totalNotes: number;
  processingTime: number;
}[]> {
  const algorithms = ['YIN', 'AMDF', 'DynamicWavelet', 'Autocorrelation'] as const;
  const results = [];

  for (const algorithm of algorithms) {
    const extractor = new MelodyExtractorPF({
      ...options,
      usePitchFinder: true,
      algorithm,
    });

    const startTime = performance.now();
    const result = await extractor.extractMelody(audioBuffer, options);
    const processingTime = performance.now() - startTime;

    results.push({
      algorithm,
      avgConfidence: result.metadata.avgConfidence,
      totalNotes: result.metadata.totalNotes,
      processingTime,
    });
  }

  // Also test built-in YIN
  const builtInExtractor = new MelodyExtractorPF({
    ...options,
    usePitchFinder: false,
  });

  const startTime = performance.now();
  const builtInResult = await builtInExtractor.extractMelody(audioBuffer, options);
  const processingTime = performance.now() - startTime;

  results.push({
    algorithm: 'Built-in YIN',
    avgConfidence: builtInResult.metadata.avgConfidence,
    totalNotes: builtInResult.metadata.totalNotes,
    processingTime,
  });

  return results;
}

// ==================== EXAMPLE USAGE ====================

/**
 * Example: Compare algorithms
 */
export async function exampleCompareAlgorithms() {
  console.log('=== Algorithm Comparison ===\n');

  // Generate test audio: C major scale
  const sampleRate = 44100;
  const noteDuration = 0.4;
  const frequencies = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];

  const totalSamples = frequencies.length * noteDuration * sampleRate;
  const samples = new Float32Array(totalSamples);

  let offset = 0;
  for (const freq of frequencies) {
    const noteSamples = Math.floor(noteDuration * sampleRate);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      samples[offset + i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
    }
    offset += noteSamples;
  }

  // Create audio buffer (simplified for demo)
  const audioContext = new (globalThis.AudioContext ||
    (globalThis as any).webkitAudioContext)();
  const audioBuffer = audioContext.createBuffer(1, samples.length, sampleRate);
  audioBuffer.copyToChannel(samples, 0);

  // Compare algorithms
  const results = await compareAlgorithms(audioBuffer, {
    bpm: 120,
    key: 'C',
  });

  console.log('Algorithm Performance:\n');
  console.log('Algorithm         | Notes | Confidence | Time (ms)');
  console.log('------------------|-------|------------|----------');

  results.forEach((r) => {
    const name = r.algorithm.padEnd(17);
    const notes = r.totalNotes.toString().padStart(5);
    const conf = `${(r.avgConfidence * 100).toFixed(1)}%`.padStart(10);
    const time = r.processingTime.toFixed(1).padStart(8);
    console.log(`${name} | ${notes} | ${conf} | ${time}`);
  });

  // Find best algorithm
  const best = results.reduce((prev, curr) =>
    curr.avgConfidence > prev.avgConfidence ? curr : prev
  );

  console.log(`\n✓ Best Algorithm: ${best.algorithm} (${(best.avgConfidence * 100).toFixed(1)}% confidence)`);

  return results;
}

// ==================== EXPORTS ====================

export {
  // Re-export base classes
  MelodyExtractor,
  type PitchFrame,
  type PitchContour,
  type MIDINote,
  type ExtractionOptions,
  type PitchTrackingOptions,
} from './melody-extractor';

// Auto-run comparison if executed directly
if (require.main === module) {
  exampleCompareAlgorithms().catch(console.error);
}
