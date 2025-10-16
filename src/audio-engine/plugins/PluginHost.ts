/**
 * PluginHost - Manages VST/AU/Native plugin instances
 */

import { PluginConfig } from '../core/types';

export interface Plugin {
  id: string;
  name: string;
  process(inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void;
  setParameter(name: string, value: number): void;
  getParameter(name: string): number;
  dispose(): void;
}

export class PluginHost {
  private plugins: Map<string, Plugin> = new Map();
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Load a plugin
   */
  async loadPlugin(config: PluginConfig): Promise<string> {
    let plugin: Plugin;

    switch (config.type) {
      case 'native':
        plugin = await this.loadNativePlugin(config);
        break;

      case 'vst':
      case 'au':
        // TODO: Implement VST/AU loading (requires native bridge)
        throw new Error(`${config.type.toUpperCase()} plugins not yet supported`);

      default:
        throw new Error(`Unknown plugin type: ${config.type}`);
    }

    this.plugins.set(config.id, plugin);
    console.log(`PluginHost: Loaded ${config.type} plugin - ${config.name}`);

    return config.id;
  }

  /**
   * Load a native Web Audio plugin
   */
  private async loadNativePlugin(config: PluginConfig): Promise<Plugin> {
    // Create a native plugin wrapper
    const plugin: Plugin = {
      id: config.id,
      name: config.name,
      process: (inputBuffer: Float32Array[], outputBuffer: Float32Array[]) => {
        // Pass-through for now - actual processing will be implemented per plugin type
        for (let ch = 0; ch < Math.min(inputBuffer.length, outputBuffer.length); ch++) {
          outputBuffer[ch].set(inputBuffer[ch]);
        }
      },
      setParameter: (name: string, value: number) => {
        config.parameters[name] = value;
      },
      getParameter: (name: string): number => {
        return config.parameters[name] || 0;
      },
      dispose: () => {
        // Cleanup
      }
    };

    // Set initial parameters
    Object.entries(config.parameters).forEach(([name, value]) => {
      plugin.setParameter(name, value);
    });

    return plugin;
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.dispose();
    this.plugins.delete(pluginId);

    console.log(`PluginHost: Unloaded plugin - ${pluginId}`);
    return true;
  }

  /**
   * Get a plugin instance
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Process audio through a specific plugin
   */
  processPlugin(pluginId: string, inputBuffer: Float32Array[], outputBuffer: Float32Array[]): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      // Pass through if plugin not found
      for (let ch = 0; ch < Math.min(inputBuffer.length, outputBuffer.length); ch++) {
        outputBuffer[ch].set(inputBuffer[ch]);
      }
      return;
    }

    plugin.process(inputBuffer, outputBuffer);
  }

  /**
   * Set plugin parameter
   */
  setPluginParameter(pluginId: string, paramName: string, value: number): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.setParameter(paramName, value);
    }
  }

  /**
   * Get plugin parameter
   */
  getPluginParameter(pluginId: string, paramName: string): number | undefined {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.getParameter(paramName) : undefined;
  }

  /**
   * Dispose all plugins
   */
  dispose(): void {
    this.plugins.forEach(plugin => plugin.dispose());
    this.plugins.clear();
    console.log('PluginHost: All plugins disposed');
  }
}
