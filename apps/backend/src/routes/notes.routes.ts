/**
 * Notes and Voice Memos API Routes
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { importService } from '../services/notes/import.service.js';
import { analysisService } from '../services/notes/analysis.service.js';
import { actionRouterService } from '../services/notes/action-router.service.js';
import { completionService } from '../services/notes/completion.service.js';
import { learningLogService } from '../services/notes/learning-log.service.js';
import { voiceMemoCompService } from '../services/notes/voice-memo-comp.service.js';
import { taggingService } from '../services/notes/tagging.service.js';
import { logger } from '../../../src/lib/utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/voice-memos'); // Temp storage for voice memos
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for Whisper API
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.mp3', '.m4a', '.wav', '.mp4', '.mpeg', '.mpga', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * POST /api/notes/import/text
 * Import a text note
 */
router.post('/import/text', async (req: Request, res: Response) => {
  try {
    const { title, content, sourceType = 'manual' } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    const note = await importService.importNote(title, content, sourceType);

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    logger.error('Import text note error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import note',
    });
  }
});

/**
 * POST /api/notes/import/voice-memo
 * Import and transcribe a voice memo
 */
router.post('/import/voice-memo', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    const { autoAnalyze = 'true', appContext = 'dawg_ai' } = req.body;

    const result = await importService.importVoiceMemo(req.file.path, {
      autoTranscribe: true,
      autoAnalyze: autoAnalyze === 'true',
      appContext: appContext as 'jarvis' | 'dawg_ai',
    });

    res.json({
      success: true,
      memo: result.memo,
      note: result.note,
    });
  } catch (error) {
    logger.error('Import voice memo error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import voice memo',
    });
  }
});

/**
 * POST /api/notes/import/directory
 * Import all files from a directory
 */
router.post('/import/directory', async (req: Request, res: Response) => {
  try {
    const { path: dirPath, autoAnalyze = false, appContext = 'dawg_ai' } = req.body;

    if (!dirPath) {
      return res.status(400).json({
        success: false,
        error: 'Directory path is required',
      });
    }

    const status = await importService.importFromDirectory(dirPath, {
      autoAnalyze,
      appContext: appContext as 'jarvis' | 'dawg_ai',
    });

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error('Import directory error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import directory',
    });
  }
});

/**
 * GET /api/notes
 * Get all notes
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source, search } = req.query;

    let notes;

    if (source) {
      notes = await importService.getNotesBySource(source as any);
    } else if (search) {
      notes = await importService.searchNotes(search as string);
    } else {
      notes = await importService.getAllNotes();
    }

    res.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error) {
    logger.error('Get notes error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notes',
    });
  }
});

/**
 * POST /api/notes/:id/analyze
 * Analyze a specific note
 */
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appContext = 'dawg_ai', userPreferences } = req.body;

    const notes = await importService.getAllNotes();
    const note = notes.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    const analysis = await analysisService.analyzeNote(
      note,
      appContext as 'jarvis' | 'dawg_ai',
      userPreferences
    );

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('Analyze note error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze note',
    });
  }
});

/**
 * POST /api/notes/:id/execute-actions
 * Execute actions for a note
 */
router.post('/:id/execute-actions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appContext = 'dawg_ai' } = req.body;

    const notes = await importService.getAllNotes();
    const note = notes.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    // Analyze the note first
    const analysis = await analysisService.analyzeNote(note, appContext as 'jarvis' | 'dawg_ai');

    // Execute the suggested actions
    const actionResults = await actionRouterService.executeActions(analysis, note);

    res.json({
      success: true,
      analysis,
      actions: actionResults,
    });
  } catch (error) {
    logger.error('Execute actions error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute actions',
    });
  }
});

/**
 * GET /api/notes/voice-memos
 * Get all voice memos
 */
router.get('/voice-memos', async (req: Request, res: Response) => {
  try {
    const memos = await importService.getAllMemos();

    res.json({
      success: true,
      memos,
      count: memos.length,
    });
  } catch (error) {
    logger.error('Get voice memos error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get voice memos',
    });
  }
});

/**
 * POST /api/notes/sync/ios
 * Sync with iOS Notes/Voice Memos directory
 */
router.post('/sync/ios', async (req: Request, res: Response) => {
  try {
    // Default iOS sync paths (user can customize)
    const {
      notesPath = '~/Library/Group Containers/group.com.apple.notes/Media',
      voiceMemosPath = '~/Library/Application Support/com.apple.VoiceMemos/Recordings',
      appContext = 'dawg_ai'
    } = req.body;

    const status = await importService.importFromDirectory(notesPath, {
      autoAnalyze: true,
      autoTranscribe: true,
      appContext: appContext as 'jarvis' | 'dawg_ai',
    });

    res.json({
      success: true,
      status,
      message: 'iOS sync completed',
    });
  } catch (error) {
    logger.error('iOS sync error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync with iOS',
    });
  }
});

/**
 * PATCH /api/notes/:id
 * Update a note (title, content)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, editReason } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        error: 'At least one of title or content is required',
      });
    }

    const result = await completionService.updateNote(
      id,
      { title, content },
      editReason
    );

    res.json({
      success: true,
      note: result.note,
      version: result.version,
    });
  } catch (error) {
    logger.error('Update note error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note',
    });
  }
});

/**
 * POST /api/notes/:id/complete-song
 * Complete an incomplete song using AI
 */
router.post('/:id/complete-song', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userPreferences } = req.body;

    const result = await completionService.completeSong(id, userPreferences);

    res.json({
      success: true,
      note: result.note,
      version: result.version,
      message: 'Song completed successfully',
    });
  } catch (error) {
    logger.error('Complete song error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete song',
    });
  }
});

/**
 * GET /api/notes/:id/versions
 * Get version history for a note
 */
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const versions = await completionService.getVersionHistory(id);

    res.json({
      success: true,
      versions,
      count: versions.length,
    });
  } catch (error) {
    logger.error('Get versions error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version history',
    });
  }
});

/**
 * POST /api/notes/:id/restore/:version
 * Restore a specific version of a note
 */
router.post('/:id/restore/:version', async (req: Request, res: Response) => {
  try {
    const { id, version } = req.params;

    const result = await completionService.restoreVersion(id, parseInt(version));

    res.json({
      success: true,
      note: result.note,
      version: result.version,
      message: `Restored to version ${version}`,
    });
  } catch (error) {
    logger.error('Restore version error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore version',
    });
  }
});

/**
 * GET /api/notes/learning/log
 * Get JARVIS learning log
 */
router.get('/learning/log', async (req: Request, res: Response) => {
  try {
    const { type, batch, limit } = req.query;

    let log;
    if (type) {
      log = learningLogService.getEntriesByType(
        type as any,
        limit ? parseInt(limit as string) : undefined
      );
    } else if (batch) {
      log = learningLogService.getEntriesByBatch(parseInt(batch as string));
    } else {
      log = learningLogService.getRecentEntries(
        limit ? parseInt(limit as string) : 100
      );
    }

    res.json({
      success: true,
      log,
      count: log.length,
    });
  } catch (error) {
    logger.error('Get learning log error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get learning log',
    });
  }
});

/**
 * GET /api/notes/learning/metrics
 * Get JARVIS learning metrics
 */
router.get('/learning/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = learningLogService.getMetrics();

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    logger.error('Get learning metrics error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get learning metrics',
    });
  }
});

/**
 * GET /api/notes/learning/full
 * Get full learning log with metrics
 */
router.get('/learning/full', async (req: Request, res: Response) => {
  try {
    const data = learningLogService.getFullLog();

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    logger.error('Get full learning log error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get full learning log',
    });
  }
});

/**
 * POST /api/notes/voice-memos/comp
 * Comp (stitch together) multiple voice memo takes by note IDs
 */
router.post('/voice-memos/comp', async (req: Request, res: Response) => {
  try {
    const { noteIds, options = {} } = req.body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'noteIds array is required and must contain at least one ID',
      });
    }

    const result = await voiceMemoCompService.compVoiceMemosByNoteIds(noteIds, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to comp voice memos',
      });
    }

    res.json({
      success: true,
      comp: {
        filePath: result.compedFilePath,
        duration: result.duration,
        fileSize: result.fileSize,
        takesCount: result.takesCount,
      },
      message: `Successfully comped ${result.takesCount} voice memos`,
    });
  } catch (error) {
    logger.error('Comp voice memos error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to comp voice memos',
    });
  }
});

/**
 * GET /api/notes/voice-memos/comps
 * List all comped voice memos
 */
router.get('/voice-memos/comps', async (req: Request, res: Response) => {
  try {
    const comps = voiceMemoCompService.listCompedFiles();

    res.json({
      success: true,
      comps,
      count: comps.length,
    });
  } catch (error) {
    logger.error('List comps error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list comped files',
    });
  }
});

/**
 * POST /api/notes/:id/tag
 * Intelligently tag a voice memo
 */
router.post('/:id/tag', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notes = await importService.getAllNotes();
    const note = notes.find(n => n.id === id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    // Get voice memo for transcription
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const voiceMemo = await prisma.voiceMemo.findUnique({
      where: { noteId: note.id },
    });
    await prisma.$disconnect();

    const tags = await taggingService.tagVoiceMemo({
      lyrics: note.content,
      transcription: voiceMemo?.transcription || undefined,
      structure: undefined,
      fileName: voiceMemo?.fileName,
    });

    res.json({
      success: true,
      tags,
      noteId: note.id,
    });
  } catch (error) {
    logger.error('Tag voice memo error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to tag voice memo',
    });
  }
});

/**
 * POST /api/notes/voice-memos/search
 * Search voice memos by tags
 */
router.post('/voice-memos/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    // Get all notes with voice memos
    const notes = await importService.getNotesBySource('voice_memo');

    // Tag each note (this could be cached in production)
    const taggedMemos = await Promise.all(
      notes.map(async (note) => {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const voiceMemo = await prisma.voiceMemo.findUnique({
          where: { noteId: note.id },
        });
        await prisma.$disconnect();

        const tags = await taggingService.tagVoiceMemo({
          lyrics: note.content,
          transcription: voiceMemo?.transcription || undefined,
          structure: undefined,
          fileName: voiceMemo?.fileName,
        });

        return {
          tags,
          noteId: note.id,
          note,
        };
      })
    );

    // Search by tags
    const results = taggingService.searchByTag(taggedMemos, query);

    res.json({
      success: true,
      results: results.map(r => ({
        noteId: r.noteId,
        note: r.note,
        tags: r.tags,
      })),
      count: results.length,
      query,
    });
  } catch (error) {
    logger.error('Search voice memos error', { error: error.message || String(error) });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search voice memos',
    });
  }
});

export default router;
