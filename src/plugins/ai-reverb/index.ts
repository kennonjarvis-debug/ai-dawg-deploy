/**
 * AI Reverb Plugins
 * Comprehensive suite of AI-powered reverb effects for the DAWG DAWG AI
 *
 * All plugins feature:
 * - Manufacturer: "DAWG AI"
 * - Category: "AI Reverb"
 * - isAI: true
 * - AI-powered audio analysis and adaptive processing
 * - Intelligent parameter suggestions
 * - Professional presets for different genres
 */

export { AIPlateReverb } from './AIPlateReverb';
export { AIHallReverb } from './AIHallReverb';
export { AIRoomReverb } from './AIRoomReverb';
export { AISpringReverb } from './AISpringReverb';

export type {
  AIReverbPlugin,
  AIReverbParameter,
  AIReverbFeatures,
  ReverbSettings,
  AIReverbAnalysis,
  ReverbPreset
} from './types';

// Export instances for easy use
import { AIPlateReverb } from './AIPlateReverb';
import { AIHallReverb } from './AIHallReverb';
import { AIRoomReverb } from './AIRoomReverb';
import { AISpringReverb } from './AISpringReverb';

/**
 * All available AI Reverb plugins
 */
export const AI_REVERB_PLUGINS = {
  'ai-plate-reverb': new AIPlateReverb(),
  'ai-hall-reverb': new AIHallReverb(),
  'ai-room-reverb': new AIRoomReverb(),
  'ai-spring-reverb': new AISpringReverb()
};

/**
 * Get AI Reverb plugin by ID
 */
export function getAIReverbPlugin(id: string) {
  return AI_REVERB_PLUGINS[id as keyof typeof AI_REVERB_PLUGINS];
}

/**
 * Get all AI Reverb plugins
 */
export function getAllAIReverbPlugins() {
  return Object.values(AI_REVERB_PLUGINS);
}

/**
 * Plugin metadata for UI display
 */
export const AI_REVERB_METADATA = [
  {
    id: 'ai-plate-reverb',
    name: 'AI Plate Reverb',
    manufacturer: 'DAWG AI',
    category: 'AI Reverb',
    isAI: true,
    description: 'Classic plate reverb with AI-powered decay optimization',
    icon: '🎚️',
    tags: ['reverb', 'plate', 'ai', 'vocal', 'drum']
  },
  {
    id: 'ai-hall-reverb',
    name: 'AI Hall Reverb',
    manufacturer: 'DAWG AI',
    category: 'AI Reverb',
    isAI: true,
    description: 'Large concert hall reverb with intelligent space modeling',
    icon: '🏛️',
    tags: ['reverb', 'hall', 'ai', 'orchestral', 'ambient']
  },
  {
    id: 'ai-room-reverb',
    name: 'AI Room Reverb',
    manufacturer: 'DAWG AI',
    category: 'AI Reverb',
    isAI: true,
    description: 'Small/medium room reverb with adaptive room analysis',
    icon: '🏠',
    tags: ['reverb', 'room', 'ai', 'vocal', 'acoustic']
  },
  {
    id: 'ai-spring-reverb',
    name: 'AI Spring Reverb',
    manufacturer: 'DAWG AI',
    category: 'AI Reverb',
    isAI: true,
    description: 'Vintage spring reverb with AI character enhancement',
    icon: '🌊',
    tags: ['reverb', 'spring', 'ai', 'vintage', 'guitar']
  }
];
