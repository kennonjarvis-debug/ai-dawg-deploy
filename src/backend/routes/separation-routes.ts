/**
 * Stem Separation API Routes
 *
 * RESTful endpoints for stem separation functionality
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  addSeparationJob,
  getSeparationJobStatus,
  cancelSeparationJob,
  getSeparationQueueStats,
} from '../jobs/separation-job';
import type {
  SeparationRequest,
  SeparationJobData,
  SeparationQuality,
  DemucsModel,
} from '../../types/separation';

const router = express.Router();

// Configure multer for file uploads (max 100MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files only
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp4',
      'audio/m4a',
      'audio/x-m4a',
      'audio/flac',
      'audio/ogg',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/separation/separate
 * Start a new stem separation job
 */
router.post('/separate', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';
    const { projectId, quality, model, stems, outputFormat, audioUrl } = req.body;

    // Validate input
    if (!req.file && !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio file or URL is required',
      });
    }

    // Check user's separation quota
    const canSeparate = await checkUserQuota(userId);
    if (!canSeparate) {
      return res.status(429).json({
        success: false,
        error: 'Monthly separation limit reached. Upgrade to premium for unlimited separations.',
      });
    }

    // Upload file to storage if provided
    let audioFileUrl = audioUrl;
    if (req.file) {
      audioFileUrl = await uploadAudioToStorage(req.file);
    }

    // Create job data
    const jobId = uuidv4();
    const jobData: SeparationJobData = {
      id: jobId,
      userId,
      projectId: projectId || undefined,
      audioUrl: audioFileUrl,
      quality: (quality as SeparationQuality) || 'balanced',
      model: (model as DemucsModel) || 'htdemucs',
      stems: stems ? JSON.parse(stems) : ['vocals', 'drums', 'bass', 'other'],
      outputFormat: outputFormat || 'wav',
      createdAt: new Date(),
    };

    // Add job to queue
    const { jobId: addedJobId, estimatedTime } = await addSeparationJob(jobData);

    logger.info('[SeparationAPI] Separation job created', {
      jobId: addedJobId,
      userId,
      quality: jobData.quality,
    });

    res.json({
      success: true,
      jobId: addedJobId,
      estimatedTime,
      message: `Separation started. Estimated completion in ${estimatedTime} seconds.`,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to create separation job', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start separation',
    });
  }
});

/**
 * GET /api/separation/status/:jobId
 * Get separation job status and results
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const status = await getSeparationJobStatus(jobId);

    res.json({
      success: true,
      jobId,
      status: status.status,
      progress: status.progress,
      result: status.result,
      error: status.error,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to get job status', {
      jobId: req.params.jobId,
      error: error.message,
    });

    res.status(404).json({
      success: false,
      error: error.message || 'Job not found',
    });
  }
});

/**
 * DELETE /api/separation/cancel/:jobId
 * Cancel a running separation job
 */
router.delete('/cancel/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = (req as any).user?.id;

    // TODO: Check if userId matches job owner
    const status = await getSeparationJobStatus(jobId);

    await cancelSeparationJob(jobId);

    logger.info('[SeparationAPI] Job canceled', { jobId, userId });

    res.json({
      success: true,
      message: 'Separation job canceled',
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to cancel job', {
      jobId: req.params.jobId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel job',
    });
  }
});

/**
 * GET /api/separation/history
 * Get user's separation history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // TODO: Query database for user's separation history
    const jobs = [];

    res.json({
      success: true,
      jobs,
      total: 0,
      page,
      limit,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to get history', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve history',
    });
  }
});

/**
 * GET /api/separation/quota
 * Get user's remaining separation quota
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';

    const quota = await getUserQuota(userId);

    res.json({
      success: true,
      quota,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to get quota', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve quota',
    });
  }
});

/**
 * POST /api/separation/batch
 * Start batch separation (multiple files)
 */
router.post('/batch', upload.array('audio', 10), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';
    const files = req.files as Express.Multer.File[];
    const { projectId, quality, model } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No audio files provided',
      });
    }

    // Check batch processing permission
    const quota = await getUserQuota(userId);
    if (!quota.batchProcessing) {
      return res.status(403).json({
        success: false,
        error: 'Batch processing requires premium subscription',
      });
    }

    // Create jobs for each file
    const jobs = [];

    for (const file of files) {
      const audioUrl = await uploadAudioToStorage(file);
      const jobId = uuidv4();

      const jobData: SeparationJobData = {
        id: jobId,
        userId,
        projectId,
        audioUrl,
        quality: (quality as SeparationQuality) || 'balanced',
        model: (model as DemucsModel) || 'htdemucs',
        stems: ['vocals', 'drums', 'bass', 'other'],
        outputFormat: 'wav',
        createdAt: new Date(),
      };

      const { jobId: addedJobId } = await addSeparationJob(jobData);

      jobs.push({
        fileId: jobId,
        jobId: addedJobId,
        fileName: file.originalname,
      });
    }

    const batchId = uuidv4();

    logger.info('[SeparationAPI] Batch separation started', {
      batchId,
      userId,
      fileCount: files.length,
    });

    res.json({
      success: true,
      batchId,
      jobs,
      totalJobs: jobs.length,
      message: `Batch separation started for ${jobs.length} files`,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to start batch separation', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start batch separation',
    });
  }
});

/**
 * GET /api/separation/stats
 * Get queue statistics (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication check

    const stats = await getSeparationQueueStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to get stats', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve stats',
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has remaining separation quota
 */
async function checkUserQuota(userId: string): Promise<boolean> {
  try {
    const quota = await getUserQuota(userId);
    return quota.remainingSeparations > 0;
  } catch (error) {
    logger.error('[SeparationAPI] Failed to check quota', { userId });
    // Allow if quota check fails (fail open)
    return true;
  }
}

/**
 * Get user's quota information
 */
async function getUserQuota(userId: string): Promise<{
  tier: 'free' | 'premium' | 'enterprise';
  monthlySeparations: number;
  remainingSeparations: number;
  batchProcessing: boolean;
  priorityProcessing: boolean;
}> {
  // TODO: Integrate with billing/subscription service
  // For now, return default free tier

  if (userId === 'anonymous') {
    return {
      tier: 'free',
      monthlySeparations: 5,
      remainingSeparations: 5,
      batchProcessing: false,
      priorityProcessing: false,
    };
  }

  // Mock premium user
  return {
    tier: 'premium',
    monthlySeparations: 999,
    remainingSeparations: 999,
    batchProcessing: true,
    priorityProcessing: true,
  };
}

/**
 * Upload audio file to S3 or storage service
 */
async function uploadAudioToStorage(file: Express.Multer.File): Promise<string> {
  try {
    // TODO: Integrate with S3 or storage service
    // For now, return a placeholder URL

    const fileName = `${uuidv4()}-${file.originalname}`;
    const mockUrl = `https://storage.dawg-ai.com/uploads/${fileName}`;

    logger.info('[SeparationAPI] File uploaded', {
      fileName,
      size: file.size,
      mimetype: file.mimetype,
    });

    // TODO: In production, use S3 service for file storage

    return mockUrl;
  } catch (error: any) {
    logger.error('[SeparationAPI] Failed to upload file', {
      error: error.message,
    });
    throw new Error('Failed to upload audio file');
  }
}

export default router;
