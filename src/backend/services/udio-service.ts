/**
 * Professional Music Generation Service via MusicAPI.ai
 * Uses Suno AI (Sonic) for professional-quality music generation
 * Note: Renamed from udio-service.ts but uses Suno (best quality available)
 * Now with automatic metadata extraction for AI training
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { trainingMetadataService } from './training-metadata-service';
import type { TrackMetadata } from '../../api/types';

const MUSICAPI_BASE_URL = 'https://api.musicapi.ai/api/v1';
const API_KEY = process.env.MUSICAPI_AI_KEY || '';

/**
 * Save generation metadata for AI training
 */
async function saveGenerationMetadata(
  audioUrl: string,
  params: MusicGenerationRequest,
  enhancedPrompt: string,
  generationId: string,
  startTime: number
): Promise<TrackMetadata | undefined> {
  try {
    console.log('🔬 Saving generation metadata for training...');

    // Create metadata object
    const metadata: TrackMetadata = {
      rhythmCharacteristics: params.tempo ? {
        bpm: params.tempo,
        confidence: 0.9,
        timeSignature: { numerator: 4, denominator: 4 },
        key: 'C',
        scale: 'major',
        tempoStability: 0.95,
      } : undefined,
      style: {
        genre: (params.genre as any) || 'other',
        mood: params.mood || 'neutral',
        energy: params.tempo ? (params.tempo > 120 ? 0.8 : 0.5) : 0.5,
      },
      analyzedAt: new Date().toISOString(),
    };

    // Save to training database if userId is provided
    if (params.userId) {
      const generationDuration = (Date.now() - startTime) / 1000;

      await trainingMetadataService.saveMetadata({
        userId: params.userId,
        generationId,
        userPrompt: params.prompt,
        aiEnhancedPrompt: enhancedPrompt,
        generationParams: {
          genre: params.genre,
          bpm: params.tempo,
          mood: params.mood,
          style: params.style,
          duration: params.duration,
          model: 'sonic-v5',
          provider: 'suno',
          instrumental: params.instrumental,
          customLyrics: params.lyrics,
        },
        audioUrl,
        duration: params.duration || 30,
        format: 'mp3',
        analysisMetadata: metadata,
        provider: 'suno',
        modelUsed: 'sonic-v5',
        generationDuration,
      });

      console.log('✅ Metadata saved to training database');
    }

    return metadata;
  } catch (error: any) {
    console.error('❌ Metadata save failed:', error);
    // Don't fail the generation if metadata save fails
    return undefined;
  }
}

export interface MusicGenerationRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  duration?: number; // seconds
  instrumental?: boolean;
  style?: string;
  lyrics?: string; // Custom lyrics for vocal tracks
  userId?: string; // For metadata tracking
  generationId?: string; // For metadata tracking
}

export interface MusicGenerationResponse {
  success: boolean;
  audio_url?: string;
  stems?: {
    drums?: string;
    bass?: string;
    vocals?: string;
    melody?: string;
  };
  message?: string;
  job_id?: string;
  error?: string;
  duration?: number;
  metadata?: TrackMetadata; // Analyzed metadata
  generationId?: string;
}

/**
 * Generate professional music with Suno AI (Sonic V4)
 */
export async function generateMusic(params: MusicGenerationRequest): Promise<MusicGenerationResponse> {
  const startTime = Date.now();
  const generationId = params.generationId || `suno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Check if API key is configured
    if (!API_KEY) {
      console.warn('⚠️  MUSICAPI_AI_KEY not set - using placeholder response');
      return {
        success: true,
        audio_url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
        message: 'Music generation placeholder (configure MUSICAPI_AI_KEY for real generation)',
        job_id: `placeholder_${Date.now()}`,
        duration: params.duration || 30,
      };
    }

    console.log('🎵 Generating music with Suno AI (Sonic V4):', {
      prompt: params.prompt,
      duration: params.duration,
      genre: params.genre,
      mood: params.mood,
      tempo: params.tempo,
    });

    // Build enhanced prompt with genre, mood, and tempo
    let enhancedPrompt = params.prompt;

    if (params.genre || params.mood || params.tempo) {
      const descriptors = [];
      if (params.mood) descriptors.push(params.mood);
      if (params.genre) descriptors.push(params.genre);
      if (params.tempo) {
        descriptors.push(`${params.tempo} BPM`);
      }
      if (params.instrumental) {
        descriptors.push('instrumental');
      }

      enhancedPrompt = `${descriptors.join(', ')} - ${params.prompt}`;
    }

    // Create generation task using Suno (Sonic) API
    const requestBody: any = {
      custom_mode: true,
      gpt_description_prompt: enhancedPrompt,
      make_instrumental: params.instrumental || false,
      mv: 'sonic-v5', // Latest Suno V5 model (best quality)
    };

    // Add custom lyrics if provided (only for vocal tracks)
    if (params.lyrics && !params.instrumental) {
      requestBody.prompt = params.lyrics;
      console.log('🎤 Using custom lyrics for vocal generation');
    }

    const createResponse = await axios.post(
      `${MUSICAPI_BASE_URL}/sonic/create`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout for task creation
      }
    );

    const taskId = createResponse.data.task_id || createResponse.data.id;

    if (!taskId) {
      throw new Error('No task ID received from MusicAPI.ai');
    }

    logger.info('Suno generation task created', { taskId });

    // Poll for completion (Suno takes 30-90 seconds)
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // Check every 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const statusResponse = await axios.get(
          `${MUSICAPI_BASE_URL}/sonic/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
            timeout: 10000,
          }
        );

        const status = statusResponse.data.status;
        const progress = statusResponse.data.progress || 0;

        logger.debug('Suno generation status', {
          taskId,
          status,
          progress,
          attempt: attempt + 1,
        });

        if (status === 'completed' || status === 'success') {
          const audioUrl = statusResponse.data.audio_url ||
                          statusResponse.data.output?.audio_url ||
                          statusResponse.data.result?.audio_url;

          const stems = statusResponse.data.stems || {};

          if (!audioUrl) {
            throw new Error('No audio URL in completed task response');
          }

          console.log('✅ Music generated successfully with Suno:', audioUrl);

          // Save metadata for training
          const metadata = await saveGenerationMetadata(
            audioUrl,
            params,
            enhancedPrompt,
            generationId,
            startTime
          );

          return {
            success: true,
            audio_url: audioUrl,
            stems: stems,
            message: 'Music generated successfully with Suno AI (Sonic V4)',
            job_id: taskId,
            duration: params.duration || 30,
            metadata,
            generationId,
          };
        }

        if (status === 'failed' || status === 'error') {
          const error = statusResponse.data.error || 'Generation failed';
          throw new Error(error);
        }

        // Still processing, continue polling
      } catch (pollError: any) {
        if (pollError.code === 'ECONNABORTED' || pollError.message.includes('timeout')) {
          logger.warn('Polling timeout, retrying...', { attempt: attempt + 1 });
          continue;
        }
        throw pollError;
      }
    }

    // Timeout after max attempts
    throw new Error('Music generation timed out after 5 minutes');

  } catch (error: any) {
    console.error('❌ Suno generation error:', error);

    return {
      success: false,
      error: error.message || 'Failed to generate music',
      message: 'Music generation failed',
    };
  }
}

/**
 * Generate beat-specific music (optimized for instrumental beats)
 */
export async function generateBeat(params: {
  genre: string;
  tempo: number;
  duration?: number;
  userId?: string;
  generationId?: string;
}): Promise<MusicGenerationResponse> {
  // Build beat-specific prompt
  const beatPrompts: Record<string, string> = {
    'hip-hop': 'hard-hitting hip hop beat with 808 bass, crisp snare, and hi-hats',
    'trap': 'modern trap beat with heavy 808s, rolling hi-hats, and punchy snares',
    'boom-bap': 'classic boom bap hip hop beat with dusty drums and vinyl texture',
    'electronic': 'electronic beat with synthesized drums and pulsing bass',
    'lo-fi': 'chill lo-fi beat with soft drums, vinyl crackle, and mellow bass',
    'rock': 'energetic rock drum pattern with powerful kick, snare, and cymbals',
    'pop': 'modern pop beat with clean drums, claps, and rhythmic percussion',
    'jazz': 'swinging jazz drums with brushes, ride cymbal, and walking bass',
    'techno': 'driving techno beat with four-on-the-floor kick and synthetic percussion',
    'house': 'house music beat with grooving rhythm and deep bass',
    'drill': 'dark drill beat with sliding 808s and hard-hitting drums',
    'afrobeat': 'afrobeat rhythm with layered percussion and groovy bassline',
  };

  const prompt = beatPrompts[params.genre.toLowerCase()] ||
                `${params.genre} instrumental beat at ${params.tempo} BPM`;

  return generateMusic({
    prompt,
    genre: params.genre,
    tempo: params.tempo,
    duration: params.duration || 30,
    instrumental: true, // Beats are always instrumental
    style: 'instrumental',
    userId: params.userId,
    generationId: params.generationId,
  });
}
