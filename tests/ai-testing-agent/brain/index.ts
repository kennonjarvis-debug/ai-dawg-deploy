/**
 * Agent Brain - Memory and Learning System
 *
 * A sophisticated memory system for AI testing agents that uses vector embeddings
 * to remember, learn, and improve from past test runs.
 *
 * @example
 * ```typescript
 * import { AgentBrain } from './brain';
 *
 * const brain = new AgentBrain();
 * await brain.initialize();
 *
 * // Store a memory
 * await brain.remember({
 *   type: 'test_failure',
 *   content: 'Test failed with timeout',
 *   metadata: { testName: 'user-login', errorType: 'timeout' }
 * });
 *
 * // Find similar failures
 * const similar = await brain.findSimilarFailures('timeout error', 'checkout-test');
 *
 * // Get fix suggestions
 * const fix = await brain.suggestFix('timeout error');
 * console.log(fix.suggestedFix);
 * ```
 */

export { AgentBrain, MemoryEntry, SimilarMemory, LearningInsight } from './agent-brain';
export { VectorStore, SearchResult } from './vector-store';
export { KnowledgeGraph, GraphNode, GraphEdge, ImpactAnalysis } from './knowledge-graph';
export { LearningEngine, FixPattern, TestPattern, LearningStats } from './learning-engine';

// Re-export examples for documentation
export * as examples from './examples';
