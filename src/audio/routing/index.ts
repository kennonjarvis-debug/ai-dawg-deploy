/**
 * Routing Engine Singleton
 * Provides global access to Logic Pro X-style routing system
 */

import { RoutingEngine } from './RoutingEngine';
import { PluginHost } from '../../audio-engine/plugins/PluginHost';

let routingEngineInstance: RoutingEngine | null = null;
let pluginHostInstance: PluginHost | null = null;

/**
 * Initialize routing engine with audio context
 */
export const initializeRoutingEngine = (audioContext: AudioContext): RoutingEngine => {
  // Create plugin host if not exists
  if (!pluginHostInstance) {
    pluginHostInstance = new PluginHost(audioContext);
  }

  // Create routing engine
  routingEngineInstance = new RoutingEngine(audioContext, pluginHostInstance);

  console.log('[RoutingEngine] Singleton initialized');
  return routingEngineInstance;
};

/**
 * Get routing engine instance (must be initialized first)
 */
export const getRoutingEngine = (): RoutingEngine => {
  if (!routingEngineInstance) {
    throw new Error('RoutingEngine not initialized. Call initializeRoutingEngine first.');
  }
  return routingEngineInstance;
};

/**
 * Get plugin host instance
 */
export const getPluginHost = (): PluginHost | null => {
  return pluginHostInstance;
};

/**
 * Check if routing engine is initialized
 */
export const isRoutingEngineInitialized = (): boolean => {
  return routingEngineInstance !== null;
};

/**
 * Dispose routing engine (cleanup)
 */
export const disposeRoutingEngine = (): void => {
  if (routingEngineInstance) {
    routingEngineInstance.dispose();
    routingEngineInstance = null;
  }
  if (pluginHostInstance) {
    pluginHostInstance.dispose();
    pluginHostInstance = null;
  }
  console.log('[RoutingEngine] Singleton disposed');
};

// Re-export types for convenience
export * from './types';
export { RoutingEngine } from './RoutingEngine';
