/**
 * Real CLAP Native Bridge
 *
 * This wraps the compiled Rust CLAP bridge and implements the CLAPNativeBridge interface.
 * Once the Rust code is compiled, this file provides a drop-in replacement for MockCLAPBridge.
 */

import type {
  CLAPNativeBridge,
  CLAPPluginHandle,
  CLAPDescriptor,
  CLAPParameterInfo,
  CLAPProcessData,
  CLAPProcessStatus,
  CLAPEvent,
} from '../wrappers/CLAPPluginWrapper';

// Import the compiled native module
// After compilation, this will be available at:
// native-bridges/clap/index.node (or clap-bridge.node)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { logger } from '$lib/utils/logger';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

let nativeBridge: any;

try {
  // Try to load the compiled native module
  const bridgePath = join(__dirname, '../../../../../native-bridges/clap/index.node');
  nativeBridge = require(bridgePath);
  logger.info('[RealCLAPBridge] Native CLAP bridge loaded successfully');
} catch (error) {
  logger.warn('[RealCLAPBridge] Native bridge not found. Did you compile it?');
  logger.warn('Run: cd native-bridges/clap && npm run build');
  nativeBridge = null;
}

/**
 * Real CLAP Bridge Implementation
 * Wraps the Rust native bridge
 */
export class RealCLAPBridge implements CLAPNativeBridge {
  private loaded: boolean = false;

  constructor() {
    this.loaded = nativeBridge !== null;
    if (!this.loaded) {
      throw new Error(
        'Native CLAP bridge not compiled. ' +
        'Run: cd native-bridges/clap && npm run build'
      );
    }
  }

  /**
   * Check if native bridge is available
   */
  static isAvailable(): boolean {
    return nativeBridge !== null;
  }

  /**
   * Load a CLAP plugin
   */
  async loadPlugin(path: string, pluginIndex?: number): Promise<CLAPPluginHandle> {
    if (!this.loaded) {
      throw new Error('Native bridge not loaded');
    }

    try {
      const handle = await nativeBridge.loadPlugin(path, pluginIndex || 0);
      return handle;
    } catch (error: any) {
      throw new Error(`Failed to load CLAP plugin: ${error.message}`);
    }
  }

  /**
   * Unload a CLAP plugin
   */
  async unloadPlugin(handle: CLAPPluginHandle): Promise<void> {
    if (!this.loaded) return;

    try {
      await nativeBridge.unloadPlugin(handle);
    } catch (error: any) {
      throw new Error(`Failed to unload plugin: ${error.message}`);
    }
  }

  /**
   * Get plugin descriptor
   */
  async getDescriptor(handle: CLAPPluginHandle): Promise<CLAPDescriptor> {
    if (!this.loaded) {
      throw new Error('Native bridge not loaded');
    }

    try {
      const descriptor = await nativeBridge.getDescriptor(handle);

      return {
        clapVersion: '1.1.0', // Default to CLAP 1.1.0
        id: descriptor.id,
        name: descriptor.name,
        vendor: descriptor.vendor,
        url: '',
        manualUrl: '',
        supportUrl: '',
        version: descriptor.version,
        description: descriptor.description,
        features: descriptor.features,
      };
    } catch (error: any) {
      throw new Error(`Failed to get descriptor: ${error.message}`);
    }
  }

  /**
   * Initialize plugin
   */
  async initialize(handle: CLAPPluginHandle): Promise<boolean> {
    if (!this.loaded) return false;

    try {
      return await nativeBridge.initialize(handle);
    } catch (error: any) {
      logger.error('Failed to initialize plugin:', error.message);
      return false;
    }
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
    if (!this.loaded) return false;

    try {
      return await nativeBridge.activate(handle, sampleRate, minFrames, maxFrames);
    } catch (error: any) {
      logger.error('Failed to activate plugin:', error.message);
      return false;
    }
  }

  /**
   * Deactivate plugin
   */
  async deactivate(handle: CLAPPluginHandle): Promise<void> {
    if (!this.loaded) return;

    try {
      await nativeBridge.deactivate(handle);
    } catch (error: any) {
      logger.error('Failed to deactivate plugin:', error.message);
    }
  }

  /**
   * Start processing
   */
  async startProcessing(handle: CLAPPluginHandle): Promise<boolean> {
    if (!this.loaded) return false;

    try {
      return await nativeBridge.startProcessing(handle);
    } catch (error: any) {
      logger.error('Failed to start processing:', error.message);
      return false;
    }
  }

  /**
   * Stop processing
   */
  async stopProcessing(handle: CLAPPluginHandle): Promise<void> {
    if (!this.loaded) return;

    try {
      await nativeBridge.stopProcessing(handle);
    } catch (error: any) {
      logger.error('Failed to stop processing:', error.message);
    }
  }

  /**
   * Get parameter count
   */
  getParameterCount(handle: CLAPPluginHandle): number {
    if (!this.loaded) return 0;

    try {
      return nativeBridge.getParameterCount(handle);
    } catch (error: any) {
      logger.error('Failed to get parameter count:', error.message);
      return 0;
    }
  }

  /**
   * Get parameter info
   */
  getParameterInfo(handle: CLAPPluginHandle, index: number): CLAPParameterInfo {
    if (!this.loaded) {
      throw new Error('Native bridge not loaded');
    }

    try {
      const info = nativeBridge.getParameterInfo(handle, index);

      return {
        id: info.id,
        name: info.name,
        module: info.module,
        minValue: info.min_value,
        maxValue: info.max_value,
        defaultValue: info.default_value,
        flags: 1, // CLAP_PARAM_IS_AUTOMATABLE
      };
    } catch (error: any) {
      throw new Error(`Failed to get parameter info: ${error.message}`);
    }
  }

  /**
   * Get parameter value
   */
  getParameterValue(handle: CLAPPluginHandle, paramId: number): number {
    if (!this.loaded) return 0;

    try {
      return nativeBridge.getParameterValue(handle, paramId);
    } catch (error: any) {
      logger.error('Failed to get parameter value:', error.message);
      return 0;
    }
  }

  /**
   * Set parameter value
   */
  setParameterValue(handle: CLAPPluginHandle, paramId: number, value: number): void {
    if (!this.loaded) return;

    try {
      nativeBridge.setParameterValue(handle, paramId, value);
    } catch (error: any) {
      logger.error('Failed to set parameter value:', error.message);
    }
  }

  /**
   * Process audio
   * NOTE: This is a simplified implementation
   * Real implementation should use AudioWorklet + SharedArrayBuffer
   */
  process(handle: CLAPPluginHandle, processData: CLAPProcessData): CLAPProcessStatus {
    if (!this.loaded) {
      return 0; // ERROR
    }

    // For now, return CONTINUE
    // Real implementation would call the native process function
    // This requires more complex buffer management
    return 1; // CONTINUE
  }

  /**
   * Get latency in samples
   */
  getLatency(handle: CLAPPluginHandle): number {
    if (!this.loaded) return 0;

    try {
      return nativeBridge.getLatency(handle);
    } catch (error: any) {
      logger.error('Failed to get latency:', error.message);
      return 0;
    }
  }

  /**
   * Flush parameters
   */
  flushParameters(handle: CLAPPluginHandle, events: CLAPEvent[]): void {
    if (!this.loaded) return;

    // Not implemented in basic bridge
    // Would be added for advanced parameter automation
  }
}

/**
 * Create real CLAP bridge instance
 * Throws if native bridge is not compiled
 */
export function createRealCLAPBridge(): RealCLAPBridge {
  return new RealCLAPBridge();
}

/**
 * Check if real CLAP bridge is available
 */
export function isRealCLAPBridgeAvailable(): boolean {
  return RealCLAPBridge.isAvailable();
}

/**
 * Get the appropriate CLAP bridge (real or mock)
 */
export function getCLAPBridge(): CLAPNativeBridge {
  if (RealCLAPBridge.isAvailable()) {
    logger.info('[CLAP] Using real native bridge');
    return createRealCLAPBridge();
  } else {
    logger.info('[CLAP] Using mock bridge (native bridge not compiled)');
    const { createMockCLAPBridge } = require('./MockCLAPBridge');
    return createMockCLAPBridge();
  }
}
