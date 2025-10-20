/**
 * Core Transport Engine
 * Wrapper around Tone.js Transport with state management
 */

import * as Tone from 'tone';
import { create } from 'zustand';

import { logger } from '$lib/utils/logger';
export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

// Pro Tools style record modes
export type RecordMode =
  | 'normal'           // Standard recording
  | 'quick-punch'      // Manual punch in/out on the fly
  | 'track-punch'      // Pre-defined punch in/out times
  | 'loop-record'      // Create new takes on each loop pass
  | 'destructive'      // Overwrite existing audio permanently
  | 'non-destructive'; // Layer recordings (default)

interface TransportStore {
  state: TransportState;
  isPlaying: boolean;
  isPaused: boolean;
  isRecording: boolean;
  position: string; // Time position (bars:beats:sixteenths)
  bpm: number;

  // Record modes (Pro Tools style)
  recordMode: RecordMode;
  punchInTime: number | null;  // Time in seconds for track punch
  punchOutTime: number | null; // Time in seconds for track punch
  loopStart: number | null;    // Loop start time for loop recording
  loopEnd: number | null;      // Loop end time for loop recording

  // Actions
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  record: () => Promise<void>;
  stopRecording: () => void;
  setBPM: (bpm: number) => void;
  setPosition: (position: string) => void;
  goToEnd: () => void;         // Added: missing goToEnd function
  returnToStart: () => void;    // Added: explicit return to start

  // Record mode actions
  setRecordMode: (mode: RecordMode) => void;
  setPunchTimes: (inTime: number, outTime: number) => void;
  setLoopRange: (start: number, end: number) => void;
  quickPunchIn: () => void;    // Manual punch in during playback
  quickPunchOut: () => void;   // Manual punch out during playback
}

export const useTransport = create<TransportStore>((set, get) => ({
  state: 'stopped',
  isPlaying: false,
  isPaused: false,
  isRecording: false,
  position: '0:0:0',
  bpm: 120,

  // Record mode state
  recordMode: 'non-destructive',
  punchInTime: null,
  punchOutTime: null,
  loopStart: null,
  loopEnd: null,

  play: async () => {
    try {
      // Start Tone.js audio context if not started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Start transport
      Tone.Transport.start();

      set({
        state: 'playing',
        isPlaying: true,
        isPaused: false,
      });
    } catch (error) {
      logger.error('Failed to start playback:', error);
    }
  },

  pause: () => {
    Tone.Transport.pause();

    set({
      state: 'paused',
      isPlaying: false,
      isPaused: true,
    });
  },

  stop: () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    set({
      state: 'stopped',
      isPlaying: false,
      isPaused: false,
      isRecording: false,
      position: '0:0:0',
    });
  },

  record: async () => {
    try {
      // Start audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Start transport
      Tone.Transport.start();

      set({
        state: 'recording',
        isPlaying: true,
        isRecording: true,
      });
    } catch (error) {
      logger.error('Failed to start recording:', error);
    }
  },

  stopRecording: () => {
    const { stop } = get();
    set({ isRecording: false });
    stop();
  },

  setBPM: (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
    set({ bpm });
  },

  setPosition: (position: string) => {
    Tone.Transport.position = position;
    set({ position });
  },

  // Navigation functions
  goToEnd: () => {
    // Get the total duration from the transport or use a default max
    const totalDuration = Tone.Transport.loopEnd || Tone.Transport.seconds + 60;
    Tone.Transport.seconds = typeof totalDuration === 'number' ? totalDuration : 0;
    set({ position: Tone.Transport.position.toString().split('.')[0] });
    logger.info('[Transport] Moved to end');
  },

  returnToStart: () => {
    Tone.Transport.position = 0;
    Tone.Transport.seconds = 0;
    set({ position: '0:0:0' });
    logger.info('[Transport] Returned to start');
  },

  // Record mode management
  setRecordMode: (mode: RecordMode) => {
    set({ recordMode: mode });
    logger.info(`[Transport] Record mode set to: ${mode}`);
  },

  setPunchTimes: (inTime: number, outTime: number) => {
    if (inTime >= outTime) {
      logger.warn('[Transport] Punch in time must be before punch out time');
      return;
    }
    set({ punchInTime: inTime, punchOutTime: outTime });
    logger.info(`[Transport] Punch times set: ${inTime}s - ${outTime}s`);
  },

  setLoopRange: (start: number, end: number) => {
    if (start >= end) {
      logger.warn('[Transport] Loop start must be before loop end');
      return;
    }
    set({ loopStart: start, loopEnd: end });
    Tone.Transport.loopStart = start;
    Tone.Transport.loopEnd = end;
    Tone.Transport.loop = true;
    logger.info(`[Transport] Loop range set: ${start}s - ${end}s`);
  },

  quickPunchIn: () => {
    const { state, recordMode } = get();
    if (state === 'playing' && recordMode === 'quick-punch') {
      set({ isRecording: true, state: 'recording' });
      logger.info('[Transport] Quick punch in');
    }
  },

  quickPunchOut: () => {
    const { state, recordMode } = get();
    if (state === 'recording' && recordMode === 'quick-punch') {
      set({ isRecording: false, state: 'playing' });
      logger.info('[Transport] Quick punch out');
    }
  },
}));

// Update position at 60fps when playing
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useTransport.getState();
    if (store.isPlaying) {
      useTransport.setState({
        position: Tone.Transport.position.toString().split('.')[0], // Format as bars:beats:sixteenths
      });
    }
  }, 1000 / 60);
}

/**
 * Initialize transport with default settings
 */
export function initializeTransport(bpm: number = 120) {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.timeSignature = 4;
  Tone.Transport.swing = 0;
  Tone.Transport.swingSubdivision = '8n';

  useTransport.setState({ bpm });
}

/**
 * Get current transport time in seconds
 */
export function getTransportTime(): number {
  return Tone.Transport.seconds;
}

/**
 * Get current transport position as bars:beats:sixteenths
 */
export function getTransportPosition(): string {
  const position = Tone.Transport.position.toString().split('.')[0];
  return position ?? '0:0:0';
}
