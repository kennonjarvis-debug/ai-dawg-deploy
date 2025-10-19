/**
 * Expert Music AI Service
 * Integrates custom-trained MusicGen models via Replicate
 * Provides specialized instrument generation (Telecaster, Metro drums, etc.)
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { expertMusicHealthCheck } from './expert-music-health-check';

const EXPERT_MUSIC_AI_URL = process.env.EXPERT_MUSIC_AI_URL || 'http://localhost:8003';
const EXPERT_MUSIC_AI_ENABLED = process.env.EXPERT_MUSIC_AI_ENABLED === 'true';

export interface ExpertMusicRequest {
  prompt: string;
  instruments?: string[]; // ['telecaster', 'metro_drums', 'piano']
  style?: string; // 'morgan_wallen', 'metro_boomin', etc.
  include_vocals?: boolean;
  custom_lyrics?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  model_version?: string; // 'small', 'medium', 'melody', 'large'
}

export interface ExpertMusicResponse {
  success: boolean;
  audio_url?: string;
  model_used?: string;
  message: string;
  duration?: number;
  prediction_id?: string;
}

export interface AvailableModel {
  name: string;
  description: string;
  model_id: string;
  created_at: string;
  type: 'base' | 'fine_tuned';
}

/**
 * Check if Expert Music AI service is available
 * Now uses the health check service with circuit breaker
 */
export async function isExpertMusicAvailable(): Promise<boolean> {
  if (!EXPERT_MUSIC_AI_ENABLED) {
    return false;
  }

  // Use health check service to determine availability
  return expertMusicHealthCheck.isServiceAvailable();
}

/**
 * Generate music using Expert Music AI with custom models
 * Now includes circuit breaker protection
 */
export async function generateExpertMusic(
  params: ExpertMusicRequest
): Promise<ExpertMusicResponse> {
  try {
    if (!EXPERT_MUSIC_AI_ENABLED) {
      throw new Error('Expert Music AI is not enabled');
    }

    // Check circuit breaker before making request
    if (expertMusicHealthCheck.isCircuitOpen()) {
      const metrics = expertMusicHealthCheck.getMetrics();
      logger.warn('Circuit breaker is OPEN - blocking request to Expert Music AI', {
        consecutiveFailures: metrics.consecutiveFailures,
      });

      return {
        success: false,
        message: 'Expert Music AI service is temporarily unavailable (circuit breaker open). Please try again later or use an alternative service.',
      };
    }

    // Check if service is available
    if (!expertMusicHealthCheck.isServiceAvailable()) {
      logger.warn('Expert Music AI service not available');

      return {
        success: false,
        message: 'Expert Music AI service is currently unavailable. Please try an alternative service.',
      };
    }

    logger.info('Generating music with Expert Music AI', {
      instruments: params.instruments,
      style: params.style,
      duration: params.duration,
    });

    const response = await axios.post(
      `${EXPERT_MUSIC_AI_URL}/generate`,
      {
        prompt: params.prompt,
        instruments: params.instruments || [],
        style: params.style,
        include_vocals: params.include_vocals || false,
        custom_lyrics: params.custom_lyrics,
        duration: params.duration || 30,
        bpm: params.bpm,
        key: params.key,
        model_version: params.model_version || 'medium',
      },
      {
        timeout: 120000, // 2 minute timeout for generation
      }
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.message || 'Expert music generation failed');
    }

    logger.info('Expert music generated successfully', {
      model_used: data.model_used,
      audio_url: data.audio_url,
    });

    return {
      success: true,
      audio_url: data.audio_url,
      model_used: data.model_used,
      message: data.message,
      duration: data.duration,
      prediction_id: data.prediction_id,
    };
  } catch (error: any) {
    logger.error('Expert music generation error:', error);

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Expert music generation failed',
    };
  }
}

/**
 * Get list of available models (base + fine-tuned)
 */
export async function getAvailableModels(): Promise<AvailableModel[]> {
  try {
    const response = await axios.get(`${EXPERT_MUSIC_AI_URL}/models`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    logger.error('Error fetching available models:', error);
    return [];
  }
}

/**
 * Start training a new custom model
 */
export async function trainCustomModel(params: {
  instrument_name: string;
  description: string;
  dataset_url: string;
  model_version?: string;
  epochs?: number;
}): Promise<{
  success: boolean;
  training_id?: string;
  message: string;
}> {
  try {
    const response = await axios.post(
      `${EXPERT_MUSIC_AI_URL}/train`,
      {
        instrument_name: params.instrument_name,
        description: params.description,
        dataset_url: params.dataset_url,
        model_version: params.model_version || 'medium',
        epochs: params.epochs || 10,
        auto_labeling: true,
        drop_vocals: true,
      },
      {
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      success: data.success,
      training_id: data.training_id,
      message: data.message,
    };
  } catch (error: any) {
    logger.error('Training initiation error:', error);

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to start training',
    };
  }
}

/**
 * Check training status
 */
export async function getTrainingStatus(trainingId: string): Promise<{
  status: string;
  logs?: string;
}> {
  try {
    const response = await axios.get(
      `${EXPERT_MUSIC_AI_URL}/training/${trainingId}`,
      {
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Error checking training status:', error);
    return {
      status: 'error',
    };
  }
}

/**
 * Manually register a trained model
 */
export async function registerModel(params: {
  name: string;
  model_id: string;
  description: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(
      `${EXPERT_MUSIC_AI_URL}/register-model`,
      null,
      {
        params: {
          name: params.name,
          model_id: params.model_id,
          description: params.description,
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.detail || error.message || 'Failed to register model',
    };
  }
}
