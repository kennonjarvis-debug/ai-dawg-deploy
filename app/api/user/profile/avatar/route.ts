/**
 * Avatar Upload API
 * Instance 4 (Data & Storage - Karen)
 *
 * POST /api/user/profile/avatar - Request presigned S3 URL for avatar upload
 * DELETE /api/user/profile/avatar - Delete current avatar
 *
 * S3 integration with presigned URLs for secure client-side uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  AvatarUploadRequestSchema,
  type AvatarUploadRequest,
  type AvatarUploadResponse,
} from '@/lib/types/user-profile-ui';
import crypto from 'crypto';

// S3 configuration (from environment variables)
const S3_BUCKET = process.env.S3_BUCKET || 'dawg-ai-avatars';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const CDN_URL = process.env.CDN_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

/**
 * Generate S3 key for avatar
 */
function generateAvatarKey(userId: string, extension: string): string {
  const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `avatars/${userHash}/${timestamp}-${random}.${extension}`;
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Generate presigned S3 URL (mock implementation)
 * In production, use AWS SDK to generate actual presigned URLs
 */
function generatePresignedUrl(s3Key: string, _mimeType: string): string {
  // TODO: Replace with actual AWS SDK implementation
  // const s3 = new AWS.S3();
  // const params = {
  //   Bucket: S3_BUCKET,
  //   Key: s3Key,
  //   Expires: 3600, // 1 hour
  //   ContentType: mimeType,
  //   ACL: 'public-read',
  // };
  // return s3.getSignedUrl('putObject', params);

  // Mock implementation for development
  const mockUploadUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}?X-Amz-Signature=mock`;
  return mockUploadUrl;
}

/**
 * POST /api/user/profile/avatar
 * Request presigned S3 URL for avatar upload
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to upload avatar' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const body = await request.json();

    // Validate upload request
    const uploadRequest = AvatarUploadRequestSchema.safeParse(body);

    if (!uploadRequest.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid avatar upload request',
          details: uploadRequest.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fileName, fileSize, mimeType, width, height }: AvatarUploadRequest = uploadRequest.data;

    // Additional validation
    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'File size must be 5MB or less' },
        { status: 400 }
      );
    }

    // Generate S3 key
    const extension = getExtension(mimeType);
    const s3Key = generateAvatarKey(userId, extension);

    // Generate presigned URL
    const uploadUrl = generatePresignedUrl(s3Key, mimeType);

    // Generate final CDN URLs
    const imageUrl = `${CDN_URL}/${s3Key}`;
    const thumbnailKey = s3Key.replace(`.${extension}`, `-thumb.${extension}`);
    const thumbnailUrl = `${CDN_URL}/${thumbnailKey}`;

    // Set expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const response: AvatarUploadResponse = {
      uploadUrl,
      imageUrl,
      thumbnailUrl,
      s3Key,
      expiresAt: expiresAt.toISOString(),
    };

    // TODO: Store pending upload in database
    // TODO: Set up webhook for S3 upload completion
    // TODO: Generate thumbnail using Lambda/image processing service

    console.log('[API] Avatar upload URL generated:', {
      userId,
      fileName,
      fileSize,
      s3Key,
      width,
      height,
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Upload URL generated successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/profile/avatar POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to generate upload URL',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile/avatar
 * Delete current avatar from S3 and profile
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to delete avatar' },
        { status: 401 }
      );
    }

    const userId = session.user.email;

    // TODO: Get current avatar S3 key from database
    // TODO: Delete from S3 using AWS SDK
    // const s3 = new AWS.S3();
    // await s3.deleteObject({ Bucket: S3_BUCKET, Key: s3Key }).promise();

    // TODO: Remove avatar from user profile in database

    console.log('[API] Avatar deleted for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('[API] /api/user/profile/avatar DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete avatar',
      },
      { status: 500 }
    );
  }
}
