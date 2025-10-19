/**
 * AI Auto EQ - Intelligent EQ that automatically adjusts based on source material
 *
 * Manufacturer: DAWG AI
 * Category: AI EQ
 *
 * Features:
 * - Fully automatic EQ based on real-time audio analysis
 * - Source type detection (vocals, drums, bass, guitars, keys, etc.)
 * - Genre-aware EQ curves
 * - One-click automatic mixing
 * - Learn mode to adapt to user preferences
 * - Smart preset suggestions
 */

import { PluginInfo, PluginParameter, PluginCategory } from '../core/types';

export interface AIAutoEQPlugin extends PluginInfo {
  id: 'dawg-ai-auto-eq';
  name: 'AI Auto EQ';
  manufacturer: 'DAWG AI';
  format: 'VST3';
  category: 'AI EQ';
  isAI: true;
  isInstrument: false;
  numInputs: 2;
  numOutputs: 2;
}

export interface AIAutoEQParameters {
  // AI Control
  autoMode: PluginParameter;
  aiStrength: PluginParameter;
  adaptationSpeed: PluginParameter;
  learnMode: PluginParameter;

  // Source Detection
  sourceType: PluginParameter; // Auto/Vocal/Drums/Bass/Guitar/Keys/Strings/Brass/Mix
  sourceConfidence: PluginParameter; // Read-only: AI confidence
  genreDetection: PluginParameter;
  detectedGenre: PluginParameter; // Read-only

  // EQ Goals
  eqGoal: PluginParameter; // Clarity/Warmth/Brightness/Punch/Balance/Custom
  targetCurve: PluginParameter; // Flat/Musical/Modern/Vintage
  correctionAmount: PluginParameter;

  // Problem Solving
  autoFixMud: PluginParameter;
  autoFixHarshness: PluginParameter;
  autoFixResonance: PluginParameter;
  autoFixBoxiness: PluginParameter;
  autoEnhanceAir: PluginParameter;

  // Dynamic Adjustment
  dynamicAdaptation: PluginParameter;
  loudnessCompensation: PluginParameter;
  frequencyTracking: PluginParameter;

  // User Override
  manualAdjust: PluginParameter;
  lowBias: PluginParameter; // -1 to +1 (less/more low end)
  midBias: PluginParameter;
  highBias: PluginParameter;

  // Advanced
  analysisResolution: PluginParameter;
  processingQuality: PluginParameter;
  latencyMode: PluginParameter;

  // Output
  showCurve: PluginParameter;
  showAnalysis: PluginParameter;
  outputGain: PluginParameter;
  mix: PluginParameter;
}

export const AI_AUTO_EQ_PLUGIN: AIAutoEQPlugin = {
  id: 'dawg-ai-auto-eq',
  name: 'AI Auto EQ',
  manufacturer: 'DAWG AI',
  format: 'VST3',
  path: '/dawg-ai/ai-auto-eq',
  category: 'AI EQ' as PluginCategory,
  version: '1.0.0',
  isAI: true,
  isInstrument: false,
  numInputs: 2,
  numOutputs: 2,
  uniqueId: 'dawg-ai-auto-eq-v1'
};

export const AI_AUTO_EQ_PARAMETERS: AIAutoEQParameters = {
  // AI Control
  autoMode: {
    id: 'auto_mode',
    name: 'Auto Mode',
    label: 'Auto',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  aiStrength: {
    id: 'ai_strength',
    name: 'AI Strength',
    label: 'Strength',
    value: 0.7,
    displayValue: '70%',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: '%'
  },
  adaptationSpeed: {
    id: 'adaptation_speed',
    name: 'Adaptation Speed',
    label: 'Speed',
    value: 0.5,
    displayValue: 'Medium',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: ''
  },
  learnMode: {
    id: 'learn_mode',
    name: 'Learn Mode',
    label: 'Learn',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },

  // Source Detection
  sourceType: {
    id: 'source_type',
    name: 'Source Type',
    label: 'Source',
    value: 0.0,
    displayValue: 'Auto',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 9,
    unit: ''
  },
  sourceConfidence: {
    id: 'source_confidence',
    name: 'Source Confidence',
    label: 'Confidence',
    value: 0.0,
    displayValue: '0%',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: false,
    unit: '%'
  },
  genreDetection: {
    id: 'genre_detection',
    name: 'Genre Detection',
    label: 'Genre',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  detectedGenre: {
    id: 'detected_genre',
    name: 'Detected Genre',
    label: 'Detected',
    value: 0.0,
    displayValue: 'Unknown',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: false,
    unit: ''
  },

  // EQ Goals
  eqGoal: {
    id: 'eq_goal',
    name: 'EQ Goal',
    label: 'Goal',
    value: 0.0,
    displayValue: 'Clarity',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 6,
    unit: ''
  },
  targetCurve: {
    id: 'target_curve',
    name: 'Target Curve',
    label: 'Curve',
    value: 0.33,
    displayValue: 'Musical',
    min: 0,
    max: 1,
    default: 0.33,
    isAutomatable: true,
    steps: 4,
    unit: ''
  },
  correctionAmount: {
    id: 'correction_amount',
    name: 'Correction Amount',
    label: 'Correction',
    value: 0.65,
    displayValue: '65%',
    min: 0,
    max: 1,
    default: 0.65,
    isAutomatable: true,
    unit: '%'
  },

  // Problem Solving
  autoFixMud: {
    id: 'auto_fix_mud',
    name: 'Auto Fix Mud',
    label: 'Fix Mud',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  autoFixHarshness: {
    id: 'auto_fix_harshness',
    name: 'Auto Fix Harshness',
    label: 'Fix Harsh',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  autoFixResonance: {
    id: 'auto_fix_resonance',
    name: 'Auto Fix Resonance',
    label: 'Fix Res',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  autoFixBoxiness: {
    id: 'auto_fix_boxiness',
    name: 'Auto Fix Boxiness',
    label: 'Fix Boxy',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  autoEnhanceAir: {
    id: 'auto_enhance_air',
    name: 'Auto Enhance Air',
    label: 'Add Air',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },

  // Dynamic Adjustment
  dynamicAdaptation: {
    id: 'dynamic_adaptation',
    name: 'Dynamic Adaptation',
    label: 'Dynamic',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  loudnessCompensation: {
    id: 'loudness_compensation',
    name: 'Loudness Compensation',
    label: 'Loudness',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  frequencyTracking: {
    id: 'frequency_tracking',
    name: 'Frequency Tracking',
    label: 'Tracking',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },

  // User Override
  manualAdjust: {
    id: 'manual_adjust',
    name: 'Manual Adjust',
    label: 'Manual',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  lowBias: {
    id: 'low_bias',
    name: 'Low Bias',
    label: 'Low',
    value: 0.5,
    displayValue: '0',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: ''
  },
  midBias: {
    id: 'mid_bias',
    name: 'Mid Bias',
    label: 'Mid',
    value: 0.5,
    displayValue: '0',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: ''
  },
  highBias: {
    id: 'high_bias',
    name: 'High Bias',
    label: 'High',
    value: 0.5,
    displayValue: '0',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: ''
  },

  // Advanced
  analysisResolution: {
    id: 'analysis_resolution',
    name: 'Analysis Resolution',
    label: 'Resolution',
    value: 0.66,
    displayValue: 'High',
    min: 0,
    max: 1,
    default: 0.66,
    isAutomatable: true,
    steps: 3,
    unit: ''
  },
  processingQuality: {
    id: 'processing_quality',
    name: 'Processing Quality',
    label: 'Quality',
    value: 0.66,
    displayValue: 'High',
    min: 0,
    max: 1,
    default: 0.66,
    isAutomatable: true,
    steps: 3,
    unit: ''
  },
  latencyMode: {
    id: 'latency_mode',
    name: 'Latency Mode',
    label: 'Latency',
    value: 0.33,
    displayValue: 'Low',
    min: 0,
    max: 1,
    default: 0.33,
    isAutomatable: true,
    steps: 3,
    unit: ''
  },

  // Output
  showCurve: {
    id: 'show_curve',
    name: 'Show Curve',
    label: 'Curve',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  showAnalysis: {
    id: 'show_analysis',
    name: 'Show Analysis',
    label: 'Analysis',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  outputGain: {
    id: 'output_gain',
    name: 'Output Gain',
    label: 'Output',
    value: 0.5,
    displayValue: '0.0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  mix: {
    id: 'mix',
    name: 'Dry/Wet Mix',
    label: 'Mix',
    value: 1.0,
    displayValue: '100%',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    unit: '%'
  }
};

export const AI_AUTO_EQ_PRESETS = {
  'auto-vocal': {
    name: 'Auto Vocal',
    description: 'Automatic vocal optimization',
    parameters: {
      auto_mode: 1.0,
      source_type: 0.125, // Vocal
      ai_strength: 0.7,
      eq_goal: 0.0, // Clarity
      auto_fix_mud: 1.0,
      auto_fix_harshness: 1.0,
      auto_fix_boxiness: 1.0,
      auto_enhance_air: 1.0,
      dynamic_adaptation: 1.0
    }
  },
  'auto-drums': {
    name: 'Auto Drums',
    description: 'Automatic drum kit optimization',
    parameters: {
      auto_mode: 1.0,
      source_type: 0.25, // Drums
      ai_strength: 0.75,
      eq_goal: 0.66, // Punch
      auto_fix_mud: 1.0,
      auto_fix_boxiness: 0.5,
      low_bias: 0.6,
      dynamic_adaptation: 1.0
    }
  },
  'auto-bass': {
    name: 'Auto Bass',
    description: 'Automatic bass optimization',
    parameters: {
      auto_mode: 1.0,
      source_type: 0.375, // Bass
      ai_strength: 0.7,
      eq_goal: 0.0, // Clarity
      auto_fix_mud: 1.0,
      auto_fix_boxiness: 1.0,
      low_bias: 0.65,
      dynamic_adaptation: 1.0
    }
  },
  'auto-mix-bus': {
    name: 'Auto Mix Bus',
    description: 'Automatic mix bus balancing',
    parameters: {
      auto_mode: 1.0,
      source_type: 1.0, // Mix
      ai_strength: 0.5,
      eq_goal: 0.83, // Balance
      target_curve: 0.33, // Musical
      auto_fix_mud: 1.0,
      auto_fix_harshness: 1.0,
      dynamic_adaptation: 1.0,
      loudness_compensation: 1.0
    }
  },
  'gentle-correction': {
    name: 'Gentle Correction',
    description: 'Subtle automatic corrections only',
    parameters: {
      auto_mode: 1.0,
      ai_strength: 0.4,
      correction_amount: 0.4,
      adaptation_speed: 0.3,
      auto_fix_mud: 1.0,
      auto_fix_harshness: 1.0,
      auto_fix_resonance: 1.0,
      dynamic_adaptation: 0.0
    }
  },
  'aggressive-fix': {
    name: 'Aggressive Fix',
    description: 'Strong automatic problem correction',
    parameters: {
      auto_mode: 1.0,
      ai_strength: 0.9,
      correction_amount: 0.85,
      adaptation_speed: 0.7,
      auto_fix_mud: 1.0,
      auto_fix_harshness: 1.0,
      auto_fix_resonance: 1.0,
      auto_fix_boxiness: 1.0,
      auto_enhance_air: 1.0,
      dynamic_adaptation: 1.0
    }
  },
  'learn-my-style': {
    name: 'Learn My Style',
    description: 'Learns from your manual adjustments',
    parameters: {
      auto_mode: 1.0,
      learn_mode: 1.0,
      ai_strength: 0.6,
      adaptation_speed: 0.5,
      manual_adjust: 1.0,
      dynamic_adaptation: 1.0
    }
  }
};

export interface SourceDetectionResult {
  type: 'vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'strings' | 'brass' | 'mix' | 'unknown';
  confidence: number; // 0-1
  characteristics: {
    harmonicContent: number;
    transientContent: number;
    pitchStability: number;
    spectralComplexity: number;
    rhythmicPattern: boolean;
  };
  suggestedGoal: 'clarity' | 'warmth' | 'brightness' | 'punch' | 'balance';
}

export interface AutoEQAnalysis {
  sourceDetection: SourceDetectionResult;
  detectedGenre: string;
  genreConfidence: number;
  problems: {
    hasMud: boolean;
    hasHarshness: boolean;
    hasResonance: boolean;
    hasBoxiness: boolean;
    needsAir: boolean;
  };
  appliedCorrections: {
    frequency: number;
    gain: number;
    q: number;
    reason: string;
    type: 'cut' | 'boost';
  }[];
  spectralBalance: {
    low: number; // -1 to +1
    mid: number;
    high: number;
  };
  suggestions: string[];
}

export interface LearnedPreferences {
  userId: string;
  sourceType: string;
  preferredAdjustments: {
    frequency: number;
    gainBias: number; // How much more/less gain user typically applies
    qBias: number;
  }[];
  globalBias: {
    low: number;
    mid: number;
    high: number;
  };
  learningSessionCount: number;
  lastUpdated: number;
}
