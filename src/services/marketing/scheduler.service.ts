/**
 * Content Generation Scheduler
 * Handles scheduled and queued content generation
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../../utils/logger';
import { contentGenerator } from './content-generator.service';
import { ContentGenerationRequest, ScheduledContentJob } from './types';

// Redis connection for BullMQ
const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create queue for content generation
const contentQueue = new Queue('content-generation', { connection: redis });

/**
 * Content Generation Scheduler Service
 */
export class ContentScheduler {
  private worker: Worker | null = null;
  private scheduledJobs: Map<string, ScheduledContentJob> = new Map();

  constructor() {
    this.initializeWorker();
  }

  /**
   * Initialize the worker to process queued jobs
   */
  private initializeWorker() {
    this.worker = new Worker(
      'content-generation',
      async (job: Job) => {
        logger.info('Processing content generation job', {
          jobId: job.id,
          userId: job.data.userId,
          contentType: job.data.request.contentType,
        });

        try {
          const result = await contentGenerator.generateContent(job.data.request);

          logger.info('Content generation job completed', {
            jobId: job.id,
            wordCount: result.metadata.wordCount,
          });

          return result;
        } catch (error) {
          logger.error('Content generation job failed', {
            jobId: job.id,
            error: (error as Error).message,
          });
          throw error;
        }
      },
      {
        connection: redis,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 20, // Maximum 20 jobs
          duration: 60000, // Per minute
        },
      }
    );

    this.worker.on('completed', job => {
      logger.info('Job completed successfully', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });

    logger.info('Content generation worker initialized');
  }

  /**
   * Schedule a one-time content generation
   */
  async scheduleOnce(
    userId: string,
    request: ContentGenerationRequest,
    delay?: number
  ): Promise<string> {
    const job = await contentQueue.add(
      'generate-content',
      {
        userId,
        request,
      },
      {
        delay: delay || 0, // Delay in milliseconds
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    logger.info('Content generation scheduled', {
      jobId: job.id,
      userId,
      contentType: request.contentType,
      delay: delay || 0,
    });

    return job.id as string;
  }

  /**
   * Schedule recurring content generation
   */
  async scheduleRecurring(
    userId: string,
    request: ContentGenerationRequest,
    schedule: ScheduledContentJob['schedule']
  ): Promise<string> {
    const jobId = `${userId}-${request.contentType}-${Date.now()}`;

    // Calculate next run time
    const nextRun = this.calculateNextRun(schedule);

    // Store scheduled job
    const scheduledJob: ScheduledContentJob = {
      id: jobId,
      userId,
      request,
      schedule: {
        ...schedule,
        nextRun,
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledJobs.set(jobId, scheduledJob);

    // Add initial job to queue
    const delay = nextRun.getTime() - Date.now();
    await this.scheduleOnce(userId, request, delay);

    logger.info('Recurring content generation scheduled', {
      jobId,
      userId,
      frequency: schedule.frequency,
      nextRun: nextRun.toISOString(),
    });

    return jobId;
  }

  /**
   * Cancel a scheduled job
   */
  async cancelSchedule(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) {
      return false;
    }

    // Remove from scheduled jobs
    this.scheduledJobs.delete(jobId);

    // Try to remove from queue (if it's there)
    const jobs = await contentQueue.getJobs(['waiting', 'delayed']);
    const queueJob = jobs.find(j => j.data.scheduleId === jobId);
    if (queueJob) {
      await queueJob.remove();
    }

    logger.info('Scheduled job cancelled', { jobId });
    return true;
  }

  /**
   * Get status of a scheduled job
   */
  getJobStatus(jobId: string): ScheduledContentJob | null {
    return this.scheduledJobs.get(jobId) || null;
  }

  /**
   * List all scheduled jobs for a user
   */
  getUserJobs(userId: string): ScheduledContentJob[] {
    return Array.from(this.scheduledJobs.values()).filter(job => job.userId === userId);
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: ScheduledContentJob['schedule']): Date {
    const now = new Date();

    switch (schedule.frequency) {
      case 'once':
        return now;

      case 'daily': {
        const next = new Date(now);
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          next.setHours(hours, minutes, 0, 0);
          if (next <= now) {
            next.setDate(next.getDate() + 1);
          }
        } else {
          next.setDate(next.getDate() + 1);
        }
        return next;
      }

      case 'weekly': {
        const next = new Date(now);
        const targetDay = schedule.dayOfWeek || 1; // Default to Monday
        const currentDay = next.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilTarget);

        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          next.setHours(hours, minutes, 0, 0);
        }
        return next;
      }

      case 'monthly': {
        const next = new Date(now);
        const targetDate = schedule.dayOfMonth || 1;
        next.setDate(targetDate);

        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }

        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          next.setHours(hours, minutes, 0, 0);
        }
        return next;
      }

      default:
        return now;
    }
  }

  /**
   * Process recurring schedules (should be called periodically, e.g., via cron)
   */
  async processRecurringSchedules(): Promise<void> {
    const now = new Date();

    for (const [jobId, job] of this.scheduledJobs.entries()) {
      if (job.schedule.frequency === 'once') {
        continue;
      }

      if (job.schedule.nextRun && job.schedule.nextRun <= now) {
        try {
          // Schedule the next execution
          await this.scheduleOnce(job.userId, job.request);

          // Calculate and update next run time
          job.schedule.nextRun = this.calculateNextRun(job.schedule);
          job.updatedAt = new Date();
          this.scheduledJobs.set(jobId, job);

          logger.info('Recurring schedule processed', {
            jobId,
            nextRun: job.schedule.nextRun.toISOString(),
          });
        } catch (error) {
          logger.error('Failed to process recurring schedule', {
            jobId,
            error: (error as Error).message,
          });
        }
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      contentQueue.getWaitingCount(),
      contentQueue.getActiveCount(),
      contentQueue.getCompletedCount(),
      contentQueue.getFailedCount(),
      contentQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(maxAge: number = 86400000): Promise<void> {
    // maxAge in milliseconds, default 24 hours
    await contentQueue.clean(maxAge, 100, 'completed');
    await contentQueue.clean(maxAge, 100, 'failed');

    logger.info('Queue cleanup completed', { maxAge });
  }

  /**
   * Shutdown the scheduler gracefully
   */
  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      logger.info('Content generation worker shut down');
    }

    await contentQueue.close();
    await redis.quit();

    logger.info('Content scheduler shut down completely');
  }
}

// Export singleton instance
export const contentScheduler = new ContentScheduler();

// Set up periodic processing of recurring schedules (every hour)
if (process.env.NODE_ENV !== 'test') {
  setInterval(
    () => {
      contentScheduler.processRecurringSchedules().catch(error => {
        logger.error('Error processing recurring schedules', {
          error: error.message,
        });
      });
    },
    3600000 // 1 hour
  );
}
