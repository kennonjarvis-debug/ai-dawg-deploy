/**
 * Melody Analyzer - Instance 2 (Audio Engine)
 *
 * Bridges pitch detection and AI music generation
 * Converts real-time pitch data to structured melody analysis
 * Integrates with Instance 3's music generation system
 */

import { PitchHistoryPoint } from '@/core/usePitchDetection';
import {
  MIDINote,
  MelodyAnalysis,
  VocalCharacteristics,
  analyzeMelody,
} from '@/lib/ai/melody-types';

export interface MelodyAnalyzerOptions {
  /** Minimum note duration to consider (ms) - filters out glitches */
  minNoteDuration?: number;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Quantize to musical grid (helps with tempo detection) */
  quantize?: boolean;
  /** Quantization resolution (16 = sixteenth notes) */
  quantizeResolution?: number;
}

/**
 * Advanced Melody Analyzer
 * Converts pitch detection history to musical melody data
 */
export class MelodyAnalyzer {
  private options: Required<MelodyAnalyzerOptions>;

  constructor(options: MelodyAnalyzerOptions = {}) {
    this.options = {
      minNoteDuration: options.minNoteDuration ?? 100, // 100ms
      minConfidence: options.minConfidence ?? 0.7,
      quantize: options.quantize ?? false,
      quantizeResolution: options.quantizeResolution ?? 16,
    };
  }

  /**
   * Analyze pitch history to extract melody
   * Works directly with usePitchDetection output
   */
  analyzePitchHistory(
    pitchHistory: PitchHistoryPoint[],
    recordingDuration: number,
    bpm?: number
  ): MelodyAnalysis {
    // Convert pitch history to MIDI notes
    const pitchData = pitchHistory.map((point) => ({
      frequency: point.result.frequency,
      note: point.result.note || 'C4',
      midiNote: point.result.midiNote || 60,
      cents: point.result.cents,
      confidence: point.result.confidence,
      timestamp: point.timestamp / 1000, // Convert ms to seconds
    }));

    // Filter and convert to MIDI notes
    const midiNotes = this.convertToMIDINotes(pitchData);

    // Quantize if enabled
    const processedNotes = this.options.quantize && bpm
      ? this.quantizeNotes(midiNotes, bpm)
      : midiNotes;

    // Analyze melody characteristics
    const analysis = analyzeMelody(processedNotes);

    // Add metadata
    const fullAnalysis: MelodyAnalysis = {
      ...analysis,
      notes: processedNotes,
      tempo: bpm || analysis.tempo || 120,
      key: analysis.key || 'C major',
      scale: analysis.scale || 'major',
      duration: recordingDuration,
      averagePitch: analysis.averagePitch || 60,
      pitchRange: analysis.pitchRange || { min: 60, max: 72 },
      confidence: analysis.confidence || 0.5,
    };

    return fullAnalysis;
  }

  /**
   * Convert raw pitch data to MIDI notes with filtering
   */
  private convertToMIDINotes(
    pitchData: Array<{
      frequency: number;
      note: string;
      midiNote: number;
      cents: number;
      confidence: number;
      timestamp: number;
    }>
  ): MIDINote[] {
    const notes: MIDINote[] = [];
    let currentNote: MIDINote | null = null;

    for (const data of pitchData) {
      // Skip low-confidence detections
      if (data.confidence < this.options.minConfidence) continue;

      // Skip if no valid MIDI note
      if (data.midiNote === null || data.midiNote < 0) continue;

      // If new note or significant pitch change, start new note
      if (!currentNote || currentNote.note !== data.midiNote) {
        // Finish previous note
        if (currentNote) {
          // Only add if meets minimum duration
          if (currentNote.duration >= this.options.minNoteDuration / 1000) {
            notes.push(currentNote);
          }
        }

        // Start new note
        currentNote = {
          note: data.midiNote,
          noteName: data.note,
          startTime: data.timestamp,
          duration: 0,
          velocity: this.calculateVelocity(data.confidence),
          frequency: data.frequency,
          confidence: data.confidence,
        };
      } else {
        // Continue current note
        currentNote.duration = data.timestamp - currentNote.startTime;
        // Update confidence to highest value
        currentNote.confidence = Math.max(currentNote.confidence, data.confidence);
        // Update velocity based on confidence
        currentNote.velocity = Math.max(
          currentNote.velocity,
          this.calculateVelocity(data.confidence)
        );
      }
    }

    // Add final note
    if (currentNote && currentNote.duration >= this.options.minNoteDuration / 1000) {
      notes.push(currentNote);
    }

    return notes;
  }

  /**
   * Calculate MIDI velocity from pitch detection confidence
   */
  private calculateVelocity(confidence: number): number {
    // Map confidence (0-1) to MIDI velocity (40-100)
    // Higher confidence = stronger/louder note
    const velocity = Math.round(40 + confidence * 60);
    return Math.max(40, Math.min(100, velocity));
  }

  /**
   * Quantize notes to musical grid
   * Helps with tempo detection and makes melody more musical
   */
  private quantizeNotes(notes: MIDINote[], bpm: number): MIDINote[] {
    const beatDuration = 60 / bpm;
    const gridDuration = beatDuration / (this.options.quantizeResolution / 4);

    return notes.map((note) => {
      // Quantize start time to nearest grid position
      const quantizedStart =
        Math.round(note.startTime / gridDuration) * gridDuration;

      // Quantize duration to nearest grid division
      const quantizedDuration =
        Math.round(note.duration / gridDuration) * gridDuration;

      return {
        ...note,
        startTime: quantizedStart,
        duration: Math.max(gridDuration, quantizedDuration), // At least one grid unit
      };
    });
  }

  /**
   * Analyze vocal characteristics from pitch history
   * Useful for AI feedback and voice cloning
   */
  analyzeVocalCharacteristics(pitchHistory: PitchHistoryPoint[]): VocalCharacteristics {
    if (pitchHistory.length === 0) {
      return {
        averageFrequency: 0,
        pitchStability: 0,
        dynamicRange: 0,
      };
    }

    // Calculate average frequency
    const frequencies = pitchHistory
      .filter((p) => p.result.frequency > 0)
      .map((p) => p.result.frequency);

    const averageFrequency =
      frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;

    // Calculate pitch stability (inverse of standard deviation)
    const variance =
      frequencies.reduce((sum, f) => sum + Math.pow(f - averageFrequency, 2), 0) /
      frequencies.length;
    const stdDev = Math.sqrt(variance);
    const pitchStability = Math.max(0, 1 - stdDev / averageFrequency);

    // Detect vibrato (periodic pitch variation)
    const vibrato = this.detectVibrato(pitchHistory);

    // Calculate dynamic range from confidence variations
    // (confidence correlates with volume in many pitch detectors)
    const confidences = pitchHistory.map((p) => p.result.confidence);
    const maxConfidence = Math.max(...confidences);
    const minConfidence = Math.min(...confidences);
    const dynamicRange = (maxConfidence - minConfidence) * 20; // Rough dB estimate

    return {
      averageFrequency,
      pitchStability,
      vibratoRate: vibrato.rate,
      vibratoDepth: vibrato.depth,
      dynamicRange,
    };
  }

  /**
   * Detect vibrato in pitch data
   * Looks for periodic oscillations in pitch
   */
  private detectVibrato(pitchHistory: PitchHistoryPoint[]): {
    rate: number | undefined;
    depth: number | undefined;
  } {
    if (pitchHistory.length < 50) {
      return { rate: undefined, depth: undefined };
    }

    // Get frequency deviations from average
    const frequencies = pitchHistory
      .filter((p) => p.result.frequency > 0)
      .map((p) => p.result.frequency);

    const avgFreq =
      frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
    const deviations = frequencies.map((f) => f - avgFreq);

    // Simple autocorrelation to find periodic pattern
    let maxCorrelation = 0;
    let vibratoLag = 0;

    for (let lag = 5; lag < 30; lag++) {
      // 5-30 samples (~100-600ms at 50ms interval)
      let correlation = 0;
      for (let i = 0; i < deviations.length - lag; i++) {
        const dev1 = deviations[i];
        const dev2 = deviations[i + lag];
        if (dev1 !== undefined && dev2 !== undefined) {
          correlation += dev1 * dev2;
        }
      }
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        vibratoLag = lag;
      }
    }

    // If we found a strong periodic pattern, calculate vibrato
    if (maxCorrelation > 0.3 && vibratoLag > 0) {
      // Vibrato rate in Hz (assuming 50ms sampling)
      const vibratoRate = 1000 / (vibratoLag * 50);

      // Vibrato depth in cents
      const maxDeviation = Math.max(...deviations.map(Math.abs));
      const vibratoDepth = (1200 * Math.log2(1 + maxDeviation / avgFreq)) / 2;

      return { rate: vibratoRate, depth: vibratoDepth };
    }

    return { rate: undefined, depth: undefined };
  }

  /**
   * Export melody as text representation (for debugging)
   */
  exportAsText(melody: MelodyAnalysis): string {
    const lines: string[] = [];

    lines.push(`Melody Analysis`);
    lines.push(`===============`);
    lines.push(`Key: ${melody.key}`);
    lines.push(`Tempo: ${melody.tempo} BPM`);
    lines.push(`Duration: ${melody.duration.toFixed(2)}s`);
    lines.push(`Notes: ${melody.notes.length}`);
    lines.push(`Pitch Range: ${melody.pitchRange.min} - ${melody.pitchRange.max}`);
    lines.push(`Confidence: ${(melody.confidence * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('Notes:');
    lines.push('------');

    melody.notes.forEach((note, i) => {
      lines.push(
        `${i + 1}. ${note.noteName} (${note.note}) @ ${note.startTime.toFixed(2)}s for ${note.duration.toFixed(2)}s (vel: ${note.velocity})`
      );
    });

    return lines.join('\n');
  }

  /**
   * Update analyzer options
   */
  updateOptions(options: Partial<MelodyAnalyzerOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Quick utility: Analyze pitch history and return melody
 * Convenience function for one-off analysis
 */
export function quickAnalyzeMelody(
  pitchHistory: PitchHistoryPoint[],
  recordingDuration: number,
  bpm?: number,
  options?: MelodyAnalyzerOptions
): MelodyAnalysis {
  const analyzer = new MelodyAnalyzer(options);
  return analyzer.analyzePitchHistory(pitchHistory, recordingDuration, bpm);
}

/**
 * Quick utility: Get vocal characteristics
 */
export function quickAnalyzeVocals(
  pitchHistory: PitchHistoryPoint[]
): VocalCharacteristics {
  const analyzer = new MelodyAnalyzer();
  return analyzer.analyzeVocalCharacteristics(pitchHistory);
}
