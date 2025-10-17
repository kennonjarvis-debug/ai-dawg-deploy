import { create } from 'zustand';
import { Track, Recording, PlaybackState } from '@/types/audio';

interface AudioStore {
  // Tracks
  tracks: Track[];
  activeTrackId: string | null;

  // Playback
  playback: PlaybackState;

  // Actions
  addTrack: (name: string, type: Track['type']) => string;
  removeTrack: (trackId: string) => void;
  setActiveTrack: (trackId: string | null) => void;

  // Recording actions
  addRecording: (trackId: string, recording: Recording) => void;
  removeRecording: (trackId: string, recordingId: string) => void;
  setActiveRecording: (trackId: string, recordingId: string | null) => void;

  // Track controls
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;

  // Playback controls
  setPlayback: (state: Partial<PlaybackState>) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Initial state
  tracks: [
    {
      id: 'track-1',
      name: 'Track 1',
      type: 'vocal',
      recordings: [],
      activeRecordingId: null,
      volume: 0.75,
      pan: 0,
      muted: false,
      solo: false,
      effects: [],
    },
  ],
  activeTrackId: 'track-1',
  playback: {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
  },

  // Track actions
  addTrack: (name, type) => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name,
      type,
      recordings: [],
      activeRecordingId: null,
      volume: 0.75,
      pan: 0,
      muted: false,
      solo: false,
      effects: [],
    };

    set((state) => ({
      tracks: [...state.tracks, newTrack],
      activeTrackId: newTrack.id,
    }));

    return newTrack.id;
  },

  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      activeTrackId:
        state.activeTrackId === trackId ? state.tracks[0]?.id || null : state.activeTrackId,
    }));
  },

  setActiveTrack: (trackId) => {
    set({ activeTrackId: trackId });
  },

  // Recording actions
  addRecording: (trackId, recording) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              recordings: [...track.recordings, recording],
              activeRecordingId: recording.id,
            }
          : track
      ),
    }));
  },

  removeRecording: (trackId, recordingId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              recordings: track.recordings.filter((r) => r.id !== recordingId),
              activeRecordingId:
                track.activeRecordingId === recordingId ? null : track.activeRecordingId,
            }
          : track
      ),
    }));
  },

  setActiveRecording: (trackId, recordingId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, activeRecordingId: recordingId } : track
      ),
    }));
  },

  // Track controls
  setTrackVolume: (trackId, volume) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, volume: Math.max(0, Math.min(1, volume)) } : track
      ),
    }));
  },

  setTrackPan: (trackId, pan) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, pan: Math.max(-1, Math.min(1, pan)) } : track
      ),
    }));
  },

  toggleTrackMute: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      ),
    }));
  },

  toggleTrackSolo: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === trackId ? { ...track, solo: !track.solo } : track
      ),
    }));
  },

  // Playback controls
  setPlayback: (playbackState) => {
    set((state) => ({
      playback: { ...state.playback, ...playbackState },
    }));
  },

  play: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: true, isPaused: false },
    }));
  },

  pause: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: false, isPaused: true },
    }));
  },

  stop: () => {
    set((state) => ({
      playback: { ...state.playback, isPlaying: false, isPaused: false, currentTime: 0 },
    }));
  },

  seek: (time) => {
    set((state) => ({
      playback: { ...state.playback, currentTime: time },
    }));
  },
}));
