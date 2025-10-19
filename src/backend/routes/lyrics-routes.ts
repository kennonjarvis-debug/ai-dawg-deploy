/**
 * Lyrics Analysis Routes
 *
 * API endpoints for analyzing song lyrics:
 * - POST /api/lyrics/analyze - Analyze lyrics structure
 * - POST /api/lyrics/recommendations - Get genre-specific recommendations
 * - GET /api/lyrics/cost-estimate - Estimate analysis costs
 * - POST /api/lyrics/validate - Quick validation of lyrics
 */

import { Router } from 'express';
import { logger } from '../utils/logger';
import { canMakeApiCall } from '../services/cost-monitoring-service';
import {
  analyzeLyrics,
  estimateLyricsAnalysisCost,
  quickLyricsValidation,
  type Genre,
} from '../services/lyrics-analysis-service';
import {
  emitLyricsAnalyzed,
  emitLyricsSectionLabels,
  emitLyricsRecommendations,
} from '../../api/websocket/server';

const router = Router();

/**
 * POST /api/lyrics/analyze
 * Analyze lyrics and detect song structure
 */
router.post('/analyze', async (req, res) => {
  try {
    const { lyrics, genre, suggestedStructure, trackId, projectId } = req.body;

    // Hardcoded userId for development (replace with auth middleware in production)
    const userId = 'user-123';

    if (!lyrics || typeof lyrics !== 'string') {
      return res.status(400).json({
        error: 'Lyrics text is required',
      });
    }

    // Quick validation
    const validation = quickLyricsValidation(lyrics);
    if (!validation.valid) {
      logger.warn('[LyricsRoutes] Validation warnings', {
        userId,
        warnings: validation.warnings,
      });
    }

    // Check budget limits
    const canProceed = await canMakeApiCall(userId);
    if (!canProceed) {
      return res.status(429).json({
        error: 'Budget limit exceeded',
        message: 'Your daily or monthly budget limit has been reached',
      });
    }

    logger.info('[LyricsRoutes] Analyzing lyrics', {
      userId,
      lyricsLength: lyrics.length,
      genre,
    });

    // Analyze lyrics
    const result = await analyzeLyrics(lyrics, userId, {
      genre: genre as Genre,
      suggestedStructure,
    });

    // Emit WebSocket events if trackId provided
    if (trackId) {
      emitLyricsAnalyzed(userId, trackId, {
        structure: result.structure,
        cost: result.cost,
      });

      emitLyricsSectionLabels(userId, trackId, result.structure.sections);

      if (result.recommendations && result.recommendations.length > 0) {
        emitLyricsRecommendations(userId, trackId, result.recommendations);
      }
    }

    res.json({
      success: true,
      analysis: result,
      validation: {
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    logger.error('[LyricsRoutes] Analysis failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to analyze lyrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/lyrics/recommendations
 * Get genre-specific recommendations for existing structure
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { structure, genre } = req.body;

    const userId = 'user-123';

    if (!structure || !genre) {
      return res.status(400).json({
        error: 'Structure and genre are required',
      });
    }

    // Check budget limits
    const canProceed = await canMakeApiCall(userId);
    if (!canProceed) {
      return res.status(429).json({
        error: 'Budget limit exceeded',
        message: 'Your daily or monthly budget limit has been reached',
      });
    }

    logger.info('[LyricsRoutes] Getting genre recommendations', {
      userId,
      genre,
    });

    // This would call the genre advice function from the service
    // For now, return a placeholder
    res.json({
      success: true,
      recommendations: [],
      genre,
    });
  } catch (error) {
    logger.error('[LyricsRoutes] Recommendations failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/lyrics/cost-estimate
 * Estimate cost for lyrics analysis
 */
router.get('/cost-estimate', async (req, res) => {
  try {
    const { lyricsLength, includeGenreAdvice } = req.query;

    if (!lyricsLength) {
      return res.status(400).json({
        error: 'lyricsLength query parameter is required',
      });
    }

    const length = parseInt(lyricsLength as string, 10);
    if (isNaN(length) || length <= 0) {
      return res.status(400).json({
        error: 'Invalid lyricsLength value',
      });
    }

    // Create sample lyrics of specified length
    const sampleLyrics = 'A'.repeat(length);
    const includeAdvice = includeGenreAdvice === 'true';

    const estimate = estimateLyricsAnalysisCost(sampleLyrics, includeAdvice);

    res.json({
      success: true,
      estimate: {
        estimatedCost: estimate.estimatedCost,
        inputTokens: estimate.inputTokens,
        outputTokens: estimate.outputTokens,
        breakdown: estimate.breakdown,
      },
    });
  } catch (error) {
    logger.error('[LyricsRoutes] Cost estimate failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to estimate cost',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/lyrics/validate
 * Quick validation of lyrics without full analysis
 */
router.post('/validate', async (req, res) => {
  try {
    const { lyrics } = req.body;

    if (!lyrics || typeof lyrics !== 'string') {
      return res.status(400).json({
        error: 'Lyrics text is required',
      });
    }

    const validation = quickLyricsValidation(lyrics);

    res.json({
      success: true,
      validation: {
        valid: validation.valid,
        warnings: validation.warnings,
        lyricsLength: lyrics.length,
        lineCount: lyrics.split('\n').filter(l => l.trim() !== '').length,
      },
    });
  } catch (error) {
    logger.error('[LyricsRoutes] Validation failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to validate lyrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
