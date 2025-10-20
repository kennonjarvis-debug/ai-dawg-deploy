/**
 * Mock CLAP Native Bridge
 *
 * This is a simulation/mock implementation for testing and development.
 * It simulates CLAP plugin loading and processing without actual native code.
 *
 * PURPOSE:
 * - Test wrapper integration
 * - Develop UI before native implementation
 * - Demonstrate expected CLAP behavior
 * - Provide realistic test data
 *
 * CLAP (CLever Audio Plugin) is open-source (MIT license) and modern!
 * REPLACE THIS with real native bridge in production!
 */

import { logger } from '$lib/utils/logger';
import type {
  CLAPNativeBridge,
  CLAPPluginHandle,
  CLAPDescriptor,
  CLAPParameterInfo,
  CLAPProcessData,
  CLAPProcessStatus,
  CLAPEvent,
} from '../wrappers/CLAPPluginWrapper';

/**
 * Mock CLAP Plugin Data
 */
interface MockCLAPPlugin {
  path: string;
  descriptor: CLAPDescriptor;
  state: {
    initialized: boolean;
    activated: boolean;
    processing: boolean;
    sampleRate: number;
    parameters: Map<number, number>;
  };
}

/**
 * Mock CLAP Bridge Implementation
 */
export class MockCLAPBridge implements CLAPNativeBridge {
  private plugins: Map<CLAPPluginHandle, MockCLAPPlugin> = new Map();
  private nextHandle: number = 1;

  // Mock plugin library (simulates installed CLAP plugins)
  private mockPluginLibrary: Map<string, CLAPDescriptor> = new Map([
    // Surge XT (free, open-source CLAP native synth)
    [
      '/Library/Audio/Plug-Ins/CLAP/Surge XT.clap',
      {
        clapVersion: '1.1.0',
        id: 'org.surge-synth-team.surge-xt',
        name: 'Surge XT',
        vendor: 'Surge Synth Team',
        url: 'https://surge-synthesizer.github.io',
        manualUrl: 'https://surge-synthesizer.github.io/manual-xt',
        supportUrl: 'https://github.com/surge-synthesizer/surge',
        version: '1.3.0',
        description: 'Hybrid synthesizer with wavetable and subtractive synthesis',
        features: ['instrument', 'synthesizer', 'stereo'],
      },
    ],

    // Vital (free wavetable synth with CLAP support)
    [
      '/Library/Audio/Plug-Ins/CLAP/Vital.clap',
      {
        clapVersion: '1.1.0',
        id: 'com.vital.vital',
        name: 'Vital',
        vendor: 'Matt Tytel',
        url: 'https://vital.audio',
        manualUrl: 'https://vital.audio/manual',
        supportUrl: 'https://vital.audio/support',
        version: '1.5.5',
        description: 'Spectral warping wavetable synth',
        features: ['instrument', 'synthesizer', 'stereo'],
      },
    ],

    // Generic CLAP Compressor (example)
    [
      '/Library/Audio/Plug-Ins/CLAP/CLAP Compressor.clap',
      {
        clapVersion: '1.1.0',
        id: 'com.example.clap-compressor',
        name: 'CLAP Compressor',
        vendor: 'Example Vendor',
        url: 'https://example.com',
        manualUrl: 'https://example.com/manual',
        supportUrl: 'https://example.com/support',
        version: '1.0.0',
        description: 'High-quality dynamics compressor',
        features: ['audio-effect', 'compressor', 'stereo'],
      },
    ],

    // Generic CLAP EQ (example)
    [
      '/Library/Audio/Plug-Ins/CLAP/CLAP Parametric EQ.clap',
      {
        clapVersion: '1.1.0',
        id: 'com.example.clap-eq',
        name: 'CLAP Parametric EQ',
        vendor: 'Example Vendor',
        url: 'https://example.com',
        manualUrl: 'https://example.com/manual',
        supportUrl: 'https://example.com/support',
        version: '1.0.0',
        description: '4-band parametric equalizer',
        features: ['audio-effect', 'eq', 'equalizer', 'stereo'],
      },
    ],

    // Generic CLAP Reverb (example)
    [
      '/Library/Audio/Plug-Ins/CLAP/CLAP Reverb.clap',
      {
        clapVersion: '1.1.0',
        id: 'com.example.clap-reverb',
        name: 'CLAP Reverb',
        vendor: 'Example Vendor',
        url: 'https://example.com',
        manualUrl: 'https://example.com/manual',
        supportUrl: 'https://example.com/support',
        version: '1.0.0',
        description: 'Algorithmic reverb',
        features: ['audio-effect', 'reverb', 'stereo', 'delay'],
      },
    ],
  ]);

  // Parameter definitions for mock plugins
  private parameterLibrary: Map<string, CLAPParameterInfo[]> = new Map([
    [
      'com.example.clap-compressor',
      [
        {
          id: 0,
          name: 'Threshold',
          module: 'Dynamics',
          minValue: -60,
          maxValue: 0,
          defaultValue: -20,
          flags: 1, // CLAP_PARAM_IS_AUTOMATABLE
        },
        {
          id: 1,
          name: 'Ratio',
          module: 'Dynamics',
          minValue: 1,
          maxValue: 20,
          defaultValue: 4,
          flags: 1,
        },
        {
          id: 2,
          name: 'Attack',
          module: 'Dynamics',
          minValue: 0.1,
          maxValue: 100,
          defaultValue: 10,
          flags: 1,
        },
        {
          id: 3,
          name: 'Release',
          module: 'Dynamics',
          minValue: 10,
          maxValue: 1000,
          defaultValue: 100,
          flags: 1,
        },
        {
          id: 4,
          name: 'Makeup Gain',
          module: 'Output',
          minValue: 0,
          maxValue: 24,
          defaultValue: 0,
          flags: 1,
        },
      ],
    ],
    [
      'com.example.clap-eq',
      [
        { id: 0, name: 'Band 1 Freq', module: 'Band 1', minValue: 20, maxValue: 20000, defaultValue: 100, flags: 1 },
        { id: 1, name: 'Band 1 Gain', module: 'Band 1', minValue: -12, maxValue: 12, defaultValue: 0, flags: 1 },
        { id: 2, name: 'Band 1 Q', module: 'Band 1', minValue: 0.1, maxValue: 10, defaultValue: 1, flags: 1 },
        { id: 3, name: 'Band 2 Freq', module: 'Band 2', minValue: 20, maxValue: 20000, defaultValue: 500, flags: 1 },
        { id: 4, name: 'Band 2 Gain', module: 'Band 2', minValue: -12, maxValue: 12, defaultValue: 0, flags: 1 },
        { id: 5, name: 'Band 2 Q', module: 'Band 2', minValue: 0.1, maxValue: 10, defaultValue: 1, flags: 1 },
        { id: 6, name: 'Band 3 Freq', module: 'Band 3', minValue: 20, maxValue: 20000, defaultValue: 2000, flags: 1 },
        { id: 7, name: 'Band 3 Gain', module: 'Band 3', minValue: -12, maxValue: 12, defaultValue: 0, flags: 1 },
        { id: 8, name: 'Band 3 Q', module: 'Band 3', minValue: 0.1, maxValue: 10, defaultValue: 1, flags: 1 },
        { id: 9, name: 'Band 4 Freq', module: 'Band 4', minValue: 20, maxValue: 20000, defaultValue: 8000, flags: 1 },
        { id: 10, name: 'Band 4 Gain', module: 'Band 4', minValue: -12, maxValue: 12, defaultValue: 0, flags: 1 },
        { id: 11, name: 'Band 4 Q', module: 'Band 4', minValue: 0.1, maxValue: 10, defaultValue: 1, flags: 1 },
      ],
    ],
    [
      'com.example.clap-reverb',
      [
        { id: 0, name: 'Room Size', module: 'Reverb', minValue: 0, maxValue: 1, defaultValue: 0.5, flags: 1 },
        { id: 1, name: 'Damping', module: 'Reverb', minValue: 0, maxValue: 1, defaultValue: 0.5, flags: 1 },
        { id: 2, name: 'Width', module: 'Reverb', minValue: 0, maxValue: 1, defaultValue: 1, flags: 1 },
        { id: 3, name: 'Pre-Delay', module: 'Reverb', minValue: 0, maxValue: 200, defaultValue: 20, flags: 1 },
        { id: 4, name: 'Mix', module: 'Output', minValue: 0, maxValue: 100, defaultValue: 30, flags: 1 },
      ],
    ],
  ]);

  /**
   * Load a CLAP plugin
   */
  async loadPlugin(path: string, pluginIndex?: number): Promise<CLAPPluginHandle> {
    logger.info(`[MockCLAPBridge] Loading plugin: ${path}`);

    const descriptor = this.mockPluginLibrary.get(path);
    if (!descriptor) {
      throw new Error(`Mock CLAP plugin not found: ${path}`);
    }

    const handle = this.nextHandle++;

    const mockPlugin: MockCLAPPlugin = {
      path,
      descriptor: JSON.parse(JSON.stringify(descriptor)),
      state: {
        initialized: false,
        activated: false,
        processing: false,
        sampleRate: 44100,
        parameters: new Map(),
      },
    };

    // Initialize default parameter values
    const params = this.parameterLibrary.get(descriptor.id) || [];
    for (const param of params) {
      mockPlugin.state.parameters.set(param.id, param.defaultValue);
    }

    this.plugins.set(handle, mockPlugin);

    logger.info(`[MockCLAPBridge] Loaded plugin: ${descriptor.name} (handle: ${handle})`);
    return handle;
  }

  /**
   * Unload a CLAP plugin
   */
  async unloadPlugin(handle: CLAPPluginHandle): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    logger.info(`[MockCLAPBridge] Unloading plugin: ${plugin.descriptor.name}`);
    this.plugins.delete(handle);
  }

  /**
   * Get plugin descriptor
   */
  async getDescriptor(handle: CLAPPluginHandle): Promise<CLAPDescriptor> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    return JSON.parse(JSON.stringify(plugin.descriptor));
  }

  /**
   * Initialize plugin
   */
  async initialize(handle: CLAPPluginHandle): Promise<boolean> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return false;
    }

    plugin.state.initialized = true;
    logger.info(`[MockCLAPBridge] Initialized ${plugin.descriptor.name}`);
    return true;
  }

  /**
   * Activate plugin
   */
  async activate(
    handle: CLAPPluginHandle,
    sampleRate: number,
    minFrames: number,
    maxFrames: number
  ): Promise<boolean> {
    const plugin = this.plugins.get(handle);
    if (!plugin || !plugin.state.initialized) {
      return false;
    }

    plugin.state.activated = true;
    plugin.state.sampleRate = sampleRate;

    logger.info(
      `[MockCLAPBridge] Activated ${plugin.descriptor.name} at ${sampleRate}Hz, ` +
        `frames: ${minFrames}-${maxFrames}`
    );
    return true;
  }

  /**
   * Deactivate plugin
   */
  async deactivate(handle: CLAPPluginHandle): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    plugin.state.activated = false;
    plugin.state.processing = false;
    logger.info(`[MockCLAPBridge] Deactivated ${plugin.descriptor.name}`);
  }

  /**
   * Start processing
   */
  async startProcessing(handle: CLAPPluginHandle): Promise<boolean> {
    const plugin = this.plugins.get(handle);
    if (!plugin || !plugin.state.activated) {
      return false;
    }

    plugin.state.processing = true;
    logger.info(`[MockCLAPBridge] Started processing: ${plugin.descriptor.name}`);
    return true;
  }

  /**
   * Stop processing
   */
  async stopProcessing(handle: CLAPPluginHandle): Promise<void> {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    plugin.state.processing = false;
    logger.info(`[MockCLAPBridge] Stopped processing: ${plugin.descriptor.name}`);
  }

  /**
   * Get parameter count
   */
  getParameterCount(handle: CLAPPluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    const params = this.parameterLibrary.get(plugin.descriptor.id) || [];
    return params.length;
  }

  /**
   * Get parameter info
   */
  getParameterInfo(handle: CLAPPluginHandle, index: number): CLAPParameterInfo {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    const params = this.parameterLibrary.get(plugin.descriptor.id) || [];
    if (index < 0 || index >= params.length) {
      throw new Error(`Invalid parameter index: ${index}`);
    }

    return JSON.parse(JSON.stringify(params[index]));
  }

  /**
   * Get parameter value
   */
  getParameterValue(handle: CLAPPluginHandle, paramId: number): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    const value = plugin.state.parameters.get(paramId);
    if (value === undefined) {
      throw new Error(`Invalid parameter ID: ${paramId}`);
    }

    return value;
  }

  /**
   * Set parameter value
   */
  setParameterValue(handle: CLAPPluginHandle, paramId: number, value: number): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    const params = this.parameterLibrary.get(plugin.descriptor.id) || [];
    const param = params.find((p) => p.id === paramId);
    if (!param) {
      throw new Error(`Invalid parameter ID: ${paramId}`);
    }

    // Clamp to parameter range
    const clampedValue = Math.max(param.minValue, Math.min(param.maxValue, value));
    plugin.state.parameters.set(paramId, clampedValue);
  }

  /**
   * Process audio
   */
  process(handle: CLAPPluginHandle, processData: CLAPProcessData): CLAPProcessStatus {
    const plugin = this.plugins.get(handle);
    if (!plugin || !plugin.state.processing) {
      return 0; // CLAPProcessStatus.ERROR
    }

    // Mock processing: copy input to output with simple gain
    const inputs = processData.audioInputs[0];
    const outputs = processData.audioOutputs[0];

    if (!inputs || !outputs || !inputs.data32 || !outputs.data32) {
      return 0; // ERROR
    }

    const gain = 0.9; // Slight attenuation

    for (let ch = 0; ch < Math.min(inputs.channelCount, outputs.channelCount); ch++) {
      const inputBuffer = inputs.data32[ch];
      const outputBuffer = outputs.data32[ch];

      for (let i = 0; i < processData.frameCount; i++) {
        outputBuffer[i] = inputBuffer[i] * gain;
      }
    }

    return 1; // CLAPProcessStatus.CONTINUE
  }

  /**
   * Get latency
   */
  getLatency(handle: CLAPPluginHandle): number {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      return 0;
    }

    // Mock latency based on plugin type
    const features = plugin.descriptor.features;
    if (features.includes('compressor')) {
      return 256; // Compressors often have lookahead
    }

    return 0;
  }

  /**
   * Flush parameters
   */
  flushParameters(handle: CLAPPluginHandle, events: CLAPEvent[]): void {
    const plugin = this.plugins.get(handle);
    if (!plugin) {
      throw new Error(`Invalid CLAP handle: ${handle}`);
    }

    // In real implementation, this would process parameter change events
    logger.info(`[MockCLAPBridge] Flushed ${events.length} events for ${plugin.descriptor.name}`);
  }

  /**
   * Get list of mock plugins
   */
  getMockCLAPPaths(): string[] {
    return Array.from(this.mockPluginLibrary.keys());
  }

  /**
   * Add custom mock plugin
   */
  addMockCLAP(path: string, descriptor: CLAPDescriptor, parameters?: CLAPParameterInfo[]): void {
    this.mockPluginLibrary.set(path, descriptor);
    if (parameters) {
      this.parameterLibrary.set(descriptor.id, parameters);
    }
    logger.info(`[MockCLAPBridge] Added mock CLAP: ${descriptor.name}`);
  }
}

/**
 * Create mock CLAP bridge instance
 */
export function createMockCLAPBridge(): MockCLAPBridge {
  return new MockCLAPBridge();
}

/**
 * Get available mock CLAP plugins
 */
export function getMockCLAPPlugins(): Array<{ path: string; name: string; vendor: string }> {
  const bridge = new MockCLAPBridge();
  const paths = bridge.getMockCLAPPaths();

  return paths.map((path) => {
    const descriptor = (bridge as any).mockPluginLibrary.get(path);
    return {
      path,
      name: descriptor.name,
      vendor: descriptor.vendor,
    };
  });
}
