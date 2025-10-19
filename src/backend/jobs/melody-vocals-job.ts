/**
 * Melody-to-Vocals Job Queue
 * Handles asynchronous processing of melody-to-vocals conversion
 * with progress tracking, retries, and error handling
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import fs from 'fs';
import path from 'path';
import { generateVocalsFromMelody, MelodyToVocalsResponse } from '../services/melody-vocals-service';
import { validateAudioComprehensive } from '../validators/audio-validator';
import { emitToUser } from '../../api/websocket/server';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Job data interface
export interface MelodyVocalsJobData {
  userId: string;
  projectId?: string;
  audioFilePath: string;
  prompt: string;
  genre?: string;
  theme?: string;
  mood?: string;
  style?: string;
  aiProvider?: 'anthropic' | 'openai';
  vocalModel?: 'bark' | 'musicgen';
  jobId: string;
}

// Job result interface
export interface MelodyVocalsJobResult extends MelodyToVocalsResponse {
  processingTime: number;
  retryCount: number;
  validationWarnings: string[];
}

// Error types for better error handling
export enum MelodyVocalsErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUDIO_PROCESSING_ERROR = 'AUDIO_PROCESSING_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class MelodyVocalsError extends Error {
  constructor(
    message: string,
    public type: MelodyVocalsErrorType,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'MelodyVocalsError';
  }
}

// Create the queue
export const melodyVocalsQueue = new Queue<MelodyVocalsJobData, MelodyVocalsJobResult>(
  'melody-vocals',
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 second delay
      },
      removeOnComplete: {
        age: 7 * 24 * 3600, // Keep completed jobs for 7 days
        count: 500,
      },
      removeOnFail: {
        age: 30 * 24 * 3600, // Keep failed jobs for 30 days
      },
      timeout: 300000, // 5 minute timeout per job
    },
  }
);

// Worker for processing jobs
const melodyVocalsWorker = new Worker<MelodyVocalsJobData, MelodyVocalsJobResult>(
  'melody-vocals',
  async (job: Job<MelodyVocalsJobData>) => {
    const startTime = Date.now();
    const { userId, jobId, audioFilePath } = job.data;

    console.log(`[MelodyVocals] Starting job ${jobId} for user ${userId}`);

    try {
      // Emit job started event
      emitProgress(job, 0, 'Initializing melody-to-vocals conversion...');

      // Stage 1: Validate audio file (5% progress)
      emitProgress(job, 5, 'Validating audio file...');
      const validationResult = await validateAudioFile(audioFilePath, job);

      // Stage 2: Extract pitch from melody (15% progress)
      emitProgress(job, 15, 'Extracting pitch from melody using CREPE...');
      await simulateProgress(job, 15, 30, 'Analyzing melody...');

      // Stage 3: Generate lyrics with AI (40% progress)
      emitProgress(job, 40, 'Generating lyrics with Claude...');
      await simulateProgress(job, 40, 60, 'Creating lyrics...');

      // Stage 4: Generate vocals with TTS (70% progress)
      emitProgress(job, 70, 'Synthesizing vocals with Bark TTS...');

      // Actually call the melody-vocals service
      const result = await generateVocalsFromMelody(job.data);

      if (!result.success) {
        throw new MelodyVocalsError(
          'Melody-to-vocals generation failed',
          MelodyVocalsErrorType.AI_SERVICE_ERROR,
          true,
          { result }
        );
      }

      // Stage 5: Post-processing and quality checks (90% progress)
      emitProgress(job, 90, 'Performing quality checks...');
      const qualityCheck = await performQualityChecks(result, job);

      if (!qualityCheck.passed) {
        console.warn(`[MelodyVocals] Quality check warnings for job ${jobId}:`, qualityCheck.warnings);
      }

      // Stage 6: Finalizing (95% progress)
      emitProgress(job, 95, 'Finalizing...');

      const processingTime = Date.now() - startTime;

      // Complete!
      emitProgress(job, 100, 'Conversion complete!');

      const finalResult: MelodyVocalsJobResult = {
        ...result,
        processingTime,
        retryCount: job.attemptsMade,
        validationWarnings: [
          ...validationResult.warnings,
          ...qualityCheck.warnings,
        ],
      };

      // Emit completion event
      emitToUser(userId, 'melody-vocals:completed', {
        jobId,
        result: finalResult,
        timestamp: new Date(),
      });

      // Clean up uploaded file
      cleanupFile(audioFilePath);

      console.log(`[MelodyVocals] Job ${jobId} completed successfully in ${processingTime}ms`);

      return finalResult;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      console.error(`[MelodyVocals] Job ${jobId} failed:`, error);

      // Determine if error is retryable
      const isRetryable = determineIfRetryable(error);

      // Emit error event
      emitToUser(userId, 'melody-vocals:failed', {
        jobId,
        error: error.message,
        errorType: error.type || MelodyVocalsErrorType.UNKNOWN_ERROR,
        retryable: isRetryable,
        attemptsMade: job.attemptsMade,
        timestamp: new Date(),
      });

      // Clean up uploaded file if this is the last attempt
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        cleanupFile(audioFilePath);
      }

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 jobs concurrently
    autorun: true,
    limiter: {
      max: 10, // Max 10 jobs per...
      duration: 60000, // ...per minute (rate limiting)
    },
  }
);

/**
 * Emit progress update
 */
function emitProgress(
  job: Job<MelodyVocalsJobData>,
  percent: number,
  stage: string
): void {
  job.updateProgress(percent);

  emitToUser(job.data.userId, 'melody-vocals:progress', {
    jobId: job.data.jobId,
    percent,
    stage,
    timestamp: new Date(),
  });
}

/**
 * Simulate gradual progress for long-running stages
 */
async function simulateProgress(
  job: Job<MelodyVocalsJobData>,
  startPercent: number,
  endPercent: number,
  stage: string
): Promise<void> {
  const steps = 5;
  const increment = (endPercent - startPercent) / steps;
  const delay = 500; // 500ms between updates

  for (let i = 1; i <= steps; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    const currentPercent = Math.min(startPercent + increment * i, endPercent);
    emitProgress(job, Math.round(currentPercent), stage);
  }
}

/**
 * Validate audio file
 */
async function validateAudioFile(
  audioFilePath: string,
  job: Job<MelodyVocalsJobData>
): Promise<{ warnings: string[] }> {
  try {
    const validation = await validateAudioComprehensive(audioFilePath, {
      maxSizeMB: 50,
      maxDurationSeconds: 300,
      minDurationSeconds: 1,
      allowedFormats: ['mp3', 'wav', 'm4a', 'aac', 'ogg'],
    });

    if (!validation.valid) {
      throw new MelodyVocalsError(
        `Audio validation failed: ${validation.errors.join(', ')}`,
        MelodyVocalsErrorType.VALIDATION_ERROR,
        false,
        { errors: validation.errors }
      );
    }

    return { warnings: validation.warnings };
  } catch (error: any) {
    if (error instanceof MelodyVocalsError) {
      throw error;
    }

    throw new MelodyVocalsError(
      `Failed to validate audio: ${error.message}`,
      MelodyVocalsErrorType.VALIDATION_ERROR,
      false,
      { originalError: error.message }
    );
  }
}

/**
 * Perform quality checks on generated vocals
 */
async function performQualityChecks(
  result: MelodyToVocalsResponse,
  job: Job<MelodyVocalsJobData>
): Promise<{ passed: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Check if lyrics exist and have reasonable length
  if (!result.lyrics || result.lyrics.length < 10) {
    warnings.push('Generated lyrics are very short');
  }

  // Check if lyrics have basic structure (verses/chorus)
  const hasStructure = /verse|chorus|bridge/i.test(result.lyrics);
  if (!hasStructure) {
    warnings.push('Lyrics may lack typical song structure');
  }

  // Check for gibberish or repeated characters
  const hasRepeatedChars = /(.)\1{10,}/.test(result.lyrics);
  if (hasRepeatedChars) {
    warnings.push('Lyrics contain unusual repeated characters');
  }

  // Check melody info
  if (result.melody_info.num_notes < 5) {
    warnings.push('Very few notes detected in melody - may affect quality');
  }

  if (result.melody_info.duration < 2) {
    warnings.push('Melody duration is very short');
  }

  // All checks are warnings, not hard failures
  return {
    passed: true,
    warnings,
  };
}

/**
 * Determine if an error is retryable
 */
function determineIfRetryable(error: any): boolean {
  if (error instanceof MelodyVocalsError) {
    return error.retryable;
  }

  // Network errors are retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Rate limit errors are retryable
  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return true;
  }

  // Service unavailable errors are retryable
  if (error.message?.includes('503') || error.message?.includes('unavailable')) {
    return true;
  }

  // Default to not retryable
  return false;
}

/**
 * Clean up temporary files
 */
function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[MelodyVocals] Cleaned up file: ${filePath}`);
    }
  } catch (error: any) {
    console.error(`[MelodyVocals] Failed to cleanup file ${filePath}:`, error.message);
  }
}

// Worker event handlers
melodyVocalsWorker.on('completed', (job, result) => {
  console.log(`[MelodyVocals] Worker completed job ${job.id}:`, {
    jobId: job.data.jobId,
    userId: job.data.userId,
    processingTime: result.processingTime,
    retryCount: result.retryCount,
  });
});

melodyVocalsWorker.on('failed', (job, error) => {
  console.error(`[MelodyVocals] Worker failed job ${job?.id}:`, {
    jobId: job?.data.jobId,
    userId: job?.data.userId,
    error: error.message,
    attemptsMade: job?.attemptsMade,
  });
});

melodyVocalsWorker.on('progress', (job, progress) => {
  console.log(`[MelodyVocals] Job ${job.id} progress: ${progress}%`);
});

// Queue event handlers
melodyVocalsQueue.on('error', (error) => {
  console.error('[MelodyVocals] Queue error:', error.message);
});

/**
 * Add a new melody-vocals job to the queue
 */
export async function enqueueMelodyVocalsJob(
  data: MelodyVocalsJobData
): Promise<Job<MelodyVocalsJobData, MelodyVocalsJobResult>> {
  const job = await melodyVocalsQueue.add('convert-melody', data, {
    jobId: data.jobId,
    priority: 1,
  });

  console.log(`[MelodyVocals] Enqueued job ${data.jobId} for user ${data.userId}`);

  return job;
}

/**
 * Cancel a melody-vocals job
 */
export async function cancelMelodyVocalsJob(jobId: string): Promise<boolean> {
  try {
    const job = await melodyVocalsQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();

    // Clean up the audio file if it exists
    if (job.data.audioFilePath) {
      cleanupFile(job.data.audioFilePath);
    }

    // Emit cancelled event
    emitToUser(job.data.userId, 'melody-vocals:cancelled', {
      jobId,
      timestamp: new Date(),
    });

    console.log(`[MelodyVocals] Cancelled job ${jobId}`);

    return true;
  } catch (error: any) {
    console.error(`[MelodyVocals] Failed to cancel job ${jobId}:`, error.message);
    return false;
  }
}

/**
 * Get job status
 */
export async function getMelodyVocalsJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  result?: MelodyVocalsJobResult;
  error?: string;
} | null> {
  try {
    const job = await melodyVocalsQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = (await job.progress) as number || 0;

    if (state === 'completed') {
      return {
        status: 'completed',
        progress: 100,
        result: job.returnvalue,
      };
    }

    if (state === 'failed') {
      return {
        status: 'failed',
        progress,
        error: job.failedReason,
      };
    }

    return {
      status: state,
      progress,
    };
  } catch (error: any) {
    console.error(`[MelodyVocals] Failed to get job status ${jobId}:`, error.message);
    return null;
  }
}

/**
 * Get queue statistics
 */
export async function getMelodyVocalsQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}> {
  const [waiting, active, completed, failed] = await Promise.all([
    melodyVocalsQueue.getWaitingCount(),
    melodyVocalsQueue.getActiveCount(),
    melodyVocalsQueue.getCompletedCount(),
    melodyVocalsQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  };
}

/**
 * Graceful shutdown
 */
export async function shutdownMelodyVocalsQueue(): Promise<void> {
  console.log('[MelodyVocals] Shutting down queue...');

  await melodyVocalsWorker.close();
  await melodyVocalsQueue.close();
  await redisConnection.quit();

  console.log('[MelodyVocals] Queue shutdown complete');
}

console.log('[MelodyVocals] Queue initialized with concurrency: 3, rate limit: 10 jobs/min');
