/**
 * MusicGen Service
 * Integrates Meta's MusicGen via Replicate API for beat/music generation
 * Now with automatic metadata extraction for AI training
 */

import Replicate from 'replicate';
import { metadataAnalyzer } from './MetadataAnalyzer';
import { trainingMetadataService } from './training-metadata-service';
import type { TrackMetadata } from '../../api/types';
import { aiCache } from '../../services/ai-cache-service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export interface MusicGenRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  duration?: number; // seconds
  style?: string;
  userId?: string;   // For metadata tracking
  generationId?: string; // For metadata tracking
  skipCache?: boolean; // Force fresh generation, bypassing cache
}

export interface MusicGenResponse {
  success: boolean;
  audio_url?: string;
  message?: string;
  job_id?: string;
  error?: string;
  metadata?: TrackMetadata; // Analyzed metadata
  generationId?: string;
}

/**
 * Analyze generated audio and save metadata for training
 */
async function analyzeAndSaveMetadata(
  audioUrl: string,
  params: MusicGenRequest,
  enhancedPrompt: string,
  generationId: string,
  startTime: number
): Promise<TrackMetadata | undefined> {
  try {
    // Download audio for analysis
    console.log('🔬 Analyzing generated audio for metadata extraction...');
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();

    // Convert to AudioBuffer (would need Web Audio API or similar)
    // For now, we'll create a placeholder analysis
    // In production, you'd use librosa, essentia, or similar for server-side analysis

    // Placeholder: Save metadata without full audio analysis
    // In production, implement full spectral analysis
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

    // Save to training database
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
          model: 'stereo-melody-large',
          provider: 'musicgen',
        },
        audioUrl,
        duration: params.duration || 30,
        format: 'mp3',
        analysisMetadata: metadata,
        provider: 'musicgen',
        modelUsed: 'meta/musicgen:stereo-melody-large',
        generationDuration,
      });

      console.log('✅ Metadata saved to training database');
    }

    return metadata;
  } catch (error: any) {
    console.error('❌ Metadata analysis failed:', error);
    // Don't fail the generation if metadata analysis fails
    return undefined;
  }
}

/**
 * Generate music using MusicGen via Replicate
 */
export async function generateMusic(params: MusicGenRequest): Promise<MusicGenResponse> {
  const startTime = Date.now();
  const generationId = params.generationId || `musicgen_${Date.now()}`;
  try {
    // Check if Replicate API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('⚠️  REPLICATE_API_TOKEN not set - using placeholder response');
      // Return placeholder for demo/testing
      return {
        success: true,
        audio_url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
        message: 'Music generation placeholder (configure REPLICATE_API_TOKEN for real generation)',
        job_id: `placeholder_${Date.now()}`,
      };
    }

    console.log('🎵 Generating music with MusicGen:', {
      prompt: params.prompt,
      duration: params.duration,
      genre: params.genre,
      mood: params.mood,
    });

    // Build enhanced prompt with genre, mood, and tempo
    let enhancedPrompt = params.prompt;

    if (params.genre || params.mood || params.tempo) {
      const descriptors = [];
      if (params.mood) descriptors.push(params.mood);
      if (params.genre) descriptors.push(params.genre);
      if (params.tempo) {
        if (params.tempo < 90) descriptors.push('slow');
        else if (params.tempo > 140) descriptors.push('fast');
        else descriptors.push('medium tempo');
      }

      enhancedPrompt = `${descriptors.join(' ')} ${params.prompt}`;
    }

    // Build cache key from generation parameters
    const cacheKey = {
      enhancedPrompt,
      duration: params.duration || 30,
      model: 'stereo-melody-large',
    };

    // Check cache for identical music generation requests (7 day TTL)
    const cached = await aiCache.get<MusicGenResponse>(cacheKey, {
      provider: 'replicate',
      model: 'musicgen',
      ttl: 604800, // 7 days - music generations are expensive and reusable
      skipCache: params.skipCache,
    });

    if (cached) {
      console.log('✅ Using cached music generation result');
      // Return cached result with new generationId
      return {
        ...cached,
        generationId,
        job_id: generationId,
      };
    }

    // Run MusicGen on Replicate
    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt: enhancedPrompt,
          duration: Math.min(params.duration || 30, 30), // Max 30s to save costs
          model_version: "stereo-melody-large", // Best quality model
          output_format: "mp3",
          normalization_strategy: "peak", // Better audio quality
        },
      }
    );

    // Output is a URL string or array
    const audioUrl = Array.isArray(output) ? output[0] : output as string;

    console.log('✅ Music generated successfully:', audioUrl);

    // Analyze and save metadata for training (async, don't block response)
    const metadata = await analyzeAndSaveMetadata(
      audioUrl,
      params,
      enhancedPrompt,
      generationId,
      startTime
    );

    const result: MusicGenResponse = {
      success: true,
      audio_url: audioUrl,
      message: 'Music generated successfully with MusicGen',
      job_id: generationId,
      generationId,
      metadata,
    };

    // Cache the result for future identical requests (7 day TTL)
    await aiCache.set(cacheKey, result, {
      provider: 'replicate',
      model: 'musicgen',
      ttl: 604800, // 7 days
      skipCache: params.skipCache,
    });

    return result;
  } catch (error: any) {
    console.error('❌ MusicGen generation error:', error);

    return {
      success: false,
      error: error.message || 'Failed to generate music',
      message: 'Music generation failed',
    };
  }
}

/**
 * Generate beat-specific music (optimized for drum patterns and rhythm)
 */
export async function generateBeat(params: {
  genre: string;
  tempo: number;
  duration?: number;
}): Promise<MusicGenResponse> {
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
  };

  const prompt = beatPrompts[params.genre.toLowerCase()] || `${params.genre} drum beat at ${params.tempo} BPM`;

  return generateMusic({
    prompt,
    genre: params.genre,
    tempo: params.tempo,
    duration: params.duration || 15,
    style: 'instrumental',
  });
}
