/**
 * Type definitions for Audio Visualization Components
 */

/**
 * Pitch detection data point
 */
export interface PitchData {
  /** Detected frequency in Hz */
  frequency: number;
  /** Musical note name (e.g., "A4", "C#3") */
  note: string;
  /** Cents deviation from perfect pitch (-50 to +50) */
  cents: number;
  /** Detection confidence (0.0 to 1.0) */
  confidence: number;
  /** Timestamp in milliseconds */
  timestamp: number;
}

/**
 * Beat and rhythm timing data
 */
export interface BeatData {
  /** Tempo in beats per minute */
  bpm: number;
  /** Array of beat timestamps in seconds */
  beatTimes: number[];
  /** Current playback time in seconds */
  currentTime: number;
  /** Number of beats per measure (default: 4) */
  beatsPerMeasure?: number;
}

/**
 * Audio analysis configuration
 */
export interface AudioAnalysisConfig {
  /** FFT size for frequency analysis (must be power of 2) */
  fftSize: number;
  /** Smoothing time constant (0 to 1) */
  smoothingTimeConstant: number;
  /** Minimum decibels for visualization range */
  minDecibels: number;
  /** Maximum decibels for visualization range */
  maxDecibels: number;
}

/**
 * Recording configuration
 */
export interface RecordingConfig {
  /** Sample rate in Hz (e.g., 44100, 48000) */
  sampleRate: number;
  /** Number of audio channels (1 = mono, 2 = stereo) */
  channels: number;
  /** Bit depth (8, 16, 24, or 32) */
  bitDepth: number;
}

/**
 * Waveform visualization options
 */
export interface WaveformOptions {
  /** Waveform color (hex, rgb, or named color) */
  color?: string;
  /** Progress/playhead color */
  progressColor?: string;
  /** Cursor color */
  cursorColor?: string;
  /** Bar width in pixels */
  barWidth?: number;
  /** Bar border radius in pixels */
  barRadius?: number;
  /** Gap between bars in pixels */
  barGap?: number;
  /** Height in pixels */
  height?: number;
  /** Whether to normalize waveform amplitude */
  normalize?: boolean;
  /** Enable user interaction (seeking) */
  interact?: boolean;
}

/**
 * Spectrogram color scheme types
 */
export type SpectrogramColorScheme = 'hot' | 'cool' | 'rainbow' | 'grayscale';

/**
 * Volume meter orientation
 */
export type MeterOrientation = 'vertical' | 'horizontal';

/**
 * Visualization view types
 */
export type VisualizationType = 'waveform' | 'pitch' | 'rhythm' | 'spectrum';

/**
 * Theme types
 */
export type Theme = 'dark' | 'light';

/**
 * Audio processing state
 */
export interface AudioProcessingState {
  /** Whether audio is currently being recorded */
  isRecording: boolean;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is paused */
  isPaused: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Current volume level (0.0 to 1.0) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
}

/**
 * Pitch analysis result with additional metadata
 */
export interface PitchAnalysisResult extends PitchData {
  /** Whether the pitch is considered "on pitch" (within tolerance) */
  isOnPitch: boolean;
  /** Target frequency if following a reference */
  targetFrequency?: number;
  /** Harmonic content strength */
  harmonicity?: number;
  /** Voice activity detection (0.0 to 1.0) */
  voiceActivity?: number;
}

/**
 * Beat detection result
 */
export interface BeatDetectionResult {
  /** Detected tempo in BPM */
  tempo: number;
  /** Beat positions in seconds */
  beats: number[];
  /** Beat strength/confidence (0.0 to 1.0) */
  strength: number;
  /** Time signature numerator */
  timeSignatureNumerator: number;
  /** Time signature denominator */
  timeSignatureDenominator: number;
}

/**
 * Frequency band data
 */
export interface FrequencyBand {
  /** Lower frequency bound in Hz */
  minFrequency: number;
  /** Upper frequency bound in Hz */
  maxFrequency: number;
  /** Average amplitude in this band (0.0 to 1.0) */
  amplitude: number;
  /** Label for this band */
  label?: string;
}

/**
 * Audio metrics
 */
export interface AudioMetrics {
  /** RMS (Root Mean Square) level in dB */
  rmsLevel: number;
  /** Peak level in dB */
  peakLevel: number;
  /** Whether audio is clipping */
  isClipping: boolean;
  /** Dynamic range in dB */
  dynamicRange: number;
  /** Spectral centroid (brightness) in Hz */
  spectralCentroid?: number;
  /** Zero crossing rate */
  zeroCrossingRate?: number;
}

/**
 * Visualization performance metrics
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** Average frame time in milliseconds */
  frameTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** Number of active animations */
  activeAnimations: number;
}

/**
 * Error types for visualization components
 */
export const VisualizationError = {
  NO_AUDIO_CONTEXT: 'NO_AUDIO_CONTEXT',
  NO_MICROPHONE_ACCESS: 'NO_MICROPHONE_ACCESS',
  INVALID_AUDIO_BUFFER: 'INVALID_AUDIO_BUFFER',
  CANVAS_NOT_SUPPORTED: 'CANVAS_NOT_SUPPORTED',
  WEB_AUDIO_NOT_SUPPORTED: 'WEB_AUDIO_NOT_SUPPORTED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION'
} as const;

export type VisualizationErrorType = typeof VisualizationError[keyof typeof VisualizationError];

/**
 * Visualization error object
 */
export interface VisualizationErrorInfo {
  /** Error type */
  type: VisualizationErrorType;
  /** Error message */
  message: string;
  /** Original error if available */
  originalError?: Error;
  /** Timestamp of error */
  timestamp: number;
}

/**
 * Canvas drawing context options
 */
export interface CanvasContextOptions {
  /** Enable alpha channel */
  alpha?: boolean;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Color space */
  colorSpace?: 'srgb' | 'display-p3';
  /** Desynchronized rendering */
  desynchronized?: boolean;
}

/**
 * Audio stream constraints
 */
export interface AudioStreamConstraints {
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable automatic gain control */
  autoGainControl?: boolean;
  /** Sample rate */
  sampleRate?: number;
  /** Channel count */
  channelCount?: number;
  /** Latency hint */
  latency?: number | 'interactive' | 'balanced' | 'playback';
}

/**
 * Callback types
 */
export type SeekCallback = (time: number) => void;
export type VolumeChangeCallback = (volume: number) => void;
export type PlaybackStateChangeCallback = (isPlaying: boolean) => void;
export type RecordingStateChangeCallback = (isRecording: boolean) => void;
export type ErrorCallback = (error: VisualizationErrorInfo) => void;

/**
 * Component event handlers
 */
export interface VisualizationEventHandlers {
  onSeek?: SeekCallback;
  onVolumeChange?: VolumeChangeCallback;
  onPlaybackStateChange?: PlaybackStateChangeCallback;
  onRecordingStateChange?: RecordingStateChangeCallback;
  onError?: ErrorCallback;
}
