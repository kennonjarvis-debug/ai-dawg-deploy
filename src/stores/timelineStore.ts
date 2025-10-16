import { create } from 'zustand';
import type { ChannelStrip } from '../audio/routing/types';
import type { SectionMarker } from '../ui/components/SectionMarkers';

export type EditMode = 'slip' | 'grid' | 'shuffle' | 'spot';

export interface Playlist {
  id: string;
  name: string;
  clips: Clip[];
}

export interface Track {
  id: string;
  name: string;
  color: string;
  height: number;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  inputMonitoring: 'auto' | 'input-only' | 'off';
  inputSource: string;
  inputLevel: number; // 0-1 for level metering
  clips: Clip[]; // Active playlist clips
  playlists: Playlist[]; // Pro Tools-style playlists
  activePlaylistId: string; // Currently active playlist

  // Logic Pro X channel strip (optional for backward compatibility)
  channelStrip?: ChannelStrip;
}

export interface Clip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  trackId: string;
  color?: string;
  audioBuffer?: AudioBuffer; // Recorded audio data
  waveformData?: Float32Array; // Pre-computed waveform for visualization
  audioUrl?: string; // URL to audio file (for playback)
  audioFileId?: string; // Backend audio file ID for processing
  fadeIn?: number; // Fade in duration in seconds
  fadeOut?: number; // Fade out duration in seconds
  gain?: number; // Gain in dB
}

export interface TimelineState {
  // Timeline settings
  zoom: number; // pixels per second
  scrollX: number; // horizontal scroll position
  scrollY: number; // vertical scroll position
  scrollPosition: number; // unified scroll position

  // Grid settings
  snapToGrid: boolean;
  gridSize: number; // in beats

  // Edit mode
  editMode: EditMode;

  // Tracks and clips
  tracks: Track[];
  selectedClipIds: string[];
  selectedTrackIds: string[];

  // Section markers
  sectionMarkers: SectionMarker[];

  // Actions
  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  setScrollY: (scrollY: number) => void;
  setScrollPosition: (position: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setEditMode: (mode: EditMode) => void;

  // Track management
  addTrack: (name: string) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setSelectedTracks: (trackIds: string[]) => void;

  // Clip management
  addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClip: (clipId: string, addToSelection?: boolean) => void;
  setSelectedClips: (clipIds: string[]) => void;
  clearSelection: () => void;

  // Playlist management
  createPlaylist: (trackId: string, name: string) => void;
  deletePlaylist: (trackId: string, playlistId: string) => void;
  activatePlaylist: (trackId: string, playlistId: string) => void;
  duplicatePlaylist: (trackId: string, playlistId: string, newName: string) => void;
  addClipToPlaylist: (trackId: string, playlistId: string, clip: Omit<Clip, 'id' | 'trackId'>) => void;

  // Section marker management
  addSectionMarker: (marker: Omit<SectionMarker, 'id'>) => void;
  deleteSectionMarker: (markerId: string) => void;
  updateSectionMarker: (markerId: string, updates: Partial<SectionMarker>) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  // Initial state
  zoom: 100, // 100 pixels per second
  scrollX: 0,
  scrollY: 0,
  scrollPosition: 0,
  snapToGrid: true,
  gridSize: 1, // 1 beat
  editMode: 'slip', // Default to slip mode
  tracks: [],
  selectedClipIds: [],
  selectedTrackIds: [],
  sectionMarkers: [],

  // Actions
  setZoom: (zoom: number) => {
    set({ zoom: Math.max(10, Math.min(1000, zoom)) });
  },

  setScrollX: (scrollX: number) => {
    set({ scrollX: Math.max(0, scrollX) });
  },

  setScrollY: (scrollY: number) => {
    set({ scrollY: Math.max(0, scrollY) });
  },

  setScrollPosition: (position: number) => {
    set({ scrollPosition: Math.max(0, position) });
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  setGridSize: (size: number) => {
    set({ gridSize: Math.max(0.25, size) });
  },

  setEditMode: (mode: EditMode) => {
    set({ editMode: mode });
  },

  // Track management
  addTrack: (name: string) => {
    const defaultPlaylistId = `playlist-${Date.now()}`;
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      height: 120,
      volume: 0.75,
      pan: 0,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      inputMonitoring: 'auto',
      inputSource: '1-2',
      inputLevel: 0,
      clips: [],
      playlists: [
        {
          id: defaultPlaylistId,
          name: 'Main',
          clips: [],
        },
      ],
      activePlaylistId: defaultPlaylistId,
    };
    set((state) => ({ tracks: [...state.tracks, newTrack] }));
  },

  removeTrack: (trackId: string) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      selectedClipIds: state.selectedClipIds.filter(
        (id) => !state.tracks.find((t) => t.id === trackId)?.clips.some((c) => c.id === id)
      ),
    }));
  },

  updateTrack: (trackId: string, updates: Partial<Track>) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    }));
  },

  setSelectedTracks: (trackIds: string[]) => {
    set({ selectedTrackIds: trackIds });
  },

  // Clip management
  addClip: (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => {
    const newClip: Clip = {
      fadeIn: 0,
      fadeOut: 0,
      gain: 0,
      ...clip,
      id: `clip-${Date.now()}`,
      trackId,
    };
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
      ),
    }));
  },

  removeClip: (clipId: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      })),
      selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
    }));
  },

  updateClip: (clipId: string, updates: Partial<Clip>) => {
    set((state) => ({
      tracks: state.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      })),
    }));
  },

  selectClip: (clipId: string, addToSelection = false) => {
    set((state) => ({
      selectedClipIds: addToSelection
        ? [...state.selectedClipIds, clipId]
        : [clipId],
    }));
  },

  setSelectedClips: (clipIds: string[]) => {
    set({ selectedClipIds: clipIds });
  },

  clearSelection: () => {
    set({ selectedClipIds: [] });
  },

  // Playlist management
  createPlaylist: (trackId: string, name: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? {
              ...t,
              playlists: [
                ...t.playlists,
                {
                  id: `playlist-${Date.now()}`,
                  name,
                  clips: [],
                },
              ],
            }
          : t
      ),
    }));
  },

  deletePlaylist: (trackId: string, playlistId: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const remainingPlaylists = t.playlists.filter((p) => p.id !== playlistId);

        // If deleting active playlist, switch to first remaining playlist
        const newActiveId =
          t.activePlaylistId === playlistId && remainingPlaylists.length > 0
            ? remainingPlaylists[0].id
            : t.activePlaylistId;

        const activePlaylist = remainingPlaylists.find((p) => p.id === newActiveId);

        return {
          ...t,
          playlists: remainingPlaylists,
          activePlaylistId: newActiveId,
          clips: activePlaylist ? [...activePlaylist.clips] : [],
        };
      }),
    }));
  },

  activatePlaylist: (trackId: string, playlistId: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const selectedPlaylist = t.playlists.find((p) => p.id === playlistId);
        if (!selectedPlaylist) return t;

        return {
          ...t,
          activePlaylistId: playlistId,
          clips: [...selectedPlaylist.clips],
        };
      }),
    }));
  },

  duplicatePlaylist: (trackId: string, playlistId: string, newName: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const sourcePlaylist = t.playlists.find((p) => p.id === playlistId);
        if (!sourcePlaylist) return t;

        const duplicatedPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          name: newName,
          clips: sourcePlaylist.clips.map((clip) => ({
            ...clip,
            id: `clip-${Date.now()}-${Math.random()}`,
          })),
        };

        return {
          ...t,
          playlists: [...t.playlists, duplicatedPlaylist],
        };
      }),
    }));
  },

  addClipToPlaylist: (trackId: string, playlistId: string, clip: Omit<Clip, 'id' | 'trackId'>) => {
    const newClip: Clip = {
      fadeIn: 0,
      fadeOut: 0,
      gain: 0,
      ...clip,
      id: `clip-${Date.now()}`,
      trackId,
    };

    set((state) => ({
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;

        const updatedPlaylists = t.playlists.map((p) =>
          p.id === playlistId ? { ...p, clips: [...p.clips, newClip] } : p
        );

        // If adding to active playlist, update main clips array too
        const updatedClips =
          playlistId === t.activePlaylistId ? [...t.clips, newClip] : t.clips;

        return {
          ...t,
          playlists: updatedPlaylists,
          clips: updatedClips,
        };
      }),
    }));
  },

  // Section marker management
  addSectionMarker: (marker: Omit<SectionMarker, 'id'>) => {
    const newMarker: SectionMarker = {
      ...marker,
      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    set((state) => ({
      sectionMarkers: [...state.sectionMarkers, newMarker],
    }));
  },

  deleteSectionMarker: (markerId: string) => {
    set((state) => ({
      sectionMarkers: state.sectionMarkers.filter((m) => m.id !== markerId),
    }));
  },

  updateSectionMarker: (markerId: string, updates: Partial<SectionMarker>) => {
    set((state) => ({
      sectionMarkers: state.sectionMarkers.map((m) =>
        m.id === markerId ? { ...m, ...updates } : m
      ),
    }));
  },
}));
