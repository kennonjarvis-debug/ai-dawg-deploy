/**
 * AI Mastering EQ - Professional mastering EQ with AI tonal balance analysis
 *
 * Manufacturer: DAWG AI
 * Category: AI EQ
 *
 * Features:
 * - Professional mastering-grade linear phase EQ
 * - AI-powered tonal balance analysis and matching
 * - Reference track comparison and matching
 * - Streaming service optimization (Spotify, Apple Music, etc.)
 * - Mid/Side processing for stereo control
 * - Advanced metering and visualization
 */

import { PluginInfo, PluginParameter, PluginCategory } from '../core/types';

export interface AIMasteringEQPlugin extends PluginInfo {
  id: 'dawg-ai-mastering-eq';
  name: 'AI Mastering EQ';
  manufacturer: 'DAWG AI';
  format: 'VST3';
  category: 'AI EQ';
  isAI: true;
  isInstrument: false;
  numInputs: 2;
  numOutputs: 2;
}

export interface MasteringBandParameters {
  enabled: PluginParameter;
  frequency: PluginParameter;
  gain: PluginParameter;
  q: PluginParameter;
  type: PluginParameter; // Bell/Shelf
  midSideMode: PluginParameter; // Stereo/Mid/Side
}

export interface AIMasteringEQParameters {
  // AI Tonal Balance
  aiTonalBalance: PluginParameter;
  targetProfile: PluginParameter; // Neutral/Warm/Bright/Dark/Custom
  referenceMatch: PluginParameter;
  matchStrength: PluginParameter;

  // Streaming Optimization
  streamingOptimization: PluginParameter;
  streamingService: PluginParameter; // Spotify/Apple/YouTube/Tidal/Custom
  loudnessTarget: PluginParameter;

  // Processing Mode
  linearPhase: PluginParameter;
  phaseMode: PluginParameter; // Minimum/Linear/Mixed
  latency: PluginParameter;
  oversampling: PluginParameter;

  // Mid/Side Processing
  midSideMode: PluginParameter;
  stereoWidth: PluginParameter;
  midGain: PluginParameter;
  sideGain: PluginParameter;

  // 6 Mastering Bands
  lowShelf: MasteringBandParameters;
  lowMid: MasteringBandParameters;
  mid: MasteringBandParameters;
  highMid: MasteringBandParameters;
  presence: MasteringBandParameters;
  highShelf: MasteringBandParameters;

  // Output
  autoGain: PluginParameter;
  outputGain: PluginParameter;
  mix: PluginParameter;

  // AI Analysis
  analyzeSpectrum: PluginParameter;
  showTargetCurve: PluginParameter;
  showDifference: PluginParameter;
}

const createMasteringBand = (
  name: string,
  defaultFreq: number,
  defaultType: number
): MasteringBandParameters => {
  return {
    enabled: {
      id: `${name}_enabled`,
      name: `${name} Enabled`,
      label: name,
      value: 0.0,
      displayValue: 'Off',
      min: 0,
      max: 1,
      default: 0.0,
      isAutomatable: true,
      steps: 2,
      unit: ''
    },
    frequency: {
      id: `${name}_freq`,
      name: `${name} Frequency`,
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
      id: `${name}_gain`,
      name: `${name} Gain`,
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
      id: `${name}_q`,
      name: `${name} Q`,
      label: 'Q',
      value: 0.5,
      displayValue: '1.0',
      min: 0,
      max: 1,
      default: 0.5,
      isAutomatable: true,
      unit: ''
    },
    type: {
      id: `${name}_type`,
      name: `${name} Type`,
      label: 'Type',
      value: defaultType,
      displayValue: defaultType < 0.5 ? 'Shelf' : 'Bell',
      min: 0,
      max: 1,
      default: defaultType,
      isAutomatable: true,
      steps: 2,
      unit: ''
    },
    midSideMode: {
      id: `${name}_ms_mode`,
      name: `${name} M/S Mode`,
      label: 'M/S',
      value: 0.0,
      displayValue: 'Stereo',
      min: 0,
      max: 1,
      default: 0.0,
      isAutomatable: true,
      steps: 3,
      unit: ''
    }
  };
};

export const AI_MASTERING_EQ_PLUGIN: AIMasteringEQPlugin = {
  id: 'dawg-ai-mastering-eq',
  name: 'AI Mastering EQ',
  manufacturer: 'DAWG AI',
  format: 'VST3',
  path: '/dawg-ai/ai-mastering-eq',
  category: 'AI EQ' as PluginCategory,
  version: '1.0.0',
  isAI: true,
  isInstrument: false,
  numInputs: 2,
  numOutputs: 2,
  uniqueId: 'dawg-ai-mastering-eq-v1'
};

export const AI_MASTERING_EQ_PARAMETERS: AIMasteringEQParameters = {
  // AI Tonal Balance
  aiTonalBalance: {
    id: 'ai_tonal_balance',
    name: 'AI Tonal Balance',
    label: 'AI Balance',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  targetProfile: {
    id: 'target_profile',
    name: 'Target Profile',
    label: 'Profile',
    value: 0.0,
    displayValue: 'Neutral',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 5,
    unit: ''
  },
  referenceMatch: {
    id: 'reference_match',
    name: 'Reference Match',
    label: 'Reference',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  matchStrength: {
    id: 'match_strength',
    name: 'Match Strength',
    label: 'Match %',
    value: 0.5,
    displayValue: '50%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%'
  },

  // Streaming Optimization
  streamingOptimization: {
    id: 'streaming_optimization',
    name: 'Streaming Optimization',
    label: 'Streaming',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  streamingService: {
    id: 'streaming_service',
    name: 'Streaming Service',
    label: 'Service',
    value: 0.0,
    displayValue: 'Spotify',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 5,
    unit: ''
  },
  loudnessTarget: {
    id: 'loudness_target',
    name: 'Loudness Target',
    label: 'Target LUFS',
    value: 0.6,
    displayValue: '-14 LUFS',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: 'LUFS'
  },

  // Processing Mode
  linearPhase: {
    id: 'linear_phase',
    name: 'Linear Phase',
    label: 'Linear Phase',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  phaseMode: {
    id: 'phase_mode',
    name: 'Phase Mode',
    label: 'Phase',
    value: 0.5,
    displayValue: 'Linear',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    steps: 3,
    unit: ''
  },
  latency: {
    id: 'latency',
    name: 'Latency',
    label: 'Latency',
    value: 0.5,
    displayValue: 'Medium',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    steps: 3,
    unit: ''
  },
  oversampling: {
    id: 'oversampling',
    name: 'Oversampling',
    label: 'Oversample',
    value: 0.75,
    displayValue: '4x',
    min: 0,
    max: 1,
    default: 0.75,
    isAutomatable: true,
    steps: 4,
    unit: 'x'
  },

  // Mid/Side Processing
  midSideMode: {
    id: 'mid_side_mode',
    name: 'Mid/Side Mode',
    label: 'M/S',
    value: 0.0,
    displayValue: 'Off',
    min: 0,
    max: 1,
    default: 0.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  stereoWidth: {
    id: 'stereo_width',
    name: 'Stereo Width',
    label: 'Width',
    value: 0.5,
    displayValue: '100%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%'
  },
  midGain: {
    id: 'mid_gain',
    name: 'Mid Gain',
    label: 'Mid',
    value: 0.5,
    displayValue: '0.0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  sideGain: {
    id: 'side_gain',
    name: 'Side Gain',
    label: 'Side',
    value: 0.5,
    displayValue: '0.0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },

  // 6 Mastering Bands
  lowShelf: createMasteringBand('low_shelf', 80, 0.0),
  lowMid: createMasteringBand('low_mid', 250, 1.0),
  mid: createMasteringBand('mid', 1000, 1.0),
  highMid: createMasteringBand('high_mid', 3000, 1.0),
  presence: createMasteringBand('presence', 6000, 1.0),
  highShelf: createMasteringBand('high_shelf', 10000, 0.0),

  // Output
  autoGain: {
    id: 'auto_gain',
    name: 'Auto Gain',
    label: 'Auto Gain',
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
  },

  // AI Analysis
  analyzeSpectrum: {
    id: 'analyze_spectrum',
    name: 'Analyze Spectrum',
    label: 'Analyze',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  showTargetCurve: {
    id: 'show_target_curve',
    name: 'Show Target Curve',
    label: 'Target',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  showDifference: {
    id: 'show_difference',
    name: 'Show Difference',
    label: 'Difference',
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

export const AI_MASTERING_EQ_PRESETS = {
  'neutral-mastering': {
    name: 'Neutral Mastering',
    description: 'Transparent mastering EQ with tonal balance analysis',
    parameters: {
      ai_tonal_balance: 1.0,
      target_profile: 0.0, // Neutral
      linear_phase: 1.0,
      oversampling: 1.0,
      auto_gain: 1.0,
      analyze_spectrum: 1.0,
      show_target_curve: 1.0
    }
  },
  'warm-mastering': {
    name: 'Warm Mastering',
    description: 'Warm, musical mastering with enhanced low-mids',
    parameters: {
      ai_tonal_balance: 1.0,
      target_profile: 0.25, // Warm
      low_shelf_enabled: 1.0,
      low_shelf_gain: 0.55,
      low_mid_enabled: 1.0,
      low_mid_gain: 0.52,
      high_shelf_enabled: 1.0,
      high_shelf_gain: 0.48,
      linear_phase: 1.0
    }
  },
  'bright-modern': {
    name: 'Bright Modern',
    description: 'Modern, bright mastering for contemporary music',
    parameters: {
      ai_tonal_balance: 1.0,
      target_profile: 0.5, // Bright
      low_shelf_enabled: 1.0,
      low_shelf_gain: 0.52,
      high_mid_enabled: 1.0,
      high_mid_gain: 0.55,
      presence_enabled: 1.0,
      presence_gain: 0.53,
      high_shelf_enabled: 1.0,
      high_shelf_gain: 0.58,
      linear_phase: 1.0
    }
  },
  'spotify-optimized': {
    name: 'Spotify Optimized',
    description: 'Optimized for Spotify streaming (-14 LUFS)',
    parameters: {
      ai_tonal_balance: 1.0,
      streaming_optimization: 1.0,
      streaming_service: 0.0, // Spotify
      loudness_target: 0.6, // -14 LUFS
      target_profile: 0.0,
      linear_phase: 1.0,
      auto_gain: 1.0
    }
  },
  'apple-music': {
    name: 'Apple Music',
    description: 'Optimized for Apple Music streaming (-16 LUFS)',
    parameters: {
      ai_tonal_balance: 1.0,
      streaming_optimization: 1.0,
      streaming_service: 0.25, // Apple Music
      loudness_target: 0.5, // -16 LUFS
      target_profile: 0.0,
      linear_phase: 1.0,
      auto_gain: 1.0
    }
  },
  'reference-match': {
    name: 'Reference Match',
    description: 'Match tonal balance to a reference track',
    parameters: {
      ai_tonal_balance: 1.0,
      reference_match: 1.0,
      match_strength: 0.7,
      linear_phase: 1.0,
      oversampling: 1.0,
      auto_gain: 1.0,
      show_target_curve: 1.0,
      show_difference: 1.0
    }
  },
  'mid-side-width': {
    name: 'Mid/Side Width',
    description: 'Enhanced stereo width with mid/side processing',
    parameters: {
      mid_side_mode: 1.0,
      stereo_width: 0.65,
      side_gain: 0.55,
      high_shelf_enabled: 1.0,
      high_shelf_ms_mode: 0.66, // Side
      high_shelf_gain: 0.58,
      linear_phase: 1.0
    }
  }
};

export interface TonalBalanceAnalysis {
  currentBalance: {
    subBass: number; // 20-60 Hz
    bass: number; // 60-250 Hz
    lowMids: number; // 250-500 Hz
    mids: number; // 500-2000 Hz
    highMids: number; // 2000-4000 Hz
    presence: number; // 4000-6000 Hz
    brilliance: number; // 6000-10000 Hz
    air: number; // 10000-20000 Hz
  };
  targetBalance: {
    subBass: number;
    bass: number;
    lowMids: number;
    mids: number;
    highMids: number;
    presence: number;
    brilliance: number;
    air: number;
  };
  difference: {
    subBass: number; // dB difference
    bass: number;
    lowMids: number;
    mids: number;
    highMids: number;
    presence: number;
    brilliance: number;
    air: number;
  };
  overallScore: number; // 0-100, how well matched
  recommendations: string[];
}

export interface StreamingOptimization {
  service: 'spotify' | 'apple-music' | 'youtube' | 'tidal' | 'custom';
  targetLUFS: number;
  currentLUFS: number;
  suggestedGain: number; // dB
  peakHeadroom: number; // dB
  tonalAdjustments: {
    frequency: number;
    gain: number;
    reason: string;
  }[];
}
