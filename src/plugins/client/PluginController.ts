/**
 * Plugin Controller - Client-side plugin management
 *
 * Communicates with PluginBridgeServer via WebSocket
 * Integrates with AudioEngine for real-time processing
 */

import {
  PluginInfo,
  PluginInstance,
  PluginChain,
  PluginBridgeMessage,
  PluginBridgeResponse,
  GenrePresetChain,
  AIPluginControl
} from '../core/types';
import { AIMixerEngine } from '../ai/AIMixerEngine';
import { GENRE_PRESETS } from '../presets/GenrePresets';

export class PluginController {
  private ws: WebSocket | null = null;
  private plugins: Map<string, PluginInfo> = new Map();
  private instances: Map<string, PluginInstance> = new Map();
  private chains: Map<string, PluginChain> = new Map();
  private aiMixer: AIMixerEngine;
  private bridgeUrl: string;
  private messageId: number = 0;
  private pendingMessages: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();

  constructor(bridgeUrl: string = 'ws://localhost:9001') {
    this.bridgeUrl = bridgeUrl;
    this.aiMixer = new AIMixerEngine();
  }

  /**
   * Connect to plugin bridge server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.bridgeUrl);

      this.ws.onopen = () => {
        console.log('[PLUGIN-CONTROLLER] Connected to bridge server');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('[PLUGIN-CONTROLLER] WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('[PLUGIN-CONTROLLER] Disconnected from bridge server');
      };
    });
  }

  /**
   * Handle messages from bridge server
   */
  private handleMessage(message: any): void {
    // Handle plugin list
    if (message.type === 'pluginList') {
      message.data.forEach((plugin: PluginInfo) => {
        this.plugins.set(plugin.id, plugin);
      });
      console.log(`[PLUGIN-CONTROLLER] Loaded ${this.plugins.size} plugins`);
      return;
    }

    // Handle response to sent message
    if (message.id !== undefined) {
      const pending = this.pendingMessages.get(message.id);
      if (pending) {
        if (message.success) {
          pending.resolve(message.data);
        } else {
          pending.reject(new Error(message.error));
        }
        this.pendingMessages.delete(message.id);
      }
    }
  }

  /**
   * Send message to bridge server
   */
  private async sendMessage(message: PluginBridgeMessage): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to bridge server');
    }

    const id = this.messageId++;
    const messageWithId = { ...message, id };

    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(messageWithId));

      // Timeout after 10 seconds
      setTimeout(() => {
        const pending = this.pendingMessages.get(id);
        if (pending) {
          pending.reject(new Error('Request timeout'));
          this.pendingMessages.delete(id);
        }
      }, 10000);
    });
  }

  /**
   * Load plugin onto track
   */
  async loadPlugin(
    pluginId: string,
    trackId: string,
    slotIndex: number
  ): Promise<PluginInstance> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const response = await this.sendMessage({
      type: 'load',
      pluginPath: plugin.path,
      data: { trackId, slotIndex }
    });

    const instance: PluginInstance = {
      instanceId: response.instanceId,
      pluginId,
      trackId,
      slotIndex,
      parameters: new Map(response.parameters.map((p: any) => [p.id, p])),
      enabled: true
    };

    this.instances.set(response.instanceId, instance);

    // Add to chain
    let chain = this.chains.get(trackId);
    if (!chain) {
      chain = { trackId, plugins: [] };
      this.chains.set(trackId, chain);
    }
    chain.plugins.push(instance);

    console.log(`[PLUGIN-CONTROLLER] Loaded ${plugin.name} on track ${trackId}`);
    return instance;
  }

  /**
   * Unload plugin
   */
  async unloadPlugin(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    await this.sendMessage({
      type: 'unload',
      instanceId
    });

    // Remove from chain
    const chain = this.chains.get(instance.trackId);
    if (chain) {
      chain.plugins = chain.plugins.filter(p => p.instanceId !== instanceId);
    }

    this.instances.delete(instanceId);
    console.log(`[PLUGIN-CONTROLLER] Unloaded plugin ${instanceId}`);
  }

  /**
   * Set plugin parameter
   */
  async setParameter(instanceId: string, parameterId: string, value: number): Promise<void> {
    await this.sendMessage({
      type: 'setParameter',
      instanceId,
      parameterId,
      value
    });

    // Update local cache
    const instance = this.instances.get(instanceId);
    if (instance) {
      const param = instance.parameters.get(parameterId);
      if (param) {
        param.value = value;
      }
    }
  }

  /**
   * Get plugin parameter
   */
  async getParameter(instanceId: string, parameterId: string): Promise<number> {
    const response = await this.sendMessage({
      type: 'getParameter',
      instanceId,
      parameterId
    });

    return response.value;
  }

  /**
   * Apply genre preset chain to track
   */
  async applyGenrePreset(presetId: string, trackId: string): Promise<void> {
    const preset = GENRE_PRESETS[presetId as keyof typeof GENRE_PRESETS];
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    console.log(`[PLUGIN-CONTROLLER] Applying preset "${preset.name}" to track ${trackId}`);

    // Clear existing chain
    const existingChain = this.chains.get(trackId);
    if (existingChain) {
      for (const plugin of existingChain.plugins) {
        await this.unloadPlugin(plugin.instanceId);
      }
    }

    // Load each plugin in chain
    for (const chainPlugin of preset.chain) {
      try {
        const instance = await this.loadPlugin(chainPlugin.pluginId, trackId, chainPlugin.slot);

        // Set parameters
        for (const [paramId, value] of Object.entries(chainPlugin.parameters)) {
          await this.setParameter(instance.instanceId, paramId, value);
        }

        console.log(`[PLUGIN-CONTROLLER] Applied ${chainPlugin.pluginName} with preset parameters`);
      } catch (error) {
        console.warn(`[PLUGIN-CONTROLLER] Failed to load ${chainPlugin.pluginName}:`, error);
        // Continue with next plugin
      }
    }

    console.log(`[PLUGIN-CONTROLLER] Preset "${preset.name}" applied successfully`);
  }

  /**
   * AI Auto-Mix: Analyze audio and apply intelligent plugin control
   */
  async aiAutoMix(
    trackId: string,
    audioBuffer: Float32Array[],
    genre: string
  ): Promise<void> {
    console.log(`[PLUGIN-CONTROLLER] AI Auto-Mix for ${genre}...`);

    // Analyze audio
    const features = this.aiMixer.analyzeAudio(audioBuffer);
    console.log('[PLUGIN-CONTROLLER] Audio features:', features);

    // Get AI recommendations
    const chain = this.chains.get(trackId);
    const recommendations = await this.aiMixer.recommendPlugins(features, genre, chain);

    console.log(`[PLUGIN-CONTROLLER] AI Recommendations (${recommendations.length}):`);
    recommendations.forEach(rec => {
      console.log(`  - ${rec.action.toUpperCase()}: ${rec.pluginName} (${(rec.confidence * 100).toFixed(0)}%) - ${rec.reason}`);
    });

    // Apply recommendations
    for (const rec of recommendations) {
      if (rec.action === 'add') {
        try {
          const instance = await this.loadPlugin(rec.pluginId, trackId, rec.slotIndex);

          // Apply AI-recommended parameters
          if (rec.parameters) {
            for (const [paramId, value] of Object.entries(rec.parameters)) {
              await this.setParameter(instance.instanceId, paramId, value);
            }
          }

          console.log(`[PLUGIN-CONTROLLER] ✓ Added ${rec.pluginName}`);
        } catch (error) {
          console.warn(`[PLUGIN-CONTROLLER] ✗ Failed to add ${rec.pluginName}:`, error);
        }
      }
    }

    // Auto-adjust existing plugins
    if (chain) {
      for (const instance of chain.plugins) {
        const plugin = this.plugins.get(instance.pluginId);
        if (!plugin) continue;

        const controls = await this.aiMixer.autoAdjustParameters(
          instance.instanceId,
          instance.pluginId,
          features,
          {
            genre,
            targetLoudness: -14,
            dynamicRange: 10,
            tonalBalance: { bass: 0, mids: 0, highs: 0 },
            spatialWidth: 70,
            aggressiveness: 50
          }
        );

        // Apply parameter changes
        for (const change of controls.parameterChanges) {
          await this.setParameter(instance.instanceId, change.parameterId, change.value);
        }

        console.log(`[PLUGIN-CONTROLLER] ✓ Auto-adjusted ${plugin.name}`);
      }
    }

    console.log('[PLUGIN-CONTROLLER] AI Auto-Mix complete!');
  }

  /**
   * Get all available plugins
   */
  getAvailablePlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): PluginInfo[] {
    return this.getAvailablePlugins().filter(p => p.category === category);
  }

  /**
   * Get track plugin chain
   */
  getTrackChain(trackId: string): PluginChain | undefined {
    return this.chains.get(trackId);
  }

  /**
   * Get available genre presets
   */
  getGenrePresets(): GenrePresetChain[] {
    return Object.values(GENRE_PRESETS);
  }

  // ============================================
  // REAL-TIME LIVE MONITORING CONTROL
  // ============================================

  /**
   * Adjust brightness (high frequencies) on live monitoring
   */
  async adjustLiveMonitoringBrightness(trackId: string, amount: 'subtle' | 'moderate' | 'aggressive'): Promise<void> {
    const boosts = {
      subtle: { freq: 10000, gain: 2 },
      moderate: { freq: 8000, gain: 4 },
      aggressive: { freq: 6000, gain: 6 }
    };

    const boost = boosts[amount];

    // Find or add Pro-Q 4 to track's input monitoring chain
    const eqInstance = await this.ensurePluginInChain(trackId, 'vst3-fabfilter-pro-q-4', 4);

    // Add high shelf boost
    await this.setParameter(eqInstance, 'band_5_type', 'high_shelf');
    await this.setParameter(eqInstance, 'band_5_freq', boost.freq / 20000); // Normalize to 0-1
    await this.setParameter(eqInstance, 'band_5_gain', (boost.gain + 12) / 24); // Normalize to 0-1
    await this.setParameter(eqInstance, 'band_5_enabled', 1);

    console.log(`[PLUGIN-CONTROLLER] Brightness adjusted: ${amount} (+${boost.gain}dB @ ${boost.freq}Hz)`);
  }

  /**
   * Adjust compression on live monitoring
   */
  async adjustLiveMonitoringCompression(trackId: string, amount: 'light' | 'medium' | 'heavy'): Promise<void> {
    const settings = {
      light: { threshold: -18, ratio: 2.5 },
      medium: { threshold: -15, ratio: 4 },
      heavy: { threshold: -12, ratio: 6 }
    };

    const setting = settings[amount];

    // Find or add Pro-C 2 to track's input monitoring chain
    const compInstance = await this.ensurePluginInChain(trackId, 'vst3-fabfilter-pro-c-2', 5);

    await this.setParameter(compInstance, 'threshold', (setting.threshold + 60) / 60); // Normalize to 0-1
    await this.setParameter(compInstance, 'ratio', setting.ratio / 20); // Normalize to 0-1
    await this.setParameter(compInstance, 'attack', 0.1); // 10ms
    await this.setParameter(compInstance, 'release', 0.5); // 100ms

    console.log(`[PLUGIN-CONTROLLER] Compression adjusted: ${amount} (${setting.ratio}:1 @ ${setting.threshold}dB)`);
  }

  /**
   * Adjust warmth (low-mid frequencies) on live monitoring
   */
  async adjustLiveMonitoringWarmth(trackId: string, amount: 'subtle' | 'moderate' | 'heavy'): Promise<void> {
    const settings = {
      subtle: { freq: 200, gain: 2, addNeve: false },
      moderate: { freq: 150, gain: 3, addNeve: false },
      heavy: { freq: 110, gain: 4, addNeve: true }
    };

    const setting = settings[amount];

    // Add EQ for warmth boost
    const eqInstance = await this.ensurePluginInChain(trackId, 'vst3-fabfilter-pro-q-4', 4);

    await this.setParameter(eqInstance, 'band_1_type', 'bell');
    await this.setParameter(eqInstance, 'band_1_freq', setting.freq / 20000); // Normalize to 0-1
    await this.setParameter(eqInstance, 'band_1_gain', (setting.gain + 12) / 24); // Normalize to 0-1
    await this.setParameter(eqInstance, 'band_1_q', 0.7); // Wide Q
    await this.setParameter(eqInstance, 'band_1_enabled', 1);

    // Add Neve 1073 for heavy warmth
    if (setting.addNeve) {
      await this.ensurePluginInChain(trackId, 'au-uad-neve-1073', 3);
    }

    console.log(`[PLUGIN-CONTROLLER] Warmth adjusted: ${amount} (+${setting.gain}dB @ ${setting.freq}Hz${setting.addNeve ? ' + Neve 1073' : ''})`);
  }

  /**
   * Add autotune to live monitoring
   */
  async addLiveMonitoringAutotune(trackId: string, speed: 'natural' | 'moderate' | 'tpain'): Promise<void> {
    const speeds = {
      natural: { retune: 25, humanize: 70 },
      moderate: { retune: 15, humanize: 40 },
      tpain: { retune: 0, humanize: 0 }
    };

    const setting = speeds[speed];

    // Add Auto-Tune Pro
    const autotuneInstance = await this.ensurePluginInChain(trackId, 'vst3-auto-tune-pro', 2);

    await this.setParameter(autotuneInstance, 'retune_speed', setting.retune / 100);
    await this.setParameter(autotuneInstance, 'humanize', setting.humanize / 100);

    console.log(`[PLUGIN-CONTROLLER] Auto-Tune enabled: ${speed} (${setting.retune}ms retune)`);
  }

  /**
   * Add reverb to live monitoring
   */
  async addLiveMonitoringReverb(trackId: string, amount: number, type: 'plate' | 'room' | 'hall'): Promise<void> {
    // Add Nectar 4 Reverb
    const reverbInstance = await this.ensurePluginInChain(trackId, 'vst3-nectar-4-reverb', 9);

    await this.setParameter(reverbInstance, 'type', type);
    await this.setParameter(reverbInstance, 'mix', amount / 100);

    console.log(`[PLUGIN-CONTROLLER] Reverb added: ${amount}% ${type}`);
  }

  /**
   * Remove harshness (de-ess) on live monitoring
   */
  async removeLiveMonitoringHarshness(trackId: string, amount: 'light' | 'moderate' | 'heavy'): Promise<void> {
    const settings = {
      light: { threshold: -8, range: 4 },
      moderate: { threshold: -12, range: 6 },
      heavy: { threshold: -16, range: 8 }
    };

    const setting = settings[amount];

    // Add De-Esser
    const deesserInstance = await this.ensurePluginInChain(trackId, 'vst3-vocal-de-esser', 7);

    await this.setParameter(deesserInstance, 'frequency', 7000 / 20000); // 7kHz
    await this.setParameter(deesserInstance, 'threshold', (setting.threshold + 60) / 60);
    await this.setParameter(deesserInstance, 'range', setting.range / 20);

    console.log(`[PLUGIN-CONTROLLER] Harshness reduced: ${amount}`);
  }

  /**
   * Reset all live monitoring effects to bypass
   */
  async resetLiveMonitoringEffects(trackId: string): Promise<void> {
    const chain = this.chains.get(trackId);
    if (!chain) return;

    // Bypass all plugins in chain
    for (const plugin of chain.plugins) {
      await this.bypassPlugin(plugin.instanceId, true);
    }

    console.log(`[PLUGIN-CONTROLLER] All effects reset for track ${trackId}`);
  }

  /**
   * Helper: Ensure plugin exists in chain, add if missing
   */
  private async ensurePluginInChain(trackId: string, pluginId: string, slotIndex: number): Promise<string> {
    const chain = this.chains.get(trackId);

    if (chain) {
      // Check if plugin already exists in slot
      const existing = chain.plugins.find(p => p.slotIndex === slotIndex && p.pluginId === pluginId);
      if (existing) {
        return existing.instanceId;
      }
    }

    // Plugin doesn't exist, load it
    const instance = await this.loadPlugin(pluginId, trackId, slotIndex);
    return instance.instanceId;
  }

  /**
   * Disconnect from bridge server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
