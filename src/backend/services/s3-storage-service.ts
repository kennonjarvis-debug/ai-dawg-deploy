/**
 * S3 Storage Service
 *
 * Comprehensive S3 cloud storage service for DAWG AI
 * Handles file uploads, downloads, management with support for:
 * - Multipart uploads for large files (>5MB)
 * - Signed URLs for secure downloads
 * - File metadata management
 * - Storage quota tracking
 * - Progress tracking
 * - Error handling and retries
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import type {
  S3Config,
  S3UploadOptions,
  S3UploadResult,
  S3DownloadOptions,
  S3DownloadResult,
  S3DeleteOptions,
  S3DeleteResult,
  S3ListOptions,
  S3ListResult,
  SignedUrlOptions,
  SignedUrlResult,
  MultipartUploadProgress,
  UploadPart,
  StorageError,
} from '../../types/storage';

/**
 * S3 Storage Service Class
 */
export class S3StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  // Configuration constants
  private readonly MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
  private readonly MULTIPART_PART_SIZE = 5 * 1024 * 1024; // 5MB per part
  private readonly MAX_RETRIES = 3;
  private readonly SIGNED_URL_EXPIRATION = 3600; // 1 hour

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region;

    // Initialize S3 client with AWS SDK v3
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),
    });

    logger.info('[S3StorageService] Initialized', {
      bucket: this.bucket,
      region: this.region,
    });
  }

  // ============================================================================
  // Upload Methods
  // ============================================================================

  /**
   * Upload a file to S3
   * Automatically uses multipart upload for files > 5MB
   */
  async uploadFile(options: S3UploadOptions): Promise<S3UploadResult> {
    try {
      const fileSize = options.file instanceof Buffer
        ? options.file.length
        : options.file.size;

      logger.info('[S3StorageService] Starting file upload', {
        key: options.key,
        size: fileSize,
        contentType: options.contentType,
      });

      // Use multipart upload for large files
      if (fileSize > this.MULTIPART_THRESHOLD) {
        logger.info('[S3StorageService] Using multipart upload', {
          key: options.key,
          size: fileSize,
        });
        return await this.uploadLargeFile(options);
      }

      // Standard upload for small files
      return await this.uploadSmallFile(options);
    } catch (error: any) {
      logger.error('[S3StorageService] Upload failed', {
        key: options.key,
        error: error.message,
      });

      return {
        success: false,
        key: options.key,
        url: '',
        size: 0,
        error: error.message,
      };
    }
  }

  /**
   * Upload small file (<5MB) using PutObject
   */
  private async uploadSmallFile(options: S3UploadOptions): Promise<S3UploadResult> {
    try {
      const fileBuffer = options.file instanceof Buffer
        ? options.file
        : await this.fileToBuffer(options.file);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: fileBuffer,
        ContentType: options.contentType,
        Metadata: options.metadata,
        Tagging: this.formatTags(options.tags),
        ACL: options.acl || 'private',
      });

      const response = await this.s3Client.send(command);

      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${options.key}`;

      logger.info('[S3StorageService] Small file uploaded successfully', {
        key: options.key,
        etag: response.ETag,
        versionId: response.VersionId,
      });

      return {
        success: true,
        key: options.key,
        url,
        size: fileBuffer.length,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error: any) {
      throw new Error(`Small file upload failed: ${error.message}`);
    }
  }

  /**
   * Upload large file (>5MB) using multipart upload
   */
  private async uploadLargeFile(
    options: S3UploadOptions,
    onProgress?: (progress: MultipartUploadProgress) => void
  ): Promise<S3UploadResult> {
    let uploadId: string | undefined;

    try {
      const fileBuffer = options.file instanceof Buffer
        ? options.file
        : await this.fileToBuffer(options.file);

      const fileSize = fileBuffer.length;

      // Step 1: Initiate multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: options.key,
        ContentType: options.contentType,
        Metadata: options.metadata,
        Tagging: this.formatTags(options.tags),
        ACL: options.acl || 'private',
      });

      const createResponse = await this.s3Client.send(createCommand);
      uploadId = createResponse.UploadId;

      if (!uploadId) {
        throw new Error('Failed to initiate multipart upload');
      }

      logger.info('[S3StorageService] Multipart upload initiated', {
        key: options.key,
        uploadId,
        fileSize,
      });

      // Step 2: Upload parts
      const parts: UploadPart[] = [];
      const totalParts = Math.ceil(fileSize / this.MULTIPART_PART_SIZE);
      let uploadedBytes = 0;

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * this.MULTIPART_PART_SIZE;
        const end = Math.min(start + this.MULTIPART_PART_SIZE, fileSize);
        const partData = fileBuffer.slice(start, end);

        // Upload part with retry logic
        const partResult = await this.uploadPartWithRetry(
          options.key,
          uploadId,
          partNumber,
          partData
        );

        parts.push(partResult);
        uploadedBytes += partData.length;

        // Report progress
        if (onProgress) {
          const percentage = (uploadedBytes / fileSize) * 100;
          onProgress({
            uploadedParts: partNumber,
            totalParts,
            uploadedBytes,
            totalBytes: fileSize,
            percentage,
            currentPart: partNumber,
          });
        }

        logger.info('[S3StorageService] Part uploaded', {
          key: options.key,
          partNumber,
          totalParts,
          percentage: ((partNumber / totalParts) * 100).toFixed(2),
        });
      }

      // Step 3: Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: options.key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(p => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      });

      const completeResponse = await this.s3Client.send(completeCommand);

      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${options.key}`;

      logger.info('[S3StorageService] Multipart upload completed', {
        key: options.key,
        etag: completeResponse.ETag,
        versionId: completeResponse.VersionId,
        totalParts,
      });

      return {
        success: true,
        key: options.key,
        url,
        size: fileSize,
        etag: completeResponse.ETag,
        versionId: completeResponse.VersionId,
      };
    } catch (error: any) {
      // Abort multipart upload on error
      if (uploadId) {
        try {
          await this.abortMultipartUpload(options.key, uploadId);
        } catch (abortError: any) {
          logger.error('[S3StorageService] Failed to abort multipart upload', {
            key: options.key,
            uploadId,
            error: abortError.message,
          });
        }
      }

      throw new Error(`Multipart upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a single part with retry logic
   */
  private async uploadPartWithRetry(
    key: string,
    uploadId: string,
    partNumber: number,
    partData: Buffer,
    retries = 0
  ): Promise<UploadPart> {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: partData,
      });

      const response = await this.s3Client.send(command);

      if (!response.ETag) {
        throw new Error('ETag not returned from part upload');
      }

      return {
        partNumber,
        etag: response.ETag,
        size: partData.length,
      };
    } catch (error: any) {
      if (retries < this.MAX_RETRIES) {
        logger.warn('[S3StorageService] Retrying part upload', {
          key,
          partNumber,
          attempt: retries + 1,
        });
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return this.uploadPartWithRetry(key, uploadId, partNumber, partData, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Abort a multipart upload
   */
  private async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);

    logger.info('[S3StorageService] Multipart upload aborted', {
      key,
      uploadId,
    });
  }

  // ============================================================================
  // Download Methods
  // ============================================================================

  /**
   * Download a file from S3
   */
  async downloadFile(options: S3DownloadOptions): Promise<S3DownloadResult> {
    try {
      logger.info('[S3StorageService] Starting file download', {
        key: options.key,
        versionId: options.versionId,
      });

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        VersionId: options.versionId,
        ResponseContentType: options.responseContentType,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No data returned from S3');
      }

      const data = await this.streamToBuffer(response.Body);

      logger.info('[S3StorageService] File downloaded successfully', {
        key: options.key,
        size: data.length,
        contentType: response.ContentType,
      });

      return {
        success: true,
        data,
        contentType: response.ContentType,
        size: response.ContentLength,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Download failed', {
        key: options.key,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a signed URL for secure file access
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<SignedUrlResult> {
    try {
      const expiresIn = options.expiresIn || this.SIGNED_URL_EXPIRATION;

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        ResponseContentType: options.contentType,
        ResponseContentDisposition: options.contentDisposition,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      logger.info('[S3StorageService] Signed URL generated', {
        key: options.key,
        expiresIn,
        expiresAt,
      });

      return {
        success: true,
        url,
        expiresAt,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Failed to generate signed URL', {
        key: options.key,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a signed URL for file upload
   */
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<SignedUrlResult> {
    try {
      const expires = expiresIn || this.SIGNED_URL_EXPIRATION;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expires });

      const expiresAt = new Date(Date.now() + expires * 1000);

      logger.info('[S3StorageService] Signed upload URL generated', {
        key,
        expiresIn: expires,
        expiresAt,
      });

      return {
        success: true,
        url,
        expiresAt,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Failed to generate signed upload URL', {
        key,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================================
  // File Management Methods
  // ============================================================================

  /**
   * Delete a file from S3
   */
  async deleteFile(options: S3DeleteOptions): Promise<S3DeleteResult> {
    try {
      logger.info('[S3StorageService] Deleting file', {
        key: options.key,
        versionId: options.versionId,
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        VersionId: options.versionId,
      });

      await this.s3Client.send(command);

      logger.info('[S3StorageService] File deleted successfully', {
        key: options.key,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Delete failed', {
        key: options.key,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List files in S3 bucket
   */
  async listFiles(options: S3ListOptions = {}): Promise<S3ListResult> {
    try {
      logger.info('[S3StorageService] Listing files', {
        prefix: options.prefix,
        maxKeys: options.maxKeys,
      });

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: options.prefix,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken,
      });

      const response = await this.s3Client.send(command);

      const objects = (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        etag: obj.ETag!,
        storageClass: obj.StorageClass!,
      }));

      logger.info('[S3StorageService] Files listed successfully', {
        count: objects.length,
        isTruncated: response.IsTruncated,
      });

      return {
        success: true,
        objects,
        isTruncated: response.IsTruncated || false,
        continuationToken: response.NextContinuationToken,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] List files failed', {
        error: error.message,
      });

      return {
        success: false,
        objects: [],
        isTruncated: false,
        error: error.message,
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        success: true,
        metadata: {
          contentType: response.ContentType,
          contentLength: response.ContentLength,
          lastModified: response.LastModified,
          etag: response.ETag,
          metadata: response.Metadata,
          versionId: response.VersionId,
        },
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Get metadata failed', {
        key,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Copy/rename a file in S3
   */
  async copyFile(sourceKey: string, destinationKey: string) {
    try {
      logger.info('[S3StorageService] Copying file', {
        sourceKey,
        destinationKey,
      });

      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(command);

      logger.info('[S3StorageService] File copied successfully', {
        sourceKey,
        destinationKey,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('[S3StorageService] Copy failed', {
        sourceKey,
        destinationKey,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert File to Buffer
   */
  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Convert Stream to Buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Format tags for S3
   */
  private formatTags(tags?: Record<string, string>): string | undefined {
    if (!tags || Object.keys(tags).length === 0) {
      return undefined;
    }

    return Object.entries(tags)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique storage key for a file
   */
  generateStorageKey(userId: string, fileName: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const basePath = prefix ? `${prefix}/` : '';
    return `${basePath}${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;
  }

  /**
   * Close S3 client connection
   */
  async close(): Promise<void> {
    this.s3Client.destroy();
    logger.info('[S3StorageService] Connection closed');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let s3StorageServiceInstance: S3StorageService | null = null;

/**
 * Get S3 Storage Service instance
 */
export function getS3StorageService(): S3StorageService {
  if (!s3StorageServiceInstance) {
    const config: S3Config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || '',
      endpoint: process.env.S3_ENDPOINT,
    };

    if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      throw new Error('S3 configuration is incomplete. Please check your environment variables.');
    }

    s3StorageServiceInstance = new S3StorageService(config);
  }

  return s3StorageServiceInstance;
}

export default S3StorageService;
