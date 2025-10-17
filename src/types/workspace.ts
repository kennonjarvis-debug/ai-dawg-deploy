/**
 * Workspace Types - UI Redesign Phase 1
 *
 * Defines the core types for the adaptive workspace system.
 * Supports 4 context-aware modes: Record, Edit, Mix, Learn.
 */

/**
 * WorkspaceMode - The 4 primary modes for the adaptive workspace
 *
 * @record - Vocal-first recording mode with pitch monitoring
 * @edit - Multi-track editing with arrangement view
 * @mix - Mixing console with effects and automation
 * @learn - Educational mode with vocal coaching and exercises
 */
export type WorkspaceMode = 'record' | 'edit' | 'mix' | 'learn';

/**
 * ModeConfig - Configuration for each workspace mode
 * Defines which widgets are visible and the grid layout
 */
export interface ModeConfig {
  mode: WorkspaceMode;
  label: string;
  icon: string;
  description: string;
  gridTemplate: string; // CSS grid-template-areas
  widgets: string[]; // Widget IDs to display in this mode
  keyboardShortcut: string; // Single letter shortcut (R/E/M/L)
}

/**
 * ModeContextValue - The value provided by ModeContext
 */
export interface ModeContextValue {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
  modeConfig: ModeConfig;
}

/**
 * Default mode configurations for each workspace mode
 */
export const MODE_CONFIGS: Record<WorkspaceMode, ModeConfig> = {
  record: {
    mode: 'record',
    label: 'Record',
    icon: 'Mic',
    description: 'Vocal-first recording with real-time pitch monitoring',
    gridTemplate: 'record-mode',
    widgets: ['WaveformDisplay', 'PitchMonitor', 'TransportControls', 'LyricWorkspace', 'LiveCoachingPanel'],
    keyboardShortcut: 'r',
  },
  edit: {
    mode: 'edit',
    label: 'Edit',
    icon: 'Edit3',
    description: 'Multi-track editing and arrangement',
    gridTemplate: 'edit-mode',
    widgets: ['TrackList', 'WaveformDisplay', 'TransportControls', 'SongStructureBuilder', 'AutoCompingTool'],
    keyboardShortcut: 'e',
  },
  mix: {
    mode: 'mix',
    label: 'Mix',
    icon: 'Sliders',
    description: 'Mixing console with effects and automation',
    gridTemplate: 'mix-mode',
    widgets: ['TrackList', 'EQControls', 'VocalEffectsPanel', 'EffectsPanel', 'TransportControls'],
    keyboardShortcut: 'm',
  },
  learn: {
    mode: 'learn',
    label: 'Learn',
    icon: 'BookOpen',
    description: 'Vocal coaching and skill development',
    gridTemplate: 'learn-mode',
    widgets: ['ExerciseLibrary', 'VocalAssessment', 'SkillProgressChart', 'GoalSettingWizard', 'JourneyDashboard'],
    keyboardShortcut: 'l',
  },
};

/**
 * LocalStorage key for persisting workspace mode
 */
export const WORKSPACE_MODE_STORAGE_KEY = 'dawg_workspace_mode';

/**
 * Default workspace mode (shown on first visit)
 */
export const DEFAULT_WORKSPACE_MODE: WorkspaceMode = 'record';
