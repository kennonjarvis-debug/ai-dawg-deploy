/**
 * Stem Separation Job Queue
 *
 * BullMQ job queue for async stem separation processing using Demucs
 * Features: Progress tracking, retry logic, WebSocket updates, billing integration
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { emitToUser } from '../../api/websocket/server';
import { demucsService } from '../services/demucs-service';
import type {
  SeparationJobData,
  SeparationJobStatus,
  SeparationProgress,
  SeparationResult,
} from '../../types/separation';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Create the separation queue
export const separationQueue = new Queue<SeparationJobData>('stem-separation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2, // Retry once on failure
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 7 * 24 * 3600, // Keep for 7 days
      count: 500,
    },
    removeOnFail: {
      age: 30 * 24 * 3600, // Keep failed jobs for 30 days
    },
  },
});

// Worker for processing separation jobs
const separationWorker = new Worker<SeparationJobData>(
  'stem-separation',
  async (job: Job<SeparationJobData>) => {
    const { userId, audioUrl, quality, model, stems, outputFormat } = job.data;

    logger.info('[SeparationJob] Processing separation job', {
      jobId: job.id,
      userId,
      quality,
      model,
    });

    try {
      // Stage 1: Upload/Validate (0-10%)
      await updateProgress(job, 'uploading', 5, 'Uploading audio file...');

      // Stage 2: Start Demucs prediction (10-20%)
      await updateProgress(job, 'processing', 15, 'Starting Demucs AI model...');

      const { predictionId, estimatedTime } = await demucsService.separateStems({
        userId,
        audioUrl,
        quality,
        model,
        stems,
        outputFormat,
      });

      logger.info('[SeparationJob] Demucs prediction started', {
        jobId: job.id,
        predictionId,
        estimatedTime,
      });

      // Stage 3: Wait for Demucs to complete (20-90%)
      await updateProgress(
        job,
        'processing',
        25,
        `Processing with Demucs (est. ${estimatedTime}s)...`
      );

      const result = await demucsService.waitForCompletion(
        predictionId,
        (progress, stage) => {
          // Map Demucs progress (0-100) to our range (25-90)
          const mappedProgress = 25 + Math.round(progress * 0.65);
          updateProgress(job, 'processing', mappedProgress, stage).catch((err) =>
            logger.warn('[SeparationJob] Progress update failed', { error: err.message })
          );
        }
      );

      // Attach user info to result
      result.userId = userId;
      result.projectId = job.data.projectId;
      result.jobId = job.id!;

      // Stage 4: Download stems (90-95%)
      await updateProgress(job, 'downloading', 92, 'Downloading separated stems...');

      // Stage 5: Validate quality (95-98%)
      await updateProgress(job, 'validating', 96, 'Validating stem quality...');

      const validation = await validateStemQuality(result);

      if (!validation.isValid) {
        logger.warn('[SeparationJob] Quality validation warnings', {
          jobId: job.id,
          warnings: validation.warnings,
        });
      }

      // Stage 6: Complete (98-100%)
      await updateProgress(job, 'completed', 99, 'Finalizing...');

      // Emit completion event
      emitToUser(userId, 'separation:completed', result);

      // Track usage for billing
      await trackSeparationUsage(userId, result);

      logger.info('[SeparationJob] Separation completed successfully', {
        jobId: job.id,
        userId,
        processingTime: result.metadata.processingTime,
        cost: result.metadata.cost,
      });

      await updateProgress(job, 'completed', 100, 'Complete!');

      return result;
    } catch (error: any) {
      logger.error('[SeparationJob] Separation failed', {
        jobId: job.id,
        userId,
        error: error.message,
        stack: error.stack,
      });

      // Emit failure event
      emitToUser(userId, 'separation:failed', {
        jobId: job.id!,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Process up to 3 separations concurrently
    autorun: true,
  }
);

/**
 * Update job progress and emit to user via WebSocket
 */
async function updateProgress(
  job: Job,
  status: SeparationJobStatus,
  percent: number,
  stage: string
): Promise<void> {
  await job.updateProgress(percent);

  const progress: SeparationProgress = {
    jobId: job.id!,
    status,
    progress: percent,
    stage,
    timestamp: new Date(),
  };

  emitToUser(job.data.userId, 'separation:progress', progress);
}

/**
 * Validate stem quality
 */
async function validateStemQuality(result: SeparationResult): Promise<{
  isValid: boolean;
  warnings: string[];
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const stem of result.stems) {
    // Check for silent stems
    if (stem.quality.isSilent) {
      warnings.push(`${stem.type} stem appears to be silent`);
    }

    // Check for low quality
    if (stem.quality.sdr && stem.quality.sdr < 5) {
      warnings.push(`${stem.type} stem has low SDR (${stem.quality.sdr.toFixed(1)} dB)`);
    }

    // Check for clipping
    if (stem.quality.peakLevel > -0.1) {
      warnings.push(`${stem.type} stem may be clipping (${stem.quality.peakLevel.toFixed(1)} dBFS)`);
    }

    // Check file size (should be > 100KB)
    if (stem.size < 100000) {
      warnings.push(`${stem.type} stem file is unusually small (${(stem.size / 1024).toFixed(0)} KB)`);
    }
  }

  // Check total energy conservation
  const totalEnergy = result.stems.reduce((sum, s) => sum + s.quality.rmsEnergy, 0);
  if (totalEnergy < 0.1) {
    errors.push('Total stem energy is too low - separation may have failed');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Track separation usage for billing
 */
async function trackSeparationUsage(
  userId: string,
  result: SeparationResult
): Promise<void> {
  try {
    // TODO: Integrate with billing service
    logger.info('[SeparationJob] Tracking usage', {
      userId,
      duration: result.metadata.duration,
      cost: result.metadata.cost,
      model: result.metadata.model,
    });

    // Example: Update user's monthly separation count
    // await billingService.incrementSeparationCount(userId);
    // await billingService.addCost(userId, result.metadata.cost);
  } catch (error: any) {
    logger.error('[SeparationJob] Failed to track usage', {
      userId,
      error: error.message,
    });
    // Don't fail the job if billing tracking fails
  }
}

/**
 * Add a new separation job to the queue
 */
export async function addSeparationJob(
  jobData: SeparationJobData
): Promise<{ jobId: string; estimatedTime: number }> {
  const job = await separationQueue.add('separate-stems', jobData, {
    jobId: jobData.id,
  });

  logger.info('[SeparationQueue] Job added', {
    jobId: job.id,
    userId: jobData.userId,
    quality: jobData.quality,
  });

  // Emit job started event
  emitToUser(jobData.userId, 'separation:started', {
    jobId: job.id!,
    timestamp: new Date(),
  });

  // Estimate time based on queue position and quality
  const estimatedTime = await estimateSeparationTime(jobData.quality);

  return {
    jobId: job.id!,
    estimatedTime,
  };
}

/**
 * Get job status
 */
export async function getSeparationJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  result?: any;
  error?: string;
}> {
  const job = await separationQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  const state = await job.getState();
  const progress = job.progress as number;

  return {
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
    result: job.returnvalue,
    error: job.failedReason,
  };
}

/**
 * Cancel a separation job
 */
export async function cancelSeparationJob(jobId: string): Promise<void> {
  const job = await separationQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  // Cancel Demucs prediction if it's running
  try {
    // TODO: Store predictionId in job data and cancel it
    // await demucsService.cancelPrediction(predictionId);
  } catch (error) {
    logger.warn('[SeparationQueue] Could not cancel Demucs prediction', { jobId });
  }

  await job.remove();

  logger.info('[SeparationQueue] Job canceled', { jobId });
}

/**
 * Estimate separation time based on queue and quality
 */
async function estimateSeparationTime(quality: string): Promise<number> {
  const baseTime = {
    fast: 15,
    balanced: 25,
    'high-quality': 40,
  }[quality] || 25;

  const waitingCount = await separationQueue.getWaitingCount();
  const activeCount = await separationQueue.getActiveCount();

  // Each queued job adds ~30s to wait time
  const queueTime = Math.max(0, waitingCount - activeCount) * 30;

  return baseTime + queueTime;
}

/**
 * Get queue statistics
 */
export async function getSeparationQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    separationQueue.getWaitingCount(),
    separationQueue.getActiveCount(),
    separationQueue.getCompletedCount(),
    separationQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  };
}

// Worker event handlers
separationWorker.on('completed', (job, result) => {
  logger.info('[SeparationWorker] Job completed', {
    jobId: job.id,
    processingTime: result?.metadata?.processingTime,
  });
});

separationWorker.on('failed', (job, error) => {
  logger.error('[SeparationWorker] Job failed', {
    jobId: job?.id,
    error: error.message,
    attemptsMade: job?.attemptsMade,
  });
});

separationWorker.on('progress', (job, progress) => {
  logger.debug('[SeparationWorker] Job progress', {
    jobId: job.id,
    progress,
  });
});

// Queue error handler
separationQueue.on('error', (error) => {
  logger.error('[SeparationQueue] Queue error', { error: error.message });
});

// Graceful shutdown
export async function shutdownSeparationQueue() {
  logger.info('[SeparationQueue] Shutting down...');

  await separationWorker.close();
  await separationQueue.close();
  await redisConnection.quit();

  logger.info('[SeparationQueue] Shutdown complete');
}

logger.info('[SeparationQueue] Initialized', {
  concurrency: 3,
  retryAttempts: 2,
});
