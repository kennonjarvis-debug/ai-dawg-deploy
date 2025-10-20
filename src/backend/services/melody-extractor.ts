/**
 * Melody Extractor Service
 *
 * Extracts melodic information from vocal audio (hums, mumbles, singing) and converts
 * to quantized MIDI notes for piano roll visualization.
 *
 * Features:
 * - YIN algorithm for robust pitch detection
 * - Autocorrelation fallback for pitch tracking
 * - Scale-aware quantization (snap to key)
 * - Rhythm quantization to musical grid
 * - Confidence scoring for uncertain notes
 * - Vibrato smoothing and noise filtering
 */

// ==================== TYPES ====================

export interface ExtractionOptions {
  /** Musical key for scale quantization (e.g., "C", "Dm", "G#") */
  key?: string;
  /** BPM for rhythm quantization */
  bpm: number;
  /** Quantization grid (e.g., "1/16", "1/8", "1/4") */
  grid?: string;
  /** Minimum note duration in seconds (filter shorter notes) */
  minNoteDuration?: number;
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Expected vocal range [minHz, maxHz] */
  pitchRange?: [number, number];
  /** Smoothing window for vibrato (frames) */
  smoothingWindow?: number;
}

export interface PitchTrackingOptions {
  /** Sample rate of audio */
  sampleRate: number;
  /** Hop size in samples (frames between analyses) */
  hopSize?: number;
  /** Expected pitch range [minHz, maxHz] */
  pitchRange?: [number, number];
  /** Confidence threshold for voiced detection */
  voicedThreshold?: number;
}

export interface PitchFrame {
  /** Time position in seconds */
  time: number;
  /** Detected frequency in Hz (0 if unvoiced) */
  frequency: number;
  /** Confidence score 0-1 */
  confidence: number;
  /** Is this a pitched sound? */
  voiced: boolean;
  /** Amplitude for velocity calculation */
  amplitude: number;
}

export interface PitchContour {
  /** All pitch frames */
  frames: PitchFrame[];
  /** Average frequency of voiced frames */
  avgFrequency: number;
  /** Pitch range detected */
  pitchRange: { min: number; max: number };
  /** Percentage of frames that are voiced */
  voicedPercentage: number;
}

export interface MIDINote {
  /** MIDI note number (60 = C4) */
  pitch: number;
  /** Start time in beats */
  start: number;
  /** Duration in beats */
  duration: number;
  /** Velocity 0-127 */
  velocity: number;
  /** Confidence score 0-1 */
  confidence: number;
}

export interface MelodyExtractionResult {
  /** Quantized MIDI notes */
  notes: MIDINote[];
  /** Extraction metadata */
  metadata: {
    pitchRange: { min: number; max: number };
    avgConfidence: number;
    totalNotes: number;
    voicedPercentage: number;
    processingTime: number;
    algorithm: string;
  };
}

// ==================== CONSTANTS ====================

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  key: 'C',
  bpm: 120,
  grid: '1/16',
  minNoteDuration: 0.1, // 100ms
  minConfidence: 0.5,
  pitchRange: [80, 800], // Typical vocal range (E2 to G5)
  smoothingWindow: 3,
};

const DEFAULT_PITCH_OPTIONS: Required<PitchTrackingOptions> = {
  sampleRate: 44100,
  hopSize: 512, // ~11.6ms at 44.1kHz
  pitchRange: [80, 800],
  voicedThreshold: 0.6,
};

// Musical scales (semitone offsets from root)
const SCALES: { [key: string]: number[] } = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// ==================== MELODY EXTRACTOR CLASS ====================

export class MelodyExtractor {
  private options: Required<ExtractionOptions>;

  constructor(options: Partial<ExtractionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Main entry point - extract melody from vocal audio
   */
  async extractMelody(
    vocalAudio: AudioBuffer,
    options: Partial<ExtractionOptions> = {}
  ): Promise<MelodyExtractionResult> {
    const startTime = performance.now();
    const opts = { ...this.options, ...options };

    // Step 1: Track pitch over time
    const pitchContour = await this.trackPitch(vocalAudio, {
      sampleRate: vocalAudio.sampleRate,
      pitchRange: opts.pitchRange,
    });

    // Step 2: Convert pitch contour to MIDI notes
    const rawNotes = await this.quantizeToMIDI(pitchContour, opts.key);

    // Step 3: Apply rhythm quantization
    const quantizedNotes = await this.quantizeRhythm(
      rawNotes,
      opts.bpm,
      opts.grid
    );

    // Step 4: Filter by duration and confidence
    const filteredNotes = quantizedNotes.filter(
      (note) =>
        note.duration >= (opts.minNoteDuration * opts.bpm) / 60 &&
        note.confidence >= opts.minConfidence
    );

    // Calculate metadata
    const avgConfidence =
      filteredNotes.reduce((sum, n) => sum + n.confidence, 0) /
        filteredNotes.length || 0;

    const processingTime = performance.now() - startTime;

    return {
      notes: filteredNotes,
      metadata: {
        pitchRange: pitchContour.pitchRange,
        avgConfidence,
        totalNotes: filteredNotes.length,
        voicedPercentage: pitchContour.voicedPercentage,
        processingTime,
        algorithm: 'YIN',
      },
    };
  }

  /**
   * Track pitch over time using YIN algorithm
   */
  async trackPitch(
    audio: AudioBuffer,
    options: Partial<PitchTrackingOptions> = {}
  ): Promise<PitchContour> {
    const opts = { ...DEFAULT_PITCH_OPTIONS, ...options };
    const samples = audio.getChannelData(0); // Mono
    const frames: PitchFrame[] = [];

    const hopSize = opts.hopSize;
    const bufferSize = 2048; // Window size for analysis
    const minPeriod = Math.floor(opts.sampleRate / opts.pitchRange[1]);
    const maxPeriod = Math.floor(opts.sampleRate / opts.pitchRange[0]);

    // Process audio in overlapping frames
    for (let i = 0; i < samples.length - bufferSize; i += hopSize) {
      const time = i / opts.sampleRate;
      const buffer = samples.slice(i, i + bufferSize);

      // Calculate amplitude (for velocity)
      const amplitude = this.calculateRMS(buffer);

      // YIN pitch detection
      const yinResult = this.yinPitchDetection(
        buffer,
        opts.sampleRate,
        minPeriod,
        maxPeriod,
        opts.voicedThreshold
      );

      frames.push({
        time,
        frequency: yinResult.frequency,
        confidence: yinResult.confidence,
        voiced: yinResult.voiced,
        amplitude,
      });
    }

    // Apply smoothing to reduce vibrato
    const smoothedFrames = this.smoothPitchContour(
      frames,
      this.options.smoothingWindow
    );

    // Calculate statistics
    const voicedFrames = smoothedFrames.filter((f) => f.voiced);
    const frequencies = voicedFrames.map((f) => f.frequency);

    const avgFrequency =
      frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length || 0;

    const pitchRange = {
      min: frequencies.length > 0 ? Math.min(...frequencies) : 0,
      max: frequencies.length > 0 ? Math.max(...frequencies) : 0,
    };

    const voicedPercentage = voicedFrames.length / smoothedFrames.length || 0;

    return {
      frames: smoothedFrames,
      avgFrequency,
      pitchRange,
      voicedPercentage,
    };
  }

  /**
   * YIN algorithm for pitch detection
   * Based on: "YIN, a fundamental frequency estimator for speech and music" (2002)
   */
  private yinPitchDetection(
    buffer: Float32Array,
    sampleRate: number,
    minPeriod: number,
    maxPeriod: number,
    threshold: number
  ): { frequency: number; confidence: number; voiced: boolean } {
    const yinBuffer = new Float32Array(maxPeriod);

    // Step 1: Calculate difference function
    for (let tau = 0; tau < maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < maxPeriod; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum;
    }

    // Step 3: Absolute threshold
    let tauEstimate = -1;
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      if (yinBuffer[tau] < threshold) {
        // Search for local minimum
        while (tau + 1 < maxPeriod && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    // No valid pitch found
    if (tauEstimate === -1) {
      return { frequency: 0, confidence: 0, voiced: false };
    }

    // Step 4: Parabolic interpolation for sub-sample accuracy
    let betterTau = tauEstimate;
    if (tauEstimate > 0 && tauEstimate < maxPeriod - 1) {
      const s0 = yinBuffer[tauEstimate - 1];
      const s1 = yinBuffer[tauEstimate];
      const s2 = yinBuffer[tauEstimate + 1];
      betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }

    const frequency = sampleRate / betterTau;
    const confidence = 1 - yinBuffer[tauEstimate];

    // Octave error correction: check if halved period is better
    const halfPeriodTau = Math.floor(betterTau / 2);
    if (
      halfPeriodTau >= minPeriod &&
      yinBuffer[halfPeriodTau] < yinBuffer[tauEstimate]
    ) {
      return {
        frequency: sampleRate / halfPeriodTau,
        confidence: 1 - yinBuffer[halfPeriodTau],
        voiced: true,
      };
    }

    return { frequency, confidence, voiced: confidence >= threshold };
  }

  /**
   * Convert pitch contour to MIDI notes with scale quantization
   */
  async quantizeToMIDI(
    pitchContour: PitchContour,
    key: string = 'C'
  ): Promise<MIDINote[]> {
    const notes: MIDINote[] = [];
    const frames = pitchContour.frames;

    // Parse key (e.g., "C", "Dm", "F#major")
    const { root, scale } = this.parseKey(key);

    let currentNote: Partial<MIDINote> | null = null;
    let noteStartFrame = 0;
    let noteFrames: PitchFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];

      if (frame.voiced && frame.frequency > 0) {
        // Convert frequency to MIDI note
        const midiPitch = this.frequencyToMIDI(frame.frequency);
        const quantizedPitch = this.quantizeToScale(midiPitch, root, scale);

        // Start new note or continue existing?
        if (
          currentNote === null ||
          Math.abs(quantizedPitch - currentNote.pitch!) > 0.5
        ) {
          // Finish previous note
          if (currentNote !== null) {
            notes.push(this.finalizeNote(currentNote, noteFrames));
          }

          // Start new note
          currentNote = {
            pitch: quantizedPitch,
            start: frame.time,
            velocity: Math.round(frame.amplitude * 127),
            confidence: frame.confidence,
          };
          noteStartFrame = i;
          noteFrames = [frame];
        } else {
          // Continue current note
          noteFrames.push(frame);
        }
      } else {
        // Unvoiced frame - end current note
        if (currentNote !== null) {
          notes.push(this.finalizeNote(currentNote, noteFrames));
          currentNote = null;
          noteFrames = [];
        }
      }
    }

    // Finish last note
    if (currentNote !== null) {
      notes.push(this.finalizeNote(currentNote, noteFrames));
    }

    return notes;
  }

  /**
   * Apply rhythm quantization to snap notes to musical grid
   */
  async quantizeRhythm(
    notes: MIDINote[],
    bpm: number,
    grid: string = '1/16'
  ): Promise<MIDINote[]> {
    const beatsPerSecond = bpm / 60;
    const gridSize = this.parseGridSize(grid);

    return notes.map((note) => {
      // Convert seconds to beats
      const startBeats = note.start * beatsPerSecond;
      const endBeats = (note.start + note.duration) * beatsPerSecond;

      // Quantize to grid
      const quantizedStart = Math.round(startBeats / gridSize) * gridSize;
      const quantizedEnd = Math.round(endBeats / gridSize) * gridSize;
      const quantizedDuration = Math.max(gridSize, quantizedEnd - quantizedStart);

      return {
        ...note,
        start: quantizedStart,
        duration: quantizedDuration,
      };
    });
  }

  /**
   * Calculate confidence for each note based on pitch data
   */
  calculateNoteConfidence(pitchData: PitchFrame[]): number {
    if (pitchData.length === 0) return 0;

    // Average confidence weighted by amplitude
    const totalAmplitude = pitchData.reduce((sum, f) => sum + f.amplitude, 0);
    const weightedConfidence = pitchData.reduce(
      (sum, f) => sum + f.confidence * f.amplitude,
      0
    );

    if (totalAmplitude === 0) return 0;

    const avgConfidence = weightedConfidence / totalAmplitude;

    // Penalize notes with high frequency variance (vibrato/instability)
    const frequencies = pitchData.map((f) => f.frequency);
    const avgFreq =
      frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
    const variance =
      frequencies.reduce((sum, f) => sum + Math.pow(f - avgFreq, 2), 0) /
      frequencies.length;
    const stdDev = Math.sqrt(variance);
    const stabilityFactor = Math.max(0, 1 - stdDev / avgFreq);

    return avgConfidence * (0.7 + 0.3 * stabilityFactor);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate RMS (root mean square) for amplitude
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Smooth pitch contour to reduce vibrato and jitter
   */
  private smoothPitchContour(
    frames: PitchFrame[],
    windowSize: number
  ): PitchFrame[] {
    const smoothed: PitchFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(frames.length, i + Math.ceil(windowSize / 2));
      const window = frames.slice(start, end).filter((f) => f.voiced);

      if (window.length === 0) {
        smoothed.push(frames[i]);
        continue;
      }

      // Median frequency (robust to outliers)
      const frequencies = window.map((f) => f.frequency).sort((a, b) => a - b);
      const medianFreq = frequencies[Math.floor(frequencies.length / 2)];

      // Average confidence and amplitude
      const avgConfidence =
        window.reduce((sum, f) => sum + f.confidence, 0) / window.length;
      const avgAmplitude =
        window.reduce((sum, f) => sum + f.amplitude, 0) / window.length;

      smoothed.push({
        ...frames[i],
        frequency: frames[i].voiced ? medianFreq : 0,
        confidence: avgConfidence,
        amplitude: avgAmplitude,
      });
    }

    return smoothed;
  }

  /**
   * Convert frequency (Hz) to MIDI note number
   */
  private frequencyToMIDI(frequency: number): number {
    // MIDI note 69 = A4 = 440 Hz
    // Formula: n = 69 + 12 * log2(f / 440)
    return 69 + 12 * Math.log2(frequency / 440);
  }

  /**
   * Convert MIDI note number to frequency (Hz)
   */
  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Parse musical key (e.g., "C", "Dm", "F#major")
   */
  private parseKey(key: string): { root: number; scale: number[] } {
    const noteMap: { [key: string]: number } = {
      C: 0,
      'C#': 1,
      Db: 1,
      D: 2,
      'D#': 3,
      Eb: 3,
      E: 4,
      F: 5,
      'F#': 6,
      Gb: 6,
      G: 7,
      'G#': 8,
      Ab: 8,
      A: 9,
      'A#': 10,
      Bb: 10,
      B: 11,
    };

    // Extract root note
    const match = key.match(/^([A-G][#b]?)(m|min|minor|maj|major)?$/i);
    if (!match) {
      console.warn(`Invalid key "${key}", defaulting to C major`);
      return { root: 0, scale: SCALES.major };
    }

    const rootNote = match[1];
    const scaleType = match[2] || 'major';

    const root = noteMap[rootNote] || 0;
    let scale = SCALES.major;

    if (scaleType.match(/^m(in(or)?)?$/i)) {
      scale = SCALES.minor;
    } else if (scaleType.match(/^maj(or)?$/i)) {
      scale = SCALES.major;
    }

    return { root, scale };
  }

  /**
   * Quantize MIDI pitch to nearest scale degree
   */
  private quantizeToScale(
    midiPitch: number,
    root: number,
    scale: number[]
  ): number {
    const roundedPitch = Math.round(midiPitch);
    const octave = Math.floor(roundedPitch / 12);
    const pitchClass = roundedPitch % 12;

    // Find nearest scale degree
    let minDistance = Infinity;
    let bestScaleDegree = 0;

    for (const degree of scale) {
      const scalePitch = (root + degree) % 12;
      const distance = Math.abs(pitchClass - scalePitch);

      if (distance < minDistance) {
        minDistance = distance;
        bestScaleDegree = scalePitch;
      }
    }

    return octave * 12 + bestScaleDegree;
  }

  /**
   * Parse grid size (e.g., "1/16" -> 0.25 beats)
   */
  private parseGridSize(grid: string): number {
    const match = grid.match(/^1\/(\d+)$/);
    if (!match) {
      console.warn(`Invalid grid "${grid}", defaulting to 1/16`);
      return 0.25;
    }

    const divisions = parseInt(match[1], 10);
    return 4 / divisions; // 4 beats per whole note
  }

  /**
   * Finalize note with duration and confidence
   */
  private finalizeNote(
    note: Partial<MIDINote>,
    frames: PitchFrame[]
  ): MIDINote {
    const endTime = frames[frames.length - 1].time;
    const duration = endTime - note.start!;
    const confidence = this.calculateNoteConfidence(frames);

    // Average velocity weighted by amplitude
    const totalAmplitude = frames.reduce((sum, f) => sum + f.amplitude, 0);
    const weightedVelocity = frames.reduce(
      (sum, f) => sum + f.amplitude * Math.round(f.amplitude * 127),
      0
    );
    const avgVelocity =
      totalAmplitude > 0
        ? Math.round(weightedVelocity / totalAmplitude)
        : note.velocity || 64;

    return {
      pitch: note.pitch!,
      start: note.start!,
      duration,
      velocity: Math.max(1, Math.min(127, avgVelocity)),
      confidence,
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create AudioBuffer from Float32Array samples
 */
export function createAudioBuffer(
  samples: Float32Array,
  sampleRate: number = 44100
): AudioBuffer {
  const audioContext = new (globalThis.AudioContext ||
    (globalThis as any).webkitAudioContext)();
  const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

/**
 * Load audio file and return AudioBuffer
 */
export async function loadAudioFile(filePath: string): Promise<AudioBuffer> {
  const audioContext = new (globalThis.AudioContext ||
    (globalThis as any).webkitAudioContext)();

  // For Node.js environment
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const audioData = fs.readFileSync(filePath);
    return audioContext.decodeAudioData(audioData.buffer);
  }

  // For browser environment
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Format MIDI note number as note name (e.g., 60 -> "C4")
 */
export function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}

// ==================== EXAMPLE USAGE ====================

/**
 * Example: Extract melody from audio buffer
 */
export async function exampleUsage() {
  // Create extractor with options
  const extractor = new MelodyExtractor({
    key: 'C',
    bpm: 120,
    grid: '1/16',
    minNoteDuration: 0.1,
    minConfidence: 0.6,
  });

  // Generate test audio: sine wave sweep from C4 to C5
  const sampleRate = 44100;
  const duration = 4; // seconds
  const samples = new Float32Array(sampleRate * duration);

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    const freq = 261.63 + (t / duration) * 261.63; // C4 to C5
    samples[i] = 0.5 * Math.sin(2 * Math.PI * freq * t);
  }

  const audioBuffer = createAudioBuffer(samples, sampleRate);

  // Extract melody
  const result = await extractor.extractMelody(audioBuffer, {
    key: 'C',
    bpm: 120,
  });

  console.log('Melody Extraction Results:');
  console.log(`Total notes: ${result.notes.length}`);
  console.log(`Average confidence: ${result.metadata.avgConfidence.toFixed(2)}`);
  console.log(
    `Pitch range: ${result.metadata.pitchRange.min.toFixed(1)} - ${result.metadata.pitchRange.max.toFixed(1)} Hz`
  );
  console.log(`Processing time: ${result.metadata.processingTime.toFixed(2)}ms`);
  console.log('\nFirst 5 notes:');

  result.notes.slice(0, 5).forEach((note, i) => {
    const noteName = midiToNoteName(note.pitch);
    console.log(
      `${i + 1}. ${noteName} (MIDI ${note.pitch}) - ` +
        `Start: ${note.start.toFixed(2)}b, Duration: ${note.duration.toFixed(2)}b, ` +
        `Velocity: ${note.velocity}, Confidence: ${note.confidence.toFixed(2)}`
    );
  });

  return result;
}

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).MelodyExtractor = MelodyExtractor;
  (window as any).exampleUsage = exampleUsage;
}
