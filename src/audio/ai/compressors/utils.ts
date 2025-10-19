/**
 * Shared utilities for AI Compressor plugins - DAWG AI
 */

import { CompressorParameter, CompressorState, CompressorAnalysis } from './types';

/**
 * Calculate RMS (Root Mean Square) level from audio buffer
 */
export function calculateRMS(buffer: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  return Math.sqrt(sumSquares / buffer.length);
}

/**
 * Calculate peak level from audio buffer
 */
export function calculatePeak(buffer: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < buffer.length; i++) {
    peak = Math.max(peak, Math.abs(buffer[i]));
  }
  return peak;
}

/**
 * Convert linear amplitude to decibels
 */
export function linearToDb(linear: number): number {
  return linear > 0 ? 20 * Math.log10(linear) : -96;
}

/**
 * Convert decibels to linear amplitude
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Calculate envelope follower coefficient from time constant
 */
export function timeToCoeff(timeMs: number, sampleRate: number): number {
  return Math.exp(-1 / (timeMs * 0.001 * sampleRate));
}

/**
 * Soft knee compression curve
 */
export function softKneeCompression(
  inputDb: number,
  threshold: number,
  ratio: number,
  knee: number
): number {
  if (inputDb <= threshold - knee / 2) {
    return 0;
  } else if (inputDb >= threshold + knee / 2) {
    const overshoot = inputDb - threshold;
    return overshoot - overshoot / ratio;
  } else {
    const kneeInput = inputDb - threshold + knee / 2;
    const kneeRange = knee;
    const kneePosition = kneeInput / kneeRange;
    const smoothCurve = kneePosition * kneePosition * (3 - 2 * kneePosition);
    const overshoot = inputDb - (threshold - knee / 2);
    return smoothCurve * (overshoot - overshoot / ratio);
  }
}

/**
 * Hard knee compression curve
 */
export function hardKneeCompression(
  inputDb: number,
  threshold: number,
  ratio: number
): number {
  if (inputDb <= threshold) {
    return 0;
  }
  const overshoot = inputDb - threshold;
  return overshoot - overshoot / ratio;
}

/**
 * Soft clipper/limiter
 */
export function softClip(sample: number, threshold: number = 0.9): number {
  if (Math.abs(sample) > threshold) {
    const overshoot = Math.abs(sample) - threshold;
    const limited = threshold + (1 - threshold) * Math.tanh(overshoot / (1 - threshold));
    return Math.sign(sample) * limited;
  }
  return sample;
}

/**
 * Hard clipper
 */
export function hardClip(sample: number, threshold: number = 1.0): number {
  return Math.max(-threshold, Math.min(threshold, sample));
}

/**
 * Hyperbolic tangent saturation
 */
export function tanhSaturation(sample: number, drive: number = 1.0): number {
  return Math.tanh(sample * drive) / Math.tanh(drive);
}

/**
 * Cubic soft saturation
 */
export function cubicSaturation(sample: number, amount: number = 0.5): number {
  const abs = Math.abs(sample);
  if (abs < 1) {
    const saturated = sample - (amount * sample * sample * sample) / 3;
    return saturated;
  }
  return Math.sign(sample);
}

/**
 * Calculate crest factor (peak-to-RMS ratio)
 */
export function calculateCrestFactor(buffer: Float32Array): number {
  const rms = calculateRMS(buffer);
  const peak = calculatePeak(buffer);
  return peak / (rms || 0.001);
}

/**
 * Calculate stereo peak from multiple channels
 */
export function calculateStereoPeak(buffers: Float32Array[], index: number): number {
  let peak = 0;
  for (let ch = 0; ch < buffers.length; ch++) {
    peak = Math.max(peak, Math.abs(buffers[ch][index]));
  }
  return peak;
}

/**
 * Calculate stereo RMS from multiple channels
 */
export function calculateStereoRMS(buffers: Float32Array[]): number {
  let sumSquares = 0;
  let totalSamples = 0;

  for (let ch = 0; ch < buffers.length; ch++) {
    for (let i = 0; i < buffers[ch].length; i++) {
      sumSquares += buffers[ch][i] * buffers[ch][i];
      totalSamples++;
    }
  }

  return Math.sqrt(sumSquares / totalSamples);
}

/**
 * Simple envelope follower
 */
export class EnvelopeFollower {
  private envelope: number = 0;

  constructor(
    private attackCoeff: number,
    private releaseCoeff: number
  ) {}

  process(inputDb: number): number {
    if (inputDb > this.envelope) {
      this.envelope = inputDb + this.attackCoeff * (this.envelope - inputDb);
    } else {
      this.envelope = inputDb + this.releaseCoeff * (this.envelope - inputDb);
    }
    return this.envelope;
  }

  reset(): void {
    this.envelope = 0;
  }

  getEnvelope(): number {
    return this.envelope;
  }
}

/**
 * Ballistics envelope follower with custom attack/release curves
 */
export class BallisticsEnvelope {
  private envelope: number = 0;
  private sampleRate: number;

  constructor(
    sampleRate: number,
    private attackMs: number,
    private releaseMs: number
  ) {
    this.sampleRate = sampleRate;
  }

  process(inputLevel: number): number {
    const inputDb = linearToDb(inputLevel);

    const attackCoeff = timeToCoeff(this.attackMs, this.sampleRate);
    const releaseCoeff = timeToCoeff(this.releaseMs, this.sampleRate);

    if (inputDb > this.envelope) {
      this.envelope = inputDb + attackCoeff * (this.envelope - inputDb);
    } else {
      this.envelope = inputDb + releaseCoeff * (this.envelope - inputDb);
    }

    return this.envelope;
  }

  setAttack(attackMs: number): void {
    this.attackMs = attackMs;
  }

  setRelease(releaseMs: number): void {
    this.releaseMs = releaseMs;
  }

  reset(): void {
    this.envelope = 0;
  }

  getEnvelope(): number {
    return this.envelope;
  }
}

/**
 * Simple moving average filter
 */
export class MovingAverage {
  private buffer: number[] = [];
  private sum: number = 0;

  constructor(private size: number) {}

  process(value: number): number {
    this.buffer.push(value);
    this.sum += value;

    if (this.buffer.length > this.size) {
      this.sum -= this.buffer.shift()!;
    }

    return this.sum / this.buffer.length;
  }

  reset(): void {
    this.buffer = [];
    this.sum = 0;
  }
}

/**
 * Peak detector with hold time
 */
export class PeakDetector {
  private peak: number = 0;
  private holdCounter: number = 0;

  constructor(
    private holdTimeMs: number,
    private sampleRate: number
  ) {}

  process(inputLevel: number): number {
    const holdSamples = (this.holdTimeMs / 1000) * this.sampleRate;

    if (inputLevel > this.peak) {
      this.peak = inputLevel;
      this.holdCounter = holdSamples;
    } else if (this.holdCounter > 0) {
      this.holdCounter--;
    } else {
      // Decay
      this.peak *= 0.999;
    }

    return this.peak;
  }

  reset(): void {
    this.peak = 0;
    this.holdCounter = 0;
  }

  getPeak(): number {
    return this.peak;
  }
}

/**
 * Calculate automatic makeup gain
 */
export function calculateAutoMakeupGain(
  threshold: number,
  ratio: number,
  compensation: number = 0.7
): number {
  // Estimate average gain reduction
  const estimatedGR = Math.abs(threshold) / ratio;
  return estimatedGR * compensation;
}

/**
 * Interpolate between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth parameter changes to avoid clicks
 */
export class ParameterSmoother {
  private currentValue: number;
  private targetValue: number;
  private smoothingSamples: number;
  private counter: number = 0;

  constructor(
    initialValue: number,
    smoothingTimeMs: number,
    sampleRate: number
  ) {
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.smoothingSamples = (smoothingTimeMs / 1000) * sampleRate;
  }

  setTarget(value: number): void {
    this.targetValue = value;
    this.counter = this.smoothingSamples;
  }

  process(): number {
    if (this.counter > 0) {
      const progress = 1 - this.counter / this.smoothingSamples;
      this.currentValue = lerp(this.currentValue, this.targetValue, progress);
      this.counter--;
    }
    return this.currentValue;
  }

  getValue(): number {
    return this.currentValue;
  }

  isSmoothing(): boolean {
    return this.counter > 0;
  }
}

/**
 * Format time in milliseconds for display
 */
export function formatTimeMs(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)} µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(1)} ms`;
  } else {
    return `${(ms / 1000).toFixed(2)} s`;
  }
}

/**
 * Format ratio for display
 */
export function formatRatio(ratio: number): string {
  if (ratio >= 20) {
    return '∞:1';
  }
  return `${ratio.toFixed(1)}:1`;
}

/**
 * Format decibels for display
 */
export function formatDb(db: number): string {
  if (db <= -96) {
    return '-∞ dB';
  }
  return `${db.toFixed(1)} dB`;
}

/**
 * Format frequency for display
 */
export function formatFrequency(freq: number): string {
  if (freq < 1000) {
    return `${freq.toFixed(0)} Hz`;
  } else {
    return `${(freq / 1000).toFixed(2)} kHz`;
  }
}

/**
 * Validate compressor parameters
 */
export function validateCompressorParameters(state: Partial<CompressorState>): string[] {
  const errors: string[] = [];

  if (state.threshold !== undefined && (state.threshold > 0 || state.threshold < -60)) {
    errors.push('Threshold must be between -60 and 0 dB');
  }

  if (state.ratio !== undefined && (state.ratio < 1 || state.ratio > 20)) {
    errors.push('Ratio must be between 1:1 and 20:1');
  }

  if (state.attack !== undefined && (state.attack < 0 || state.attack > 1000)) {
    errors.push('Attack must be between 0 and 1000 ms');
  }

  if (state.release !== undefined && (state.release < 0 || state.release > 5000)) {
    errors.push('Release must be between 0 and 5000 ms');
  }

  if (state.knee !== undefined && (state.knee < 0 || state.knee > 24)) {
    errors.push('Knee must be between 0 and 24 dB');
  }

  if (state.mix !== undefined && (state.mix < 0 || state.mix > 100)) {
    errors.push('Mix must be between 0 and 100%');
  }

  return errors;
}

/**
 * Create default compressor analysis
 */
export function createDefaultAnalysis(): CompressorAnalysis {
  return {
    inputLevel: -60,
    outputLevel: -60,
    gainReduction: 0,
    rmsLevel: 0,
    peakLevel: 0,
    spectralCentroid: 1000,
    dynamicRange: 12,
  };
}
