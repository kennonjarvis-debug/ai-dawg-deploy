/**
 * Function Cache API Routes
 *
 * Endpoints for AI function definition caching:
 * - GET /api/functions/metadata - Get version and hash (lightweight)
 * - GET /api/functions/voice - Get voice functions
 * - GET /api/functions/daw - Get DAW functions
 * - GET /api/functions/all - Get all functions
 * - GET /api/functions/stats - Get cache statistics
 */

import { Router } from 'express';
import {
  initializeFunctionCache,
  getFunctionMetadata,
  getCachedVoiceFunctions,
  getCachedDAWFunctions,
  validateClientCache,
  getCacheStats,
  getBandwidthStats,
  trackCacheHit,
  trackCacheMiss,
  getCompressedVoiceFunctions,
  getCompressedDAWFunctions,
  getCompressedAllFunctions,
} from '../services/function-cache-service';
import { getAllFunctions } from '../shared/ai-function-definitions';

const router = Router();

// Initialize cache on module load
initializeFunctionCache().catch((error) => {
  console.error('❌ Failed to initialize function cache:', error);
});

/**
 * GET /api/functions/metadata
 * Get function definitions metadata (version + hash)
 * This is sent on every session initialization
 */
router.get('/metadata', (req, res) => {
  try {
    const metadata = getFunctionMetadata();
    res.json(metadata);
  } catch (error: any) {
    console.error('Error getting function metadata:', error);
    res.status(500).json({ error: 'Failed to get function metadata' });
  }
});

/**
 * GET /api/functions/voice
 * Get voice functions (for Realtime API)
 * Supports compression via Accept-Encoding header
 */
router.get('/voice', async (req, res) => {
  try {
    const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

    if (acceptsGzip) {
      const compressed = await getCompressedVoiceFunctions();
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      res.send(compressed);
    } else {
      const functions = getCachedVoiceFunctions();
      res.json(functions);
    }

    trackCacheMiss(); // Track as cache miss (client doesn't have it)
  } catch (error: any) {
    console.error('Error getting voice functions:', error);
    res.status(500).json({ error: 'Failed to get voice functions' });
  }
});

/**
 * GET /api/functions/daw
 * Get DAW functions (for GPT-4o API)
 * Supports compression via Accept-Encoding header
 */
router.get('/daw', async (req, res) => {
  try {
    const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

    if (acceptsGzip) {
      const compressed = await getCompressedDAWFunctions();
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      res.send(compressed);
    } else {
      const functions = getCachedDAWFunctions();
      res.json(functions);
    }

    trackCacheMiss(); // Track as cache miss (client doesn't have it)
  } catch (error: any) {
    console.error('Error getting DAW functions:', error);
    res.status(500).json({ error: 'Failed to get DAW functions' });
  }
});

/**
 * GET /api/functions/all
 * Get all function definitions
 * Supports compression via Accept-Encoding header
 */
router.get('/all', async (req, res) => {
  try {
    const acceptsGzip = req.headers['accept-encoding']?.includes('gzip');

    if (acceptsGzip) {
      const compressed = await getCompressedAllFunctions();
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      res.send(compressed);
    } else {
      const functions = getAllFunctions();
      res.json(functions);
    }

    trackCacheMiss(); // Track as cache miss (client doesn't have it)
  } catch (error: any) {
    console.error('Error getting all functions:', error);
    res.status(500).json({ error: 'Failed to get all functions' });
  }
});

/**
 * POST /api/functions/validate
 * Validate if client cache is still valid
 * Body: { version: string, hash: string }
 * Returns: { valid: boolean, metadata?: FunctionDefinitionMetadata }
 */
router.post('/validate', (req, res) => {
  try {
    const { version, hash } = req.body;

    if (!version || !hash) {
      return res.status(400).json({ error: 'Version and hash are required' });
    }

    const isValid = validateClientCache(version, hash);

    if (isValid) {
      trackCacheHit();
      res.json({ valid: true });
    } else {
      trackCacheMiss();
      const metadata = getFunctionMetadata();
      res.json({ valid: false, metadata });
    }
  } catch (error: any) {
    console.error('Error validating cache:', error);
    res.status(500).json({ error: 'Failed to validate cache' });
  }
});

/**
 * GET /api/functions/stats
 * Get cache statistics and performance metrics
 */
router.get('/stats', (req, res) => {
  try {
    const cacheStats = getCacheStats();
    const bandwidthStats = getBandwidthStats();

    res.json({
      cache: cacheStats,
      bandwidth: bandwidthStats,
    });
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * GET /api/functions/health
 * Health check for function cache service
 */
router.get('/health', (req, res) => {
  try {
    const metadata = getFunctionMetadata();
    res.json({
      status: 'healthy',
      service: 'function-cache',
      version: metadata.version,
      functionCount: metadata.totalFunctionCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
