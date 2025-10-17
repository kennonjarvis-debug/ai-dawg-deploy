/**
 * Audio Visualizers
 *
 * High-performance canvas-based audio visualizations
 * - 60fps rendering with requestAnimationFrame
 * - Web Audio API integration
 * - Real-time audio analysis
 * - Optimized for <10ms render times
 */

// Core visualizer classes (for advanced usage)
export { AudioVisualizer } from './AudioVisualizer';
export type { AudioVisualizerConfig } from './AudioVisualizer';

export { MeterViz } from './MeterViz';
export type { MeterVizConfig } from './MeterViz';

export { WaveformViz } from './WaveformViz';
export type { WaveformVizConfig, WaveformStyle } from './WaveformViz';

export { SpectrumViz } from './SpectrumViz';
export type { SpectrumVizConfig, SpectrumStyle, FrequencyScale } from './SpectrumViz';

export { PitchViz } from './PitchViz';
export type { PitchVizConfig, PitchData } from './PitchViz';

export { EQCurveViz } from './EQCurveViz';
export type { EQCurveVizConfig, EQCurveParams, EQBandParams } from './EQCurveViz';

// React components (recommended for widget usage)
export { Meter } from './components/Meter';
export type { MeterProps } from './components/Meter';

export { Waveform } from './components/Waveform';
export type { WaveformProps } from './components/Waveform';

export { Spectrum } from './components/Spectrum';
export type { SpectrumProps } from './components/Spectrum';

export { Pitch } from './components/Pitch';
export type { PitchProps } from './components/Pitch';

export { EQCurve } from './components/EQCurve';
export type { EQCurveProps } from './components/EQCurve';
