/**
 * Melody Analysis Types
 * Data structures for vocal → MIDI → composition workflow
 */

export interface MIDINote {
  note: number;                // MIDI note number (0-127)
  noteName: string;            // Note name (e.g., "C4", "A#3")
  startTime: number;           // Start time in seconds
  duration: number;            // Duration in seconds
  velocity: number;            // Velocity/loudness (0-127)
  frequency: number;           // Original frequency in Hz
  confidence: number;          // Detection confidence (0-1)
}

export interface MelodyAnalysis {
  notes: MIDINote[];
  tempo: number;               // Detected BPM
  key: string;                 // Detected key (e.g., "C major", "A minor")
  scale: string;               // Scale type (major, minor, pentatonic, etc.)
  duration: number;            // Total duration in seconds
  averagePitch: number;        // Average MIDI note
  pitchRange: {                // Vocal range
    min: number;
    max: number;
  };
  confidence: number;          // Overall analysis confidence (0-1)
  metadata?: {
    originalRecordingId: string;
    sampleRate: number;
    channels: number;
  };
}

export interface VocalCharacteristics {
  averageFrequency: number;    // Average fundamental frequency (Hz)
  pitchStability: number;      // How stable pitch is (0-1, 1 = perfect)
  vibratoRate?: number;        // Vibrato frequency (Hz)
  vibratoDepth?: number;       // Vibrato depth (cents)
  dynamicRange: number;        // Volume variation (dB)
  timbre?: string;             // Timbre description (future: from ML analysis)
}

export interface CompositionParams {
  melody: MelodyAnalysis;
  style: {
    genre: string;             // "country", "pop", "rock", etc.
    mood: string;              // "upbeat", "melancholic", "energetic"
    instruments: string[];     // ["acoustic guitar", "piano", "strings"]
    arrangement?: string;      // "sparse", "full band", "orchestral"
  };
  structure?: {
    intro?: boolean;
    verse?: boolean;
    chorus?: boolean;
    bridge?: boolean;
    outro?: boolean;
  };
  preferences?: {
    complexity: 'simple' | 'moderate' | 'complex';
    harmonies: boolean;
    bassline: boolean;
    drums: boolean;
  };
}

export interface CompositionResult {
  audioUrl: string;            // Generated audio file URL
  metadata: {
    prompt: string;            // Generated prompt used
    model: string;             // AI model used
    duration: number;          // Duration in seconds
    cost: number;              // Generation cost in USD
  };
  melody: MelodyAnalysis;      // Original melody data
  generatedAt: Date;
}

/**
 * Convert pitch detection results to MIDI notes
 * Integrates with Instance 2's pitch detection output
 */
export function pitchDataToMIDI(pitchData: Array<{
  frequency: number;
  note: string;
  midiNote: number;
  cents: number;
  confidence: number;
  timestamp: number;
}>): MIDINote[] {
  if (pitchData.length === 0) return [];

  const notes: MIDINote[] = [];
  let currentNote: MIDINote | null = null;

  for (const data of pitchData) {
    // Skip low-confidence detections
    if (data.confidence < 0.5) continue;

    // If new note or significant pitch change, start new note
    if (!currentNote || currentNote.note !== data.midiNote) {
      // Finish previous note
      if (currentNote) {
        notes.push(currentNote);
      }

      // Start new note
      currentNote = {
        note: data.midiNote,
        noteName: data.note,
        startTime: data.timestamp,
        duration: 0,
        velocity: 80, // Default velocity (will be refined with volume analysis)
        frequency: data.frequency,
        confidence: data.confidence,
      };
    } else {
      // Continue current note
      currentNote.duration = data.timestamp - currentNote.startTime;
      currentNote.confidence = Math.max(currentNote.confidence, data.confidence);
    }
  }

  // Add final note
  if (currentNote) {
    notes.push(currentNote);
  }

  // Filter out very short notes (likely detection errors)
  return notes.filter(note => note.duration > 0.1); // Min 100ms
}

/**
 * Analyze melody to extract musical characteristics
 */
export function analyzeMelody(notes: MIDINote[]): Partial<MelodyAnalysis> {
  if (notes.length === 0) {
    return {
      notes: [],
      tempo: 120,
      key: 'C major',
      scale: 'major',
      duration: 0,
      averagePitch: 0,
      pitchRange: { min: 0, max: 0 },
      confidence: 0,
    };
  }

  // Calculate duration
  const lastNote = notes[notes.length - 1];
  const duration = (lastNote?.startTime ?? 0) + (lastNote?.duration ?? 0);

  // Calculate pitch statistics
  const midiNotes = notes.map(n => n.note);
  const averagePitch = midiNotes.reduce((sum, n) => sum + n, 0) / midiNotes.length;
  const pitchRange = {
    min: Math.min(...midiNotes),
    max: Math.max(...midiNotes),
  };

  // Estimate tempo from note durations
  const avgNoteDuration = notes.reduce((sum, n) => sum + n.duration, 0) / notes.length;
  const estimatedTempo = Math.round(60 / (avgNoteDuration * 4)); // Assume quarter notes

  // Calculate overall confidence
  const avgConfidence = notes.reduce((sum, n) => sum + n.confidence, 0) / notes.length;

  // Detect key (simplified - uses most common notes)
  const key = detectKey(midiNotes);

  return {
    notes,
    tempo: Math.max(60, Math.min(200, estimatedTempo)), // Clamp to reasonable range
    key,
    scale: key.includes('minor') ? 'minor' : 'major',
    duration,
    averagePitch,
    pitchRange,
    confidence: avgConfidence,
  };
}

/**
 * Detect musical key from MIDI notes (simplified algorithm)
 */
function detectKey(midiNotes: number[]): string {
  // Count note occurrences (mod 12 for pitch class)
  const pitchClasses = midiNotes.map(n => n % 12);
  const counts = Array(12).fill(0);
  pitchClasses.forEach(pc => counts[pc]++);

  // Find most common pitch class
  const tonic = counts.indexOf(Math.max(...counts));

  // Map to note names
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const tonicName = noteNames[tonic];

  // Simple major/minor detection (check for presence of 3rd)
  const majorThird = (tonic + 4) % 12;
  const minorThird = (tonic + 3) % 12;

  const isMajor = counts[majorThird] > counts[minorThird];

  return `${tonicName} ${isMajor ? 'major' : 'minor'}`;
}

/**
 * Generate composition prompt from melody analysis
 */
export function melodyToPrompt(
  melody: MelodyAnalysis,
  style: CompositionParams['style']
): string {
  const { genre, mood, instruments, arrangement } = style;

  const parts: string[] = [];

  // Genre and mood
  parts.push(`${mood} ${genre} instrumental`);

  // Instruments
  if (instruments.length > 0) {
    parts.push(`featuring ${instruments.join(', ')}`);
  }

  // Musical characteristics
  parts.push(`in ${melody.key}`);
  parts.push(`${melody.tempo} BPM`);

  // Arrangement
  if (arrangement) {
    parts.push(`${arrangement} arrangement`);
  }

  return parts.join(', ');
}

/**
 * Export melody to MIDI file (future enhancement)
 * Returns MIDI file as Blob
 */
export function exportToMIDI(_melody: MelodyAnalysis): Blob {
  // TODO: Implement MIDI file export using tonejs/midi or similar
  // For now, return empty blob
  throw new Error('MIDI export not yet implemented');
}
