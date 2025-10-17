/**
 * Harmony Generation Endpoint
 * POST /api/voice/harmony - Generate harmony vocals from lead vocal using cloned voice
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateHarmony, estimateVoiceCloningCost } from '@/lib/ai/voice-cloning';
import type { HarmonyGenerationParams, VoiceProfile } from '@/lib/ai/voice-cloning';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const maxDuration = 300; // Harmony generation can take up to 5 minutes (multiple harmonies)

/**
 * POST /api/voice/harmony
 * Generate harmony vocals from lead vocal
 *
 * Request body:
 * {
 *   leadVocalUrl: string; // S3 URL to lead vocal recording
 *   voiceProfileId: string; // ID of voice profile to use
 *   intervals: string[]; // Array of intervals: 'third_above', 'third_below', etc.
 *   language?: string; // Language code (default: 'en')
 * }
 *
 * Response:
 * {
 *   success: true;
 *   harmonies: [
 *     { interval: 'third_above', audioUrl: 'https://...', cost: 0.06 }
 *   ];
 *   totalCost: 0.12;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadVocalUrl, voiceProfileId, intervals, language } = body;

    console.log('[Harmony API] Received request:', {
      leadVocalUrl,
      voiceProfileId,
      intervals,
      language,
    });

    // Validate required fields
    if (!leadVocalUrl || !voiceProfileId || !intervals || !Array.isArray(intervals)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: leadVocalUrl, voiceProfileId, intervals',
        },
        { status: 400 }
      );
    }

    // Validate intervals
    const validIntervals = [
      'third_above',
      'third_below',
      'fifth_above',
      'fifth_below',
      'octave_above',
      'octave_below',
    ];
    const invalidIntervals = intervals.filter((i: string) => !validIntervals.includes(i));
    if (invalidIntervals.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid intervals: ${invalidIntervals.join(', ')}. Valid options: ${validIntervals.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Require authentication
    const { userId } = await requireAuth();

    // Fetch voice profile from database
    const voiceProfile = await prisma.voiceProfile.findUnique({
      where: { id: voiceProfileId },
    });

    if (!voiceProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Voice profile not found',
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (voiceProfile.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied - voice profile belongs to another user',
        },
        { status: 403 }
      );
    }

    // Convert Prisma model to VoiceProfile interface
    const voiceProfileData: VoiceProfile = {
      id: voiceProfile.id,
      userId: voiceProfile.userId,
      name: voiceProfile.name,
      sampleAudioUrl: voiceProfile.sampleAudioUrl,
      createdAt: voiceProfile.createdAt,
      metadata: {
        duration: voiceProfile.duration,
        sampleRate: voiceProfile.sampleRate,
        format: voiceProfile.format,
      },
    };

    // Build params
    const params: HarmonyGenerationParams = {
      leadVocalUrl,
      voiceProfileId,
      intervals: intervals as any[],
      language: language || 'en',
    };

    // Generate harmonies
    console.log('[Harmony API] Generating harmonies...');
    const result = await generateHarmony(params, voiceProfileData);

    // Update usage tracking
    await prisma.voiceProfile.update({
      where: { id: voiceProfileId },
      data: {
        harmoniesGenerated: { increment: result.harmonies.length },
        lastUsedAt: new Date(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log('[Harmony API] Harmonies generated successfully:', {
      count: result.harmonies.length,
      totalCost: result.totalCost,
    });

    return NextResponse.json({
      success: true,
      harmonies: result.harmonies,
      totalCost: result.totalCost,
    });
  } catch (error: any) {
    console.error('[Harmony API] Error:', error);

    if (error.message?.includes('Invalid API token')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Replicate API token',
        },
        { status: 401 }
      );
    }

    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Harmony generation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/harmony?duration=10&intervals=third_above,fifth_above
 * Get cost estimate for harmony generation
 *
 * Response:
 * {
 *   success: true;
 *   estimatedCost: 0.12;
 *   breakdown: {
 *     third_above: 0.06,
 *     fifth_above: 0.06
 *   };
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const duration = parseInt(searchParams.get('duration') || '10', 10);
    const intervalsParam = searchParams.get('intervals') || '';
    const intervals = intervalsParam.split(',').filter((i) => i.length > 0);

    if (intervals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing intervals parameter',
        },
        { status: 400 }
      );
    }

    // Calculate cost estimate
    const breakdown: Record<string, number> = {};
    let totalCost = 0;

    for (const interval of intervals) {
      const cost = estimateVoiceCloningCost(duration);
      breakdown[interval] = cost;
      totalCost += cost;
    }

    return NextResponse.json({
      success: true,
      estimatedCost: totalCost,
      breakdown,
      durationPerHarmony: duration,
      intervalCount: intervals.length,
    });
  } catch (error: any) {
    console.error('[Harmony API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Cost estimation failed',
      },
      { status: 500 }
    );
  }
}
