/**
 * Audio-related TypeScript type definitions
 * Provides strong typing for audio processing, effects, and analysis
 */

import type * as Tone from 'tone';

// ============================================================================
// Audio Buffer & Data Types
// ============================================================================

export interface AudioBuffer {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioData {
  buffer: AudioBuffer;
  sampleRate: number;
  channels: number;
  duration: number;
}

export interface AudioMetadata {
  sampleRate: number;
  channels: number;
  duration: number;
  bitDepth?: number;
  codec?: string;
  format?: string;
}

// ============================================================================
// Audio Effects Types
// ============================================================================

export interface ToneNode {
  connect(destination: ToneNode | Tone.ToneAudioNode): void;
  disconnect(): void;
  dispose(): void;
}

export interface ToneGain extends ToneNode {
  gain: Tone.Param<'gain'>;
}

export interface ToneFilter extends ToneNode {
  type: BiquadFilterType;
  frequency: Tone.Param<'frequency'>;
  Q: Tone.Param<'normalRange'>;
  gain?: Tone.Param<'decibels'>;
  rolloff: -12 | -24 | -48 | -96;
}

export interface ToneCompressor extends ToneNode {
  threshold: Tone.Param<'decibels'>;
  ratio: Tone.Param<'positive'>;
  attack: Tone.Param<'time'>;
  release: Tone.Param<'time'>;
  knee: Tone.Param<'decibels'>;
}

export interface ToneGate extends ToneNode {
  threshold: Tone.Param<'decibels'>;
  attack: Tone.Param<'time'>;
  release: Tone.Param<'time'>;
}

export interface ToneReverb extends ToneNode {
  decay: number;
  preDelay: number;
  wet: Tone.Param<'normalRange'>;
  generate(): Promise<void>;
}

export interface ToneDelay extends ToneNode {
  delayTime: Tone.Param<'time'>;
  feedback: Tone.Param<'normalRange'>;
  wet: Tone.Param<'normalRange'>;
}

export interface ToneMultibandCompressor extends ToneNode {
  lowFrequency: Tone.Param<'frequency'>;
  highFrequency: Tone.Param<'frequency'>;
  low: Partial<ToneCompressor>;
  mid: Partial<ToneCompressor>;
  high: Partial<ToneCompressor>;
}

// ============================================================================
// Audio Analysis Types
// ============================================================================

export interface PitchAnalysis {
  detected_pitch: number;
  pitch_confidence: number;
  note_name: string;
  cents_offset: number;
  correction_suggestion: string;
  stability: number;
  vibrato_detected: boolean;
  vibrato_rate: number;
}

export interface VocalAnalysis {
  pitch: PitchAnalysis;
  timing: TimingAnalysis;
  dynamics: DynamicsAnalysis;
  spectral: SpectralAnalysis;
  overall_score: number;
}

export interface TimingAnalysis {
  tempo: number;
  timing_consistency: number;
  rhythm_accuracy: number;
  timing_deviations: number[];
}

export interface DynamicsAnalysis {
  average_level: number;
  peak_level: number;
  dynamic_range: number;
  compression_needed: boolean;
}

export interface SpectralAnalysis {
  frequency_range: [number, number];
  dominant_frequencies: number[];
  spectral_centroid: number;
  spectral_flatness: number;
}

export interface VocalHealthReport {
  overall_health: number;
  health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  strain_detected: boolean;
  strain_locations: number[];
  strain_severity: number;
  fatigue_level: number;
  spectral_quality: Record<string, number>;
  breath_support: {
    quality: number;
    consistency: number;
    issues: string[];
  };
  tension_indicators: Array<{
    type: string;
    severity: number;
    location: number;
    description: string;
  }>;
  recommendations: string[];
}

// ============================================================================
// Audio Processing Types
// ============================================================================

export interface AudioProcessingResult {
  success: boolean;
  audioUrl?: string;
  localPath?: string;
  duration?: number;
  metadata?: AudioMetadata;
  error?: string;
}

export interface MixingParameters {
  trackIds: string[];
  genre?: string;
  targetLoudness?: number;
  preserveDynamics?: boolean;
  autoEQ?: boolean;
  autoCompression?: boolean;
}

export interface MasteringParameters {
  audioFileId: string;
  targetLoudness?: number;
  preset?: 'warm' | 'bright' | 'punchy' | 'broadcast' | 'streaming';
  limitPeaks?: boolean;
  addDither?: boolean;
}

// ============================================================================
// Event & Drag Types
// ============================================================================

export interface AudioDragEvent extends DragEvent {
  dataTransfer: DataTransfer & {
    files: FileList;
    types: readonly string[];
  };
}

export interface AudioDropEvent extends AudioDragEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

export interface AudioInputEvent extends Event {
  target: EventTarget & {
    files?: FileList;
    value?: string;
  };
}

// ============================================================================
// Audio File Types
// ============================================================================

export interface AudioFileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  storageKey: string;
  createdAt: string;
}

export interface AudioUploadOptions {
  projectId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface AudioUploadResponse {
  audioFile: AudioFileInfo;
  message?: string;
}

// ============================================================================
// Waveform Types
// ============================================================================

export interface WaveformData {
  samples: Float32Array;
  peaks: number[];
  length: number;
  sampleRate: number;
}

export interface WaveformVisualization {
  width: number;
  height: number;
  barWidth: number;
  barGap: number;
  waveColor: string;
  progressColor: string;
  cursorColor: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  AudioBuffer,
  AudioData,
  AudioMetadata,
  ToneNode,
  ToneGain,
  ToneFilter,
  ToneCompressor,
  ToneGate,
  ToneReverb,
  ToneDelay,
  ToneMultibandCompressor,
  PitchAnalysis,
  VocalAnalysis,
  TimingAnalysis,
  DynamicsAnalysis,
  SpectralAnalysis,
  VocalHealthReport,
  AudioProcessingResult,
  MixingParameters,
  MasteringParameters,
  AudioDragEvent,
  AudioDropEvent,
  AudioInputEvent,
  AudioFileInfo,
  AudioUploadOptions,
  AudioUploadResponse,
  WaveformData,
  WaveformVisualization,
};
