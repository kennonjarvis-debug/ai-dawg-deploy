/**
 * File Routes
 * Module 10: Cloud Storage & Backend
 *
 * Handles file uploads and storage via Supabase
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../../../src/lib/utils/logger.js';

const router = Router();

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow audio files and common formats
    const allowedMimeTypes = [
      'audio/wav',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
      'audio/aac',
      'audio/m4a',
      'application/octet-stream', // For some audio files
    ];

    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(wav|mp3|ogg|flac|aac|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * POST /api/files/upload
 * Upload a file to Supabase storage
 */
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.supabase) {
        res.status(500).json({ error: 'Supabase client not initialized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          error: 'Validation error',
          message: 'No file provided'
        });
        return;
      }

      const { projectId } = req.body;

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${req.user!.id}/${timestamp}-${sanitizedFilename}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await req.supabase.storage
        .from('audio-files')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logger.error('Error uploading file', { uploadError });
        res.status(500).json({
          error: 'Upload failed',
          message: uploadError.message
        });
        return;
      }

      // Get public URL
      const { data: urlData } = req.supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      // Store file metadata in database
      const { data: fileRecord, error: dbError } = await req.supabase
        .from('files')
        .insert({
          user_id: req.user!.id,
          project_id: projectId || null,
          filename: req.file.originalname,
          storage_path: fileName,
          size_bytes: req.file.size,
          mime_type: req.file.mimetype
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Error saving file metadata', { dbError });
        // Try to delete uploaded file
        await req.supabase.storage.from('audio-files').remove([fileName]);

        res.status(500).json({
          error: 'Failed to save file metadata',
          message: dbError.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          id: fileRecord.id,
          url: urlData.publicUrl,
          path: fileName,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    } catch (error) {
      logger.error('Unexpected error', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload file'
      });
    }
  }
);

/**
 * GET /api/files
 * List all files for the authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { projectId } = req.query;

    let query = req.supabase
      .from('files')
      .select('*')
      .eq('user_id', req.user!.id);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: files, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching files', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Failed to fetch files',
        message: error.message
      });
      return;
    }

    // Add public URLs to response
    const filesWithUrls = files.map(file => {
      const { data: urlData } = req.supabase!.storage
        .from('audio-files')
        .getPublicUrl(file.storage_path);

      return {
        ...file,
        url: urlData.publicUrl
      };
    });

    res.json({
      success: true,
      data: filesWithUrls
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch files'
    });
  }
});

/**
 * GET /api/files/:id
 * Get a specific file by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    const { data: file, error } = await req.supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !file) {
      res.status(404).json({
        error: 'Not found',
        message: 'File not found'
      });
      return;
    }

    // Get public URL
    const { data: urlData } = req.supabase.storage
      .from('audio-files')
      .getPublicUrl(file.storage_path);

    res.json({
      success: true,
      data: {
        ...file,
        url: urlData.publicUrl
      }
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch file'
    });
  }
});

/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    // Get file metadata
    const { data: file, error: fetchError } = await req.supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !file) {
      res.status(404).json({
        error: 'Not found',
        message: 'File not found'
      });
      return;
    }

    // Delete from storage
    const { error: storageError } = await req.supabase.storage
      .from('audio-files')
      .remove([file.storage_path]);

    if (storageError) {
      logger.error('Error deleting file from storage', { storageError });
    }

    // Delete metadata from database
    const { error: dbError } = await req.supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (dbError) {
      logger.error('Error deleting file metadata', { dbError });
      res.status(500).json({
        error: 'Failed to delete file',
        message: dbError.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete file'
    });
  }
});

/**
 * POST /api/files/:id/duplicate
 * Duplicate a file
 */
router.post('/:id/duplicate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    // Get original file
    const { data: originalFile, error: fetchError } = await req.supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !originalFile) {
      res.status(404).json({
        error: 'Not found',
        message: 'File not found'
      });
      return;
    }

    // Download original file
    const { data: fileData, error: downloadError } = await req.supabase.storage
      .from('audio-files')
      .download(originalFile.storage_path);

    if (downloadError || !fileData) {
      logger.error('Error downloading file', { downloadError });
      res.status(500).json({
        error: 'Failed to duplicate file',
        message: 'Could not download original file'
      });
      return;
    }

    // Generate new file path
    const timestamp = Date.now();
    const newFileName = `${req.user!.id}/${timestamp}-copy-${originalFile.filename}`;

    // Upload duplicate
    const { error: uploadError } = await req.supabase.storage
      .from('audio-files')
      .upload(newFileName, fileData, {
        contentType: originalFile.mime_type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logger.error('Error uploading duplicate', { uploadError });
      res.status(500).json({
        error: 'Failed to duplicate file',
        message: uploadError.message
      });
      return;
    }

    // Create new file record
    const { data: newFile, error: dbError } = await req.supabase
      .from('files')
      .insert({
        user_id: req.user!.id,
        project_id: originalFile.project_id,
        filename: `copy-${originalFile.filename}`,
        storage_path: newFileName,
        size_bytes: originalFile.size_bytes,
        mime_type: originalFile.mime_type
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Error creating duplicate metadata', { dbError });
      res.status(500).json({
        error: 'Failed to create duplicate',
        message: dbError.message
      });
      return;
    }

    // Get public URL
    const { data: urlData } = req.supabase.storage
      .from('audio-files')
      .getPublicUrl(newFileName);

    res.status(201).json({
      success: true,
      data: {
        ...newFile,
        url: urlData.publicUrl
      }
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to duplicate file'
    });
  }
});

export default router;
