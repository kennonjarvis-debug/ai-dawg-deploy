/**
 * MIDI Piano Roll Types and Interfaces
 */

export interface MIDINote {
  id: string;
  pitch: number; // MIDI note number 0-127
  velocity: number; // 0-127
  startTime: number; // in beats
  duration: number; // in beats
  channel: number; // 0-15
}

export interface MIDITrack {
  id: string;
  name: string;
  notes: MIDINote[];
  channel: number;
  instrument: string;
  volume: number; // 0-1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  color: string;
}

export interface MIDIProject {
  id: string;
  name: string;
  tempo: number; // BPM
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  tracks: MIDITrack[];
  duration: number; // in beats
  createdAt: Date;
  updatedAt: Date;
}

export interface PianoRollViewport {
  scrollX: number; // horizontal scroll position in pixels
  scrollY: number; // vertical scroll position in pixels
  zoomX: number; // horizontal zoom factor (pixels per beat)
  zoomY: number; // vertical zoom factor (pixels per note)
  width: number; // viewport width in pixels
  height: number; // viewport height in pixels
}

export interface PianoRollSelection {
  noteIds: string[];
  startBeat: number;
  endBeat: number;
  startPitch: number;
  endPitch: number;
}

export interface PianoRollTool {
  type: 'select' | 'draw' | 'erase' | 'cut';
  cursor: string;
}

export interface QuantizeSettings {
  enabled: boolean;
  division: number; // 1, 2, 4, 8, 16, 32 (note divisions)
  strength: number; // 0-1, how much to quantize
  swing: number; // 0-1, swing amount
}

export interface TransportControls {
  isPlaying: boolean;
  isRecording: boolean;
  currentBeat: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  metronomeEnabled: boolean;
}

export interface PianoRollState {
  project: MIDIProject | null;
  currentTrackId: string | null;
  viewport: PianoRollViewport;
  selection: PianoRollSelection;
  tool: PianoRollTool;
  quantize: QuantizeSettings;
  transport: TransportControls;
  clipboard: MIDINote[];
  history: {
    past: MIDINote[][];
    future: MIDINote[][];
  };
}

export interface PianoKeyInfo {
  noteNumber: number;
  noteName: string;
  octave: number;
  isBlackKey: boolean;
  y: number; // position in pixels
}

export interface GridLine {
  type: 'beat' | 'measure' | 'subdivision';
  position: number; // in beats
  x: number; // position in pixels
}

// MIDI File Format Types
export interface MIDIFileHeader {
  format: 0 | 1 | 2; // Single track, multi-track, multi-song
  numTracks: number;
  ticksPerBeat: number;
}

export interface MIDIEvent {
  deltaTime: number;
  type: 'note' | 'controller' | 'programChange' | 'meta';
  data: any;
}

export interface MIDIFileTrack {
  events: MIDIEvent[];
}

export interface MIDIFile {
  header: MIDIFileHeader;
  tracks: MIDIFileTrack[];
}

// Velocity Color Mapping
export const VELOCITY_COLORS = {
  veryLow: '#4a5568',    // 0-31
  low: '#718096',        // 32-63
  medium: '#38b2ac',     // 64-95
  high: '#4299e1',       // 96-111
  veryHigh: '#9f7aea',   // 112-127
} as const;

export function getVelocityColor(velocity: number): string {
  if (velocity <= 31) return VELOCITY_COLORS.veryLow;
  if (velocity <= 63) return VELOCITY_COLORS.low;
  if (velocity <= 95) return VELOCITY_COLORS.medium;
  if (velocity <= 111) return VELOCITY_COLORS.high;
  return VELOCITY_COLORS.veryHigh;
}

// Piano Key Constants
export const MIDI_NOTE_MIN = 0;
export const MIDI_NOTE_MAX = 127;
export const PIANO_ROLL_MIN_NOTE = 21; // A0
export const PIANO_ROLL_MAX_NOTE = 108; // C8
export const PIANO_KEYS_COUNT = PIANO_ROLL_MAX_NOTE - PIANO_ROLL_MIN_NOTE + 1;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

export function getMIDINoteName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const note = NOTE_NAMES[noteNumber % 12];
  return `${note}${octave}`;
}

export function isBlackKey(noteNumber: number): boolean {
  return BLACK_KEYS.includes(noteNumber % 12);
}

// Quantize Helpers
export function quantizeTime(time: number, division: number, strength: number = 1): number {
  const beatDivision = 1 / division;
  const quantizedTime = Math.round(time / beatDivision) * beatDivision;
  return time + (quantizedTime - time) * strength;
}

export function applySwing(time: number, division: number, swing: number): number {
  const beatDivision = 1 / division;
  const position = Math.floor(time / beatDivision);

  // Apply swing to off-beats
  if (position % 2 === 1) {
    const swingAmount = beatDivision * swing * 0.5;
    return time + swingAmount;
  }

  return time;
}

// Humanize Helper
export function humanizeNote(note: MIDINote, amount: number = 0.1): MIDINote {
  const timeVariation = (Math.random() - 0.5) * amount * 0.1; // +/- timing
  const velocityVariation = Math.floor((Math.random() - 0.5) * amount * 20); // +/- velocity

  return {
    ...note,
    startTime: Math.max(0, note.startTime + timeVariation),
    velocity: Math.max(1, Math.min(127, note.velocity + velocityVariation)),
  };
}

// Default Instruments
export const MIDI_INSTRUMENTS = [
  { id: 'piano', name: 'Acoustic Grand Piano', program: 0 },
  { id: 'epiano', name: 'Electric Piano', program: 4 },
  { id: 'organ', name: 'Organ', program: 16 },
  { id: 'guitar', name: 'Acoustic Guitar', program: 24 },
  { id: 'eguitar', name: 'Electric Guitar', program: 27 },
  { id: 'bass', name: 'Acoustic Bass', program: 32 },
  { id: 'ebass', name: 'Electric Bass', program: 33 },
  { id: 'strings', name: 'String Ensemble', program: 48 },
  { id: 'brass', name: 'Brass Section', program: 61 },
  { id: 'sax', name: 'Saxophone', program: 64 },
  { id: 'synth-lead', name: 'Synth Lead', program: 80 },
  { id: 'synth-pad', name: 'Synth Pad', program: 88 },
  { id: 'drums', name: 'Drums', program: 128 }, // Channel 10
];

export function getInstrumentByProgram(program: number) {
  return MIDI_INSTRUMENTS.find(i => i.program === program) || MIDI_INSTRUMENTS[0];
}
