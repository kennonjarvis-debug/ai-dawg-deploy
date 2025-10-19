/**
 * Storage API Routes
 *
 * REST endpoints for S3 file storage operations:
 * - File upload (with multipart support)
 * - File download (signed URLs)
 * - File management (list, delete, rename)
 * - Storage quota tracking
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { getS3StorageService } from '../services/s3-storage-service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import type {
  FileUploadResult,
  FileDownloadResult,
  FileListResult,
  FileDeleteResult,
  FileRenameResult,
  StorageStatistics,
} from '../../types/storage';

const router = Router();
const prisma = new PrismaClient();
const s3Service = getS3StorageService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow audio files
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/aiff',
      'audio/x-aiff',
      'audio/flac',
      'audio/ogg',
      'audio/mp4',
      'audio/m4a',
      'audio/webm',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only audio files are allowed. Got: ${file.mimetype}`));
    }
  },
});

// Validation schemas
const uploadFileSchema = z.object({
  projectId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
});

const listFilesSchema = z.object({
  projectId: z.string().optional(),
  fileType: z.enum(['audio', 'video', 'image', 'document', 'other']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['uploadedAt', 'fileName', 'size', 'lastAccessedAt']).optional().default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Middleware to extract userId (replace with actual auth middleware)
function getUserId(req: Request): string {
  // TODO: Extract from JWT token in production
  return (req.headers['x-user-id'] as string) || req.query.userId as string || 'user-123';
}

// ============================================================================
// File Upload Routes
// ============================================================================

/**
 * POST /api/storage/upload
 * Upload a file to S3
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const params = uploadFileSchema.parse(req.body);

    logger.info('[StorageRoutes] File upload started', {
      userId,
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    });

    // Check storage quota
    const quota = await getOrCreateQuota(userId);
    const newUsedSpace = quota.usedSpace + file.size;

    if (newUsedSpace > quota.totalLimit) {
      logger.warn('[StorageRoutes] Storage quota exceeded', {
        userId,
        usedSpace: quota.usedSpace,
        totalLimit: quota.totalLimit,
        requestedSize: file.size,
      });

      return res.status(403).json({
        success: false,
        error: 'Storage quota exceeded',
        quota: {
          used: quota.usedSpace,
          limit: quota.totalLimit,
          available: quota.totalLimit - quota.usedSpace,
        },
      });
    }

    // Generate storage key
    const storageKey = s3Service.generateStorageKey(
      userId,
      file.originalname,
      params.projectId ? `projects/${params.projectId}` : 'uploads'
    );

    // Upload to S3
    const uploadResult = await s3Service.uploadFile({
      file: file.buffer,
      key: storageKey,
      contentType: file.mimetype,
      metadata: {
        userId,
        originalName: file.originalname,
        projectId: params.projectId || '',
      },
      tags: params.tags ? Object.fromEntries(params.tags.map((t, i) => [`tag${i}`, t])) : undefined,
      acl: params.isPublic ? 'public-read' : 'private',
    });

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Upload failed',
      });
    }

    // Save file metadata to database
    const storedFile = await prisma.storedFile.create({
      data: {
        userId,
        projectId: params.projectId,
        fileName: file.originalname,
        originalName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
        tags: params.tags ? JSON.stringify(params.tags) : null,
        isPublic: params.isPublic,
        versionId: uploadResult.versionId,
        checksum: uploadResult.etag,
      },
    });

    // Update storage quota
    await prisma.storageQuota.update({
      where: { userId },
      data: {
        usedSpace: newUsedSpace,
        fileCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    });

    logger.info('[StorageRoutes] File uploaded successfully', {
      userId,
      fileId: storedFile.id,
      storageKey,
      size: file.size,
    });

    const result: FileUploadResult = {
      success: true,
      file: {
        ...storedFile,
        metadata: storedFile.metadata ? JSON.parse(storedFile.metadata) : undefined,
        tags: storedFile.tags ? JSON.parse(storedFile.tags) : undefined,
      },
    };

    res.json(result);
  } catch (error: any) {
    logger.error('[StorageRoutes] Upload failed', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/storage/upload/initiate
 * Initiate multipart upload for large files
 */
router.post('/upload/initiate', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { fileName, fileSize, mimeType, projectId } = req.body;

    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fileName, fileSize, mimeType',
      });
    }

    // Check quota
    const quota = await getOrCreateQuota(userId);
    if (quota.usedSpace + fileSize > quota.totalLimit) {
      return res.status(403).json({
        success: false,
        error: 'Storage quota exceeded',
      });
    }

    // Generate storage key
    const storageKey = s3Service.generateStorageKey(
      userId,
      fileName,
      projectId ? `projects/${projectId}` : 'uploads'
    );

    // Get signed upload URL
    const signedUrlResult = await s3Service.getSignedUploadUrl(storageKey, mimeType, 3600);

    if (!signedUrlResult.success) {
      return res.status(500).json({
        success: false,
        error: signedUrlResult.error,
      });
    }

    // Create upload session
    const uploadSession = await prisma.fileUploadSession.create({
      data: {
        userId,
        fileName,
        fileSize,
        storageKey,
        status: 'INITIATED',
        totalParts: Math.ceil(fileSize / (5 * 1024 * 1024)), // 5MB parts
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    res.json({
      success: true,
      uploadUrl: signedUrlResult.url,
      sessionId: uploadSession.id,
      storageKey,
      expiresAt: signedUrlResult.expiresAt,
    });
  } catch (error: any) {
    logger.error('[StorageRoutes] Failed to initiate upload', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// File Download Routes
// ============================================================================

/**
 * GET /api/storage/download/:fileId
 * Get signed URL for file download
 */
router.get('/download/:fileId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { fileId } = req.params;
    const inline = req.query.inline === 'true';

    logger.info('[StorageRoutes] Download requested', {
      userId,
      fileId,
      inline,
    });

    // Get file from database
    const storedFile = await prisma.storedFile.findUnique({
      where: { id: fileId },
    });

    if (!storedFile) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Check permissions (user must own the file or it must be public)
    if (storedFile.userId !== userId && !storedFile.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if file is deleted
    if (storedFile.isDeleted) {
      return res.status(410).json({
        success: false,
        error: 'File has been deleted',
      });
    }

    // Generate signed URL
    const contentDisposition = inline
      ? `inline; filename="${storedFile.fileName}"`
      : `attachment; filename="${storedFile.fileName}"`;

    const signedUrlResult = await s3Service.getSignedUrl({
      key: storedFile.storageKey,
      contentType: storedFile.mimeType,
      contentDisposition,
      expiresIn: 3600, // 1 hour
    });

    if (!signedUrlResult.success) {
      return res.status(500).json({
        success: false,
        error: signedUrlResult.error,
      });
    }

    // Update last accessed time
    await prisma.storedFile.update({
      where: { id: fileId },
      data: { lastAccessedAt: new Date() },
    });

    logger.info('[StorageRoutes] Download URL generated', {
      userId,
      fileId,
      expiresAt: signedUrlResult.expiresAt,
    });

    const result: FileDownloadResult = {
      success: true,
      url: signedUrlResult.url,
      file: {
        ...storedFile,
        metadata: storedFile.metadata ? JSON.parse(storedFile.metadata) : undefined,
        tags: storedFile.tags ? JSON.parse(storedFile.tags) : undefined,
      },
    };

    res.json(result);
  } catch (error: any) {
    logger.error('[StorageRoutes] Download failed', {
      error: error.message,
      fileId: req.params.fileId,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// File Management Routes
// ============================================================================

/**
 * GET /api/storage/files
 * List user's files
 */
router.get('/files', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const params = listFilesSchema.parse(req.query);

    logger.info('[StorageRoutes] List files requested', {
      userId,
      ...params,
    });

    // Build query
    const where: any = {
      userId,
      isDeleted: false,
    };

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.search) {
      where.OR = [
        { fileName: { contains: params.search } },
        { originalName: { contains: params.search } },
      ];
    }

    // Get files
    const [files, total] = await Promise.all([
      prisma.storedFile.findMany({
        where,
        take: params.limit,
        skip: params.offset,
        orderBy: { [params.sortBy]: params.sortOrder },
      }),
      prisma.storedFile.count({ where }),
    ]);

    const hasMore = params.offset + files.length < total;

    logger.info('[StorageRoutes] Files listed', {
      userId,
      count: files.length,
      total,
      hasMore,
    });

    const result: FileListResult = {
      success: true,
      files: files.map(f => ({
        ...f,
        metadata: f.metadata ? JSON.parse(f.metadata) : undefined,
        tags: f.tags ? JSON.parse(f.tags) : undefined,
      })),
      total,
      hasMore,
    };

    res.json(result);
  } catch (error: any) {
    logger.error('[StorageRoutes] List files failed', {
      error: error.message,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/storage/files/:fileId
 * Delete a file
 */
router.delete('/files/:fileId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { fileId } = req.params;
    const permanent = req.query.permanent === 'true';

    logger.info('[StorageRoutes] Delete requested', {
      userId,
      fileId,
      permanent,
    });

    // Get file
    const storedFile = await prisma.storedFile.findUnique({
      where: { id: fileId },
    });

    if (!storedFile) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Check ownership
    if (storedFile.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    if (permanent) {
      // Permanently delete from S3 and database
      await s3Service.deleteFile({ key: storedFile.storageKey });

      await prisma.storedFile.delete({
        where: { id: fileId },
      });

      // Update quota
      await prisma.storageQuota.update({
        where: { userId },
        data: {
          usedSpace: { decrement: storedFile.size },
          fileCount: { decrement: 1 },
          lastUpdated: new Date(),
        },
      });

      logger.info('[StorageRoutes] File permanently deleted', {
        userId,
        fileId,
      });
    } else {
      // Soft delete (mark as deleted)
      await prisma.storedFile.update({
        where: { id: fileId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      logger.info('[StorageRoutes] File soft deleted', {
        userId,
        fileId,
      });
    }

    const result: FileDeleteResult = {
      success: true,
    };

    res.json(result);
  } catch (error: any) {
    logger.error('[StorageRoutes] Delete failed', {
      error: error.message,
      fileId: req.params.fileId,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/storage/files/:fileId/rename
 * Rename a file
 */
router.put('/files/:fileId/rename', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { fileId } = req.params;
    const { newName } = req.body;

    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'New file name is required',
      });
    }

    logger.info('[StorageRoutes] Rename requested', {
      userId,
      fileId,
      newName,
    });

    // Get file
    const storedFile = await prisma.storedFile.findUnique({
      where: { id: fileId },
    });

    if (!storedFile) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Check ownership
    if (storedFile.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Update file name
    const updatedFile = await prisma.storedFile.update({
      where: { id: fileId },
      data: { fileName: newName },
    });

    logger.info('[StorageRoutes] File renamed', {
      userId,
      fileId,
      oldName: storedFile.fileName,
      newName,
    });

    const result: FileRenameResult = {
      success: true,
      file: {
        ...updatedFile,
        metadata: updatedFile.metadata ? JSON.parse(updatedFile.metadata) : undefined,
        tags: updatedFile.tags ? JSON.parse(updatedFile.tags) : undefined,
      },
    };

    res.json(result);
  } catch (error: any) {
    logger.error('[StorageRoutes] Rename failed', {
      error: error.message,
      fileId: req.params.fileId,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// Storage Statistics Routes
// ============================================================================

/**
 * GET /api/storage/quota
 * Get user's storage quota and usage
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    logger.info('[StorageRoutes] Quota requested', { userId });

    const quota = await getOrCreateQuota(userId);

    res.json({
      success: true,
      quota: {
        userId: quota.userId,
        totalLimit: quota.totalLimit,
        usedSpace: quota.usedSpace,
        availableSpace: quota.totalLimit - quota.usedSpace,
        fileCount: quota.fileCount,
        quotaExceeded: quota.usedSpace >= quota.totalLimit,
        quotaPercentage: (quota.usedSpace / quota.totalLimit) * 100,
      },
    });
  } catch (error: any) {
    logger.error('[StorageRoutes] Get quota failed', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/storage/statistics
 * Get detailed storage statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    logger.info('[StorageRoutes] Statistics requested', { userId });

    const [quota, files] = await Promise.all([
      getOrCreateQuota(userId),
      prisma.storedFile.findMany({
        where: { userId, isDeleted: false },
        orderBy: { uploadedAt: 'desc' },
      }),
    ]);

    // Group by project
    const byProject = files.reduce((acc, file) => {
      const projectId = file.projectId || 'no-project';
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName: file.projectId || 'Unorganized Files',
          fileCount: 0,
          totalSize: 0,
          percentageOfTotal: 0,
        };
      }
      acc[projectId].fileCount++;
      acc[projectId].totalSize += file.size;
      return acc;
    }, {} as Record<string, any>);

    // Calculate percentages
    Object.values(byProject).forEach((project: any) => {
      project.percentageOfTotal = (project.totalSize / quota.usedSpace) * 100;
    });

    // Group by file type
    const byFileType = files.reduce((acc, file) => {
      const type = file.mimeType.split('/')[0] || 'other';
      if (!acc[type]) {
        acc[type] = { type, count: 0, size: 0 };
      }
      acc[type].count++;
      acc[type].size += file.size;
      return acc;
    }, {} as Record<string, any>);

    const statistics: StorageStatistics = {
      quota: {
        userId: quota.userId,
        totalLimit: quota.totalLimit,
        usedSpace: quota.usedSpace,
        availableSpace: quota.totalLimit - quota.usedSpace,
        fileCount: quota.fileCount,
        quotaExceeded: quota.usedSpace >= quota.totalLimit,
        quotaPercentage: (quota.usedSpace / quota.totalLimit) * 100,
      },
      byProject: Object.values(byProject),
      byFileType: Object.values(byFileType),
      recentlyUploaded: files.slice(0, 10).map(f => ({
        ...f,
        metadata: f.metadata ? JSON.parse(f.metadata) : undefined,
        tags: f.tags ? JSON.parse(f.tags) : undefined,
      })),
      largestFiles: files
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(f => ({
          ...f,
          metadata: f.metadata ? JSON.parse(f.metadata) : undefined,
          tags: f.tags ? JSON.parse(f.tags) : undefined,
        })),
    };

    res.json({
      success: true,
      statistics,
    });
  } catch (error: any) {
    logger.error('[StorageRoutes] Get statistics failed', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get or create storage quota for user
 */
async function getOrCreateQuota(userId: string) {
  let quota = await prisma.storageQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.storageQuota.create({
      data: {
        userId,
        totalLimit: 1073741824, // 1GB default
        usedSpace: 0,
        fileCount: 0,
      },
    });

    logger.info('[StorageRoutes] Created storage quota', {
      userId,
      limit: quota.totalLimit,
    });
  }

  return quota;
}

export default router;
