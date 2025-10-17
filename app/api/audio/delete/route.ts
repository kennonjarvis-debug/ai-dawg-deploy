// Delete audio file from S3
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteAudioFromS3, extractKeyFromUrl } from '@/lib/storage/s3-client';
import prisma from '@/lib/db/prisma';

/**
 * DELETE /api/audio/delete
 *
 * Delete audio file from S3
 *
 * Request body:
 * {
 *   key?: string;         // S3 key (path/filename)
 *   url?: string;         // Full S3 URL (alternative to key)
 *   recordingId?: string; // Recording ID (for ownership verification)
 * }
 */

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    const body = await request.json();
    const { key, url, recordingId } = body;

    // Validate parameters
    if (!key && !url) {
      return NextResponse.json(
        { error: 'Missing required field: key or url' },
        { status: 400 }
      );
    }

    // Extract key from URL if provided
    const s3Key = key || extractKeyFromUrl(url);

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

      // Delete recording from database
      await prisma.recording.delete({
        where: { id: recordingId },
      });
    }

    // Delete from S3
    await deleteAudioFromS3(s3Key);

    return NextResponse.json({
      success: true,
      message: 'Audio file deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete audio error:', error);

    if (error.message?.includes('AWS_S3_BUCKET')) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete audio file' },
      { status: 500 }
    );
  }
}
