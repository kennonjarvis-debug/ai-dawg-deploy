/**
 * Logic Pro X-style Mixing Console Routing Types
 *
 * Signal Flow:
 * Input → Input Gain → Inserts (pre-EQ/EQ/post-EQ) → Pan →
 * Sends (pre-fader) → Fader (Volume) → Sends (post-fader) → Output
 */

export type SendPosition = 'pre-fader' | 'post-fader' | 'post-pan';

export interface Send {
  /** Unique send identifier */
  id: string;

  /** Target bus number (1-64+) or aux track ID */
  destination: string;

  /** Send level (0.0-1.0) */
  level: number;

  /** Send position in signal chain */
  position: SendPosition;

  /** Whether send is enabled */
  enabled: boolean;

  /** Send panning (-1.0 to 1.0) */
  pan: number;

  /** Whether send is muted */
  muted: boolean;
}

export interface Insert {
  /** Unique insert identifier */
  id: string;

  /** Slot position (0-14 for 15 total inserts) */
  slot: number;

  /** Plugin instance ID (from PluginHost) */
  pluginInstanceId: string | null;

  /** Whether insert is enabled (bypassed if false) */
  enabled: boolean;

  /** Pre/post position relative to channel EQ */
  position: 'pre-eq' | 'eq' | 'post-eq';
}

export interface ChannelStrip {
  /** Input gain/trim (-∞ to +12 dB) */
  inputGain: number;

  /** Phase invert */
  phaseInvert: boolean;

  /** Stereo/Mono mode */
  stereoMode: 'stereo' | 'mono' | 'dual-mono';

  /** Insert slots (15 total) */
  inserts: Insert[];

  /** Send slots (8 total) */
  sends: Send[];

  /** Pan control (-1.0 to 1.0) */
  pan: number;

  /** Volume fader (0.0 to 1.0, or -∞ to 0 dB) */
  volume: number;

  /** Output routing */
  output: OutputRouting;
}

export interface OutputRouting {
  /** Destination type */
  type: 'master' | 'bus' | 'aux' | 'external';

  /** Destination ID (bus number, aux track ID, or output device) */
  destination: string;

  /** Output gain adjustment */
  gain: number;
}

export interface IOConfig {
  /** Physical or virtual input source */
  inputSource: string;

  /** Input channel configuration */
  inputChannels: number;

  /** Output destination */
  outputDestination: string;

  /** Output channel configuration */
  outputChannels: number;
}

export interface Bus {
  /** Bus number (1-64+) */
  id: string;

  /** Bus name */
  name: string;

  /** Type of bus */
  type: 'aux' | 'submix' | 'send-return';

  /** Whether bus is an aux track (has its own channel strip) */
  isAuxTrack: boolean;

  /** Channel strip for aux tracks */
  channelStrip?: ChannelStrip;

  /** Master volume for the bus */
  volume: number;

  /** Pan for stereo buses */
  pan: number;

  /** Mute state */
  muted: boolean;

  /** Solo state */
  solo: boolean;

  /** Output routing */
  output: OutputRouting;
}

export interface MixerState {
  /** All audio tracks */
  tracks: Map<string, TrackChannelStrip>;

  /** All buses (including aux tracks) */
  buses: Map<string, Bus>;

  /** Master channel strip */
  master: ChannelStrip;

  /** Current solo mode state */
  soloMode: 'off' | 'solo' | 'solo-safe';
}

export interface TrackChannelStrip {
  /** Track ID */
  id: string;

  /** Track name */
  name: string;

  /** Track color */
  color: string;

  /** Channel strip configuration */
  channelStrip: ChannelStrip;

  /** Mute state */
  muted: boolean;

  /** Solo state */
  solo: boolean;

  /** Record arm state */
  isArmed: boolean;

  /** Input monitoring mode */
  inputMonitoring: 'auto' | 'input-only' | 'off';

  /** I/O configuration */
  io: IOConfig;

  /** Track type */
  type: 'audio' | 'aux' | 'master';
}

/**
 * Signal flow routing engine interface
 */
export interface RoutingEngine {
  /**
   * Create a new send on a track
   */
  createSend(trackId: string, destination: string, position: SendPosition): Send;

  /**
   * Create a new insert slot on a track
   */
  createInsert(trackId: string, slot: number, position: 'pre-eq' | 'eq' | 'post-eq'): Insert;

  /**
   * Create a new bus (with optional aux track)
   */
  createBus(name: string, isAuxTrack: boolean): Bus;

  /**
   * Load a plugin into an insert slot
   */
  loadPluginToInsert(trackId: string, insertId: string, pluginId: string): Promise<void>;

  /**
   * Route track output to a destination
   */
  setOutputRouting(trackId: string, routing: OutputRouting): void;

  /**
   * Get the complete signal flow for a track
   */
  getSignalFlow(trackId: string): SignalFlowNode[];
}

export interface SignalFlowNode {
  /** Node type */
  type: 'input' | 'insert' | 'send' | 'pan' | 'fader' | 'output';

  /** Node ID */
  id: string;

  /** Processing order */
  order: number;

  /** Is this node bypassed/disabled */
  bypassed: boolean;

  /** Connected downstream nodes */
  outputs: string[];
}
