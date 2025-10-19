/**
 * Melody-to-Vocals API Routes - Production Ready
 *
 * Features:
 * - Input validation
 * - Job queue integration
 * - Progress tracking via WebSocket
 * - Quota management
 * - Error handling
 * - Database tracking
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { validateAudioFile } from '../validators/audio-validator';
import {
  enqueueMelodyVocalsJob,
  cancelMelodyVocalsJob,
  getMelodyVocalsJobStatus,
  getMelodyVocalsQueueStats,
} from '../jobs/melody-vocals-job';
import { checkExpertMusicAIHealth, getCircuitBreakerStatus } from '../services/melody-vocals-service';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/melody-vocals-uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/m4a',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`));
    }
  },
});

/**
 * Check user quota
 */
async function checkUserQuota(userId: string): Promise<{
  allowed: boolean;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
}> {
  // Get or create quota record
  let quota = await prisma.melodyVocalsQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.melodyVocalsQuota.create({
      data: {
        userId,
        dailyLimit: 10,
        monthlyLimit: 100,
      },
    });
  }

  // Check if we need to reset counters
  const now = new Date();
  const lastDailyReset = new Date(quota.lastDailyReset);
  const lastMonthlyReset = new Date(quota.lastMonthlyReset);

  let dailyUsed = quota.dailyUsed;
  let monthlyUsed = quota.monthlyUsed;

  // Reset daily if it's a new day
  if (now.getDate() !== lastDailyReset.getDate() ||
      now.getMonth() !== lastDailyReset.getMonth()) {
    dailyUsed = 0;
    await prisma.melodyVocalsQuota.update({
      where: { userId },
      data: {
        dailyUsed: 0,
        lastDailyReset: now,
      },
    });
  }

  // Reset monthly if it's a new month
  if (now.getMonth() !== lastMonthlyReset.getMonth()) {
    monthlyUsed = 0;
    await prisma.melodyVocalsQuota.update({
      where: { userId },
      data: {
        monthlyUsed: 0,
        lastMonthlyReset: now,
      },
    });
  }

  const allowed = dailyUsed < quota.dailyLimit && monthlyUsed < quota.monthlyLimit;

  return {
    allowed,
    dailyUsed,
    dailyLimit: quota.dailyLimit,
    monthlyUsed,
    monthlyLimit: quota.monthlyLimit,
  };
}

/**
 * Increment user quota
 */
async function incrementUserQuota(userId: string): Promise<void> {
  await prisma.melodyVocalsQuota.update({
    where: { userId },
    data: {
      dailyUsed: { increment: 1 },
      monthlyUsed: { increment: 1 },
      totalConversions: { increment: 1 },
    },
  });
}

/**
 * POST /api/v1/melody-vocals/convert
 * Submit a melody for conversion to vocals
 */
router.post('/convert', upload.single('audio'), async (req, res) => {
  const jobId = uuidv4();

  try {
    // Extract user ID (assuming from auth middleware)
    const userId = req.body.userId || 'anonymous';
    const projectId = req.body.projectId;

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    // Validate prompt
    const prompt = req.body.prompt?.trim();
    if (!prompt || prompt.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be at least 10 characters long',
      });
    }

    if (prompt.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must not exceed 500 characters',
      });
    }

    // Check user quota
    const quotaCheck = await checkUserQuota(userId);
    if (!quotaCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Quota exceeded',
        quota: {
          dailyUsed: quotaCheck.dailyUsed,
          dailyLimit: quotaCheck.dailyLimit,
          monthlyUsed: quotaCheck.monthlyUsed,
          monthlyLimit: quotaCheck.monthlyLimit,
        },
      });
    }

    // Validate audio file
    console.log(`[MelodyVocals] Validating audio file for job ${jobId}`);
    const validation = await validateAudioFile(req.file.path, {
      maxSizeMB: 50,
      maxDurationSeconds: 300,
      minDurationSeconds: 1,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Audio validation failed',
        errors: validation.errors,
      });
    }

    // Create database record
    await prisma.melodyVocalsConversion.create({
      data: {
        jobId,
        userId,
        projectId,
        status: 'pending',
        prompt,
        genre: req.body.genre || 'pop',
        theme: req.body.theme,
        mood: req.body.mood,
        style: req.body.style,
        aiProvider: req.body.aiProvider || 'anthropic',
        vocalModel: req.body.vocalModel || 'bark',
        inputAudioPath: req.file.path,
        inputDuration: validation.metadata?.duration,
        inputFormat: validation.metadata?.format,
        inputSampleRate: validation.metadata?.sampleRate,
        inputSize: validation.metadata?.size,
        validationWarnings: JSON.stringify(validation.warnings),
      },
    });

    // Enqueue job
    console.log(`[MelodyVocals] Enqueuing job ${jobId} for user ${userId}`);
    await enqueueMelodyVocalsJob({
      userId,
      projectId,
      audioFilePath: req.file.path,
      prompt,
      genre: req.body.genre,
      theme: req.body.theme,
      mood: req.body.mood,
      style: req.body.style,
      aiProvider: req.body.aiProvider || 'anthropic',
      vocalModel: req.body.vocalModel || 'bark',
      jobId,
    });

    // Increment quota
    await incrementUserQuota(userId);

    // Update status to processing
    await prisma.melodyVocalsConversion.update({
      where: { jobId },
      data: { status: 'processing' },
    });

    res.json({
      success: true,
      jobId,
      message: 'Conversion job submitted successfully',
      estimatedTime: '1-3 minutes',
      quota: {
        dailyUsed: quotaCheck.dailyUsed + 1,
        dailyLimit: quotaCheck.dailyLimit,
        monthlyUsed: quotaCheck.monthlyUsed + 1,
        monthlyLimit: quotaCheck.monthlyLimit,
      },
      warnings: validation.warnings,
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] Job submission failed:`, error);

    // Update database if job was created
    try {
      await prisma.melodyVocalsConversion.update({
        where: { jobId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          errorType: 'SUBMISSION_ERROR',
        },
      });
    } catch (dbError) {
      // Ignore DB errors during error handling
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit conversion job',
    });
  }
});

/**
 * GET /api/v1/melody-vocals/status/:jobId
 * Get the status of a conversion job
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get from database
    const conversion = await prisma.melodyVocalsConversion.findUnique({
      where: { jobId },
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Get queue status
    const queueStatus = await getMelodyVocalsJobStatus(jobId);

    res.json({
      success: true,
      job: {
        jobId: conversion.jobId,
        status: conversion.status,
        progress: queueStatus?.progress || 0,
        createdAt: conversion.createdAt,
        completedAt: conversion.completedAt,
        processingTime: conversion.processingTime,
        result: conversion.status === 'completed' ? {
          audioUrl: conversion.outputAudioUrl,
          lyrics: conversion.generatedLyrics,
          melodyInfo: conversion.melodyInfo ? JSON.parse(conversion.melodyInfo) : null,
          lyricsInfo: conversion.lyricsInfo ? JSON.parse(conversion.lyricsInfo) : null,
          processingSteps: conversion.processingSteps ? JSON.parse(conversion.processingSteps) : null,
        } : null,
        error: conversion.errorMessage,
      },
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] Status check failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job status',
    });
  }
});

/**
 * POST /api/v1/melody-vocals/cancel/:jobId
 * Cancel a conversion job
 */
router.post('/cancel/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const conversion = await prisma.melodyVocalsConversion.findUnique({
      where: { jobId },
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (conversion.status === 'completed' || conversion.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel job with status: ${conversion.status}`,
      });
    }

    // Cancel in queue
    const cancelled = await cancelMelodyVocalsJob(jobId);

    if (cancelled) {
      // Update database
      await prisma.melodyVocalsConversion.update({
        where: { jobId },
        data: {
          status: 'cancelled',
          errorMessage: 'Cancelled by user',
        },
      });

      res.json({
        success: true,
        message: 'Job cancelled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to cancel job (may have already completed)',
      });
    }
  } catch (error: any) {
    console.error(`[MelodyVocals] Cancel failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel job',
    });
  }
});

/**
 * GET /api/v1/melody-vocals/history
 * Get conversion history for a user
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'anonymous';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const conversions = await prisma.melodyVocalsConversion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.melodyVocalsConversion.count({
      where: { userId },
    });

    res.json({
      success: true,
      conversions: conversions.map(c => ({
        jobId: c.jobId,
        status: c.status,
        prompt: c.prompt,
        genre: c.genre,
        mood: c.mood,
        createdAt: c.createdAt,
        completedAt: c.completedAt,
        processingTime: c.processingTime,
        hasError: !!c.errorMessage,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] History retrieval failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get history',
    });
  }
});

/**
 * GET /api/v1/melody-vocals/quota
 * Get user's quota information
 */
router.get('/quota', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'anonymous';

    const quotaInfo = await checkUserQuota(userId);

    res.json({
      success: true,
      quota: quotaInfo,
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] Quota check failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quota',
    });
  }
});

/**
 * GET /api/v1/melody-vocals/stats
 * Get queue and service statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const queueStats = await getMelodyVocalsQueueStats();
    const serviceHealth = await checkExpertMusicAIHealth();
    const circuitBreakerStatus = getCircuitBreakerStatus();

    res.json({
      success: true,
      queue: queueStats,
      service: {
        healthy: serviceHealth,
        circuitBreaker: circuitBreakerStatus,
      },
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] Stats retrieval failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats',
    });
  }
});

/**
 * POST /api/v1/melody-vocals/feedback/:jobId
 * Submit feedback for a conversion
 */
router.post('/feedback/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    await prisma.melodyVocalsConversion.update({
      where: { jobId },
      data: {
        userRating: rating,
        userFeedback: feedback,
      },
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error(`[MelodyVocals] Feedback submission failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit feedback',
    });
  }
});

export default router;
