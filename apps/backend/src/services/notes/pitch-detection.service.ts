/**
 * Pitch Detection Service using Basic Pitch (Spotify's CREPE-based model)
 * Provides molecular-level pitch quantization for beat matching
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '../../../../src/lib/utils/logger.js';

const execAsync = promisify(exec);

export interface PitchAnalysis {
  /** Detected root note (e.g., "C4", "G#3") */
  rootNote: string;
  /** Frequency in Hz */
  frequency: number;
  /** MIDI note number */
  midiNote: number;
  /** All detected notes over time */
  notes: PitchNote[];
  /** Tempo in BPM */
  tempo: number;
  /** Time signature */
  timeSignature: string;
  /** Key signature */
  key: string;
  /** Pitch stability (0-1, higher = more stable) */
  stability: number;
}

export interface PitchNote {
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** MIDI note number */
  midiNote: number;
  /** Note name (e.g., "C4") */
  noteName: string;
  /** Frequency in Hz */
  frequency: number;
  /** Confidence (0-1) */
  confidence: number;
}

export class PitchDetectionService {
  /**
   * Analyze pitch of audio file using Basic Pitch
   */
  async analyzePitch(audioPath: string): Promise<PitchAnalysis> {
    try {
      logger.info('🎵 Analyzing pitch: ${path.basename(audioPath)}');

      // Create temp directory for output
      const tempDir = '/tmp/pitch-analysis';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Run Basic Pitch to extract MIDI
      const outputPath = path.join(tempDir, 'output.mid');
      await execAsync(`basic-pitch "${outputPath}" "${audioPath}" --save-midi --no-save-audio`);

      // Parse MIDI file to extract pitch data
      const pitchData = await this.parseMidiFile(outputPath);

      // Analyze for root note and key
      const rootNote = this.findRootNote(pitchData.notes);
      const key = this.detectKey(pitchData.notes);
      const tempo = await this.detectTempo(audioPath);

      logger.info('✅ Pitch analysis complete: ${rootNote} at ${tempo} BPM in ${key}');

      return {
        rootNote: rootNote.noteName,
        frequency: rootNote.frequency,
        midiNote: rootNote.midiNote,
        notes: pitchData.notes,
        tempo,
        timeSignature: '4/4', // Default, can be improved
        key,
        stability: pitchData.stability,
      };
    } catch (error) {
      logger.error('Pitch analysis error', { error: error.message || String(error) });
      throw error;
    }
  }

  /**
   * Parse MIDI file to extract note data
   */
  private async parseMidiFile(midiPath: string): Promise<{ notes: PitchNote[]; stability: number }> {
    // Use basic-pitch JSON output instead of MIDI for easier parsing
    const jsonPath = midiPath.replace('.mid', '.json');

    if (!fs.existsSync(jsonPath)) {
      // Fallback: analyze audio directly with ffmpeg
      return this.fallbackPitchAnalysis(midiPath);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const notes: PitchNote[] = data.notes.map((note: any) => ({
      startTime: note.start_time_s,
      duration: note.duration_s,
      midiNote: note.pitch_midi,
      noteName: this.midiToNoteName(note.pitch_midi),
      frequency: this.midiToFrequency(note.pitch_midi),
      confidence: note.confidence,
    }));

    // Calculate stability (variance of pitches)
    const pitchVariance = this.calculateVariance(notes.map(n => n.midiNote));
    const stability = Math.max(0, 1 - pitchVariance / 12); // Normalize to 0-1

    return { notes, stability };
  }

  /**
   * Fallback pitch analysis using ffmpeg spectral analysis
   */
  private async fallbackPitchAnalysis(audioPath: string): Promise<{ notes: PitchNote[]; stability: number }> {
    logger.warn('⚠️  Using fallback pitch analysis (Basic Pitch failed)');

    // Use ffmpeg to get spectral data
    const { stdout } = await execAsync(
      `ffmpeg -i "${audioPath}" -af "showfreqs=mode=line:fscale=log" -f null - 2>&1 | grep -i "freq"`
    );

    // Parse dominant frequency from output
    const freqMatch = stdout.match(/(\d+)\s*Hz/);
    const frequency = freqMatch ? parseInt(freqMatch[1]) : 440; // Default to A4

    const midiNote = this.frequencyToMidi(frequency);
    const noteName = this.midiToNoteName(midiNote);

    return {
      notes: [{
        startTime: 0,
        duration: 10, // Estimate
        midiNote,
        noteName,
        frequency,
        confidence: 0.5, // Low confidence for fallback
      }],
      stability: 0.5,
    };
  }

  /**
   * Find the root note (most common pitch)
   */
  private findRootNote(notes: PitchNote[]): PitchNote {
    if (notes.length === 0) {
      return {
        startTime: 0,
        duration: 0,
        midiNote: 60, // C4
        noteName: 'C4',
        frequency: 261.63,
        confidence: 0,
      };
    }

    // Find most common MIDI note
    const noteCounts = new Map<number, number>();
    notes.forEach(note => {
      const count = noteCounts.get(note.midiNote) || 0;
      noteCounts.set(note.midiNote, count + 1);
    });

    const [rootMidi] = [...noteCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b);
    return notes.find(n => n.midiNote === rootMidi) || notes[0];
  }

  /**
   * Detect musical key from notes
   */
  private detectKey(notes: PitchNote[]): string {
    // Simplified key detection - count pitch classes
    const pitchClasses = new Map<number, number>();

    notes.forEach(note => {
      const pitchClass = note.midiNote % 12; // 0 = C, 1 = C#, etc.
      const count = pitchClasses.get(pitchClass) || 0;
      pitchClasses.set(pitchClass, count + 1);
    });

    // Get top 3 pitch classes
    const topClasses = [...pitchClasses.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pc]) => pc);

    // Map pitch classes to key names
    const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const root = keyNames[topClasses[0]];

    // Detect major vs minor (simplified)
    const hasMinorThird = topClasses.includes((topClasses[0] + 3) % 12);
    const hasMajorThird = topClasses.includes((topClasses[0] + 4) % 12);

    if (hasMinorThird && !hasMajorThird) {
      return `${root} minor`;
    }
    return `${root} major`;
  }

  /**
   * Detect tempo using ffmpeg beat detection
   */
  private async detectTempo(audioPath: string): Promise<number> {
    try {
      // Use sox tempo detection if available
      const { stdout } = await execAsync(
        `sox "${audioPath}" -t null - tempo -m 2>&1 || echo "120"`,
        { timeout: 30000 }
      );

      const tempoMatch = stdout.match(/(\d+\.?\d*)\s*bpm/i);
      return tempoMatch ? Math.round(parseFloat(tempoMatch[1])) : 120;
    } catch (error) {
      logger.warn('⚠️  Tempo detection failed, using default 120 BPM');
      return 120;
    }
  }

  /**
   * Convert MIDI note number to frequency (Hz)
   */
  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Convert frequency to MIDI note number
   */
  private frequencyToMidi(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  /**
   * Convert MIDI note to note name
   */
  private midiToNoteName(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Calculate variance of array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Quantize pitch to nearest musical note
   */
  quantizePitch(frequency: number): { midiNote: number; noteName: string; frequency: number } {
    const midiNote = Math.round(this.frequencyToMidi(frequency));
    const quantizedFrequency = this.midiToFrequency(midiNote);
    const noteName = this.midiToNoteName(midiNote);

    return {
      midiNote,
      noteName,
      frequency: quantizedFrequency,
    };
  }
}

export const pitchDetectionService = new PitchDetectionService();
