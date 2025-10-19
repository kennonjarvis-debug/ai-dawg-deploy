/**
 * Function Cache Service
 *
 * Server-side caching and optimization for AI function definitions.
 * Provides endpoints and utilities for:
 * - Version-based caching
 * - Cache validation via hashing
 * - Gzip compression for transmission
 * - Bandwidth usage tracking
 */

import zlib from 'zlib';
import { promisify } from 'util';
import {
  getFunctionDefinitionMetadata,
  getVoiceFunctions,
  getDAWFunctions,
  getAllFunctions,
  FUNCTION_DEFINITIONS_VERSION,
  FunctionDefinitionMetadata,
} from '../shared/ai-function-definitions';

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

// ===== CACHING UTILITIES =====

interface CachedFunctionData {
  metadata: FunctionDefinitionMetadata;
  voiceFunctions: any[];
  dawFunctions: any[];
  compressed: {
    voiceFunctions: Buffer;
    dawFunctions: Buffer;
    allFunctions: Buffer;
  };
  uncompressedSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// In-memory cache (server-side)
let cachedData: CachedFunctionData | null = null;

/**
 * Initialize and cache function definitions with compression
 */
export async function initializeFunctionCache(): Promise<CachedFunctionData> {
  if (cachedData) {
    return cachedData;
  }

  console.log('🔧 Initializing function definition cache...');

  const metadata = getFunctionDefinitionMetadata();
  const voiceFunctions = getVoiceFunctions();
  const dawFunctions = getDAWFunctions();
  const allFunctions = getAllFunctions();

  // Compress function definitions for efficient transmission
  const voiceFunctionsJson = JSON.stringify(voiceFunctions);
  const dawFunctionsJson = JSON.stringify(dawFunctions);
  const allFunctionsJson = JSON.stringify(allFunctions);

  const compressedVoice = await gzipAsync(voiceFunctionsJson);
  const compressedDAW = await gzipAsync(dawFunctionsJson);
  const compressedAll = await gzipAsync(allFunctionsJson);

  const uncompressedSize = metadata.uncompressedSize;
  const compressedSize = compressedAll.length;
  const compressionRatio = uncompressedSize / compressedSize;

  cachedData = {
    metadata,
    voiceFunctions,
    dawFunctions,
    compressed: {
      voiceFunctions: compressedVoice,
      dawFunctions: compressedDAW,
      allFunctions: compressedAll,
    },
    uncompressedSize,
    compressedSize,
    compressionRatio,
  };

  console.log('✅ Function cache initialized:');
  console.log(`   Version: ${metadata.version}`);
  console.log(`   Hash: ${metadata.hash.substring(0, 12)}...`);
  console.log(`   Total functions: ${metadata.totalFunctionCount} (${metadata.voiceFunctionCount} voice + ${metadata.dawFunctionCount} DAW)`);
  console.log(`   Uncompressed size: ${(uncompressedSize / 1024).toFixed(2)} KB`);
  console.log(`   Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
  console.log(`   Compression ratio: ${compressionRatio.toFixed(2)}x`);

  return cachedData;
}

/**
 * Get function definitions metadata (version + hash)
 * This is the lightweight payload sent on every session initialization
 */
export function getFunctionMetadata(): FunctionDefinitionMetadata {
  if (!cachedData) {
    return getFunctionDefinitionMetadata();
  }
  return cachedData.metadata;
}

/**
 * Get voice functions (for Realtime API)
 */
export function getCachedVoiceFunctions(): any[] {
  if (!cachedData) {
    return getVoiceFunctions();
  }
  return cachedData.voiceFunctions;
}

/**
 * Get DAW functions (for GPT-4o API)
 */
export function getCachedDAWFunctions(): any[] {
  if (!cachedData) {
    return getDAWFunctions();
  }
  return cachedData.dawFunctions;
}

/**
 * Get compressed voice functions for transmission
 */
export async function getCompressedVoiceFunctions(): Promise<Buffer> {
  if (!cachedData) {
    await initializeFunctionCache();
  }
  return cachedData!.compressed.voiceFunctions;
}

/**
 * Get compressed DAW functions for transmission
 */
export async function getCompressedDAWFunctions(): Promise<Buffer> {
  if (!cachedData) {
    await initializeFunctionCache();
  }
  return cachedData!.compressed.dawFunctions;
}

/**
 * Get compressed all functions for transmission
 */
export async function getCompressedAllFunctions(): Promise<Buffer> {
  if (!cachedData) {
    await initializeFunctionCache();
  }
  return cachedData!.compressed.allFunctions;
}

/**
 * Validate if client cache is valid
 */
export function validateClientCache(clientVersion: string, clientHash: string): boolean {
  const metadata = getFunctionMetadata();
  return clientVersion === metadata.version && clientHash === metadata.hash;
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  if (!cachedData) {
    return null;
  }

  return {
    version: cachedData.metadata.version,
    hash: cachedData.metadata.hash,
    functionCount: cachedData.metadata.totalFunctionCount,
    uncompressedSize: cachedData.uncompressedSize,
    compressedSize: cachedData.compressedSize,
    compressionRatio: cachedData.compressionRatio,
    bandwidthSavings: {
      perSession: {
        withoutCache: cachedData.uncompressedSize,
        withCache: 128, // Just metadata (version + hash)
        savings: cachedData.uncompressedSize - 128,
        savingsPercent: ((1 - 128 / cachedData.uncompressedSize) * 100).toFixed(2) + '%',
      },
      withCompression: {
        size: cachedData.compressedSize,
        savings: cachedData.uncompressedSize - cachedData.compressedSize,
        savingsPercent: ((1 - cachedData.compressedSize / cachedData.uncompressedSize) * 100).toFixed(2) + '%',
      },
    },
  };
}

// ===== BANDWIDTH TRACKING =====

interface BandwidthStats {
  sessionCount: number;
  cacheHits: number;
  cacheMisses: number;
  bytesSaved: number;
  bytesSent: number;
  totalBytesSavedIfCached: number;
  cacheHitRate: number;
}

const bandwidthStats: BandwidthStats = {
  sessionCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  bytesSaved: 0,
  bytesSent: 0,
  totalBytesSavedIfCached: 0,
  cacheHitRate: 0,
};

export function trackCacheHit() {
  bandwidthStats.sessionCount++;
  bandwidthStats.cacheHits++;
  if (cachedData) {
    bandwidthStats.bytesSaved += cachedData.uncompressedSize - 128; // Only sent metadata
    bandwidthStats.bytesSent += 128;
  }
  updateCacheHitRate();
}

export function trackCacheMiss() {
  bandwidthStats.sessionCount++;
  bandwidthStats.cacheMisses++;
  if (cachedData) {
    bandwidthStats.bytesSent += cachedData.compressedSize;
  }
  updateCacheHitRate();
}

function updateCacheHitRate() {
  if (bandwidthStats.sessionCount > 0) {
    bandwidthStats.cacheHitRate = (bandwidthStats.cacheHits / bandwidthStats.sessionCount) * 100;
  }
  if (cachedData) {
    bandwidthStats.totalBytesSavedIfCached =
      bandwidthStats.sessionCount * cachedData.uncompressedSize - bandwidthStats.bytesSent;
  }
}

export function getBandwidthStats(): BandwidthStats & { summary: string } {
  const summary = `
📊 Function Cache Bandwidth Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sessions: ${bandwidthStats.sessionCount}
Cache Hits: ${bandwidthStats.cacheHits} (${bandwidthStats.cacheHitRate.toFixed(1)}%)
Cache Misses: ${bandwidthStats.cacheMisses}
Bytes Sent: ${(bandwidthStats.bytesSent / 1024).toFixed(2)} KB
Bytes Saved: ${(bandwidthStats.bytesSaved / 1024).toFixed(2)} KB
Total Savings (if all cached): ${(bandwidthStats.totalBytesSavedIfCached / 1024).toFixed(2)} KB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  return {
    ...bandwidthStats,
    summary,
  };
}

export function resetBandwidthStats() {
  bandwidthStats.sessionCount = 0;
  bandwidthStats.cacheHits = 0;
  bandwidthStats.cacheMisses = 0;
  bandwidthStats.bytesSaved = 0;
  bandwidthStats.bytesSent = 0;
  bandwidthStats.totalBytesSavedIfCached = 0;
  bandwidthStats.cacheHitRate = 0;
}
