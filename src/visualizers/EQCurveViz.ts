/**
 * EQCurveViz - EQ Frequency Response Curve Visualizer
 *
 * Displays visual EQ curve showing frequency response
 * - Logarithmic frequency scale (20Hz - 20kHz)
 * - Interactive frequency response curve
 * - Handles low/mid/high bands
 * - Shows ±12dB range
 */

import { AudioVisualizer, AudioVisualizerConfig } from './AudioVisualizer';

export interface EQBandParams {
  frequency: number; // Hz
  gain: number; // dB
  Q: number; // Quality factor
  type: BiquadFilterType;
}

export interface EQCurveParams {
  low: EQBandParams;
  mid: EQBandParams;
  high: EQBandParams;
}

export interface EQCurveVizConfig extends AudioVisualizerConfig {
  /** EQ parameters */
  eqParams: EQCurveParams;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show frequency labels */
  showLabels?: boolean;
  /** Curve color */
  curveColor?: string;
  /** Grid color */
  gridColor?: string;
  /** Background color */
  backgroundColor?: string;
}

export class EQCurveViz extends AudioVisualizer {
  private eqParams: EQCurveParams;
  private showGrid: boolean;
  private showLabels: boolean;
  private curveColor: string;
  private gridColor: string;
  private backgroundColor: string;

  // Frequency range
  private minFreq = 20;
  private maxFreq = 20000;

  // Gain range
  private minGain = -12;
  private maxGain = 12;

  constructor(config: EQCurveVizConfig) {
    super({...config, targetFPS: 30}); // Lower FPS for static EQ curve

    this.eqParams = config.eqParams;
    this.showGrid = config.showGrid ?? true;
    this.showLabels = config.showLabels ?? true;
    this.curveColor = config.curveColor || '#00e5ff';
    this.gridColor = config.gridColor || 'rgba(255, 255, 255, 0.1)';
    this.backgroundColor = config.backgroundColor || 'transparent';
  }

  /**
   * Update EQ parameters
   */
  updateEQParams(params: EQCurveParams): void {
    this.eqParams = params;
  }

  /**
   * Render EQ curve
   */
  protected render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Background
    if (this.backgroundColor !== 'transparent') {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    // Draw grid
    if (this.showGrid) {
      this.renderGrid(width, height);
    }

    // Draw curve
    this.renderCurve(width, height);

    // Draw labels
    if (this.showLabels) {
      this.renderLabels(width, height);
    }
  }

  /**
   * Render grid lines
   */
  private renderGrid(width: number, height: number): void {
    this.ctx.strokeStyle = this.gridColor;
    this.ctx.lineWidth = 1;

    // Horizontal lines (gain: -12dB, -6dB, 0dB, +6dB, +12dB)
    const gainLines = [-12, -6, 0, 6, 12];
    gainLines.forEach(gain => {
      const y = this.gainToY(gain, height);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();

      // 0dB line slightly brighter
      if (gain === 0) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
        this.ctx.strokeStyle = this.gridColor;
      }
    });

    // Vertical lines (frequency: 100Hz, 1kHz, 10kHz)
    const freqLines = [100, 1000, 10000];
    freqLines.forEach(freq => {
      const x = this.freqToX(freq, width);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    });
  }

  /**
   * Render frequency response curve
   */
  private renderCurve(width: number, height: number): void {
    const numPoints = width; // One point per pixel for smooth curve

    this.ctx.strokeStyle = this.curveColor;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Add glow effect
    this.ctx.shadowColor = this.curveColor;
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();

    for (let i = 0; i < numPoints; i++) {
      const x = i;
      const freq = this.xToFreq(x, width);
      const gain = this.calculateFrequencyResponse(freq);
      const y = this.gainToY(gain, height);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // Fill under curve (gradient)
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.curveColor + '40');
    gradient.addColorStop(1, this.curveColor + '00');
    this.ctx.fillStyle = gradient;

    // Complete the path to bottom
    this.ctx.lineTo(width, height);
    this.ctx.lineTo(0, height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Render frequency and gain labels
   */
  private renderLabels(width: number, height: number): void {
    this.ctx.fillStyle = '#888';
    this.ctx.font = '9px monospace';
    this.ctx.textAlign = 'center';

    // Frequency labels
    const freqLabels = [
      { freq: 20, label: '20' },
      { freq: 100, label: '100' },
      { freq: 1000, label: '1k' },
      { freq: 10000, label: '10k' },
      { freq: 20000, label: '20k' },
    ];

    freqLabels.forEach(({ freq, label }) => {
      const x = this.freqToX(freq, width);
      this.ctx.fillText(label, x, height - 4);
    });

    // Gain labels
    this.ctx.textAlign = 'right';
    const gainLabels = [-12, 0, 12];
    gainLabels.forEach(gain => {
      const y = this.gainToY(gain, height);
      this.ctx.fillText(`${gain > 0 ? '+' : ''}${gain}`, width - 4, y + 3);
    });
  }

  /**
   * Calculate total frequency response at given frequency
   */
  private calculateFrequencyResponse(freq: number): number {
    let totalGain = 0;

    // Low band
    totalGain += this.calculateBandResponse(freq, this.eqParams.low);

    // Mid band
    totalGain += this.calculateBandResponse(freq, this.eqParams.mid);

    // High band
    totalGain += this.calculateBandResponse(freq, this.eqParams.high);

    return totalGain;
  }

  /**
   * Calculate single EQ band response at given frequency
   * Using biquad filter formula approximation
   */
  private calculateBandResponse(freq: number, band: EQBandParams): number {
    const f0 = band.frequency;
    const Q = band.Q;

    // Simplified response calculation based on filter type
    // Note: Using simplified approximation instead of full biquad formula
    if (band.type === 'lowshelf') {
      // Low shelf approximation
      const ratio = freq / f0;
      if (ratio < 0.5) {
        return band.gain;
      } else if (ratio > 2) {
        return 0;
      } else {
        // Smooth transition
        return band.gain * (1 - Math.log2(ratio * 2));
      }
    } else if (band.type === 'highshelf') {
      // High shelf approximation
      const ratio = freq / f0;
      if (ratio > 2) {
        return band.gain;
      } else if (ratio < 0.5) {
        return 0;
      } else {
        // Smooth transition
        return band.gain * Math.log2(ratio * 2);
      }
    } else if (band.type === 'peaking') {
      // Peaking filter approximation
      const ratio = Math.abs(Math.log2(freq / f0));
      const bandwidth = 1 / Q;

      if (ratio < bandwidth) {
        const factor = 1 - (ratio / bandwidth);
        return band.gain * factor;
      } else {
        return 0;
      }
    }

    return 0;
  }

  /**
   * Convert frequency to X coordinate (logarithmic scale)
   */
  private freqToX(freq: number, width: number): number {
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const logFreq = Math.log10(freq);

    return ((logFreq - logMin) / (logMax - logMin)) * width;
  }

  /**
   * Convert X coordinate to frequency (logarithmic scale)
   */
  private xToFreq(x: number, width: number): number {
    const logMin = Math.log10(this.minFreq);
    const logMax = Math.log10(this.maxFreq);
    const logFreq = logMin + (x / width) * (logMax - logMin);

    return Math.pow(10, logFreq);
  }

  /**
   * Convert gain (dB) to Y coordinate
   */
  private gainToY(gain: number, height: number): number {
    const normalized = (gain - this.minGain) / (this.maxGain - this.minGain);
    return height - normalized * height; // Invert Y axis (0 at top)
  }
}
