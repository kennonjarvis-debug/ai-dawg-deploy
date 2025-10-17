/**
 * Music Generation Client
 * Abstraction layer for AI music generation APIs (Replicate)
 */

import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export interface MusicGenerationParams {
  prompt: string;              // Text description of desired music
  duration?: number;           // Duration in seconds (default: 30, max: 120)
  model?: 'small' | 'medium' | 'large' | 'melody';
  temperature?: number;        // Creativity (0-1, default: 1)
  topK?: number;               // Sampling parameter (default: 250)
  topP?: number;               // Nucleus sampling (default: 0)
  continuation?: boolean;      // Continue from melody input
  melodyInput?: string;        // Audio file URL for melody conditioning
  normalizationStrategy?: 'loudness' | 'clip' | 'peak' | 'rms';
}

export interface MusicGenerationResult {
  audioUrl: string;
  duration: number;
  model: string;
  prompt: string;
  cost?: number;
}

export interface GenerationProgress {
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  progress?: number;           // 0-100
  logs?: string[];
  error?: string;
}

/**
 * Generate music from text description
 */
export async function generateMusicFromText(
  params: MusicGenerationParams
): Promise<MusicGenerationResult> {
  const {
    prompt,
    duration = 30,
    model = 'medium',
    temperature = 1,
    topK = 250,
    topP = 0,
    normalizationStrategy = 'loudness',
  } = params;

  // Map model to Replicate model version
  const modelVersion = getModelVersion(model);

  try {
    const output = await replicate.run(
      modelVersion as any,
      {
        input: {
          prompt,
          duration,
          temperature,
          top_k: topK,
          top_p: topP,
          normalization_strategy: normalizationStrategy,
        },
      }
    ) as any;

    // Replicate returns audio URL
    const audioUrl = Array.isArray(output) ? output[0] : output;

    return {
      audioUrl,
      duration,
      model,
      prompt,
      cost: estimateCost(model, duration),
    };
  } catch (error: any) {
    console.error('Music generation error:', error);
    throw new Error(`Failed to generate music: ${error.message}`);
  }
}

/**
 * Generate music from melody (vocal recording)
 * Uses MusicGen Melody model with melody conditioning
 */
export async function generateMusicFromMelody(
  params: MusicGenerationParams & { melodyInput: string }
): Promise<MusicGenerationResult> {
  const {
    prompt,
    melodyInput,
    duration = 30,
    temperature = 1,
    topK = 250,
    topP = 0,
    normalizationStrategy = 'loudness',
  } = params;

  const modelVersion = 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb'; // melody model

  try {
    const output = await replicate.run(
      modelVersion as any,
      {
        input: {
          prompt,
          melody_audio: melodyInput, // URL to audio file
          duration,
          temperature,
          top_k: topK,
          top_p: topP,
          normalization_strategy: normalizationStrategy,
          continuation: true,
        },
      }
    ) as any;

    const audioUrl = Array.isArray(output) ? output[0] : output;

    return {
      audioUrl,
      duration,
      model: 'melody',
      prompt,
      cost: estimateCost('melody', duration),
    };
  } catch (error: any) {
    console.error('Melody-conditioned generation error:', error);
    throw new Error(`Failed to generate from melody: ${error.message}`);
  }
}

/**
 * Generate music with progress tracking
 * Returns a prediction ID that can be polled for status
 */
export async function generateMusicWithProgress(
  params: MusicGenerationParams
): Promise<{ predictionId: string; getProgress: () => Promise<GenerationProgress> }> {
  const {
    prompt,
    duration = 30,
    model = 'medium',
    temperature = 1,
    topK = 250,
    topP = 0,
    melodyInput,
    normalizationStrategy = 'loudness',
  } = params;

  const modelVersion = melodyInput
    ? 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb'
    : getModelVersion(model);

  try {
    const versionHash = modelVersion.split(':')[1];
    if (!versionHash) {
      throw new Error(`Invalid model version format: ${modelVersion}`);
    }

    const prediction = await replicate.predictions.create({
      version: versionHash,
      input: {
        prompt,
        duration,
        temperature,
        top_k: topK,
        top_p: topP,
        normalization_strategy: normalizationStrategy,
        ...(melodyInput && {
          melody_audio: melodyInput,
          continuation: true,
        }),
      },
    });

    return {
      predictionId: prediction.id,
      getProgress: async () => {
        const updated = await replicate.predictions.get(prediction.id);

        return {
          status: updated.status as any,
          progress: updated.status === 'processing' ? 50 : updated.status === 'succeeded' ? 100 : 0,
          logs: updated.logs ? [updated.logs] : [],
          error: updated.error ? String(updated.error) : undefined,
        };
      },
    };
  } catch (error: any) {
    console.error('Generation with progress error:', error);
    throw new Error(`Failed to start generation: ${error.message}`);
  }
}

/**
 * Get status of a running prediction
 */
export async function getGenerationStatus(predictionId: string): Promise<GenerationProgress> {
  try {
    const prediction = await replicate.predictions.get(predictionId);

    return {
      status: prediction.status as any,
      progress: prediction.status === 'processing' ? 50 : prediction.status === 'succeeded' ? 100 : 0,
      logs: prediction.logs ? [prediction.logs] : [],
      error: prediction.error ? String(prediction.error) : undefined,
    };
  } catch (error: any) {
    console.error('Status check error:', error);
    throw new Error(`Failed to get generation status: ${error.message}`);
  }
}

/**
 * Get audio URL from completed prediction
 */
export async function getGenerationResult(predictionId: string): Promise<string> {
  try {
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status !== 'succeeded') {
      throw new Error(`Generation not complete. Status: ${prediction.status}`);
    }

    const output = prediction.output as any;
    return Array.isArray(output) ? output[0] : output;
  } catch (error: any) {
    console.error('Result retrieval error:', error);
    throw new Error(`Failed to get generation result: ${error.message}`);
  }
}

/**
 * Build prompt from structured parameters
 */
export function buildMusicPrompt(params: {
  genre?: string;
  mood?: string;
  instruments?: string[];
  tempo?: string;
  key?: string;
  description?: string;
}): string {
  const parts: string[] = [];

  if (params.genre) parts.push(params.genre);
  if (params.mood) parts.push(params.mood);
  if (params.instruments && params.instruments.length > 0) {
    parts.push(`featuring ${params.instruments.join(', ')}`);
  }
  if (params.tempo) parts.push(`${params.tempo} tempo`);
  if (params.key) parts.push(`in ${params.key}`);
  if (params.description) parts.push(params.description);

  return parts.join(', ') || 'instrumental music';
}

// Helper functions

function getModelVersion(model: string): string {
  const versions = {
    small: 'meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906',
    medium: 'meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
    large: 'meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3a0d3b8e45e6',
    melody: 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
  };

  return versions[model as keyof typeof versions] || versions.medium;
}

function estimateCost(model: string, duration: number): number {
  // Replicate pricing: ~$0.08 per run for MusicGen
  // Cost scales slightly with duration and model size
  const baseCost = 0.08;
  const modelMultiplier = {
    small: 0.8,
    medium: 1.0,
    large: 1.3,
    melody: 1.1,
  };

  const multiplier = modelMultiplier[model as keyof typeof modelMultiplier] || 1.0;
  const durationMultiplier = Math.max(1, duration / 30); // Base is 30s

  return baseCost * multiplier * durationMultiplier;
}

/**
 * Validate API token
 */
export function validateReplicateToken(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

/**
 * Get cost estimate for a generation
 */
export function getCostEstimate(params: {
  model?: string;
  duration?: number;
}): number {
  return estimateCost(params.model || 'medium', params.duration || 30);
}
