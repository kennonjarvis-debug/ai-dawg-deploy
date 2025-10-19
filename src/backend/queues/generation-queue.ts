/**
 * Generation Queue - BullMQ Job Queue for Music Generation
 * Handles beat generation, stem creation, mixing, and mastering jobs
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { emitToUser } from '../../api/websocket/server';
import { dawIntegrationService } from '../services/daw-integration-service';
import { generateBeat as generateBeatUdio } from '../services/udio-service';
import { generateBeat as generateBeatMusicGen } from '../services/musicgen-service';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

// Job types
export type GenerationJobType = 'generate-beat' | 'generate-stems' | 'mix-tracks' | 'master-track';

// Job data interfaces
export interface BeatGenerationData {
  userId: string;
  projectId?: string;
  genre: string;
  bpm: number;
  key: string;
  mood?: string;
  duration: number; // in seconds
  generationId: string;
}

export interface StemGenerationData {
  userId: string;
  projectId?: string;
  audioFileId: string;
  stemTypes: ('drums' | 'bass' | 'melody' | 'vocals')[];
  generationId: string;
}

export interface MixTracksData {
  userId: string;
  projectId?: string;
  trackIds: string[];
  mixProfile: 'balanced' | 'bass-heavy' | 'bright' | 'warm';
  generationId: string;
}

export interface MasterTrackData {
  userId: string;
  projectId?: string;
  trackId: string;
  targetLoudness: number; // LUFS
  quality: 'streaming' | 'cd' | 'club';
  generationId: string;
}

export type GenerationJobData =
  | BeatGenerationData
  | StemGenerationData
  | MixTracksData
  | MasterTrackData;

// Create the generation queue
export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Worker for processing jobs
const generationWorker = new Worker<GenerationJobData>(
  'generation',
  async (job: Job<GenerationJobData>) => {
    const { userId, generationId } = job.data;

    logger.info(`Processing generation job`, {
      jobId: job.id,
      jobType: job.name,
      userId,
      generationId,
    });

    try {
      // Emit job started event
      emitToUser(userId, 'generation:started', {
        jobId: job.id,
        generationId,
        type: job.name,
        timestamp: new Date(),
      });

      let result;

      switch (job.name) {
        case 'generate-beat':
          result = await processBeatGeneration(job);
          break;
        case 'generate-stems':
          result = await processStemGeneration(job);
          break;
        case 'mix-tracks':
          result = await processMixing(job);
          break;
        case 'master-track':
          result = await processMastering(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      // Emit completion event
      emitToUser(userId, 'generation:completed', {
        jobId: job.id,
        generationId,
        result,
        timestamp: new Date(),
      });

      // For beat generation, automatically load into DAW
      if (job.name === 'generate-beat' && result.audioUrl) {
        await dawIntegrationService.loadAudioIntoDAW(userId, generationId, {
          audioUrl: result.audioUrl,
          duration: result.duration,
          bpm: result.bpm,
          key: result.key,
          genre: result.genre,
          format: result.metadata.format,
          sampleRate: result.metadata.sampleRate,
          channels: result.metadata.channels,
        }, {
          trackName: `${result.genre} - ${result.bpm} BPM`,
          autoPlay: false, // Don't auto-play, let user decide
        });

        // Sync transport BPM with generated beat
        await dawIntegrationService.syncTransportControls(userId, {
          audioUrl: result.audioUrl,
          duration: result.duration,
          bpm: result.bpm,
          key: result.key,
          genre: result.genre,
          format: result.metadata.format,
          sampleRate: result.metadata.sampleRate,
          channels: result.metadata.channels,
        });
      }

      return result;
    } catch (error: any) {
      logger.error(`Generation job failed`, {
        jobId: job.id,
        error: error.message,
        stack: error.stack,
      });

      // Emit error event
      emitToUser(userId, 'generation:failed', {
        jobId: job.id,
        generationId,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    autorun: true,
  }
);

// Progress tracking helper
function updateProgress(job: Job, percent: number, stage: string) {
  job.updateProgress(percent);
  const userId = job.data.userId;

  emitToUser(userId, 'generation:progress', {
    jobId: job.id,
    generationId: job.data.generationId,
    percent,
    stage,
    timestamp: new Date(),
  });
}

// Beat generation processor
async function processBeatGeneration(job: Job<BeatGenerationData>): Promise<any> {
  const { genre, bpm, key, mood, duration } = job.data;

  updateProgress(job, 0, 'Initializing beat generation...');

  // Validate parameters
  if (bpm < 60 || bpm > 200) {
    throw new Error('BPM must be between 60 and 200');
  }

  if (duration < 15 || duration > 300) {
    throw new Error('Duration must be between 15 and 300 seconds');
  }

  // Stage 1: Preparing music generation request
  updateProgress(job, 10, 'Preparing AI music generation...');

  // Select provider (Udio for professional quality, MusicGen as fallback)
  const provider = process.env.MUSIC_GENERATION_PROVIDER || 'udio';

  logger.info(`Generating beat with ${provider.toUpperCase()}`, {
    genre,
    bpm,
    key,
    mood,
    duration,
    generationId: job.data.generationId,
    provider,
  });

  // Stage 2: Calling music generation API (this takes 30-90 seconds)
  updateProgress(job, 20, `Calling ${provider.toUpperCase()} API...`);

  let musicResult;

  if (provider === 'udio') {
    musicResult = await generateBeatUdio({
      genre,
      tempo: bpm,
      duration,
    });
  } else {
    // Fallback to MusicGen
    musicResult = await generateBeatMusicGen({
      genre,
      tempo: bpm,
      duration,
    });
  }

  if (!musicResult.success || !musicResult.audio_url) {
    throw new Error(musicResult.error || 'Failed to generate beat');
  }

  updateProgress(job, 90, 'Beat generated successfully!');

  // Stage 3: Finalizing
  updateProgress(job, 95, 'Finalizing...');

  const result = {
    audioUrl: musicResult.audio_url,
    duration,
    genre,
    bpm,
    key,
    mood,
    stems: musicResult.stems || {}, // Udio provides stems for drums, bass, vocals, melody
    metadata: {
      format: 'mp3',
      bitrate: 320,
      sampleRate: 44100,
      channels: 2,
      provider: provider,
    },
  };

  updateProgress(job, 100, 'Complete!');

  logger.info('Beat generation complete', {
    generationId: job.data.generationId,
    audioUrl: result.audioUrl,
  });

  return result;
}

// Stem generation processor
async function processStemGeneration(job: Job<StemGenerationData>): Promise<any> {
  const { audioFileId, stemTypes } = job.data;

  updateProgress(job, 0, 'Loading audio file...');

  const stems: any[] = [];
  const progressPerStem = 100 / stemTypes.length;

  for (let i = 0; i < stemTypes.length; i++) {
    const stemType = stemTypes[i];
    const progress = Math.round((i + 1) * progressPerStem);

    updateProgress(job, progress, `Extracting ${stemType} stem...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

    stems.push({
      type: stemType,
      audioUrl: `https://storage.example.com/stems/${job.data.generationId}_${stemType}.wav`,
    });
  }

  updateProgress(job, 100, 'All stems generated!');

  return { stems };
}

// Mixing processor
async function processMixing(job: Job<MixTracksData>): Promise<any> {
  const { trackIds, mixProfile } = job.data;

  updateProgress(job, 0, 'Loading tracks...');
  await new Promise(resolve => setTimeout(resolve, 500));

  updateProgress(job, 25, 'Applying EQ...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 50, 'Applying compression...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 75, 'Adding reverb and effects...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 95, 'Finalizing mix...');
  await new Promise(resolve => setTimeout(resolve, 500));

  updateProgress(job, 100, 'Mix complete!');

  return {
    audioUrl: `https://storage.example.com/mixes/${job.data.generationId}.wav`,
    mixProfile,
    trackCount: trackIds.length,
  };
}

// Mastering processor
async function processMastering(job: Job<MasterTrackData>): Promise<any> {
  const { trackId, targetLoudness, quality } = job.data;

  updateProgress(job, 0, 'Loading track...');
  await new Promise(resolve => setTimeout(resolve, 500));

  updateProgress(job, 25, 'Multiband compression...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 50, 'Stereo widening...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 75, 'Limiting and loudness normalization...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  updateProgress(job, 95, 'Final quality check...');
  await new Promise(resolve => setTimeout(resolve, 500));

  updateProgress(job, 100, 'Mastering complete!');

  return {
    audioUrl: `https://storage.example.com/masters/${job.data.generationId}.wav`,
    targetLoudness,
    quality,
    actualLoudness: targetLoudness + (Math.random() * 0.5 - 0.25), // Simulate slight variance
  };
}

// Worker event handlers
generationWorker.on('completed', (job, result) => {
  logger.info(`Job completed successfully`, {
    jobId: job.id,
    jobName: job.name,
    result,
  });
});

generationWorker.on('failed', (job, error) => {
  logger.error(`Job failed`, {
    jobId: job?.id,
    jobName: job?.name,
    error: error.message,
    attemptsMade: job?.attemptsMade,
  });
});

generationWorker.on('progress', (job, progress) => {
  logger.debug(`Job progress update`, {
    jobId: job.id,
    progress,
  });
});

// Queue event handlers
generationQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

// Graceful shutdown
export async function shutdownGenerationQueue() {
  logger.info('Shutting down generation queue...');

  await generationWorker.close();
  await generationQueue.close();
  await redisConnection.quit();

  logger.info('Generation queue shutdown complete');
}

// Export queue status helper
export async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    generationQueue.getWaitingCount(),
    generationQueue.getActiveCount(),
    generationQueue.getCompletedCount(),
    generationQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  };
}

logger.info('Generation queue initialized', {
  concurrency: 5,
  retryAttempts: 3,
});
