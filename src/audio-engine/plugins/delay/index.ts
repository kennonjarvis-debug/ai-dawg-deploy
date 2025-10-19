/**
 * DAWG AI Delay Plugins
 *
 * Comprehensive suite of AI-powered delay plugins for the DAWG DAWG AI
 * All plugins manufactured by DAWG AI and categorized as "AI Delay"
 */

export { AITapeDelay } from './AITapeDelay';
export type { AITapeDelayParameters, AITapeDelayMetadata } from './AITapeDelay';

export { AIDigitalDelay } from './AIDigitalDelay';
export type { AIDigitalDelayParameters, AIDigitalDelayMetadata } from './AIDigitalDelay';

export { AIPingPongDelay } from './AIPingPongDelay';
export type { AIPingPongDelayParameters, AIPingPongDelayMetadata } from './AIPingPongDelay';

export { AIDuckingDelay } from './AIDuckingDelay';
export type { AIDuckingDelayParameters, AIDuckingDelayMetadata } from './AIDuckingDelay';

export type {
  TempoMultiplier,
  DelayPreset,
  AIDelayFeatures,
  DelayPluginMetadata,
  DelayPluginState
} from './types';

export {
  TEMPO_MULTIPLIER_NAMES,
  DELAY_PARAMETER_RANGES,
  TAPE_DELAY_PRESETS,
  DIGITAL_DELAY_PRESETS,
  PING_PONG_DELAY_PRESETS,
  DUCKING_DELAY_PRESETS,
  ALL_DELAY_PRESETS,
  delayTimeToTempoSync,
  tempoSyncToDelayTime,
  dbToLinear,
  linearToDb
} from './types';

/**
 * Plugin registry for easy instantiation
 */
import { AITapeDelay } from './AITapeDelay';
import { AIDigitalDelay } from './AIDigitalDelay';
import { AIPingPongDelay } from './AIPingPongDelay';
import { AIDuckingDelay } from './AIDuckingDelay';
import { Plugin } from '../PluginHost';

export interface DelayPluginConstructor {
  new (audioContext?: AudioContext): Plugin;
}

export const DELAY_PLUGIN_REGISTRY: Record<string, DelayPluginConstructor> = {
  'dawg-ai-tape-delay': AITapeDelay,
  'dawg-ai-digital-delay': AIDigitalDelay,
  'dawg-ai-ping-pong-delay': AIPingPongDelay,
  'dawg-ai-ducking-delay': AIDuckingDelay
};

/**
 * Factory function to create delay plugin instances
 */
export function createDelayPlugin(
  pluginId: string,
  audioContext?: AudioContext
): Plugin | null {
  const PluginClass = DELAY_PLUGIN_REGISTRY[pluginId];
  if (!PluginClass) {
    console.error(`[DAWG AI Delay] Unknown plugin ID: ${pluginId}`);
    return null;
  }

  return new PluginClass(audioContext);
}

/**
 * Get all available delay plugin metadata
 */
export function getAllDelayPluginInfo() {
  return [
    {
      id: 'dawg-ai-tape-delay',
      name: 'AI Tape Delay',
      manufacturer: 'DAWG AI',
      category: 'AI Delay',
      description: 'Vintage tape echo with AI-powered wow/flutter modeling',
      isAI: true
    },
    {
      id: 'dawg-ai-digital-delay',
      name: 'AI Digital Delay',
      manufacturer: 'DAWG AI',
      category: 'AI Delay',
      description: 'Clean digital delay with intelligent feedback control',
      isAI: true
    },
    {
      id: 'dawg-ai-ping-pong-delay',
      name: 'AI Ping-Pong Delay',
      manufacturer: 'DAWG AI',
      category: 'AI Delay',
      description: 'Stereo ping-pong delay with AI stereo width optimization',
      isAI: true
    },
    {
      id: 'dawg-ai-ducking-delay',
      name: 'AI Ducking Delay',
      manufacturer: 'DAWG AI',
      category: 'AI Delay',
      description: 'Smart delay that ducks when vocals are present',
      isAI: true
    }
  ];
}
