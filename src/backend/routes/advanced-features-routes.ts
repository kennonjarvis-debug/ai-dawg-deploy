/**
 * Advanced Features API Routes
 *
 * Unified routes for all advanced AI features:
 * - AI Memory
 * - Stem Separation
 * - Melody-to-Vocals
 * - AI Mastering
 * - Budget/Billing
 */

import express from 'express';
import multer from 'multer';
import { AIMemoryService } from '../services/ai-memory-service';
import { audioSeparationService } from '../services/audio-separation-service';
import { generateVocalsFromMelody } from '../services/melody-vocals-service';
import { calculateWhisperCost, calculateGPT4oCost } from '../services/cost-monitoring-service';

const router = express.Router();
const upload = multer({ dest: '/tmp/uploads/' });

const aiMemoryService = new AIMemoryService();

// ============================================================================
// AI MEMORY ROUTES
// ============================================================================

/**
 * Store a new memory
 * POST /api/v1/ai/memory
 */
router.post('/ai/memory', async (req, res) => {
  try {
    const { userId, type, category, content, importance, expiresAt } = req.body;

    if (!userId || !type || !content) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, content'
      });
    }

    const memory = await aiMemoryService.storeMemory({
      userId,
      type,
      category,
      content,
      importance,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.json({ success: true, memory });
  } catch (error: any) {
    console.error('[AI Memory] Store failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retrieve memories for a user
 * GET /api/v1/ai/memory/:userId
 */
router.get('/ai/memory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, category, limit, minImportance } = req.query;

    const memories = await aiMemoryService.retrieveMemories({
      userId,
      type: type as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : 50,
      minImportance: minImportance ? parseInt(minImportance as string) : 1
    });

    res.json({
      success: true,
      memories,
      total: memories.length,
      sessionCount: memories.filter(m => {
        const age = Date.now() - new Date(m.lastAccessed).getTime();
        return age < 3600000; // Last hour
      }).length
    });
  } catch (error: any) {
    console.error('[AI Memory] Retrieve failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a memory
 * DELETE /api/v1/ai/memory/:memoryId
 */
router.delete('/ai/memory/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    await aiMemoryService.deleteMemory(memoryId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[AI Memory] Delete failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STEM SEPARATION ROUTES
// ============================================================================

/**
 * Separate audio into stems (vocals, drums, bass, other)
 * POST /api/v1/audio/separate-stems
 */
router.post('/audio/separate-stems', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { projectId } = req.body;
    const audioFilePath = req.file.path;

    console.log('[Stem Separation] Starting separation...', { projectId, audioFilePath });

    // For demo purposes, return placeholder URLs
    // In production, this would process the audio file
    const stems = {
      vocals: `https://example.com/stems/${projectId}/vocals.wav`,
      drums: `https://example.com/stems/${projectId}/drums.wav`,
      bass: `https://example.com/stems/${projectId}/bass.wav`,
      other: `https://example.com/stems/${projectId}/other.wav`,
      metadata: {
        processingTime: 45000, // ms
        sampleRate: 44100,
        duration: 180, // seconds
        techniques: ['HPSS', 'Spectral Masking', 'Frequency Isolation']
      }
    };

    res.json({
      success: true,
      stems,
      message: 'Stems separated successfully'
    });
  } catch (error: any) {
    console.error('[Stem Separation] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MELODY-TO-VOCALS ROUTES
// ============================================================================

/**
 * Convert hummed melody to full vocals with AI-generated lyrics
 * POST /api/v1/ai/melody-to-vocals
 */
router.post('/ai/melody-to-vocals', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { prompt, genre, mood, theme, projectId } = req.body;
    const audioFilePath = req.file.path;

    console.log('[Melody-to-Vocals] Starting conversion...', {
      prompt,
      genre,
      mood,
      projectId
    });

    const result = await generateVocalsFromMelody({
      audioFilePath,
      prompt,
      genre,
      mood,
      theme,
      aiProvider: 'anthropic',
      vocalModel: 'bark'
    });

    res.json({
      success: true,
      ...result,
      message: 'Vocals generated successfully'
    });
  } catch (error: any) {
    console.error('[Melody-to-Vocals] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI MASTERING ROUTES
// ============================================================================

/**
 * Apply AI mastering to a project
 * POST /api/v1/ai/master
 */
router.post('/ai/master', async (req, res) => {
  try {
    const { projectId, targetLoudness, genre } = req.body;

    if (!projectId || !targetLoudness) {
      return res.status(400).json({
        error: 'Missing required fields: projectId, targetLoudness'
      });
    }

    console.log('[AI Mastering] Starting mastering...', {
      projectId,
      targetLoudness,
      genre
    });

    // Placeholder response - in production, would call AIMasteringEngine
    const result = {
      success: true,
      projectId,
      masteringChain: {
        stereoEnhancement: { width: 120, midsBoost: 0.5, sidesBoost: 1.0 },
        multiBandEQ: [
          { frequency: 50, gain: -1.5, Q: 0.7, type: 'lowshelf' },
          { frequency: 200, gain: 0.5, Q: 1.0, type: 'peaking' },
          { frequency: 1000, gain: -0.5, Q: 1.2, type: 'peaking' },
          { frequency: 3000, gain: 1.0, Q: 1.0, type: 'peaking' },
          { frequency: 8000, gain: 2.0, Q: 0.8, type: 'highshelf' }
        ],
        finalLimiter: {
          threshold: -1.0,
          release: 100,
          targetLUFS: targetLoudness
        }
      },
      analysis: {
        integratedLUFS: targetLoudness,
        loudnessRange: 6.5,
        truePeak: -1.0,
        spectralBalance: 'balanced',
        overallQuality: 'excellent'
      },
      processingTime: 5000 // ms
    };

    res.json(result);
  } catch (error: any) {
    console.error('[AI Mastering] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BUDGET / BILLING ROUTES
// ============================================================================

/**
 * Get current usage for a user
 * GET /api/v1/billing/usage/:userId/current
 */
router.get('/billing/usage/:userId/current', async (req, res) => {
  try {
    const { userId } = req.params;

    // Placeholder - in production, would query actual usage from cost-monitoring-service
    const mockUsage = {
      current: Math.random() * 50, // Random usage $0-50
      limit: 100,
      breakdown: {
        whisper: Math.random() * 10,
        gpt4o: Math.random() * 20,
        tts: Math.random() * 5,
        realtimeApi: Math.random() * 15
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(mockUsage);
  } catch (error: any) {
    console.error('[Billing] Get usage failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set budget limit for a user
 * POST /api/v1/billing/budget/:userId
 */
router.post('/billing/budget/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, alertThresholds } = req.body;

    if (!limit || limit <= 0) {
      return res.status(400).json({ error: 'Invalid budget limit' });
    }

    console.log('[Billing] Setting budget limit:', { userId, limit, alertThresholds });

    // Placeholder - in production, would save to database
    res.json({
      success: true,
      userId,
      limit,
      alertThresholds: alertThresholds || [0.75, 0.90, 1.0]
    });
  } catch (error: any) {
    console.error('[Billing] Set budget failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get usage history
 * GET /api/v1/billing/usage/:userId/history
 */
router.get('/billing/usage/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const historyDays = days ? parseInt(days as string) : 30;

    // Placeholder - in production, would query actual history
    const mockHistory = Array.from({ length: historyDays }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: Math.random() * 5,
      breakdown: {
        whisper: Math.random() * 1,
        gpt4o: Math.random() * 2,
        tts: Math.random() * 0.5,
        realtimeApi: Math.random() * 1.5
      }
    })).reverse();

    res.json({
      success: true,
      history: mockHistory,
      totalCost: mockHistory.reduce((sum, day) => sum + day.cost, 0)
    });
  } catch (error: any) {
    console.error('[Billing] Get history failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
