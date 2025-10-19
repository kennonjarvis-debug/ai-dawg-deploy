/**
 * Storage-related TypeScript type definitions
 * Provides strong typing for S3 file storage, uploads, and management
 */

// ============================================================================
// S3 Storage Types
// ============================================================================

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string;
}

export interface S3UploadOptions {
  file: File | Buffer;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export interface S3UploadResult {
  success: boolean;
  key: string;
  url: string;
  size: number;
  etag?: string;
  versionId?: string;
  error?: string;
}

export interface S3DownloadOptions {
  key: string;
  versionId?: string;
  responseContentType?: string;
}

export interface S3DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  size?: number;
  metadata?: Record<string, string>;
  error?: string;
}

export interface S3DeleteOptions {
  key: string;
  versionId?: string;
}

export interface S3DeleteResult {
  success: boolean;
  error?: string;
}

export interface S3ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface S3ObjectMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  storageClass: string;
  contentType?: string;
}

export interface S3ListResult {
  success: boolean;
  objects: S3ObjectMetadata[];
  isTruncated: boolean;
  continuationToken?: string;
  error?: string;
}

export interface SignedUrlOptions {
  key: string;
  expiresIn?: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  expiresAt?: Date;
  error?: string;
}

// ============================================================================
// File Storage Types
// ============================================================================

export interface StoredFile {
  id: string;
  userId: string;
  projectId?: string;
  fileName: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  duration?: number; // For audio files
  sampleRate?: number; // For audio files
  channels?: number; // For audio files
  metadata?: Record<string, any>;
  tags?: string[];
  uploadedAt: Date;
  lastAccessedAt?: Date;
  isPublic: boolean;
  versionId?: string;
  checksum?: string;
}

export interface FileUploadOptions {
  file: File | Buffer;
  fileName: string;
  projectId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  isPublic?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  bytesPerSecond?: number;
  estimatedTimeRemaining?: number;
}

export interface FileUploadResult {
  success: boolean;
  file?: StoredFile;
  error?: string;
  uploadId?: string;
}

export interface FileDownloadOptions {
  fileId: string;
  inline?: boolean; // Whether to display inline or force download
  onProgress?: (progress: DownloadProgress) => void;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileDownloadResult {
  success: boolean;
  url?: string; // Signed URL for download
  file?: StoredFile;
  error?: string;
}

export interface FileListOptions {
  projectId?: string;
  userId?: string;
  fileType?: 'audio' | 'video' | 'image' | 'document' | 'other';
  limit?: number;
  offset?: number;
  sortBy?: 'uploadedAt' | 'fileName' | 'size' | 'lastAccessedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  tags?: string[];
}

export interface FileListResult {
  success: boolean;
  files: StoredFile[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface FileDeleteOptions {
  fileId: string;
  permanent?: boolean; // Permanently delete or just mark as deleted
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

export interface FileRenameOptions {
  fileId: string;
  newName: string;
}

export interface FileRenameResult {
  success: boolean;
  file?: StoredFile;
  error?: string;
}

// ============================================================================
// Multipart Upload Types (for large files >5MB)
// ============================================================================

export interface MultipartUploadOptions {
  file: File | Buffer;
  fileName: string;
  projectId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  partSize?: number; // Size of each part in bytes (default: 5MB)
  onProgress?: (progress: MultipartUploadProgress) => void;
}

export interface MultipartUploadProgress {
  uploadedParts: number;
  totalParts: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  bytesPerSecond?: number;
  estimatedTimeRemaining?: number;
  currentPart?: number;
}

export interface MultipartUploadResult {
  success: boolean;
  file?: StoredFile;
  error?: string;
  uploadId?: string;
}

export interface UploadPart {
  partNumber: number;
  etag: string;
  size: number;
}

// ============================================================================
// Storage Quota & Usage Types
// ============================================================================

export interface StorageQuota {
  userId: string;
  totalLimit: number; // Bytes
  usedSpace: number; // Bytes
  availableSpace: number; // Bytes
  fileCount: number;
  quotaExceeded: boolean;
  quotaPercentage: number;
}

export interface StorageUsageByProject {
  projectId: string;
  projectName: string;
  fileCount: number;
  totalSize: number;
  percentageOfTotal: number;
}

export interface StorageStatistics {
  quota: StorageQuota;
  byProject: StorageUsageByProject[];
  byFileType: {
    type: string;
    count: number;
    size: number;
  }[];
  recentlyUploaded: StoredFile[];
  largestFiles: StoredFile[];
}

// ============================================================================
// File Validation Types
// ============================================================================

export interface FileValidationRules {
  allowedMimeTypes?: string[];
  maxFileSize?: number; // Bytes
  minFileSize?: number; // Bytes
  allowedExtensions?: string[];
  requireAudioFiles?: boolean; // Only allow audio files
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export type StorageErrorCode =
  | 'FILE_NOT_FOUND'
  | 'UPLOAD_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'DELETE_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UNAUTHORIZED'
  | 'S3_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';

// ============================================================================
// Configuration Types
// ============================================================================

export interface StorageServiceConfig {
  s3: S3Config;
  defaultQuotaPerUser: number; // Bytes
  maxFileSize: number; // Bytes
  multipartThreshold: number; // Bytes (files larger than this use multipart upload)
  multipartPartSize: number; // Bytes
  allowedMimeTypes: string[];
  signedUrlExpiration: number; // Seconds
  enableVersioning: boolean;
  enableEncryption: boolean;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  S3Config,
  S3UploadOptions,
  S3UploadResult,
  S3DownloadOptions,
  S3DownloadResult,
  S3DeleteOptions,
  S3DeleteResult,
  S3ListOptions,
  S3ObjectMetadata,
  S3ListResult,
  SignedUrlOptions,
  SignedUrlResult,
  StoredFile,
  FileUploadOptions,
  UploadProgress,
  FileUploadResult,
  FileDownloadOptions,
  DownloadProgress,
  FileDownloadResult,
  FileListOptions,
  FileListResult,
  FileDeleteOptions,
  FileDeleteResult,
  FileRenameOptions,
  FileRenameResult,
  MultipartUploadOptions,
  MultipartUploadProgress,
  MultipartUploadResult,
  UploadPart,
  StorageQuota,
  StorageUsageByProject,
  StorageStatistics,
  FileValidationRules,
  FileValidationResult,
  StorageError,
  StorageErrorCode,
  StorageServiceConfig,
};
