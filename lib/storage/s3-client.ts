// AWS S3 client for audio file storage
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

/**
 * Upload audio file to S3
 * @param file - File buffer
 * @param key - S3 key (path/filename)
 * @param contentType - MIME type (e.g., 'audio/webm', 'audio/wav')
 * @returns S3 URL
 */
export async function uploadAudioToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET environment variable not set');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    // Optional: Add metadata
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  // Return S3 URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Generate signed URL for downloading audio file
 * @param key - S3 key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedAudioUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET environment variable not set');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete audio file from S3
 * @param key - S3 key
 */
export async function deleteAudioFromS3(key: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_S3_BUCKET environment variable not set');
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate S3 key for audio file
 * @param userId - User ID
 * @param projectId - Project ID
 * @param recordingId - Recording ID
 * @param extension - File extension (e.g., 'webm', 'wav')
 * @returns S3 key
 */
export function generateAudioKey(
  userId: string,
  projectId: string,
  recordingId: string,
  extension: string
): string {
  // Format: users/{userId}/projects/{projectId}/recordings/{recordingId}.{ext}
  return `users/${userId}/projects/${projectId}/recordings/${recordingId}.${extension}`;
}

/**
 * Extract S3 key from full URL
 * @param url - Full S3 URL
 * @returns S3 key
 */
export function extractKeyFromUrl(url: string): string {
  const urlObj = new URL(url);
  // Remove leading slash
  return urlObj.pathname.substring(1);
}
