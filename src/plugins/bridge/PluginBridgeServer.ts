/**
 * Plugin Bridge Server - Native Plugin Host
 *
 * Hosts VST3/AU plugins and communicates with browser via WebSocket
 *
 * Architecture:
 * 1. Browser sends plugin load requests via WebSocket
 * 2. Server loads plugin using native addon (C++/Rust)
 * 3. Audio is sent from browser to server
 * 4. Server processes audio through plugin
 * 5. Processed audio sent back to browser
 * 6. Parameters controlled via WebSocket messages
 *
 * Note: Requires native addon (e.g., JUCE-based) to actually host VST3/AU
 * This is a TypeScript interface layer.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import {
  PluginInfo,
  PluginInstance,
  PluginParameter,
  PluginBridgeMessage,
  PluginBridgeResponse
} from '../core/types';
import { PluginScanner } from '../core/PluginScanner';

export interface NativePluginHost {
  loadPlugin(path: string): Promise<string>; // Returns instanceId
  unloadPlugin(instanceId: string): Promise<void>;
  setParameter(instanceId: string, parameterId: string, value: number): Promise<void>;
  getParameter(instanceId: string, parameterId: string): Promise<number>;
  processAudio(instanceId: string, inputBuffer: Float32Array[]): Promise<Float32Array[]>;
  getPluginInfo(instanceId: string): Promise<PluginInfo>;
  getParameters(instanceId: string): Promise<PluginParameter[]>;
  savePreset(instanceId: string, path: string): Promise<void>;
  loadPreset(instanceId: string, path: string): Promise<void>;
}

export class PluginBridgeServer extends EventEmitter {
  private wss: WebSocketServer;
  private scanner: PluginScanner;
  private pluginInstances: Map<string, PluginInstance> = new Map();
  private nativeHost: NativePluginHost | null = null;
  private port: number;

  constructor(port: number = 9001) {
    super();
    this.port = port;
    this.scanner = new PluginScanner();
    this.wss = new WebSocketServer({ port: this.port });

    this.setupWebSocketServer();
  }

  /**
   * Initialize server and scan plugins
   */
  async initialize(): Promise<void> {
    console.log(`[PLUGIN-BRIDGE] Starting on port ${this.port}...`);

    // Scan all plugins
    await this.scanner.scanAllPlugins();

    // Load native plugin host (would be a C++/Rust addon in production)
    // For now, we'll use a mock implementation
    this.nativeHost = this.createMockNativeHost();

    console.log(`[PLUGIN-BRIDGE] Server ready with ${this.scanner.getPlugins().length} plugins`);
  }

  /**
   * Setup WebSocket message handling
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[PLUGIN-BRIDGE] Client connected');

      ws.on('message', async (data: string) => {
        try {
          const message: PluginBridgeMessage = JSON.parse(data);
          const response = await this.handleMessage(message);
          ws.send(JSON.stringify(response));
        } catch (error) {
          const errorResponse: PluginBridgeResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          ws.send(JSON.stringify(errorResponse));
        }
      });

      ws.on('close', () => {
        console.log('[PLUGIN-BRIDGE] Client disconnected');
      });

      // Send initial plugin list
      ws.send(JSON.stringify({
        type: 'pluginList',
        data: this.scanner.getPlugins()
      }));
    });
  }

  /**
   * Handle WebSocket messages
   */
  private async handleMessage(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    switch (message.type) {
      case 'scan':
        return this.handleScan();

      case 'load':
        return this.handleLoad(message);

      case 'unload':
        return this.handleUnload(message);

      case 'setParameter':
        return this.handleSetParameter(message);

      case 'getParameter':
        return this.handleGetParameter(message);

      case 'process':
        return this.handleProcess(message);

      case 'getPreset':
        return this.handleGetPreset(message);

      case 'setPreset':
        return this.handleSetPreset(message);

      default:
        return {
          success: false,
          error: 'Unknown message type'
        };
    }
  }

  private async handleScan(): Promise<PluginBridgeResponse> {
    const plugins = await this.scanner.scanAllPlugins();
    return {
      success: true,
      data: plugins
    };
  }

  private async handleLoad(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    if (!message.pluginPath || !this.nativeHost) {
      return { success: false, error: 'Invalid plugin path or host not initialized' };
    }

    try {
      const instanceId = await this.nativeHost.loadPlugin(message.pluginPath);
      const parameters = await this.nativeHost.getParameters(instanceId);

      const instance: PluginInstance = {
        instanceId,
        pluginId: instanceId,
        trackId: message.data?.trackId || '',
        slotIndex: message.data?.slotIndex || 0,
        parameters: new Map(parameters.map(p => [p.id, p])),
        enabled: true
      };

      this.pluginInstances.set(instanceId, instance);

      return {
        success: true,
        data: {
          instanceId,
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load plugin'
      };
    }
  }

  private async handleUnload(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    if (!message.instanceId || !this.nativeHost) {
      return { success: false, error: 'Invalid instance ID' };
    }

    try {
      await this.nativeHost.unloadPlugin(message.instanceId);
      this.pluginInstances.delete(message.instanceId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unload plugin'
      };
    }
  }

  private async handleSetParameter(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    if (!message.instanceId || !message.parameterId || message.value === undefined || !this.nativeHost) {
      return { success: false, error: 'Invalid parameters' };
    }

    try {
      await this.nativeHost.setParameter(message.instanceId, message.parameterId, message.value);

      // Update cached parameter value
      const instance = this.pluginInstances.get(message.instanceId);
      if (instance) {
        const param = instance.parameters.get(message.parameterId);
        if (param) {
          param.value = message.value;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set parameter'
      };
    }
  }

  private async handleGetParameter(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    if (!message.instanceId || !message.parameterId || !this.nativeHost) {
      return { success: false, error: 'Invalid parameters' };
    }

    try {
      const value = await this.nativeHost.getParameter(message.instanceId, message.parameterId);
      return {
        success: true,
        data: { value }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get parameter'
      };
    }
  }

  private async handleProcess(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    if (!message.instanceId || !message.data?.inputBuffer || !this.nativeHost) {
      return { success: false, error: 'Invalid audio data' };
    }

    try {
      const outputBuffer = await this.nativeHost.processAudio(
        message.instanceId,
        message.data.inputBuffer
      );

      return {
        success: true,
        data: { outputBuffer }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process audio'
      };
    }
  }

  private async handleGetPreset(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    // TODO: Implement preset loading
    return {
      success: false,
      error: 'Preset loading not yet implemented'
    };
  }

  private async handleSetPreset(message: PluginBridgeMessage): Promise<PluginBridgeResponse> {
    // TODO: Implement preset saving
    return {
      success: false,
      error: 'Preset saving not yet implemented'
    };
  }

  /**
   * Create native host using JUCE-based C++ addon
   * Falls back to mock if native addon not available
   */
  private createMockNativeHost(): NativePluginHost {
    try {
      // Try to load the native addon
      const { pluginHost } = require('../native');

      // Initialize native host
      pluginHost.initialize(48000, 512);

      console.log('[PLUGIN-BRIDGE] Using NATIVE plugin host (JUCE)');

      // Return native implementation
      return {
        async loadPlugin(path: string): Promise<string> {
          return pluginHost.loadPlugin(path);
        },

        async unloadPlugin(instanceId: string): Promise<void> {
          pluginHost.unloadPlugin(instanceId);
        },

        async setParameter(instanceId: string, parameterId: string, value: number): Promise<void> {
          pluginHost.setParameter(instanceId, parameterId, value);
        },

        async getParameter(instanceId: string, parameterId: string): Promise<number> {
          return pluginHost.getParameter(instanceId, parameterId);
        },

        async processAudio(instanceId: string, inputBuffer: Float32Array[]): Promise<Float32Array[]> {
          return pluginHost.processAudio(instanceId, inputBuffer);
        },

        async getPluginInfo(instanceId: string): Promise<PluginInfo> {
          return pluginHost.getPluginInfo(instanceId) as PluginInfo;
        },

        async getParameters(instanceId: string): Promise<PluginParameter[]> {
          return pluginHost.getParameters(instanceId) as PluginParameter[];
        },

        async savePreset(instanceId: string, path: string): Promise<void> {
          pluginHost.savePreset(instanceId, path);
        },

        async loadPreset(instanceId: string, path: string): Promise<void> {
          pluginHost.loadPreset(instanceId, path);
        }
      };
    } catch (error) {
      console.warn('[PLUGIN-BRIDGE] Native plugin host not available, using MOCK');
      console.warn('[PLUGIN-BRIDGE] Error:', error instanceof Error ? error.message : error);
    }

    // Fall back to mock implementation
    return this.createFallbackMockHost();
  }

  /**
   * Fallback mock host for development/testing
   */
  private createFallbackMockHost(): NativePluginHost {
    const mockInstances = new Map<string, any>();

    return {
      async loadPlugin(path: string): Promise<string> {
        const instanceId = `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        mockInstances.set(instanceId, { path, parameters: new Map() });
        console.log(`[MOCK-HOST] Loaded plugin: ${path} as ${instanceId}`);
        return instanceId;
      },

      async unloadPlugin(instanceId: string): Promise<void> {
        mockInstances.delete(instanceId);
        console.log(`[MOCK-HOST] Unloaded plugin: ${instanceId}`);
      },

      async setParameter(instanceId: string, parameterId: string, value: number): Promise<void> {
        const instance = mockInstances.get(instanceId);
        if (instance) {
          instance.parameters.set(parameterId, value);
          console.log(`[MOCK-HOST] Set ${parameterId} = ${value} on ${instanceId}`);
        }
      },

      async getParameter(instanceId: string, parameterId: string): Promise<number> {
        const instance = mockInstances.get(instanceId);
        return instance?.parameters.get(parameterId) || 0.5;
      },

      async processAudio(instanceId: string, inputBuffer: Float32Array[]): Promise<Float32Array[]> {
        // Mock processing - just return input (passthrough)
        console.log(`[MOCK-HOST] Processing ${inputBuffer[0].length} samples on ${instanceId}`);
        return inputBuffer;
      },

      async getPluginInfo(instanceId: string): Promise<PluginInfo> {
        const instance = mockInstances.get(instanceId);
        return {
          id: instanceId,
          name: 'Mock Plugin',
          manufacturer: 'Mock',
          format: 'VST3',
          path: instance?.path || '',
          category: 'Other',
          isInstrument: false,
          numInputs: 2,
          numOutputs: 2
        };
      },

      async getParameters(instanceId: string): Promise<PluginParameter[]> {
        return [
          {
            id: 'gain',
            name: 'Gain',
            label: 'Gain',
            value: 0.5,
            displayValue: '0 dB',
            min: 0,
            max: 1,
            default: 0.5,
            isAutomatable: true,
            unit: 'dB'
          },
          {
            id: 'mix',
            name: 'Mix',
            label: 'Mix',
            value: 1.0,
            displayValue: '100%',
            min: 0,
            max: 1,
            default: 1.0,
            isAutomatable: true,
            unit: '%'
          }
        ];
      },

      async savePreset(instanceId: string, path: string): Promise<void> {
        console.log(`[MOCK-HOST] Saving preset for ${instanceId} to ${path}`);
      },

      async loadPreset(instanceId: string, path: string): Promise<void> {
        console.log(`[MOCK-HOST] Loading preset for ${instanceId} from ${path}`);
      }
    };
  }

  /**
   * Get the native plugin host status
   */
  isUsingNativeHost(): boolean {
    try {
      require('../native');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all loaded instances
   */
  getInstances(): PluginInstance[] {
    return Array.from(this.pluginInstances.values());
  }

  /**
   * Get plugin scanner
   */
  getScanner(): PluginScanner {
    return this.scanner;
  }

  /**
   * Shutdown server
   */
  async shutdown(): Promise<void> {
    console.log('[PLUGIN-BRIDGE] Shutting down...');

    // Unload all plugins
    if (this.nativeHost) {
      for (const [instanceId] of this.pluginInstances) {
        await this.nativeHost.unloadPlugin(instanceId);
      }
    }

    // Close WebSocket server
    this.wss.close();

    console.log('[PLUGIN-BRIDGE] Shutdown complete');
  }
}
