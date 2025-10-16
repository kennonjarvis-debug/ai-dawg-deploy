/**
 * Utility functions for audio visualization components
 */

/**
 * Convert frequency to note name
 */
export function frequencyToNote(frequency: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75); // C0 frequency

  if (frequency < 20 || frequency > 20000) return '';

  const halfSteps = 12 * Math.log2(frequency / c0);
  const octave = Math.floor(halfSteps / 12);
  const noteIndex = Math.round(halfSteps % 12);

  return noteNames[noteIndex] + octave;
}

/**
 * Convert frequency to cents deviation from nearest note
 */
export function frequencyToCents(frequency: number): number {
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);

  if (frequency < 20) return 0;

  const halfSteps = 12 * Math.log2(frequency / c0);
  const nearestHalfStep = Math.round(halfSteps);
  const cents = (halfSteps - nearestHalfStep) * 100;

  return Math.round(cents);
}

/**
 * Convert note name to frequency
 */
export function noteToFrequency(note: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;

  // Parse note (e.g., "C#4")
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 0;

  const noteName = match[1];
  const octave = parseInt(match[2]);

  const noteIndex = noteNames.indexOf(noteName);
  if (noteIndex === -1) return 0;

  // Calculate frequency
  const c0 = a4 * Math.pow(2, -4.75);
  const halfSteps = octave * 12 + noteIndex;
  const frequency = c0 * Math.pow(2, halfSteps / 12);

  return frequency;
}

/**
 * Calculate RMS (Root Mean Square) from audio data
 */
export function calculateRMS(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
}

/**
 * Convert RMS to decibels
 */
export function rmsToDb(rms: number): number {
  return 20 * Math.log10(rms + 0.0001);
}

/**
 * Calculate peak value from audio data
 */
export function calculatePeak(dataArray: Uint8Array): number {
  let max = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const value = Math.abs((dataArray[i] - 128) / 128);
    max = Math.max(max, value);
  }
  return max;
}

/**
 * Format time in seconds to MM:SS.S
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00.0';

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculate estimated file size for audio recording
 */
export function estimateFileSize(
  durationSeconds: number,
  sampleRate: number,
  channels: number,
  bitDepth: number
): number {
  // Uncompressed size = sample_rate * channels * (bit_depth / 8) * duration
  return sampleRate * channels * (bitDepth / 8) * durationSeconds;
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Check if browser supports Web Audio API
 */
export function checkWebAudioSupport(): boolean {
  return 'AudioContext' in window || 'webkitAudioContext' in window;
}

/**
 * Check if browser supports MediaDevices API
 */
export function checkMediaDevicesSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check if browser supports Canvas API
 */
export function checkCanvasSupport(): boolean {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * Get optimal FFT size based on sample rate
 */
export function getOptimalFFTSize(sampleRate: number): number {
  // Common FFT sizes: 256, 512, 1024, 2048, 4096, 8192
  // Higher sample rates benefit from larger FFT sizes
  if (sampleRate >= 96000) return 4096;
  if (sampleRate >= 48000) return 2048;
  return 1024;
}

/**
 * Create gradient for canvas
 */
export function createGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colorStops: Array<{ offset: number; color: string }>
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  colorStops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color);
  });
  return gradient;
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Calculate spectral centroid (brightness measure)
 */
export function calculateSpectralCentroid(
  frequencyData: Uint8Array,
  sampleRate: number
): number {
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = (i * sampleRate) / (2 * frequencyData.length);
    const magnitude = frequencyData[i];

    numerator += frequency * magnitude;
    denominator += magnitude;
  }

  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Detect if audio is clipping
 */
export function isClipping(dataArray: Uint8Array, threshold: number = 0.95): boolean {
  const peak = calculatePeak(dataArray);
  return peak >= threshold;
}

/**
 * Simple beat detection from RMS envelope
 */
export function detectBeat(
  currentRMS: number,
  previousRMS: number,
  threshold: number = 1.3
): boolean {
  return currentRMS > previousRMS * threshold && currentRMS > 0.1;
}

/**
 * Calculate zero-crossing rate
 */
export function calculateZeroCrossingRate(dataArray: Uint8Array): number {
  let crossings = 0;
  const centerValue = 128;

  for (let i = 1; i < dataArray.length; i++) {
    if (
      (dataArray[i - 1] < centerValue && dataArray[i] >= centerValue) ||
      (dataArray[i - 1] >= centerValue && dataArray[i] < centerValue)
    ) {
      crossings++;
    }
  }

  return crossings / dataArray.length;
}

/**
 * Smooth data array using moving average
 */
export function smoothData(data: number[], windowSize: number = 3): number[] {
  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
      sum += data[j];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

/**
 * Find peaks in data array
 */
export function findPeaks(data: number[], threshold: number = 0.5): number[] {
  const peaks: number[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
      peaks.push(i);
    }
  }

  return peaks;
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private maxHistoryLength = 60;

  update(): void {
    this.frameCount++;
  }

  getFPS(): number {
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      const fps = (this.frameCount * 1000) / elapsed;
      this.fpsHistory.push(fps);

      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastTime = now;

      return fps;
    }

    return this.fpsHistory[this.fpsHistory.length - 1] || 0;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
  }
}

/**
 * Audio buffer utilities
 */
export const audioBufferUtils = {
  /**
   * Create silent audio buffer
   */
  createSilentBuffer(
    context: AudioContext,
    duration: number,
    channels: number = 2
  ): AudioBuffer {
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(channels, sampleRate * duration, sampleRate);
    return buffer;
  },

  /**
   * Copy audio buffer
   */
  copyBuffer(source: AudioBuffer, context: AudioContext): AudioBuffer {
    const copy = context.createBuffer(
      source.numberOfChannels,
      source.length,
      source.sampleRate
    );

    for (let channel = 0; channel < source.numberOfChannels; channel++) {
      const sourceData = source.getChannelData(channel);
      const copyData = copy.getChannelData(channel);
      copyData.set(sourceData);
    }

    return copy;
  },

  /**
   * Trim silence from audio buffer
   */
  trimSilence(buffer: AudioBuffer, threshold: number = 0.01): AudioBuffer {
    const channelData = buffer.getChannelData(0);

    // Find start and end (currently unused but could be used for trimming)
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        break;
      }
    }

    for (let i = channelData.length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > threshold) {
        break;
      }
    }

    // Create trimmed buffer (implementation depends on AudioContext)
    // This is a simplified version - return original for now
    return buffer;
  }
};

/**
 * Color utilities for visualizations
 */
export const colorUtils = {
  /**
   * Get color based on pitch accuracy
   */
  getPitchAccuracyColor(cents: number): string {
    const absCents = Math.abs(cents);
    if (absCents < 10) return '#00ff00'; // Green - on pitch
    if (absCents < 20) return '#ffff00'; // Yellow - close
    if (absCents < 30) return '#ff8800'; // Orange - off
    return '#ff4444'; // Red - very off
  },

  /**
   * Get color for volume level (in dB)
   */
  getVolumeLevelColor(db: number): string {
    if (db > -3) return '#ff0000';   // Red - danger
    if (db > -6) return '#ff8800';   // Orange - warning
    if (db > -12) return '#ffff00';  // Yellow - moderate
    return '#00ff00';                // Green - safe
  },

  /**
   * Interpolate between two colors
   */
  interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(lerp(c1[0], c2[0], factor));
    const g = Math.round(lerp(c1[1], c2[1], factor));
    const b = Math.round(lerp(c1[2], c2[2], factor));

    return rgbToHex(r, g, b);
  }
};
