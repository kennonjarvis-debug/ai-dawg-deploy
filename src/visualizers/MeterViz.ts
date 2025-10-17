/**
 * MeterViz - VU/Peak Audio Meter Visualizer
 *
 * Real-time audio level meters with:
 * - Peak level indicator
 * - RMS level meter
 * - Clipping indicator
 * - Smooth ballistics (fast attack, slow release)
 */

import { AudioVisualizer, AudioVisualizerConfig } from './AudioVisualizer';

export interface MeterVizConfig extends AudioVisualizerConfig {
  /** Meter orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show peak hold indicator */
  showPeakHold?: boolean;
  /** Peak hold time (ms) */
  peakHoldTime?: number;
  /** Number of segments (0 = continuous) */
  segments?: number;
  /** Color scheme */
  colors?: {
    low: string; // 0-60% (green)
    mid: string; // 60-90% (yellow)
    high: string; // 90-100% (red)
    clip: string; // Clipping indicator
    background: string;
  };
}

export class MeterViz extends AudioVisualizer {
  private orientation: 'horizontal' | 'vertical';
  private showPeakHold: boolean;
  private peakHoldTime: number;
  private segments: number;
  private colors: Required<MeterVizConfig>['colors'];

  // Audio state
  private currentLevel: number = 0;
  private peakLevel: number = 0;
  private peakHoldLevel: number = 0;
  private peakHoldTimestamp: number = 0;
  private isClipping: boolean = false;
  private clipTimestamp: number = 0;

  // Ballistics (smooth meter movement)
  private attackTime: number = 0.01; // Fast attack (10ms)
  private releaseTime: number = 0.3; // Slow release (300ms)

  constructor(config: MeterVizConfig) {
    super(config);

    this.orientation = config.orientation || 'vertical';
    this.showPeakHold = config.showPeakHold ?? true;
    this.peakHoldTime = config.peakHoldTime || 2000; // 2 seconds
    this.segments = config.segments || 0;
    this.colors = config.colors || {
      low: '#00ff88', // Pro Tools cyan-green
      mid: '#ffaa00', // Orange-yellow
      high: '#ff3333', // Red
      clip: '#ff0000', // Bright red
      background: 'rgba(255, 255, 255, 0.05)',
    };
  }

  /**
   * Render meter
   */
  protected render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Get audio data
    const timeDomainData = this.getTimeDomainData();
    if (timeDomainData.length === 0) {
      this.renderEmptyMeter(width, height);
      return;
    }

    // Calculate RMS and peak levels
    const { rms, peak } = this.calculateLevels(timeDomainData);

    // Apply ballistics (smooth movement)
    this.applyBallistics(rms, peak);

    // Update peak hold
    this.updatePeakHold();

    // Render meter
    if (this.orientation === 'vertical') {
      this.renderVerticalMeter(width, height);
    } else {
      this.renderHorizontalMeter(width, height);
    }
  }

  /**
   * Calculate RMS and peak levels from time-domain data
   */
  private calculateLevels(data: Float32Array): { rms: number; peak: number } {
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < data.length; i++) {
      const sample = Math.abs(data[i] ?? 0);
      sumSquares += sample * sample;
      peak = Math.max(peak, sample);
    }

    const rms = Math.sqrt(sumSquares / data.length);

    // Check for clipping (sample >= 1.0)
    if (peak >= 0.99) {
      this.isClipping = true;
      this.clipTimestamp = performance.now();
    } else if (performance.now() - this.clipTimestamp > 1000) {
      this.isClipping = false;
    }

    return { rms, peak };
  }

  /**
   * Apply attack/release ballistics for smooth meter movement
   */
  private applyBallistics(targetLevel: number, peak: number): void {
    const frameTime = this.frameInterval / 1000; // Convert to seconds

    // RMS level with ballistics
    if (targetLevel > this.currentLevel) {
      // Attack (fast)
      const attackCoeff = 1 - Math.exp(-frameTime / this.attackTime);
      this.currentLevel += (targetLevel - this.currentLevel) * attackCoeff;
    } else {
      // Release (slow)
      const releaseCoeff = 1 - Math.exp(-frameTime / this.releaseTime);
      this.currentLevel += (targetLevel - this.currentLevel) * releaseCoeff;
    }

    // Peak level (instant attack, slow release)
    if (peak > this.peakLevel) {
      this.peakLevel = peak;
    } else {
      const releaseCoeff = 1 - Math.exp(-frameTime / this.releaseTime);
      this.peakLevel += (peak - this.peakLevel) * releaseCoeff;
    }

    // Clamp to [0, 1]
    this.currentLevel = Math.max(0, Math.min(1, this.currentLevel));
    this.peakLevel = Math.max(0, Math.min(1, this.peakLevel));
  }

  /**
   * Update peak hold indicator
   */
  private updatePeakHold(): void {
    const now = performance.now();

    if (this.peakLevel > this.peakHoldLevel) {
      this.peakHoldLevel = this.peakLevel;
      this.peakHoldTimestamp = now;
    } else if (now - this.peakHoldTimestamp > this.peakHoldTime) {
      // Release peak hold after hold time
      const releaseCoeff = 1 - Math.exp(-0.01 / this.releaseTime);
      this.peakHoldLevel += (this.peakLevel - this.peakHoldLevel) * releaseCoeff;
    }

    this.peakHoldLevel = Math.max(0, Math.min(1, this.peakHoldLevel));
  }

  /**
   * Render vertical meter
   */
  private renderVerticalMeter(width: number, height: number): void {
    const padding = 2;
    const meterWidth = width - padding * 2;
    const meterHeight = height - padding * 2;

    // Background
    this.ctx.fillStyle = this.colors.background;
    this.drawRoundedRect(padding, padding, meterWidth, meterHeight, 2);
    this.ctx.fill();

    // Calculate meter fill height
    const fillHeight = meterHeight * this.currentLevel;
    const fillY = padding + meterHeight - fillHeight;

    // Draw meter fill with gradient
    const gradient = this.ctx.createLinearGradient(0, padding + meterHeight, 0, padding);
    gradient.addColorStop(0, this.colors.low);
    gradient.addColorStop(0.6, this.colors.mid);
    gradient.addColorStop(0.9, this.colors.high);

    this.ctx.fillStyle = gradient;

    if (this.segments > 0) {
      // Segmented meter
      this.renderSegmentedMeter(padding, fillY, meterWidth, fillHeight, this.segments, true);
    } else {
      // Continuous meter
      this.drawRoundedRect(padding, fillY, meterWidth, fillHeight, 2);
      this.ctx.fill();
    }

    // Peak hold indicator
    if (this.showPeakHold && this.peakHoldLevel > 0.01) {
      const peakY = padding + meterHeight - meterHeight * this.peakHoldLevel;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(padding, peakY - 1, meterWidth, 2);
    }

    // Clipping indicator
    if (this.isClipping) {
      this.ctx.fillStyle = this.colors.clip;
      this.ctx.fillRect(padding, padding, meterWidth, 4);
    }
  }

  /**
   * Render horizontal meter
   */
  private renderHorizontalMeter(width: number, height: number): void {
    const padding = 2;
    const meterWidth = width - padding * 2;
    const meterHeight = height - padding * 2;

    // Background
    this.ctx.fillStyle = this.colors.background;
    this.drawRoundedRect(padding, padding, meterWidth, meterHeight, 2);
    this.ctx.fill();

    // Calculate meter fill width
    const fillWidth = meterWidth * this.currentLevel;

    // Draw meter fill with gradient
    const gradient = this.ctx.createLinearGradient(padding, 0, padding + meterWidth, 0);
    gradient.addColorStop(0, this.colors.low);
    gradient.addColorStop(0.6, this.colors.mid);
    gradient.addColorStop(0.9, this.colors.high);

    this.ctx.fillStyle = gradient;

    if (this.segments > 0) {
      // Segmented meter
      this.renderSegmentedMeter(padding, padding, fillWidth, meterHeight, this.segments, false);
    } else {
      // Continuous meter
      this.drawRoundedRect(padding, padding, fillWidth, meterHeight, 2);
      this.ctx.fill();
    }

    // Peak hold indicator
    if (this.showPeakHold && this.peakHoldLevel > 0.01) {
      const peakX = padding + meterWidth * this.peakHoldLevel;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(peakX - 1, padding, 2, meterHeight);
    }

    // Clipping indicator
    if (this.isClipping) {
      this.ctx.fillStyle = this.colors.clip;
      this.ctx.fillRect(padding + meterWidth - 4, padding, 4, meterHeight);
    }
  }

  /**
   * Render segmented meter (LED-style)
   */
  private renderSegmentedMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    segments: number,
    vertical: boolean
  ): void {
    const gap = 2;
    const segmentSize = vertical
      ? (height - gap * (segments - 1)) / segments
      : (width - gap * (segments - 1)) / segments;

    const filledSegments = vertical
      ? Math.ceil((height / (height + gap * (segments - 1))) * segments * this.currentLevel)
      : Math.ceil((width / (width + gap * (segments - 1))) * segments * this.currentLevel);

    for (let i = 0; i < segments; i++) {
      const segmentX = vertical ? x : x + i * (segmentSize + gap);
      const segmentY = vertical ? y + (segments - 1 - i) * (segmentSize + gap) : y;
      const segmentWidth = vertical ? width : segmentSize;
      const segmentHeight = vertical ? segmentSize : height;

      if (i < filledSegments) {
        this.ctx.globalAlpha = 1;
      } else {
        this.ctx.globalAlpha = 0.2;
      }

      this.drawRoundedRect(segmentX, segmentY, segmentWidth, segmentHeight, 1);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Render empty meter (no audio signal)
   */
  private renderEmptyMeter(width: number, height: number): void {
    const padding = 2;
    this.ctx.fillStyle = this.colors.background;
    this.drawRoundedRect(padding, padding, width - padding * 2, height - padding * 2, 2);
    this.ctx.fill();
  }

  /**
   * Reset meter state
   */
  reset(): void {
    this.currentLevel = 0;
    this.peakLevel = 0;
    this.peakHoldLevel = 0;
    this.isClipping = false;
  }
}
