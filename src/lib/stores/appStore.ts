/**
 * Application Store
 * Central state management integrating Audio Engine, Cloud Storage, and UI
 */

import { writable, derived, get } from 'svelte/store';
import { AudioEngine } from '$lib/audio/AudioEngine';
import { projectAPI, type Project, type ProjectData } from '$lib/api/ProjectAPI';
import { EventBus } from '$lib/events/eventBus';
import type { UUID } from '$lib/types/core';

import { logger } from '$lib/utils/logger';
interface AppState {
  // Audio Engine
  audioEngine: AudioEngine | null;
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  tempo: number;
  timeSignature: [number, number];

  // Project
  currentProject: Project | null;
  projectId: UUID | null;
  projectName: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // UI State
  currentView: 'arrangement' | 'mixer' | 'browser';
  selectedTrackId: UUID | null;

  // Status
  isInitialized: boolean;
  error: string | null;
}

const initialState: AppState = {
  audioEngine: null,
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  tempo: 120,
  timeSignature: [4, 4],

  currentProject: null,
  projectId: null,
  projectName: 'Untitled Project',
  hasUnsavedChanges: false,
  isSaving: false,
  lastSaved: null,

  currentView: 'arrangement',
  selectedTrackId: null,

  isInitialized: false,
  error: null
};

function createAppStore() {
  const { subscribe, set, update } = writable<AppState>(initialState);

  let autoSaveInterval: number | null = null;

  // Initialize audio engine
  async function initializeAudioEngine() {
    try {
      const engine = AudioEngine.getInstance({
        sampleRate: 48000,
        latencyHint: 'interactive',
        lookAhead: 0.1
      });

      await engine.initialize();

      // Auto-resume audio context in test/dev mode (bypasses user interaction requirement)
      if (import.meta.env?.DEV || import.meta.env?.MODE === 'test') {
        try {
          await engine.context.resume();
          logger.info('✅ Audio engine auto-initialized for testing');
        } catch (err) {
          logger.warn('Auto-resume failed (may still need user interaction):', err);
        }
      }

      update(state => ({
        ...state,
        audioEngine: engine,
        isInitialized: true,
        tempo: engine.getTempo()
      }));

      // Set up event listeners
      setupEventListeners(engine);

      // Start auto-save (every 30 seconds)
      startAutoSave();

      return engine;
    } catch (error) {
      logger.error('Failed to initialize audio engine:', error);
      update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Failed to initialize audio'
      }));
      throw error;
    }
  }

  function setupEventListeners(engine: AudioEngine) {
    const eventBus = EventBus.getInstance();

    // Listen for transport changes
    eventBus.on('playback:play', () => {
      update(state => ({ ...state, isPlaying: true }));
    });

    eventBus.on('playback:stop', () => {
      update(state => ({ ...state, isPlaying: false }));
    });

    eventBus.on('playback:pause', () => {
      update(state => ({ ...state, isPlaying: false }));
    });

    // Track changes mark project as unsaved
    eventBus.on('track:created', () => markUnsaved());
    eventBus.on('track:deleted', () => markUnsaved());
    eventBus.on('track:updated', () => markUnsaved());
  }

  // Transport controls
  function play() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.play();
      update(s => ({ ...s, isPlaying: true }));
    }
  }

  function stop() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.stop();
      update(s => ({ ...s, isPlaying: false }));
    }
  }

  function pause() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.pause();
      update(s => ({ ...s, isPlaying: false }));
    }
  }

  function setTempo(bpm: number) {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.setTempo(bpm);
      update(s => ({ ...s, tempo: bpm, hasUnsavedChanges: true }));
    }
  }

  // Project management
  async function newProject(name?: string) {
    const projectName = name || 'Untitled Project';

    update(state => ({
      ...state,
      currentProject: null,
      projectId: null,
      projectName,
      hasUnsavedChanges: false,
      lastSaved: null
    }));

    // Reset audio engine
    const state = get({ subscribe });
    if (state.audioEngine) {
      // Clear all tracks
      const tracks = state.audioEngine.getAllTracks();
      tracks.forEach(track => state.audioEngine!.removeTrack(track.id));
    }

    return { success: true };
  }

  async function saveProject(): Promise<{ success: boolean; error?: string }> {
    update(state => ({ ...state, isSaving: true, error: null }));

    try {
      const state = get({ subscribe });

      if (!state.audioEngine) {
        throw new Error('Audio engine not initialized');
      }

      // Serialize project data
      const projectData = serializeProject(state.audioEngine);

      let project: Project;

      if (state.projectId) {
        // Update existing project
        project = await projectAPI.updateProject(
          state.projectId,
          state.projectName,
          projectData
        );
      } else {
        // Create new project
        project = await projectAPI.saveProject(state.projectName, projectData);
      }

      update(state => ({
        ...state,
        currentProject: project,
        projectId: project.id,
        hasUnsavedChanges: false,
        isSaving: false,
        lastSaved: new Date()
      }));

      EventBus.getInstance().emit('project:saved', { projectId: project.id });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save project';
      update(state => ({
        ...state,
        isSaving: false,
        error: message
      }));
      return { success: false, error: message };
    }
  }

  async function loadProject(projectId: UUID): Promise<{ success: boolean; error?: string }> {
    try {
      const project = await projectAPI.loadProject(projectId);

      update(state => ({
        ...state,
        currentProject: project,
        projectId: project.id,
        projectName: project.name,
        hasUnsavedChanges: false,
        lastSaved: new Date(project.updated_at)
      }));

      // Load project data into audio engine
      const state = get({ subscribe });
      if (state.audioEngine && project.data) {
        await deserializeProject(state.audioEngine, project.data);

        if (project.data.tempo) {
          setTempo(project.data.tempo);
        }
      }

      EventBus.getInstance().emit('project:loaded', { projectId: project.id });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load project';
      update(state => ({ ...state, error: message }));
      return { success: false, error: message };
    }
  }

  function serializeProject(engine: AudioEngine): ProjectData {
    const tracks = engine.getAllTracks();

    return {
      tracks: tracks.map(track => ({
        id: track.id,
        name: track.name,
        type: track.type,
        color: track.color,
        order: 0,
        settings: {
          volume: track.getVolume(),
          pan: track.getPan(),
          mute: track.isMuted(),
          solo: track.isSoloed(),
          recordArm: false,
          monitor: false,
          frozen: false,
          input: 'default',
          output: 'master'
        }
      })),
      tempo: engine.getTempo(),
      timeSignature: [4, 4],
      effects: [],
      clips: []
    };
  }

  async function deserializeProject(engine: AudioEngine, data: ProjectData) {
    // Clear existing tracks
    const existingTracks = engine.getAllTracks();
    existingTracks.forEach(track => engine.removeTrack(track.id));

    // Create tracks from saved data
    if (data.tracks) {
      for (const trackData of data.tracks) {
        const track = engine.addTrack({
          id: trackData.id,
          name: trackData.name,
          type: trackData.type as 'audio' | 'midi' | 'aux',
          color: trackData.color
        });

        if (trackData.settings) {
          track.setVolume(trackData.settings.volume);
          track.setPan(trackData.settings.pan);
          track.setMute(trackData.settings.mute);
          track.setSolo(trackData.settings.solo);
        }
      }
    }
  }

  function markUnsaved() {
    update(state => ({ ...state, hasUnsavedChanges: true }));
  }

  function setProjectName(name: string) {
    update(state => ({
      ...state,
      projectName: name,
      hasUnsavedChanges: true
    }));
  }

  // Auto-save
  function startAutoSave() {
    if (autoSaveInterval) return;

    autoSaveInterval = window.setInterval(async () => {
      const state = get({ subscribe });
      if (state.hasUnsavedChanges && state.projectId) {
        logger.info('Auto-saving project...');
        await saveProject();
      }
    }, 30000); // Every 30 seconds
  }

  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  // UI State
  function setView(view: 'arrangement' | 'mixer' | 'browser') {
    update(state => ({ ...state, currentView: view }));
  }

  function selectTrack(trackId: UUID | null) {
    update(state => ({ ...state, selectedTrackId: trackId }));
    EventBus.getInstance().emit('track:selected', { trackId });
  }

  function clearError() {
    update(state => ({ ...state, error: null }));
  }

  // Cleanup
  function cleanup() {
    stopAutoSave();
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.dispose();
    }
  }

  return {
    subscribe,

    // Initialization
    initializeAudioEngine,

    // Transport
    play,
    stop,
    pause,
    setTempo,

    // Project
    newProject,
    saveProject,
    loadProject,
    setProjectName,

    // UI
    setView,
    selectTrack,
    clearError,

    // Cleanup
    cleanup
  };
}

export const appStore = createAppStore();

// Derived stores
export const audioEngine = derived(appStore, $app => $app.audioEngine);
export const isPlaying = derived(appStore, $app => $app.isPlaying);
export const currentProject = derived(appStore, $app => $app.currentProject);
export const hasUnsavedChanges = derived(appStore, $app => $app.hasUnsavedChanges);
export const projectName = derived(appStore, $app => $app.projectName);
