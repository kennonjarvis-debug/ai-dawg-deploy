/**
 * Plugin Instance Manager
 *
 * Manages multiple plugin instances and audio routing.
 * Handles plugin chains, latency compensation, and resource management.
 */

import { BasePluginWrapper } from './wrappers/BasePluginWrapper';
import type { PluginMetadata } from './types';
import {
  createWebAudioPlugin,
  createVST3Plugin,
  createAUPlugin,
  createCLAPPlugin,
} from './wrappers';
import { logger } from '$lib/utils/logger';
import type {
  WebAudioPluginConfig,
  VST3NativeBridge,
  AUNativeBridge,
  CLAPNativeBridge,
} from './wrappers';

/**
 * Plugin Instance
 * Represents a loaded plugin with its wrapper and metadata
 */
export interface PluginInstance {
  id: string; // Unique instance ID
  pluginId: string; // Plugin metadata ID
  wrapper: BasePluginWrapper;
  metadata: PluginMetadata;
  loadedAt: Date;
}

/**
 * Plugin Chain
 * Represents a series of plugins connected in sequence
 */
export interface PluginChain {
  id: string;
  name: string;
  instances: string[]; // Array of instance IDs
  inputGain: GainNode;
  outputGain: GainNode;
  enabled: boolean;
}

/**
 * Native Bridges Configuration
 */
export interface NativeBridgesConfig {
  vst3?: VST3NativeBridge;
  au?: AUNativeBridge;
  clap?: CLAPNativeBridge;
}

/**
 * Instance Statistics
 */
export interface InstanceStats {
  totalInstances: number;
  loadedPlugins: number;
  totalLatency: number;
  totalCPUUsage: number;
  byFormat: Record<string, number>;
}

/**
 * Plugin Instance Manager
 * Central manager for plugin instances, chains, and routing
 */
export class PluginInstanceManager {
  private audioContext: AudioContext;
  private instances: Map<string, PluginInstance> = new Map();
  private chains: Map<string, PluginChain> = new Map();
  private nativeBridges: NativeBridgesConfig = {};

  // Web Audio plugin configurations
  private webAudioConfigs: Map<string, WebAudioPluginConfig> = new Map();

  constructor(audioContext: AudioContext, nativeBridges?: NativeBridgesConfig) {
    this.audioContext = audioContext;
    if (nativeBridges) {
      this.nativeBridges = nativeBridges;
    }
  }

  /**
   * Register a Web Audio plugin configuration
   */
  registerWebAudioConfig(pluginId: string, config: WebAudioPluginConfig): void {
    this.webAudioConfigs.set(pluginId, config);
  }

  /**
   * Set native bridges (can be done after construction)
   */
  setNativeBridges(bridges: NativeBridgesConfig): void {
    this.nativeBridges = { ...this.nativeBridges, ...bridges };
  }

  /**
   * Load a plugin instance
   */
  async loadPlugin(metadata: PluginMetadata, instanceId?: string): Promise<string> {
    const id = instanceId || this.generateInstanceId(metadata);

    if (this.instances.has(id)) {
      throw new Error(`Plugin instance already exists: ${id}`);
    }

    try {
      logger.info(`[InstanceManager] Loading plugin: ${metadata.name} (${id})`);

      // Create wrapper based on format
      let wrapper: BasePluginWrapper;

      switch (metadata.format) {
        case 'web': {
          const config = this.webAudioConfigs.get(metadata.id);
          if (!config) {
            throw new Error(
              `Web Audio plugin config not registered: ${metadata.id}. ` +
                `Use registerWebAudioConfig() first.`
            );
          }
          wrapper = createWebAudioPlugin(metadata, this.audioContext, config);
          break;
        }

        case 'vst3': {
          if (!this.nativeBridges.vst3) {
            throw new Error('VST3 native bridge not configured');
          }
          wrapper = createVST3Plugin(
            metadata,
            this.audioContext,
            this.nativeBridges.vst3
          );
          break;
        }

        case 'au': {
          if (!this.nativeBridges.au) {
            throw new Error('Audio Units native bridge not configured');
          }
          wrapper = createAUPlugin(
            metadata,
            this.audioContext,
            this.nativeBridges.au
          );
          break;
        }

        case 'clap': {
          if (!this.nativeBridges.clap) {
            throw new Error('CLAP native bridge not configured');
          }
          wrapper = createCLAPPlugin(
            metadata,
            this.audioContext,
            this.nativeBridges.clap
          );
          break;
        }

        default:
          throw new Error(`Unsupported plugin format: ${metadata.format}`);
      }

      // Load the plugin
      await wrapper.load();

      // Create instance
      const instance: PluginInstance = {
        id,
        pluginId: metadata.id,
        wrapper,
        metadata,
        loadedAt: new Date(),
      };

      this.instances.set(id, instance);

      logger.info(`[InstanceManager] Plugin loaded: ${metadata.name} (${id})`);
      return id;
    } catch (error) {
      logger.error(`[InstanceManager] Failed to load plugin: ${metadata.name}`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin instance
   */
  async unloadPlugin(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Plugin instance not found: ${instanceId}`);
    }

    try {
      logger.info(`[InstanceManager] Unloading plugin: ${instance.metadata.name} (${instanceId})`);

      // Remove from any chains
      for (const chain of this.chains.values()) {
        const index = chain.instances.indexOf(instanceId);
        if (index !== -1) {
          await this.removeFromChain(chain.id, instanceId);
        }
      }

      // Unload wrapper
      await instance.wrapper.unload();

      // Remove instance
      this.instances.delete(instanceId);

      logger.info(`[InstanceManager] Plugin unloaded: ${instance.metadata.name} (${instanceId})`);
    } catch (error) {
      logger.error(`[InstanceManager] Failed to unload plugin: ${instanceId}`, error);
      throw error;
    }
  }

  /**
   * Get a plugin instance
   */
  getInstance(instanceId: string): PluginInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all plugin instances
   */
  getAllInstances(): PluginInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances by plugin ID
   */
  getInstancesByPlugin(pluginId: string): PluginInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.pluginId === pluginId
    );
  }

  /**
   * Create a plugin chain
   */
  createChain(chainId: string, name: string): string {
    if (this.chains.has(chainId)) {
      throw new Error(`Chain already exists: ${chainId}`);
    }

    const inputGain = this.audioContext.createGain();
    const outputGain = this.audioContext.createGain();

    const chain: PluginChain = {
      id: chainId,
      name,
      instances: [],
      inputGain,
      outputGain,
      enabled: true,
    };

    // Initially connect input to output (bypass)
    inputGain.connect(outputGain);

    this.chains.set(chainId, chain);

    logger.info(`[InstanceManager] Created chain: ${name} (${chainId})`);
    return chainId;
  }

  /**
   * Add plugin instance to chain
   */
  async addToChain(chainId: string, instanceId: string, position?: number): Promise<void> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Disconnect current routing
    this.disconnectChain(chain);

    // Add to chain at position
    const pos = position !== undefined ? position : chain.instances.length;
    chain.instances.splice(pos, 0, instanceId);

    // Reconnect chain
    this.connectChain(chain);

    logger.info(
      `[InstanceManager] Added ${instance.metadata.name} to chain ${chain.name} at position ${pos}`
    );
  }

  /**
   * Remove plugin instance from chain
   */
  async removeFromChain(chainId: string, instanceId: string): Promise<void> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const index = chain.instances.indexOf(instanceId);
    if (index === -1) {
      throw new Error(`Instance not in chain: ${instanceId}`);
    }

    // Disconnect current routing
    this.disconnectChain(chain);

    // Remove from chain
    chain.instances.splice(index, 1);

    // Reconnect chain
    this.connectChain(chain);

    logger.info(`[InstanceManager] Removed instance from chain: ${instanceId}`);
  }

  /**
   * Reorder plugin in chain
   */
  async reorderInChain(
    chainId: string,
    instanceId: string,
    newPosition: number
  ): Promise<void> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    const oldIndex = chain.instances.indexOf(instanceId);
    if (oldIndex === -1) {
      throw new Error(`Instance not in chain: ${instanceId}`);
    }

    // Disconnect current routing
    this.disconnectChain(chain);

    // Move instance
    chain.instances.splice(oldIndex, 1);
    chain.instances.splice(newPosition, 0, instanceId);

    // Reconnect chain
    this.connectChain(chain);

    logger.info(
      `[InstanceManager] Reordered instance in chain: ${instanceId} to position ${newPosition}`
    );
  }

  /**
   * Connect chain audio routing
   */
  private connectChain(chain: PluginChain): void {
    if (chain.instances.length === 0) {
      // No plugins, connect input to output
      chain.inputGain.connect(chain.outputGain);
      return;
    }

    // Connect: input -> plugin1 -> plugin2 -> ... -> pluginN -> output
    let previousNode: AudioNode = chain.inputGain;

    for (const instanceId of chain.instances) {
      const instance = this.instances.get(instanceId);
      if (!instance) continue;

      const inputNode = instance.wrapper.getInputNode();
      const outputNode = instance.wrapper.getOutputNode();

      if (!inputNode || !outputNode) continue;

      // Connect previous node to this plugin's input
      previousNode.connect(inputNode);

      // Update previous node for next iteration
      previousNode = outputNode;
    }

    // Connect last plugin to chain output
    previousNode.connect(chain.outputGain);
  }

  /**
   * Disconnect chain audio routing
   */
  private disconnectChain(chain: PluginChain): void {
    try {
      chain.inputGain.disconnect();

      for (const instanceId of chain.instances) {
        const instance = this.instances.get(instanceId);
        if (!instance) continue;

        const inputNode = instance.wrapper.getInputNode();
        const outputNode = instance.wrapper.getOutputNode();

        if (inputNode) inputNode.disconnect();
        if (outputNode) outputNode.disconnect();
      }
    } catch (error) {
      // Ignore disconnect errors (already disconnected)
    }
  }

  /**
   * Get chain
   */
  getChain(chainId: string): PluginChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all chains
   */
  getAllChains(): PluginChain[] {
    return Array.from(this.chains.values());
  }

  /**
   * Delete chain
   */
  async deleteChain(chainId: string): Promise<void> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    // Disconnect audio
    this.disconnectChain(chain);

    // Remove chain
    this.chains.delete(chainId);

    logger.info(`[InstanceManager] Deleted chain: ${chain.name} (${chainId})`);
  }

  /**
   * Enable/disable chain
   */
  setChainEnabled(chainId: string, enabled: boolean): void {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }

    chain.enabled = enabled;

    if (enabled) {
      chain.outputGain.gain.value = 1;
    } else {
      chain.outputGain.gain.value = 0;
    }
  }

  /**
   * Get chain input node (for connecting audio sources)
   */
  getChainInput(chainId: string): GainNode {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }
    return chain.inputGain;
  }

  /**
   * Get chain output node (for connecting to destinations)
   */
  getChainOutput(chainId: string): GainNode {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Chain not found: ${chainId}`);
    }
    return chain.outputGain;
  }

  /**
   * Get total latency for a chain (sum of all plugins)
   */
  getChainLatency(chainId: string): number {
    const chain = this.chains.get(chainId);
    if (!chain) {
      return 0;
    }

    let totalLatency = 0;
    for (const instanceId of chain.instances) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        totalLatency += instance.wrapper.getLatency();
      }
    }

    return totalLatency;
  }

  /**
   * Get total CPU usage for a chain
   */
  getChainCPUUsage(chainId: string): number {
    const chain = this.chains.get(chainId);
    if (!chain) {
      return 0;
    }

    let totalCPU = 0;
    for (const instanceId of chain.instances) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        totalCPU += instance.wrapper.getCPUUsage();
      }
    }

    return totalCPU;
  }

  /**
   * Get instance statistics
   */
  getStats(): InstanceStats {
    const byFormat: Record<string, number> = {};
    let totalLatency = 0;
    let totalCPUUsage = 0;

    for (const instance of this.instances.values()) {
      const format = instance.metadata.format;
      byFormat[format] = (byFormat[format] || 0) + 1;
      totalLatency += instance.wrapper.getLatency();
      totalCPUUsage += instance.wrapper.getCPUUsage();
    }

    return {
      totalInstances: this.instances.size,
      loadedPlugins: new Set(
        Array.from(this.instances.values()).map((i) => i.pluginId)
      ).size,
      totalLatency,
      totalCPUUsage,
      byFormat,
    };
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(metadata: PluginMetadata): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${metadata.id}-${timestamp}-${random}`;
  }

  /**
   * Unload all plugins and clean up
   */
  async cleanup(): Promise<void> {
    logger.info('[InstanceManager] Cleaning up all plugins...');

    // Delete all chains
    for (const chainId of Array.from(this.chains.keys())) {
      await this.deleteChain(chainId);
    }

    // Unload all instances
    for (const instanceId of Array.from(this.instances.keys())) {
      await this.unloadPlugin(instanceId);
    }

    logger.info('[InstanceManager] Cleanup complete');
  }
}

/**
 * Singleton instance manager
 */
let instanceManager: PluginInstanceManager | null = null;

/**
 * Get the global instance manager
 */
export function getInstanceManager(
  audioContext?: AudioContext,
  nativeBridges?: NativeBridgesConfig
): PluginInstanceManager {
  if (!instanceManager) {
    if (!audioContext) {
      throw new Error('AudioContext required for first call to getInstanceManager()');
    }
    instanceManager = new PluginInstanceManager(audioContext, nativeBridges);
  }
  return instanceManager;
}

/**
 * Reset the global instance manager
 */
export async function resetInstanceManager(): Promise<void> {
  if (instanceManager) {
    await instanceManager.cleanup();
    instanceManager = null;
  }
}
