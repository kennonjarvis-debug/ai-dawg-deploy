/**
 * Mock VST3 Native Bridge
 *
 * This is a simulation/mock implementation for testing and development.
 * It simulates VST3 plugin loading and processing without actual native code.
 *
 * PURPOSE:
 * - Test wrapper integration
 * - Develop UI before native implementation
 * - Demonstrate expected behavior
 * - Provide realistic test data
 *
 * REPLACE THIS with real native bridge in production!
 */

import { logger } from '$lib/utils/logger';
import type {
  VST3NativeBridge,
  VST3PluginHandle,
  VST3PluginInfo,
  VST3ParameterInfo,
  VST3ProgramInfo,
} from '../wrappers/VST3PluginWrapper';

/**
 * Mock VST3 Plugin Data
 * Simulates real plugin metadata
 */
interface MockVST3Plugin {
  path: string;
  info: VST3PluginInfo;
  state: {
    initialized: boolean;
    active: boolean;
    sampleRate: number;
    parameters: Map<number, number>;
  };
}

/**
 * Mock VST3 Bridge Implementation
 */
export class MockVST3Bridge implements VST3NativeBridge {
  private plugins: Map<VST3PluginHandle, MockVST3Plugin> = new Map();
  private nextHandle: number = 1;

  // Mock plugin library (simulates installed plugins)
  private mockPluginLibrary: Map<string, VST3PluginInfo> = new Map([
    // FabFilter Pro-Q 3 (EQ)
    [
      '/Library/Audio/Plug-Ins/VST3/FabFilter Pro-Q 3.vst3',
      {
        name: 'Pro-Q 3',
        vendor: 'FabFilter',
        version: '1.21.0',
        uid: 'FFPQ3',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Frequency 1',
            shortName: 'Freq1',
            units: 'Hz',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1, // Automatable
          },
          {
            id: 1,
            name: 'Gain 1',
            shortName: 'Gain1',
            units: 'dB',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
          {
            id: 2,
            name: 'Q 1',
            shortName: 'Q1',
            units: '',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
        ],
        programs: [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Vocal EQ' },
          { id: 2, name: 'Mastering' },
        ],
      },
    ],

    // Waves SSL G-Master Buss Compressor
    [
      '/Library/Audio/Plug-Ins/VST3/Waves SSL G-Master.vst3',
      {
        name: 'SSL G-Master Buss Compressor',
        vendor: 'Waves',
        version: '14.0.0',
        uid: 'WVSG',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Threshold',
            shortName: 'Thresh',
            units: 'dB',
            stepCount: 0,
            defaultValue: 0.7,
            flags: 1,
          },
          {
            id: 1,
            name: 'Ratio',
            shortName: 'Ratio',
            units: ':1',
            stepCount: 4, // 2:1, 4:1, 10:1, etc.
            defaultValue: 0.5,
            flags: 1,
          },
          {
            id: 2,
            name: 'Attack',
            shortName: 'Att',
            units: 'ms',
            stepCount: 0,
            defaultValue: 0.3,
            flags: 1,
          },
          {
            id: 3,
            name: 'Release',
            shortName: 'Rel',
            units: 'ms',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
          {
            id: 4,
            name: 'Make-up Gain',
            shortName: 'Makeup',
            units: 'dB',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
        ],
        programs: [
          { id: 0, name: 'Default' },
          { id: 1, name: 'Glue' },
          { id: 2, name: 'Punch' },
        ],
      },
    ],

    // Generic Reverb
    [
      '/Library/Audio/Plug-Ins/VST3/Generic Reverb.vst3',
      {
        name: 'Generic Reverb',
        vendor: 'Test Vendor',
        version: '1.0.0',
        uid: 'GREV',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Room Size',
            shortName: 'Size',
            units: '',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
          {
            id: 1,
            name: 'Damping',
            shortName: 'Damp',
            units: '',
            stepCount: 0,
            defaultValue: 0.5,
            flags: 1,
          },
          {
            id: 2,
            name: 'Mix',
            shortName: 'Mix',
            units: '%',
            stepCount: 0,
            defaultValue: 0.3,
            flags: 1,
          },
        ],
        programs: [
          { id: 0, name: 'Small Room' },
          { id: 1, name: 'Large Hall' },
          { id: 2, name: 'Plate' },
        ],
      },
    ],
  ]);

  /**
   * Load a VST3 plugin
   */
  async loadPlugin(path: string): Promise<VST3PluginHandle> {
    logger.info(`[MockVST3Bridge] Loading plugin: ${path}`);

    // Check if plugin exists in mock library
    const info = this.mockPluginLibrary.get(path);
    if (!info) {
      throw new Error(`Mock VST3 plugin not found: ${path}`);
    }

    // Create handle
    const handle = this.nextHandle++;

    // Create mock plugin
    const mockPlugin: MockVST3Plugin = {
      path,
      info: JSON.parse(JSON.stringify(info)), // Deep copy
      state: {
        initialized: false,
        active: false,
        sampleRate: 44100,
        parameters: new Map(),
      },
    };

    // Initialize default parameter values
    for (const param of mockPlugin.info.parameters) {
      mockPlugin.state.parameters.set(param.id, param.defaultValue);
    }

    this.plugins.set(handle, mockPlugin);

    logger.info(`[MockVST3Bridge] Loaded plugin: ${info.name} (handle: ${handle})`);
    return handle;
  }

  /**
   * Unload a VST3 plugin
   */
  async unloadPlugin(handle: VST3PluginHandle): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    logger.info(`[MockVST3Bridge] Unloading plugin: ${plugin.info.name}`);
    this.plugins.delete(handle);
  }

  /**
   * Get plugin metadata
   */
  async getMetadata(handle: VST3PluginHandle): Promise<VST3PluginInfo> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    return JSON.parse(JSON.stringify(plugin.info)); // Return copy
  }

  /**
   * Initialize plugin
   */
  async initialize(
    handle: VST3PluginHandle,
    sampleRate: number,
    maxBlockSize: number
  ): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    plugin.state.initialized = true;
    plugin.state.sampleRate = sampleRate;

    logger.info(
      `[MockVST3Bridge] Initialized ${plugin.info.name} at ${sampleRate}Hz, ` +
        `max block size: ${maxBlockSize}`
    );
  }

  /**
   * Set parameter value
   */
  setParameter(handle: VST3PluginHandle, parameterId: number, value: number): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    // Clamp to 0-1 (normalized)
    const clampedValue = Math.max(0, Math.min(1, value));
    plugin.state.parameters.set(parameterId, clampedValue);

    // In real implementation, this would update the VST3 parameter
    // logger.info(
    //   `[MockVST3Bridge] Set parameter ${parameterId} to ${clampedValue} ` +
    //     `on ${plugin.info.name}`
    // );
  }

  /**
   * Get parameter value
   */
  getParameter(handle: VST3PluginHandle, parameterId: number): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    const value = plugin.state.parameters.get(parameterId);
    if (value === undefined) {
      throw new Error(`Invalid parameter ID: ${parameterId}`);
    }

    return value;
  }

  /**
   * Process audio
   * In mock implementation, we just apply simple processing
   */
  process(
    handle: VST3PluginHandle,
    inputs: Float32Array[],
    outputs: Float32Array[],
    numFrames: number
  ): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    // Mock processing: copy input to output with slight gain adjustment
    for (let ch = 0; ch < Math.min(inputs.length, outputs.length); ch++) {
      const input = inputs[ch];
      const output = outputs[ch];

      for (let i = 0; i < numFrames; i++) {
        // Simple processing: slight gain based on first parameter
        const gain = 0.8 + 0.4 * (plugin.state.parameters.get(0) || 0.5);
        output[i] = input[i] * gain;
      }
    }
  }

  /**
   * Get latency
   */
  getLatency(handle: VST3PluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    // Mock latency (in samples)
    // Compressors typically have some latency for lookahead
    if (plugin.info.name.toLowerCase().includes('compressor')) {
      return 128; // 128 samples
    }

    return 0;
  }

  /**
   * Get CPU usage estimate
   */
  getCPUUsage(handle: VST3PluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    // Mock CPU usage (0-1)
    const name = plugin.info.name.toLowerCase();
    if (name.includes('reverb')) return 0.15;
    if (name.includes('eq')) return 0.05;
    if (name.includes('compressor')) return 0.08;
    return 0.05;
  }

  /**
   * Set active state
   */
  setActive(handle: VST3PluginHandle, active: boolean): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid plugin handle: ${handle}`);
    }

    plugin.state.active = active;
    logger.info(`[MockVST3Bridge] ${plugin.info.name} active: ${active}`);
  }

  /**
   * Get list of mock plugins available for testing
   */
  getMockPluginPaths(): string[] {
    return Array.from(this.mockPluginLibrary.keys());
  }

  /**
   * Add a custom mock plugin for testing
   */
  addMockPlugin(path: string, info: VST3PluginInfo): void {
    this.mockPluginLibrary.set(path, info);
    logger.info(`[MockVST3Bridge] Added mock plugin: ${info.name}`);
  }
}

/**
 * Create and return a mock VST3 bridge instance
 */
export function createMockVST3Bridge(): MockVST3Bridge {
  return new MockVST3Bridge();
}

/**
 * Get available mock VST3 plugins
 */
export function getMockVST3Plugins(): Array<{ path: string; name: string; vendor: string }> {
  const bridge = new MockVST3Bridge();
  const paths = bridge.getMockPluginPaths();

  return paths.map((path) => {
    const info = (bridge as any).mockPluginLibrary.get(path);
    return {
      path,
      name: info.name,
      vendor: info.vendor,
    };
  });
}
