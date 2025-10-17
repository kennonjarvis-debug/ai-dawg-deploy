/**
 * Music Generation API Endpoint
 * Generates instrumental backing tracks using Replicate (MusicGen)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMusicFromText,
  generateMusicFromMelody,
  validateReplicateToken,
  buildMusicPrompt,
  getCostEstimate,
} from '@/lib/ai/music-generation';
import type { MusicGenerationParams } from '@/lib/ai/music-generation';

export async function POST(request: NextRequest) {
  try {
    // Validate Replicate API token
    if (!validateReplicateToken()) {
      return NextResponse.json(
        { error: 'Replicate API token not configured. Set REPLICATE_API_TOKEN in .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Mode 1: Text-to-music
    if (body.prompt || body.style) {
      return await handleTextToMusic(body);
    }

    // Mode 2: Melody-to-music (requires melodyInput)
    if (body.melodyInput) {
      return await handleMelodyToMusic(body);
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide either "prompt"/"style" or "melodyInput"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Music generation API error:', error);

    // Handle specific errors
    if (error.message.includes('No such version')) {
      return NextResponse.json(
        { error: 'Music generation model unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate music' },
      { status: 500 }
    );
  }
}

/**
 * Handle text-to-music generation
 */
async function handleTextToMusic(body: any) {
  const {
    prompt,
    style, // { genre, mood, instruments, arrangement }
    duration = 30,
    model = 'medium',
    temperature,
    topK,
    topP,
  } = body;

  // Build prompt from style if provided
  const finalPrompt = prompt || (style ? buildMusicPrompt(style) : 'instrumental music');

  // Validate duration
  if (duration < 1 || duration > 120) {
    return NextResponse.json(
      { error: 'Duration must be between 1 and 120 seconds' },
      { status: 400 }
    );
  }

  // Generate music
  const params: MusicGenerationParams = {
    prompt: finalPrompt,
    duration,
    model,
    temperature,
    topK,
    topP,
  };

  const result = await generateMusicFromText(params);

  return NextResponse.json({
    success: true,
    audio_url: result.audioUrl,
    metadata: {
      prompt: finalPrompt,
      model: result.model,
      duration: result.duration,
      cost: result.cost,
    },
  });
}

/**
 * Handle melody-to-music generation (vocal recording → composition)
 */
async function handleMelodyToMusic(body: any) {
  const {
    melodyInput,     // URL to audio file or recording
    prompt,
    style,
    duration = 30,
    temperature,
    topK,
    topP,
  } = body;

  // Build prompt from style if provided
  const stylePrompt = style ? buildMusicPrompt(style) : '';
  const finalPrompt = prompt || stylePrompt || 'instrumental music based on this melody';

  // Validate melody input
  if (!melodyInput || typeof melodyInput !== 'string') {
    return NextResponse.json(
      { error: 'Invalid melodyInput. Must be a URL to an audio file.' },
      { status: 400 }
    );
  }

  // Validate duration
  if (duration < 1 || duration > 120) {
    return NextResponse.json(
      { error: 'Duration must be between 1 and 120 seconds' },
      { status: 400 }
    );
  }

  // Generate music with melody conditioning
  const params: MusicGenerationParams & { melodyInput: string } = {
    prompt: finalPrompt,
    melodyInput,
    duration,
    temperature,
    topK,
    topP,
  };

  const result = await generateMusicFromMelody(params);

  return NextResponse.json({
    success: true,
    audio_url: result.audioUrl,
    metadata: {
      prompt: finalPrompt,
      model: result.model,
      duration: result.duration,
      cost: result.cost,
      melody_input: melodyInput,
    },
  });
}

/**
 * GET endpoint for cost estimation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const model = searchParams.get('model') || 'medium';
  const duration = parseInt(searchParams.get('duration') || '30');

  const cost = getCostEstimate({ model, duration });

  return NextResponse.json({
    cost,
    model,
    duration,
    currency: 'USD',
  });
}
