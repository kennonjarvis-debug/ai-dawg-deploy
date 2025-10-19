/**
 * AI Surgical EQ - Precise digital EQ with AI problem frequency detection
 *
 * Manufacturer: DAWG AI
 * Category: AI EQ
 *
 * Features:
 * - Surgical precision with up to 8 parametric bands
 * - AI-powered problem frequency detection (resonances, muddiness, harshness)
 * - Real-time spectrum analysis with problem highlighting
 * - Dynamic EQ mode for adaptive frequency control
 * - Linear phase option for mastering
 * - Smart Q auto-adjustment based on gain
 */

import { PluginInfo, PluginParameter, PluginCategory } from '../core/types';

export interface AISurgicalEQPlugin extends PluginInfo {
  id: 'dawg-ai-surgical-eq';
  name: 'AI Surgical EQ';
  manufacturer: 'DAWG AI';
  format: 'VST3';
  category: 'AI EQ';
  isAI: true;
  isInstrument: false;
  numInputs: 2;
  numOutputs: 2;
}

export interface EQBandParameters {
  enabled: PluginParameter;
  type: PluginParameter; // Bell/Notch/LowShelf/HighShelf/LowPass/HighPass
  frequency: PluginParameter;
  gain: PluginParameter;
  q: PluginParameter;
}

export interface AISurgicalEQParameters {
  // AI Detection
  aiDetection: PluginParameter;
  aiSensitivity: PluginParameter;
  autoCorrect: PluginParameter;
  dynamicEQ: PluginParameter;

  // Global Settings
  linearPhase: PluginParameter;
  oversampling: PluginParameter;
  outputGain: PluginParameter;
  mix: PluginParameter;

  // 8 Parametric Bands
  band1: EQBandParameters;
  band2: EQBandParameters;
  band3: EQBandParameters;
  band4: EQBandParameters;
  band5: EQBandParameters;
  band6: EQBandParameters;
  band7: EQBandParameters;
  band8: EQBandParameters;

  // AI Problem Detection
  detectResonances: PluginParameter;
  detectMuddiness: PluginParameter;
  detectHarshness: PluginParameter;
  detectBoxiness: PluginParameter;
  detectSibilance: PluginParameter;

  // Smart Features
  autoQ: PluginParameter;
  matchLoudness: PluginParameter;
  showProblems: PluginParameter;
}

export const AI_SURGICAL_EQ_PLUGIN: AISurgicalEQPlugin = {
  id: 'dawg-ai-surgical-eq',
  name: 'AI Surgical EQ',
  manufacturer: 'DAWG AI',
  format: 'VST3',
  path: '/dawg-ai/ai-surgical-eq',
  category: 'AI EQ' as PluginCategory,
  version: '1.0.0',
  isAI: true,
  isInstrument: false,
  numInputs: 2,
  numOutputs: 2,
  uniqueId: 'dawg-ai-surgical-eq-v1'
};

const createBandParameters = (bandNum: number): EQBandParameters => {
  const defaultFreqs = [80, 250, 500, 1000, 2000, 4000, 8000, 12000];
  const defaultFreq = defaultFreqs[bandNum - 1] || 1000;

  return {
    enabled: {
      id: `band${bandNum}_enabled`,
      name: `Band ${bandNum} Enabled`,
      label: `Band ${bandNum}`,
      value: 0.0,
      displayValue: 'Off',
      min: 0,
      max: 1,
      default: 0.0,
      isAutomatable: true,
      steps: 2,
      unit: ''
    },
    type: {
      id: `band${bandNum}_type`,
      name: `Band ${bandNum} Type`,
      label: 'Type',
      value: 0.33, // Bell
      displayValue: 'Bell',
      min: 0,
      max: 1,
      default: 0.33,
      isAutomatable: true,
      steps: 6,
      unit: ''
    },
    frequency: {
      id: `band${bandNum}_freq`,
      name: `Band ${bandNum} Frequency`,
      label: 'Frequency',
      value: Math.log10(defaultFreq / 20) / Math.log10(20000 / 20),
      displayValue: `${defaultFreq} Hz`,
      min: 0,
      max: 1,
      default: Math.log10(defaultFreq / 20) / Math.log10(20000 / 20),
      isAutomatable: true,
      unit: 'Hz'
    },
    gain: {
      id: `band${bandNum}_gain`,
      name: `Band ${bandNum} Gain`,
      label: 'Gain',
      value: 0.5,
      displayValue: '0.0 dB',
      min: 0,
      max: 1,
      default: 0.5,
      isAutomatable: true,
      unit: 'dB'
    },
    q: {
      id: `band${bandNum}_q`,
      name: `Band ${bandNum} Q`,
      label: 'Q',
      value: 0.5,
      displayValue: '2.0',
      min: 0,
      max: 1,
      default: 0.5,
      isAutomatable: true,
      unit: ''
    }
  };
};

export const AI_SURGICAL_EQ_PARAMETERS: AISurgicalEQParameters = {
  // AI Detection
  aiDetection: {
    id: 'ai_detection',
    name: 'AI Detection',
    label: 'AI Detection',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  aiSensitivity: {
    id: 'ai_sensitivity',
    name: 'AI Sensitivity',
    label: 'Sensitivity',
    value: 0.6,
    displayValue: '60%',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: '%'
  },
  autoCorrect: {
    id: 'auto_correct',
    name: 'Auto Correct',
    label: 'Auto Correct',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  dynamicEQ: {
    id: 'dynamic_eq',
    name: 'Dynamic EQ',
    label: 'Dynamic',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },

  // Global Settings
  linearPhase: {
    id: 'linear_phase',
    name: 'Linear Phase',
    label: 'Linear Phase',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  oversampling: {
    id: 'oversampling',
    name: 'Oversampling',
    label: 'Oversampling',
    value: 0.5,
    displayValue: '2x',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    steps: 4,
    unit: 'x'
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
  },

  // 8 Parametric Bands
  band1: createBandParameters(1),
  band2: createBandParameters(2),
  band3: createBandParameters(3),
  band4: createBandParameters(4),
  band5: createBandParameters(5),
  band6: createBandParameters(6),
  band7: createBandParameters(7),
  band8: createBandParameters(8),

  // AI Problem Detection
  detectResonances: {
    id: 'detect_resonances',
    name: 'Detect Resonances',
    label: 'Resonances',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  detectMuddiness: {
    id: 'detect_muddiness',
    name: 'Detect Muddiness',
    label: 'Muddiness',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  detectHarshness: {
    id: 'detect_harshness',
    name: 'Detect Harshness',
    label: 'Harshness',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  detectBoxiness: {
    id: 'detect_boxiness',
    name: 'Detect Boxiness',
    label: 'Boxiness',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  detectSibilance: {
    id: 'detect_sibilance',
    name: 'Detect Sibilance',
    label: 'Sibilance',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },

  // Smart Features
  autoQ: {
    id: 'auto_q',
    name: 'Auto Q',
    label: 'Auto Q',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  matchLoudness: {
    id: 'match_loudness',
    name: 'Match Loudness',
    label: 'Match Loudness',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  showProblems: {
    id: 'show_problems',
    name: 'Show Problems',
    label: 'Show Problems',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  }
};

export const AI_SURGICAL_EQ_PRESETS = {
  'remove-resonance': {
    name: 'Remove Resonance',
    description: 'AI-detected resonance removal with surgical precision',
    parameters: {
      ai_detection: 1.0,
      ai_sensitivity: 0.7,
      detect_resonances: 1.0,
      auto_correct: 1.0,
      band1_enabled: 1.0,
      band1_type: 0.5, // Notch
      band1_q: 0.8,
      band1_gain: 0.3, // -6 dB
      auto_q: 1.0
    }
  },
  'de-mud': {
    name: 'De-Mud',
    description: 'Remove muddiness from 200-500Hz range',
    parameters: {
      ai_detection: 1.0,
      detect_muddiness: 1.0,
      auto_correct: 1.0,
      band2_enabled: 1.0,
      band2_type: 0.33, // Bell
      band2_freq: 0.4, // ~350Hz
      band2_gain: 0.35, // -4 dB
      band2_q: 0.65
    }
  },
  'de-harsh': {
    name: 'De-Harsh',
    description: 'Tame harshness in 2-5kHz range',
    parameters: {
      ai_detection: 1.0,
      detect_harshness: 1.0,
      auto_correct: 0.5,
      band5_enabled: 1.0,
      band5_type: 0.33, // Bell
      band5_freq: 0.65, // ~3.5kHz
      band5_gain: 0.4, // -3 dB
      band5_q: 0.55,
      dynamic_eq: 1.0
    }
  },
  'vocal-cleanup': {
    name: 'Vocal Cleanup',
    description: 'Comprehensive vocal problem frequency cleanup',
    parameters: {
      ai_detection: 1.0,
      ai_sensitivity: 0.65,
      detect_muddiness: 1.0,
      detect_harshness: 1.0,
      detect_sibilance: 1.0,
      auto_correct: 0.7,
      band2_enabled: 1.0, // Mud
      band2_freq: 0.38,
      band2_gain: 0.4,
      band5_enabled: 1.0, // Harshness
      band5_freq: 0.63,
      band5_gain: 0.42,
      band7_enabled: 1.0, // Sibilance
      band7_freq: 0.75,
      band7_gain: 0.38,
      dynamic_eq: 1.0,
      auto_q: 1.0
    }
  },
  'mastering-linear': {
    name: 'Mastering Linear',
    description: 'Linear phase EQ for mastering applications',
    parameters: {
      linear_phase: 1.0,
      oversampling: 1.0, // 4x
      ai_detection: 1.0,
      ai_sensitivity: 0.5,
      match_loudness: 1.0,
      show_problems: 1.0
    }
  }
};

export interface ProblemFrequency {
  frequency: number;
  severity: 'mild' | 'moderate' | 'severe';
  type: 'resonance' | 'muddiness' | 'harshness' | 'boxiness' | 'sibilance';
  suggestedGain: number; // dB reduction
  suggestedQ: number;
  description: string;
}

export interface SurgicalEQAnalysis {
  problemFrequencies: ProblemFrequency[];
  overallBalance: {
    bass: number; // -1 to 1
    mids: number;
    highs: number;
  };
  recommendations: string[];
  spectralTilt: number; // dB/octave
}
