/**
 * AI Function Cache - Client Side
 *
 * Client-side caching for AI function definitions using IndexedDB.
 * Reduces bandwidth and improves session initialization performance.
 *
 * Features:
 * - IndexedDB storage for large payloads
 * - Version-based cache validation
 * - Automatic cache expiration (7 days)
 * - Fallback to localStorage for metadata
 * - Performance metrics tracking
 */

// ===== TYPES =====

export interface FunctionCacheMetadata {
  version: string;
  hash: string;
  voiceFunctionCount: number;
  dawFunctionCount: number;
  totalFunctionCount: number;
  cachedAt: number;
  expiresAt: number;
}

export interface CachedFunctions {
  voice: any[];
  daw: any[];
  metadata: FunctionCacheMetadata;
}

export interface CacheStats {
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  bytesSaved: number;
  lastCacheUpdate: number | null;
}

// ===== CONFIGURATION =====

const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DB_NAME = 'dawg-ai-function-cache';
const DB_VERSION = 1;
const STORE_NAME = 'functions';
const METADATA_KEY = 'ai-functions-metadata';
const CACHE_KEY = 'ai-functions-data';

// ===== INDEXEDDB HELPERS =====

class FunctionCacheDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ===== CACHE SERVICE =====

class AIFunctionCacheService {
  private db: FunctionCacheDB;
  private stats: CacheStats = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    bytesSaved: 0,
    lastCacheUpdate: null,
  };

  constructor() {
    this.db = new FunctionCacheDB();
    this.loadStats();
  }

  /**
   * Get cached metadata from localStorage (lightweight)
   */
  private getMetadataFromStorage(): FunctionCacheMetadata | null {
    try {
      const stored = localStorage.getItem(METADATA_KEY);
      if (!stored) return null;

      const metadata: FunctionCacheMetadata = JSON.parse(stored);

      // Check if expired
      if (Date.now() > metadata.expiresAt) {
        console.log('📦 Function cache expired, invalidating...');
        this.clearCache();
        return null;
      }

      return metadata;
    } catch (error) {
      console.error('Error reading cache metadata:', error);
      return null;
    }
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadataToStorage(metadata: FunctionCacheMetadata): void {
    try {
      localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error saving cache metadata:', error);
    }
  }

  /**
   * Check if cache is valid for given version and hash
   */
  async isCacheValid(serverVersion: string, serverHash: string): Promise<boolean> {
    const metadata = this.getMetadataFromStorage();

    if (!metadata) {
      console.log('📦 No cached function definitions found');
      return false;
    }

    const isValid = metadata.version === serverVersion && metadata.hash === serverHash;

    if (!isValid) {
      console.log('📦 Cache invalid - version or hash mismatch');
      console.log(`   Cached: ${metadata.version} (${metadata.hash.substring(0, 12)}...)`);
      console.log(`   Server: ${serverVersion} (${serverHash.substring(0, 12)}...)`);
      await this.clearCache();
    }

    return isValid;
  }

  /**
   * Get cached function definitions
   */
  async getCachedFunctions(): Promise<CachedFunctions | null> {
    try {
      const metadata = this.getMetadataFromStorage();
      if (!metadata) {
        this.stats.cacheMisses++;
        this.updateStats();
        return null;
      }

      const cached = await this.db.get(CACHE_KEY);
      if (!cached) {
        this.stats.cacheMisses++;
        this.updateStats();
        return null;
      }

      this.stats.cacheHits++;

      // Estimate bytes saved (typical function definition payload size)
      this.stats.bytesSaved += 15000; // ~15KB saved per cache hit

      this.updateStats();

      console.log('✅ Loaded function definitions from cache');
      console.log(`   Cache hit rate: ${this.stats.cacheHitRate.toFixed(1)}%`);
      console.log(`   Bandwidth saved: ${(this.stats.bytesSaved / 1024).toFixed(2)} KB`);

      return {
        voice: cached.voice,
        daw: cached.daw,
        metadata,
      };
    } catch (error) {
      console.error('Error loading cached functions:', error);
      this.stats.cacheMisses++;
      this.updateStats();
      return null;
    }
  }

  /**
   * Save function definitions to cache
   */
  async saveFunctions(
    voiceFunctions: any[],
    dawFunctions: any[],
    metadata: Omit<FunctionCacheMetadata, 'cachedAt' | 'expiresAt'>
  ): Promise<void> {
    try {
      const now = Date.now();
      const fullMetadata: FunctionCacheMetadata = {
        ...metadata,
        cachedAt: now,
        expiresAt: now + CACHE_EXPIRATION_MS,
      };

      // Save to IndexedDB
      await this.db.set(CACHE_KEY, {
        voice: voiceFunctions,
        daw: dawFunctions,
      });

      // Save metadata to localStorage
      this.saveMetadataToStorage(fullMetadata);

      this.stats.lastCacheUpdate = now;
      this.updateStats();

      console.log('✅ Function definitions cached successfully');
      console.log(`   Version: ${metadata.version}`);
      console.log(`   Hash: ${metadata.hash.substring(0, 12)}...`);
      console.log(`   Total functions: ${metadata.totalFunctionCount}`);
      console.log(`   Expires: ${new Date(fullMetadata.expiresAt).toLocaleString()}`);
    } catch (error) {
      console.error('Error caching functions:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await this.db.clear();
      localStorage.removeItem(METADATA_KEY);
      console.log('🗑️  Function cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update and persist statistics
   */
  private updateStats(): void {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.cacheHitRate = total > 0 ? (this.stats.cacheHits / total) * 100 : 0;
    this.saveStats();
  }

  /**
   * Load statistics from localStorage
   */
  private loadStats(): void {
    try {
      const stored = localStorage.getItem('ai-function-cache-stats');
      if (stored) {
        this.stats = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  }

  /**
   * Save statistics to localStorage
   */
  private saveStats(): void {
    try {
      localStorage.setItem('ai-function-cache-stats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving cache stats:', error);
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      bytesSaved: 0,
      lastCacheUpdate: this.stats.lastCacheUpdate,
    };
    this.saveStats();
  }
}

// ===== SINGLETON EXPORT =====

export const aiFunctionCache = new AIFunctionCacheService();

// ===== HELPER FUNCTIONS =====

/**
 * Fetch function definitions from server with caching
 */
export async function fetchFunctionDefinitions(
  serverUrl: string
): Promise<CachedFunctions> {
  try {
    // Step 1: Check server metadata
    const metadataResponse = await fetch(`${serverUrl}/api/functions/metadata`);
    const serverMetadata = await metadataResponse.json();

    // Step 2: Check if cache is valid
    const isCacheValid = await aiFunctionCache.isCacheValid(
      serverMetadata.version,
      serverMetadata.hash
    );

    if (isCacheValid) {
      // Step 3a: Use cached functions
      const cached = await aiFunctionCache.getCachedFunctions();
      if (cached) {
        return cached;
      }
    }

    // Step 3b: Fetch fresh functions from server
    console.log('📥 Fetching function definitions from server...');
    const functionsResponse = await fetch(`${serverUrl}/api/functions/all`);
    const functions = await functionsResponse.json();

    // Step 4: Cache the functions
    await aiFunctionCache.saveFunctions(
      functions.voice,
      functions.daw,
      {
        version: serverMetadata.version,
        hash: serverMetadata.hash,
        voiceFunctionCount: serverMetadata.voiceFunctionCount,
        dawFunctionCount: serverMetadata.dawFunctionCount,
        totalFunctionCount: serverMetadata.totalFunctionCount,
      }
    );

    return {
      voice: functions.voice,
      daw: functions.daw,
      metadata: {
        version: serverMetadata.version,
        hash: serverMetadata.hash,
        voiceFunctionCount: serverMetadata.voiceFunctionCount,
        dawFunctionCount: serverMetadata.dawFunctionCount,
        totalFunctionCount: serverMetadata.totalFunctionCount,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRATION_MS,
      },
    };
  } catch (error) {
    console.error('Error fetching function definitions:', error);
    throw error;
  }
}

/**
 * Prefetch and cache function definitions in the background
 */
export async function prefetchFunctionDefinitions(serverUrl: string): Promise<void> {
  try {
    await fetchFunctionDefinitions(serverUrl);
    console.log('✅ Function definitions prefetched successfully');
  } catch (error) {
    console.error('Error prefetching function definitions:', error);
  }
}
