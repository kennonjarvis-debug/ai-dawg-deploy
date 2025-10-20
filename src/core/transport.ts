/**
 * Core Transport Engine
 * Wrapper around Tone.js Transport with state management
 */

import * as Tone from 'tone';
import { create } from 'zustand';

import { logger } from '$lib/utils/logger';
export type TransportState = 'stopped' | 'playing' | 'paused' | 'recording';

interface TransportStore {
  state: TransportState;
  isPlaying: boolean;
  isPaused: boolean;
  isRecording: boolean;
  position: string; // Time position (bars:beats:sixteenths)
  bpm: number;

  // Actions
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  record: () => Promise<void>;
  stopRecording: () => void;
  setBPM: (bpm: number) => void;
  setPosition: (position: string) => void;
}

export const useTransport = create<TransportStore>((set, get) => ({
  state: 'stopped',
  isPlaying: false,
  isPaused: false,
  isRecording: false,
  position: '0:0:0',
  bpm: 120,

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
