/**
 * AI DAW - Audio Engine
 * Main entry point and public API
 *
 * @module AudioEngine
 * @author AI DAW Team - Agent 1 (Core Audio Engine Architect)
 */

// Core Engine
export { AudioEngine } from './core/AudioEngine';

// Types
export type {
  AudioEngineConfig,
  TrackConfig,
  AudioBuffer,
  ProcessorConfig,
  PluginConfig,
  MIDIMessage,
  TransportState,
  ExportOptions,
  AudioEngineStats
} from './core/types';

// Routing
export { Track } from './routing/Track';
export { AudioRouter } from './routing/AudioRouter';

// MIDI
export { MIDIManager } from './midi/MIDIManager';

// Plugins
export { PluginHost } from './plugins/PluginHost';
export type { Plugin } from './plugins/PluginHost';

// Utilities
export { AudioUtils } from './utils/AudioUtils';

// Version
export const VERSION = '0.1.0';
export const BUILD_DATE = new Date().toISOString();
