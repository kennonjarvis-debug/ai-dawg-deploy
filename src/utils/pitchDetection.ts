/**
 * Pitch Detection Utilities - Instance 2 (Audio Engine)
 *
 * Real-time pitch detection using autocorrelation algorithm
 * No external dependencies - pure Web Audio API + DSP
 *
 * Features:
 * - Fundamental frequency detection (Hz)
 * - Musical note detection (C, D, E, etc. with octave)
 * - Cents deviation from target pitch
 * - Confidence scoring
 * - Real-time optimized for <20ms latency
 */

export interface PitchDetectionResult {
  /** Detected frequency in Hz (0 if no pitch detected) */
  frequency: number;
  /** Musical note (e.g., "C4", "A#3") - null if no pitch detected */
  note: string | null;
  /** MIDI note number (0-127) - null if no pitch detected */
  midiNote: number | null;
  /** Deviation from target note in cents (-50 to +50) */
  cents: number;
  /** Confidence score (0-1) - higher is more confident */
  confidence: number;
  /** Whether pitch is considered "in tune" (within ±20 cents) */
  inTune: boolean;
  /** Raw autocorrelation value */
  clarity: number;
}

export interface PitchDetectorConfig {
  /** Sample rate of audio context */
  sampleRate: number;
  /** Minimum frequency to detect (default: 80Hz - low E2) */
  minFrequency?: number;
  /** Maximum frequency to detect (default: 1000Hz - high B5) */
  maxFrequency?: number;
  /** Confidence threshold (0-1, default: 0.9) */
  confidenceThreshold?: number;
  /** In-tune tolerance in cents (default: 20) */
  inTuneTolerance?: number;
}

// Musical note names
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A4 = 440Hz reference
const A4_FREQUENCY = 440;
const A4_MIDI_NOTE = 69;

/**
 * Autocorrelation-based pitch detector
 * Uses time-domain analysis to find the fundamental frequency
 */
export class PitchDetector {
  private sampleRate: number;
  private minFrequency: number;
  private maxFrequency: number;
  private confidenceThreshold: number;
  private inTuneTolerance: number;

  // Buffers for processing
  private buffer: Float32Array | null = null;
  private autocorrelation: Float32Array | null = null;

  constructor(config: PitchDetectorConfig) {
    this.sampleRate = config.sampleRate;
    this.minFrequency = config.minFrequency ?? 80; // Low E2
    this.maxFrequency = config.maxFrequency ?? 1000; // High B5
    this.confidenceThreshold = config.confidenceThreshold ?? 0.9;
    this.inTuneTolerance = config.inTuneTolerance ?? 20; // cents
  }

  /**
   * Detect pitch from time-domain audio data
   * @param audioData - Float32Array of audio samples
   * @returns Pitch detection result
   */
  detect(audioData: Float32Array): PitchDetectionResult {
    // Initialize buffers if needed
    const bufferSize = audioData.length;
    if (!this.buffer || this.buffer.length !== bufferSize) {
      this.buffer = new Float32Array(bufferSize);
      this.autocorrelation = new Float32Array(bufferSize);
    }

    // Copy and normalize input data
    const rms = this.getRMS(audioData);
    if (rms < 0.01) {
      // Signal too quiet - no pitch detected
      return this.createEmptyResult();
    }

    // Normalize to prevent overflow
    for (let i = 0; i < bufferSize; i++) {
      const sample = audioData[i];
      if (sample !== undefined) {
        this.buffer[i] = sample / rms;
      }
    }

    // Perform autocorrelation
    if (!this.buffer || !this.autocorrelation) {
      return this.createEmptyResult();
    }
    this.computeAutocorrelation(this.buffer, this.autocorrelation);

    // Find fundamental period
    const period = this.findFundamentalPeriod(this.autocorrelation);

    if (period === -1) {
      return this.createEmptyResult();
    }

    // Convert period to frequency
    const frequency = this.sampleRate / period;

    // Check if frequency is in valid range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return this.createEmptyResult();
    }

    // Get clarity (autocorrelation peak value)
    const clarity = this.autocorrelation[period] ?? 0;

    // Calculate confidence based on clarity and RMS
    const confidence = Math.min(clarity * Math.min(rms * 10, 1), 1);

    if (confidence < this.confidenceThreshold) {
      return this.createEmptyResult();
    }

    // Convert frequency to musical note
    const { note, midiNote, cents } = this.frequencyToNote(frequency);

    // Check if in tune
    const inTune = Math.abs(cents) <= this.inTuneTolerance;

    return {
      frequency,
      note,
      midiNote,
      cents,
      confidence,
      inTune,
      clarity,
    };
  }

  /**
   * Calculate RMS (Root Mean Square) of audio signal
   */
  private getRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      if (sample !== undefined) {
        sum += sample * sample;
      }
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Compute autocorrelation using time-domain method
   * Autocorrelation finds repeating patterns in the signal
   */
  private computeAutocorrelation(
    input: Float32Array,
    output: Float32Array
  ): void {
    const size = input.length;

    // First pass: compute autocorrelation
    for (let lag = 0; lag < size; lag++) {
      let sum = 0;
      for (let i = 0; i < size - lag; i++) {
        const sample1 = input[i];
        const sample2 = input[i + lag];
        if (sample1 !== undefined && sample2 !== undefined) {
          sum += sample1 * sample2;
        }
      }
      output[lag] = sum;
    }

    // Normalize by the zero-lag autocorrelation
    const normFactor = output[0] ?? 1;
    if (normFactor > 0) {
      for (let i = 0; i < size; i++) {
        const val = output[i];
        if (val !== undefined) {
          output[i] = val / normFactor;
        }
      }
    }
  }

  /**
   * Find the fundamental period from autocorrelation data
   * Looks for the first significant peak after the zero lag
   */
  private findFundamentalPeriod(autocorrelation: Float32Array): number {
    const size = autocorrelation.length;

    // Calculate min/max lags from frequency range
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);

    // Find the first significant peak
    let bestPeriod = -1;
    let bestCorrelation = 0;

    for (let lag = minPeriod; lag < Math.min(maxPeriod, size); lag++) {
      const current = autocorrelation[lag];
      const prev = autocorrelation[lag - 1];
      const next = autocorrelation[lag + 1];

      // Look for local maximum
      if (
        lag > 0 &&
        lag < size - 1 &&
        current !== undefined &&
        prev !== undefined &&
        next !== undefined &&
        current > prev &&
        current > next &&
        current > bestCorrelation
      ) {
        bestPeriod = lag;
        bestCorrelation = current;
      }
    }

    // Refine period using parabolic interpolation
    if (bestPeriod > 0 && bestPeriod < size - 1) {
      const prev = autocorrelation[bestPeriod - 1] ?? 0;
      const current = autocorrelation[bestPeriod] ?? 0;
      const next = autocorrelation[bestPeriod + 1] ?? 0;

      const denominator = prev - 2 * current + next;
      if (denominator !== 0) {
        const delta = 0.5 * ((prev - next) / denominator);
        return bestPeriod + delta;
      }
      return bestPeriod;
    }

    return bestPeriod;
  }

  /**
   * Convert frequency (Hz) to musical note information
   */
  private frequencyToNote(frequency: number): {
    note: string;
    midiNote: number;
    cents: number;
  } {
    // Convert frequency to MIDI note number (fractional)
    const midiNoteFloat = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NOTE;

    // Round to nearest semitone
    const midiNote = Math.round(midiNoteFloat);

    // Calculate cents deviation (-50 to +50)
    const cents = Math.round((midiNoteFloat - midiNote) * 100);

    // Convert MIDI note to note name + octave
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    const noteName = NOTE_NAMES[noteIndex];
    const note = `${noteName}${octave}`;

    return { note, midiNote, cents };
  }

  /**
   * Create an empty result when no pitch is detected
   */
  private createEmptyResult(): PitchDetectionResult {
    return {
      frequency: 0,
      note: null,
      midiNote: null,
      cents: 0,
      confidence: 0,
      inTune: false,
      clarity: 0,
    };
  }

  /**
   * Update configuration parameters
   */
  updateConfig(config: Partial<PitchDetectorConfig>): void {
    if (config.minFrequency !== undefined) {
      this.minFrequency = config.minFrequency;
    }
    if (config.maxFrequency !== undefined) {
      this.maxFrequency = config.maxFrequency;
    }
    if (config.confidenceThreshold !== undefined) {
      this.confidenceThreshold = config.confidenceThreshold;
    }
    if (config.inTuneTolerance !== undefined) {
      this.inTuneTolerance = config.inTuneTolerance;
    }
  }
}

/**
 * Utility: Convert MIDI note number to frequency (Hz)
 */
export function midiNoteToFrequency(midiNote: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI_NOTE) / 12);
}

/**
 * Utility: Convert frequency (Hz) to MIDI note number
 */
export function frequencyToMidiNote(frequency: number): number {
  return 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NOTE;
}

/**
 * Utility: Get note name from MIDI note number
 */
export function midiNoteToNoteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Utility: Parse note name to MIDI note number
 * @param noteName - Note name (e.g., "C4", "A#3", "Gb5")
 */
export function noteNameToMidiNote(noteName: string): number | null {
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

  const note = match[1];
  const octave = parseInt(match[2], 10);

  // Normalize flats to sharps
  const normalizedNote = note.replace('Db', 'C#')
    .replace('Eb', 'D#')
    .replace('Gb', 'F#')
    .replace('Ab', 'G#')
    .replace('Bb', 'A#');

  const noteIndex = NOTE_NAMES.indexOf(normalizedNote);
  if (noteIndex === -1) {
    return null;
  }

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Utility: Calculate cents difference between two frequencies
 */
export function centsBetweenFrequencies(freq1: number, freq2: number): number {
  return 1200 * Math.log2(freq2 / freq1);
}
