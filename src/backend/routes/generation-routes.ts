/**
 * Generation API Routes
 * REST endpoints for music generation, mixing, and mastering
 */

import { Router, Request, Response } from 'express';
import { generationService } from '../services/generation-service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateBeatSchema = z.object({
  genre: z.string().min(1),
  bpm: z.number().min(60).max(200).optional(),
  key: z.string().optional(),
  mood: z.string().optional(),
  duration: z.number().min(15).max(300).optional(),
  projectId: z.string().optional(),
});

const generateStemsSchema = z.object({
  audioFileId: z.string().min(1),
  stemTypes: z.array(z.enum(['drums', 'bass', 'melody', 'vocals'])).min(1),
  projectId: z.string().optional(),
});

const mixTracksSchema = z.object({
  trackIds: z.array(z.string()).min(1),
  mixProfile: z.enum(['balanced', 'bass-heavy', 'bright', 'warm']).optional(),
  projectId: z.string().optional(),
});

const masterTrackSchema = z.object({
  trackId: z.string().min(1),
  targetLoudness: z.number().min(-24).max(-6).optional(),
  quality: z.enum(['streaming', 'cd', 'club']).optional(),
  projectId: z.string().optional(),
});

// Middleware to extract userId (mock for now)
// In production, this would come from JWT authentication
function getUserId(req: Request): string {
  // TODO: Extract from JWT token
  return (req.headers['x-user-id'] as string) || 'user-123';
}

/**
 * POST /api/generate/beat
 * Queue a beat generation job
 */
router.post('/beat', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = generateBeatSchema.parse(req.body);

    const result = await generationService.generateBeat({
      userId,
      ...params,
    });

    logger.info('Beat generation queued', {
      userId,
      jobId: result.jobId,
      genre: params.genre,
    });

    res.status(202).json({
      success: true,
      message: 'Beat generation job queued',
      jobId: result.jobId,
      generationId: result.generationId,
    });
  } catch (error: any) {
    logger.error('Beat generation failed', {
      error: error.message,
      body: req.body,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/generate/stems
 * Queue a stem generation job
 */
router.post('/stems', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = generateStemsSchema.parse(req.body);

    const result = await generationService.generateStems({
      userId,
      ...params,
    });

    logger.info('Stem generation queued', {
      userId,
      jobId: result.jobId,
      stemTypes: params.stemTypes,
    });

    res.status(202).json({
      success: true,
      message: 'Stem generation job queued',
      jobId: result.jobId,
      generationId: result.generationId,
    });
  } catch (error: any) {
    logger.error('Stem generation failed', {
      error: error.message,
      body: req.body,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/generate/mix
 * Queue a mixing job
 */
router.post('/mix', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = mixTracksSchema.parse(req.body);

    const result = await generationService.mixTracks({
      userId,
      ...params,
    });

    logger.info('Mixing job queued', {
      userId,
      jobId: result.jobId,
      trackCount: params.trackIds.length,
    });

    res.status(202).json({
      success: true,
      message: 'Mixing job queued',
      jobId: result.jobId,
      generationId: result.generationId,
    });
  } catch (error: any) {
    logger.error('Mixing job failed', {
      error: error.message,
      body: req.body,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/generate/master
 * Queue a mastering job
 */
router.post('/master', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = masterTrackSchema.parse(req.body);

    const result = await generationService.masterTrack({
      userId,
      ...params,
    });

    logger.info('Mastering job queued', {
      userId,
      jobId: result.jobId,
      quality: params.quality,
    });

    res.status(202).json({
      success: true,
      message: 'Mastering job queued',
      jobId: result.jobId,
      generationId: result.generationId,
    });
  } catch (error: any) {
    logger.error('Mastering job failed', {
      error: error.message,
      body: req.body,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/generate/status/:jobId
 * Check job status
 */
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await generationService.getJobStatus(jobId);

    res.json({
      success: true,
      status,
    });
  } catch (error: any) {
    logger.error('Failed to get job status', {
      error: error.message,
      jobId: req.params.jobId,
    });

    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/generate/result/:jobId
 * Get job result (completed jobs only)
 */
router.get('/result/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const result = await generationService.getJobResult(jobId);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    logger.error('Failed to get job result', {
      error: error.message,
      jobId: req.params.jobId,
    });

    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/generate/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const stats = await generationService.getQueueStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error('Failed to get queue stats', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/generate/genres
 * Get list of supported genres
 */
router.get('/genres', (req: Request, res: Response) => {
  try {
    const genres = generationService.getSupportedGenres();

    res.json({
      success: true,
      genres,
    });
  } catch (error: any) {
    logger.error('Failed to get genres', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
