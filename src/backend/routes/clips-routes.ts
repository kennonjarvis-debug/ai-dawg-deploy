/**
 * Clips Analysis Routes
 *
 * API endpoints for analyzing multiple audio clips:
 * - POST /api/clips/analyze-multiple - Analyze multiple clips simultaneously
 * - GET /api/clips/analysis-cost-estimate - Estimate analysis costs
 */

import { Router } from 'express';
import { logger } from '../utils/logger';
import { canMakeApiCall } from '../services/cost-monitoring-service';
import {
  analyzeMultipleClips,
  estimateMultiClipAnalysisCost,
} from '../services/multi-clip-analyzer';
import { emitClipsAnalyzed } from '../../api/websocket/server';

const router = Router();

/**
 * POST /api/clips/analyze-multiple
 * Analyze multiple audio clips simultaneously
 *
 * Body:
 * {
 *   clips: [
 *     {
 *       clipId: string,
 *       clipName: string,
 *       audioBuffer: AudioBuffer, // In practice, this would be sent as base64 or file upload
 *       suggestedType?: 'vocal' | 'instrument'
 *     }
 *   ],
 *   suggestArrangement?: boolean,
 *   detectConflicts?: boolean,
 *   projectId?: string
 * }
 */
router.post('/analyze-multiple', async (req, res) => {
  try {
    const { clips, suggestArrangement, detectConflicts, projectId } = req.body;

    // Hardcoded userId for development (replace with auth middleware in production)
    const userId = 'user-123';

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({
        error: 'Clips array is required and must not be empty',
      });
    }

    if (clips.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 clips can be analyzed simultaneously',
      });
    }

    // Check budget limits if AI analysis is requested
    if (suggestArrangement) {
      const canProceed = await canMakeApiCall(userId);
      if (!canProceed) {
        return res.status(429).json({
          error: 'Budget limit exceeded',
          message: 'Your daily or monthly budget limit has been reached',
        });
      }
    }

    logger.info('[ClipsRoutes] Analyzing multiple clips', {
      userId,
      clipCount: clips.length,
      suggestArrangement,
      detectConflicts,
    });

    // NOTE: In a real implementation, we would need to handle audio data properly.
    // This is a placeholder that assumes AudioBuffer is somehow passed in the request.
    // In practice, you would:
    // 1. Upload audio files to storage
    // 2. Load audio files from storage
    // 3. Decode to AudioBuffer using Web Audio API or similar
    // 4. Pass to analyzeMultipleClips

    // For now, return an error indicating this needs proper implementation
    return res.status(501).json({
      error: 'Not implemented',
      message: 'Audio buffer handling needs to be implemented. Please upload clips to storage first, then reference by ID.',
      suggestion: 'Use the following flow: 1) Upload clips via /api/tracks/upload, 2) Reference clip IDs in this endpoint',
    });

    // When implemented, it would look like:
    /*
    const result = await analyzeMultipleClips(clips, userId, {
      suggestArrangement,
      detectConflicts,
    });

    // Emit WebSocket event if projectId provided
    if (projectId) {
      emitClipsAnalyzed(userId, result);
    }

    res.json({
      success: true,
      analysis: result,
    });
    */
  } catch (error) {
    logger.error('[ClipsRoutes] Analysis failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to analyze clips',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/clips/analyze-by-ids
 * Analyze multiple clips by their database IDs
 * This is the recommended approach - clips are already uploaded to the system
 *
 * Body:
 * {
 *   clipIds: string[],
 *   suggestArrangement?: boolean,
 *   detectConflicts?: boolean,
 *   projectId?: string
 * }
 */
router.post('/analyze-by-ids', async (req, res) => {
  try {
    const { clipIds, suggestArrangement, detectConflicts, projectId } = req.body;

    const userId = 'user-123';

    if (!clipIds || !Array.isArray(clipIds) || clipIds.length === 0) {
      return res.status(400).json({
        error: 'clipIds array is required and must not be empty',
      });
    }

    if (clipIds.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 clips can be analyzed simultaneously',
      });
    }

    // Check budget limits if AI analysis is requested
    if (suggestArrangement) {
      const canProceed = await canMakeApiCall(userId);
      if (!canProceed) {
        return res.status(429).json({
          error: 'Budget limit exceeded',
          message: 'Your daily or monthly budget limit has been reached',
        });
      }
    }

    logger.info('[ClipsRoutes] Analyzing clips by IDs', {
      userId,
      clipIds,
      suggestArrangement,
      detectConflicts,
    });

    // TODO: Implement the following:
    // 1. Fetch clips from database by IDs
    // 2. Load associated audio files from storage
    // 3. Decode audio files to AudioBuffer
    // 4. Call analyzeMultipleClips
    // 5. Store results in database
    // 6. Return analysis

    return res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint will be implemented once audio storage and retrieval is set up',
      clipIds,
    });

    // When implemented:
    /*
    // Fetch clips from database
    const clips = await prisma.clip.findMany({
      where: {
        id: { in: clipIds },
      },
      include: {
        audioFile: true,
      },
    });

    if (clips.length !== clipIds.length) {
      return res.status(404).json({
        error: 'Some clips not found',
        found: clips.length,
        requested: clipIds.length,
      });
    }

    // Load and decode audio files
    const clipsWithAudio = await Promise.all(
      clips.map(async (clip) => {
        // Load audio file from storage
        const audioBuffer = await loadAudioBuffer(clip.audioFile.storageKey);

        return {
          clipId: clip.id,
          clipName: clip.name,
          audioBuffer,
          suggestedType: clip.track.trackType === 'AUDIO' ? 'vocal' : 'instrument',
        };
      })
    );

    // Analyze clips
    const result = await analyzeMultipleClips(clipsWithAudio, userId, {
      suggestArrangement,
      detectConflicts,
    });

    // Emit WebSocket event
    if (projectId) {
      emitClipsAnalyzed(userId, result);
    }

    res.json({
      success: true,
      analysis: result,
    });
    */
  } catch (error) {
    logger.error('[ClipsRoutes] Analysis by IDs failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to analyze clips',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/clips/analysis-cost-estimate
 * Estimate cost for multi-clip analysis
 *
 * Query params:
 * - clipCount: number
 * - includeArrangement: boolean
 */
router.get('/analysis-cost-estimate', async (req, res) => {
  try {
    const { clipCount, includeArrangement } = req.query;

    if (!clipCount) {
      return res.status(400).json({
        error: 'clipCount query parameter is required',
      });
    }

    const count = parseInt(clipCount as string, 10);
    if (isNaN(count) || count <= 0 || count > 10) {
      return res.status(400).json({
        error: 'clipCount must be between 1 and 10',
      });
    }

    const includeAI = includeArrangement === 'true';

    const estimate = estimateMultiClipAnalysisCost(count, includeAI);

    res.json({
      success: true,
      estimate: {
        clipCount: count,
        includeArrangement: includeAI,
        estimatedCost: estimate.estimatedCost,
        inputTokens: estimate.inputTokens,
        outputTokens: estimate.outputTokens,
        breakdown: estimate.breakdown,
      },
    });
  } catch (error) {
    logger.error('[ClipsRoutes] Cost estimate failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to estimate cost',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/clips/features
 * Get information about multi-clip analysis features
 */
router.get('/features', async (req, res) => {
  try {
    res.json({
      success: true,
      features: {
        maxClips: 10,
        analyses: [
          {
            name: 'Metadata Extraction',
            description: 'Extract BPM, key, energy, and vocal characteristics',
            cost: 'Free (local processing)',
          },
          {
            name: 'Relationship Analysis',
            description: 'Identify complementary keys, matching BPMs, and clip compatibility',
            cost: 'Free (local processing)',
          },
          {
            name: 'Conflict Detection',
            description: 'Detect tempo mismatches, key clashes, and style conflicts',
            cost: 'Free (local processing)',
          },
          {
            name: 'AI Arrangement Suggestions',
            description: 'Get AI-powered suggestions for optimal clip arrangement',
            cost: 'Uses GPT-4o (estimated $0.003-0.008 per request)',
            optional: true,
          },
        ],
        supportedFormats: ['wav', 'mp3', 'flac', 'ogg'],
        recommendations: [
          'Upload clips to storage before analysis',
          'Use analyze-by-ids endpoint for best performance',
          'Enable AI suggestions for complex arrangements',
          'Review conflicts before finalizing arrangement',
        ],
      },
    });
  } catch (error) {
    logger.error('[ClipsRoutes] Features endpoint failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to get features',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
