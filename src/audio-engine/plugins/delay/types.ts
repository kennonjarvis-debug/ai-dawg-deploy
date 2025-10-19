/**
 * Shared types and interfaces for AI Delay plugins
 *
 * Common parameter types, presets, and utility types used across
 * all DAWG AI delay plugins
 */

/**
 * Tempo multiplier options for tempo-synced delays
 */
export type TempoMultiplier =
  | 0.0625   // 1/16T (triplet)
  | 0.125    // 1/16
  | 0.1875   // 1/8T (triplet)
  | 0.25     // 1/8
  | 0.375    // 1/4T (triplet)
  | 0.5      // 1/4
  | 0.75     // 1/2T (triplet)
  | 1.0      // 1/2
  | 1.5      // 3/4
  | 2.0;     // Whole note

/**
 * Tempo multiplier display names
 */
export const TEMPO_MULTIPLIER_NAMES: Record<number, string> = {
  0.0625: '1/16T',
  0.125: '1/16',
  0.1875: '1/8T',
  0.25: '1/8',
  0.375: '1/4T',
  0.5: '1/4',
  0.75: '1/2T',
  1.0: '1/2',
  1.5: '3/4',
  2.0: 'Whole'
};

/**
 * Common delay parameter ranges
 */
export const DELAY_PARAMETER_RANGES = {
  delayTime: { min: 0, max: 5000, default: 375, unit: 'ms' },
  feedback: { min: 0, max: 100, default: 35, unit: '%' },
  mix: { min: 0, max: 100, default: 30, unit: '%' },
  lowCut: { min: 20, max: 500, default: 100, unit: 'Hz' },
  highCut: { min: 1000, max: 20000, default: 10000, unit: 'Hz' },
  modulation: { min: 0, max: 100, default: 10, unit: '%' },
  modulationRate: { min: 0.1, max: 10, default: 0.5, unit: 'Hz' }
};

/**
 * Delay plugin preset interface
 */
export interface DelayPreset {
  id: string;
  name: string;
  description: string;
  category: 'vocal' | 'instrument' | 'drum' | 'master' | 'creative' | 'utility';
  parameters: Record<string, number | boolean>;
  tags?: string[];
}

/**
 * AI-specific delay features
 */
export interface AIDelayFeatures {
  smartFeedback?: boolean;        // AI-powered feedback control
  adaptiveFiltering?: boolean;    // AI adapts filters
  vocalDetection?: boolean;       // AI vocal detection
  smartDucking?: boolean;         // AI ducking control
  adaptiveRelease?: boolean;      // AI release time adaptation
  smartStereo?: boolean;          // AI stereo optimization
  adaptivePanning?: boolean;      // AI panning adaptation
  tempoAnalysis?: boolean;        // AI tempo detection
}

/**
 * Delay plugin metadata interface
 */
export interface DelayPluginMetadata {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  isAI: boolean;
  description: string;
  features: string[];
  presets?: DelayPreset[];
  aiFeatures?: AIDelayFeatures;
}

/**
 * Common delay plugin state for visualization
 */
export interface DelayPluginState {
  delayTime: number;
  currentFeedback: number;
  wetLevel: number;
  dryLevel: number;
  inputLevel?: number;
  outputLevel?: number;
  duckingGain?: number;         // For ducking delay
  vocalProbability?: number;    // For ducking delay
  stereoWidth?: number;         // For ping-pong delay
  modulationDepth?: number;     // Current modulation amount
}

/**
 * Preset collection for tape delay
 */
export const TAPE_DELAY_PRESETS: DelayPreset[] = [
  {
    id: 'tape-vintage-slap',
    name: 'Vintage Slap',
    description: 'Classic short tape slap echo for vocals',
    category: 'vocal',
    parameters: {
      delayTime: 120,
      feedback: 15,
      mix: 25,
      tapeAge: 60,
      wowAmount: 40,
      flutterAmount: 30,
      saturation: 50,
      filterCutoff: 3500
    },
    tags: ['vintage', 'vocal', 'slap']
  },
  {
    id: 'tape-rockabilly',
    name: 'Rockabilly Echo',
    description: 'Sun Studios style tape echo',
    category: 'vocal',
    parameters: {
      delayTime: 375,
      feedback: 45,
      mix: 35,
      tapeAge: 70,
      wowAmount: 50,
      flutterAmount: 35,
      saturation: 60,
      filterCutoff: 4000
    },
    tags: ['vintage', 'rockabilly', 'echo']
  },
  {
    id: 'tape-dub-delay',
    name: 'Dub Delay',
    description: 'Classic dub reggae tape delay',
    category: 'instrument',
    parameters: {
      delayTime: 500,
      feedback: 65,
      mix: 40,
      tapeAge: 50,
      wowAmount: 30,
      flutterAmount: 20,
      saturation: 45,
      filterCutoff: 5000
    },
    tags: ['dub', 'reggae', 'creative']
  }
];

/**
 * Preset collection for digital delay
 */
export const DIGITAL_DELAY_PRESETS: DelayPreset[] = [
  {
    id: 'digital-vocal-delay',
    name: 'Vocal Delay',
    description: 'Clean digital delay for vocals',
    category: 'vocal',
    parameters: {
      delayTime: 375,
      feedback: 30,
      mix: 25,
      lowCut: 150,
      highCut: 12000,
      modulation: 5,
      character: 5,
      smartFeedback: true,
      adaptiveFiltering: true
    },
    tags: ['vocal', 'clean', 'modern']
  },
  {
    id: 'digital-eighth-note',
    name: 'Eighth Note Delay',
    description: 'Tempo-synced 1/8 note delay',
    category: 'instrument',
    parameters: {
      delayTime: 375,
      feedback: 40,
      mix: 30,
      tempoSync: true,
      tempoMultiplier: 0.25,
      smartFeedback: true
    },
    tags: ['tempo-sync', 'rhythmic']
  },
  {
    id: 'digital-dotted-eighth',
    name: 'Dotted Eighth',
    description: 'The Edge style dotted eighth delay',
    category: 'instrument',
    parameters: {
      delayTime: 375,
      feedback: 50,
      mix: 35,
      tempoSync: true,
      tempoMultiplier: 0.375,
      smartFeedback: true
    },
    tags: ['tempo-sync', 'u2', 'edge']
  }
];

/**
 * Preset collection for ping-pong delay
 */
export const PING_PONG_DELAY_PRESETS: DelayPreset[] = [
  {
    id: 'pingpong-wide-stereo',
    name: 'Wide Stereo',
    description: 'Maximum width ping-pong delay',
    category: 'creative',
    parameters: {
      delayTime: 375,
      feedback: 40,
      mix: 30,
      pingPongAmount: 100,
      stereoWidth: 100,
      panSpread: 100,
      smartStereo: true
    },
    tags: ['stereo', 'wide', 'creative']
  },
  {
    id: 'pingpong-vocal',
    name: 'Vocal Ping-Pong',
    description: 'Subtle ping-pong for vocals',
    category: 'vocal',
    parameters: {
      delayTime: 375,
      feedback: 30,
      mix: 25,
      pingPongAmount: 60,
      stereoWidth: 70,
      panSpread: 70,
      smartStereo: true,
      adaptivePanning: true
    },
    tags: ['vocal', 'stereo', 'subtle']
  },
  {
    id: 'pingpong-rhythmic',
    name: 'Rhythmic Bounce',
    description: 'Tempo-synced rhythmic ping-pong',
    category: 'instrument',
    parameters: {
      delayTime: 375,
      feedback: 45,
      mix: 35,
      pingPongAmount: 90,
      stereoWidth: 90,
      tempoSync: true,
      tempoMultiplier: 0.25
    },
    tags: ['tempo-sync', 'rhythmic', 'creative']
  }
];

/**
 * Preset collection for ducking delay
 */
export const DUCKING_DELAY_PRESETS: DelayPreset[] = [
  {
    id: 'ducking-vocal-clarity',
    name: 'Vocal Clarity',
    description: 'Delay that stays out of the way of vocals',
    category: 'vocal',
    parameters: {
      delayTime: 375,
      feedback: 35,
      mix: 30,
      duckAmount: 70,
      duckThreshold: -20,
      attackTime: 10,
      releaseTime: 200,
      smartDucking: true,
      vocalDetection: true,
      adaptiveRelease: true
    },
    tags: ['vocal', 'ducking', 'clarity']
  },
  {
    id: 'ducking-broadcast',
    name: 'Broadcast Voice',
    description: 'Heavy ducking for clear spoken word',
    category: 'vocal',
    parameters: {
      delayTime: 250,
      feedback: 25,
      mix: 25,
      duckAmount: 85,
      duckThreshold: -25,
      attackTime: 5,
      releaseTime: 150,
      smartDucking: true,
      vocalDetection: true
    },
    tags: ['vocal', 'broadcast', 'clarity']
  },
  {
    id: 'ducking-subtle',
    name: 'Subtle Duck',
    description: 'Light ducking for transparent delay',
    category: 'instrument',
    parameters: {
      delayTime: 375,
      feedback: 40,
      mix: 30,
      duckAmount: 40,
      duckThreshold: -15,
      attackTime: 20,
      releaseTime: 300,
      smartDucking: true,
      adaptiveRelease: true
    },
    tags: ['subtle', 'transparent']
  }
];

/**
 * Combined preset registry
 */
export const ALL_DELAY_PRESETS = {
  tape: TAPE_DELAY_PRESETS,
  digital: DIGITAL_DELAY_PRESETS,
  pingPong: PING_PONG_DELAY_PRESETS,
  ducking: DUCKING_DELAY_PRESETS
};

/**
 * Utility function to convert delay time to tempo-synced value
 */
export function delayTimeToTempoSync(
  delayTimeMs: number,
  bpm: number
): TempoMultiplier {
  const beatDurationMs = (60 / bpm) * 1000;
  const multiplier = delayTimeMs / beatDurationMs;

  // Find closest tempo multiplier
  const tempoMultipliers: TempoMultiplier[] = [
    0.0625, 0.125, 0.1875, 0.25, 0.375, 0.5, 0.75, 1.0, 1.5, 2.0
  ];

  return tempoMultipliers.reduce((prev, curr) => {
    return Math.abs(curr - multiplier) < Math.abs(prev - multiplier) ? curr : prev;
  });
}

/**
 * Utility function to convert tempo-synced value to delay time
 */
export function tempoSyncToDelayTime(
  multiplier: TempoMultiplier,
  bpm: number
): number {
  const beatDurationMs = (60 / bpm) * 1000;
  return beatDurationMs * multiplier;
}

/**
 * Utility function to convert dB to linear gain
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Utility function to convert linear gain to dB
 */
export function linearToDb(linear: number): number {
  return 20 * Math.log10(Math.max(linear, 0.00001));
}
