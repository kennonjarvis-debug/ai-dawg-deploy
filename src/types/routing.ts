/**
 * AI Auto-Routing System Types
 *
 * Defines types for intelligent routing, bus assignment, and signal chain creation
 */

// ============================================================================
// Routing Chain Types
// ============================================================================

export interface RoutingChain {
  /** Source track ID */
  trackId: string;

  /** Track name for reference */
  trackName: string;

  /** Buses assigned to this chain */
  busses: AudioBus[];

  /** Send/return chains */
  sends: AudioSend[];

  /** Insert effects in the chain */
  inserts: AudioInsert[];

  /** Final output destination */
  output: string;

  /** Chain creation timestamp */
  createdAt: Date;
}

export interface AudioBus {
  /** Unique bus identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Bus type */
  type: 'mix' | 'group' | 'aux' | 'send-return';

  /** Tracks/buses routed to this bus */
  routing: string[];

  /** Bus volume level (0-1) */
  volume: number;

  /** Bus pan (-1 to 1) */
  pan: number;

  /** Whether bus is muted */
  muted: boolean;

  /** Whether bus is soloed */
  solo: boolean;
}

export interface AudioSend {
  /** Unique send identifier */
  id: string;

  /** Source track/bus ID */
  source: string;

  /** Destination bus ID */
  destination: string;

  /** Send level (0-1) */
  level: number;

  /** Pre-fader or post-fader */
  preFader: boolean;

  /** Whether send is active */
  enabled: boolean;

  /** Send type/purpose */
  purpose?: 'reverb' | 'delay' | 'parallel-compression' | 'effects' | 'custom';
}

export interface AudioInsert {
  /** Unique insert identifier */
  id: string;

  /** Insert slot number (0-14) */
  slot: number;

  /** Effect/plugin type */
  type: 'eq' | 'compressor' | 'gate' | 'reverb' | 'delay' | 'deesser' | 'saturation' | 'custom';

  /** Plugin instance ID */
  pluginId?: string;

  /** Effect parameters */
  parameters: Record<string, any>;

  /** Whether insert is bypassed */
  bypassed: boolean;

  /** Position relative to EQ */
  position: 'pre-eq' | 'eq' | 'post-eq';
}

// ============================================================================
// Track Detection & Analysis Types
// ============================================================================

export interface TrackDetectionResult {
  /** Track ID */
  trackId: string;

  /** Track name */
  trackName: string;

  /** Detected track type */
  type: 'vocal' | 'lead-vocal' | 'backing-vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'unknown';

  /** Confidence score (0-1) */
  confidence: number;

  /** Whether track contains vocals */
  hasVocals: boolean;

  /** Whether this is the main/lead vocal */
  isLeadVocal: boolean;

  /** Audio characteristics */
  characteristics: {
    averageFrequency: number;
    dynamicRange: number;
    rmsLevel: number;
    peakLevel: number;
    spectralCentroid: number;
  };
}

export interface VocalChainConfig {
  /** Vocal tracks to process */
  vocalTracks: string[];

  /** Lead vocal track ID */
  leadVocalId?: string;

  /** Backing vocal track IDs */
  backingVocalIds: string[];

  /** Genre-specific settings */
  genre?: 'pop' | 'rock' | 'hip-hop' | 'rnb' | 'electronic' | 'country' | 'jazz';

  /** Target processing style */
  style?: 'natural' | 'polished' | 'aggressive' | 'intimate' | 'broadcast';

  /** Auto-create parallel compression */
  useParallelCompression: boolean;

  /** Auto-create reverb send */
  useReverbSend: boolean;

  /** Auto-create delay send */
  useDelaySend: boolean;

  /** Auto-create de-esser */
  useDeEsser: boolean;
}

// ============================================================================
// Processing Chain Presets
// ============================================================================

export interface VocalProcessingPreset {
  /** Preset name */
  name: string;

  /** EQ settings */
  eq: {
    highpass: { frequency: number; q: number };
    cuts: Array<{ frequency: number; gain: number; q: number }>;
    boosts: Array<{ frequency: number; gain: number; q: number }>;
    presence: { frequency: number; gain: number; q: number };
    air: { frequency: number; gain: number; q: number };
  };

  /** Compression settings */
  compression: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
    makeupGain: number;
  };

  /** De-esser settings */
  deEsser?: {
    frequency: number;
    threshold: number;
    ratio: number;
  };

  /** Reverb send level */
  reverbSend: number;

  /** Delay send level */
  delaySend: number;

  /** Parallel compression amount */
  parallelCompressionMix?: number;
}

// ============================================================================
// Gain Staging & Level Management
// ============================================================================

export interface GainStagingConfig {
  /** Track ID */
  trackId: string;

  /** Input gain adjustment (dB) */
  inputGain: number;

  /** Recommended fader level (dB) */
  faderLevel: number;

  /** Headroom target (dB) */
  headroom: number;

  /** Current peak level (dB) */
  currentPeak: number;

  /** Current RMS level (dB) */
  currentRms: number;

  /** Target RMS level (dB) */
  targetRms: number;
}

export interface MixBusConfig {
  /** Bus name */
  name: string;

  /** Tracks routed to this bus */
  tracks: string[];

  /** Bus processing chain */
  processing: {
    compression?: {
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
    };
    eq?: Array<{
      type: 'highpass' | 'lowpass' | 'bell' | 'shelf';
      frequency: number;
      gain?: number;
      q?: number;
    }>;
    saturation?: {
      amount: number;
      type: 'tape' | 'tube' | 'transformer';
    };
  };

  /** Target output level (dB) */
  targetLevel: number;
}

// ============================================================================
// Routing Operations
// ============================================================================

export interface RoutingOperation {
  /** Operation type */
  type: 'create-bus' | 'create-send' | 'add-insert' | 'route-track' | 'set-level';

  /** Operation description */
  description: string;

  /** Affected track/bus IDs */
  targets: string[];

  /** Operation parameters */
  params: Record<string, any>;

  /** Can this operation be undone */
  reversible: boolean;
}

export interface RoutingHistory {
  /** All operations performed */
  operations: RoutingOperation[];

  /** Current position in history */
  currentIndex: number;

  /** Can undo */
  canUndo: boolean;

  /** Can redo */
  canRedo: boolean;
}

// ============================================================================
// Auto-Routing Results
// ============================================================================

export interface AutoRoutingResult {
  /** Success status */
  success: boolean;

  /** Created routing chains */
  chains: RoutingChain[];

  /** Created buses */
  buses: AudioBus[];

  /** Operations performed */
  operations: RoutingOperation[];

  /** Summary message */
  summary: string;

  /** Detailed routing info */
  details: {
    vocalTracksDetected: number;
    leadVocalId?: string;
    backingVocalIds: string[];
    busesCreated: string[];
    sendsCreated: number;
    insertsCreated: number;
  };

  /** Warnings or issues */
  warnings?: string[];

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  RoutingChain,
  AudioBus,
  AudioSend,
  AudioInsert,
  TrackDetectionResult,
  VocalChainConfig,
  VocalProcessingPreset,
  GainStagingConfig,
  MixBusConfig,
  RoutingOperation,
  RoutingHistory,
  AutoRoutingResult,
};
