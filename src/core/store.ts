/**
 * Track Store
 * Zustand store for managing tracks and recordings
 */

import { create } from 'zustand';
import { Track, Recording, getRandomTrackColor } from './types';

interface TrackStore {
  tracks: Track[];
  activeTrackId: string | null;
  onTrackChange: (() => void) | null;

  // Track actions
  addTrack: (type: 'audio' | 'midi') => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setActiveTrack: (trackId: string | null) => void;
  duplicateTrack: (trackId: string) => void;
  setTracks: (tracks: Track[]) => void;
  setOnTrackChange: (callback: (() => void) | null) => void;

  // Track controls
  toggleSolo: (trackId: string) => void;
  toggleMute: (trackId: string) => void;
  toggleRecordArm: (trackId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  setPan: (trackId: string, pan: number) => void;
  setInputDevice: (trackId: string, deviceId: string) => void;
  setOutputDevice: (trackId: string, deviceId: string) => void;

  // Recording actions
  addRecording: (trackId: string, recording: Recording) => void;
  removeRecording: (trackId: string, recordingId: string) => void;
  updateRecording: (trackId: string, recordingId: string, updates: Partial<Recording>) => void;
  setActiveRecording: (trackId: string, recordingId: string) => void;
}

export const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [],
  activeTrackId: null,
  onTrackChange: null,

  setTracks: (tracks) => {
    set({ tracks });
    get().onTrackChange?.();
  },

  setOnTrackChange: (callback) => {
    set({ onTrackChange: callback });
  },

  addTrack: (type) => {
    const trackNumber = get().tracks.length + 1;
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `${type === 'audio' ? 'Audio' : 'MIDI'} ${trackNumber}`,
      type,
      color: getRandomTrackColor(),
      volume: 75,
      pan: 0,
      solo: false,
      mute: false,
      recordArm: false,
      recordings: [],
      createdAt: new Date(),
    };

    set((state) => ({
      tracks: [...state.tracks, newTrack],
      activeTrackId: newTrack.id,
    }));
    get().onTrackChange?.();
  },

  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      activeTrackId: state.activeTrackId === trackId ? null : state.activeTrackId,
    }));
    get().onTrackChange?.();
  },

  updateTrack: (trackId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }));
    get().onTrackChange?.();
  },

  setActiveTrack: (trackId) => {
    set({ activeTrackId: trackId });
  },

  duplicateTrack: (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    if (!track) return;

    const duplicatedTrack: Track = {
      ...track,
      id: `track-${Date.now()}`,
      name: `${track.name} (Copy)`,
      recordings: [...track.recordings],
      createdAt: new Date(),
    };

    set((state) => ({
      tracks: [...state.tracks, duplicatedTrack],
    }));
  },

  toggleSolo: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    }));
  },

  toggleMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, mute: !t.mute } : t
      ),
    }));
  },

  toggleRecordArm: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, recordArm: !t.recordArm } : t
      ),
    }));
  },

  setVolume: (trackId, volume) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, volume } : t
      ),
    }));
  },

  setPan: (trackId, pan) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, pan } : t
      ),
    }));
  },

  setInputDevice: (trackId, deviceId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, inputDeviceId: deviceId } : t
      ),
    }));
  },

  setOutputDevice: (trackId, deviceId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, outputDeviceId: deviceId } : t
      ),
    }));
  },

  addRecording: (trackId, recording) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              recordings: [...t.recordings, recording],
              activeRecordingId: recording.id,
            }
          : t
      ),
    }));
    get().onTrackChange?.();
  },

  removeRecording: (trackId, recordingId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              recordings: t.recordings.filter((r) => r.id !== recordingId),
              activeRecordingId:
                t.activeRecordingId === recordingId ? undefined : t.activeRecordingId,
            }
          : t
      ),
    }));
    get().onTrackChange?.();
  },

  updateRecording: (trackId, recordingId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              recordings: t.recordings.map((r) =>
                r.id === recordingId ? { ...r, ...updates } : r
              ),
            }
          : t
      ),
    }));
    get().onTrackChange?.();
  },

  setActiveRecording: (trackId, recordingId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, activeRecordingId: recordingId } : t
      ),
    }));
  },
}));
