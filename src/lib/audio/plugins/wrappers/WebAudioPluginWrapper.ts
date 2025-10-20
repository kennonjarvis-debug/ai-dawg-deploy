/**
 * Web Audio Plugin Wrapper
 *
 * Wrapper for plugins built with Web Audio API nodes.
 * This is fully functional and can be used immediately for browser-based plugins.
 */

import { BasePluginWrapper } from './BasePluginWrapper';
import type { PluginMetadata } from '../types';

import { logger } from '$lib/utils/logger';
/**
 * Web Audio Plugin Configuration
 * Defines how to construct a Web Audio plugin
 */
export interface WebAudioPluginConfig {
  /** Factory function that creates the audio processing graph */
  createProcessor: (
    audioContext: AudioContext,
    metadata: PluginMetadata
  ) => {
    inputNode: AudioNode;
    outputNode: AudioNode;
    parameterNodes: Map<string, AudioParam | GainNode>;
  };

  /** Optional custom process function for offline rendering */
  process?: (
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, number>
  ) => void;
}

/**
 * Web Audio Plugin Wrapper
 * Wraps Web Audio API based plugins
 */
export class WebAudioPluginWrapper extends BasePluginWrapper {
  private config: WebAudioPluginConfig;
  private parameterNodes: Map<string, AudioParam | GainNode> = new Map();
  private pluginInputNode: AudioNode | null = null;
  private pluginOutputNode: AudioNode | null = null;

  constructor(
    metadata: PluginMetadata,
    audioContext: AudioContext,
    config: WebAudioPluginConfig
  ) {
    super(metadata, audioContext);
    this.config = config;
  }

  /**
   * Load the plugin
   */
  async load(): Promise<void> {
    try {
      // Create the processor
      const processor = this.config.createProcessor(
        this.audioContext,
        this.metadata
      );

      this.pluginInputNode = processor.inputNode;
      this.pluginOutputNode = processor.outputNode;
      this.parameterNodes = processor.parameterNodes;

      // Use plugin's output as our processor node
      this.processorNode = this.pluginOutputNode;

      // Connect audio path: wrapper input -> plugin input -> plugin output -> wrapper output
      this.inputNode.connect(this.pluginInputNode);
      this.pluginOutputNode.connect(this.outputNode);

      // Apply initial parameter values
      for (const [id, value] of this.state.parameters) {
        this.applyParameter(id, value);
      }

      logger.info(`[WebAudioPlugin] Loaded: ${this.metadata.name}`);
    } catch (error) {
      logger.error(`[WebAudioPlugin] Failed to load: ${this.metadata.name}`, error);
      throw error;
    }
  }

  /**
   * Apply parameter to Web Audio node
   */
  protected applyParameter(parameterId: string, value: number): void {
    const node = this.parameterNodes.get(parameterId);
    if (!node) {
      logger.warn(`[WebAudioPlugin] Parameter node not found: ${parameterId}`);
      return;
    }

    // Check if it's an AudioParam or a GainNode
    if ('value' in node && typeof node.value === 'number') {
      // It's an AudioParam
      (node as AudioParam).value = value;
    } else if ('gain' in node) {
      // It's a GainNode
      (node as GainNode).gain.value = value;
    }
  }

  /**
   * Process audio (for offline rendering)
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters?: Record<string, number>
  ): void {
    if (this.config.process) {
      // Use custom process function if provided
      this.config.process(inputs, outputs, parameters || {});
    } else {
      // Default: just copy input to output (bypass)
      for (let channel = 0; channel < inputs.length; channel++) {
        if (outputs[channel]) {
          outputs[channel].set(inputs[channel]);
        }
      }
    }
  }

  /**
   * Unload the plugin
   */
  async unload(): Promise<void> {
    // Disconnect all nodes
    this.disconnect();
    this.inputNode.disconnect();

    if (this.pluginInputNode) {
      this.pluginInputNode.disconnect();
    }

    if (this.pluginOutputNode) {
      this.pluginOutputNode.disconnect();
    }

    // Clear references
    this.processorNode = null;
    this.pluginInputNode = null;
    this.pluginOutputNode = null;
    this.parameterNodes.clear();

    logger.info(`[WebAudioPlugin] Unloaded: ${this.metadata.name}`);
  }

  /**
   * Get latency in samples
   */
  getLatency(): number {
    // Web Audio plugins typically have minimal latency
    // Could be calculated from buffer sizes if needed
    return 0;
  }

  /**
   * Get CPU usage (estimate)
   */
  getCPUUsage(): number {
    // This is an estimate - real measurement would require performance monitoring
    // Returns 0-1 (0% to 100%)
    switch (this.metadata.cpuLoad) {
      case 'low':
        return 0.05;
      case 'medium':
        return 0.15;
      case 'high':
        return 0.3;
      case 'very-high':
        return 0.5;
      default:
        return 0.1;
    }
  }
}

/**
 * Web Audio Plugin Factory
 * Helper to create Web Audio plugins
 */
export function createWebAudioPlugin(
  metadata: PluginMetadata,
  audioContext: AudioContext,
  config: WebAudioPluginConfig
): WebAudioPluginWrapper {
  return new WebAudioPluginWrapper(metadata, audioContext, config);
}

/**
 * Example: Simple Gain Plugin
 */
export const SimpleGainPlugin: WebAudioPluginConfig = {
  createProcessor: (audioContext, metadata) => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1;

    return {
      inputNode: gainNode,
      outputNode: gainNode,
      parameterNodes: new Map([['gain', gainNode.gain]]),
    };
  },
};

/**
 * Example: Simple EQ Plugin (3-band)
 */
export const SimpleEQPlugin: WebAudioPluginConfig = {
  createProcessor: (audioContext) => {
    const inputNode = audioContext.createGain();
    const outputNode = audioContext.createGain();

    // Create filters
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 200;
    lowShelf.gain.value = 0;

    const mid = audioContext.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;

    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = 0;

    // Connect: input -> low -> mid -> high -> output
    inputNode.connect(lowShelf);
    lowShelf.connect(mid);
    mid.connect(highShelf);
    highShelf.connect(outputNode);

    return {
      inputNode,
      outputNode,
      parameterNodes: new Map([
        ['lowGain', lowShelf.gain],
        ['midGain', mid.gain],
        ['highGain', highShelf.gain],
      ]),
    };
  },
};

/**
 * Example: Simple Compressor Plugin
 */
export const SimpleCompressorPlugin: WebAudioPluginConfig = {
  createProcessor: (audioContext) => {
    const compressor = audioContext.createDynamicsCompressor();

    // Default settings
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    return {
      inputNode: compressor,
      outputNode: compressor,
      parameterNodes: new Map([
        ['threshold', compressor.threshold],
        ['knee', compressor.knee],
        ['ratio', compressor.ratio],
        ['attack', compressor.attack],
        ['release', compressor.release],
      ]),
    };
  },
};

/**
 * Example: Simple Delay Plugin
 */
export const SimpleDelayPlugin: WebAudioPluginConfig = {
  createProcessor: (audioContext) => {
    const inputNode = audioContext.createGain();
    const outputNode = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const delay = audioContext.createDelay(5); // Max 5 seconds
    const feedback = audioContext.createGain();

    // Default settings
    delay.delayTime.value = 0.5; // 500ms
    feedback.gain.value = 0.3; // 30% feedback
    dryGain.gain.value = 1;
    wetGain.gain.value = 0.5;

    // Routing:
    // input -> dry -> output
    // input -> delay -> feedback -> delay (loop)
    // input -> delay -> wet -> output
    inputNode.connect(dryGain);
    dryGain.connect(outputNode);

    inputNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(outputNode);

    return {
      inputNode,
      outputNode,
      parameterNodes: new Map([
        ['delayTime', delay.delayTime],
        ['feedback', feedback.gain],
        ['mix', wetGain.gain],
      ]),
    };
  },
};
