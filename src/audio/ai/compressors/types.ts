/**
 * Shared types for AI Compressor plugins - DAWG AI
 */

export interface CompressorParameter {
  id: string;
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  default: number;
  unit?: string;
  displayValue: string;
  isAutomatable: boolean;
}

export interface CompressorMetadata {
  id: string;
  name: string;
  manufacturer: string; // "DAWG AI"
  version: string;
  category: string; // "AI Compressor"
  description: string;
  isAI: boolean;
  numInputs: number;
  numOutputs: number;
}

export interface AICompressorFeatures {
  autoMakeupGain: boolean;
  adaptiveAttackRelease: boolean;
  smartSidechain: boolean;
  spectralAnalysis: boolean;
  dynamicThreshold: boolean;
}

export interface CompressorState {
  threshold: number;      // dB
  ratio: number;          // 1:1 to 20:1
  attack: number;         // ms
  release: number;        // ms
  knee: number;           // dB (soft knee amount)
  makeupGain: number;     // dB
  mix: number;            // 0-100% (parallel compression)
  lookahead: number;      // ms
  enabled: boolean;
}

export interface CompressorAnalysis {
  inputLevel: number;     // dBFS
  outputLevel: number;    // dBFS
  gainReduction: number;  // dB
  rmsLevel: number;       // RMS level
  peakLevel: number;      // Peak level
  spectralCentroid: number; // Hz (for AI analysis)
  dynamicRange: number;   // dB
}

export interface AICompressorSettings {
  autoAdjustThreshold: boolean;
  autoAdjustRatio: boolean;
  autoAdjustAttackRelease: boolean;
  targetDynamicRange?: number; // dB
  intelligenceLevel: 'gentle' | 'moderate' | 'aggressive';
}

export type CompressorType =
  | 'vintage'
  | 'modern'
  | 'multiband'
  | 'vocal'
  | 'bus'
  | 'mastering';

export interface CompressorPreset {
  id: string;
  name: string;
  description: string;
  compressorType: CompressorType;
  parameters: Partial<CompressorState>;
  aiSettings?: AICompressorSettings;
  tags?: string[];
}

// Common presets for all compressor types
export const COMMON_COMPRESSOR_PRESETS: Record<string, Partial<CompressorState>> = {
  gentle: {
    threshold: -12,
    ratio: 2,
    attack: 10,
    release: 100,
    knee: 3,
    mix: 100,
  },
  medium: {
    threshold: -18,
    ratio: 4,
    attack: 5,
    release: 50,
    knee: 2,
    mix: 100,
  },
  aggressive: {
    threshold: -24,
    ratio: 8,
    attack: 1,
    release: 30,
    knee: 1,
    mix: 100,
  },
  parallel: {
    threshold: -30,
    ratio: 10,
    attack: 1,
    release: 100,
    knee: 0,
    mix: 30,
  },
  limiting: {
    threshold: -3,
    ratio: 20,
    attack: 0.1,
    release: 50,
    knee: 0.5,
    mix: 100,
  },
};
