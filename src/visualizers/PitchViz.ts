/**
 * PitchViz - Real-time Pitch Visualization
 *
 * Displays pitch information with:
 * - Musical note display (C4, D#5, etc.)
 * - Cents deviation meter (+/- 50 cents)
 * - Frequency readout
 * - Tuner-style visual feedback
 * - Pitch history graph
 */

import { AudioVisualizer, AudioVisualizerConfig } from './AudioVisualizer';

export interface PitchData {
  note: string | null;
  frequency: number | null;
  cents: number | null;
  confidence: number;
  inTune: boolean;
}

export interface PitchVizConfig extends AudioVisualizerConfig {
  /** Show pitch history graph */
  showHistory?: boolean;
  /** History duration (seconds) */
  historyDuration?: number;
  /** In-tune threshold (cents) */
  inTuneThreshold?: number;
  /** Color scheme */
  colors?: {
    inTune: string;
    outOfTune: string;
    background: string;
    text: string;
    grid: string;
  };
  /** Show cents meter */
  showCentsMeter?: boolean;
  /** Show frequency readout */
  showFrequency?: boolean;
}

export class PitchViz extends AudioVisualizer {
  private showHistory: boolean;
  private historyDuration: number;
  private inTuneThreshold: number;
  private colors: Required<PitchVizConfig>['colors'];
  private showCentsMeter: boolean;
  private showFrequency: boolean;

  // Pitch state
  private currentPitch: PitchData = {
    note: null,
    frequency: null,
    cents: null,
    confidence: 0,
    inTune: false,
  };

  // Pitch history
  private pitchHistory: Array<{ time: number; frequency: number; cents: number }> = [];

  // Note names
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  private static readonly A4_FREQUENCY = 440;

  constructor(config: PitchVizConfig) {
    super(config);

    this.showHistory = config.showHistory ?? true;
    this.historyDuration = config.historyDuration || 5; // 5 seconds
    this.inTuneThreshold = config.inTuneThreshold || 10; // ±10 cents
    this.showCentsMeter = config.showCentsMeter ?? true;
    this.showFrequency = config.showFrequency ?? true;

    this.colors = config.colors || {
      inTune: '#00ff88',
      outOfTune: '#ff5555',
      background: 'rgba(0, 0, 0, 0.3)',
      text: '#ffffff',
      grid: 'rgba(255, 255, 255, 0.1)',
    };
  }

  /**
   * Update current pitch data (call this from external pitch detection)
   */
  updatePitch(pitchData: PitchData): void {
    this.currentPitch = pitchData;

    // Add to history
    if (pitchData.frequency !== null && pitchData.cents !== null) {
      const now = performance.now();
      this.pitchHistory.push({
        time: now,
        frequency: pitchData.frequency,
        cents: pitchData.cents,
      });

      // Remove old history entries
      const cutoffTime = now - this.historyDuration * 1000;
      this.pitchHistory = this.pitchHistory.filter(entry => entry.time > cutoffTime);
    }
  }

  /**
   * Clear pitch history
   */
  clearHistory(): void {
    this.pitchHistory = [];
  }

  /**
   * Render pitch visualization
   */
  protected render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Background
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, width, height);

    // Layout areas
    const noteAreaHeight = height * 0.4;
    const meterAreaHeight = height * 0.3;
    const historyAreaHeight = height * 0.3;

    // Render note display
    this.renderNoteDisplay(0, 0, width, noteAreaHeight);

    // Render cents meter
    if (this.showCentsMeter) {
      this.renderCentsMeter(0, noteAreaHeight, width, meterAreaHeight);
    }

    // Render pitch history
    if (this.showHistory) {
      const historyY = this.showCentsMeter ? noteAreaHeight + meterAreaHeight : noteAreaHeight;
      const historyHeight = this.showCentsMeter ? historyAreaHeight : meterAreaHeight + historyAreaHeight;
      this.renderPitchHistory(0, historyY, width, historyHeight);
    }
  }

  /**
   * Render note name display
   */
  private renderNoteDisplay(x: number, y: number, width: number, height: number): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Note name
    if (this.currentPitch.note) {
      const color = this.currentPitch.inTune ? this.colors.inTune : this.colors.outOfTune;

      this.ctx.fillStyle = color;
      this.ctx.font = `bold ${height * 0.5}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.currentPitch.note, centerX, centerY);

      // Frequency readout (smaller)
      if (this.showFrequency && this.currentPitch.frequency !== null) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${height * 0.15}px monospace`;
        this.ctx.fillText(
          `${this.currentPitch.frequency.toFixed(1)} Hz`,
          centerX,
          centerY + height * 0.35
        );
      }
    } else {
      // No signal
      this.ctx.fillStyle = this.colors.text;
      this.ctx.globalAlpha = 0.3;
      this.ctx.font = `${height * 0.2}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('--', centerX, centerY);
      this.ctx.globalAlpha = 1;
    }
  }

  /**
   * Render cents deviation meter (tuner-style)
   */
  private renderCentsMeter(x: number, y: number, width: number, height: number): void {
    const padding = 20;
    const meterWidth = width - padding * 2;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Background track
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(x + padding, centerY - 2, meterWidth, 4);

    // Center mark (0 cents)
    this.ctx.fillStyle = this.colors.grid;
    this.ctx.fillRect(centerX - 1, centerY - height * 0.3, 2, height * 0.6);

    // Tick marks every 10 cents
    for (let cents = -50; cents <= 50; cents += 10) {
      if (cents === 0) continue; // Skip center
      const tickX = centerX + (cents / 50) * (meterWidth / 2);
      const tickHeight = Math.abs(cents) === 50 ? height * 0.4 : height * 0.2;
      this.ctx.fillStyle = this.colors.grid;
      this.ctx.fillRect(tickX - 1, centerY - tickHeight / 2, 2, tickHeight);
    }

    // Cents indicator
    if (this.currentPitch.cents !== null) {
      const cents = Math.max(-50, Math.min(50, this.currentPitch.cents));
      const indicatorX = centerX + (cents / 50) * (meterWidth / 2);

      // Indicator circle
      const color = this.currentPitch.inTune ? this.colors.inTune : this.colors.outOfTune;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(indicatorX, centerY, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Cents text
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = `${height * 0.25}px monospace`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      const centsText = cents > 0 ? `+${cents.toFixed(0)}¢` : `${cents.toFixed(0)}¢`;
      this.ctx.fillText(centsText, centerX, y + height - 5);
    }
  }

  /**
   * Render pitch history graph
   */
  private renderPitchHistory(x: number, y: number, width: number, height: number): void {
    if (this.pitchHistory.length < 2) return;

    const padding = 10;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const graphX = x + padding;
    const graphY = y + padding;

    // Grid lines
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 1;

    // Horizontal center line (0 cents)
    const centerY = graphY + graphHeight / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(graphX, centerY);
    this.ctx.lineTo(graphX + graphWidth, centerY);
    this.ctx.stroke();

    // Horizontal lines at ±25 cents
    this.ctx.beginPath();
    this.ctx.moveTo(graphX, centerY - graphHeight * 0.25);
    this.ctx.lineTo(graphX + graphWidth, centerY - graphHeight * 0.25);
    this.ctx.moveTo(graphX, centerY + graphHeight * 0.25);
    this.ctx.lineTo(graphX + graphWidth, centerY + graphHeight * 0.25);
    this.ctx.stroke();

    // Plot pitch history
    const now = performance.now();
    const timeRange = this.historyDuration * 1000;

    this.ctx.strokeStyle = this.colors.inTune;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();

    for (let i = 0; i < this.pitchHistory.length; i++) {
      const entry = this.pitchHistory[i];
      if (!entry) continue; // Skip if undefined

      const age = now - entry.time;
      const xPos = graphX + graphWidth - (age / timeRange) * graphWidth;
      const cents = Math.max(-50, Math.min(50, entry.cents));
      const yPos = centerY - (cents / 50) * (graphHeight / 2);

      if (i === 0) {
        this.ctx.moveTo(xPos, yPos);
      } else {
        this.ctx.lineTo(xPos, yPos);
      }
    }

    this.ctx.stroke();

    // Draw points
    for (let i = 0; i < this.pitchHistory.length; i++) {
      const entry = this.pitchHistory[i];
      if (!entry) continue; // Skip if undefined

      const age = now - entry.time;
      const xPos = graphX + graphWidth - (age / timeRange) * graphWidth;
      const cents = Math.max(-50, Math.min(50, entry.cents));
      const yPos = centerY - (cents / 50) * (graphHeight / 2);

      const inTune = Math.abs(cents) <= this.inTuneThreshold;
      this.ctx.fillStyle = inTune ? this.colors.inTune : this.colors.outOfTune;

      this.ctx.beginPath();
      this.ctx.arc(xPos, yPos, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Static utility: Convert frequency to note name
   */
  static frequencyToNote(frequency: number): { note: string; cents: number } {
    const a4 = PitchViz.A4_FREQUENCY;
    const semitoneOffset = 12 * Math.log2(frequency / a4);
    const noteIndex = Math.round(semitoneOffset);
    const cents = (semitoneOffset - noteIndex) * 100;

    const octave = Math.floor((noteIndex + 9) / 12) + 4;
    const noteNameIndex = ((noteIndex % 12) + 12) % 12;
    const noteName = PitchViz.NOTE_NAMES[noteNameIndex];

    return {
      note: `${noteName}${octave}`,
      cents: Math.round(cents),
    };
  }

  /**
   * Static utility: Convert note name to frequency
   */
  static noteToFrequency(note: string, octave: number): number {
    const noteIndex = PitchViz.NOTE_NAMES.indexOf(note);
    if (noteIndex === -1) return 0;

    const semitoneOffset = (octave - 4) * 12 + noteIndex - 9;
    return PitchViz.A4_FREQUENCY * Math.pow(2, semitoneOffset / 12);
  }
}
