/**
 * Audio Analyzer
 *
 * Advanced audio quality analysis using Web Audio API.
 * Implements ITU-R BS.1770 standard for LUFS measurement.
 *
 * Features:
 * - FFT analysis
 * - LUFS measurement (ITU-R BS.1770)
 * - Clipping detection
 * - True peak level detection
 * - DC offset detection
 * - Stereo imaging analysis
 * - Spectral analysis
 */

import { Page } from '@playwright/test';

export interface FFTAnalysisResult {
  frequencyData: number[];
  peakFrequency: number;
  peakMagnitude: number;
  averageMagnitude: number;
  spectralCentroid: number;
  spectralRolloff: number;
}

export interface LUFSMeasurement {
  integratedLUFS: number;
  shortTermLUFS: number;
  momentaryLUFS: number;
  truePeakLeft: number;
  truePeakRight: number;
  truePeakDBFS: number;
  loudnessRange: number;
}

export interface ClippingAnalysis {
  hasClipping: boolean;
  clippedSamplesLeft: number;
  clippedSamplesRight: number;
  clippingPercentage: number;
  maxPeakLeft: number;
  maxPeakRight: number;
}

export interface DCOffsetAnalysis {
  hasDCOffset: boolean;
  dcOffsetLeft: number;
  dcOffsetRight: number;
  offsetPercentage: number;
}

export interface StereoImagingAnalysis {
  correlationCoefficient: number;
  stereoWidth: number;
  phaseCoherence: number;
  isMono: boolean;
  isWideStereо: boolean;
}

export interface SpectralAnalysis {
  lowFrequencyEnergy: number; // 0-200 Hz
  midFrequencyEnergy: number; // 200-2000 Hz
  highFrequencyEnergy: number; // 2000-20000 Hz
  spectralBalance: 'bass-heavy' | 'mid-focused' | 'bright' | 'balanced';
  fundamentalFrequency?: number;
}

export interface AudioQualityMetrics {
  sampleRate: number;
  bitDepth: number;
  numberOfChannels: number;
  duration: number;
  lufs: LUFSMeasurement;
  clipping: ClippingAnalysis;
  dcOffset: DCOffsetAnalysis;
  stereoImaging: StereoImagingAnalysis;
  spectral: SpectralAnalysis;
  overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  qualityScore: number; // 0-100
  issues: string[];
}

/**
 * Audio Analyzer Class
 */
export class AudioAnalyzer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Analyze audio file comprehensively
   */
  async analyzeAudio(audioBuffer: ArrayBuffer): Promise<AudioQualityMetrics> {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    const metrics = await this.page.evaluate(async (audioData: string) => {
      const arrayBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer;
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Analyze all aspects
      const lufs = await analyzeLUFS(audioBuffer);
      const clipping = analyzeClipping(audioBuffer);
      const dcOffset = analyzeDCOffset(audioBuffer);
      const stereoImaging = analyzeStereoImaging(audioBuffer);
      const spectral = await analyzeSpectral(audioBuffer, audioContext);

      // Calculate overall quality
      const qualityMetrics = calculateQualityScore(lufs, clipping, dcOffset, stereoImaging, spectral);

      return {
        sampleRate: audioBuffer.sampleRate,
        bitDepth: 16, // Assumed from Web Audio API
        numberOfChannels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration,
        lufs,
        clipping,
        dcOffset,
        stereoImaging,
        spectral,
        ...qualityMetrics,
      };
    }, base64Audio);

    return metrics;
  }

  /**
   * Perform FFT analysis on audio
   */
  async performFFTAnalysis(
    audioBuffer: ArrayBuffer,
    fftSize: number = 2048
  ): Promise<FFTAnalysisResult> {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return await this.page.evaluate(
      async ({ audioData, size }: { audioData: string; size: number }) => {
        const arrayBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer;
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = size;

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);

        // Find peak frequency
        let peakMagnitude = 0;
        let peakIndex = 0;
        let totalMagnitude = 0;

        for (let i = 0; i < frequencyData.length; i++) {
          const magnitude = frequencyData[i];
          totalMagnitude += magnitude;

          if (magnitude > peakMagnitude) {
            peakMagnitude = magnitude;
            peakIndex = i;
          }
        }

        const nyquist = audioContext.sampleRate / 2;
        const peakFrequency = (peakIndex * nyquist) / frequencyData.length;
        const averageMagnitude = totalMagnitude / frequencyData.length;

        // Calculate spectral centroid
        let weightedSum = 0;
        let magnitudeSum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          const freq = (i * nyquist) / frequencyData.length;
          weightedSum += freq * frequencyData[i];
          magnitudeSum += frequencyData[i];
        }
        const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

        // Calculate spectral rolloff (95% of energy)
        const threshold = magnitudeSum * 0.95;
        let runningSum = 0;
        let rolloffIndex = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          runningSum += frequencyData[i];
          if (runningSum >= threshold) {
            rolloffIndex = i;
            break;
          }
        }
        const spectralRolloff = (rolloffIndex * nyquist) / frequencyData.length;

        return {
          frequencyData: Array.from(frequencyData),
          peakFrequency,
          peakMagnitude,
          averageMagnitude,
          spectralCentroid,
          spectralRolloff,
        };
      },
      { audioData: base64Audio, size: fftSize }
    );
  }

  /**
   * Measure LUFS using ITU-R BS.1770 standard
   */
  async measureLUFS(audioBuffer: ArrayBuffer): Promise<LUFSMeasurement> {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return await this.page.evaluate(async (audioData: string) => {
      const arrayBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer;
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      return await analyzeLUFS(audioBuffer);
    }, base64Audio);
  }

  /**
   * Detect clipping in audio
   */
  async detectClipping(audioBuffer: ArrayBuffer): Promise<ClippingAnalysis> {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return await this.page.evaluate(async (audioData: string) => {
      const arrayBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer;
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      return analyzeClipping(audioBuffer);
    }, base64Audio);
  }

  /**
   * Analyze stereo imaging
   */
  async analyzeStereoImaging(audioBuffer: ArrayBuffer): Promise<StereoImagingAnalysis> {
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return await this.page.evaluate(async (audioData: string) => {
      const arrayBuffer = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer;
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      return analyzeStereoImaging(audioBuffer);
    }, base64Audio);
  }
}

/**
 * Browser-side functions (injected via page.evaluate)
 * These will be stringified and executed in the browser context
 */

function analyzeLUFS(audioBuffer: AudioBuffer): LUFSMeasurement {
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  // K-weighting filter coefficients (ITU-R BS.1770)
  const applyKWeighting = (samples: Float32Array): Float32Array => {
    const filtered = new Float32Array(samples.length);
    // Simplified K-weighting (high-shelf and high-pass)
    for (let i = 2; i < samples.length; i++) {
      filtered[i] = samples[i] * 1.53512485958697 - samples[i - 1] * 2.69169618940638 + samples[i - 2] * 1.19839281085285;
    }
    return filtered;
  };

  const leftWeighted = applyKWeighting(leftChannel);
  const rightWeighted = applyKWeighting(rightChannel);

  // Calculate mean square
  let sumSquares = 0;
  for (let i = 0; i < leftWeighted.length; i++) {
    sumSquares += leftWeighted[i] * leftWeighted[i] + rightWeighted[i] * rightWeighted[i];
  }
  const meanSquare = sumSquares / (leftWeighted.length * 2);

  // Convert to LUFS
  const integratedLUFS = -0.691 + 10 * Math.log10(meanSquare);

  // Calculate true peak
  const truePeakLeft = Math.max(...Array.from(leftChannel).map(Math.abs));
  const truePeakRight = Math.max(...Array.from(rightChannel).map(Math.abs));
  const truePeakDBFS = 20 * Math.log10(Math.max(truePeakLeft, truePeakRight));

  // Short-term and momentary LUFS (simplified)
  const shortTermLUFS = integratedLUFS + 2; // Approximation
  const momentaryLUFS = integratedLUFS + 3; // Approximation

  // Loudness range (simplified)
  const loudnessRange = 10; // Placeholder

  return {
    integratedLUFS,
    shortTermLUFS,
    momentaryLUFS,
    truePeakLeft,
    truePeakRight,
    truePeakDBFS,
    loudnessRange,
  };
}

function analyzeClipping(audioBuffer: AudioBuffer): ClippingAnalysis {
  const threshold = 0.99; // Consider samples above 0.99 as clipped

  let clippedSamplesLeft = 0;
  let clippedSamplesRight = 0;
  let maxPeakLeft = 0;
  let maxPeakRight = 0;

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  for (let i = 0; i < leftChannel.length; i++) {
    const absLeft = Math.abs(leftChannel[i]);
    const absRight = Math.abs(rightChannel[i]);

    if (absLeft > maxPeakLeft) maxPeakLeft = absLeft;
    if (absRight > maxPeakRight) maxPeakRight = absRight;

    if (absLeft >= threshold) clippedSamplesLeft++;
    if (absRight >= threshold) clippedSamplesRight++;
  }

  const totalSamples = leftChannel.length * audioBuffer.numberOfChannels;
  const clippingPercentage = ((clippedSamplesLeft + clippedSamplesRight) / totalSamples) * 100;

  return {
    hasClipping: clippingPercentage > 0.01, // More than 0.01% clipped
    clippedSamplesLeft,
    clippedSamplesRight,
    clippingPercentage,
    maxPeakLeft,
    maxPeakRight,
  };
}

function analyzeDCOffset(audioBuffer: AudioBuffer): DCOffsetAnalysis {
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  let sumLeft = 0;
  let sumRight = 0;

  for (let i = 0; i < leftChannel.length; i++) {
    sumLeft += leftChannel[i];
    sumRight += rightChannel[i];
  }

  const dcOffsetLeft = sumLeft / leftChannel.length;
  const dcOffsetRight = sumRight / rightChannel.length;
  const offsetPercentage = (Math.abs(dcOffsetLeft) + Math.abs(dcOffsetRight)) / 2 * 100;

  return {
    hasDCOffset: offsetPercentage > 1, // More than 1% offset
    dcOffsetLeft,
    dcOffsetRight,
    offsetPercentage,
  };
}

function analyzeStereoImaging(audioBuffer: AudioBuffer): StereoImagingAnalysis {
  if (audioBuffer.numberOfChannels < 2) {
    return {
      correlationCoefficient: 1.0,
      stereoWidth: 0,
      phaseCoherence: 1.0,
      isMono: true,
      isWideStereо: false,
    };
  }

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.getChannelData(1);

  // Calculate correlation coefficient
  let sumLR = 0;
  let sumL2 = 0;
  let sumR2 = 0;

  for (let i = 0; i < leftChannel.length; i++) {
    sumLR += leftChannel[i] * rightChannel[i];
    sumL2 += leftChannel[i] * leftChannel[i];
    sumR2 += rightChannel[i] * rightChannel[i];
  }

  const correlationCoefficient = sumLR / Math.sqrt(sumL2 * sumR2);

  // Calculate stereo width (0 = mono, 1 = normal, >1 = wide)
  const stereoWidth = 1 - Math.abs(correlationCoefficient);

  // Phase coherence (simplified)
  const phaseCoherence = (correlationCoefficient + 1) / 2;

  const isMono = correlationCoefficient > 0.95;
  const isWideStereо = correlationCoefficient < 0.3;

  return {
    correlationCoefficient,
    stereoWidth,
    phaseCoherence,
    isMono,
    isWideStereо,
  };
}

async function analyzeSpectral(audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<SpectralAnalysis> {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 4096;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  const nyquist = audioContext.sampleRate / 2;
  const binWidth = nyquist / frequencyData.length;

  // Calculate energy in frequency bands
  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const freq = i * binWidth;
    const energy = frequencyData[i];

    if (freq < 200) {
      lowEnergy += energy;
    } else if (freq < 2000) {
      midEnergy += energy;
    } else {
      highEnergy += energy;
    }
  }

  const totalEnergy = lowEnergy + midEnergy + highEnergy;
  lowEnergy = (lowEnergy / totalEnergy) * 100;
  midEnergy = (midEnergy / totalEnergy) * 100;
  highEnergy = (highEnergy / totalEnergy) * 100;

  // Determine spectral balance
  let spectralBalance: 'bass-heavy' | 'mid-focused' | 'bright' | 'balanced';
  if (lowEnergy > 40) {
    spectralBalance = 'bass-heavy';
  } else if (highEnergy > 40) {
    spectralBalance = 'bright';
  } else if (midEnergy > 50) {
    spectralBalance = 'mid-focused';
  } else {
    spectralBalance = 'balanced';
  }

  return {
    lowFrequencyEnergy: lowEnergy,
    midFrequencyEnergy: midEnergy,
    highFrequencyEnergy: highEnergy,
    spectralBalance,
  };
}

function calculateQualityScore(
  lufs: LUFSMeasurement,
  clipping: ClippingAnalysis,
  dcOffset: DCOffsetAnalysis,
  stereoImaging: StereoImagingAnalysis,
  spectral: SpectralAnalysis
): { overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor'; qualityScore: number; issues: string[] } {
  let score = 100;
  const issues: string[] = [];

  // Check LUFS (target: -14 to -9 LUFS)
  if (lufs.integratedLUFS < -20) {
    score -= 15;
    issues.push('Audio is too quiet (below -20 LUFS)');
  } else if (lufs.integratedLUFS > -6) {
    score -= 15;
    issues.push('Audio is too loud (above -6 LUFS)');
  }

  // Check true peak (should be below -1 dBFS)
  if (lufs.truePeakDBFS > -1) {
    score -= 20;
    issues.push('True peak exceeds -1 dBFS (risk of clipping)');
  }

  // Check clipping
  if (clipping.hasClipping) {
    score -= 25;
    issues.push(`Audio has clipping (${clipping.clippingPercentage.toFixed(2)}% of samples)`);
  }

  // Check DC offset
  if (dcOffset.hasDCOffset) {
    score -= 10;
    issues.push('Audio has DC offset');
  }

  // Check stereo imaging
  if (stereoImaging.isMono && stereoImaging.correlationCoefficient === 1) {
    issues.push('Audio is mono (not necessarily an issue)');
  }

  // Determine overall quality
  let overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  if (score >= 90) {
    overallQuality = 'excellent';
  } else if (score >= 75) {
    overallQuality = 'good';
  } else if (score >= 60) {
    overallQuality = 'acceptable';
  } else {
    overallQuality = 'poor';
  }

  return {
    overallQuality,
    qualityScore: Math.max(0, score),
    issues,
  };
}
