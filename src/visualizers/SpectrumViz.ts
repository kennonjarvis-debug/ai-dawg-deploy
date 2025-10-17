/**
 * SpectrumViz - Real-time Frequency Spectrum Analyzer
 *
 * Displays audio frequency spectrum with:
 * - FFT-based frequency analysis
 * - Multiple visualization styles (bars, line, filled)
 * - Logarithmic or linear frequency scale
 * - Peak hold indicators
 * - Customizable frequency range
 */

import { AudioVisualizer, AudioVisualizerConfig } from './AudioVisualizer';

export type SpectrumStyle = 'bars' | 'line' | 'filled';
export type FrequencyScale = 'linear' | 'logarithmic';

export interface SpectrumVizConfig extends AudioVisualizerConfig {
  /** Visualization style */
  style?: SpectrumStyle;
  /** Frequency scale */
  scale?: FrequencyScale;
  /** Minimum frequency to display (Hz) */
  minFrequency?: number;
  /** Maximum frequency to display (Hz) */
  maxFrequency?: number;
  /** Number of frequency bins to display */
  binCount?: number;
  /** Show peak hold indicators */
  showPeakHold?: boolean;
  /** Peak hold time (ms) */
  peakHoldTime?: number;
  /** Color gradient for spectrum */
  colors?: string[];
  /** Background color */
  backgroundColor?: string;
  /** Smoothing factor (0-1) */
  smoothing?: number;
}

export class SpectrumViz extends AudioVisualizer {
  private style: SpectrumStyle;
  private scale: FrequencyScale;
  private minFrequency: number;
  private maxFrequency: number;
  private binCount: number;
  private showPeakHold: boolean;
  private peakHoldTime: number;
  private colors: string[];
  private backgroundColor: string;
  private smoothing: number;

  // Peak hold state
  private peakValues: Float32Array;
  private peakTimestamps: Float32Array;

  // Smoothed values for better visualization
  private smoothedValues: Float32Array;

  constructor(config: SpectrumVizConfig) {
    super(config);

    this.style = config.style || 'bars';
    this.scale = config.scale || 'logarithmic';
    this.minFrequency = config.minFrequency || 20;
    this.maxFrequency = config.maxFrequency || 20000;
    this.binCount = config.binCount || 128;
    this.showPeakHold = config.showPeakHold ?? true;
    this.peakHoldTime = config.peakHoldTime || 2000;
    this.colors = config.colors || [
      '#00ff88', // Low (green)
      '#00e5ff', // Mid (cyan)
      '#b066ff', // High (purple)
      '#ff3333', // Peak (red)
    ];
    this.backgroundColor = config.backgroundColor || 'transparent';
    this.smoothing = config.smoothing ?? 0.7;

    // Initialize peak hold arrays
    this.peakValues = new Float32Array(this.binCount);
    this.peakTimestamps = new Float32Array(this.binCount);
    this.smoothedValues = new Float32Array(this.binCount);

    // Configure analyser node if available
    if (this.analyserNode) {
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = this.smoothing;
    }
  }

  /**
   * Set FFT size (must be power of 2)
   */
  setFFTSize(size: number): void {
    if (this.analyserNode) {
      this.analyserNode.fftSize = size;
    }
  }

  /**
   * Set smoothing factor (0 = no smoothing, 1 = maximum smoothing)
   */
  setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
    if (this.analyserNode) {
      this.analyserNode.smoothingTimeConstant = this.smoothing;
    }
  }

  /**
   * Reset spectrum analyzer state
   */
  reset(): void {
    this.peakValues.fill(0);
    this.peakTimestamps.fill(0);
    this.smoothedValues.fill(0);
  }

  /**
   * Render spectrum
   */
  protected render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Background
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Get frequency data
    const frequencyData = this.getFrequencyData();
    if (frequencyData.length === 0) return;

    // Map frequency bins to display bins
    const displayData = this.mapFrequencyBins(frequencyData);

    // Apply smoothing
    this.applySmoothing(displayData);

    // Update peak hold
    if (this.showPeakHold) {
      this.updatePeakHold(this.smoothedValues);
    }

    // Render based on style
    switch (this.style) {
      case 'bars':
        this.renderBars(this.smoothedValues, width, height);
        break;
      case 'line':
        this.renderLine(this.smoothedValues, width, height);
        break;
      case 'filled':
        this.renderFilled(this.smoothedValues, width, height);
        break;
    }
  }

  /**
   * Map raw frequency bins to display bins based on frequency range and scale
   */
  private mapFrequencyBins(frequencyData: Uint8Array): Float32Array {
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binFrequency = nyquist / frequencyData.length;

    const displayData = new Float32Array(this.binCount);

    for (let i = 0; i < this.binCount; i++) {
      let frequency: number;

      if (this.scale === 'logarithmic') {
        // Logarithmic scale (better for audio)
        const logMin = Math.log10(this.minFrequency);
        const logMax = Math.log10(this.maxFrequency);
        const logFreq = logMin + (i / this.binCount) * (logMax - logMin);
        frequency = Math.pow(10, logFreq);
      } else {
        // Linear scale
        frequency = this.minFrequency + (i / this.binCount) * (this.maxFrequency - this.minFrequency);
      }

      // Find corresponding bin in frequency data
      const binIndex = Math.round(frequency / binFrequency);
      if (binIndex >= 0 && binIndex < frequencyData.length) {
        displayData[i] = (frequencyData[binIndex] ?? 0) / 255; // Normalize to [0, 1]
      }
    }

    return displayData;
  }

  /**
   * Apply temporal smoothing to reduce jitter
   */
  private applySmoothing(newValues: Float32Array): void {
    const smoothFactor = 1 - this.smoothing;

    for (let i = 0; i < this.binCount; i++) {
      this.smoothedValues[i] = (this.smoothedValues[i] ?? 0) * this.smoothing + (newValues[i] ?? 0) * smoothFactor;
    }
  }

  /**
   * Update peak hold indicators
   */
  private updatePeakHold(values: Float32Array): void {
    const now = performance.now();

    for (let i = 0; i < this.binCount; i++) {
      const value = values[i] ?? 0;
      const peakValue = this.peakValues[i] ?? 0;
      const peakTimestamp = this.peakTimestamps[i] ?? 0;

      if (value > peakValue) {
        this.peakValues[i] = value;
        this.peakTimestamps[i] = now;
      } else if (now - peakTimestamp > this.peakHoldTime) {
        // Slowly decay peak hold
        this.peakValues[i] = peakValue * 0.95;
      }
    }
  }

  /**
   * Render bar-style spectrum
   */
  private renderBars(data: Float32Array, width: number, height: number): void {
    const barWidth = width / this.binCount;
    const gap = Math.max(1, barWidth * 0.1);

    for (let i = 0; i < this.binCount; i++) {
      const x = i * barWidth;
      const value = data[i] ?? 0;
      const barHeight = value * height;

      // Color based on value (gradient from low to high)
      const colorIndex = Math.min(
        this.colors.length - 1,
        Math.floor((value * this.colors.length))
      );
      this.ctx.fillStyle = this.colors[colorIndex] ?? this.colors[0] ?? '#00e5ff';

      // Draw bar
      this.ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight);

      // Peak hold indicator
      const peakValue = this.peakValues[i] ?? 0;
      if (this.showPeakHold && peakValue > 0.01) {
        const peakY = height - peakValue * height;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x, peakY - 1, barWidth - gap, 2);
      }
    }
  }

  /**
   * Render line-style spectrum
   */
  private renderLine(data: Float32Array, width: number, height: number): void {
    const sliceWidth = width / this.binCount;

    // Create gradient stroke
    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    this.colors.forEach((color, index) => {
      gradient.addColorStop(index / (this.colors.length - 1), color);
    });

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    for (let i = 0; i < this.binCount; i++) {
      const x = i * sliceWidth;
      const y = height - (data[i] ?? 0) * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
  }

  /**
   * Render filled-style spectrum
   */
  private renderFilled(data: Float32Array, width: number, height: number): void {
    const sliceWidth = width / this.binCount;

    // Create gradient fill
    const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
    this.colors.forEach((color, index) => {
      gradient.addColorStop(index / (this.colors.length - 1), color);
    });

    this.ctx.fillStyle = gradient;

    this.ctx.beginPath();
    this.ctx.moveTo(0, height);

    // Top curve
    for (let i = 0; i < this.binCount; i++) {
      const x = i * sliceWidth;
      const y = height - (data[i] ?? 0) * height;
      this.ctx.lineTo(x, y);
    }

    this.ctx.lineTo(width, height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Get dominant frequency in Hz
   */
  getDominantFrequency(): number {
    const frequencyData = this.getFrequencyData();
    if (frequencyData.length === 0) return 0;

    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i] ?? 0;
      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }

    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    return (maxIndex / frequencyData.length) * nyquist;
  }
}
