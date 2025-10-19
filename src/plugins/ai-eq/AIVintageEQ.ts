/**
 * AI Vintage EQ - Classic analog-style EQ with AI-powered harmonic enhancement
 *
 * Manufacturer: DAWG AI
 * Category: AI EQ
 *
 * Features:
 * - Vintage analog-style EQ modeling (Neve/API/SSL inspired)
 * - AI-powered harmonic enhancement and saturation
 * - Automatic warmth and character adjustment
 * - Musical frequency band selection
 * - Smart gain staging
 */

import { PluginInfo, PluginParameter, PluginCategory } from '../core/types';

export interface AIVintageEQPlugin extends PluginInfo {
  id: 'dawg-ai-vintage-eq';
  name: 'AI Vintage EQ';
  manufacturer: 'DAWG AI';
  format: 'VST3';
  category: 'AI EQ';
  isAI: true;
  isInstrument: false;
  numInputs: 2;
  numOutputs: 2;
}

export interface AIVintageEQParameters {
  // AI Mode
  aiMode: PluginParameter;
  aiIntensity: PluginParameter;
  modelType: PluginParameter; // Neve/API/SSL/Pultec

  // Low Band (Shelf)
  lowFreq: PluginParameter;
  lowGain: PluginParameter;
  lowQ: PluginParameter;

  // Low-Mid Band (Bell)
  lowMidFreq: PluginParameter;
  lowMidGain: PluginParameter;
  lowMidQ: PluginParameter;

  // Mid Band (Bell)
  midFreq: PluginParameter;
  midGain: PluginParameter;
  midQ: PluginParameter;

  // High-Mid Band (Bell)
  highMidFreq: PluginParameter;
  highMidGain: PluginParameter;
  highMidQ: PluginParameter;

  // High Band (Shelf)
  highFreq: PluginParameter;
  highGain: PluginParameter;
  highQ: PluginParameter;

  // High-Pass Filter
  hpfFreq: PluginParameter;
  hpfSlope: PluginParameter;

  // Harmonic Enhancement
  harmonicDrive: PluginParameter;
  harmonicMix: PluginParameter;
  evenHarmonics: PluginParameter;
  oddHarmonics: PluginParameter;

  // Output
  outputGain: PluginParameter;
  mix: PluginParameter;

  // AI Features
  autoWarmth: PluginParameter;
  autoCharacter: PluginParameter;
  vintageEmulation: PluginParameter;
}

export const AI_VINTAGE_EQ_PLUGIN: AIVintageEQPlugin = {
  id: 'dawg-ai-vintage-eq',
  name: 'AI Vintage EQ',
  manufacturer: 'DAWG AI',
  format: 'VST3',
  path: '/dawg-ai/ai-vintage-eq',
  category: 'AI EQ' as PluginCategory,
  version: '1.0.0',
  isAI: true,
  isInstrument: false,
  numInputs: 2,
  numOutputs: 2,
  uniqueId: 'dawg-ai-vintage-eq-v1'
};

export const AI_VINTAGE_EQ_PARAMETERS: AIVintageEQParameters = {
  // AI Mode
  aiMode: {
    id: 'ai_mode',
    name: 'AI Mode',
    label: 'AI Mode',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  aiIntensity: {
    id: 'ai_intensity',
    name: 'AI Intensity',
    label: 'AI Intensity',
    value: 0.5,
    displayValue: '50%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%'
  },
  modelType: {
    id: 'model_type',
    name: 'Model Type',
    label: 'Model',
    value: 0.0,
    displayValue: 'Neve',
    min: 0,
    max: 3,
    default: 0.0,
    isAutomatable: true,
    steps: 4,
    unit: ''
  },

  // Low Band (Shelf)
  lowFreq: {
    id: 'low_freq',
    name: 'Low Frequency',
    label: 'Low Freq',
    value: 0.2,
    displayValue: '100 Hz',
    min: 0,
    max: 1,
    default: 0.2,
    isAutomatable: true,
    unit: 'Hz'
  },
  lowGain: {
    id: 'low_gain',
    name: 'Low Gain',
    label: 'Low Gain',
    value: 0.5,
    displayValue: '0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  lowQ: {
    id: 'low_q',
    name: 'Low Q',
    label: 'Low Q',
    value: 0.7,
    displayValue: '0.7',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: ''
  },

  // Low-Mid Band
  lowMidFreq: {
    id: 'low_mid_freq',
    name: 'Low-Mid Frequency',
    label: 'Low-Mid Freq',
    value: 0.3,
    displayValue: '250 Hz',
    min: 0,
    max: 1,
    default: 0.3,
    isAutomatable: true,
    unit: 'Hz'
  },
  lowMidGain: {
    id: 'low_mid_gain',
    name: 'Low-Mid Gain',
    label: 'Low-Mid Gain',
    value: 0.5,
    displayValue: '0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  lowMidQ: {
    id: 'low_mid_q',
    name: 'Low-Mid Q',
    label: 'Low-Mid Q',
    value: 1.0,
    displayValue: '1.0',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    unit: ''
  },

  // Mid Band
  midFreq: {
    id: 'mid_freq',
    name: 'Mid Frequency',
    label: 'Mid Freq',
    value: 0.5,
    displayValue: '1 kHz',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'Hz'
  },
  midGain: {
    id: 'mid_gain',
    name: 'Mid Gain',
    label: 'Mid Gain',
    value: 0.5,
    displayValue: '0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  midQ: {
    id: 'mid_q',
    name: 'Mid Q',
    label: 'Mid Q',
    value: 1.2,
    displayValue: '1.2',
    min: 0,
    max: 1,
    default: 1.2,
    isAutomatable: true,
    unit: ''
  },

  // High-Mid Band
  highMidFreq: {
    id: 'high_mid_freq',
    name: 'High-Mid Frequency',
    label: 'High-Mid Freq',
    value: 0.6,
    displayValue: '3 kHz',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: 'Hz'
  },
  highMidGain: {
    id: 'high_mid_gain',
    name: 'High-Mid Gain',
    label: 'High-Mid Gain',
    value: 0.5,
    displayValue: '0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  highMidQ: {
    id: 'high_mid_q',
    name: 'High-Mid Q',
    label: 'High-Mid Q',
    value: 1.0,
    displayValue: '1.0',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    unit: ''
  },

  // High Band
  highFreq: {
    id: 'high_freq',
    name: 'High Frequency',
    label: 'High Freq',
    value: 0.8,
    displayValue: '10 kHz',
    min: 0,
    max: 1,
    default: 0.8,
    isAutomatable: true,
    unit: 'Hz'
  },
  highGain: {
    id: 'high_gain',
    name: 'High Gain',
    label: 'High Gain',
    value: 0.5,
    displayValue: '0 dB',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: 'dB'
  },
  highQ: {
    id: 'high_q',
    name: 'High Q',
    label: 'High Q',
    value: 0.7,
    displayValue: '0.7',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: ''
  },

  // High-Pass Filter
  hpfFreq: {
    id: 'hpf_freq',
    name: 'HPF Frequency',
    label: 'HPF',
    value: 0.15,
    displayValue: '30 Hz',
    min: 0,
    max: 1,
    default: 0.15,
    isAutomatable: true,
    unit: 'Hz'
  },
  hpfSlope: {
    id: 'hpf_slope',
    name: 'HPF Slope',
    label: 'HPF Slope',
    value: 0.5,
    displayValue: '12 dB/oct',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    steps: 3,
    unit: 'dB/oct'
  },

  // Harmonic Enhancement
  harmonicDrive: {
    id: 'harmonic_drive',
    name: 'Harmonic Drive',
    label: 'Drive',
    value: 0.3,
    displayValue: '30%',
    min: 0,
    max: 1,
    default: 0.3,
    isAutomatable: true,
    unit: '%'
  },
  harmonicMix: {
    id: 'harmonic_mix',
    name: 'Harmonic Mix',
    label: 'Harmonic Mix',
    value: 0.5,
    displayValue: '50%',
    min: 0,
    max: 1,
    default: 0.5,
    isAutomatable: true,
    unit: '%'
  },
  evenHarmonics: {
    id: 'even_harmonics',
    name: 'Even Harmonics',
    label: 'Even',
    value: 0.6,
    displayValue: '60%',
    min: 0,
    max: 1,
    default: 0.6,
    isAutomatable: true,
    unit: '%'
  },
  oddHarmonics: {
    id: 'odd_harmonics',
    name: 'Odd Harmonics',
    label: 'Odd',
    value: 0.4,
    displayValue: '40%',
    min: 0,
    max: 1,
    default: 0.4,
    isAutomatable: true,
    unit: '%'
  },

  // Output
  outputGain: {
    id: 'output_gain',
    name: 'Output Gain',
    label: 'Output',
    value: 0.5,
    displayValue: '0 dB',
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

  // AI Features
  autoWarmth: {
    id: 'auto_warmth',
    name: 'Auto Warmth',
    label: 'Auto Warmth',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  autoCharacter: {
    id: 'auto_character',
    name: 'Auto Character',
    label: 'Auto Character',
    value: 1.0,
    displayValue: 'On',
    min: 0,
    max: 1,
    default: 1.0,
    isAutomatable: true,
    steps: 2,
    unit: ''
  },
  vintageEmulation: {
    id: 'vintage_emulation',
    name: 'Vintage Emulation',
    label: 'Vintage',
    value: 0.7,
    displayValue: '70%',
    min: 0,
    max: 1,
    default: 0.7,
    isAutomatable: true,
    unit: '%'
  }
};

export const AI_VINTAGE_EQ_PRESETS = {
  'warm-vocal': {
    name: 'Warm Vocal',
    description: 'Classic warm vocal EQ with Neve-style character',
    parameters: {
      model_type: 0.0, // Neve
      low_gain: 0.55,
      low_mid_gain: 0.45,
      mid_gain: 0.6,
      high_mid_gain: 0.58,
      high_gain: 0.6,
      harmonic_drive: 0.35,
      auto_warmth: 1.0,
      auto_character: 1.0
    }
  },
  'punchy-drums': {
    name: 'Punchy Drums',
    description: 'API-style punch and power for drums',
    parameters: {
      model_type: 0.33, // API
      low_gain: 0.65,
      low_mid_gain: 0.4,
      mid_gain: 0.55,
      high_mid_gain: 0.6,
      high_gain: 0.58,
      harmonic_drive: 0.5,
      even_harmonics: 0.7,
      auto_character: 1.0
    }
  },
  'ssl-bus': {
    name: 'SSL Bus',
    description: 'SSL-style bus compression and EQ',
    parameters: {
      model_type: 0.66, // SSL
      low_gain: 0.52,
      low_mid_gain: 0.48,
      mid_gain: 0.5,
      high_mid_gain: 0.55,
      high_gain: 0.55,
      harmonic_drive: 0.25,
      vintage_emulation: 0.6
    }
  },
  'pultec-low-end': {
    name: 'Pultec Low End',
    description: 'Pultec-style low-end enhancement',
    parameters: {
      model_type: 1.0, // Pultec
      low_gain: 0.7,
      low_mid_gain: 0.42,
      mid_gain: 0.5,
      high_gain: 0.58,
      harmonic_drive: 0.4,
      even_harmonics: 0.8,
      auto_warmth: 1.0
    }
  }
};
