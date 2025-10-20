import * as Tone from "tone";
import { l as logger } from "./logger.js";
import { w as writable } from "./index.js";
import { e as eventBus } from "./eventBus.js";
var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
  ErrorCode2["NOT_INITIALIZED"] = "NOT_INITIALIZED";
  ErrorCode2["ALREADY_INITIALIZED"] = "ALREADY_INITIALIZED";
  ErrorCode2["AUDIO_CONTEXT_ERROR"] = "AUDIO_CONTEXT_ERROR";
  ErrorCode2["AUDIO_CONTEXT_SUSPENDED"] = "AUDIO_CONTEXT_SUSPENDED";
  ErrorCode2["AUDIO_CONTEXT_CLOSED"] = "AUDIO_CONTEXT_CLOSED";
  ErrorCode2["TRACK_NOT_FOUND"] = "TRACK_NOT_FOUND";
  ErrorCode2["TRACK_ALREADY_EXISTS"] = "TRACK_ALREADY_EXISTS";
  ErrorCode2["INVALID_TRACK_TYPE"] = "INVALID_TRACK_TYPE";
  ErrorCode2["CLIP_NOT_FOUND"] = "CLIP_NOT_FOUND";
  ErrorCode2["INVALID_CLIP_DATA"] = "INVALID_CLIP_DATA";
  ErrorCode2["EFFECT_NOT_FOUND"] = "EFFECT_NOT_FOUND";
  ErrorCode2["INVALID_EFFECT_TYPE"] = "INVALID_EFFECT_TYPE";
  ErrorCode2["RECORDING_NOT_STARTED"] = "RECORDING_NOT_STARTED";
  ErrorCode2["RECORDING_ALREADY_STARTED"] = "RECORDING_ALREADY_STARTED";
  ErrorCode2["MICROPHONE_ACCESS_DENIED"] = "MICROPHONE_ACCESS_DENIED";
  ErrorCode2["INVALID_PARAMETER"] = "INVALID_PARAMETER";
  ErrorCode2["PARAMETER_OUT_OF_RANGE"] = "PARAMETER_OUT_OF_RANGE";
  ErrorCode2["BUFFER_DECODE_ERROR"] = "BUFFER_DECODE_ERROR";
  ErrorCode2["BUFFER_NOT_FOUND"] = "BUFFER_NOT_FOUND";
  ErrorCode2["NETWORK_ERROR"] = "NETWORK_ERROR";
  ErrorCode2["FILE_LOAD_ERROR"] = "FILE_LOAD_ERROR";
  ErrorCode2["EXPORT_ERROR"] = "EXPORT_ERROR";
  ErrorCode2["UNSUPPORTED_FORMAT"] = "UNSUPPORTED_FORMAT";
  ErrorCode2["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
  ErrorCode2["OPERATION_FAILED"] = "OPERATION_FAILED";
  return ErrorCode2;
})(ErrorCode || {});
class AudioEngineError extends Error {
  code;
  timestamp;
  constructor(message, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "AudioEngineError";
    this.code = code;
    this.timestamp = Date.now();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AudioEngineError);
    }
  }
  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}
class TrackError extends AudioEngineError {
  trackId;
  constructor(message, code, trackId) {
    super(message, code);
    this.name = "TrackError";
    this.trackId = trackId;
  }
}
class EffectError extends AudioEngineError {
  effectId;
  constructor(message, code, effectId) {
    super(message, code);
    this.name = "EffectError";
    this.effectId = effectId;
  }
}
class RecordingError extends AudioEngineError {
  constructor(message, code) {
    super(message, code);
    this.name = "RecordingError";
  }
}
class Clip {
  id;
  trackId;
  buffer;
  startTime;
  duration;
  offset;
  gain;
  fadeIn;
  fadeOut;
  name;
  // Internal state
  _isLooped = false;
  _playbackRate = 1;
  constructor(config) {
    if (!config.buffer) {
      throw new AudioEngineError("Clip requires an audio buffer", ErrorCode.INVALID_CLIP_DATA);
    }
    if (config.startTime < 0) {
      throw new AudioEngineError("Clip start time cannot be negative", ErrorCode.INVALID_PARAMETER);
    }
    this.id = config.id || this.generateId();
    this.trackId = config.trackId;
    this.buffer = config.buffer;
    this.startTime = config.startTime;
    this.duration = config.duration ?? config.buffer.duration;
    this.offset = config.offset ?? 0;
    this.gain = config.gain ?? 1;
    this.fadeIn = config.fadeIn ?? 0;
    this.fadeOut = config.fadeOut ?? 0;
    this.name = config.name ?? `Clip ${this.id.slice(0, 8)}`;
    if (this.duration <= 0) {
      throw new AudioEngineError("Clip duration must be positive", ErrorCode.INVALID_PARAMETER);
    }
    if (this.offset + this.duration > this.buffer.duration) {
      throw new AudioEngineError(
        "Clip duration + offset exceeds buffer length",
        ErrorCode.INVALID_PARAMETER
      );
    }
  }
  /**
   * Get the end time of the clip
   */
  get endTime() {
    return this.startTime + this.duration;
  }
  /**
   * Check if clip is looped
   */
  get isLooped() {
    return this._isLooped;
  }
  /**
   * Set loop status
   */
  set isLooped(value) {
    this._isLooped = value;
  }
  /**
   * Get playback rate
   */
  get playbackRate() {
    return this._playbackRate;
  }
  /**
   * Set playback rate (0.5 = half speed, 2.0 = double speed)
   */
  set playbackRate(rate) {
    if (rate <= 0) {
      throw new AudioEngineError("Playback rate must be positive", ErrorCode.INVALID_PARAMETER);
    }
    this._playbackRate = rate;
  }
  /**
   * Check if a time point is within this clip
   * @param time - Time in seconds
   * @returns True if time is within clip bounds
   */
  contains(time) {
    return time >= this.startTime && time < this.endTime;
  }
  /**
   * Check if this clip overlaps with another clip
   * @param other - Other clip to check
   * @returns True if clips overlap
   */
  overlaps(other) {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
  /**
   * Move the clip to a new start time
   * @param time - New start time in seconds
   */
  moveTo(time) {
    if (time < 0) {
      throw new AudioEngineError("Cannot move clip to negative time", ErrorCode.INVALID_PARAMETER);
    }
    this.startTime = time;
  }
  /**
   * Trim the clip from the start
   * @param amount - Amount to trim in seconds
   */
  trimStart(amount) {
    if (amount < 0) {
      throw new AudioEngineError("Trim amount cannot be negative", ErrorCode.INVALID_PARAMETER);
    }
    const newDuration = this.duration - amount;
    if (newDuration <= 0) {
      throw new AudioEngineError("Trim would result in zero or negative duration", ErrorCode.INVALID_PARAMETER);
    }
    this.offset += amount;
    this.duration = newDuration;
    this.startTime += amount;
  }
  /**
   * Trim the clip from the end
   * @param amount - Amount to trim in seconds
   */
  trimEnd(amount) {
    if (amount < 0) {
      throw new AudioEngineError("Trim amount cannot be negative", ErrorCode.INVALID_PARAMETER);
    }
    const newDuration = this.duration - amount;
    if (newDuration <= 0) {
      throw new AudioEngineError("Trim would result in zero or negative duration", ErrorCode.INVALID_PARAMETER);
    }
    this.duration = newDuration;
  }
  /**
   * Split the clip at a given time
   * @param time - Time to split at (relative to timeline)
   * @returns New clip representing the second half, or null if split is invalid
   */
  split(time) {
    if (!this.contains(time)) {
      return null;
    }
    const splitOffset = time - this.startTime;
    const firstDuration = splitOffset;
    const secondDuration = this.duration - splitOffset;
    this.duration = firstDuration;
    const secondClip = new Clip({
      trackId: this.trackId,
      buffer: this.buffer,
      startTime: time,
      duration: secondDuration,
      offset: this.offset + splitOffset,
      gain: this.gain,
      fadeIn: 0,
      fadeOut: this.fadeOut
    });
    this.fadeOut = 0;
    return secondClip;
  }
  /**
   * Clone the clip
   * @returns New clip with same properties but different ID
   */
  clone() {
    return new Clip({
      trackId: this.trackId,
      buffer: this.buffer,
      startTime: this.startTime,
      duration: this.duration,
      offset: this.offset,
      gain: this.gain,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      name: `${this.name} (copy)`
    });
  }
  /**
   * Serialize clip to JSON
   */
  toJSON() {
    return {
      id: this.id,
      trackId: this.trackId,
      startTime: this.startTime,
      duration: this.duration,
      offset: this.offset,
      gain: this.gain,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      name: this.name,
      isLooped: this._isLooped,
      playbackRate: this._playbackRate,
      bufferDuration: this.buffer.duration,
      bufferChannels: this.buffer.numberOfChannels,
      bufferSampleRate: this.buffer.sampleRate
    };
  }
  /**
   * Generate a unique ID
   */
  generateId() {
    return `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
function gridToSeconds(grid, bpm = 120) {
  const quarterNoteDuration = 60 / bpm;
  switch (grid) {
    case "1/1":
      return quarterNoteDuration * 4;
    case "1/2":
      return quarterNoteDuration * 2;
    case "1/4":
      return quarterNoteDuration;
    case "1/8":
      return quarterNoteDuration / 2;
    case "1/16":
      return quarterNoteDuration / 4;
    case "1/32":
      return quarterNoteDuration / 8;
    case "1/64":
      return quarterNoteDuration / 16;
    case "1/4T":
      return quarterNoteDuration * 2 / 3;
    case "1/8T":
      return quarterNoteDuration / 3;
    case "1/16T":
      return quarterNoteDuration / 6;
    default:
      return quarterNoteDuration;
  }
}
function quantizeTime(time, gridSize, strength = 1, swing = 0) {
  const gridIndex = Math.round(time / gridSize);
  let targetTime = gridIndex * gridSize;
  if (swing > 0 && gridIndex % 2 === 1) {
    targetTime += gridSize * swing * 0.5;
  }
  const quantizedTime = time + (targetTime - time) * strength;
  return Math.max(0, quantizedTime);
}
function quantizeNotes(notes, options, bpm = 120) {
  const gridSize = gridToSeconds(options.grid, bpm);
  const strength = options.strength ?? 1;
  const swing = options.swing ?? 0;
  return notes.map((note) => {
    const quantizedNote = { ...note };
    if (options.quantizeNoteStarts !== false) {
      const originalStart = note.time;
      const quantizedStart = quantizeTime(originalStart, gridSize, strength, swing);
      quantizedNote.time = quantizedStart;
      if (options.quantizeNoteEnds) {
        const originalEnd = originalStart + note.duration;
        const quantizedEnd = quantizeTime(originalEnd, gridSize, strength, swing);
        quantizedNote.duration = Math.max(0.01, quantizedEnd - quantizedStart);
      } else {
        const originalEnd = originalStart + note.duration;
        quantizedNote.duration = Math.max(0.01, originalEnd - quantizedStart);
      }
    } else if (options.quantizeNoteEnds) {
      const originalEnd = note.time + note.duration;
      const quantizedEnd = quantizeTime(originalEnd, gridSize, strength, swing);
      quantizedNote.duration = Math.max(0.01, quantizedEnd - note.time);
    }
    return quantizedNote;
  });
}
function humanizeNotes(notes, amount = 0.5) {
  return notes.map((note) => {
    const timingOffset = (Math.random() - 0.5) * 0.01 * amount;
    const velocityOffset = Math.round((Math.random() - 0.5) * 20 * amount);
    return {
      ...note,
      time: Math.max(0, note.time + timingOffset),
      velocity: Math.max(1, Math.min(127, note.velocity + velocityOffset))
    };
  });
}
function makeNotesLegato(notes, gap = 1e-3) {
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.pitch - b.pitch;
  });
  return sortedNotes.map((note, index) => {
    const nextNote = sortedNotes.slice(index + 1).find((n) => n.pitch === note.pitch && n.time > note.time);
    if (nextNote) {
      const newDuration = nextNote.time - note.time - gap;
      if (newDuration > 0) {
        return { ...note, duration: newDuration };
      }
    }
    return note;
  });
}
function makeNotesStaccato(notes, factor = 0.5, minDuration = 0.05) {
  return notes.map((note) => ({
    ...note,
    duration: Math.max(minDuration, note.duration * factor)
  }));
}
class MIDIClip {
  id;
  trackId;
  name;
  startTime;
  duration;
  notes = [];
  controlChanges = [];
  pitchBends = [];
  programChanges = [];
  // Selection state (for editing)
  selectedNoteIds = /* @__PURE__ */ new Set();
  constructor(config) {
    this.id = config.id || this.generateId();
    this.trackId = config.trackId;
    this.name = config.name || `MIDI Clip ${this.id.slice(0, 8)}`;
    this.startTime = config.startTime;
    if (config.duration) {
      this.duration = config.duration;
    } else if (config.notes && config.notes.length > 0) {
      this.duration = this.calculateDuration(config.notes);
    } else {
      this.duration = 4;
    }
    if (config.notes) {
      config.notes.forEach((note) => this.addNote(note));
    }
    if (config.controlChanges) {
      this.controlChanges = [...config.controlChanges];
    }
    if (config.pitchBends) {
      this.pitchBends = [...config.pitchBends];
    }
    if (config.programChanges) {
      this.programChanges = [...config.programChanges];
    }
  }
  /**
   * Get end time of clip
   */
  get endTime() {
    return this.startTime + this.duration;
  }
  // ===== Note Management =====
  /**
   * Add a note to the clip
   */
  addNote(note) {
    if (note.time < 0 || note.time + note.duration > this.duration) {
      throw new AudioEngineError("Note is outside clip bounds", ErrorCode.INVALID_PARAMETER);
    }
    this.notes.push(note);
    this.sortNotes();
  }
  /**
   * Remove a note from the clip
   */
  removeNote(noteId) {
    const index = this.notes.findIndex((n) => n.id === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.selectedNoteIds.delete(noteId);
      return true;
    }
    return false;
  }
  /**
   * Update a note's properties
   */
  updateNote(noteId, updates) {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) return false;
    Object.assign(note, updates);
    this.sortNotes();
    return true;
  }
  /**
   * Get all notes
   */
  getNotes() {
    return [...this.notes];
  }
  /**
   * Get notes in time range
   */
  getNotesInRange(startTime, endTime) {
    return this.notes.filter((note) => {
      const noteStart = note.time;
      const noteEnd = note.time + note.duration;
      return noteStart < endTime && noteEnd > startTime;
    });
  }
  /**
   * Get note by ID
   */
  getNote(noteId) {
    return this.notes.find((n) => n.id === noteId);
  }
  // ===== Selection =====
  /**
   * Select notes
   */
  selectNotes(noteIds, add = false) {
    if (!add) {
      this.selectedNoteIds.clear();
    }
    noteIds.forEach((id) => this.selectedNoteIds.add(id));
  }
  /**
   * Deselect notes
   */
  deselectNotes(noteIds) {
    noteIds.forEach((id) => this.selectedNoteIds.delete(id));
  }
  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedNoteIds.clear();
  }
  /**
   * Get selected notes
   */
  getSelectedNotes() {
    return this.notes.filter((note) => this.selectedNoteIds.has(note.id));
  }
  /**
   * Check if note is selected
   */
  isNoteSelected(noteId) {
    return this.selectedNoteIds.has(noteId);
  }
  // ===== Editing Operations =====
  /**
   * Transpose selected notes
   */
  transposeSelected(semitones) {
    this.getSelectedNotes().forEach((note) => {
      const newPitch = Math.max(0, Math.min(127, note.pitch + semitones));
      note.pitch = newPitch;
    });
  }
  /**
   * Duplicate selected notes
   */
  duplicateSelected(offset = 1) {
    const newNotes = [];
    this.getSelectedNotes().forEach((note) => {
      const newNote = {
        ...note,
        id: this.generateId(),
        time: note.time + offset
      };
      if (newNote.time + newNote.duration <= this.duration) {
        this.addNote(newNote);
        newNotes.push(newNote);
      }
    });
    return newNotes;
  }
  /**
   * Delete selected notes
   */
  deleteSelected() {
    const selectedIds = Array.from(this.selectedNoteIds);
    let deleted = 0;
    selectedIds.forEach((id) => {
      if (this.removeNote(id)) {
        deleted++;
      }
    });
    this.selectedNoteIds.clear();
    return deleted;
  }
  /**
   * Scale velocity of selected notes
   */
  scaleVelocity(factor) {
    this.getSelectedNotes().forEach((note) => {
      note.velocity = Math.max(1, Math.min(127, Math.round(note.velocity * factor)));
    });
  }
  // ===== Quantization =====
  /**
   * Quantize notes (selected or all)
   * @param options - Quantization options
   * @param bpm - Tempo in BPM
   * @param selectedOnly - Only quantize selected notes
   */
  quantize(options, bpm = 120, selectedOnly = false) {
    const notesToQuantize = selectedOnly ? this.getSelectedNotes() : this.notes;
    if (notesToQuantize.length === 0) return;
    const quantizedNotes = quantizeNotes(notesToQuantize, options, bpm);
    quantizedNotes.forEach((quantized, index) => {
      const original = notesToQuantize[index];
      original.time = quantized.time;
      original.duration = quantized.duration;
    });
    this.sortNotes();
  }
  /**
   * Humanize notes (add subtle timing and velocity variations)
   * @param amount - Humanization amount (0-1)
   * @param selectedOnly - Only humanize selected notes
   */
  humanize(amount = 0.5, selectedOnly = false) {
    const notesToHumanize = selectedOnly ? this.getSelectedNotes() : this.notes;
    if (notesToHumanize.length === 0) return;
    const humanizedNotes = humanizeNotes(notesToHumanize, amount);
    humanizedNotes.forEach((humanized, index) => {
      const original = notesToHumanize[index];
      original.time = humanized.time;
      original.velocity = humanized.velocity;
    });
    this.sortNotes();
  }
  /**
   * Make notes legato (extend to connect with next note)
   * @param gap - Small gap between notes (seconds)
   * @param selectedOnly - Only apply to selected notes
   */
  makeLegato(gap = 1e-3, selectedOnly = false) {
    const notesToProcess = selectedOnly ? this.getSelectedNotes() : this.notes;
    if (notesToProcess.length === 0) return;
    const legatoNotes = makeNotesLegato(notesToProcess, gap);
    legatoNotes.forEach((legato, index) => {
      const original = notesToProcess[index];
      original.duration = legato.duration;
    });
  }
  /**
   * Make notes staccato (shorten duration)
   * @param factor - Duration factor (0-1)
   * @param selectedOnly - Only apply to selected notes
   */
  makeStaccato(factor = 0.5, selectedOnly = false) {
    const notesToProcess = selectedOnly ? this.getSelectedNotes() : this.notes;
    if (notesToProcess.length === 0) return;
    const staccatoNotes = makeNotesStaccato(notesToProcess, factor);
    staccatoNotes.forEach((staccato, index) => {
      const original = notesToProcess[index];
      original.duration = staccato.duration;
    });
  }
  // ===== Control Changes =====
  /**
   * Add control change event
   */
  addControlChange(cc) {
    this.controlChanges.push(cc);
    this.controlChanges.sort((a, b) => a.time - b.time);
  }
  /**
   * Get control changes
   */
  getControlChanges() {
    return [...this.controlChanges];
  }
  /**
   * Get control changes in time range
   */
  getControlChangesInRange(startTime, endTime) {
    return this.controlChanges.filter((cc) => cc.time >= startTime && cc.time <= endTime);
  }
  // ===== Pitch Bends =====
  /**
   * Add pitch bend event
   */
  addPitchBend(pb) {
    this.pitchBends.push(pb);
    this.pitchBends.sort((a, b) => a.time - b.time);
  }
  /**
   * Get pitch bends
   */
  getPitchBends() {
    return [...this.pitchBends];
  }
  // ===== Clip Operations =====
  /**
   * Move clip to new start time
   */
  moveTo(time) {
    if (time < 0) {
      throw new AudioEngineError("Start time cannot be negative", ErrorCode.INVALID_PARAMETER);
    }
    this.startTime = time;
  }
  /**
   * Split clip at time (relative to clip start)
   */
  split(time) {
    if (time <= 0 || time >= this.duration) {
      return null;
    }
    const originalDuration = this.duration;
    const secondHalfNotes = this.notes.filter((note) => note.time >= time);
    const firstHalfNotes = this.notes.filter((note) => note.time < time);
    firstHalfNotes.forEach((note) => {
      if (note.time + note.duration > time) {
        note.duration = time - note.time;
      }
    });
    const adjustedNotes = secondHalfNotes.map((note) => ({
      ...note,
      id: this.generateId(),
      time: note.time - time
    }));
    this.notes = firstHalfNotes;
    this.duration = time;
    const secondClip = new MIDIClip({
      trackId: this.trackId,
      name: `${this.name} (split)`,
      startTime: this.startTime + time,
      duration: originalDuration - time,
      notes: adjustedNotes
    });
    return secondClip;
  }
  /**
   * Clone the clip
   */
  clone() {
    return new MIDIClip({
      trackId: this.trackId,
      name: `${this.name} (copy)`,
      startTime: this.startTime,
      duration: this.duration,
      notes: this.notes.map((n) => ({ ...n, id: this.generateId() })),
      controlChanges: this.controlChanges.map((cc) => ({ ...cc, id: this.generateId() })),
      pitchBends: this.pitchBends.map((pb) => ({ ...pb, id: this.generateId() })),
      programChanges: this.programChanges.map((pc) => ({ ...pc, id: this.generateId() }))
    });
  }
  /**
   * Check if clip contains a time point
   */
  contains(time) {
    return time >= this.startTime && time < this.endTime;
  }
  /**
   * Check if clip overlaps with another
   */
  overlaps(other) {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
  // ===== Utility Methods =====
  /**
   * Calculate duration based on notes
   */
  calculateDuration(notes) {
    if (notes.length === 0) return 4;
    const latestNoteEnd = Math.max(...notes.map((n) => n.time + n.duration));
    const beatDuration = 0.5;
    return Math.ceil(latestNoteEnd / beatDuration) * beatDuration;
  }
  /**
   * Sort notes by time
   */
  sortNotes() {
    this.notes.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      return a.pitch - b.pitch;
    });
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `midi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      trackId: this.trackId,
      name: this.name,
      startTime: this.startTime,
      duration: this.duration,
      notes: this.getNotes(),
      controlChanges: this.getControlChanges(),
      pitchBends: this.getPitchBends(),
      programChanges: [...this.programChanges]
    };
  }
  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    return new MIDIClip(data);
  }
}
class MIDIManager {
  midiAccess = null;
  activeInput = null;
  recordingState = null;
  // MIDI instruments
  instruments = /* @__PURE__ */ new Map();
  // trackId -> Tone instrument
  defaultInstrument = null;
  // Scheduled notes for playback
  scheduledEvents = /* @__PURE__ */ new Map();
  // clipId -> events
  constructor() {
    this.initializeDefaultInstrument();
  }
  // ===== WebMIDI Initialization =====
  /**
   * Request MIDI access
   */
  async initialize() {
    if (!navigator.requestMIDIAccess) {
      logger.error("WebMIDI not supported in this browser");
      return false;
    }
    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      logger.info("MIDI access granted");
      return true;
    } catch (error) {
      logger.error("MIDI access denied:", error);
      return false;
    }
  }
  /**
   * Get available MIDI inputs
   */
  getInputs() {
    if (!this.midiAccess) return [];
    return Array.from(this.midiAccess.inputs.values());
  }
  /**
   * Select MIDI input device
   */
  selectInput(deviceId) {
    if (!this.midiAccess) return false;
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }
    if (deviceId) {
      const input = this.midiAccess.inputs.get(deviceId);
      if (input) {
        this.activeInput = input;
        return true;
      }
    } else {
      const inputs = this.getInputs();
      if (inputs.length > 0) {
        this.activeInput = inputs[0];
        return true;
      }
    }
    return false;
  }
  // ===== MIDI Recording =====
  /**
   * Start recording MIDI
   */
  startRecording(trackId) {
    if (!this.activeInput) {
      throw new AudioEngineError("No MIDI input selected", ErrorCode.INVALID_PARAMETER);
    }
    if (this.recordingState?.isRecording) {
      throw new AudioEngineError("Already recording", ErrorCode.RECORDING_ALREADY_STARTED);
    }
    this.recordingState = {
      isRecording: true,
      startTime: Tone.now(),
      events: [],
      activeNotes: /* @__PURE__ */ new Map()
    };
    this.activeInput.onmidimessage = (event) => {
      this.handleMIDIMessage(event);
    };
    logger.info("MIDI recording started");
  }
  /**
   * Stop recording and create clip
   */
  stopRecording(trackId) {
    if (!this.recordingState?.isRecording) {
      throw new AudioEngineError("Not recording", ErrorCode.RECORDING_NOT_STARTED);
    }
    this.recordingState.isRecording = false;
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }
    const notes = this.processRecordedEvents();
    if (notes.length === 0) {
      logger.warn("No notes recorded");
      this.recordingState = null;
      return null;
    }
    const clip = new MIDIClip({
      trackId,
      name: `MIDI Recording ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`,
      startTime: 0,
      notes
    });
    this.recordingState = null;
    logger.info(`MIDI recording stopped: ${notes.length} notes`);
    return clip;
  }
  /**
   * Handle incoming MIDI message
   */
  handleMIDIMessage(event) {
    if (!this.recordingState?.isRecording) return;
    const [status, data1, data2] = event.data;
    const command = status & 240;
    const channel = status & 15;
    const timestamp = event.timeStamp / 1e3;
    const relativeTime = timestamp - this.recordingState.startTime;
    switch (command) {
      case 144:
        if (data2 > 0) {
          this.recordingState.activeNotes.set(data1, {
            startTime: relativeTime,
            velocity: data2
          });
        } else {
          this.handleNoteOff(data1, relativeTime);
        }
        break;
      case 128:
        this.handleNoteOff(data1, relativeTime);
        break;
      case 176:
        this.recordingState.events.push({
          type: "cc",
          data: {
            id: this.generateId(),
            controller: data1,
            value: data2,
            time: relativeTime,
            channel
          }
        });
        break;
      case 224:
        const pitchBendValue = (data2 << 7 | data1) - 8192;
        this.recordingState.events.push({
          type: "pitchBend",
          data: {
            id: this.generateId(),
            value: pitchBendValue,
            time: relativeTime,
            channel
          }
        });
        break;
    }
  }
  /**
   * Handle note off event
   */
  handleNoteOff(pitch, time) {
    if (!this.recordingState) return;
    const activeNote = this.recordingState.activeNotes.get(pitch);
    if (activeNote) {
      const note = {
        id: this.generateId(),
        pitch,
        velocity: activeNote.velocity,
        time: activeNote.startTime,
        duration: time - activeNote.startTime
      };
      this.recordingState.events.push({
        type: "note",
        data: note
      });
      this.recordingState.activeNotes.delete(pitch);
    }
  }
  /**
   * Process recorded events into notes array
   */
  processRecordedEvents() {
    if (!this.recordingState) return [];
    const notes = this.recordingState.events.filter((e) => e.type === "note").map((e) => e.data);
    this.recordingState.activeNotes.forEach((noteInfo, pitch) => {
      const duration = Tone.now() - this.recordingState.startTime - noteInfo.startTime;
      notes.push({
        id: this.generateId(),
        pitch,
        velocity: noteInfo.velocity,
        time: noteInfo.startTime,
        duration: Math.max(0.1, duration)
        // Minimum 0.1s duration
      });
    });
    return notes;
  }
  // ===== MIDI Playback =====
  /**
   * Initialize default instrument
   */
  initializeDefaultInstrument() {
    this.defaultInstrument = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 128,
      volume: -6
    }).toDestination();
  }
  /**
   * Create instrument for track
   */
  createInstrument(trackId, config) {
    let instrument;
    switch (config.type) {
      case "synth":
        instrument = new Tone.Synth().toDestination();
        break;
      case "polySynth":
        instrument = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: config.polyphony || 32,
          ...config.options || {}
        }).toDestination();
        break;
      case "membraneSynth":
        instrument = new Tone.MembraneSynth().toDestination();
        break;
      case "fmSynth":
        instrument = new Tone.FMSynth().toDestination();
        break;
      case "sampler":
        instrument = new Tone.Sampler(config.options || {}).toDestination();
        break;
      default:
        instrument = new Tone.PolySynth().toDestination();
    }
    if (config.volume !== void 0) {
      instrument.volume.value = config.volume;
    }
    this.instruments.set(trackId, instrument);
    return instrument;
  }
  /**
   * Get instrument for track
   */
  getInstrument(trackId) {
    return this.instruments.get(trackId) || this.defaultInstrument;
  }
  /**
   * Schedule MIDI clip for playback
   */
  scheduleClip(clip, trackId) {
    const instrument = this.getInstrument(trackId);
    if (!instrument) return;
    const events = [];
    clip.getNotes().forEach((note) => {
      const absoluteTime = clip.startTime + note.time;
      const event = new Tone.ToneEvent((time) => {
        const freq = Tone.Frequency(note.pitch, "midi").toFrequency();
        const velocity = note.velocity / 127;
        if (instrument.triggerAttackRelease) {
          instrument.triggerAttackRelease(freq, note.duration, time, velocity);
        } else if (instrument.triggerAttack && instrument.triggerRelease) {
          instrument.triggerAttack(freq, time, velocity);
          instrument.triggerRelease(freq, time + note.duration);
        }
      });
      event.start(absoluteTime);
      events.push(event);
    });
    this.scheduledEvents.set(clip.id, events);
  }
  /**
   * Stop playback of clip
   */
  stopClip(clipId) {
    const events = this.scheduledEvents.get(clipId);
    if (events) {
      events.forEach((event) => event.dispose());
      this.scheduledEvents.delete(clipId);
    }
  }
  /**
   * Stop all playback
   */
  stopAll() {
    this.scheduledEvents.forEach((events) => {
      events.forEach((event) => event.dispose());
    });
    this.scheduledEvents.clear();
    this.instruments.forEach((instrument) => {
      if (instrument.releaseAll) {
        instrument.releaseAll();
      }
    });
  }
  // ===== Cleanup =====
  /**
   * Dispose resources
   */
  dispose() {
    this.stopAll();
    this.instruments.forEach((instrument) => {
      if (instrument.dispose) {
        instrument.dispose();
      }
    });
    this.instruments.clear();
    if (this.defaultInstrument) {
      this.defaultInstrument.dispose();
      this.defaultInstrument = null;
    }
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `midi-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
let globalMIDIManager = null;
function getMIDIManager() {
  if (!globalMIDIManager) {
    globalMIDIManager = new MIDIManager();
  }
  return globalMIDIManager;
}
class EffectsRack {
  effects;
  input;
  output;
  // Svelte store for reactivity
  effectsStore;
  constructor() {
    this.effects = [];
    this.input = new Tone.Gain(1);
    this.output = new Tone.Gain(1);
    this.input.connect(this.output);
    this.effectsStore = writable([]);
  }
  /**
   * Add an effect to the chain
   * @param effect - Effect to add
   * @param index - Optional index to insert at (default: end)
   */
  addEffect(effect, index) {
    if (this.effects.some((e) => e.id === effect.id)) {
      throw new EffectError(
        `Effect with id ${effect.id} already exists in rack`,
        ErrorCode.EFFECT_NOT_FOUND,
        effect.id
      );
    }
    if (index !== void 0 && index >= 0 && index <= this.effects.length) {
      this.effects.splice(index, 0, effect);
    } else {
      this.effects.push(effect);
    }
    this.rebuildChain();
    this.effectsStore.set([...this.effects]);
  }
  /**
   * Remove an effect from the chain
   * @param id - Effect ID to remove
   */
  removeEffect(id) {
    const index = this.effects.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new EffectError(
        `Effect with id ${id} not found in rack`,
        ErrorCode.EFFECT_NOT_FOUND,
        id
      );
    }
    const effect = this.effects[index];
    this.effects.splice(index, 1);
    effect.dispose();
    this.rebuildChain();
    this.effectsStore.set([...this.effects]);
  }
  /**
   * Reorder an effect in the chain
   * @param fromIndex - Current index
   * @param toIndex - Target index
   */
  reorderEffect(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.effects.length) {
      throw new EffectError(
        `Invalid fromIndex: ${fromIndex}`,
        ErrorCode.INVALID_PARAMETER
      );
    }
    if (toIndex < 0 || toIndex >= this.effects.length) {
      throw new EffectError(
        `Invalid toIndex: ${toIndex}`,
        ErrorCode.INVALID_PARAMETER
      );
    }
    const [effect] = this.effects.splice(fromIndex, 1);
    this.effects.splice(toIndex, 0, effect);
    this.rebuildChain();
    this.effectsStore.set([...this.effects]);
  }
  /**
   * Get effect by ID
   * @param id - Effect ID
   * @returns Effect or undefined
   */
  getEffect(id) {
    return this.effects.find((e) => e.id === id);
  }
  /**
   * Get all effects
   * @returns Array of effects
   */
  getEffects() {
    return [...this.effects];
  }
  /**
   * Get number of effects
   */
  get length() {
    return this.effects.length;
  }
  /**
   * Check if rack is empty
   */
  get isEmpty() {
    return this.effects.length === 0;
  }
  /**
   * Clear all effects
   */
  clear() {
    this.effects.forEach((effect) => effect.dispose());
    this.effects = [];
    this.rebuildChain();
    this.effectsStore.set([]);
  }
  /**
   * Rebuild the effect signal chain
   */
  rebuildChain() {
    this.input.disconnect();
    this.effects.forEach((effect) => effect.disconnect());
    if (this.effects.length === 0) {
      this.input.connect(this.output);
    } else {
      this.input.connect(this.effects[0].input);
      for (let i = 0; i < this.effects.length - 1; i++) {
        this.effects[i].connect(this.effects[i + 1].input);
      }
      this.effects[this.effects.length - 1].connect(this.output);
    }
  }
  /**
   * Get the input node
   */
  getInput() {
    return this.input;
  }
  /**
   * Get the output node
   */
  getOutput() {
    return this.output;
  }
  /**
   * Connect rack to destination
   * @param destination - Audio destination
   */
  connect(destination) {
    this.output.connect(destination);
  }
  /**
   * Disconnect rack
   */
  disconnect() {
    this.output.disconnect();
  }
  /**
   * Bypass all effects (set all to dry)
   * @param bypass - True to bypass
   */
  bypassAll(bypass) {
    this.effects.forEach((effect) => {
      effect.setEnabled(!bypass);
    });
  }
  /**
   * Get CPU usage estimate (placeholder)
   * @returns Estimated CPU usage (0-1)
   */
  getCPUUsage() {
    const activeCount = this.effects.filter((e) => e.isEnabled()).length;
    return Math.min(activeCount * 0.05, 1);
  }
  /**
   * Serialize rack to JSON
   */
  toJSON() {
    return {
      effects: this.effects.map((effect) => effect.toJSON())
    };
  }
  /**
   * Dispose all resources
   */
  dispose() {
    this.clear();
    this.input.dispose();
    this.output.dispose();
  }
}
class Track {
  // Properties
  id;
  name;
  type;
  color;
  // Audio nodes
  input;
  output;
  channel;
  // Effects
  effectsRack;
  // Players and clips
  clips = [];
  midiClips = [];
  players = /* @__PURE__ */ new Map();
  // Recording
  recorder = null;
  recordingInput = null;
  isRecording = false;
  // MIDI
  instrument = null;
  // Tone.js instrument for MIDI playback
  // Sends (for aux/bus routing)
  sends = /* @__PURE__ */ new Map();
  // Meter
  meter;
  constructor(config) {
    this.id = config.id || this.generateId();
    this.name = config.name;
    this.type = config.type;
    this.color = config.color || this.generateRandomColor();
    this.input = new Tone.Gain(1);
    this.channel = new Tone.Channel({
      volume: 0,
      pan: 0,
      mute: false,
      solo: false
    });
    this.output = new Tone.Gain(1);
    this.effectsRack = new EffectsRack();
    this.meter = new Tone.Meter({ channels: 2, smoothing: 0.8 });
    this.input.connect(this.effectsRack.getInput());
    this.effectsRack.connect(this.channel);
    this.channel.connect(this.meter);
    this.meter.connect(this.output);
  }
  // ===== Audio Management =====
  /**
   * Load audio from URL
   * @param url - Audio file URL
   */
  async loadAudio(url) {
    try {
      const player = new Tone.Player(url);
      await player.load(url);
      this.players.set(url, player);
      player.connect(this.input);
      logger.info(`Track ${this.name}: Loaded audio from ${url}`);
    } catch (error) {
      throw new TrackError(
        `Failed to load audio: ${error}`,
        ErrorCode.FILE_LOAD_ERROR,
        this.id
      );
    }
  }
  /**
   * Add a clip to the track
   * @param clip - Clip to add
   */
  addClip(clip) {
    if (clip.trackId !== this.id) {
      clip.trackId = this.id;
    }
    this.clips.push(clip);
    this.scheduleClip(clip);
  }
  /**
   * Remove a clip from the track
   * @param clipId - Clip ID to remove
   */
  removeClip(clipId) {
    const index = this.clips.findIndex((c) => c.id === clipId);
    if (index !== -1) {
      const clip = this.clips[index];
      this.unscheduleClip(clip);
      this.clips.splice(index, 1);
    }
  }
  /**
   * Get all clips
   */
  getClips() {
    return [...this.clips];
  }
  /**
   * Add a MIDI clip to the track
   * @param clip - MIDI clip to add
   */
  addMIDIClip(clip) {
    if (clip.trackId !== this.id) {
      clip.trackId = this.id;
    }
    this.midiClips.push(clip);
    this.scheduleMIDIClip(clip);
  }
  /**
   * Remove a MIDI clip from the track
   * @param clipId - MIDI clip ID to remove
   */
  removeMIDIClip(clipId) {
    const index = this.midiClips.findIndex((c) => c.id === clipId);
    if (index !== -1) {
      const clip = this.midiClips[index];
      this.unscheduleMIDIClip(clip);
      this.midiClips.splice(index, 1);
    }
  }
  /**
   * Get all MIDI clips
   */
  getMIDIClips() {
    return [...this.midiClips];
  }
  /**
   * Get all clips (audio and MIDI)
   */
  getAllClips() {
    return [...this.clips, ...this.midiClips];
  }
  /**
   * Schedule a clip for playback
   * @param clip - Clip to schedule
   */
  scheduleClip(clip) {
    const player = new Tone.Player(clip.buffer);
    player.connect(this.input);
    Tone.getTransport().schedule((time) => {
      player.start(time, clip.offset, clip.duration);
    }, clip.startTime);
    this.players.set(clip.id, player);
  }
  /**
   * Unschedule a clip
   * @param clip - Clip to unschedule
   */
  unscheduleClip(clip) {
    const player = this.players.get(clip.id);
    if (player) {
      player.stop();
      player.dispose();
      this.players.delete(clip.id);
    }
  }
  /**
   * Schedule a MIDI clip for playback
   * @param clip - MIDI clip to schedule
   */
  scheduleMIDIClip(clip) {
    const midiManager = getMIDIManager();
    midiManager.scheduleClip(clip, this.id);
  }
  /**
   * Unschedule a MIDI clip
   * @param clip - MIDI clip to unschedule
   */
  unscheduleMIDIClip(clip) {
    const midiManager = getMIDIManager();
    midiManager.stopClip(clip.id);
  }
  // ===== Recording =====
  /**
   * Start recording
   */
  async startRecording() {
    if (this.type !== "audio") {
      throw new RecordingError(
        "Only audio tracks can record",
        ErrorCode.INVALID_TRACK_TYPE
      );
    }
    if (this.isRecording) {
      throw new RecordingError(
        "Track is already recording",
        ErrorCode.RECORDING_ALREADY_STARTED
      );
    }
    try {
      this.recorder = new Tone.Recorder();
      this.recordingInput = new Tone.UserMedia();
      await this.recordingInput.open();
      this.recordingInput.connect(this.recorder);
      this.recordingInput.connect(this.input);
      this.recorder.start();
      this.isRecording = true;
      logger.info(`Track ${this.name}: Recording started`);
    } catch (error) {
      throw new RecordingError(
        `Failed to start recording: ${error}`,
        ErrorCode.MICROPHONE_ACCESS_DENIED
      );
    }
  }
  /**
   * Stop recording and create clip
   * @returns Recorded audio buffer
   */
  async stopRecording() {
    if (!this.isRecording || !this.recorder) {
      throw new RecordingError(
        "Track is not recording",
        ErrorCode.RECORDING_NOT_STARTED
      );
    }
    try {
      const blob = await this.recorder.stop();
      this.isRecording = false;
      if (this.recordingInput) {
        this.recordingInput.close();
        this.recordingInput.dispose();
        this.recordingInput = null;
      }
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
      const startTime = Tone.getTransport().seconds;
      const clip = new Clip({
        trackId: this.id,
        buffer: audioBuffer,
        startTime,
        duration: audioBuffer.duration,
        name: `Recording ${(/* @__PURE__ */ new Date()).toISOString()}`
      });
      this.addClip(clip);
      logger.info(`Track ${this.name}: Recording stopped, clip created`);
      return audioBuffer;
    } catch (error) {
      throw new RecordingError(
        `Failed to stop recording: ${error}`,
        ErrorCode.OPERATION_FAILED
      );
    } finally {
      if (this.recorder) {
        this.recorder.dispose();
        this.recorder = null;
      }
    }
  }
  // ===== MIDI Recording =====
  /**
   * Start MIDI recording
   */
  startMIDIRecording() {
    if (this.type !== "midi") {
      throw new RecordingError(
        "Only MIDI tracks can record MIDI",
        ErrorCode.INVALID_TRACK_TYPE
      );
    }
    if (this.isRecording) {
      throw new RecordingError(
        "Track is already recording",
        ErrorCode.RECORDING_ALREADY_STARTED
      );
    }
    try {
      const midiManager = getMIDIManager();
      midiManager.startRecording(this.id);
      this.isRecording = true;
      logger.info(`Track ${this.name}: MIDI recording started`);
    } catch (error) {
      throw new RecordingError(
        `Failed to start MIDI recording: ${error}`,
        ErrorCode.OPERATION_FAILED
      );
    }
  }
  /**
   * Stop MIDI recording and create MIDI clip
   * @returns Created MIDI clip or null if no notes recorded
   */
  stopMIDIRecording() {
    if (!this.isRecording) {
      throw new RecordingError(
        "Track is not recording",
        ErrorCode.RECORDING_NOT_STARTED
      );
    }
    try {
      const midiManager = getMIDIManager();
      const clip = midiManager.stopRecording(this.id);
      this.isRecording = false;
      if (clip) {
        this.addMIDIClip(clip);
        logger.info(`Track ${this.name}: MIDI recording stopped, clip created`);
      } else {
        logger.warn(`Track ${this.name}: MIDI recording stopped, no notes recorded`);
      }
      return clip;
    } catch (error) {
      this.isRecording = false;
      throw new RecordingError(
        `Failed to stop MIDI recording: ${error}`,
        ErrorCode.OPERATION_FAILED
      );
    }
  }
  // ===== MIDI Instrument =====
  /**
   * Set MIDI instrument for this track
   * @param config - Instrument configuration
   */
  setMIDIInstrument(config) {
    if (this.type !== "midi") {
      throw new TrackError(
        "Only MIDI tracks can have instruments",
        ErrorCode.INVALID_TRACK_TYPE,
        this.id
      );
    }
    const midiManager = getMIDIManager();
    this.instrument = midiManager.createInstrument(this.id, config);
    if (this.instrument && this.instrument.connect) {
      this.instrument.connect(this.input);
    }
    logger.info(`Track ${this.name}: MIDI instrument set to ${config.type}`);
  }
  /**
   * Get MIDI instrument
   */
  getMIDIInstrument() {
    return this.instrument;
  }
  // ===== Effects =====
  /**
   * Add an effect to the track
   * @param effect - Effect to add
   */
  addEffect(effect) {
    this.effectsRack.addEffect(effect);
  }
  /**
   * Remove an effect
   * @param effectId - Effect ID to remove
   */
  removeEffect(effectId) {
    this.effectsRack.removeEffect(effectId);
  }
  /**
   * Get all effects
   */
  getEffects() {
    return this.effectsRack.getEffects();
  }
  /**
   * Get effects rack
   */
  getEffectsRack() {
    return this.effectsRack;
  }
  // ===== Sends =====
  /**
   * Send to another track (aux/bus)
   * @param target - Target track
   * @param amount - Send amount (0-1)
   */
  sendTo(target, amount) {
    const existingSend = this.sends.get(target.id);
    if (existingSend) {
      existingSend.dispose();
    }
    const send = new Tone.Send(amount);
    this.channel.connect(send);
    send.connect(target.input);
    this.sends.set(target.id, send);
  }
  /**
   * Remove send to track
   * @param targetId - Target track ID
   */
  removeSend(targetId) {
    const send = this.sends.get(targetId);
    if (send) {
      send.dispose();
      this.sends.delete(targetId);
    }
  }
  // ===== Mixer Controls =====
  /**
   * Set track volume
   * @param db - Volume in decibels
   */
  setVolume(db) {
    this.channel.volume.rampTo(db, 0.1);
  }
  /**
   * Get track volume
   */
  getVolume() {
    return this.channel.volume.value;
  }
  /**
   * Set pan position
   * @param value - Pan value (-1 to 1)
   */
  setPan(value) {
    if (value < -1 || value > 1) {
      throw new TrackError(
        "Pan value must be between -1 and 1",
        ErrorCode.PARAMETER_OUT_OF_RANGE,
        this.id
      );
    }
    this.channel.pan.value = value;
  }
  /**
   * Get pan position
   */
  getPan() {
    return this.channel.pan.value;
  }
  /**
   * Set mute state
   * @param mute - True to mute
   */
  setMute(mute) {
    this.channel.mute = mute;
  }
  /**
   * Check if muted
   */
  isMuted() {
    return this.channel.mute;
  }
  /**
   * Set solo state
   * @param solo - True to solo
   */
  setSolo(solo) {
    this.channel.solo = solo;
  }
  /**
   * Check if soloed
   */
  isSoloed() {
    return this.channel.solo;
  }
  /**
   * Get current meter level
   */
  getLevel() {
    return this.meter.getValue();
  }
  // ===== Connection =====
  /**
   * Connect track to destination
   * @param destination - Audio destination
   */
  connect(destination) {
    this.output.connect(destination);
  }
  /**
   * Disconnect track
   */
  disconnect() {
    this.output.disconnect();
  }
  // ===== Serialization =====
  /**
   * Serialize track to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      color: this.color,
      volume: this.getVolume(),
      pan: this.getPan(),
      mute: this.isMuted(),
      solo: this.isSoloed(),
      effects: this.effectsRack.toJSON(),
      clips: this.clips.map((clip) => clip.toJSON()),
      midiClips: this.midiClips.map((clip) => clip.toJSON())
    };
  }
  // ===== Cleanup =====
  /**
   * Dispose all resources
   */
  dispose() {
    if (this.isRecording) {
      if (this.type === "audio") {
        this.stopRecording().catch(logger.error);
      } else if (this.type === "midi") {
        try {
          this.stopMIDIRecording();
        } catch (e) {
          logger.error(e);
        }
      }
    }
    this.players.forEach((player) => player.dispose());
    this.players.clear();
    this.midiClips.forEach((clip) => {
      this.unscheduleMIDIClip(clip);
    });
    this.midiClips = [];
    if (this.instrument && this.instrument.dispose) {
      this.instrument.dispose();
      this.instrument = null;
    }
    this.sends.forEach((send) => send.dispose());
    this.sends.clear();
    this.effectsRack.dispose();
    this.input.dispose();
    this.channel.dispose();
    this.meter.dispose();
    this.output.dispose();
    this.clips = [];
  }
  // ===== Utilities =====
  /**
   * Generate unique ID
   */
  generateId() {
    return `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Generate random color
   */
  generateRandomColor() {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
class MasterBus {
  channel;
  limiter;
  meter;
  analyser;
  // Peak detection
  peakLeft = -Infinity;
  peakRight = -Infinity;
  peakDecayRate = 0.95;
  // Peak hold decay
  peakHoldTime = 1e3;
  // ms
  lastPeakTime = 0;
  // Clipping detection
  isClipping = false;
  clippingThreshold = -0.1;
  // dB
  clippingResetTime = 100;
  // ms
  lastClipTime = 0;
  constructor(config = {}) {
    this.channel = new Tone.Channel({
      volume: config.volume ?? 0,
      pan: 0,
      mute: false,
      solo: false
    });
    this.limiter = new Tone.Limiter(config.limiterThreshold ?? -0.5);
    this.meter = new Tone.Meter({
      channels: 2,
      smoothing: config.meterSmoothingFactor ?? 0.8
    });
    this.analyser = new Tone.Analyser({
      type: "fft",
      size: 1024,
      smoothing: 0.8
    });
    this.channel.chain(this.limiter, this.meter, this.analyser, Tone.getDestination());
  }
  /**
   * Set master volume
   * @param db - Volume in decibels
   */
  setVolume(db) {
    this.channel.volume.rampTo(db, 0.1);
  }
  /**
   * Get current master volume
   * @returns Volume in decibels
   */
  getVolume() {
    return this.channel.volume.value;
  }
  /**
   * Mute/unmute master output
   * @param mute - True to mute
   */
  setMute(mute) {
    this.channel.mute = mute;
  }
  /**
   * Check if master is muted
   */
  isMuted() {
    return this.channel.mute;
  }
  /**
   * Get current meter levels
   * @returns Meter data for left and right channels
   */
  getLevel() {
    const values = this.meter.getValue();
    const now = Date.now();
    let left;
    let right;
    if (Array.isArray(values)) {
      left = values[0];
      right = values[1];
    } else {
      left = right = values;
    }
    if (left > this.peakLeft) {
      this.peakLeft = left;
      this.lastPeakTime = now;
    } else if (now - this.lastPeakTime > this.peakHoldTime) {
      this.peakLeft *= this.peakDecayRate;
    }
    if (right > this.peakRight) {
      this.peakRight = right;
      this.lastPeakTime = now;
    } else if (now - this.lastPeakTime > this.peakHoldTime) {
      this.peakRight *= this.peakDecayRate;
    }
    const peak = Math.max(left, right);
    if (peak > this.clippingThreshold) {
      this.isClipping = true;
      this.lastClipTime = now;
    } else if (now - this.lastClipTime > this.clippingResetTime) {
      this.isClipping = false;
    }
    const rms = (Math.abs(left) + Math.abs(right)) / 2;
    return {
      left,
      right,
      peak,
      rms
    };
  }
  /**
   * Get frequency spectrum data
   * @returns Float32Array of frequency magnitudes
   */
  getSpectrum() {
    return this.analyser.getValue();
  }
  /**
   * Get waveform data
   * @returns Float32Array of time-domain samples
   */
  getWaveform() {
    const currentType = this.analyser.type;
    this.analyser.type = "waveform";
    const waveform = this.analyser.getValue();
    this.analyser.type = currentType;
    return waveform;
  }
  /**
   * Check if output is clipping
   */
  isOutputClipping() {
    return this.isClipping;
  }
  /**
   * Reset peak meters
   */
  resetPeaks() {
    this.peakLeft = -Infinity;
    this.peakRight = -Infinity;
    this.isClipping = false;
  }
  /**
   * Set limiter threshold
   * @param threshold - Threshold in dB (typically -0.5 to -1.0)
   */
  setLimiterThreshold(threshold) {
    logger.warn("Limiter threshold cannot be changed dynamically. Create a new MasterBus instance.");
  }
  /**
   * Connect an audio source to the master bus
   * @param source - Audio source to connect
   */
  connect(source) {
    source.connect(this.channel);
  }
  /**
   * Get the input node
   */
  getInput() {
    return this.channel;
  }
  /**
   * Connect master bus to an external destination
   * @param destination - Destination node
   */
  connectTo(destination) {
    this.analyser.connect(destination);
  }
  /**
   * Disconnect from destination
   */
  disconnect() {
    this.analyser.disconnect();
  }
  /**
   * Get debug information
   */
  debug() {
    const level = this.getLevel();
    return {
      volume: this.channel.volume.value,
      isMuted: this.channel.mute,
      limiterThreshold: -0.5,
      // Fixed for now
      meterLevel: level,
      isClipping: this.isClipping,
      peakLeft: this.peakLeft,
      peakRight: this.peakRight
    };
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    this.channel.dispose();
    this.limiter.dispose();
    this.meter.dispose();
    this.analyser.dispose();
  }
}
class Automation {
  lanes;
  recording = false;
  recordingLaneId = null;
  constructor() {
    this.lanes = /* @__PURE__ */ new Map();
  }
  /**
   * Create a new automation lane
   */
  createLane(targetId, parameterName, curveType = "linear") {
    const id = this.generateId();
    const lane = {
      id,
      targetId,
      parameterName,
      points: [],
      curveType,
      enabled: true
    };
    this.lanes.set(id, lane);
    return id;
  }
  /**
   * Add an automation point
   */
  addPoint(laneId, time, value) {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      throw new Error(`Automation lane ${laneId} not found`);
    }
    const point = { time, value };
    const insertIndex = lane.points.findIndex((p) => p.time > time);
    if (insertIndex === -1) {
      lane.points.push(point);
    } else if (lane.points[insertIndex]?.time === time) {
      lane.points[insertIndex] = point;
    } else {
      lane.points.splice(insertIndex, 0, point);
    }
  }
  /**
   * Remove an automation point
   */
  removePoint(laneId, time, tolerance = 1e-3) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    const index = lane.points.findIndex((p) => Math.abs(p.time - time) < tolerance);
    if (index !== -1) {
      lane.points.splice(index, 1);
    }
  }
  /**
   * Remove all points in a time range
   */
  removePointsInRange(laneId, startTime, endTime) {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    lane.points = lane.points.filter((p) => p.time < startTime || p.time > endTime);
  }
  /**
   * Get interpolated value at a specific time
   */
  getValueAtTime(laneId, time) {
    const lane = this.lanes.get(laneId);
    if (!lane || !lane.enabled || lane.points.length === 0) {
      return null;
    }
    let beforePoint = null;
    let afterPoint = null;
    for (let i = 0; i < lane.points.length; i++) {
      const point = lane.points[i];
      if (point.time <= time) {
        beforePoint = point;
      }
      if (point.time >= time && !afterPoint) {
        afterPoint = point;
        break;
      }
    }
    if (!beforePoint) {
      return afterPoint ? afterPoint.value : null;
    }
    if (!afterPoint) {
      return beforePoint.value;
    }
    if (beforePoint.time === time) {
      return beforePoint.value;
    }
    return this.interpolate(beforePoint, afterPoint, time, lane.curveType);
  }
  /**
   * Interpolate between two points
   */
  interpolate(p1, p2, time, curveType) {
    const t = (time - p1.time) / (p2.time - p1.time);
    switch (curveType) {
      case "linear":
        return p1.value + (p2.value - p1.value) * t;
      case "exponential":
        if (p1.value <= 0 || p2.value <= 0) {
          return p1.value + (p2.value - p1.value) * t;
        }
        const ratio = p2.value / p1.value;
        return p1.value * Math.pow(ratio, t);
      case "step":
        return p1.value;
      default:
        return p1.value + (p2.value - p1.value) * t;
    }
  }
  /**
   * Start recording automation
   */
  startRecording(laneId) {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      throw new Error(`Automation lane ${laneId} not found`);
    }
    this.recording = true;
    this.recordingLaneId = laneId;
  }
  /**
   * Stop recording automation
   */
  stopRecording() {
    this.recording = false;
    this.recordingLaneId = null;
  }
  /**
   * Record automation point (called during playback)
   */
  recordPoint(time, value) {
    if (!this.recording || !this.recordingLaneId) return;
    this.addPoint(this.recordingLaneId, time, value);
  }
  /**
   * Is currently recording
   */
  isRecording() {
    return this.recording;
  }
  /**
   * Get recording lane ID
   */
  getRecordingLaneId() {
    return this.recordingLaneId;
  }
  /**
   * Get all lanes for a target (effect or track)
   */
  getLanesForTarget(targetId) {
    return Array.from(this.lanes.values()).filter((lane) => lane.targetId === targetId);
  }
  /**
   * Get lane by ID
   */
  getLane(laneId) {
    return this.lanes.get(laneId);
  }
  /**
   * Get all lanes
   */
  getAllLanes() {
    return Array.from(this.lanes.values());
  }
  /**
   * Delete a lane
   */
  deleteLane(laneId) {
    this.lanes.delete(laneId);
  }
  /**
   * Enable/disable a lane
   */
  setLaneEnabled(laneId, enabled) {
    const lane = this.lanes.get(laneId);
    if (lane) {
      lane.enabled = enabled;
    }
  }
  /**
   * Set curve type for a lane
   */
  setCurveType(laneId, curveType) {
    const lane = this.lanes.get(laneId);
    if (lane) {
      lane.curveType = curveType;
    }
  }
  /**
   * Apply automation to an AudioParam in offline context
   */
  applyToOfflineParam(laneId, param, offlineContext, startTime = 0, endTime) {
    const lane = this.lanes.get(laneId);
    if (!lane || !lane.enabled || lane.points.length === 0) return;
    const duration = endTime || offlineContext.length / offlineContext.sampleRate;
    for (const point of lane.points) {
      if (point.time >= startTime && point.time <= duration) {
        const offsetTime = point.time - startTime;
        param.setValueAtTime(point.value, offsetTime);
      }
    }
  }
  /**
   * Apply automation to a Tone.js Signal in realtime
   */
  applyToRealtimeParam(laneId, param, currentTime) {
    const value = this.getValueAtTime(laneId, currentTime);
    if (value !== null) {
      if (param.value !== void 0) {
        param.value = value;
      } else {
        param.setValueAtTime(value, currentTime);
      }
    }
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      lanes: Array.from(this.lanes.values())
    };
  }
  /**
   * Load from JSON
   */
  fromJSON(data) {
    this.lanes.clear();
    if (data.lanes) {
      for (const lane of data.lanes) {
        this.lanes.set(lane.id, lane);
      }
    }
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `automation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Clear all automation data
   */
  clear() {
    this.lanes.clear();
    this.recording = false;
    this.recordingLaneId = null;
  }
}
class AudioAnalyzer {
  context;
  analyser;
  splitter;
  leftAnalyser;
  rightAnalyser;
  // Analysis buffers
  freqData;
  timeData;
  leftTimeData;
  rightTimeData;
  // Metering state
  peakHold = 0;
  peakHoldTime = 0;
  peakHoldDuration = 2e3;
  // 2 seconds
  // RMS history for short-term and integrated loudness
  rmsHistory = [];
  maxHistorySize = 300;
  // 3 seconds at 100Hz update rate
  constructor(context) {
    this.context = context;
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.splitter = context.createChannelSplitter(2);
    this.leftAnalyser = context.createAnalyser();
    this.rightAnalyser = context.createAnalyser();
    this.leftAnalyser.fftSize = 2048;
    this.rightAnalyser.fftSize = 2048;
    this.analyser.connect(this.splitter);
    this.splitter.connect(this.leftAnalyser, 0);
    this.splitter.connect(this.rightAnalyser, 1);
    this.freqData = new Float32Array(this.analyser.frequencyBinCount);
    this.timeData = new Float32Array(this.analyser.fftSize);
    this.leftTimeData = new Float32Array(this.leftAnalyser.fftSize);
    this.rightTimeData = new Float32Array(this.rightAnalyser.fftSize);
  }
  /**
   * Connect audio source to analyzer
   */
  connect(source) {
    source.connect(this.analyser);
  }
  /**
   * Disconnect analyzer
   */
  disconnect() {
    this.analyser.disconnect();
  }
  /**
   * Get spectrum data for visualization
   */
  getSpectrumData() {
    this.analyser.getFloatFrequencyData(this.freqData);
    const binCount = this.analyser.frequencyBinCount;
    const frequencies = new Float32Array(binCount);
    const nyquist = this.context.sampleRate / 2;
    for (let i = 0; i < binCount; i++) {
      frequencies[i] = i / binCount * nyquist;
    }
    return {
      frequencies,
      magnitudes: this.freqData.slice(0),
      // Copy array
      binCount,
      sampleRate: this.context.sampleRate
    };
  }
  /**
   * Get waveform peak data
   */
  getPeakData(windowSize = 100) {
    this.analyser.getFloatTimeDomainData(this.timeData);
    const peaks = [];
    const samplesPerPeak = Math.floor(this.timeData.length / windowSize);
    let rmsSum = 0;
    let peakLevel = 0;
    let peakPosition = 0;
    for (let i = 0; i < windowSize; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, this.timeData.length);
      let maxInWindow = 0;
      let windowRmsSum = 0;
      for (let j = start; j < end; j++) {
        const value = Math.abs(this.timeData[j]);
        maxInWindow = Math.max(maxInWindow, value);
        windowRmsSum += value * value;
        if (value > peakLevel) {
          peakLevel = value;
          peakPosition = j / this.timeData.length;
        }
      }
      peaks.push(maxInWindow);
      rmsSum += windowRmsSum;
    }
    const rms = Math.sqrt(rmsSum / this.timeData.length);
    return {
      peaks,
      rms,
      peakLevel,
      peakPosition
    };
  }
  /**
   * Get loudness metering data (LUFS/RMS)
   */
  getLoudnessData() {
    this.leftAnalyser.getFloatTimeDomainData(this.leftTimeData);
    this.rightAnalyser.getFloatTimeDomainData(this.rightTimeData);
    let rmsSum = 0;
    let peak = 0;
    for (let i = 0; i < this.leftTimeData.length; i++) {
      const left = this.leftTimeData[i];
      const right = this.rightTimeData[i];
      const mono = (left + right) / 2;
      rmsSum += mono * mono;
      peak = Math.max(peak, Math.abs(left), Math.abs(right));
    }
    const rmsLinear = Math.sqrt(rmsSum / this.leftTimeData.length);
    const rmsDb = 20 * Math.log10(Math.max(rmsLinear, 1e-10));
    const peakDb = 20 * Math.log10(Math.max(peak, 1e-10));
    this.rmsHistory.push(rmsLinear);
    if (this.rmsHistory.length > this.maxHistorySize) {
      this.rmsHistory.shift();
    }
    const shortTermSamples = Math.min(30, this.rmsHistory.length);
    let shortTermSum = 0;
    for (let i = this.rmsHistory.length - shortTermSamples; i < this.rmsHistory.length; i++) {
      shortTermSum += this.rmsHistory[i] * this.rmsHistory[i];
    }
    const shortTermRms = Math.sqrt(shortTermSum / shortTermSamples);
    const shortTermLufs = this.convertToLUFS(shortTermRms);
    let integratedSum = 0;
    for (const rms of this.rmsHistory) {
      integratedSum += rms * rms;
    }
    const integratedRms = Math.sqrt(integratedSum / this.rmsHistory.length);
    const integratedLufs = this.convertToLUFS(integratedRms);
    const momentaryLufs = this.convertToLUFS(rmsLinear);
    const now = Date.now();
    if (peak > this.peakHold || now - this.peakHoldTime > this.peakHoldDuration) {
      this.peakHold = peak;
      this.peakHoldTime = now;
    }
    const truePeakDb = 20 * Math.log10(Math.max(this.peakHold, 1e-10));
    return {
      integrated: integratedLufs,
      shortTerm: shortTermLufs,
      momentary: momentaryLufs,
      rms: rmsDb,
      peak: peakDb,
      truePeak: truePeakDb
    };
  }
  /**
   * Convert RMS to LUFS (simplified approximation)
   */
  convertToLUFS(rms) {
    const db = 20 * Math.log10(Math.max(rms, 1e-10));
    return db - 0.691;
  }
  /**
   * Get phase correlation data
   */
  getPhaseCorrelation() {
    this.leftAnalyser.getFloatTimeDomainData(this.leftTimeData);
    this.rightAnalyser.getFloatTimeDomainData(this.rightTimeData);
    let leftSum = 0;
    let rightSum = 0;
    let leftSquareSum = 0;
    let rightSquareSum = 0;
    let productSum = 0;
    for (let i = 0; i < this.leftTimeData.length; i++) {
      const left = this.leftTimeData[i];
      const right = this.rightTimeData[i];
      leftSum += left;
      rightSum += right;
      leftSquareSum += left * left;
      rightSquareSum += right * right;
      productSum += left * right;
    }
    const n = this.leftTimeData.length;
    const leftMean = leftSum / n;
    const rightMean = rightSum / n;
    const numerator = productSum - n * leftMean * rightMean;
    const denominator = Math.sqrt(
      (leftSquareSum - n * leftMean * leftMean) * (rightSquareSum - n * rightMean * rightMean)
    );
    const correlation = denominator !== 0 ? numerator / denominator : 0;
    const leftRms = Math.sqrt(leftSquareSum / n);
    const rightRms = Math.sqrt(rightSquareSum / n);
    const balance = rightRms !== 0 ? leftRms / rightRms : 1;
    return {
      correlation: Math.max(-1, Math.min(1, correlation)),
      balance
    };
  }
  /**
   * Reset metering state
   */
  reset() {
    this.peakHold = 0;
    this.peakHoldTime = 0;
    this.rmsHistory = [];
  }
  /**
   * Set peak hold duration
   */
  setPeakHoldDuration(milliseconds) {
    this.peakHoldDuration = milliseconds;
  }
  /**
   * Set FFT size for analysis
   */
  setFFTSize(size) {
    this.analyser.fftSize = size;
    this.leftAnalyser.fftSize = size;
    this.rightAnalyser.fftSize = size;
    this.freqData = new Float32Array(this.analyser.frequencyBinCount);
    this.timeData = new Float32Array(this.analyser.fftSize);
    this.leftTimeData = new Float32Array(this.leftAnalyser.fftSize);
    this.rightTimeData = new Float32Array(this.rightAnalyser.fftSize);
  }
  /**
   * Set smoothing time constant
   */
  setSmoothingTimeConstant(value) {
    this.analyser.smoothingTimeConstant = Math.max(0, Math.min(1, value));
    this.leftAnalyser.smoothingTimeConstant = this.analyser.smoothingTimeConstant;
    this.rightAnalyser.smoothingTimeConstant = this.analyser.smoothingTimeConstant;
  }
  /**
   * Dispose analyzer
   */
  dispose() {
    this.analyser.disconnect();
    this.splitter.disconnect();
    this.leftAnalyser.disconnect();
    this.rightAnalyser.disconnect();
  }
}
class RecordingManager {
  recorder = null;
  takes = [];
  currentPassIndex = 0;
  state = "idle";
  loopStartBar = 0;
  loopEndBar = 0;
  recordingTrackId = null;
  countInTimer = null;
  metronome;
  metronomeGain;
  constructor() {
    this.metronome = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: "sine" },
      envelope: {
        attack: 1e-3,
        decay: 0.3,
        sustain: 0,
        release: 0.01
      }
    });
    this.metronomeGain = new Tone.Gain(0.3);
    this.metronome.connect(this.metronomeGain);
    this.metronomeGain.toDestination();
  }
  /**
   * Start loop recording
   */
  async startLoopRecording(opts) {
    if (this.state !== "idle") {
      throw new Error("Recording already in progress");
    }
    this.takes = [];
    this.currentPassIndex = 0;
    this.loopStartBar = 0;
    this.loopEndBar = opts.bars;
    Tone.getTransport().loop = true;
    Tone.getTransport().loopStart = `${this.loopStartBar}:0:0`;
    Tone.getTransport().loopEnd = `${this.loopEndBar}:0:0`;
    this.recordingTrackId = this.generateId();
    await this.startCountIn(opts.countInBars || 1, opts.metronomeVolume || 0.3);
    this.state = "recording";
    await this.setupRecorder();
    this.setupLoopListeners();
    Tone.getTransport().start();
    eventBus.emit("recording:started", {
      trackId: this.recordingTrackId,
      bars: opts.bars
    });
    return { trackId: this.recordingTrackId };
  }
  /**
   * Stop recording
   */
  async stopRecording() {
    if (this.state !== "recording") {
      throw new Error("No recording in progress");
    }
    this.state = "processing";
    Tone.getTransport().stop();
    if (this.recorder) {
      const recording = await this.recorder.stop();
      await this.processTake(recording, this.currentPassIndex);
      this.recorder.dispose();
      this.recorder = null;
    }
    Tone.getTransport().loop = false;
    this.state = "idle";
    eventBus.emit("recording:stopped", {
      trackId: this.recordingTrackId,
      takeCount: this.takes.length
    });
    return this.takes;
  }
  /**
   * Get all takes
   */
  getTakes() {
    return [...this.takes];
  }
  /**
   * Get current recording state
   */
  getState() {
    return this.state;
  }
  /**
   * Get current pass index
   */
  getCurrentPassIndex() {
    return this.currentPassIndex;
  }
  /**
   * Set metronome volume
   */
  setMetronomeVolume(volume) {
    this.metronomeGain.gain.value = Math.max(0, Math.min(1, volume));
  }
  /**
   * Start count-in
   */
  async startCountIn(bars, volume) {
    this.state = "counting-in";
    this.setMetronomeVolume(volume);
    const beatsPerBar = 4;
    const totalBeats = bars * beatsPerBar;
    return new Promise((resolve) => {
      let beatCount = 0;
      const scheduleId = Tone.getTransport().scheduleRepeat(
        (time) => {
          const bar = Math.floor(beatCount / beatsPerBar) + 1;
          const beat = beatCount % beatsPerBar + 1;
          const pitch = beat === 1 ? "C5" : "C4";
          this.metronome.triggerAttackRelease(pitch, "8n", time);
          eventBus.emit("recording:countIn", {
            bar,
            beat,
            total: totalBeats,
            remaining: totalBeats - beatCount - 1
          });
          beatCount++;
          if (beatCount >= totalBeats) {
            Tone.getTransport().clear(scheduleId);
            resolve();
          }
        },
        "4n",
        // Every quarter note
        "0:0:0"
      );
      Tone.getTransport().start();
    });
  }
  /**
   * Set up recorder
   */
  async setupRecorder() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 48e3
      }
    });
    this.recorder = new Tone.Recorder();
    const source = Tone.context.createMediaStreamSource(stream);
    const toneInput = new Tone.Gain(1);
    source.connect(toneInput.input);
    toneInput.connect(this.recorder);
    await this.recorder.start();
  }
  /**
   * Set up loop listeners
   */
  setupLoopListeners() {
    Tone.Time(`${this.loopEndBar}:0:0`).toSeconds();
    Tone.getTransport().scheduleRepeat(
      async (time) => {
        if (this.state === "recording" && this.recorder) {
          const recording = await this.recorder.stop();
          await this.processTake(recording, this.currentPassIndex);
          this.currentPassIndex++;
          await this.recorder.start();
          eventBus.emit("recording:loopComplete", {
            passIndex: this.currentPassIndex,
            totalTakes: this.takes.length
          });
        }
      },
      `${this.loopEndBar}m`,
      "0:0:0"
    );
  }
  /**
   * Process take
   */
  async processTake(recording, passIndex) {
    const arrayBuffer = await recording.arrayBuffer();
    const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    const metrics = this.calculateMetrics(audioBuffer);
    const take = {
      id: this.generateId(),
      passIndex,
      startBar: this.loopStartBar,
      endBar: this.loopEndBar,
      clip: audioBuffer,
      metrics,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.takes.push(take);
    eventBus.emit("recording:takeCreated", {
      takeId: take.id,
      passIndex,
      metrics
    });
  }
  /**
   * Calculate take metrics
   */
  calculateMetrics(buffer) {
    const channelData = buffer.getChannelData(0);
    const length = channelData.length;
    let peak = 0;
    let sumSquares = 0;
    for (let i = 0; i < length; i++) {
      const sample = Math.abs(channelData[i]);
      peak = Math.max(peak, sample);
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / length);
    const peakDb = 20 * Math.log10(Math.max(peak, 1e-10));
    const rmsDb = 20 * Math.log10(Math.max(rms, 1e-10));
    const sortedSamples = Array.from(channelData).map(Math.abs).sort((a, b) => a - b);
    const noiseFloorIndex = Math.floor(length * 0.1);
    const noiseFloor = sortedSamples[noiseFloorIndex];
    const noiseFloorDb = 20 * Math.log10(Math.max(noiseFloor, 1e-10));
    const snr = peakDb - noiseFloorDb;
    const timingErrorMs = this.calculateTimingError(buffer);
    return {
      peakDb,
      rmsDb,
      snr,
      timingErrorMs
    };
  }
  /**
   * Calculate timing error (simplified)
   */
  calculateTimingError(buffer) {
    const bpm = Tone.getTransport().bpm.value;
    const beatDuration = 60 / bpm;
    const channelData = buffer.getChannelData(0);
    const threshold = 0.1;
    let firstTransient = -1;
    for (let i = 1; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold && Math.abs(channelData[i]) > Math.abs(channelData[i - 1])) {
        firstTransient = i;
        break;
      }
    }
    if (firstTransient === -1) {
      return 0;
    }
    const transientTime = firstTransient / buffer.sampleRate;
    const expectedBeatTime = Math.round(transientTime / beatDuration) * beatDuration;
    const timingErrorSec = Math.abs(transientTime - expectedBeatTime);
    return timingErrorSec * 1e3;
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `take-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Dispose resources
   */
  dispose() {
    if (this.recorder) {
      this.recorder.dispose();
      this.recorder = null;
    }
    if (this.countInTimer) {
      clearTimeout(this.countInTimer);
      this.countInTimer = null;
    }
    this.metronome.dispose();
    this.metronomeGain.dispose();
  }
}
class AudioEngine {
  static instance;
  // Core properties
  context;
  transport;
  isInitialized = false;
  // Tracks and routing
  tracks;
  masterBus;
  // Automation system
  automation;
  // Audio analysis
  analyzer;
  // Recording system
  recordingManager;
  // Transport state
  _isPlaying = false;
  _isRecording = false;
  constructor(config = {}) {
    const defaultConfig = {
      sampleRate: 48e3,
      latencyHint: "interactive",
      lookAhead: 0.1
    };
    const finalConfig = { ...defaultConfig, ...config };
    this.context = new AudioContext({
      latencyHint: finalConfig.latencyHint,
      sampleRate: finalConfig.sampleRate
    });
    Tone.setContext(this.context);
    this.transport = Tone.getTransport();
    this.transport.lookAhead = finalConfig.lookAhead;
    this.tracks = /* @__PURE__ */ new Map();
    this.masterBus = new MasterBus();
    this.automation = new Automation();
    this.analyzer = new AudioAnalyzer(this.context);
    this.recordingManager = new RecordingManager();
    logger.info("AudioEngine: Created instance", {
      sampleRate: this.context.sampleRate,
      latencyHint: finalConfig.latencyHint,
      state: this.context.state
    });
  }
  /**
   * Get singleton instance
   * @param config - Optional configuration (only used on first call)
   */
  static getInstance(config) {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine(config);
    }
    return AudioEngine.instance;
  }
  /**
   * Initialize the audio engine
   * Must be called in response to user interaction
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn("AudioEngine: Already initialized");
      return;
    }
    try {
      await this.context.resume();
      await Tone.start();
      this.isInitialized = true;
      logger.info("AudioEngine: Initialized", {
        sampleRate: this.context.sampleRate,
        baseLatency: this.context.baseLatency,
        outputLatency: this.context.outputLatency,
        state: this.context.state
      });
      eventBus.emit("playback:play", { initialized: true });
    } catch (error) {
      throw new AudioEngineError(
        `Failed to initialize audio engine: ${error}`,
        ErrorCode.AUDIO_CONTEXT_ERROR
      );
    }
  }
  /**
   * Check if engine is initialized
   */
  get initialized() {
    return this.isInitialized;
  }
  // ===== Track Management =====
  /**
   * Add a new track
   * @param config - Track configuration
   * @returns Created track
   */
  addTrack(config) {
    const track = new Track(config);
    track.connect(this.masterBus.getInput());
    this.tracks.set(track.id, track);
    logger.info(`AudioEngine: Added track "${track.name}" (${track.id})`);
    eventBus.emit("track:created", { trackId: track.id, name: track.name });
    return track;
  }
  /**
   * Remove a track
   * @param id - Track ID
   */
  removeTrack(id) {
    const track = this.tracks.get(id);
    if (!track) {
      throw new AudioEngineError(`Track ${id} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    track.disconnect();
    track.dispose();
    this.tracks.delete(id);
    logger.info(`AudioEngine: Removed track ${id}`);
    eventBus.emit("track:deleted", { trackId: id });
  }
  /**
   * Get a track by ID
   * @param id - Track ID
   * @returns Track or undefined
   */
  getTrack(id) {
    return this.tracks.get(id);
  }
  /**
   * Get all tracks
   * @returns Array of tracks
   */
  getAllTracks() {
    return Array.from(this.tracks.values());
  }
  /**
   * Get track count
   */
  get trackCount() {
    return this.tracks.size;
  }
  // ===== Transport Control =====
  /**
   * Start playback
   */
  play() {
    this.ensureInitialized();
    if (this._isPlaying) {
      logger.warn("AudioEngine: Already playing");
      return;
    }
    this.transport.start();
    this._isPlaying = true;
    logger.info("AudioEngine: Playback started");
    eventBus.emit("playback:play", { time: this.transport.seconds });
  }
  /**
   * Stop playback
   */
  stop() {
    this.ensureInitialized();
    if (!this._isPlaying) {
      return;
    }
    this.transport.stop();
    this._isPlaying = false;
    logger.info("AudioEngine: Playback stopped");
    eventBus.emit("playback:stop", { time: this.transport.seconds });
  }
  /**
   * Pause playback
   */
  pause() {
    this.ensureInitialized();
    if (!this._isPlaying) {
      return;
    }
    this.transport.pause();
    this._isPlaying = false;
    logger.info("AudioEngine: Playback paused");
    eventBus.emit("playback:pause", { time: this.transport.seconds });
  }
  /**
   * Check if playing
   */
  get isPlaying() {
    return this._isPlaying;
  }
  // ===== Recording =====
  /**
   * Start recording on a track
   * @param trackId - Track ID to record on
   */
  async startRecording(trackId) {
    this.ensureInitialized();
    const track = this.getTrack(trackId);
    if (!track) {
      throw new AudioEngineError(`Track ${trackId} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    await track.startRecording();
    this._isRecording = true;
    logger.info(`AudioEngine: Recording started on track ${trackId}`);
    eventBus.emit("playback:record-start", { trackId });
  }
  /**
   * Stop recording on a track
   * @param trackId - Track ID
   * @returns Recorded audio buffer
   */
  async stopRecording(trackId) {
    this.ensureInitialized();
    const track = this.getTrack(trackId);
    if (!track) {
      throw new AudioEngineError(`Track ${trackId} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    const buffer = await track.stopRecording();
    this._isRecording = false;
    logger.info(`AudioEngine: Recording stopped on track ${trackId}`);
    eventBus.emit("playback:record-stop", { trackId, duration: buffer.duration });
    return buffer;
  }
  /**
   * Check if recording
   */
  get isRecording() {
    return this._isRecording;
  }
  // ===== Loop Recording with Takes =====
  /**
   * Start loop recording with automatic take management
   * @param options - Recording options (bars, track name, count-in, metronome volume)
   * @returns Track ID for the recorded takes
   */
  async startLoopRecording(options) {
    this.ensureInitialized();
    const result = await this.recordingManager.startLoopRecording(options);
    this._isRecording = true;
    logger.info(`AudioEngine: Loop recording started on track ${result.trackId}`);
    return result;
  }
  /**
   * Stop loop recording and return all takes
   * @returns Array of recorded takes
   */
  async stopLoopRecording() {
    this.ensureInitialized();
    const takes = await this.recordingManager.stopRecording();
    this._isRecording = false;
    logger.info(`AudioEngine: Loop recording stopped, ${takes.length} takes captured`);
    return takes;
  }
  /**
   * Get current recording state
   * @returns Recording state (idle, counting-in, recording, processing)
   */
  getRecordingState() {
    return this.recordingManager.getState();
  }
  /**
   * Get all takes for the current recording session
   * @returns Array of takes
   */
  getTakes() {
    return this.recordingManager.getTakes();
  }
  /**
   * Set metronome volume for count-in and recording
   * @param volume - Volume level (0-1)
   */
  setMetronomeVolume(volume) {
    if (volume < 0 || volume > 1) {
      throw new AudioEngineError(
        "Metronome volume must be between 0 and 1",
        ErrorCode.PARAMETER_OUT_OF_RANGE
      );
    }
    this.recordingManager.setMetronomeVolume(volume);
    logger.info(`AudioEngine: Metronome volume set to ${volume}`);
  }
  /**
   * Get recording manager instance for direct access
   * @returns RecordingManager instance
   */
  getRecordingManager() {
    return this.recordingManager;
  }
  // ===== Tempo & Timing =====
  /**
   * Set tempo (BPM)
   * @param bpm - Beats per minute
   */
  setTempo(bpm) {
    if (bpm < 20 || bpm > 999) {
      throw new AudioEngineError(
        "Tempo must be between 20 and 999 BPM",
        ErrorCode.PARAMETER_OUT_OF_RANGE
      );
    }
    this.transport.bpm.value = bpm;
    logger.info(`AudioEngine: Tempo set to ${bpm} BPM`);
  }
  /**
   * Get current tempo
   */
  getTempo() {
    return this.transport.bpm.value;
  }
  /**
   * Set time signature
   * @param numerator - Beats per bar
   * @param denominator - Beat unit
   */
  setTimeSignature(numerator, denominator = 4) {
    this.transport.timeSignature = [numerator, denominator];
    logger.info(`AudioEngine: Time signature set to ${numerator}/${denominator}`);
  }
  /**
   * Get current time signature
   */
  getTimeSignature() {
    return this.transport.timeSignature;
  }
  /**
   * Set loop points
   * @param start - Loop start in seconds
   * @param end - Loop end in seconds
   * @param enabled - Enable looping
   */
  setLoop(start, end, enabled = true) {
    this.transport.loop = enabled;
    this.transport.loopStart = start;
    this.transport.loopEnd = end;
    logger.info(`AudioEngine: Loop ${enabled ? "enabled" : "disabled"} [${start}s - ${end}s]`);
  }
  /**
   * Get current playback position in seconds
   */
  getCurrentTime() {
    return this.transport.seconds;
  }
  /**
   * Set playback position
   * @param time - Time in seconds
   */
  setCurrentTime(time) {
    this.transport.seconds = time;
  }
  // ===== Routing =====
  /**
   * Connect an effect to a track
   * @param trackId - Track ID
   * @param effect - Effect to add
   */
  connectEffect(trackId, effect) {
    const track = this.getTrack(trackId);
    if (!track) {
      throw new AudioEngineError(`Track ${trackId} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    track.addEffect(effect);
    logger.info(`AudioEngine: Added effect to track ${trackId}`);
    eventBus.emit("effect:added", { trackId, effectId: effect.id });
  }
  /**
   * Route track to send/aux
   * @param trackId - Source track ID
   * @param sendId - Target track ID
   * @param amount - Send amount (0-1)
   */
  routeToSend(trackId, sendId, amount) {
    const sourceTrack = this.getTrack(trackId);
    const targetTrack = this.getTrack(sendId);
    if (!sourceTrack) {
      throw new AudioEngineError(`Track ${trackId} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    if (!targetTrack) {
      throw new AudioEngineError(`Track ${sendId} not found`, ErrorCode.TRACK_NOT_FOUND);
    }
    sourceTrack.sendTo(targetTrack, amount);
    logger.info(`AudioEngine: Routed track ${trackId} to ${sendId} (amount: ${amount})`);
  }
  // ===== Automation =====
  /**
   * Get automation system
   */
  getAutomation() {
    return this.automation;
  }
  /**
   * Create automation lane for effect parameter
   */
  createAutomationLane(targetId, parameterName, curveType = "linear") {
    return this.automation.createLane(targetId, parameterName, curveType);
  }
  /**
   * Add automation point
   */
  addAutomationPoint(laneId, time, value) {
    this.automation.addPoint(laneId, time, value);
    eventBus.emit("automation:pointAdded", { laneId, time, value });
  }
  /**
   * Remove automation point
   */
  removeAutomationPoint(laneId, time) {
    this.automation.removePoint(laneId, time);
    eventBus.emit("automation:pointRemoved", { laneId, time });
  }
  /**
   * Start recording automation for a lane
   */
  startAutomationRecording(laneId) {
    this.automation.startRecording(laneId);
    logger.info(`AudioEngine: Started automation recording for lane ${laneId}`);
    eventBus.emit("automation:recordingStarted", { laneId });
  }
  /**
   * Stop automation recording
   */
  stopAutomationRecording() {
    this.automation.stopRecording();
    logger.info("AudioEngine: Stopped automation recording");
    eventBus.emit("automation:recordingStopped", {});
  }
  /**
   * Get automation value at current time
   */
  getAutomationValueAtTime(laneId, time) {
    const currentTime = time ?? this.getCurrentTime();
    return this.automation.getValueAtTime(laneId, currentTime);
  }
  // ===== Audio Analysis =====
  /**
   * Get audio analyzer
   */
  getAnalyzer() {
    return this.analyzer;
  }
  /**
   * Get spectrum data for visualization
   */
  getSpectrumData() {
    return this.analyzer.getSpectrumData();
  }
  /**
   * Get waveform peak data
   */
  getPeakData(windowSize) {
    return this.analyzer.getPeakData(windowSize);
  }
  /**
   * Get loudness metering data (LUFS/RMS)
   */
  getLoudnessData() {
    return this.analyzer.getLoudnessData();
  }
  /**
   * Get phase correlation data
   */
  getPhaseCorrelation() {
    return this.analyzer.getPhaseCorrelation();
  }
  /**
   * Reset audio analysis meters
   */
  resetAnalysis() {
    this.analyzer.reset();
  }
  // ===== Export =====
  /**
   * Render audio offline for export (faster than real-time)
   * @param durationSec - Duration to render in seconds
   * @param tailSec - Extra tail time for reverb/delay (default 2s)
   * @returns Rendered AudioBuffer
   */
  async renderOffline(durationSec, tailSec = 2) {
    const totalSec = durationSec + tailSec;
    const sampleRate = this.context.sampleRate;
    const totalSamples = Math.floor(totalSec * sampleRate);
    logger.info(`AudioEngine: Starting offline render (${totalSec}s @ ${sampleRate}Hz)`);
    const offlineContext = new OfflineAudioContext(
      2,
      // stereo
      totalSamples,
      sampleRate
    );
    const activeTracks = Array.from(this.tracks.values()).filter((track) => !track.isMuted());
    const offlineMaster = offlineContext.createGain();
    let masterVolume;
    if (activeTracks.length === 0) {
      masterVolume = 0.1;
    } else if (activeTracks.length === 1) {
      masterVolume = 0.5;
    } else if (activeTracks.length <= 3) {
      masterVolume = 0.8;
    } else {
      masterVolume = 0.6 / Math.sqrt(activeTracks.length);
    }
    offlineMaster.gain.value = masterVolume;
    offlineMaster.connect(offlineContext.destination);
    logger.info(`AudioEngine: Rendering ${activeTracks.length} tracks (master: ${masterVolume.toFixed(3)})`);
    const applyTrackEffects = (sourceNode, track, offlineCtx, destination) => {
      const effects = track.getEffects();
      if (effects.length === 0) {
        sourceNode.connect(destination);
        return sourceNode;
      }
      let currentNode = sourceNode;
      for (const effect of effects) {
        const effectDestination = offlineCtx.createGain();
        const effectOutput = effect.applyToOfflineContext(
          offlineCtx,
          currentNode,
          effectDestination
        );
        currentNode = effectOutput;
      }
      currentNode.connect(destination);
      return currentNode;
    };
    for (const track of activeTracks) {
      const clips = track.getClips();
      const trackEffects = track.getEffects();
      const effectsCount = trackEffects.length;
      if (clips.length === 0) {
        const freq = 440 + Math.random() * 200;
        const oscillator = offlineContext.createOscillator();
        const gain = offlineContext.createGain();
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        const volumeDb = track.getVolume();
        let baseVolume;
        if (volumeDb !== void 0 && volumeDb !== 0) {
          baseVolume = Math.pow(10, volumeDb / 20);
        } else {
          if (activeTracks.length === 1) {
            baseVolume = 0.32;
          } else if (activeTracks.length <= 3) {
            baseVolume = 0.2;
          } else {
            baseVolume = 0.15;
          }
        }
        gain.gain.value = baseVolume;
        gain.gain.setValueAtTime(0, 0);
        gain.gain.linearRampToValueAtTime(gain.gain.value, 0.01);
        gain.gain.setValueAtTime(gain.gain.value, durationSec - 0.05);
        gain.gain.linearRampToValueAtTime(0, durationSec);
        oscillator.connect(gain);
        applyTrackEffects(gain, track, offlineContext, offlineMaster);
        oscillator.start(0);
        oscillator.stop(durationSec);
        logger.info(`  Track "${track.name}": Generated test tone at ${freq.toFixed(0)}Hz (${effectsCount} effects)`);
      } else {
        for (const clip of clips) {
          if (clip.startTime < totalSec) {
            const source = offlineContext.createBufferSource();
            const gain = offlineContext.createGain();
            source.buffer = clip.buffer;
            source.playbackRate.value = clip.playbackRate || 1;
            const volumeDb = track.getVolume();
            const volumeLinear = Math.pow(10, volumeDb / 20);
            gain.gain.value = volumeLinear * clip.gain;
            source.connect(gain);
            applyTrackEffects(gain, track, offlineContext, offlineMaster);
            const startTime = clip.startTime;
            const offset = clip.offset;
            const duration = Math.min(clip.duration, totalSec - startTime);
            source.start(startTime, offset, duration);
            logger.info(
              `  Track "${track.name}": Clip at ${startTime.toFixed(2)}s, duration ${duration.toFixed(2)}s (${effectsCount} effects)`
            );
          }
        }
      }
    }
    if (activeTracks.length === 0) {
      logger.info("  No active tracks, generating test tone");
      const oscillator = offlineContext.createOscillator();
      const gain = offlineContext.createGain();
      oscillator.frequency.value = 440;
      oscillator.type = "sine";
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(offlineMaster);
      oscillator.start(0);
      oscillator.stop(Math.min(1, durationSec));
    }
    logger.info("AudioEngine: Rendering...");
    const renderedBuffer = await offlineContext.startRendering();
    logger.info("AudioEngine: Offline render complete");
    return renderedBuffer;
  }
  /**
   * Export mix to file
   * @param format - Export format
   * @returns Blob containing audio data
   */
  async exportMix(format = "wav") {
    this.ensureInitialized();
    try {
      const recorder = new Tone.Recorder();
      this.masterBus.connectTo(recorder);
      recorder.start();
      const wasPlaying = this._isPlaying;
      if (!wasPlaying) {
        this.play();
      }
      const duration = this.transport.loopEnd || 60;
      await new Promise((resolve) => setTimeout(resolve, duration * 1e3));
      if (!wasPlaying) {
        this.stop();
      }
      const recording = await recorder.stop();
      recorder.dispose();
      logger.info(`AudioEngine: Mix exported as ${format}`);
      return recording;
    } catch (error) {
      throw new AudioEngineError(
        `Failed to export mix: ${error}`,
        ErrorCode.EXPORT_ERROR
      );
    }
  }
  // ===== Metrics =====
  /**
   * Get total system latency
   * @returns Latency in seconds
   */
  getLatency() {
    return this.context.baseLatency + this.context.outputLatency;
  }
  /**
   * Get estimated CPU load
   * @returns CPU load (0-1)
   */
  getCPULoad() {
    const activeTracks = this.getAllTracks().filter((t) => !t.isMuted()).length;
    const totalEffects = this.getAllTracks().reduce(
      (sum, t) => sum + t.getEffects().length,
      0
    );
    const estimate = activeTracks * 0.02 + totalEffects * 0.05;
    return Math.min(estimate, 1);
  }
  /**
   * Get master bus
   */
  getMasterBus() {
    return this.masterBus;
  }
  // ===== Utilities =====
  /**
   * Ensure engine is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new AudioEngineError(
        "AudioEngine not initialized. Call initialize() first.",
        ErrorCode.NOT_INITIALIZED
      );
    }
  }
  /**
   * Get debug information
   */
  debug() {
    console.group("AudioEngine Debug Info");
    logger.info("Initialized:", this.isInitialized);
    logger.info("Context State:", this.context.state);
    logger.info("Sample Rate:", this.context.sampleRate);
    logger.info("Latency:", this.getLatency(), "seconds");
    logger.info("CPU Load:", (this.getCPULoad() * 100).toFixed(1), "%");
    logger.info("Tracks:", this.tracks.size);
    logger.info("Is Playing:", this._isPlaying);
    logger.info("Is Recording:", this._isRecording);
    logger.info("Tempo:", this.getTempo(), "BPM");
    logger.info("Time Signature:", this.getTimeSignature().join("/"));
    logger.info("Current Time:", this.getCurrentTime().toFixed(2), "s");
    console.groupEnd();
  }
  /**
   * Dispose all resources
   */
  dispose() {
    if (this._isPlaying) {
      this.stop();
    }
    this.tracks.forEach((track) => track.dispose());
    this.tracks.clear();
    this.masterBus.dispose();
    this.context.close();
    this.isInitialized = false;
    logger.info("AudioEngine: Disposed");
  }
}
export {
  AudioEngine as A
};
