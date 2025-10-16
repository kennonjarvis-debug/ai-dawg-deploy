/**
 * RoutingEngine - Logic Pro X-style signal routing
 *
 * Implements channel strips, sends, inserts, and bus routing
 */

import { PluginHost } from '../../audio-engine/plugins/PluginHost';
import type {
  Send,
  Insert,
  Bus,
  ChannelStrip,
  TrackChannelStrip,
  MixerState,
  RoutingEngine as IRoutingEngine,
  SignalFlowNode,
  SendPosition,
  OutputRouting,
  IOConfig,
} from './types';

export class RoutingEngine implements IRoutingEngine {
  private mixerState: MixerState;
  private pluginHost: PluginHost;
  private audioContext: AudioContext;

  // Audio nodes for routing
  private trackGainNodes: Map<string, GainNode> = new Map();
  private trackPanNodes: Map<string, StereoPannerNode> = new Map();
  private sendGainNodes: Map<string, Map<string, GainNode>> = new Map(); // trackId -> sendId -> GainNode
  private busGainNodes: Map<string, GainNode> = new Map();
  private insertNodes: Map<string, Map<string, AudioNode>> = new Map(); // trackId -> insertId -> AudioNode

  constructor(audioContext: AudioContext, pluginHost: PluginHost) {
    this.audioContext = audioContext;
    this.pluginHost = pluginHost;

    // Initialize mixer state
    this.mixerState = {
      tracks: new Map(),
      buses: new Map(),
      master: this.createDefaultChannelStrip(),
      soloMode: 'off',
    };

    console.log('[RoutingEngine] Initialized');
  }

  /**
   * Create a track with full channel strip
   */
  createTrack(id: string, name: string, color: string): TrackChannelStrip {
    const track: TrackChannelStrip = {
      id,
      name,
      color,
      channelStrip: this.createDefaultChannelStrip(),
      muted: false,
      solo: false,
      isArmed: false,
      inputMonitoring: 'auto',
      io: {
        inputSource: 'default',
        inputChannels: 2,
        outputDestination: 'master',
        outputChannels: 2,
      },
      type: 'audio',
    };

    this.mixerState.tracks.set(id, track);

    // Create audio nodes
    this.createTrackAudioNodes(id);

    console.log(`[RoutingEngine] Created track: ${name}`);
    return track;
  }

  /**
   * Create default channel strip configuration
   */
  private createDefaultChannelStrip(): ChannelStrip {
    return {
      inputGain: 0, // 0 dB
      phaseInvert: false,
      stereoMode: 'stereo',
      inserts: this.createDefaultInserts(),
      sends: [],
      pan: 0, // Center
      volume: 1.0, // 0 dB
      output: {
        type: 'master',
        destination: 'master',
        gain: 0,
      },
    };
  }

  /**
   * Create 15 empty insert slots
   */
  private createDefaultInserts(): Insert[] {
    const inserts: Insert[] = [];

    // Slots 0-4: Pre-EQ
    for (let i = 0; i < 5; i++) {
      inserts.push({
        id: `insert-${i}`,
        slot: i,
        pluginInstanceId: null,
        enabled: true,
        position: 'pre-eq',
      });
    }

    // Slots 5-9: EQ position
    for (let i = 5; i < 10; i++) {
      inserts.push({
        id: `insert-${i}`,
        slot: i,
        pluginInstanceId: null,
        enabled: true,
        position: 'eq',
      });
    }

    // Slots 10-14: Post-EQ
    for (let i = 10; i < 15; i++) {
      inserts.push({
        id: `insert-${i}`,
        slot: i,
        pluginInstanceId: null,
        enabled: true,
        position: 'post-eq',
      });
    }

    return inserts;
  }

  /**
   * Create audio nodes for a track's signal chain
   */
  private createTrackAudioNodes(trackId: string): void {
    const gainNode = this.audioContext.createGain();
    const panNode = this.audioContext.createStereoPanner();

    this.trackGainNodes.set(trackId, gainNode);
    this.trackPanNodes.set(trackId, panNode);
    this.sendGainNodes.set(trackId, new Map());
    this.insertNodes.set(trackId, new Map());
  }

  /**
   * Create a send on a track (Logic Pro supports 8 sends per track)
   */
  createSend(trackId: string, destination: string, position: SendPosition): Send {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    if (track.channelStrip.sends.length >= 8) {
      throw new Error(`Track ${trackId} already has maximum sends (8)`);
    }

    const send: Send = {
      id: `send-${trackId}-${track.channelStrip.sends.length}`,
      destination,
      level: 0, // Start at -∞ dB
      position,
      enabled: true,
      pan: 0, // Center
      muted: false,
    };

    track.channelStrip.sends.push(send);

    // Create audio node for send
    const sendGain = this.audioContext.createGain();
    sendGain.gain.value = send.level;
    this.sendGainNodes.get(trackId)!.set(send.id, sendGain);

    console.log(`[RoutingEngine] Created ${position} send on track ${trackId} to ${destination}`);
    return send;
  }

  /**
   * Create an insert slot (Logic Pro supports 15 inserts per track)
   */
  createInsert(trackId: string, slot: number, position: 'pre-eq' | 'eq' | 'post-eq'): Insert {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    if (slot < 0 || slot >= 15) {
      throw new Error(`Invalid insert slot: ${slot} (must be 0-14)`);
    }

    // Check if slot already has an insert
    const existingInsert = track.channelStrip.inserts.find(i => i.slot === slot);
    if (existingInsert && existingInsert.pluginInstanceId) {
      throw new Error(`Insert slot ${slot} is already occupied`);
    }

    const insert: Insert = {
      id: `insert-${trackId}-${slot}`,
      slot,
      pluginInstanceId: null,
      enabled: true,
      position,
    };

    // Replace default insert at this slot
    const insertIndex = track.channelStrip.inserts.findIndex(i => i.slot === slot);
    if (insertIndex !== -1) {
      track.channelStrip.inserts[insertIndex] = insert;
    } else {
      track.channelStrip.inserts.push(insert);
      track.channelStrip.inserts.sort((a, b) => a.slot - b.slot);
    }

    console.log(`[RoutingEngine] Created insert slot ${slot} (${position}) on track ${trackId}`);
    return insert;
  }

  /**
   * Create a bus (Logic Pro supports 64+ buses)
   */
  createBus(name: string, isAuxTrack: boolean): Bus {
    const busId = `bus-${this.mixerState.buses.size + 1}`;

    const bus: Bus = {
      id: busId,
      name,
      type: isAuxTrack ? 'aux' : 'submix',
      isAuxTrack,
      channelStrip: isAuxTrack ? this.createDefaultChannelStrip() : undefined,
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      output: {
        type: 'master',
        destination: 'master',
        gain: 0,
      },
    };

    this.mixerState.buses.set(busId, bus);

    // Create audio node for bus
    const busGain = this.audioContext.createGain();
    busGain.gain.value = bus.volume;
    this.busGainNodes.set(busId, busGain);

    console.log(`[RoutingEngine] Created bus: ${name} (${isAuxTrack ? 'aux track' : 'submix'})`);
    return bus;
  }

  /**
   * Load a plugin into an insert slot
   */
  async loadPluginToInsert(trackId: string, insertId: string, pluginId: string): Promise<void> {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const insert = track.channelStrip.inserts.find(i => i.id === insertId);
    if (!insert) {
      throw new Error(`Insert not found: ${insertId}`);
    }

    // Load plugin via PluginHost
    const instanceId = await this.pluginHost.loadPlugin({
      id: `${trackId}-${insertId}-${pluginId}`,
      name: pluginId,
      type: 'native',
      parameters: {},
    });

    insert.pluginInstanceId = instanceId;

    console.log(`[RoutingEngine] Loaded plugin ${pluginId} into insert ${insertId} on track ${trackId}`);
  }

  /**
   * Set output routing for a track
   */
  setOutputRouting(trackId: string, routing: OutputRouting): void {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    track.channelStrip.output = routing;

    console.log(`[RoutingEngine] Set output routing for ${trackId} to ${routing.destination}`);
  }

  /**
   * Get the signal flow graph for a track
   */
  getSignalFlow(trackId: string): SignalFlowNode[] {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const nodes: SignalFlowNode[] = [];
    let order = 0;

    // 1. Input
    nodes.push({
      type: 'input',
      id: `${trackId}-input`,
      order: order++,
      bypassed: false,
      outputs: [`${trackId}-inserts-pre-eq`],
    });

    // 2. Pre-EQ Inserts
    const preEqInserts = track.channelStrip.inserts.filter(i => i.position === 'pre-eq' && i.pluginInstanceId);
    preEqInserts.forEach(insert => {
      nodes.push({
        type: 'insert',
        id: insert.id,
        order: order++,
        bypassed: !insert.enabled,
        outputs: [preEqInserts[preEqInserts.length - 1].id === insert.id ? `${trackId}-inserts-eq` : insert.id],
      });
    });

    // 3. EQ Inserts
    const eqInserts = track.channelStrip.inserts.filter(i => i.position === 'eq' && i.pluginInstanceId);
    eqInserts.forEach(insert => {
      nodes.push({
        type: 'insert',
        id: insert.id,
        order: order++,
        bypassed: !insert.enabled,
        outputs: [eqInserts[eqInserts.length - 1].id === insert.id ? `${trackId}-inserts-post-eq` : insert.id],
      });
    });

    // 4. Post-EQ Inserts
    const postEqInserts = track.channelStrip.inserts.filter(i => i.position === 'post-eq' && i.pluginInstanceId);
    postEqInserts.forEach(insert => {
      nodes.push({
        type: 'insert',
        id: insert.id,
        order: order++,
        bypassed: !insert.enabled,
        outputs: [postEqInserts[postEqInserts.length - 1].id === insert.id ? `${trackId}-pan` : insert.id],
      });
    });

    // 5. Pan
    nodes.push({
      type: 'pan',
      id: `${trackId}-pan`,
      order: order++,
      bypassed: false,
      outputs: [`${trackId}-pre-fader-sends`],
    });

    // 6. Pre-fader Sends
    const preFaderSends = track.channelStrip.sends.filter(s => s.position === 'pre-fader' && s.enabled);
    preFaderSends.forEach(send => {
      nodes.push({
        type: 'send',
        id: send.id,
        order: order++,
        bypassed: send.muted,
        outputs: [send.destination],
      });
    });

    // 7. Fader (Volume)
    nodes.push({
      type: 'fader',
      id: `${trackId}-fader`,
      order: order++,
      bypassed: track.muted,
      outputs: [`${trackId}-post-fader-sends`],
    });

    // 8. Post-fader Sends
    const postFaderSends = track.channelStrip.sends.filter(s => s.position === 'post-fader' && s.enabled);
    postFaderSends.forEach(send => {
      nodes.push({
        type: 'send',
        id: send.id,
        order: order++,
        bypassed: send.muted,
        outputs: [send.destination],
      });
    });

    // 9. Output
    nodes.push({
      type: 'output',
      id: `${trackId}-output`,
      order: order++,
      bypassed: false,
      outputs: [track.channelStrip.output.destination],
    });

    return nodes;
  }

  /**
   * Get all tracks
   */
  getTracks(): Map<string, TrackChannelStrip> {
    return this.mixerState.tracks;
  }

  /**
   * Get all buses
   */
  getBuses(): Map<string, Bus> {
    return this.mixerState.buses;
  }

  /**
   * Get a specific track
   */
  getTrack(trackId: string): TrackChannelStrip | undefined {
    return this.mixerState.tracks.get(trackId);
  }

  /**
   * Get a specific bus
   */
  getBus(busId: string): Bus | undefined {
    return this.mixerState.buses.get(busId);
  }

  /**
   * Set send level
   */
  setSendLevel(trackId: string, sendId: string, level: number): void {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const send = track.channelStrip.sends.find(s => s.id === sendId);
    if (!send) {
      throw new Error(`Send not found: ${sendId}`);
    }

    send.level = Math.max(0, Math.min(1, level));

    // Update audio node
    const sendGain = this.sendGainNodes.get(trackId)?.get(sendId);
    if (sendGain) {
      sendGain.gain.value = send.level;
    }
  }

  /**
   * Toggle insert bypass
   */
  toggleInsertBypass(trackId: string, insertId: string): void {
    const track = this.mixerState.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    const insert = track.channelStrip.inserts.find(i => i.id === insertId);
    if (!insert) {
      throw new Error(`Insert not found: ${insertId}`);
    }

    insert.enabled = !insert.enabled;

    console.log(`[RoutingEngine] Insert ${insertId} ${insert.enabled ? 'enabled' : 'bypassed'}`);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Disconnect all nodes
    this.trackGainNodes.forEach(node => node.disconnect());
    this.trackPanNodes.forEach(node => node.disconnect());
    this.busGainNodes.forEach(node => node.disconnect());
    this.sendGainNodes.forEach(sends => sends.forEach(node => node.disconnect()));

    this.trackGainNodes.clear();
    this.trackPanNodes.clear();
    this.busGainNodes.clear();
    this.sendGainNodes.clear();
    this.insertNodes.clear();

    console.log('[RoutingEngine] Disposed');
  }
}
