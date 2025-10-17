/**
 * WaveformViz - Real-time Waveform Visualizer
 *
 * Displays audio waveform with:
 * - Real-time rendering at 60fps
 * - Multiple draw styles (line, filled, mirror)
 * - Smooth antialiasing
 * - Color gradients
 * - Scrolling mode for recording
 */

import { AudioVisualizer, AudioVisualizerConfig } from './AudioVisualizer';

export type WaveformStyle = 'line' | 'filled' | 'mirror' | 'bars';

export interface WaveformVizConfig extends AudioVisualizerConfig {
  /** Drawing style */
  style?: WaveformStyle;
  /** Line width (for 'line' style) */
  lineWidth?: number;
  /** Waveform color */
  color?: string | CanvasGradient;
  /** Background color */
  backgroundColor?: string;
  /** Enable scrolling mode (for live recording) */
  scrolling?: boolean;
  /** Number of samples to display */
  sampleWindow?: number;
}

export class WaveformViz extends AudioVisualizer {
  private style: WaveformStyle;
  private lineWidth: number;
  private color: string | CanvasGradient;
  private backgroundColor: string;
  private scrolling: boolean;
  private sampleWindow: number;

  // Scrolling mode state
  private scrollBuffer: Float32Array;

  constructor(config: WaveformVizConfig) {
    super(config);

    this.style = config.style || 'filled';
    this.lineWidth = config.lineWidth || 2;
    this.color = config.color || '#00e5ff'; // Pro Tools cyan
    this.backgroundColor = config.backgroundColor || 'transparent';
    this.scrolling = config.scrolling || false;
    this.sampleWindow = config.sampleWindow || 2048;

    // Initialize scroll buffer for scrolling mode
    this.scrollBuffer = new Float32Array(this.sampleWindow);
  }

  /**
   * Set waveform color (can be string or gradient)
   */
  setColor(color: string | CanvasGradient): void {
    this.color = color;
  }

  /**
   * Set drawing style
   */
  setStyle(style: WaveformStyle): void {
    this.style = style;
  }

  /**
   * Enable/disable scrolling mode
   */
  setScrolling(enabled: boolean): void {
    this.scrolling = enabled;
    if (enabled) {
      this.scrollBuffer.fill(0);
    }
  }

  /**
   * Clear waveform buffer
   */
  clear(): void {
    this.scrollBuffer.fill(0);
  }

  /**
   * Render waveform
   */
  protected render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Background
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Get audio data
    const timeDomainData = this.getTimeDomainData();
    if (timeDomainData.length === 0) return;

    // Update scroll buffer if in scrolling mode
    if (this.scrolling) {
      this.updateScrollBuffer(timeDomainData);
    }

    // Render based on style
    const dataToRender = this.scrolling ? this.scrollBuffer : timeDomainData;

    switch (this.style) {
      case 'line':
        this.renderLine(dataToRender, width, height);
        break;
      case 'filled':
        this.renderFilled(dataToRender, width, height);
        break;
      case 'mirror':
        this.renderMirror(dataToRender, width, height);
        break;
      case 'bars':
        this.renderBars(dataToRender, width, height);
        break;
    }
  }

  /**
   * Update scrolling buffer with new audio data
   */
  private updateScrollBuffer(newData: Float32Array): void {
    // Shift existing data left
    this.scrollBuffer.copyWithin(0, newData.length);

    // Add new data at the end
    const startIndex = this.scrollBuffer.length - newData.length;
    for (let i = 0; i < newData.length; i++) {
      this.scrollBuffer[startIndex + i] = newData[i] ?? 0;
    }
  }

  /**
   * Render line-style waveform
   */
  private renderLine(data: Float32Array, width: number, height: number): void {
    const centerY = height / 2;
    const sliceWidth = width / data.length;

    this.ctx.strokeStyle = typeof this.color === 'string' ? this.color : '#00e5ff';
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const y = centerY + (data[i] ?? 0) * (height / 2);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
  }

  /**
   * Render filled waveform
   */
  private renderFilled(data: Float32Array, width: number, height: number): void {
    const centerY = height / 2;
    const sliceWidth = width / data.length;

    // Set fill style (gradient or solid color)
    if (typeof this.color === 'string') {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.5, this.color + '80'); // Semi-transparent
      gradient.addColorStop(1, this.color);
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = this.color;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    // Top half
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const y = centerY + (data[i] ?? 0) * (height / 2);
      this.ctx.lineTo(x, y);
    }

    // Bottom half (mirrored)
    for (let i = data.length - 1; i >= 0; i--) {
      const x = i * sliceWidth;
      const y = centerY - (data[i] ?? 0) * (height / 2);
      this.ctx.lineTo(x, y);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Render mirror-style waveform (symmetrical)
   */
  private renderMirror(data: Float32Array, width: number, height: number): void {
    const centerY = height / 2;
    const sliceWidth = width / data.length;

    // Set fill style
    if (typeof this.color === 'string') {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.5, this.color + 'CC'); // More opaque in center
      gradient.addColorStop(1, this.color);
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = this.color;
    }

    this.ctx.beginPath();

    // Top path
    this.ctx.moveTo(0, centerY);
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const y = centerY - Math.abs(data[i] ?? 0) * (height / 2);
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(width, centerY);

    // Bottom path
    for (let i = data.length - 1; i >= 0; i--) {
      const x = i * sliceWidth;
      const y = centerY + Math.abs(data[i] ?? 0) * (height / 2);
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(0, centerY);

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Render bar-style waveform
   */
  private renderBars(data: Float32Array, width: number, height: number): void {
    const centerY = height / 2;
    const barWidth = Math.max(1, width / data.length);
    const gap = Math.max(0, barWidth * 0.2);

    // Set fill style
    this.ctx.fillStyle = typeof this.color === 'string' ? this.color : '#00e5ff';

    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const barHeight = Math.abs(data[i] ?? 0) * (height / 2);

      // Draw bar (centered)
      this.ctx.fillRect(x, centerY - barHeight / 2, barWidth - gap, barHeight);
    }
  }

  /**
   * Static method: Render static waveform from audio buffer
   */
  static renderStatic(
    canvas: HTMLCanvasElement,
    audioBuffer: AudioBuffer,
    options: {
      style?: WaveformStyle;
      color?: string;
      backgroundColor?: string;
      channel?: number;
    } = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const style = options.style || 'filled';
    const color = options.color || '#00e5ff';
    const backgroundColor = options.backgroundColor || 'transparent';
    const channel = options.channel || 0;

    // Clear canvas
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Get channel data
    const channelData = audioBuffer.getChannelData(Math.min(channel, audioBuffer.numberOfChannels - 1));

    // Downsample to canvas width for performance
    const step = Math.ceil(channelData.length / width);
    const samples = new Float32Array(width);

    for (let i = 0; i < width; i++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < channelData.length) {
          sum += Math.abs(channelData[index] ?? 0);
          count++;
        }
      }
      samples[i] = count > 0 ? sum / count : 0;
    }

    // Render based on style
    const centerY = height / 2;

    if (style === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const x = i;
        const y = centerY + (samples[i] ?? 0) * (height / 2) * (i % 2 === 0 ? 1 : -1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (style === 'filled' || style === 'mirror') {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color + '80');
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let i = 0; i < samples.length; i++) {
        ctx.lineTo(i, centerY - (samples[i] ?? 0) * (height / 2));
      }
      for (let i = samples.length - 1; i >= 0; i--) {
        ctx.lineTo(i, centerY + (samples[i] ?? 0) * (height / 2));
      }
      ctx.closePath();
      ctx.fill();
    } else if (style === 'bars') {
      ctx.fillStyle = color;
      for (let i = 0; i < samples.length; i++) {
        const barHeight = (samples[i] ?? 0) * (height / 2);
        ctx.fillRect(i, centerY - barHeight / 2, 1, barHeight);
      }
    }
  }
}
