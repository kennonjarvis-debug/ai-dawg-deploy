/**
 * AI Function Definitions - Shared Module
 *
 * This module contains all AI function definitions used across the application.
 * Functions are versioned and cached to reduce bandwidth and improve performance.
 *
 * Performance Impact:
 * - Without caching: ~15KB sent on every session initialization
 * - With caching: ~100 bytes (version hash only) on subsequent sessions
 * - Bandwidth savings: ~99% for cached sessions
 */

import crypto from 'crypto';

// ===== VERSION MANAGEMENT =====

/**
 * Function definitions version
 * INCREMENT THIS when function definitions change to invalidate client caches
 */
export const FUNCTION_DEFINITIONS_VERSION = '1.0.0';

/**
 * Generate hash of function definitions for cache validation
 */
export function generateFunctionDefinitionsHash(functions: any[]): string {
  const functionsJson = JSON.stringify(functions);
  return crypto.createHash('sha256').update(functionsJson).digest('hex');
}

// ===== VOICE FUNCTIONS (Realtime API) =====

export const VOICE_FUNCTIONS = [
  {
    type: 'function',
    name: 'generate_music',
    description: 'Generate music or beats based on a text prompt. Use this when the user asks to create, generate, or make music or beats.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the music to generate, including style, instruments, mood, and artist references'
        },
        genre: {
          type: 'string',
          description: 'Music genre (e.g., hip-hop, pop, rock, country, electronic)'
        },
        tempo: {
          type: 'number',
          description: 'Tempo in BPM (beats per minute), typically 60-180'
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds (default: 30)'
        }
      },
      required: ['prompt']
    }
  },
  {
    type: 'function',
    name: 'start_recording',
    description: 'Start recording audio from the user\'s microphone',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    type: 'function',
    name: 'stop_recording',
    description: 'Stop the current recording',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    type: 'function',
    name: 'play',
    description: 'Play or preview the generated music',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    type: 'function',
    name: 'melody_to_vocals',
    description: 'Convert a hummed or sung melody into full vocals with AI-generated lyrics. Use this when the user hums a melody and wants you to turn it into a song with lyrics and vocals.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Creative prompt for the lyrics (e.g., "a love song about summer nights")'
        },
        genre: {
          type: 'string',
          description: 'Music genre (e.g., pop, rock, hip-hop, country)'
        },
        mood: {
          type: 'string',
          description: 'Desired mood (e.g., happy, sad, energetic, calm)'
        },
        theme: {
          type: 'string',
          description: 'Song theme (e.g., love, party, nature)'
        }
      },
      required: ['prompt']
    }
  }
];

// ===== DAW CONTROL FUNCTIONS (GPT-4o API) =====

export const DAW_FUNCTIONS = [
  {
    name: 'startRecording',
    description: 'Start recording audio on a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'Track ID to record on' },
        armed: { type: 'boolean', description: 'Arm track for recording', default: true },
      },
      required: ['trackId'],
    },
  },
  {
    name: 'stopRecording',
    description: 'Stop current recording',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playProject',
    description: 'Start playback of the project',
    parameters: {
      type: 'object',
      properties: {
        fromStart: { type: 'boolean', description: 'Play from beginning', default: false },
      },
    },
  },
  {
    name: 'stopPlayback',
    description: 'Stop project playback',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'moveClip',
    description: 'Move an audio/MIDI clip to a different position',
    parameters: {
      type: 'object',
      properties: {
        clipId: { type: 'string', description: 'Clip ID to move' },
        newPosition: { type: 'number', description: 'New position in bars/beats' },
        trackId: { type: 'string', description: 'Target track ID (optional)' },
      },
      required: ['clipId', 'newPosition'],
    },
  },
  {
    name: 'deleteClip',
    description: 'Delete an audio/MIDI clip',
    parameters: {
      type: 'object',
      properties: {
        clipId: { type: 'string', description: 'Clip ID to delete' },
      },
      required: ['clipId'],
    },
  },
  {
    name: 'autoComp',
    description: 'Automatically comp vocal takes by selecting the best parts from multiple recordings',
    parameters: {
      type: 'object',
      properties: {
        trackIds: { type: 'array', items: { type: 'string' }, description: 'Track IDs to comp' },
      },
      required: ['trackIds'],
    },
  },
  {
    name: 'quantize',
    description: 'Time align clips to grid with specified note division',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to quantize' },
        division: { type: 'string', description: 'Note division (e.g., "16th", "8th", "quarter")', enum: ['16th', '8th', 'quarter', 'half'] },
      },
      required: ['clipIds', 'division'],
    },
  },
  {
    name: 'autotune',
    description: 'Apply pitch correction to audio clips',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to pitch correct' },
        key: { type: 'string', description: 'Musical key for correction' },
        strength: { type: 'number', description: 'Correction strength 0-100', minimum: 0, maximum: 100 },
      },
      required: ['clipIds', 'key'],
    },
  },
  {
    name: 'pitchShift',
    description: 'Shift pitch of audio clips up or down without changing tempo',
    parameters: {
      type: 'object',
      properties: {
        clipIds: { type: 'array', items: { type: 'string' }, description: 'Clip IDs to pitch shift' },
        semitones: { type: 'number', description: 'Number of semitones to shift (-12 to +12)', minimum: -12, maximum: 12 },
      },
      required: ['clipIds', 'semitones'],
    },
  },
  {
    name: 'smartMix',
    description: 'Apply intelligent mixing to tracks',
    parameters: {
      type: 'object',
      properties: {
        trackIds: { type: 'array', items: { type: 'string' }, description: 'Track IDs to mix' },
        style: { type: 'string', description: 'Mixing style (e.g., "Drake", "Pop", "Rock", "Hip-Hop")' },
      },
      required: ['trackIds'],
    },
  },
  {
    name: 'master',
    description: 'Apply professional mastering to the project',
    parameters: {
      type: 'object',
      properties: {
        targetLoudness: { type: 'number', description: 'Target LUFS loudness', default: -14 },
        genre: { type: 'string', description: 'Music genre for mastering profile' },
      },
    },
  },
  {
    name: 'generateChords',
    description: 'Generate chord progressions',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key' },
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
      },
      required: ['key'],
    },
  },
  {
    name: 'generateMelody',
    description: 'Generate melodies',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key' },
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
      },
      required: ['key'],
    },
  },
  {
    name: 'generateDrums',
    description: 'Generate drum patterns',
    parameters: {
      type: 'object',
      properties: {
        genre: { type: 'string', description: 'Music genre' },
        bars: { type: 'number', description: 'Number of bars', default: 8 },
        complexity: { type: 'string', description: 'Pattern complexity', enum: ['simple', 'medium', 'complex'], default: 'medium' },
      },
      required: ['genre'],
    },
  },
  {
    name: 'generateBeats',
    description: 'Generate a complete beat with drums, bass, and melody',
    parameters: {
      type: 'object',
      properties: {
        genre: { type: 'string', description: 'Music genre (e.g., "Trap", "Boom Bap", "Lo-Fi")' },
        key: { type: 'string', description: 'Musical key' },
        tempo: { type: 'number', description: 'BPM tempo' },
        bars: { type: 'number', description: 'Number of bars', default: 16 },
      },
      required: ['genre'],
    },
  },
  {
    name: 'setTempo',
    description: 'Change the project tempo (BPM)',
    parameters: {
      type: 'object',
      properties: {
        bpm: { type: 'number', description: 'New tempo in BPM', minimum: 20, maximum: 300 },
      },
      required: ['bpm'],
    },
  },
  {
    name: 'setKey',
    description: 'Change the project key',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Musical key (e.g., "C Major", "A Minor")' },
      },
      required: ['key'],
    },
  },
  {
    name: 'writeLyrics',
    description: 'Write lyrics or notes to the lyrics widget when user says "write this down" or similar',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The lyrics or notes to write' },
        append: { type: 'boolean', description: 'Append to existing lyrics (true) or replace (false)', default: true },
      },
      required: ['text'],
    },
  },
  {
    name: 'getTracks',
    description: 'Get information about all tracks in the project to analyze routing, track names, and types',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createAuxTrack',
    description: 'Create an aux/bus track for effects routing (like Logic Pro X aux channels)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name for the aux track (e.g., "Reverb", "Delay", "Vocal Reverb")' },
        channels: { type: 'string', enum: ['mono', 'stereo'], description: 'Mono or stereo configuration', default: 'stereo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'createAudioTrack',
    description: 'Create a new audio track',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name for the audio track' },
        channels: { type: 'string', enum: ['mono', 'stereo'], description: 'Mono or stereo', default: 'stereo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'createSend',
    description: 'Create a send from a source track to an aux track (Logic Pro X-style bus routing)',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the source track to send from' },
        destinationTrackId: { type: 'string', description: 'ID of the destination aux track' },
        preFader: { type: 'boolean', description: 'Pre-fader (true) or post-fader (false) send', default: false },
        level: { type: 'number', description: 'Send level (0-1), default 0.8', minimum: 0, maximum: 1, default: 0.8 },
      },
      required: ['sourceTrackId', 'destinationTrackId'],
    },
  },
  {
    name: 'removeSend',
    description: 'Remove a send from a track',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the track with the send' },
        sendId: { type: 'string', description: 'ID of the send to remove' },
      },
      required: ['sourceTrackId', 'sendId'],
    },
  },
  {
    name: 'setSendLevel',
    description: 'Adjust the level of a send',
    parameters: {
      type: 'object',
      properties: {
        sourceTrackId: { type: 'string', description: 'ID of the track with the send' },
        sendId: { type: 'string', description: 'ID of the send' },
        level: { type: 'number', description: 'Send level (0-1)', minimum: 0, maximum: 1 },
      },
      required: ['sourceTrackId', 'sendId', 'level'],
    },
  },
  {
    name: 'setTrackOutput',
    description: 'Route a track\'s output to master or an aux track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track to route' },
        outputDestination: { type: 'string', description: 'Destination: "master" or aux track ID' },
      },
      required: ['trackId', 'outputDestination'],
    },
  },
  {
    name: 'setTrackVolume',
    description: 'Set the volume fader of a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        volume: { type: 'number', description: 'Volume level (0-1, where 1 = 0dB)', minimum: 0, maximum: 1 },
      },
      required: ['trackId', 'volume'],
    },
  },
  {
    name: 'setTrackPan',
    description: 'Set the pan position of a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        pan: { type: 'number', description: 'Pan position (-1 = left, 0 = center, 1 = right)', minimum: -1, maximum: 1 },
      },
      required: ['trackId', 'pan'],
    },
  },
  {
    name: 'muteTrack',
    description: 'Mute or unmute a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        mute: { type: 'boolean', description: 'true to mute, false to unmute' },
      },
      required: ['trackId', 'mute'],
    },
  },
  {
    name: 'soloTrack',
    description: 'Solo or unsolo a track',
    parameters: {
      type: 'object',
      properties: {
        trackId: { type: 'string', description: 'ID of the track' },
        solo: { type: 'boolean', description: 'true to solo, false to unsolo' },
      },
      required: ['trackId', 'solo'],
    },
  },
];

// ===== EXPORTS =====

export interface FunctionDefinitionMetadata {
  version: string;
  hash: string;
  voiceFunctionCount: number;
  dawFunctionCount: number;
  totalFunctionCount: number;
  uncompressedSize: number;
  timestamp: number;
}

export function getFunctionDefinitionMetadata(): FunctionDefinitionMetadata {
  const allFunctions = [...VOICE_FUNCTIONS, ...DAW_FUNCTIONS];
  const functionsJson = JSON.stringify(allFunctions);

  return {
    version: FUNCTION_DEFINITIONS_VERSION,
    hash: generateFunctionDefinitionsHash(allFunctions),
    voiceFunctionCount: VOICE_FUNCTIONS.length,
    dawFunctionCount: DAW_FUNCTIONS.length,
    totalFunctionCount: allFunctions.length,
    uncompressedSize: Buffer.byteLength(functionsJson, 'utf8'),
    timestamp: Date.now(),
  };
}

export function getVoiceFunctions() {
  return VOICE_FUNCTIONS;
}

export function getDAWFunctions() {
  return DAW_FUNCTIONS;
}

export function getAllFunctions() {
  return {
    voice: VOICE_FUNCTIONS,
    daw: DAW_FUNCTIONS,
    metadata: getFunctionDefinitionMetadata(),
  };
}
