/**
 * Training Metadata API Routes
 * Endpoints for managing AI training data collection
 */

import { Router } from 'express';
import { trainingMetadataService } from '../services/training-metadata-service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/training-metadata
 * Save metadata after generation
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      generationId,
      userPrompt,
      aiEnhancedPrompt,
      generationParams,
      audioUrl,
      duration,
      format,
      analysisMetadata,
      audioEmbedding,
      spectralFeatures,
      provider,
      modelUsed,
      generationCost,
      generationDuration,
    } = req.body;

    // Validate required fields
    if (!userId || !generationId || !userPrompt || !audioUrl || !provider) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'generationId', 'userPrompt', 'audioUrl', 'provider'],
      });
    }

    const metadataId = await trainingMetadataService.saveMetadata({
      userId,
      generationId,
      userPrompt,
      aiEnhancedPrompt,
      generationParams: generationParams || {},
      audioUrl,
      duration: duration || 30,
      format: format || 'mp3',
      analysisMetadata,
      audioEmbedding,
      spectralFeatures,
      provider,
      modelUsed,
      generationCost,
      generationDuration,
    });

    res.json({
      success: true,
      metadataId,
      message: 'Training metadata saved successfully',
    });
  } catch (error: any) {
    logger.error('Failed to save training metadata', { error: error.message });
    res.status(500).json({
      error: 'Failed to save training metadata',
      message: error.message,
    });
  }
});

/**
 * PUT /api/training-metadata/:generationId/feedback
 * Update user feedback for a generation
 */
router.put('/:generationId/feedback', async (req, res) => {
  try {
    const { generationId } = req.params;
    const { liked, rating, feedback, used } = req.body;

    await trainingMetadataService.updateFeedback(generationId, {
      liked,
      rating,
      feedback,
      used,
    });

    res.json({
      success: true,
      message: 'Feedback updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update feedback', {
      error: error.message,
      generationId: req.params.generationId,
    });

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Generation not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to update feedback',
      message: error.message,
    });
  }
});

/**
 * GET /api/training-metadata/:generationId
 * Get metadata for a specific generation
 */
router.get('/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;

    const metadata = await trainingMetadataService.getMetadata(generationId);

    if (!metadata) {
      return res.status(404).json({
        error: 'Metadata not found',
        message: `No training metadata found for generation ${generationId}`,
      });
    }

    res.json({
      success: true,
      metadata,
    });
  } catch (error: any) {
    logger.error('Failed to get training metadata', {
      error: error.message,
      generationId: req.params.generationId,
    });
    res.status(500).json({
      error: 'Failed to get training metadata',
      message: error.message,
    });
  }
});

/**
 * GET /api/training-metadata/dataset
 * Get training dataset (with filters)
 */
router.get('/dataset/query', async (req, res) => {
  try {
    const {
      provider,
      minQualityScore,
      hasUserFeedback,
      limit,
      offset,
    } = req.query;

    const dataset = await trainingMetadataService.getTrainingDataset({
      provider: provider as string | undefined,
      minQualityScore: minQualityScore ? parseFloat(minQualityScore as string) : undefined,
      hasUserFeedback: hasUserFeedback === 'true',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      count: dataset.length,
      dataset,
    });
  } catch (error: any) {
    logger.error('Failed to get training dataset', { error: error.message });
    res.status(500).json({
      error: 'Failed to get training dataset',
      message: error.message,
    });
  }
});

/**
 * GET /api/training-metadata/export
 * Export training dataset to JSONL or CSV
 */
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { provider, minQualityScore } = req.query;

    if (format !== 'jsonl' && format !== 'csv') {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Format must be "jsonl" or "csv"',
      });
    }

    const exportData = await trainingMetadataService.exportTrainingDataset({
      provider: provider as string | undefined,
      minQualityScore: minQualityScore ? parseFloat(minQualityScore as string) : undefined,
      format: format as 'jsonl' | 'csv',
    });

    // Set appropriate headers for download
    const filename = `training-dataset-${Date.now()}.${format}`;
    const mimeType = format === 'jsonl' ? 'application/x-ndjson' : 'text/csv';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error: any) {
    logger.error('Failed to export training dataset', { error: error.message });
    res.status(500).json({
      error: 'Failed to export training dataset',
      message: error.message,
    });
  }
});

/**
 * GET /api/training-metadata/statistics
 * Get statistics about training data
 */
router.get('/statistics/overview', async (req, res) => {
  try {
    const stats = await trainingMetadataService.getStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error: any) {
    logger.error('Failed to get training statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get training statistics',
      message: error.message,
    });
  }
});

/**
 * POST /api/training-metadata/mark-used
 * Mark metadata as used for training
 */
router.post('/mark-used', async (req, res) => {
  try {
    const { generationIds, epoch } = req.body;

    if (!generationIds || !Array.isArray(generationIds) || generationIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'generationIds must be a non-empty array',
      });
    }

    if (typeof epoch !== 'number') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'epoch must be a number',
      });
    }

    await trainingMetadataService.markAsUsedForTraining(generationIds, epoch);

    res.json({
      success: true,
      message: `Marked ${generationIds.length} generations as used for training`,
      count: generationIds.length,
      epoch,
    });
  } catch (error: any) {
    logger.error('Failed to mark metadata as used', { error: error.message });
    res.status(500).json({
      error: 'Failed to mark metadata as used for training',
      message: error.message,
    });
  }
});

export default router;
