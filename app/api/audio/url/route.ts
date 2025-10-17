// Generate signed URL for audio file download
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSignedAudioUrl, extractKeyFromUrl } from '@/lib/storage/s3-client';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/audio/url?key=xxx
 * GET /api/audio/url?url=xxx
 *
 * Generate signed URL for audio file download
 *
 * Query parameters:
 * - key: S3 key (path/filename)
 * - url: Full S3 URL (alternative to key)
 * - expiresIn: Expiration time in seconds (default: 3600 = 1 hour)
 * - recordingId: Recording ID (for ownership verification)
 */

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const url = searchParams.get('url');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');
    const recordingId = searchParams.get('recordingId');

    // Validate parameters
    if (!key && !url) {
      return NextResponse.json(
        { error: 'Missing required parameter: key or url' },
        { status: 400 }
      );
    }

    // Extract key from URL if provided
    const s3Key = key || extractKeyFromUrl(url!);

    // Optional: Verify ownership if recordingId provided
    if (recordingId) {
      const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
        include: {
          track: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!recording) {
        return NextResponse.json(
          { error: 'Recording not found' },
          { status: 404 }
        );
      }

      // Verify user owns the project
      if (recording.track.project.userId !== userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Generate signed URL
    const signedUrl = await getSignedAudioUrl(s3Key, expiresIn);

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Generate signed URL error:', error);

    if (error.message?.includes('AWS_S3_BUCKET')) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
