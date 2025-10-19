import fs from 'fs/promises';
import path from 'path';
import { MemoryEntry } from './agent-brain';

/**
 * Search result with score
 */
export interface SearchResult {
  entry: MemoryEntry;
  score: number;
}

/**
 * VectorStore: Stores and searches vector embeddings
 *
 * Features:
 * - Store test results as embeddings
 * - Semantic similarity search
 * - Filter by metadata
 * - Persist to disk (JSON-based for simplicity)
 * - Support for Qdrant client (optional)
 *
 * Storage Format:
 * - Local JSON file with all vectors and metadata
 * - Can be upgraded to Qdrant for production use
 */
export class VectorStore {
  private memories: Map<string, MemoryEntry>;
  private storageDir: string;
  private storageFile: string;
  private maxMemories: number = 1000;
  private useQdrant: boolean = false;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.join(process.cwd(), 'tests/ai-testing-agent/brain/.storage');
    this.storageFile = path.join(this.storageDir, 'vector-store.json');
    this.memories = new Map();
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    // Create storage directory if it doesn't exist
    await fs.mkdir(this.storageDir, { recursive: true });

    // Load existing memories
    await this.load();

    console.log(`  VectorStore initialized with ${this.memories.size} memories`);
  }

  /**
   * Store a memory entry with its embedding
   */
  async store(entry: MemoryEntry): Promise<void> {
    if (!entry.embedding) {
      throw new Error('Memory entry must have an embedding');
    }

    this.memories.set(entry.id, entry);

    // Prune if exceeding max memories
    if (this.memories.size > this.maxMemories) {
      await this.autoPrune();
    }

    // Persist to disk
    await this.save();
  }

  /**
   * Search for similar memories using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    limit: number = 5,
    filters?: Partial<MemoryEntry['metadata']>
  ): Promise<MemoryEntry[]> {
    let candidates = Array.from(this.memories.values());

    // Apply filters
    if (filters) {
      candidates = this.applyFilters(candidates, filters);
    }

    // Calculate cosine similarity for each candidate
    const scored = candidates
      .map(entry => ({
        entry,
        score: this.cosineSimilarity(queryEmbedding, entry.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(s => s.entry);
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<MemoryEntry | undefined> {
    return this.memories.get(id);
  }

  /**
   * Delete memory by ID
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.memories.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  /**
   * Get all memories (with optional filtering)
   */
  async getAll(filters?: Partial<MemoryEntry['metadata']>): Promise<MemoryEntry[]> {
    let results = Array.from(this.memories.values());

    if (filters) {
      results = this.applyFilters(results, filters);
    }

    return results;
  }

  /**
   * Get statistics about stored memories
   */
  async getStats(): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    oldestMemory: string;
    newestMemory: string;
  }> {
    const entries = Array.from(this.memories.values());

    const byType: Record<string, number> = {};
    entries.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
    });

    const sorted = entries.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      totalMemories: entries.length,
      byType,
      oldestMemory: sorted[0]?.timestamp || 'N/A',
      newestMemory: sorted[sorted.length - 1]?.timestamp || 'N/A',
    };
  }

  /**
   * Export all memories to a file
   */
  async export(filepath: string): Promise<void> {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      memories: Array.from(this.memories.values()),
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Import memories from a file
   */
  async import(filepath: string): Promise<void> {
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);

    if (data.memories && Array.isArray(data.memories)) {
      for (const memory of data.memories) {
        this.memories.set(memory.id, memory);
      }
      await this.save();
    }
  }

  /**
   * Prune old memories to keep only the most recent N
   */
  async prune(keepMostRecent: number): Promise<number> {
    const entries = Array.from(this.memories.values());

    // Sort by timestamp (newest first)
    const sorted = entries.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Keep only the most recent
    const toKeep = sorted.slice(0, keepMostRecent);
    const removed = sorted.length - toKeep.length;

    // Clear and rebuild map
    this.memories.clear();
    toKeep.forEach(entry => {
      this.memories.set(entry.id, entry);
    });

    await this.save();

    return removed;
  }

  /**
   * Clear all memories
   */
  async clear(): Promise<void> {
    this.memories.clear();
    await this.save();
  }

  // ==================== Private Helper Methods ====================

  /**
   * Load memories from disk
   */
  private async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storageFile, 'utf-8');
      const data = JSON.parse(content);

      if (data.memories && Array.isArray(data.memories)) {
        this.memories.clear();
        data.memories.forEach((entry: MemoryEntry) => {
          this.memories.set(entry.id, entry);
        });
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn('  Warning: Failed to load vector store:', error.message);
      }
      // File doesn't exist yet, start fresh
    }
  }

  /**
   * Save memories to disk
   */
  private async save(): Promise<void> {
    const data = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      memories: Array.from(this.memories.values()),
    };

    await fs.writeFile(this.storageFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Auto-prune when exceeding max memories
   * Uses smart pruning: keeps recent and high-value memories
   */
  private async autoPrune(): Promise<void> {
    const entries = Array.from(this.memories.values());

    // Score each memory by importance
    const scored = entries.map(entry => {
      let score = 0;

      // Recent memories get higher scores
      const age = Date.now() - new Date(entry.timestamp).getTime();
      const recencyScore = Math.exp(-age / (1000 * 60 * 60 * 24 * 30)); // Decay over 30 days
      score += recencyScore * 40;

      // Successful fixes get higher scores
      if (entry.type === 'fix_applied' && entry.metadata.successRate) {
        score += entry.metadata.successRate * 30;
      }

      // Critical test failures get higher scores
      if (entry.type === 'test_failure' && entry.metadata.tags?.includes('critical')) {
        score += 20;
      }

      // Codebase insights are valuable
      if (entry.type === 'codebase_insight') {
        score += 10;
      }

      return { entry, score };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Keep top memories
    const toKeep = scored.slice(0, this.maxMemories);

    // Rebuild map
    this.memories.clear();
    toKeep.forEach(({ entry }) => {
      this.memories.set(entry.id, entry);
    });

    console.log(`  Auto-pruned ${entries.length - toKeep.length} low-value memories`);
  }

  /**
   * Apply metadata filters to memory entries
   */
  private applyFilters(
    entries: MemoryEntry[],
    filters: Partial<MemoryEntry['metadata']>
  ): MemoryEntry[] {
    return entries.filter(entry => {
      // Check type filter
      if (filters.type !== undefined) {
        // @ts-ignore - type is in filters but not in metadata
        if (entry.type !== filters.type) {
          return false;
        }
      }

      // Check other metadata filters
      for (const [key, value] of Object.entries(filters)) {
        if (key === 'type') continue; // Already handled above

        const entryValue = entry.metadata[key];

        if (entryValue === undefined) {
          return false;
        }

        // Array filters (tags, etc.)
        if (Array.isArray(value)) {
          if (!Array.isArray(entryValue)) {
            return false;
          }
          // Check if any filter value is in entry value
          if (!value.some(v => entryValue.includes(v))) {
            return false;
          }
        }
        // Direct comparison
        else if (entryValue !== value) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

/**
 * Qdrant-based vector store (optional, for production use)
 *
 * Uncomment and use this if you have Qdrant running:
 *
 * import { QdrantClient } from '@qdrant/js-client-rest';
 *
 * export class QdrantVectorStore extends VectorStore {
 *   private client: QdrantClient;
 *   private collectionName = 'agent_brain';
 *
 *   constructor(qdrantUrl: string = 'http://localhost:6333') {
 *     super();
 *     this.client = new QdrantClient({ url: qdrantUrl });
 *     this.useQdrant = true;
 *   }
 *
 *   async initialize(): Promise<void> {
 *     // Create collection if it doesn't exist
 *     const collections = await this.client.getCollections();
 *     const exists = collections.collections.some(c => c.name === this.collectionName);
 *
 *     if (!exists) {
 *       await this.client.createCollection(this.collectionName, {
 *         vectors: {
 *           size: 1536, // OpenAI text-embedding-3-small dimension
 *           distance: 'Cosine',
 *         },
 *       });
 *     }
 *
 *     console.log(`  QdrantVectorStore initialized`);
 *   }
 *
 *   async store(entry: MemoryEntry): Promise<void> {
 *     await this.client.upsert(this.collectionName, {
 *       points: [{
 *         id: entry.id,
 *         vector: entry.embedding!,
 *         payload: {
 *           type: entry.type,
 *           content: entry.content,
 *           timestamp: entry.timestamp,
 *           metadata: entry.metadata,
 *         },
 *       }],
 *     });
 *   }
 *
 *   async search(
 *     queryEmbedding: number[],
 *     limit: number = 5,
 *     filters?: Partial<MemoryEntry['metadata']>
 *   ): Promise<MemoryEntry[]> {
 *     const filter = filters ? this.buildQdrantFilter(filters) : undefined;
 *
 *     const results = await this.client.search(this.collectionName, {
 *       vector: queryEmbedding,
 *       limit,
 *       filter,
 *     });
 *
 *     return results.map(r => ({
 *       id: r.id as string,
 *       type: r.payload!.type as any,
 *       content: r.payload!.content as string,
 *       timestamp: r.payload!.timestamp as string,
 *       metadata: r.payload!.metadata as any,
 *       embedding: r.vector as number[],
 *     }));
 *   }
 *
 *   private buildQdrantFilter(filters: Partial<MemoryEntry['metadata']>): any {
 *     const must: any[] = [];
 *
 *     for (const [key, value] of Object.entries(filters)) {
 *       must.push({
 *         key: `metadata.${key}`,
 *         match: { value },
 *       });
 *     }
 *
 *     return { must };
 *   }
 * }
 */
