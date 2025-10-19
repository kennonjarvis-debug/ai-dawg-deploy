/**
 * DAW UI Store - Zustand State Management
 * Manages DAW dashboard UI state (panels, modals, progress, etc.)
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AIProcessingJob, MusicGenerationProgress } from '../ui/components';

export interface UpsellState {
  open: boolean;
  feature?: string;
  plan?: string;
  upgrade_url?: string | null;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  step: string;
}

interface DawUiState {
  // Panel visibility
  activePanel: 'vocal-coach' | 'producer' | null;
  showSettings: boolean;
  showAIHub: boolean;
  showAuxTrackDialog: boolean;
  showAiModal: boolean;

  // Save state
  lastSaved: Date | null;
  isSaving: boolean;

  // Menu state
  openMenu: string | null;

  // AI & Processing
  aiJobs: AIProcessingJob[];
  musicGenProgress: MusicGenerationProgress | null;
  uploadProgress: UploadProgress | null;

  // Upsell & Plan
  upsell: UpsellState;
  planBadge: string;

  // Project settings
  genre: string;
  lyrics: string;

  // Widget state
  expandedWidget: 'ai' | 'lyrics' | 'balanced';

  // Flash notifications
  flashFeature: 'voice-memo' | 'music-gen' | null;

  // Actions - Panel visibility
  setActivePanel: (panel: 'vocal-coach' | 'producer' | null) => void;
  setShowSettings: (show: boolean) => void;
  setShowAIHub: (show: boolean) => void;
  setShowAuxTrackDialog: (show: boolean) => void;
  setShowAiModal: (show: boolean) => void;

  // Actions - Save state
  setLastSaved: (date: Date | null) => void;
  setIsSaving: (saving: boolean) => void;

  // Actions - Menu
  setOpenMenu: (menu: string | null) => void;

  // Actions - AI & Processing
  setAiJobs: (jobs: AIProcessingJob[]) => void;
  addAiJob: (job: AIProcessingJob) => void;
  removeAiJob: (jobId: string) => void;
  updateAiJob: (jobId: string, updates: Partial<AIProcessingJob>) => void;
  setMusicGenProgress: (progress: MusicGenerationProgress | null) => void;
  setUploadProgress: (progress: UploadProgress | null) => void;

  // Actions - Upsell & Plan
  setUpsell: (upsell: UpsellState) => void;
  setPlanBadge: (badge: string) => void;

  // Actions - Project settings
  setGenre: (genre: string) => void;
  setLyrics: (lyrics: string) => void;

  // Actions - Widget
  setExpandedWidget: (widget: 'ai' | 'lyrics' | 'balanced') => void;

  // Actions - Flash
  setFlashFeature: (feature: 'voice-memo' | 'music-gen' | null) => void;

  // Utility
  reset: () => void;
}

const initialState = {
  activePanel: null,
  showSettings: false,
  showAIHub: false,
  showAuxTrackDialog: false,
  showAiModal: false,
  lastSaved: null,
  isSaving: false,
  openMenu: null,
  aiJobs: [],
  musicGenProgress: null,
  uploadProgress: null,
  upsell: { open: false },
  planBadge: '',
  genre: 'pop',
  lyrics: '',
  expandedWidget: 'balanced' as const,
  flashFeature: null,
};

export const useDawUiStore = create<DawUiState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Panel visibility actions
      setActivePanel: (panel) => set({ activePanel: panel }),
      setShowSettings: (show) => set({ showSettings: show }),
      setShowAIHub: (show) => set({ showAIHub: show }),
      setShowAuxTrackDialog: (show) => set({ showAuxTrackDialog: show }),
      setShowAiModal: (show) => set({ showAiModal: show }),

      // Save state actions
      setLastSaved: (date) => set({ lastSaved: date }),
      setIsSaving: (saving) => set({ isSaving: saving }),

      // Menu actions
      setOpenMenu: (menu) => set({ openMenu: menu }),

      // AI & Processing actions
      setAiJobs: (jobs) => set({ aiJobs: jobs }),
      addAiJob: (job) =>
        set((state) => ({ aiJobs: [...state.aiJobs, job] })),
      removeAiJob: (jobId) =>
        set((state) => ({
          aiJobs: state.aiJobs.filter((job) => job.id !== jobId),
        })),
      updateAiJob: (jobId, updates) =>
        set((state) => ({
          aiJobs: state.aiJobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          ),
        })),
      setMusicGenProgress: (progress) => set({ musicGenProgress: progress }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),

      // Upsell & Plan actions
      setUpsell: (upsell) => set({ upsell }),
      setPlanBadge: (badge) => set({ planBadge: badge }),

      // Project settings actions
      setGenre: (genre) => set({ genre }),
      setLyrics: (lyrics) => set({ lyrics }),

      // Widget actions
      setExpandedWidget: (widget) => set({ expandedWidget: widget }),

      // Flash actions
      setFlashFeature: (feature) => set({ flashFeature: feature }),

      // Utility
      reset: () => set(initialState),
    }),
    { name: 'DawUiStore' }
  )
);

// Selectors for common use cases
export const useActivePanel = () => useDawUiStore((state) => state.activePanel);
export const useShowSettings = () => useDawUiStore((state) => state.showSettings);
export const useShowAIHub = () => useDawUiStore((state) => state.showAIHub);
export const useAiJobs = () => useDawUiStore((state) => state.aiJobs);
export const useUpsell = () => useDawUiStore((state) => state.upsell);
export const useLyrics = () => useDawUiStore((state) => state.lyrics);
export const useExpandedWidget = () => useDawUiStore((state) => state.expandedWidget);
export const useMusicGenProgress = () => useDawUiStore((state) => state.musicGenProgress);
