/**
 * DAWG AI EQ Plugins - Comprehensive AI-Powered EQ Suite
 *
 * Export all AI EQ plugins and the analysis engine
 */

// AI Vintage EQ
export {
  AI_VINTAGE_EQ_PLUGIN,
  AI_VINTAGE_EQ_PARAMETERS,
  AI_VINTAGE_EQ_PRESETS,
  type AIVintageEQPlugin,
  type AIVintageEQParameters
} from './AIVintageEQ';

// AI Surgical EQ
export {
  AI_SURGICAL_EQ_PLUGIN,
  AI_SURGICAL_EQ_PARAMETERS,
  AI_SURGICAL_EQ_PRESETS,
  type AISurgicalEQPlugin,
  type AISurgicalEQParameters,
  type ProblemFrequency,
  type SurgicalEQAnalysis
} from './AISurgicalEQ';

// AI Mastering EQ
export {
  AI_MASTERING_EQ_PLUGIN,
  AI_MASTERING_EQ_PARAMETERS,
  AI_MASTERING_EQ_PRESETS,
  type AIMasteringEQPlugin,
  type AIMasteringEQParameters,
  type TonalBalanceAnalysis,
  type StreamingOptimization
} from './AIMasteringEQ';

// AI Auto EQ
export {
  AI_AUTO_EQ_PLUGIN,
  AI_AUTO_EQ_PARAMETERS,
  AI_AUTO_EQ_PRESETS,
  type AIAutoEQPlugin,
  type AIAutoEQParameters,
  type SourceDetectionResult,
  type AutoEQAnalysis,
  type LearnedPreferences
} from './AIAutoEQ';

// AI EQ Engine
export {
  AIEQEngine,
  aiEQEngine,
  type FrequencyBand,
  type ProblemFrequency as EngineProblems,
  type TonalBalance,
  type EQCurvePoint,
  type SourceCharacteristics
} from './AIEQEngine';

// Consolidated plugin list
import {
  AI_VINTAGE_EQ_PLUGIN,
  AI_SURGICAL_EQ_PLUGIN,
  AI_MASTERING_EQ_PLUGIN,
  AI_AUTO_EQ_PLUGIN
} from './index';

export const DAWG_AI_EQ_PLUGINS = [
  AI_VINTAGE_EQ_PLUGIN,
  AI_SURGICAL_EQ_PLUGIN,
  AI_MASTERING_EQ_PLUGIN,
  AI_AUTO_EQ_PLUGIN
];

// Plugin registry helper
export const getAIEQPlugin = (id: string) => {
  return DAWG_AI_EQ_PLUGINS.find(p => p.id === id);
};

// Plugin category check
export const isAIEQPlugin = (pluginId: string): boolean => {
  return pluginId.startsWith('dawg-ai-') && pluginId.includes('-eq');
};
