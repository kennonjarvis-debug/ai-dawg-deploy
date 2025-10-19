/**
 * usePianoRoll - Custom hook for piano roll state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MIDINote,
  MIDIProject,
  PianoRollViewport,
  PianoRollSelection,
  PianoRollTool,
  QuantizeSettings,
  TransportControls,
  quantizeTime,
  humanizeNote,
  PIANO_ROLL_MIN_NOTE,
  PIANO_ROLL_MAX_NOTE,
} from '../../types/midi';
import * as Tone from 'tone';

interface UsePianoRollOptions {
  initialProject?: MIDIProject;
  autoSave?: boolean;
  onSave?: (project: MIDIProject) => void;
}

interface HistoryState {
  past: MIDINote[][];
  future: MIDINote[][];
}

export const usePianoRoll = (options: UsePianoRollOptions = {}) => {
  const { initialProject, autoSave = false, onSave } = options;

  // State
  const [project, setProject] = useState<MIDIProject | null>(initialProject || null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(
    initialProject?.tracks[0]?.id || null
  );

  const [viewport, setViewport] = useState<PianoRollViewport>({
    scrollX: 0,
    scrollY: 0,
    zoomX: 80, // pixels per beat
    zoomY: 16, // pixels per note
    width: 800,
    height: 600,
  });

  const [selection, setSelection] = useState<PianoRollSelection>({
    noteIds: [],
    startBeat: 0,
    endBeat: 0,
    startPitch: PIANO_ROLL_MIN_NOTE,
    endPitch: PIANO_ROLL_MAX_NOTE,
  });

  const [tool, setTool] = useState<PianoRollTool>({
    type: 'select',
    cursor: 'default',
  });

  const [quantize, setQuantize] = useState<QuantizeSettings>({
    enabled: true,
    division: 16, // 16th notes
    strength: 1.0,
    swing: 0,
  });

  const [transport, setTransport] = useState<TransportControls>({
    isPlaying: false,
    isRecording: false,
    currentBeat: 0,
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 16,
    metronomeEnabled: false,
  });

  const [clipboard, setClipboard] = useState<MIDINote[]>([]);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
  });

  // Refs for audio
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const metronomeSynthRef = useRef<Tone.Synth | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Tone.js
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      volume: -8,
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8,
      },
    }).toDestination();

    metronomeSynthRef.current = new Tone.Synth({
      volume: -12,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    }).toDestination();

    return () => {
      synthRef.current?.dispose();
      metronomeSynthRef.current?.dispose();
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Get current track
  const getCurrentTrack = useCallback(() => {
    if (!project || !currentTrackId) return null;
    return project.tracks.find((t) => t.id === currentTrackId) || null;
  }, [project, currentTrackId]);

  // Get current notes
  const getCurrentNotes = useCallback(() => {
    const track = getCurrentTrack();
    return track?.notes || [];
  }, [getCurrentTrack]);

  // Update notes with history
  const updateNotes = useCallback(
    (notes: MIDINote[], addToHistory = true) => {
      if (!project || !currentTrackId) return;

      const currentNotes = getCurrentNotes();

      if (addToHistory) {
        setHistory((prev) => ({
          past: [...prev.past, currentNotes],
          future: [],
        }));
      }

      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.map((track) =>
            track.id === currentTrackId ? { ...track, notes } : track
          ),
        };
      });

      if (autoSave && onSave) {
        onSave({
          ...project,
          tracks: project.tracks.map((track) =>
            track.id === currentTrackId ? { ...track, notes } : track
          ),
        });
      }
    },
    [project, currentTrackId, getCurrentNotes, autoSave, onSave]
  );

  // Add note
  const addNote = useCallback(
    (note: Omit<MIDINote, 'id'>) => {
      const newNote: MIDINote = {
        ...note,
        id: `note-${Date.now()}-${Math.random()}`,
      };

      const notes = getCurrentNotes();
      updateNotes([...notes, newNote]);
    },
    [getCurrentNotes, updateNotes]
  );

  // Delete notes
  const deleteNotes = useCallback(
    (noteIds: string[]) => {
      const notes = getCurrentNotes();
      const filtered = notes.filter((note) => !noteIds.includes(note.id));
      updateNotes(filtered);
    },
    [getCurrentNotes, updateNotes]
  );

  // Copy notes
  const copyNotes = useCallback(() => {
    const notes = getCurrentNotes();
    const selected = notes.filter((note) => selection.noteIds.includes(note.id));
    setClipboard(selected);
  }, [getCurrentNotes, selection.noteIds]);

  // Paste notes
  const pasteNotes = useCallback(() => {
    if (clipboard.length === 0) return;

    const notes = getCurrentNotes();
    const minStartTime = Math.min(...clipboard.map((n) => n.startTime));
    const offset = transport.currentBeat - minStartTime;

    const newNotes = clipboard.map((note) => ({
      ...note,
      id: `note-${Date.now()}-${Math.random()}`,
      startTime: note.startTime + offset,
    }));

    updateNotes([...notes, ...newNotes]);
    setSelection({ ...selection, noteIds: newNotes.map((n) => n.id) });
  }, [clipboard, getCurrentNotes, transport.currentBeat, updateNotes, selection]);

  // Undo
  const undo = useCallback(() => {
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    setHistory({
      past: newPast,
      future: [getCurrentNotes(), ...history.future],
    });

    updateNotes(previous, false);
  }, [history, getCurrentNotes, updateNotes]);

  // Redo
  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, getCurrentNotes()],
      future: newFuture,
    });

    updateNotes(next, false);
  }, [history, getCurrentNotes, updateNotes]);

  // Quantize selected notes
  const quantizeNotes = useCallback(() => {
    const notes = getCurrentNotes();
    const quantized = notes.map((note) => {
      if (!selection.noteIds.includes(note.id)) return note;

      return {
        ...note,
        startTime: quantizeTime(note.startTime, quantize.division, quantize.strength),
        duration: quantizeTime(note.duration, quantize.division, quantize.strength),
      };
    });

    updateNotes(quantized);
  }, [getCurrentNotes, selection.noteIds, quantize, updateNotes]);

  // Humanize selected notes
  const humanizeNotes = useCallback(
    (amount: number = 0.1) => {
      const notes = getCurrentNotes();
      const humanized = notes.map((note) => {
        if (!selection.noteIds.includes(note.id)) return note;
        return humanizeNote(note, amount);
      });

      updateNotes(humanized);
    },
    [getCurrentNotes, selection.noteIds, updateNotes]
  );

  // Playback
  const play = useCallback(async () => {
    if (!project) return;

    await Tone.start();
    Tone.Transport.bpm.value = project.tempo;

    setTransport((prev) => ({ ...prev, isPlaying: true }));

    const notes = getCurrentNotes();
    const startBeat = transport.currentBeat;

    // Schedule notes
    notes.forEach((note) => {
      if (note.startTime >= startBeat) {
        const scheduleTime = `0:${note.startTime}:0`;
        const duration = `0:${note.duration}:0`;
        const frequency = Tone.Frequency(note.pitch, 'midi').toFrequency();

        synthRef.current?.triggerAttackRelease(
          frequency,
          duration,
          scheduleTime,
          note.velocity / 127
        );
      }
    });

    // Metronome
    if (transport.metronomeEnabled && project.timeSignature) {
      const beatsPerMeasure = project.timeSignature.numerator;
      for (let beat = Math.ceil(startBeat); beat < 100; beat++) {
        const isDownbeat = beat % beatsPerMeasure === 0;
        const scheduleTime = `0:${beat}:0`;
        metronomeSynthRef.current?.triggerAttackRelease(
          isDownbeat ? 'C6' : 'C5',
          '32n',
          scheduleTime
        );
      }
    }

    Tone.Transport.start();

    // Update current beat
    const updatePosition = () => {
      const seconds = Tone.Transport.seconds;
      const beat = (seconds * project.tempo) / 60;
      setTransport((prev) => ({ ...prev, currentBeat: beat }));

      if (transport.loopEnabled && beat >= transport.loopEnd) {
        Tone.Transport.position = `0:${transport.loopStart}:0`;
      }

      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };

    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [project, getCurrentNotes, transport]);

  // Pause
  const pause = useCallback(() => {
    Tone.Transport.pause();
    setTransport((prev) => ({ ...prev, isPlaying: false }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Stop
  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setTransport((prev) => ({
      ...prev,
      isPlaying: false,
      isRecording: false,
      currentBeat: 0,
    }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Zoom controls
  const zoomIn = useCallback((axis: 'x' | 'y' | 'both' = 'both') => {
    setViewport((prev) => ({
      ...prev,
      zoomX: axis === 'y' ? prev.zoomX : Math.min(prev.zoomX * 1.2, 200),
      zoomY: axis === 'x' ? prev.zoomY : Math.min(prev.zoomY * 1.2, 40),
    }));
  }, []);

  const zoomOut = useCallback((axis: 'x' | 'y' | 'both' = 'both') => {
    setViewport((prev) => ({
      ...prev,
      zoomX: axis === 'y' ? prev.zoomX : Math.max(prev.zoomX / 1.2, 20),
      zoomY: axis === 'x' ? prev.zoomY : Math.max(prev.zoomY / 1.2, 8),
    }));
  }, []);

  return {
    // State
    project,
    currentTrackId,
    viewport,
    selection,
    tool,
    quantize,
    transport,
    clipboard,
    history,

    // Getters
    getCurrentTrack,
    getCurrentNotes,

    // Setters
    setProject,
    setCurrentTrackId,
    setViewport,
    setSelection,
    setTool,
    setQuantize,
    setTransport,

    // Note operations
    addNote,
    deleteNotes,
    updateNotes,
    copyNotes,
    pasteNotes,

    // Edit operations
    undo,
    redo,
    quantizeNotes,
    humanizeNotes,

    // Playback operations
    play,
    pause,
    stop,

    // View operations
    zoomIn,
    zoomOut,
  };
};
