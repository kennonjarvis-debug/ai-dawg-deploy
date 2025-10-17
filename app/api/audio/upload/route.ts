// Audio file upload endpoint
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadAudioToS3, generateAudioKey } from '@/lib/storage/s3-client';

/**
 * POST /api/audio/upload
 *
 * Upload audio file to S3
 *
 * Request body (multipart/form-data):
 * - file: Audio file (webm, wav, mp3)
 * - projectId: Project ID
 * - recordingId: Recording ID
 * - contentType: MIME type (optional, inferred from file)
 */

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const recordingId = formData.get('recordingId') as string;
    const contentType = formData.get('contentType') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'Missing required field: file' },
        { status: 400 }
      );
    }

    if (!projectId || !recordingId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, recordingId' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 413 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp3'];
    const fileType = contentType || file.type;

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get file extension
    const extension = file.name.split('.').pop() || 'webm';

    // Generate S3 key
    const s3Key = generateAudioKey(userId, projectId, recordingId, extension);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const s3Url = await uploadAudioToS3(buffer, s3Key, fileType);

    return NextResponse.json({
      success: true,
      url: s3Url,
      key: s3Key,
      size: file.size,
      contentType: fileType,
    });
  } catch (error: any) {
    console.error('Audio upload error:', error);

    // Handle specific S3 errors
    if (error.name === 'CredentialsProviderError') {
      return NextResponse.json(
        { error: 'S3 credentials not configured' },
        { status: 500 }
      );
    }

    if (error.message?.includes('AWS_S3_BUCKET')) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload audio file' },
      { status: 500 }
    );
  }
}
