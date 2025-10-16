/**
 * Plugin System Types - VST3/AU Native Bridge
 *
 * Architecture: Web Audio cannot directly load VST3/AU plugins.
 * We use a Node.js native bridge server that hosts plugins and communicates via IPC/WebSocket.
 */

export type PluginFormat = 'VST3' | 'VST2' | 'AU' | 'AAX';

export interface PluginInfo {
  id: string;
  name: string;
  manufacturer: string;
  format: PluginFormat;
  path: string;
  category: PluginCategory;
  version?: string;
  isInstrument: boolean;
  numInputs: number;
  numOutputs: number;
  uniqueId?: string;
}

export type PluginCategory =
  | 'EQ'
  | 'Compressor'
  | 'Limiter'
  | 'Reverb'
  | 'Delay'
  | 'Modulation'
  | 'Saturation'
  | 'VocalProcessing'
  | 'Pitch'
  | 'Dynamics'
  | 'Utility'
  | 'Mastering'
  | 'Instrument'
  | 'Analyzer'
  | 'DeNoiser'
  | 'Other';

export interface PluginParameter {
  id: string;
  name: string;
  label: string;
  value: number; // Normalized 0-1
  displayValue: string; // e.g. "-3.2 dB", "120 Hz"
  min: number;
  max: number;
  default: number;
  isAutomatable: boolean;
  steps?: number; // For discrete parameters
  unit?: string;
}

export interface PluginInstance {
  instanceId: string;
  pluginId: string;
  trackId: string;
  slotIndex: number;
  parameters: Map<string, PluginParameter>;
  enabled: boolean;
  preset?: string;
}

export interface PluginChain {
  trackId: string;
  plugins: PluginInstance[];
}

export interface PluginPreset {
  id: string;
  name: string;
  pluginId: string;
  parameters: Record<string, number>;
  metadata?: {
    genre?: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
}

export interface GenrePresetChain {
  id: string;
  name: string;
  genre: string;
  description: string;
  chain: {
    pluginId: string;
    pluginName: string;
    slot: number;
    preset?: string;
    parameters: Record<string, number>;
  }[];
  aiSettings?: {
    automationEnabled: boolean;
    dynamicAdjustment: boolean;
    targetCharacteristics: string[];
  };
}

export interface AIPluginControl {
  instanceId: string;
  parameterChanges: {
    parameterId: string;
    value: number;
    timestamp: number;
  }[];
  automationCurve?: {
    parameterId: string;
    points: { time: number; value: number }[];
  }[];
}

export interface PluginBridgeMessage {
  type: 'scan' | 'load' | 'unload' | 'setParameter' | 'getParameter' | 'process' | 'getPreset' | 'setPreset';
  instanceId?: string;
  pluginPath?: string;
  parameterId?: string;
  value?: number;
  data?: any;
}

export interface PluginBridgeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AIAnalysisRequest {
  audioBuffer: Float32Array[];
  genre: string;
  targetStyle: string;
  currentPluginChain?: PluginChain;
}

export interface AIPluginRecommendation {
  action: 'add' | 'remove' | 'adjust' | 'replace';
  pluginId: string;
  pluginName: string;
  slotIndex: number;
  reason: string;
  confidence: number;
  parameters?: Record<string, number>;
}

export interface AIMixerSettings {
  genre: string;
  targetLoudness: number; // LUFS
  dynamicRange: number; // dB
  tonalBalance: {
    bass: number; // -1 to 1
    mids: number;
    highs: number;
  };
  spatialWidth: number; // 0-100%
  aggressiveness: number; // 0-100%
}
