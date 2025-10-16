/**
 * Generation Service
 * High-level service for music generation orchestration
 * Manages job creation, validation, and result retrieval
 */

import {
  generationQueue,
  BeatGenerationData,
  StemGenerationData,
  MixTracksData,
  MasterTrackData,
  getQueueStatus,
} from '../queues/generation-queue';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Genre definitions with templates
export const GENRE_TEMPLATES = {
  trap: {
    bpmRange: [140, 160],
    defaultBpm: 150,
    characteristics: 'hi-hat rolls, 808 bass, snare rolls',
    moodOptions: ['dark', 'hype', 'aggressive', 'menacing'],
  },
  'lo-fi': {
    bpmRange: [70, 90],
    defaultBpm: 85,
    characteristics: 'vinyl crackle, jazz chords, soft drums',
    moodOptions: ['chill', 'nostalgic', 'relaxed', 'dreamy'],
  },
  'boom bap': {
    bpmRange: [80, 100],
    defaultBpm: 90,
    characteristics: 'hard drums, vinyl samples, punchy kicks',
    moodOptions: ['classic', 'gritty', 'raw', 'golden era'],
  },
  house: {
    bpmRange: [120, 130],
    defaultBpm: 125,
    characteristics: 'four-on-floor kick, hi-hats, bassline',
    moodOptions: ['energetic', 'uplifting', 'groovy', 'deep'],
  },
  drill: {
    bpmRange: [135, 145],
    defaultBpm: 140,
    characteristics: 'sliding 808s, dark melodies, hard drums',
    moodOptions: ['dark', 'menacing', 'aggressive', 'cold'],
  },
  'drum and bass': {
    bpmRange: [160, 180],
    defaultBpm: 170,
    characteristics: 'fast breaks, sub bass, complex rhythms',
    moodOptions: ['energetic', 'intense', 'liquid', 'neurofunk'],
  },
  techno: {
    bpmRange: [125, 135],
    defaultBpm: 130,
    characteristics: 'driving kicks, hypnotic loops, industrial',
    moodOptions: ['dark', 'hypnotic', 'industrial', 'minimal'],
  },
  'hip hop': {
    bpmRange: [85, 95],
    defaultBpm: 90,
    characteristics: 'boom bap drums, sample-based, groovy',
    moodOptions: ['classic', 'modern', 'jazzy', 'soulful'],
  },
  'r&b': {
    bpmRange: [75, 95],
    defaultBpm: 85,
    characteristics: 'smooth drums, melodic bass, lush chords',
    moodOptions: ['smooth', 'sensual', 'modern', 'classic'],
  },
  pop: {
    bpmRange: [100, 130],
    defaultBpm: 120,
    characteristics: 'catchy drums, melodic hooks, bright sounds',
    moodOptions: ['upbeat', 'catchy', 'bright', 'energetic'],
  },
  edm: {
    bpmRange: [125, 130],
    defaultBpm: 128,
    characteristics: 'big drops, synth leads, build-ups',
    moodOptions: ['energetic', 'festival', 'euphoric', 'aggressive'],
  },
  dubstep: {
    bpmRange: [135, 145],
    defaultBpm: 140,
    characteristics: 'wobble bass, heavy drops, half-time drums',
    moodOptions: ['aggressive', 'heavy', 'melodic', 'dark'],
  },
  jazz: {
    bpmRange: [100, 140],
    defaultBpm: 120,
    characteristics: 'swing drums, walking bass, complex chords',
    moodOptions: ['smooth', 'upbeat', 'bebop', 'fusion'],
  },
  rock: {
    bpmRange: [110, 140],
    defaultBpm: 120,
    characteristics: 'live drums, distorted guitars, driving bass',
    moodOptions: ['energetic', 'heavy', 'indie', 'classic'],
  },
};

export type SupportedGenre = keyof typeof GENRE_TEMPLATES;

// Validation helpers
export function validateGenre(genre: string): SupportedGenre {
  const normalized = genre.toLowerCase().replace(/[_-]/g, ' ');
  if (!(normalized in GENRE_TEMPLATES)) {
    throw new Error(
      `Unsupported genre: ${genre}. Supported genres: ${Object.keys(GENRE_TEMPLATES).join(', ')}`
    );
  }
  return normalized as SupportedGenre;
}

export function validateBpm(bpm: number, genre?: SupportedGenre): number {
  if (bpm < 60 || bpm > 200) {
    throw new Error('BPM must be between 60 and 200');
  }

  // Warn if BPM is outside typical range for genre
  if (genre) {
    const template = GENRE_TEMPLATES[genre];
    const [min, max] = template.bpmRange;
    if (bpm < min || bpm > max) {
      logger.warn(`BPM ${bpm} is outside typical range for ${genre} (${min}-${max})`);
    }
  }

  return bpm;
}

export function validateKey(key: string): string {
  // Valid keys: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (with optional m, maj, min, major, minor)
  const keyRegex = /^[A-G][#b]?(m|maj|min|major|minor)?$/i;
  if (!keyRegex.test(key)) {
    throw new Error(
      'Invalid key. Format: C, C#, Dm, F#m, Gmaj, etc. Valid notes: C, C#, D, D#, E, F, F#, G, G#, A, A#, B'
    );
  }
  return key;
}

export function validateDuration(duration: number): number {
  if (duration < 15 || duration > 300) {
    throw new Error('Duration must be between 15 and 300 seconds');
  }
  return duration;
}

// Generation service class
export class GenerationService {
  /**
   * Generate a beat based on user parameters
   */
  async generateBeat(params: {
    userId: string;
    projectId?: string;
    genre: string;
    bpm?: number;
    key?: string;
    mood?: string;
    duration?: number;
  }): Promise<{ jobId: string; generationId: string }> {
    try {
      // Validate and apply defaults
      const validatedGenre = validateGenre(params.genre);
      const template = GENRE_TEMPLATES[validatedGenre];

      const beatData: BeatGenerationData = {
        userId: params.userId,
        projectId: params.projectId,
        genre: validatedGenre,
        bpm: validateBpm(params.bpm || template.defaultBpm, validatedGenre),
        key: validateKey(params.key || 'Cm'),
        mood: params.mood || template.moodOptions[0],
        duration: validateDuration(params.duration || 30),
        generationId: uuidv4(),
      };

      // Add job to queue
      const job = await generationQueue.add('generate-beat', beatData);

      logger.info('Beat generation job queued', {
        jobId: job.id,
        generationId: beatData.generationId,
        genre: beatData.genre,
        bpm: beatData.bpm,
        key: beatData.key,
      });

      return {
        jobId: job.id!,
        generationId: beatData.generationId,
      };
    } catch (error: any) {
      logger.error('Failed to queue beat generation', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Generate stems from an audio file
   */
  async generateStems(params: {
    userId: string;
    projectId?: string;
    audioFileId: string;
    stemTypes: ('drums' | 'bass' | 'melody' | 'vocals')[];
  }): Promise<{ jobId: string; generationId: string }> {
    try {
      if (!params.stemTypes || params.stemTypes.length === 0) {
        throw new Error('At least one stem type must be specified');
      }

      const stemData: StemGenerationData = {
        userId: params.userId,
        projectId: params.projectId,
        audioFileId: params.audioFileId,
        stemTypes: params.stemTypes,
        generationId: uuidv4(),
      };

      const job = await generationQueue.add('generate-stems', stemData);

      logger.info('Stem generation job queued', {
        jobId: job.id,
        generationId: stemData.generationId,
        stemTypes: stemData.stemTypes,
      });

      return {
        jobId: job.id!,
        generationId: stemData.generationId,
      };
    } catch (error: any) {
      logger.error('Failed to queue stem generation', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Auto-mix multiple tracks
   */
  async mixTracks(params: {
    userId: string;
    projectId?: string;
    trackIds: string[];
    mixProfile?: 'balanced' | 'bass-heavy' | 'bright' | 'warm';
  }): Promise<{ jobId: string; generationId: string }> {
    try {
      if (!params.trackIds || params.trackIds.length === 0) {
        throw new Error('At least one track must be specified');
      }

      const mixData: MixTracksData = {
        userId: params.userId,
        projectId: params.projectId,
        trackIds: params.trackIds,
        mixProfile: params.mixProfile || 'balanced',
        generationId: uuidv4(),
      };

      const job = await generationQueue.add('mix-tracks', mixData);

      logger.info('Mix job queued', {
        jobId: job.id,
        generationId: mixData.generationId,
        trackCount: mixData.trackIds.length,
        mixProfile: mixData.mixProfile,
      });

      return {
        jobId: job.id!,
        generationId: mixData.generationId,
      };
    } catch (error: any) {
      logger.error('Failed to queue mixing job', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Auto-master a track
   */
  async masterTrack(params: {
    userId: string;
    projectId?: string;
    trackId: string;
    targetLoudness?: number;
    quality?: 'streaming' | 'cd' | 'club';
  }): Promise<{ jobId: string; generationId: string }> {
    try {
      // Default target loudness: -14 LUFS for streaming
      const targetLoudness = params.targetLoudness ?? -14;

      if (targetLoudness < -24 || targetLoudness > -6) {
        throw new Error('Target loudness must be between -24 and -6 LUFS');
      }

      const masterData: MasterTrackData = {
        userId: params.userId,
        projectId: params.projectId,
        trackId: params.trackId,
        targetLoudness,
        quality: params.quality || 'streaming',
        generationId: uuidv4(),
      };

      const job = await generationQueue.add('master-track', masterData);

      logger.info('Mastering job queued', {
        jobId: job.id,
        generationId: masterData.generationId,
        targetLoudness: masterData.targetLoudness,
        quality: masterData.quality,
      });

      return {
        jobId: job.id!,
        generationId: masterData.generationId,
      };
    } catch (error: any) {
      logger.error('Failed to queue mastering job', {
        error: error.message,
        params,
      });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    try {
      const job = await generationQueue.getJob(jobId);

      if (!job) {
        throw new Error('Job not found');
      }

      const state = await job.getState();
      const progress = job.progress as number;

      return {
        jobId: job.id,
        generationId: (job.data as any).generationId,
        state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
      };
    } catch (error: any) {
      logger.error('Failed to get job status', {
        error: error.message,
        jobId,
      });
      throw error;
    }
  }

  /**
   * Get job result
   */
  async getJobResult(jobId: string) {
    try {
      const job = await generationQueue.getJob(jobId);

      if (!job) {
        throw new Error('Job not found');
      }

      const state = await job.getState();

      if (state !== 'completed') {
        throw new Error(`Job is not completed. Current state: ${state}`);
      }

      return {
        jobId: job.id,
        generationId: (job.data as any).generationId,
        result: job.returnvalue,
        completedAt: job.finishedOn,
      };
    } catch (error: any) {
      logger.error('Failed to get job result', {
        error: error.message,
        jobId,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await getQueueStatus();
  }

  /**
   * Get supported genres
   */
  getSupportedGenres() {
    return Object.entries(GENRE_TEMPLATES).map(([name, template]) => ({
      name,
      bpmRange: template.bpmRange,
      defaultBpm: template.defaultBpm,
      characteristics: template.characteristics,
      moodOptions: template.moodOptions,
    }));
  }
}

// Export singleton instance
export const generationService = new GenerationService();
