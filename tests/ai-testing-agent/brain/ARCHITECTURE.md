# Agent Brain Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AGENT BRAIN                                │
│                   Memory & Learning System                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼────┐  ┌────▼─────┐  ┌───▼──────────┐
          │    Vector    │  │ Knowledge│  │  Learning    │
          │    Store     │  │  Graph   │  │   Engine     │
          └─────────┬────┘  └────┬─────┘  └───┬──────────┘
                    │             │             │
              ┌─────▼─────────────▼─────────────▼─────┐
              │         Storage Layer (.json)          │
              │  • vector-store.json                   │
              │  • knowledge-graph.json                │
              │  • learning-engine.json                │
              └────────────────────────────────────────┘
```

## Component Architecture

### 1. AgentBrain (Main Interface)

The orchestrator that coordinates all brain functions.

```
┌───────────────────────────────────────────────────────┐
│                    AgentBrain                         │
├───────────────────────────────────────────────────────┤
│  Public API:                                          │
│  • remember(entry)          ─┐                        │
│  • recall(query)            ─┤─ Memory Operations     │
│  • findSimilarFailures()    ─┘                        │
│                                                        │
│  • suggestFix()             ─┐                        │
│  • learnFromFix()           ─┤─ Learning Operations   │
│  • getLearningInsights()    ─┘                        │
│                                                        │
│  • storeCodebaseKnowledge() ─┐                        │
│  • getCodebaseKnowledge()   ─┤─ Knowledge Operations  │
│  • identifyImpactZone()     ─┘                        │
│                                                        │
│  • trackTestPattern()       ─┐                        │
│  • getBestTestPatterns()    ─┤─ Pattern Operations    │
│  • getMemoryStats()         ─┘                        │
└───────────────────────────────────────────────────────┘
```

**Key Responsibilities:**
- Coordinate between components
- Generate embeddings via OpenAI API
- Provide unified interface
- Handle initialization

### 2. VectorStore (Similarity Search)

Stores and searches vector embeddings.

```
┌─────────────────────────────────────────────────────┐
│                   VectorStore                       │
├─────────────────────────────────────────────────────┤
│  Storage:                                           │
│  memories: Map<string, MemoryEntry>                 │
│    ├─ id: string                                    │
│    ├─ type: test_run | test_failure | fix | ...    │
│    ├─ content: string                               │
│    ├─ metadata: { ... }                             │
│    └─ embedding: number[] (1536 dimensions)         │
│                                                      │
│  Operations:                                        │
│  • store(entry) ──────────> Add to Map              │
│  • search(queryVector) ──> Cosine Similarity        │
│  • applyFilters() ───────> Metadata filtering       │
│  • autoPrune() ──────────> Smart memory cleanup     │
└─────────────────────────────────────────────────────┘
```

**Algorithm: Cosine Similarity**
```
For each stored vector v and query vector q:

  similarity = (v · q) / (|v| × |q|)

  where:
    v · q = dot product
    |v| = magnitude of v
    |q| = magnitude of q

Result: score from -1 to 1 (higher = more similar)
```

**Smart Pruning Strategy:**
```
When exceeding maxMemories (1000):

Score each memory:
  recencyScore = exp(-age / 30days) × 40
  successScore = successRate × 30
  criticalScore = isCritical ? 20 : 0
  insightScore = isCodebaseInsight ? 10 : 0

  totalScore = sum of above

Keep top N by score
```

### 3. KnowledgeGraph (Code Relationships)

Tracks relationships between code, tests, and features.

```
┌─────────────────────────────────────────────────────┐
│                 KnowledgeGraph                      │
├─────────────────────────────────────────────────────┤
│  Graph Structure:                                   │
│                                                      │
│  Nodes:                                             │
│    file:auth-service.ts ─────┐                      │
│    test:user-login ─────────┐│                      │
│    feature:authentication ──┼┼──> Each has:         │
│    component:LoginForm ─────┘│    • id              │
│                               └──> • type            │
│                                    • name            │
│  Edges:                            • metadata        │
│    from ──[type]──> to                              │
│                                                      │
│  Edge Types:                                        │
│    • depends_on  (file → file)                      │
│    • tests       (test → file/feature)              │
│    • implements  (file → feature)                   │
│    • uses        (file → component)                 │
│    • related_to  (generic relationship)             │
│                                                      │
│  Operations:                                        │
│  • addCodeFile() ────> Add nodes + edges            │
│  • addTest() ────────> Link test to code            │
│  • analyzeImpact() ──> BFS traversal                │
│  • findCoverageGaps()-> Untested files              │
└─────────────────────────────────────────────────────┘
```

**Impact Analysis Algorithm:**
```
Given changedFiles:

1. Queue = [file nodes for changedFiles]
2. While queue not empty:
     node = queue.pop()
     For each incoming edge to node:
       track affected test/feature/file
       if edge is depends_on or tests:
         add source to queue
3. Calculate risk:
     totalImpact = tests + features + files
     risk = low|medium|high|critical
```

### 4. LearningEngine (Pattern Recognition)

Learns from fix attempts and test patterns.

```
┌─────────────────────────────────────────────────────┐
│                  LearningEngine                     │
├─────────────────────────────────────────────────────┤
│  Knowledge Stores:                                  │
│                                                      │
│  fixPatterns: Map<string, FixPattern>               │
│    key: "errorType::normalizedFix"                  │
│    value: {                                         │
│      errorType: string                              │
│      fixStrategy: string                            │
│      successCount: number                           │
│      failureCount: number                           │
│      successRate: number (0-1)                      │
│      confidence: number (0-1)                       │
│      examples: [...last 10]                         │
│    }                                                 │
│                                                      │
│  testPatterns: Map<string, TestPattern>             │
│    key: "patternName"                               │
│    value: {                                         │
│      effectiveness: number (moving avg)             │
│      usageCount: number                             │
│      category: string                               │
│      examples: [...last 5]                          │
│    }                                                 │
│                                                      │
│  learningHistory: Array<LearningEvent>              │
│    Recent insights and patterns discovered          │
└─────────────────────────────────────────────────────┘
```

**Confidence Calculation:**
```
confidence(pattern) =
  sampleConfidence × 0.6 + rateConfidence × 0.4

where:
  sampleConfidence = min(totalSamples / 5, 1)
  rateConfidence = |successRate - 0.5| × 2

Interpretation:
  0.0 - 0.3: Low confidence (need more data)
  0.3 - 0.6: Medium confidence
  0.6 - 0.8: High confidence
  0.8 - 1.0: Very high confidence
```

## Data Flow

### Flow 1: Storing a Memory

```
1. User calls brain.remember()
         │
         ▼
2. AgentBrain generates embedding
   via OpenAI API (text-embedding-3-small)
         │
         ▼
3. Create MemoryEntry with embedding
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
4a. VectorStore.store()        4b. KnowledgeGraph.addRelationships()
    (if affectedFiles)
         │                             │
         ▼                             ▼
5a. Save to vector-store.json  5b. Save to knowledge-graph.json
         │                             │
         └─────────────┬───────────────┘
                       ▼
6. LearningEngine.recordEvent()
   (analyze for patterns)
                       │
                       ▼
7. Save to learning-engine.json
```

### Flow 2: Finding Similar Failures

```
1. User calls brain.findSimilarFailures(error)
         │
         ▼
2. Generate query embedding for error
         │
         ▼
3. VectorStore.search(queryEmbedding, filters)
         │
         ▼
4. For each stored embedding:
   calculate cosine similarity
         │
         ▼
5. Sort by similarity score
         │
         ▼
6. Re-rank by relevance:
   • Base similarity (60%)
   • Recency (20%)
   • Success rate (20%)
         │
         ▼
7. Return top N results
```

### Flow 3: Suggesting a Fix

```
1. User calls brain.suggestFix(error, test)
         │
         ▼
2. Find similar failures (flow 2)
         │
         ▼
3. For each similar failure:
   search for associated fixes
         │
         ▼
4. Collect all fixes
         │
         ▼
5. Rank by success rate
         │
         ▼
6. LearningEngine.getBestFix(errorType)
   (get most confident fix)
         │
         ▼
7. Return suggestion with:
   • Fix strategy
   • Confidence score
   • Reasoning
   • Similar cases
```

### Flow 4: Learning from a Fix

```
1. User calls brain.learnFromFix(test, error, fix, success)
         │
         ▼
2. Store fix as memory
         │
         ▼
3. LearningEngine.learnFromFix()
         │
         ├─ Update or create FixPattern
         │  • Increment success/failure count
         │  • Recalculate success rate
         │  • Recalculate confidence
         │  • Add to examples
         │
         └─ Add to learningHistory
         │
         ▼
4. Persist to learning-engine.json
```

## Memory Entry Schema

```typescript
interface MemoryEntry {
  // Core fields
  id: string;              // Auto-generated: "type_timestamp_random"
  timestamp: string;       // ISO 8601
  type: MemoryType;
  content: string;         // Main text content
  embedding?: number[];    // 1536-dim vector

  // Metadata
  metadata: {
    // Common fields
    testName?: string;
    errorType?: string;
    fixStrategy?: string;
    successRate?: number;
    affectedFiles?: string[];
    tags?: string[];
    relatedFeatures?: string[];

    // Extensible - add any custom fields
    [key: string]: any;
  };
}

// Memory types
type MemoryType =
  | 'test_run'          // Test execution record
  | 'test_failure'      // Failed test details
  | 'fix_applied'       // Fix attempt record
  | 'codebase_insight'  // Code knowledge
  | 'test_pattern';     // Test pattern usage
```

## Performance Characteristics

| Operation | Complexity | Time (1000 memories) | Notes |
|-----------|-----------|---------------------|--------|
| Store memory | O(1) | ~100ms | Embedding generation dominates |
| Search by similarity | O(n) | ~1ms | In-memory cosine similarity |
| Apply filters | O(n) | <1ms | Map iteration with filters |
| Generate embedding | O(1) | ~100ms | OpenAI API call |
| Save to disk | O(n) | ~10ms | JSON serialization |
| Load from disk | O(n) | ~20ms | JSON parsing + Map rebuild |
| Impact analysis | O(V+E) | ~2ms | BFS graph traversal |
| Auto-prune | O(n log n) | ~5ms | Sort by score + slice |

**Scalability:**
- Current: 1000 memories (in-memory JSON)
- With Qdrant: 1M+ memories (distributed vector DB)
- Embedding cache: Reduce API calls
- Incremental save: Only persist changes

## Storage Format

### vector-store.json
```json
{
  "version": "1.0",
  "savedAt": "2025-10-19T13:00:00Z",
  "memories": [
    {
      "id": "test_failure_1234_abc123",
      "timestamp": "2025-10-19T12:30:00Z",
      "type": "test_failure",
      "content": "Test 'user-login' failed with timeout",
      "metadata": {
        "testName": "user-login",
        "errorType": "timeout",
        "tags": ["auth", "timeout"]
      },
      "embedding": [0.123, -0.456, /* ...1536 values */]
    }
  ]
}
```

### knowledge-graph.json
```json
{
  "version": "1.0",
  "savedAt": "2025-10-19T13:00:00Z",
  "nodes": [
    {
      "id": "file:auth-service.ts",
      "type": "file",
      "name": "auth-service.ts",
      "metadata": {
        "path": "src/backend/auth-service.ts"
      }
    }
  ],
  "edges": {
    "file:auth-service.ts": [
      {
        "from": "file:auth-service.ts",
        "to": "feature:authentication",
        "type": "implements",
        "weight": 0.9
      }
    ]
  }
}
```

### learning-engine.json
```json
{
  "version": "1.0",
  "savedAt": "2025-10-19T13:00:00Z",
  "fixPatterns": [
    ["timeout::increase timeout", {
      "errorType": "timeout",
      "fixStrategy": "increase timeout to 60s",
      "successCount": 8,
      "failureCount": 2,
      "successRate": 0.8,
      "confidence": 0.72,
      "examples": [/* ...last 10 */]
    }]
  ],
  "testPatterns": [/* ... */],
  "learningHistory": [/* ...last 100 events */]
}
```

## Extension Points

### Custom Memory Types

```typescript
// Define custom type
type CustomMemoryType = MemoryType | 'performance_metric' | 'security_scan';

// Store custom memory
await brain.remember({
  type: 'performance_metric',
  content: 'API response time degraded',
  metadata: {
    endpoint: '/api/users',
    avgResponseTime: 1200,
    threshold: 500,
    tags: ['performance', 'degradation']
  }
});
```

### Custom Similarity Metrics

```typescript
// In vector-store.ts
class CustomVectorStore extends VectorStore {
  private customSimilarity(a: number[], b: number[]): number {
    // Implement your similarity metric
    // E.g., Euclidean distance, Manhattan distance, etc.
  }
}
```

### Custom Graph Algorithms

```typescript
// In knowledge-graph.ts
class CustomKnowledgeGraph extends KnowledgeGraph {
  async findCriticalPaths(from: string, to: string) {
    // Implement Dijkstra's or A* for critical path analysis
  }

  async detectCycles() {
    // Implement cycle detection
  }
}
```

### Custom Learning Models

```typescript
// In learning-engine.ts
class MLLearningEngine extends LearningEngine {
  async trainModel(data: MemoryEntry[]) {
    // Integrate with ML framework (TensorFlow, etc.)
  }

  async predictFailure(test: string): Promise<number> {
    // Predict failure probability
  }
}
```

## Future Enhancements

### Short Term
1. **Embedding Cache** - Cache embeddings to reduce API calls
2. **Batch Operations** - Process multiple memories at once
3. **Query Optimization** - Index by metadata for faster filtering
4. **Compression** - Compress embeddings for smaller storage

### Medium Term
1. **Qdrant Integration** - Production-grade vector database
2. **Multi-modal Embeddings** - Include code diffs, screenshots
3. **Real-time Streaming** - Stream search results
4. **Clustering** - Group similar memories automatically

### Long Term
1. **Reinforcement Learning** - Learn optimal strategies
2. **Distributed Brain** - Share knowledge across teams
3. **Predictive Analytics** - Predict failures before they happen
4. **Auto-fix Generation** - Generate code fixes automatically
5. **Visual Interface** - Dashboard for exploring knowledge

## Security Considerations

1. **API Key Protection**
   - Store OPENAI_API_KEY in environment variables
   - Never commit to version control
   - Rotate keys regularly

2. **Data Privacy**
   - Memories may contain sensitive code/errors
   - Review before sharing backups
   - Consider encryption for production

3. **Input Validation**
   - Sanitize user inputs before storing
   - Validate metadata structure
   - Limit content length

4. **Resource Limits**
   - Max memories (1000 default)
   - Max embedding requests/min
   - Storage quotas

## Monitoring & Debugging

### Enable Debug Logging

```typescript
const brain = new AgentBrain();
brain.debug = true;
await brain.initialize();
```

### Monitor Key Metrics

```typescript
const stats = await brain.getMemoryStats();
console.log('Total memories:', stats.totalMemories);
console.log('By type:', stats.byType);

const learningStats = await brain.getLearningInsights();
console.log('Fix patterns learned:', learningStats.length);
```

### Health Checks

```typescript
// Check if brain is healthy
async function healthCheck() {
  const stats = await brain.getMemoryStats();
  const insights = await brain.getLearningInsights();

  return {
    healthy: stats.totalMemories > 0,
    memories: stats.totalMemories,
    patterns: insights.length,
    oldestMemory: stats.oldestMemory,
    newestMemory: stats.newestMemory,
  };
}
```

## References

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Graph Algorithms](https://en.wikipedia.org/wiki/Graph_traversal)
- [Qdrant Vector Database](https://qdrant.tech/)
