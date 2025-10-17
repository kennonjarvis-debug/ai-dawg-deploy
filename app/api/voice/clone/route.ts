/**
 * Voice Profile Creation Endpoint
 * POST /api/voice/clone - Create a voice profile from audio sample
 * GET /api/voice/clone - Get user's voice profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateVoiceSample } from '@/lib/ai/voice-cloning';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60; // Voice profile creation can take up to 60s

/**
 * POST /api/voice/clone
 * Create a new voice profile from audio sample
 *
 * Request body:
 * {
 *   name: string;
 *   sampleAudioUrl: string; // S3 URL to voice sample
 *   s3Key: string; // S3 key for deletion
 *   duration: number; // Duration in seconds
 *   format: string; // Audio format (wav, mp3, webm)
 *   sampleRate?: number; // Optional sample rate
 *   fileSize?: number; // Optional file size
 * }
 *
 * Response:
 * {
 *   success: true;
 *   voiceProfile: VoiceProfile;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const body = await request.json();
    const { name, sampleAudioUrl, s3Key, duration, format, sampleRate, fileSize } = body;

    console.log('[Voice Clone API] Received request:', {
      userId,
      name,
      duration,
      format,
    });

    // Validate required fields
    if (!name || !sampleAudioUrl || !s3Key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, sampleAudioUrl, s3Key',
        },
        { status: 400 }
      );
    }

    // Validate voice sample
    const validation = validateVoiceSample(duration, format, false);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Create voice profile in database
    const voiceProfile = await prisma.voiceProfile.create({
      data: {
        userId,
        name,
        sampleAudioUrl,
        s3Key,
        duration,
        format,
        sampleRate: sampleRate || 48000,
        fileSize: fileSize || null,
      },
    });

    console.log('[Voice Clone API] Voice profile created:', voiceProfile.id);

    return NextResponse.json({
      success: true,
      voiceProfile,
    });
  } catch (error: any) {
    console.error('[Voice Clone API] Error:', error);

    if (error.message?.includes('Invalid API token')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Replicate API token',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Voice profile creation failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/clone
 * Get all voice profiles for authenticated user
 *
 * Response:
 * {
 *   success: true;
 *   voiceProfiles: VoiceProfile[];
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    console.log('[Voice Clone API] Fetching voice profiles for user:', userId);

    // Fetch voice profiles from database
    const voiceProfiles = await prisma.voiceProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[Voice Clone API] Found', voiceProfiles.length, 'voice profiles');

    return NextResponse.json({
      success: true,
      voiceProfiles,
    });
  } catch (error: any) {
    console.error('[Voice Clone API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch voice profiles',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/voice/clone
 * Delete a voice profile and its S3 audio file
 *
 * Request body:
 * {
 *   voiceProfileId: string;
 * }
 *
 * Response:
 * {
 *   success: true;
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const body = await request.json();
    const { voiceProfileId } = body;

    if (!voiceProfileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing voiceProfileId',
        },
        { status: 400 }
      );
    }

    // Verify ownership
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

    if (voiceProfile.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    // Delete from S3 (using audio/delete endpoint)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/audio/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: voiceProfile.s3Key }),
      });
    } catch (s3Error) {
      console.error('[Voice Clone API] Failed to delete S3 file:', s3Error);
      // Continue with DB deletion even if S3 fails
    }

    // Delete from database
    await prisma.voiceProfile.delete({
      where: { id: voiceProfileId },
    });

    console.log('[Voice Clone API] Voice profile deleted:', voiceProfileId);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[Voice Clone API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete voice profile',
      },
      { status: 500 }
    );
  }
}
