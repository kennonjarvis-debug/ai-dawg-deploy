/**
 * AI Reverb Plugin Types
 * Common types and interfaces for AI-powered reverb plugins
 */

export interface AIReverbPlugin {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  isAI: boolean;
  version: string;
  description: string;
  parameters: AIReverbParameter[];
  aiFeatures: AIReverbFeatures;
}

export interface AIReverbParameter {
  id: string;
  name: string;
  label: string;
  value: number; // Normalized 0-1
  min: number;
  max: number;
  default: number;
  unit?: string;
  type: 'continuous' | 'discrete' | 'toggle';
  isAutomatable: boolean;
  displayValue: string;
}

export interface AIReverbFeatures {
  adaptiveEQ: boolean;
  intelligentDucking: boolean;
  autoMixSuggestions: boolean;
  spaceModeling: boolean;
  characterEnhancement: boolean;
  dynamicDecay: boolean;
  frequencyShaping: boolean;
  stereoWidthControl: boolean;
}

export interface ReverbSettings {
  decayTime: number; // seconds (0.1 - 20s)
  preDelay: number; // ms (0 - 500ms)
  dampening: number; // 0-1
  mix: number; // 0-100%
  roomSize?: number; // 0-1
  diffusion?: number; // 0-1
  earlyReflections?: number; // 0-1
  modulation?: number; // 0-1
  lowCut?: number; // Hz
  highCut?: number; // Hz
  stereoWidth?: number; // 0-200%
  preLPF?: number; // Hz
  character?: number; // 0-1 (vintage to modern)
}

export interface AIReverbAnalysis {
  inputSpectrum: Float32Array;
  suggestedDecay: number;
  suggestedMix: number;
  suggestedDampening: number;
  detectedRoomType: 'small' | 'medium' | 'large' | 'hall' | 'plate' | 'spring';
  recommendations: string[];
}

export interface ReverbPreset {
  id: string;
  name: string;
  description: string;
  genre?: string;
  settings: ReverbSettings;
}
