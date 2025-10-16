/**
 * Audio Visualization Components
 *
 * A comprehensive suite of real-time audio visualization components
 * for the Freestyle Studio application.
 *
 * @module Visualizations
 */

// Main dashboard component
export { VisualizationDashboard } from './VisualizationDashboard';
export type { VisualizationDashboardProps } from './VisualizationDashboard';

// Individual visualization components
export { WaveformDisplay } from './WaveformDisplay';
export { PitchDisplay } from './PitchDisplay';
export type { PitchData } from './PitchDisplay';
export { RhythmGrid } from './RhythmGrid';
export type { BeatData } from './RhythmGrid';
export { VolumeMeter } from './VolumeMeter';
export { Spectrogram } from './Spectrogram';
export { RecordingIndicator } from './RecordingIndicator';
