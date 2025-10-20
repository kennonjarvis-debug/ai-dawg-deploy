/**
 * Mock Audio Units Native Bridge
 *
 * This is a simulation/mock implementation for testing and development.
 * It simulates macOS Audio Units plugin loading and processing without actual native code.
 *
 * PURPOSE:
 * - Test wrapper integration
 * - Develop UI before native implementation
 * - Demonstrate expected behavior on macOS
 * - Provide realistic test data
 *
 * PLATFORM: macOS only (Audio Units are macOS-specific)
 * REPLACE THIS with real native bridge in production!
 */

import { logger } from '$lib/utils/logger';
import type {
  AUNativeBridge,
  AUPluginHandle,
  AUPluginInfo,
  AUParameterInfo,
  AUPresetInfo,
  AudioTimeStamp,
} from '../wrappers/AUPluginWrapper';

/**
 * Mock AU Plugin Data
 */
interface MockAUPlugin {
  path: string;
  info: AUPluginInfo;
  state: {
    initialized: boolean;
    sampleRate: number;
    parameters: Map<number, number>; // paramId -> value
    activePreset: number | null;
  };
}

/**
 * Mock Audio Units Bridge Implementation
 */
export class MockAUBridge implements AUNativeBridge {
  private plugins: Map<AUPluginHandle, MockAUPlugin> = new Map();
  private nextHandle: number = 1;

  // Mock plugin library (simulates installed macOS Audio Units)
  private mockPluginLibrary: Map<string, AUPluginInfo> = new Map([
    // FabFilter Pro-Q 3 (AU version)
    [
      '/Library/Audio/Plug-Ins/Components/FabFilter Pro-Q 3.component',
      {
        name: 'FabFilter Pro-Q 3',
        manufacturerName: 'FabFilter',
        version: 0x00012100, // 1.21.0 in BCD format
        type: 'aufx', // Audio Effect
        subType: 'FPEQ',
        manufacturer: 'FabF',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Band 1 Frequency',
            unit: 'Hz',
            minValue: 20,
            maxValue: 20000,
            defaultValue: 1000,
            flags: 1, // kAudioUnitParameterFlag_IsReadable | IsWritable
          },
          {
            id: 1,
            name: 'Band 1 Gain',
            unit: 'dB',
            minValue: -15,
            maxValue: 15,
            defaultValue: 0,
            flags: 1,
          },
          {
            id: 2,
            name: 'Band 1 Q',
            unit: '',
            minValue: 0.1,
            maxValue: 10,
            defaultValue: 1,
            flags: 1,
          },
        ],
        presets: [
          { number: 0, name: 'Default' },
          { number: 1, name: 'Vocal Presence' },
          { number: 2, name: 'De-Muddy' },
          { number: 3, name: 'Mastering EQ' },
        ],
        supportsmidi: false,
        supportsTail: false,
      },
    ],

    // Apple AUGraphicEQ (built-in)
    [
      '/System/Library/Components/CoreAudio.component',
      {
        name: 'AUGraphicEQ',
        manufacturerName: 'Apple',
        version: 0x00010000, // 1.0.0
        type: 'aufx',
        subType: 'greq',
        manufacturer: 'appl',
        inputs: 2,
        outputs: 2,
        parameters: [
          { id: 0, name: '31 Hz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 1, name: '63 Hz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 2, name: '125 Hz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 3, name: '250 Hz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 4, name: '500 Hz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 5, name: '1 kHz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 6, name: '2 kHz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 7, name: '4 kHz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 8, name: '8 kHz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
          { id: 9, name: '16 kHz', unit: 'dB', minValue: -20, maxValue: 20, defaultValue: 0, flags: 1 },
        ],
        presets: [
          { number: 0, name: 'Flat' },
          { number: 1, name: 'Bass Boost' },
          { number: 2, name: 'Treble Boost' },
        ],
        supportsmidi: false,
        supportsTail: false,
      },
    ],

    // Apple AUDynamicsProcessor (built-in compressor)
    [
      '/System/Library/Components/DynamicsProcessor.component',
      {
        name: 'AUDynamicsProcessor',
        manufacturerName: 'Apple',
        version: 0x00010000,
        type: 'aufx',
        subType: 'dcmp',
        manufacturer: 'appl',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Threshold',
            unit: 'dB',
            minValue: -40,
            maxValue: 20,
            defaultValue: -20,
            flags: 1,
          },
          {
            id: 1,
            name: 'Ratio',
            unit: ':1',
            minValue: 1,
            maxValue: 20,
            defaultValue: 4,
            flags: 1,
          },
          {
            id: 2,
            name: 'Attack Time',
            unit: 'ms',
            minValue: 0.1,
            maxValue: 500,
            defaultValue: 10,
            flags: 1,
          },
          {
            id: 3,
            name: 'Release Time',
            unit: 'ms',
            minValue: 10,
            maxValue: 3000,
            defaultValue: 100,
            flags: 1,
          },
          {
            id: 4,
            name: 'Master Gain',
            unit: 'dB',
            minValue: -20,
            maxValue: 20,
            defaultValue: 0,
            flags: 1,
          },
        ],
        presets: [
          { number: 0, name: 'General Compression' },
          { number: 1, name: 'Gentle Compression' },
          { number: 2, name: 'Heavy Compression' },
        ],
        supportsmidi: false,
        supportsTail: false,
      },
    ],

    // Apple AUMatrixReverb (built-in reverb)
    [
      '/System/Library/Components/MatrixReverb.component',
      {
        name: 'AUMatrixReverb',
        manufacturerName: 'Apple',
        version: 0x00010000,
        type: 'aufx',
        subType: 'mrev',
        manufacturer: 'appl',
        inputs: 2,
        outputs: 2,
        parameters: [
          {
            id: 0,
            name: 'Dry/Wet Mix',
            unit: '%',
            minValue: 0,
            maxValue: 100,
            defaultValue: 50,
            flags: 1,
          },
          {
            id: 1,
            name: 'Reverb Time',
            unit: 'seconds',
            minValue: 0.1,
            maxValue: 15,
            defaultValue: 1.5,
            flags: 1,
          },
          {
            id: 2,
            name: 'Pre-Delay',
            unit: 'ms',
            minValue: 0,
            maxValue: 200,
            defaultValue: 20,
            flags: 1,
          },
        ],
        presets: [
          { number: 0, name: 'Small Room' },
          { number: 1, name: 'Medium Hall' },
          { number: 2, name: 'Large Cathedral' },
          { number: 3, name: 'Plate' },
        ],
        supportsmidi: false,
        supportsTail: true, // Reverb has tail
      },
    ],
  ]);

  /**
   * Load an Audio Unit
   */
  async loadAudioUnit(path: string, type: string, subType: string): Promise<AUPluginHandle> {
    logger.info(`[MockAUBridge] Loading AU: ${path} (${type}:${subType})`);

    const info = this.mockPluginLibrary.get(path);
    if (!info) {
      throw new Error(`Mock Audio Unit not found: ${path}`);
    }

    const handle = this.nextHandle++;

    const mockPlugin: MockAUPlugin = {
      path,
      info: JSON.parse(JSON.stringify(info)),
      state: {
        initialized: false,
        sampleRate: 44100,
        parameters: new Map(),
        activePreset: null,
      },
    };

    // Initialize default parameter values
    for (const param of mockPlugin.info.parameters) {
      mockPlugin.state.parameters.set(param.id, param.defaultValue);
    }

    this.plugins.set(handle, mockPlugin);

    logger.info(`[MockAUBridge] Loaded AU: ${info.name} (handle: ${handle})`);
    return handle;
  }

  /**
   * Unload an Audio Unit
   */
  async unloadAudioUnit(handle: AUPluginHandle): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    logger.info(`[MockAUBridge] Unloading AU: ${plugin.info.name}`);
    this.plugins.delete(handle);
  }

  /**
   * Get plugin metadata
   */
  async getMetadata(handle: AUPluginHandle): Promise<AUPluginInfo> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    return JSON.parse(JSON.stringify(plugin.info));
  }

  /**
   * Initialize Audio Unit
   */
  async initialize(
    handle: AUPluginHandle,
    sampleRate: number,
    maxFramesPerSlice: number
  ): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    plugin.state.initialized = true;
    plugin.state.sampleRate = sampleRate;

    logger.info(
      `[MockAUBridge] Initialized ${plugin.info.name} at ${sampleRate}Hz, ` +
        `max frames: ${maxFramesPerSlice}`
    );
  }

  /**
   * Set parameter value
   */
  setParameter(
    handle: AUPluginHandle,
    parameterId: number,
    value: number,
    scope: number,
    element: number
  ): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    const param = plugin.info.parameters.find((p) => p.id === parameterId);
    if (!param) {
      throw new Error(`Invalid parameter ID: ${parameterId}`);
    }

    // Clamp to parameter range
    const clampedValue = Math.max(param.minValue, Math.min(param.maxValue, value));
    plugin.state.parameters.set(parameterId, clampedValue);
  }

  /**
   * Get parameter value
   */
  getParameter(
    handle: AUPluginHandle,
    parameterId: number,
    scope: number,
    element: number
  ): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    const value = plugin.state.parameters.get(parameterId);
    if (value === undefined) {
      throw new Error(`Invalid parameter ID: ${parameterId}`);
    }

    return value;
  }

  /**
   * Get parameter info
   */
  getParameterInfo(
    handle: AUPluginHandle,
    parameterId: number,
    scope: number,
    element: number
  ): AUParameterInfo {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    const param = plugin.info.parameters.find((p) => p.id === parameterId);
    if (!param) {
      throw new Error(`Invalid parameter ID: ${parameterId}`);
    }

    return JSON.parse(JSON.stringify(param));
  }

  /**
   * Set factory preset
   */
  async setFactoryPreset(handle: AUPluginHandle, presetNumber: number): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    const preset = plugin.info.presets.find((p) => p.number === presetNumber);
    if (!preset) {
      throw new Error(`Invalid preset number: ${presetNumber}`);
    }

    plugin.state.activePreset = presetNumber;
    logger.info(`[MockAUBridge] Loaded preset "${preset.name}" on ${plugin.info.name}`);

    // In real implementation, this would load preset parameters
  }

  /**
   * Get factory presets
   */
  async getFactoryPresets(handle: AUPluginHandle): Promise<AUPresetInfo[]> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    return JSON.parse(JSON.stringify(plugin.info.presets));
  }

  /**
   * Render audio
   */
  render(
    handle: AUPluginHandle,
    ioActionFlags: number,
    inTimeStamp: AudioTimeStamp,
    inBusNumber: number,
    inNumberFrames: number,
    ioData: Float32Array[]
  ): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    // Mock processing: apply simple gain based on first parameter
    const firstParam = plugin.state.parameters.get(0);
    let gain = 1.0;

    // Adjust gain based on plugin type
    if (plugin.info.name.includes('Compressor')) {
      // Compressor: reduce peaks
      gain = 0.8;
    } else if (plugin.info.name.includes('EQ')) {
      // EQ: subtle gain adjustment
      gain = 0.95;
    }

    for (let ch = 0; ch < ioData.length; ch++) {
      const buffer = ioData[ch];
      for (let i = 0; i < inNumberFrames; i++) {
        buffer[i] = buffer[i] * gain;
      }
    }
  }

  /**
   * Get latency
   */
  getLatency(handle: AUPluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    // Mock latency
    if (plugin.info.name.includes('Compressor')) {
      return 256; // Compressors often have lookahead
    }

    return 0;
  }

  /**
   * Get tail time (for reverbs, delays)
   */
  getTailTime(handle: AUPluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    if (plugin.info.supportsTail) {
      return 2.0; // 2 seconds tail for reverb
    }

    return 0;
  }

  /**
   * Get CPU load estimate
   */
  getCPULoad(handle: AUPluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    const name = plugin.info.name.toLowerCase();
    if (name.includes('reverb')) return 0.18;
    if (name.includes('eq')) return 0.04;
    if (name.includes('compressor')) return 0.06;
    return 0.05;
  }

  /**
   * Reset plugin state
   */
  reset(handle: AUPluginHandle): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid AU handle: ${handle}`);
    }

    // Reset parameters to defaults
    for (const param of plugin.info.parameters) {
      plugin.state.parameters.set(param.id, param.defaultValue);
    }

    plugin.state.activePreset = null;

    logger.info(`[MockAUBridge] Reset ${plugin.info.name}`);
  }

  /**
   * Get list of mock AU plugins
   */
  getMockAUPaths(): string[] {
    return Array.from(this.mockPluginLibrary.keys());
  }

  /**
   * Add custom mock plugin
   */
  addMockAU(path: string, info: AUPluginInfo): void {
    this.mockPluginLibrary.set(path, info);
    logger.info(`[MockAUBridge] Added mock AU: ${info.name}`);
  }
}

/**
 * Create mock AU bridge instance
 */
export function createMockAUBridge(): MockAUBridge {
  return new MockAUBridge();
}

/**
 * Get available mock AU plugins
 */
export function getMockAUPlugins(): Array<{ path: string; name: string; manufacturer: string }> {
  const bridge = new MockAUBridge();
  const paths = bridge.getMockAUPaths();

  return paths.map((path) => {
    const info = (bridge as any).mockPluginLibrary.get(path);
    return {
      path,
      name: info.name,
      manufacturer: info.manufacturerName,
    };
  });
}
