/**
 * Base Plugin Wrapper
 *
 * Abstract base class for all plugin wrappers (VST3, AU, CLAP, Web)
 * Defines the common interface for plugin loading, parameter control,
 * and audio processing.
 */

import type {
import { logger } from '$lib/utils/logger';
  PluginMetadata,
  PluginParameter,
  PluginPreset,
} from '../types';

/**
 * Plugin State
 */
export interface PluginState {
  parameters: Map<string, number>;
  activePreset: string | null;
  bypass: boolean;
  enabled: boolean;
}

/**
 * Audio Buffer Info
 */
export interface AudioBufferInfo {
  sampleRate: number;
  blockSize: number;
  numInputChannels: number;
  numOutputChannels: number;
}

/**
 * Base Plugin Wrapper
 * All plugin wrappers extend this class
 */
export abstract class BasePluginWrapper {
  protected metadata: PluginMetadata;
  protected audioContext: AudioContext;
  protected state: PluginState;

  // Web Audio nodes
  protected inputNode: GainNode;
  protected outputNode: GainNode;
  protected processorNode: AudioNode | null = null;

  // Callbacks
  private parameterChangeCallbacks: Map<
    string,
    Array<(value: number) => void>
  > = new Map();

  constructor(metadata: PluginMetadata, audioContext: AudioContext) {
    this.metadata = metadata;
    this.audioContext = audioContext;

    // Initialize state
    this.state = {
      parameters: new Map(),
      activePreset: null,
      bypass: false,
      enabled: true,
    };

    // Initialize default parameter values
    for (const param of metadata.parameters) {
      this.state.parameters.set(param.id, param.default);
    }

    // Create input/output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
  }

  /**
   * Load and initialize the plugin
   * Must be implemented by subclasses
   */
  abstract load(): Promise<void>;

  /**
   * Process audio
   * For offline rendering or manual processing
   */
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters?: Record<string, number>
  ): void;

  /**
   * Unload the plugin and clean up resources
   */
  abstract unload(): Promise<void>;

  /**
   * Get the plugin metadata
   */
  getMetadata(): PluginMetadata {
    return this.metadata;
  }

  /**
   * Get the input audio node
   */
  getInputNode(): AudioNode {
    return this.inputNode;
  }

  /**
   * Get the output audio node
   */
  getOutputNode(): AudioNode {
    return this.outputNode;
  }

  /**
   * Get the processor node (between input and output)
   */
  getProcessorNode(): AudioNode | null {
    return this.processorNode;
  }

  /**
   * Connect the plugin to another node
   */
  connect(destination: AudioNode | AudioParam): void {
    this.outputNode.connect(destination);
  }

  /**
   * Disconnect the plugin
   */
  disconnect(): void {
    this.outputNode.disconnect();
  }

  /**
   * Set a parameter value
   */
  setParameter(parameterId: string, value: number): void {
    const param = this.metadata.parameters.find((p) => p.id === parameterId);
    if (!param) {
      logger.warn(`Parameter not found: ${parameterId}`);
      return;
    }

    // Clamp value to range
    const clampedValue = Math.max(param.min, Math.min(param.max, value));

    // Update state
    this.state.parameters.set(parameterId, clampedValue);

    // Apply to plugin (implemented by subclasses)
    this.applyParameter(parameterId, clampedValue);

    // Notify callbacks
    const callbacks = this.parameterChangeCallbacks.get(parameterId);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(clampedValue);
      }
    }
  }

  /**
   * Get a parameter value
   */
  getParameter(parameterId: string): number | undefined {
    return this.state.parameters.get(parameterId);
  }

  /**
   * Get all parameter values
   */
  getAllParameters(): Record<string, number> {
    const params: Record<string, number> = {};
    for (const [id, value] of this.state.parameters) {
      params[id] = value;
    }
    return params;
  }

  /**
   * Set multiple parameters at once
   */
  setParameters(parameters: Record<string, number>): void {
    for (const [id, value] of Object.entries(parameters)) {
      this.setParameter(id, value);
    }
  }

  /**
   * Apply parameter to the actual plugin
   * Must be implemented by subclasses
   */
  protected abstract applyParameter(parameterId: string, value: number): void;

  /**
   * Load a preset
   */
  async loadPreset(presetId: string): Promise<void> {
    const preset = this.metadata.presets.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    // Set all parameters from preset
    this.setParameters(preset.parameters);

    // Update state
    this.state.activePreset = presetId;
  }

  /**
   * Get the active preset
   */
  getActivePreset(): string | null {
    return this.state.activePreset;
  }

  /**
   * Set bypass state
   */
  setBypass(bypass: boolean): void {
    this.state.bypass = bypass;

    if (bypass) {
      // Connect input directly to output
      this.inputNode.disconnect();
      this.inputNode.connect(this.outputNode);
    } else {
      // Route through processor
      this.reconnectAudioPath();
    }
  }

  /**
   * Get bypass state
   */
  isBypassed(): boolean {
    return this.state.bypass;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;

    if (enabled) {
      this.outputNode.gain.value = 1;
    } else {
      this.outputNode.gain.value = 0;
    }
  }

  /**
   * Get enabled state
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Get the current state
   */
  getState(): PluginState {
    return {
      parameters: new Map(this.state.parameters),
      activePreset: this.state.activePreset,
      bypass: this.state.bypass,
      enabled: this.state.enabled,
    };
  }

  /**
   * Restore state
   */
  setState(state: Partial<PluginState>): void {
    if (state.parameters) {
      for (const [id, value] of state.parameters) {
        this.setParameter(id, value);
      }
    }

    if (state.activePreset !== undefined) {
      this.state.activePreset = state.activePreset;
    }

    if (state.bypass !== undefined) {
      this.setBypass(state.bypass);
    }

    if (state.enabled !== undefined) {
      this.setEnabled(state.enabled);
    }
  }

  /**
   * Subscribe to parameter changes
   */
  onParameterChange(parameterId: string, callback: (value: number) => void): () => void {
    if (!this.parameterChangeCallbacks.has(parameterId)) {
      this.parameterChangeCallbacks.set(parameterId, []);
    }

    this.parameterChangeCallbacks.get(parameterId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.parameterChangeCallbacks.get(parameterId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get latency in samples
   */
  abstract getLatency(): number;

  /**
   * Get current CPU usage (0-1)
   */
  abstract getCPUUsage(): number;

  /**
   * Reconnect audio path
   */
  protected reconnectAudioPath(): void {
    // Disconnect everything
    this.inputNode.disconnect();
    if (this.processorNode) {
      this.processorNode.disconnect();
    }

    // Reconnect: input -> processor -> output
    if (this.processorNode) {
      this.inputNode.connect(this.processorNode);
      this.processorNode.connect(this.outputNode);
    } else {
      // No processor yet, connect directly
      this.inputNode.connect(this.outputNode);
    }
  }

  /**
   * Serialize state to JSON
   */
  serialize(): string {
    return JSON.stringify({
      metadata: {
        id: this.metadata.id,
        name: this.metadata.name,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
      },
      state: {
        parameters: Object.fromEntries(this.state.parameters),
        activePreset: this.state.activePreset,
        bypass: this.state.bypass,
        enabled: this.state.enabled,
      },
    });
  }

  /**
   * Deserialize state from JSON
   */
  deserialize(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.state) {
        if (data.state.parameters) {
          const params = new Map(Object.entries(data.state.parameters));
          this.setState({ parameters: params as Map<string, number> });
        }

        if (data.state.activePreset !== undefined) {
          this.setState({ activePreset: data.state.activePreset });
        }

        if (data.state.bypass !== undefined) {
          this.setBypass(data.state.bypass);
        }

        if (data.state.enabled !== undefined) {
          this.setEnabled(data.state.enabled);
        }
      }
    } catch (error) {
      logger.error('Failed to deserialize plugin state:', error);
    }
  }
}

/**
 * Plugin Wrapper Factory
 * Creates the appropriate wrapper for a given plugin format
 */
export type PluginWrapperFactory = (
  metadata: PluginMetadata,
  audioContext: AudioContext
) => Promise<BasePluginWrapper>;
