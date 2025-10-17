/**
 * AI Function Calling Tools
 * Tool definitions for DAW control (OpenAI and Anthropic formats)
 */

import { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

// OpenAI function definitions
export const openAITools = [
  {
    type: 'function' as const,
    function: {
      name: 'start_recording',
      description: 'Start recording on the currently armed track. This will begin recording audio from the selected microphone input.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to record on. If not provided, uses the currently active track.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'stop_recording',
      description: 'Stop the current recording session.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'start_playback',
      description: 'Start playing back all tracks from the current position.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'stop_playback',
      description: 'Stop playback and return to the beginning.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_bpm',
      description: 'Set the tempo (BPM - beats per minute) for the project.',
      parameters: {
        type: 'object',
        properties: {
          bpm: {
            type: 'number',
            description: 'The tempo in beats per minute (typically 60-200)',
          },
        },
        required: ['bpm'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'adjust_volume',
      description: 'Adjust the volume level of a track.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to adjust. If not provided, uses the currently active track.',
          },
          volume: {
            type: 'number',
            description: 'Volume level from 0 (silent) to 100 (maximum)',
          },
        },
        required: ['volume'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'adjust_pan',
      description: 'Adjust the stereo panning of a track.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to adjust. If not provided, uses the currently active track.',
          },
          pan: {
            type: 'number',
            description: 'Pan position from -50 (hard left) to +50 (hard right). 0 is center.',
          },
        },
        required: ['pan'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_mute',
      description: 'Mute or unmute a track.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to mute/unmute. If not provided, uses the currently active track.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'toggle_solo',
      description: 'Solo or unsolo a track (mutes all other tracks).',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to solo/unsolo. If not provided, uses the currently active track.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'arm_track',
      description: 'Arm a track for recording (enables the record button).',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to arm. If not provided, uses the currently active track.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_track',
      description: 'Create a new audio track in the project.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name for the new track (e.g., "Lead Vocals", "Harmony")',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rename_track',
      description: 'Rename an existing track.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to rename. If not provided, uses the currently active track.',
          },
          name: {
            type: 'string',
            description: 'New name for the track',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_track',
      description: 'Delete a track from the project.',
      parameters: {
        type: 'object',
        properties: {
          trackId: {
            type: 'string',
            description: 'The ID of the track to delete. If not provided, uses the currently active track.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_backing_track',
      description: 'Generate an AI instrumental backing track from a text description. Perfect for creating music to sing over.',
      parameters: {
        type: 'object',
        properties: {
          genre: {
            type: 'string',
            description: 'Music genre (e.g., "country", "pop", "rock", "jazz")',
          },
          mood: {
            type: 'string',
            description: 'Mood or energy (e.g., "upbeat", "melancholic", "energetic", "calm")',
          },
          instruments: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of instruments to feature (e.g., ["acoustic guitar", "piano", "drums"])',
          },
          tempo: {
            type: 'string',
            description: 'Tempo descriptor (e.g., "fast", "moderate", "slow") or specific BPM',
          },
          key: {
            type: 'string',
            description: 'Musical key (e.g., "C major", "A minor", "G")',
          },
          duration: {
            type: 'number',
            description: 'Duration in seconds (default: 30, max: 120)',
          },
          description: {
            type: 'string',
            description: 'Additional description or style notes',
          },
        },
        required: ['genre', 'mood'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_from_melody',
      description: 'Transform a recorded vocal melody into a full instrumental arrangement. The AI will analyze the melody and create a backing track that follows it.',
      parameters: {
        type: 'object',
        properties: {
          recordingId: {
            type: 'string',
            description: 'ID of the vocal recording to use as melody source',
          },
          genre: {
            type: 'string',
            description: 'Music genre for the arrangement',
          },
          mood: {
            type: 'string',
            description: 'Mood or energy for the composition',
          },
          instruments: {
            type: 'array',
            items: { type: 'string' },
            description: 'Instruments to feature in the arrangement',
          },
          complexity: {
            type: 'string',
            enum: ['simple', 'moderate', 'complex'],
            description: 'Arrangement complexity (default: moderate)',
          },
        },
        required: ['recordingId', 'genre'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_voice_profile',
      description: 'Create a voice profile from a recorded vocal sample. This allows the AI to clone the user\'s voice for generating harmonies and other vocal parts.',
      parameters: {
        type: 'object',
        properties: {
          recordingId: {
            type: 'string',
            description: 'ID of the vocal recording to use as voice sample (should be 6-30 seconds of clean audio)',
          },
          name: {
            type: 'string',
            description: 'Name for the voice profile (e.g., "My Lead Voice", "John\'s Voice")',
          },
        },
        required: ['recordingId', 'name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_harmony',
      description: 'Generate harmony vocals using a cloned voice profile. Creates additional vocal parts that harmonize with the lead vocal.',
      parameters: {
        type: 'object',
        properties: {
          leadVocalRecordingId: {
            type: 'string',
            description: 'ID of the lead vocal recording to harmonize with',
          },
          voiceProfileId: {
            type: 'string',
            description: 'ID of the voice profile to use for harmony generation',
          },
          intervals: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['third_above', 'third_below', 'fifth_above', 'fifth_below', 'octave_above', 'octave_below'],
            },
            description: 'Musical intervals for harmonies (e.g., ["third_above", "fifth_above"])',
          },
        },
        required: ['leadVocalRecordingId', 'voiceProfileId', 'intervals'],
      },
    },
  },
];

// Anthropic Claude tool definitions (original format)
export const dawTools: Tool[] = [
  {
    name: 'start_recording',
    description: 'Start recording on the currently armed track. This will begin recording audio from the selected microphone input.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to record on. If not provided, uses the currently active track.',
        },
      },
    },
  },
  {
    name: 'stop_recording',
    description: 'Stop the current recording session.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'start_playback',
    description: 'Start playing back all tracks from the current position.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'stop_playback',
    description: 'Stop playback and return to the beginning.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_bpm',
    description: 'Set the tempo (BPM - beats per minute) for the project.',
    input_schema: {
      type: 'object',
      properties: {
        bpm: {
          type: 'number',
          description: 'The tempo in beats per minute (typically 60-200)',
        },
      },
      required: ['bpm'],
    },
  },
  {
    name: 'adjust_volume',
    description: 'Adjust the volume level of a track.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to adjust. If not provided, uses the currently active track.',
        },
        volume: {
          type: 'number',
          description: 'Volume level from 0 (silent) to 100 (maximum)',
        },
      },
      required: ['volume'],
    },
  },
  {
    name: 'adjust_pan',
    description: 'Adjust the stereo panning of a track.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to adjust. If not provided, uses the currently active track.',
        },
        pan: {
          type: 'number',
          description: 'Pan position from -50 (hard left) to +50 (hard right). 0 is center.',
        },
      },
      required: ['pan'],
    },
  },
  {
    name: 'toggle_mute',
    description: 'Mute or unmute a track.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to mute/unmute. If not provided, uses the currently active track.',
        },
      },
    },
  },
  {
    name: 'toggle_solo',
    description: 'Solo or unsolo a track (mutes all other tracks).',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to solo/unsolo. If not provided, uses the currently active track.',
        },
      },
    },
  },
  {
    name: 'arm_track',
    description: 'Arm a track for recording (enables the record button).',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to arm. If not provided, uses the currently active track.',
        },
      },
    },
  },
  {
    name: 'create_track',
    description: 'Create a new audio track in the project.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new track (e.g., "Lead Vocals", "Harmony")',
        },
      },
    },
  },
  {
    name: 'rename_track',
    description: 'Rename an existing track.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to rename. If not provided, uses the currently active track.',
        },
        name: {
          type: 'string',
          description: 'New name for the track',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_track',
    description: 'Delete a track from the project.',
    input_schema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'string',
          description: 'The ID of the track to delete. If not provided, uses the currently active track.',
        },
      },
    },
  },
  {
    name: 'generate_backing_track',
    description: 'Generate an AI instrumental backing track from a text description. Perfect for creating music to sing over.',
    input_schema: {
      type: 'object',
      properties: {
        genre: {
          type: 'string',
          description: 'Music genre (e.g., "country", "pop", "rock", "jazz")',
        },
        mood: {
          type: 'string',
          description: 'Mood or energy (e.g., "upbeat", "melancholic", "energetic", "calm")',
        },
        instruments: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of instruments to feature (e.g., ["acoustic guitar", "piano", "drums"])',
        },
        tempo: {
          type: 'string',
          description: 'Tempo descriptor (e.g., "fast", "moderate", "slow") or specific BPM',
        },
        key: {
          type: 'string',
          description: 'Musical key (e.g., "C major", "A minor", "G")',
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds (default: 30, max: 120)',
        },
        description: {
          type: 'string',
          description: 'Additional description or style notes',
        },
      },
      required: ['genre', 'mood'],
    },
  },
  {
    name: 'generate_from_melody',
    description: 'Transform a recorded vocal melody into a full instrumental arrangement. The AI will analyze the melody and create a backing track that follows it.',
    input_schema: {
      type: 'object',
      properties: {
        recordingId: {
          type: 'string',
          description: 'ID of the vocal recording to use as melody source',
        },
        genre: {
          type: 'string',
          description: 'Music genre for the arrangement',
        },
        mood: {
          type: 'string',
          description: 'Mood or energy for the composition',
        },
        instruments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Instruments to feature in the arrangement',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'moderate', 'complex'],
          description: 'Arrangement complexity (default: moderate)',
        },
      },
      required: ['recordingId', 'genre'],
    },
  },
  {
    name: 'create_voice_profile',
    description: 'Create a voice profile from a recorded vocal sample. This allows the AI to clone the user\'s voice for generating harmonies and other vocal parts.',
    input_schema: {
      type: 'object',
      properties: {
        recordingId: {
          type: 'string',
          description: 'ID of the vocal recording to use as voice sample (should be 6-30 seconds of clean audio)',
        },
        name: {
          type: 'string',
          description: 'Name for the voice profile (e.g., "My Lead Voice", "John\'s Voice")',
        },
      },
      required: ['recordingId', 'name'],
    },
  },
  {
    name: 'generate_harmony',
    description: 'Generate harmony vocals using a cloned voice profile. Creates additional vocal parts that harmonize with the lead vocal.',
    input_schema: {
      type: 'object',
      properties: {
        leadVocalRecordingId: {
          type: 'string',
          description: 'ID of the lead vocal recording to harmonize with',
        },
        voiceProfileId: {
          type: 'string',
          description: 'ID of the voice profile to use for harmony generation',
        },
        intervals: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['third_above', 'third_below', 'fifth_above', 'fifth_below', 'octave_above', 'octave_below'],
          },
          description: 'Musical intervals for harmonies (e.g., ["third_above", "fifth_above"])',
        },
      },
      required: ['leadVocalRecordingId', 'voiceProfileId', 'intervals'],
    },
  },
];

/**
 * Type definitions for tool input schemas
 */
export interface StartRecordingInput {
  trackId?: string;
}

export interface StopRecordingInput {}

export interface StartPlaybackInput {}

export interface StopPlaybackInput {}

export interface SetBPMInput {
  bpm: number;
}

export interface AdjustVolumeInput {
  trackId?: string;
  volume: number;
}

export interface AdjustPanInput {
  trackId?: string;
  pan: number;
}

export interface ToggleMuteInput {
  trackId?: string;
}

export interface ToggleSoloInput {
  trackId?: string;
}

export interface ArmTrackInput {
  trackId?: string;
}

export interface CreateTrackInput {
  name?: string;
}

export interface RenameTrackInput {
  trackId?: string;
  name: string;
}

export interface DeleteTrackInput {
  trackId?: string;
}

export interface GenerateBackingTrackInput {
  genre: string;
  mood: string;
  instruments?: string[];
  tempo?: string;
  key?: string;
  duration?: number;
  description?: string;
}

export interface GenerateFromMelodyInput {
  recordingId: string;
  genre: string;
  mood?: string;
  instruments?: string[];
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface CreateVoiceProfileInput {
  recordingId: string;
  name: string;
}

export interface GenerateHarmonyInput {
  leadVocalRecordingId: string;
  voiceProfileId: string;
  intervals: ('third_above' | 'third_below' | 'fifth_above' | 'fifth_below' | 'octave_above' | 'octave_below')[];
}

export type ToolInput =
  | StartRecordingInput
  | StopRecordingInput
  | StartPlaybackInput
  | StopPlaybackInput
  | SetBPMInput
  | AdjustVolumeInput
  | AdjustPanInput
  | ToggleMuteInput
  | ToggleSoloInput
  | ArmTrackInput
  | CreateTrackInput
  | RenameTrackInput
  | DeleteTrackInput
  | GenerateBackingTrackInput
  | GenerateFromMelodyInput
  | CreateVoiceProfileInput
  | GenerateHarmonyInput;
