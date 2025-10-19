import OpenAI from 'openai';
import { VectorStore } from './vector-store';
import { KnowledgeGraph } from './knowledge-graph';
import { LearningEngine } from './learning-engine';

/**
 * Memory entry structure for test runs and fixes
 */
export interface MemoryEntry {
  id: string;
  timestamp: string;
  type: 'test_run' | 'test_failure' | 'fix_applied' | 'codebase_insight' | 'test_pattern';
  content: string;
  metadata: {
    testName?: string;
    errorType?: string;
    fixStrategy?: string;
    successRate?: number;
    affectedFiles?: string[];
    tags?: string[];
    relatedFeatures?: string[];
    [key: string]: any;
  };
  embedding?: number[];
}

/**
 * Query result from similarity search
 */
export interface SimilarMemory {
  memory: MemoryEntry;
  similarity: number;
  relevanceScore: number;
}

/**
 * Learning insight generated from past experiences
 */
export interface LearningInsight {
  pattern: string;
  confidence: number;
  examples: MemoryEntry[];
  recommendation: string;
  applicability: string[];
}

/**
 * AgentBrain: The memory and learning system for the testing agent
 *
 * Capabilities:
 * - Stores test results, failures, and fixes as vector embeddings
 * - Performs semantic search to find similar past failures
 * - Learns from fix patterns and improves over time
 * - Builds knowledge graph of codebase relationships
 * - Tracks test effectiveness and coverage
 */
export class AgentBrain {
  private openai: OpenAI;
  private vectorStore: VectorStore;
  private knowledgeGraph: KnowledgeGraph;
  private learningEngine: LearningEngine;
  private initialized: boolean = false;

  constructor(storageDir?: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.vectorStore = new VectorStore(storageDir);
    this.knowledgeGraph = new KnowledgeGraph();
    this.learningEngine = new LearningEngine();
  }

  /**
   * Initialize the brain system
   */
  async initialize(): Promise<void> {
    console.log('  Initializing Agent Brain...');

    await this.vectorStore.initialize();
    await this.knowledgeGraph.initialize();
    await this.learningEngine.initialize();

    this.initialized = true;

    const stats = await this.getMemoryStats();
    console.log(`  Brain initialized with ${stats.totalMemories} memories`);
  }

  /**
   * Store a new memory with vector embedding
   */
  async remember(entry: Omit<MemoryEntry, 'id' | 'timestamp' | 'embedding'>): Promise<string> {
    this.ensureInitialized();

    // Generate unique ID
    const id = `${entry.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create full memory entry
    const memory: MemoryEntry = {
      id,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Generate embedding for the content
    const embedding = await this.generateEmbedding(this.serializeMemory(memory));
    memory.embedding = embedding;

    // Store in vector database
    await this.vectorStore.store(memory);

    // Update knowledge graph
    if (memory.metadata.affectedFiles) {
      await this.knowledgeGraph.addRelationships(
        memory.metadata.testName || memory.id,
        memory.metadata.affectedFiles,
        entry.type
      );
    }

    // Update learning engine
    await this.learningEngine.recordEvent(memory);

    return id;
  }

  /**
   * Recall similar past experiences
   */
  async recall(query: string, limit: number = 5, filters?: Partial<MemoryEntry['metadata']>): Promise<SimilarMemory[]> {
    this.ensureInitialized();

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Search vector store
    const results = await this.vectorStore.search(queryEmbedding, limit * 2, filters);

    // Re-rank by relevance
    const reranked = this.reRankResults(results, query);

    return reranked.slice(0, limit);
  }

  /**
   * Find similar past failures
   */
  async findSimilarFailures(errorMessage: string, testName?: string, limit: number = 5): Promise<SimilarMemory[]> {
    this.ensureInitialized();

    const query = `Test failure: ${testName || 'unknown test'}\nError: ${errorMessage}`;

    const filters = {
      type: 'test_failure',
    };

    return await this.recall(query, limit, filters);
  }

  /**
   * Find effective fixes for a given error
   */
  async suggestFix(errorMessage: string, testName?: string): Promise<{
    suggestedFix: string;
    confidence: number;
    similarCases: SimilarMemory[];
    reasoning: string;
  }> {
    this.ensureInitialized();

    // Find similar failures
    const similarFailures = await this.findSimilarFailures(errorMessage, testName, 10);

    // Get associated fixes
    const fixes = await Promise.all(
      similarFailures.map(async (failure) => {
        const fixQuery = `Fix for: ${failure.memory.content}`;
        const fixFilters = {
          type: 'fix_applied',
          testName: failure.memory.metadata.testName,
        };
        return await this.recall(fixQuery, 3, fixFilters);
      })
    );

    const allFixes = fixes.flat();

    // Rank fixes by success rate
    const rankedFixes = allFixes
      .filter(f => f.memory.metadata.successRate !== undefined)
      .sort((a, b) => (b.memory.metadata.successRate || 0) - (a.memory.metadata.successRate || 0));

    if (rankedFixes.length === 0) {
      return {
        suggestedFix: 'No similar fixes found in memory. Recommend manual investigation.',
        confidence: 0,
        similarCases: similarFailures,
        reasoning: 'This appears to be a novel failure with no recorded fix patterns.',
      };
    }

    const bestFix = rankedFixes[0];
    const avgSuccessRate = rankedFixes.reduce((acc, f) => acc + (f.memory.metadata.successRate || 0), 0) / rankedFixes.length;

    return {
      suggestedFix: bestFix.memory.metadata.fixStrategy || bestFix.memory.content,
      confidence: avgSuccessRate,
      similarCases: similarFailures,
      reasoning: `Based on ${rankedFixes.length} similar cases with ${(avgSuccessRate * 100).toFixed(1)}% success rate`,
    };
  }

  /**
   * Learn from a successful fix
   */
  async learnFromFix(
    testName: string,
    errorMessage: string,
    fixStrategy: string,
    wasSuccessful: boolean,
    affectedFiles: string[]
  ): Promise<void> {
    this.ensureInitialized();

    // Store the fix as a memory
    await this.remember({
      type: 'fix_applied',
      content: `Fix for ${testName}: ${fixStrategy}`,
      metadata: {
        testName,
        errorType: this.categorizeError(errorMessage),
        fixStrategy,
        successRate: wasSuccessful ? 1.0 : 0.0,
        affectedFiles,
        tags: this.extractTags(fixStrategy),
      },
    });

    // Update learning patterns
    await this.learningEngine.learnFromFix(testName, errorMessage, fixStrategy, wasSuccessful);
  }

  /**
   * Get learning insights based on accumulated knowledge
   */
  async getLearningInsights(category?: string): Promise<LearningInsight[]> {
    this.ensureInitialized();
    return await this.learningEngine.getInsights(category);
  }

  /**
   * Store codebase knowledge
   */
  async storeCodebaseKnowledge(
    filePath: string,
    summary: string,
    features: string[],
    dependencies: string[]
  ): Promise<void> {
    this.ensureInitialized();

    await this.remember({
      type: 'codebase_insight',
      content: `File: ${filePath}\n${summary}`,
      metadata: {
        filePath,
        relatedFeatures: features,
        dependencies,
        tags: features,
      },
    });

    // Update knowledge graph
    await this.knowledgeGraph.addCodeFile(filePath, features, dependencies);
  }

  /**
   * Get knowledge about a specific file or feature
   */
  async getCodebaseKnowledge(fileOrFeature: string): Promise<{
    summary: string;
    relatedFiles: string[];
    dependencies: string[];
    testCoverage: string[];
  }> {
    this.ensureInitialized();

    // Search memories
    const memories = await this.recall(fileOrFeature, 10, { type: 'codebase_insight' });

    // Get from knowledge graph
    const graphData = await this.knowledgeGraph.getFileInfo(fileOrFeature);

    return {
      summary: memories.map(m => m.memory.content).join('\n\n'),
      relatedFiles: graphData.relatedFiles,
      dependencies: graphData.dependencies,
      testCoverage: graphData.tests,
    };
  }

  /**
   * Identify impact zone for a code change
   */
  async identifyImpactZone(changedFiles: string[]): Promise<{
    affectedTests: string[];
    affectedFeatures: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reasoning: string;
  }> {
    this.ensureInitialized();

    const impactAnalysis = await this.knowledgeGraph.analyzeImpact(changedFiles);

    return {
      affectedTests: impactAnalysis.tests,
      affectedFeatures: impactAnalysis.features,
      riskLevel: impactAnalysis.riskLevel,
      reasoning: impactAnalysis.reasoning,
    };
  }

  /**
   * Track test pattern effectiveness
   */
  async trackTestPattern(
    patternName: string,
    testName: string,
    effectiveness: number,
    notes: string
  ): Promise<void> {
    this.ensureInitialized();

    await this.remember({
      type: 'test_pattern',
      content: `Pattern "${patternName}" used in ${testName}: ${notes}`,
      metadata: {
        patternName,
        testName,
        effectiveness,
        tags: [patternName, 'test-pattern'],
      },
    });
  }

  /**
   * Get most effective test patterns
   */
  async getBestTestPatterns(category?: string): Promise<Array<{
    pattern: string;
    avgEffectiveness: number;
    usageCount: number;
    examples: string[];
  }>> {
    this.ensureInitialized();

    const filters: any = { type: 'test_pattern' };
    if (category) {
      filters.tags = [category];
    }

    const patterns = await this.vectorStore.search(
      await this.generateEmbedding('test patterns'),
      100,
      filters
    );

    // Group by pattern name
    const grouped = new Map<string, MemoryEntry[]>();
    patterns.forEach(p => {
      const name = p.metadata.patternName;
      if (!grouped.has(name)) {
        grouped.set(name, []);
      }
      grouped.get(name)!.push(p);
    });

    // Calculate statistics
    return Array.from(grouped.entries()).map(([pattern, entries]) => ({
      pattern,
      avgEffectiveness: entries.reduce((acc, e) => acc + (e.metadata.effectiveness || 0), 0) / entries.length,
      usageCount: entries.length,
      examples: entries.slice(0, 3).map(e => e.metadata.testName || ''),
    }))
    .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness);
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<{
    totalMemories: number;
    byType: Record<string, number>;
    oldestMemory: string;
    newestMemory: string;
  }> {
    this.ensureInitialized();
    return await this.vectorStore.getStats();
  }

  /**
   * Export knowledge for backup
   */
  async exportKnowledge(filepath: string): Promise<void> {
    this.ensureInitialized();
    await this.vectorStore.export(filepath);
  }

  /**
   * Import knowledge from backup
   */
  async importKnowledge(filepath: string): Promise<void> {
    this.ensureInitialized();
    await this.vectorStore.import(filepath);
  }

  /**
   * Clear old memories to stay within limit
   */
  async pruneOldMemories(keepMostRecent: number = 1000): Promise<number> {
    this.ensureInitialized();
    return await this.vectorStore.prune(keepMostRecent);
  }

  // ==================== Private Helper Methods ====================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AgentBrain not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate embedding using OpenAI API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit to avoid token limits
    });

    return response.data[0].embedding;
  }

  /**
   * Serialize memory entry to text for embedding
   */
  private serializeMemory(memory: MemoryEntry): string {
    return `
Type: ${memory.type}
Content: ${memory.content}
Metadata: ${JSON.stringify(memory.metadata)}
    `.trim();
  }

  /**
   * Re-rank search results by relevance
   */
  private reRankResults(results: MemoryEntry[], query: string): SimilarMemory[] {
    return results.map(memory => {
      // Calculate similarity score (cosine similarity is already done in vectorStore)
      const baseSimilarity = 0.8; // Placeholder since we get pre-filtered results

      // Boost recent memories
      const age = Date.now() - new Date(memory.timestamp).getTime();
      const recencyBoost = Math.exp(-age / (1000 * 60 * 60 * 24 * 30)); // Decay over 30 days

      // Boost by success rate if available
      const successBoost = memory.metadata.successRate || 0.5;

      const relevanceScore = baseSimilarity * (0.6 + 0.2 * recencyBoost + 0.2 * successBoost);

      return {
        memory,
        similarity: baseSimilarity,
        relevanceScore,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Categorize error type
   */
  private categorizeError(errorMessage: string): string {
    const categories = [
      { pattern: /timeout|timed out/i, category: 'timeout' },
      { pattern: /not found|404/i, category: 'not_found' },
      { pattern: /permission|403|401/i, category: 'permission' },
      { pattern: /network|fetch|connection/i, category: 'network' },
      { pattern: /assertion|expected|actual/i, category: 'assertion' },
      { pattern: /null|undefined/i, category: 'null_reference' },
      { pattern: /syntax|parse/i, category: 'syntax' },
      { pattern: /type|instanceof/i, category: 'type' },
    ];

    for (const { pattern, category } of categories) {
      if (pattern.test(errorMessage)) {
        return category;
      }
    }

    return 'unknown';
  }

  /**
   * Extract relevant tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];

    // Common test-related keywords
    const keywords = [
      'timeout', 'retry', 'mock', 'stub', 'fixture', 'setup', 'teardown',
      'api', 'ui', 'integration', 'unit', 'e2e', 'performance',
      'auth', 'validation', 'error-handling', 'async', 'sync'
    ];

    const lowerText = text.toLowerCase();
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }
}
