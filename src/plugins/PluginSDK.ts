/**
 * Plugin SDK
 * Foundation for third-party AI effects and plugins
 */

import { AIPlugin, PluginMetadata, PluginPermission } from '../ai/integration/types';

export interface PluginContext {
  projectInfo: {
    sampleRate: number;
    bufferSize: number;
    tempo: number;
  };
  permissions: PluginPermission[];
  allocatedResources: {
    maxMemory: number;
    gpuAccess: boolean;
  };
}

export interface PluginLifecycle {
  onLoad(context: PluginContext): Promise<void>;
  onUnload(): Promise<void>;
  onActivate(): Promise<void>;
  onDeactivate(): Promise<void>;
}

export interface AudioPluginInterface extends PluginLifecycle {
  processAudio(
    input: Float32Array[],
    output: Float32Array[],
    sampleCount: number
  ): void;
  setParameter(name: string, value: number): void;
  getParameter(name: string): number;
  getParameters(): PluginParameter[];
}

export interface PluginParameter {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
  type: 'continuous' | 'discrete' | 'toggle';
}

export class PluginSDK {
  private static instance: PluginSDK;
  private loadedPlugins: Map<string, PluginInstance> = new Map();
  private pluginRegistry: Map<string, AIPlugin> = new Map();

  private constructor() {}

  static getInstance(): PluginSDK {
    if (!PluginSDK.instance) {
      PluginSDK.instance = new PluginSDK();
    }
    return PluginSDK.instance;
  }

  /**
   * Load a plugin from path
   */
  async load(pluginPath: string): Promise<AIPlugin> {
    try {
      // Validate plugin manifest
      const manifest = await this.loadManifest(pluginPath);
      this.validateManifest(manifest);

      // Check permissions
      this.checkPermissions(manifest.metadata.permissions);

      // Load plugin code
      const pluginInstance = await this.loadPluginCode(pluginPath, manifest);

      // Register plugin
      this.pluginRegistry.set(manifest.id, manifest);
      this.loadedPlugins.set(manifest.id, pluginInstance);

      console.log(`[Plugin SDK] Loaded plugin: ${manifest.name} v${manifest.version}`);

      return manifest;
    } catch (error) {
      throw new Error(
        `Failed to load plugin from ${pluginPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const instance = this.loadedPlugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    await instance.implementation.onUnload();
    this.loadedPlugins.delete(pluginId);
    this.pluginRegistry.delete(pluginId);

    console.log(`[Plugin SDK] Unloaded plugin: ${pluginId}`);
  }

  /**
   * Get loaded plugin instance
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): AIPlugin[] {
    return Array.from(this.pluginRegistry.values());
  }

  /**
   * Create plugin context
   */
  createContext(plugin: AIPlugin): PluginContext {
    return {
      projectInfo: {
        sampleRate: 48000, // Would come from audio engine
        bufferSize: 512,
        tempo: 120,
      },
      permissions: plugin.metadata.permissions,
      allocatedResources: {
        maxMemory: 512, // MB
        gpuAccess: plugin.metadata.permissions.includes('gpu.access'),
      },
    };
  }

  private async loadManifest(pluginPath: string): Promise<AIPlugin> {
    // In production, would read actual manifest file
    // For now, return mock data
    return {
      id: `plugin-${Date.now()}`,
      name: 'Sample Plugin',
      version: '1.0.0',
      author: 'Third Party',
      description: 'Sample AI plugin',
      category: 'effect',
      entryPoint: `${pluginPath}/index.js`,
      metadata: {
        tags: ['reverb', 'ai'],
        license: 'MIT',
        dependencies: [],
        permissions: ['audio.read', 'audio.write'],
        sdkVersion: '1.0.0',
      },
    };
  }

  private validateManifest(manifest: AIPlugin): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }

    if (!manifest.metadata.sdkVersion) {
      throw new Error('Plugin SDK version not specified');
    }

    // Check SDK compatibility
    const currentVersion = '1.0.0';
    if (!this.isCompatibleVersion(manifest.metadata.sdkVersion, currentVersion)) {
      throw new Error(
        `Plugin requires SDK version ${manifest.metadata.sdkVersion}, current version is ${currentVersion}`
      );
    }
  }

  private checkPermissions(permissions: PluginPermission[]): void {
    const dangerousPermissions: PluginPermission[] = [
      'filesystem.write',
      'network.access',
    ];

    const requestedDangerous = permissions.filter((p) =>
      dangerousPermissions.includes(p)
    );

    if (requestedDangerous.length > 0) {
      console.warn(
        `[Plugin SDK] Plugin requests dangerous permissions: ${requestedDangerous.join(', ')}`
      );
      // In production, would prompt user for approval
    }
  }

  private async loadPluginCode(
    pluginPath: string,
    manifest: AIPlugin
  ): Promise<PluginInstance> {
    // In production, would dynamically load plugin code
    // For now, return mock implementation
    return {
      manifest,
      implementation: new MockAudioPlugin(),
      context: this.createContext(manifest),
    };
  }

  private isCompatibleVersion(required: string, current: string): boolean {
    const [reqMajor] = required.split('.').map(Number);
    const [curMajor] = current.split('.').map(Number);
    return reqMajor === curMajor;
  }
}

interface PluginInstance {
  manifest: AIPlugin;
  implementation: AudioPluginInterface;
  context: PluginContext;
}

// Mock implementation for demonstration
class MockAudioPlugin implements AudioPluginInterface {
  private parameters: Map<string, number> = new Map();

  async onLoad(context: PluginContext): Promise<void> {
    console.log('Plugin loaded with context:', context);
  }

  async onUnload(): Promise<void> {
    console.log('Plugin unloaded');
  }

  async onActivate(): Promise<void> {
    console.log('Plugin activated');
  }

  async onDeactivate(): Promise<void> {
    console.log('Plugin deactivated');
  }

  processAudio(
    input: Float32Array[],
    output: Float32Array[],
    sampleCount: number
  ): void {
    // Pass-through for now
    for (let channel = 0; channel < input.length; channel++) {
      output[channel].set(input[channel]);
    }
  }

  setParameter(name: string, value: number): void {
    this.parameters.set(name, value);
  }

  getParameter(name: string): number {
    return this.parameters.get(name) || 0;
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'gain',
        label: 'Gain',
        min: 0,
        max: 1,
        default: 0.5,
        unit: 'dB',
        type: 'continuous',
      },
    ];
  }
}
