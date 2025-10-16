/**
 * Core type definitions for the AI DAW Audio Engine
 */

export interface AudioEngineConfig {
  sampleRate: number;
  bufferSize: number;
  maxTracks: number;
  latencyHint: 'interactive' | 'balanced' | 'playback';
}

export interface TrackConfig {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 (left) to 1.0 (right)
  mute: boolean;
  solo: boolean;
  armed: boolean; // for recording
  outputs: string[]; // IDs of destination tracks/busses
}

export interface AudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  channelData: Float32Array[];
}

export interface ProcessorConfig {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface PluginConfig {
  id: string;
  name: string;
  type: 'vst' | 'au' | 'native';
  path?: string;
  parameters: Record<string, number>;
}

export interface MIDIMessage {
  timestamp: number;
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend';
  channel: number;
  data: number[];
}

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  tempo: number; // BPM
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  position: number; // in samples
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface ExportOptions {
  format: 'wav' | 'mp3' | 'ogg' | 'flac';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  sampleRate?: number;
  bitDepth?: 16 | 24 | 32;
}

export interface AudioEngineStats {
  cpuUsage: number;
  bufferUtilization: number;
  activeVoices: number;
  latency: number; // in milliseconds
}
