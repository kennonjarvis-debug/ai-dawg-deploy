/**
 * Training Metadata Service
 * Stores and manages metadata for AI model training
 * Collects data from every beat generation for future fine-tuning
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import type {
  GenerationMetadataForTraining,
  VocalCharacteristics,
  RhythmCharacteristics,
  StyleMetadata,
} from '../../api/types';

const prisma = new PrismaClient();

export interface SaveMetadataParams {
  userId: string;
  generationId: string;
  userPrompt: string;
  aiEnhancedPrompt?: string;
  generationParams: {
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    style?: string;
    duration?: number;
    model?: string;
    provider?: string;
    instrumental?: boolean;
    customLyrics?: string;
  };
  audioUrl: string;
  duration: number;
  format: string;
  analysisMetadata?: {
    vocalCharacteristics?: VocalCharacteristics;
    rhythmCharacteristics?: RhythmCharacteristics;
    styleMetadata?: StyleMetadata;
    analyzedAt?: string;
  };
  audioEmbedding?: number[];
  spectralFeatures?: {
    spectralCentroid: number;
    spectralRolloff: number;
    mfcc: number[];
    chromagram?: number[];
  };
  provider: string;
  modelUsed?: string;
  generationCost?: number;
  generationDuration?: number;
}

export class TrainingMetadataService {
  /**
   * Save metadata from a generation for future training
   */
  async saveMetadata(params: SaveMetadataParams): Promise<string> {
    try {
      logger.info('Saving training metadata', {
        generationId: params.generationId,
        userId: params.userId,
        provider: params.provider,
      });

      const metadata = await prisma.trainingMetadata.create({
        data: {
          userId: params.userId,
          generationId: params.generationId,
          userPrompt: params.userPrompt,
          aiEnhancedPrompt: params.aiEnhancedPrompt,
          generationParams: JSON.stringify(params.generationParams),
          audioUrl: params.audioUrl,
          duration: params.duration,
          format: params.format,
          analysisMetadata: params.analysisMetadata
            ? JSON.stringify(params.analysisMetadata)
            : null,
          audioEmbedding: params.audioEmbedding
            ? JSON.stringify(params.audioEmbedding)
            : null,
          spectralFeatures: params.spectralFeatures
            ? JSON.stringify(params.spectralFeatures)
            : null,
          provider: params.provider,
          modelUsed: params.modelUsed,
          generationCost: params.generationCost,
          generationDuration: params.generationDuration,
          // Compute initial quality score based on analysis
          qualityScore: this.computeQualityScore(params),
        },
      });

      logger.info('Training metadata saved successfully', {
        id: metadata.id,
        generationId: params.generationId,
      });

      return metadata.id;
    } catch (error: any) {
      logger.error('Failed to save training metadata', {
        error: error.message,
        generationId: params.generationId,
      });
      throw error;
    }
  }

  /**
   * Update user feedback for a generation
   */
  async updateFeedback(
    generationId: string,
    feedback: {
      liked?: boolean;
      rating?: number;
      feedback?: string;
      used?: boolean;
    }
  ): Promise<void> {
    try {
      logger.info('Updating user feedback', {
        generationId,
        feedback,
      });

      const existingMetadata = await prisma.trainingMetadata.findUnique({
        where: { generationId },
      });

      if (!existingMetadata) {
        throw new Error(`Training metadata not found for generation ${generationId}`);
      }

      // Merge with existing feedback if any
      const existingFeedback = existingMetadata.userFeedback
        ? JSON.parse(existingMetadata.userFeedback)
        : {};

      const updatedFeedback = {
        ...existingFeedback,
        ...feedback,
        feedbackTimestamp: new Date().toISOString(),
      };

      await prisma.trainingMetadata.update({
        where: { generationId },
        data: {
          userFeedback: JSON.stringify(updatedFeedback),
          // Update quality score based on feedback
          qualityScore: this.computeQualityScoreWithFeedback(
            existingMetadata,
            updatedFeedback
          ),
        },
      });

      logger.info('User feedback updated successfully', {
        generationId,
      });
    } catch (error: any) {
      logger.error('Failed to update user feedback', {
        error: error.message,
        generationId,
      });
      throw error;
    }
  }

  /**
   * Get metadata for a specific generation
   */
  async getMetadata(generationId: string): Promise<GenerationMetadataForTraining | null> {
    try {
      const metadata = await prisma.trainingMetadata.findUnique({
        where: { generationId },
      });

      if (!metadata) {
        return null;
      }

      return this.mapToAPIType(metadata);
    } catch (error: any) {
      logger.error('Failed to get training metadata', {
        error: error.message,
        generationId,
      });
      throw error;
    }
  }

  /**
   * Get all metadata for training (with optional filters)
   */
  async getTrainingDataset(options: {
    provider?: string;
    minQualityScore?: number;
    hasUserFeedback?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<GenerationMetadataForTraining[]> {
    try {
      const where: any = {};

      if (options.provider) {
        where.provider = options.provider;
      }

      if (options.minQualityScore !== undefined) {
        where.qualityScore = { gte: options.minQualityScore };
      }

      if (options.hasUserFeedback) {
        where.userFeedback = { not: null };
      }

      const metadata = await prisma.trainingMetadata.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 1000,
        skip: options.offset || 0,
      });

      return metadata.map((m) => this.mapToAPIType(m));
    } catch (error: any) {
      logger.error('Failed to get training dataset', {
        error: error.message,
        options,
      });
      throw error;
    }
  }

  /**
   * Export training dataset to JSONL format (for model fine-tuning)
   */
  async exportTrainingDataset(options: {
    provider?: string;
    minQualityScore?: number;
    format?: 'jsonl' | 'csv';
  } = {}): Promise<string> {
    try {
      const dataset = await this.getTrainingDataset({
        provider: options.provider,
        minQualityScore: options.minQualityScore || 0.5,
        limit: 10000,
      });

      logger.info('Exporting training dataset', {
        count: dataset.length,
        provider: options.provider,
        format: options.format || 'jsonl',
      });

      if (options.format === 'csv') {
        return this.exportToCSV(dataset);
      } else {
        return this.exportToJSONL(dataset);
      }
    } catch (error: any) {
      logger.error('Failed to export training dataset', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark metadata as used for training
   */
  async markAsUsedForTraining(generationIds: string[], epoch: number): Promise<void> {
    try {
      await prisma.trainingMetadata.updateMany({
        where: {
          generationId: { in: generationIds },
        },
        data: {
          usedForTraining: true,
          trainingEpoch: epoch,
        },
      });

      logger.info('Marked metadata as used for training', {
        count: generationIds.length,
        epoch,
      });
    } catch (error: any) {
      logger.error('Failed to mark metadata as used for training', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Compute quality score based on analysis metadata
   */
  private computeQualityScore(params: SaveMetadataParams): number {
    let score = 0.5; // Default score

    if (params.analysisMetadata) {
      const { rhythmCharacteristics, vocalCharacteristics, styleMetadata } =
        params.analysisMetadata;

      // Higher score for confident rhythm detection
      if (rhythmCharacteristics?.confidence) {
        score += rhythmCharacteristics.confidence * 0.2;
      }

      // Higher score for stable tempo
      if (rhythmCharacteristics?.tempoStability) {
        score += rhythmCharacteristics.tempoStability * 0.1;
      }

      // Higher score for good vocal characteristics
      if (vocalCharacteristics && !vocalCharacteristics.hasClipping) {
        score += 0.1;
      }

      // Higher score for clear genre classification
      if (styleMetadata?.genre && styleMetadata.genre !== 'other') {
        score += 0.1;
      }

      // Normalize to 0-1 range
      score = Math.min(Math.max(score, 0), 1);
    }

    return score;
  }

  /**
   * Compute quality score with user feedback
   */
  private computeQualityScoreWithFeedback(
    metadata: any,
    feedback: any
  ): number {
    let score = metadata.qualityScore || 0.5;

    // User liked it: boost score
    if (feedback.liked === true) {
      score += 0.2;
    } else if (feedback.liked === false) {
      score -= 0.2;
    }

    // User rating: scale to 0-1
    if (feedback.rating !== undefined) {
      const ratingScore = feedback.rating / 5; // 1-5 stars -> 0.2-1.0
      score = (score + ratingScore) / 2; // Average with existing score
    }

    // User actually used it in a project: significant boost
    if (feedback.used === true) {
      score += 0.3;
    }

    // Normalize to 0-1 range
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Map database model to API type
   */
  private mapToAPIType(metadata: any): GenerationMetadataForTraining {
    return {
      id: metadata.id,
      userId: metadata.userId,
      generationId: metadata.generationId,
      userPrompt: metadata.userPrompt,
      aiEnhancedPrompt: metadata.aiEnhancedPrompt,
      generationParams: JSON.parse(metadata.generationParams),
      audioUrl: metadata.audioUrl,
      duration: metadata.duration,
      format: metadata.format,
      analysisMetadata: metadata.analysisMetadata
        ? JSON.parse(metadata.analysisMetadata)
        : undefined,
      audioEmbedding: metadata.audioEmbedding
        ? JSON.parse(metadata.audioEmbedding)
        : undefined,
      spectralFeatures: metadata.spectralFeatures
        ? JSON.parse(metadata.spectralFeatures)
        : undefined,
      userFeedback: metadata.userFeedback
        ? JSON.parse(metadata.userFeedback)
        : undefined,
      provider: metadata.provider,
      modelUsed: metadata.modelUsed,
      generationCost: metadata.generationCost,
      generationDuration: metadata.generationDuration,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  /**
   * Export dataset to JSONL format
   */
  private exportToJSONL(dataset: GenerationMetadataForTraining[]): string {
    return dataset
      .map((item) => {
        // Format for MusicGen fine-tuning
        const trainingExample = {
          prompt: item.aiEnhancedPrompt || item.userPrompt,
          audio_url: item.audioUrl,
          duration: item.duration,
          metadata: {
            genre: item.generationParams.genre,
            bpm: item.generationParams.bpm,
            key: item.generationParams.key,
            mood: item.generationParams.mood,
            analysis: item.analysisMetadata,
          },
          feedback: item.userFeedback,
          quality_score: item.userFeedback?.rating || 3,
        };
        return JSON.stringify(trainingExample);
      })
      .join('\n');
  }

  /**
   * Export dataset to CSV format
   */
  private exportToCSV(dataset: GenerationMetadataForTraining[]): string {
    const headers = [
      'generationId',
      'userPrompt',
      'aiEnhancedPrompt',
      'audioUrl',
      'duration',
      'genre',
      'bpm',
      'key',
      'mood',
      'provider',
      'rating',
      'liked',
      'used',
      'qualityScore',
    ];

    const rows = dataset.map((item) => {
      return [
        item.generationId,
        `"${item.userPrompt.replace(/"/g, '""')}"`,
        `"${(item.aiEnhancedPrompt || '').replace(/"/g, '""')}"`,
        item.audioUrl,
        item.duration,
        item.generationParams.genre || '',
        item.generationParams.bpm || '',
        item.generationParams.key || '',
        item.generationParams.mood || '',
        item.provider,
        item.userFeedback?.rating || '',
        item.userFeedback?.liked || '',
        item.userFeedback?.used || '',
        '', // qualityScore not in API type
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get statistics about training data
   */
  async getStatistics(): Promise<{
    totalGenerations: number;
    byProvider: Record<string, number>;
    withFeedback: number;
    averageQualityScore: number;
    usedForTraining: number;
  }> {
    try {
      const [totalGenerations, withFeedback, usedForTraining, avgQuality, byProvider] =
        await Promise.all([
          prisma.trainingMetadata.count(),
          prisma.trainingMetadata.count({
            where: { userFeedback: { not: null } },
          }),
          prisma.trainingMetadata.count({
            where: { usedForTraining: true },
          }),
          prisma.trainingMetadata.aggregate({
            _avg: { qualityScore: true },
          }),
          prisma.trainingMetadata.groupBy({
            by: ['provider'],
            _count: true,
          }),
        ]);

      const byProviderMap: Record<string, number> = {};
      byProvider.forEach((item) => {
        byProviderMap[item.provider] = item._count;
      });

      return {
        totalGenerations,
        byProvider: byProviderMap,
        withFeedback,
        averageQualityScore: avgQuality._avg.qualityScore || 0,
        usedForTraining,
      };
    } catch (error: any) {
      logger.error('Failed to get training statistics', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export const trainingMetadataService = new TrainingMetadataService();
