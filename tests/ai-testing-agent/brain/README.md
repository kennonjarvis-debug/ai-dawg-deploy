# Agent Brain - Memory and Learning System

A sophisticated memory and learning system for the AI Testing Agent that uses vector embeddings to remember past test runs, learn from failures, and improve over time.

## Overview

The Agent Brain provides four core capabilities:

1. **Vector Memory Store** - Stores test results, failures, and fixes as semantic embeddings
2. **Knowledge Graph** - Tracks code relationships, dependencies, and test coverage
3. **Learning Engine** - Learns from fix patterns and improves recommendations
4. **Semantic Search** - Finds similar past experiences using vector similarity

## Architecture

```
agent-brain/
├── agent-brain.ts       # Main brain class (memory operations)
├── vector-store.ts      # Vector database wrapper
├── knowledge-graph.ts   # Code relationship graph
├── learning-engine.ts   # Learning and pattern recognition
├── examples.ts          # Usage examples
└── .storage/           # Persistent storage (auto-created)
    ├── vector-store.json
    ├── knowledge-graph.json
    └── learning-engine.json
```

## Key Features

### 1. Memory Storage with Vector Embeddings

Store any test-related information as semantic embeddings using OpenAI's embedding API:

```typescript
const brain = new AgentBrain();
await brain.initialize();

// Store a test failure
await brain.remember({
  type: 'test_failure',
  content: 'Test "user-auth" failed with timeout error',
  metadata: {
    testName: 'user-auth',
    errorType: 'timeout',
    affectedFiles: ['auth-service.ts'],
    tags: ['auth', 'timeout', 'critical']
  }
});
```

**Memory Types:**
- `test_run` - Test execution results
- `test_failure` - Failed test details
- `fix_applied` - Applied fixes and outcomes
- `codebase_insight` - Code knowledge and documentation
- `test_pattern` - Test generation patterns

### 2. Semantic Search

Find similar past experiences using natural language:

```typescript
// Find similar failures
const similar = await brain.findSimilarFailures(
  'Network timeout connecting to API',
  'api-test',
  5  // limit
);

// General semantic search
const memories = await brain.recall(
  'authentication problems',
  10,
  { type: 'test_failure' }  // optional filters
);
```

### 3. Learning from Fixes

The brain tracks which fixes work and builds up expertise:

```typescript
// Learn from a fix
await brain.learnFromFix(
  'user-login-test',
  'timeout error after 30s',
  'Increased timeout to 60s and added retry logic',
  true,  // was successful
  ['auth-service.ts']
);

// Get fix suggestions
const suggestion = await brain.suggestFix(
  'timeout error after 30s',
  'checkout-test'
);

console.log(suggestion.suggestedFix);      // "Increased timeout to 60s..."
console.log(suggestion.confidence);         // 0.85 (85% success rate)
console.log(suggestion.reasoning);          // "Based on 12 similar cases..."
```

### 4. Knowledge Graph

Track code relationships and impact zones:

```typescript
// Store codebase knowledge
await brain.storeCodebaseKnowledge(
  'src/backend/auth-service.ts',
  'Handles user authentication and session management',
  ['auth', 'sessions', 'jwt'],
  ['database', 'redis', 'bcrypt']
);

// Analyze impact of changes
const impact = await brain.identifyImpactZone([
  'src/backend/auth-service.ts'
]);

console.log(impact.riskLevel);           // 'high'
console.log(impact.affectedTests);       // ['user-login', 'user-logout', ...]
console.log(impact.affectedFeatures);    // ['auth', 'sessions', ...]
```

### 5. Test Pattern Tracking

Learn which test patterns are most effective:

```typescript
// Track pattern effectiveness
await brain.trackTestPattern(
  'page-object-model',
  'user-login-test',
  0.95,  // effectiveness score
  'POM reduced test flakiness significantly'
);

// Get best patterns
const patterns = await brain.getBestTestPatterns();
patterns.forEach(p => {
  console.log(`${p.pattern}: ${p.avgEffectiveness * 100}% effective`);
});
```

### 6. Learning Insights

Get actionable insights from accumulated knowledge:

```typescript
const insights = await brain.getLearningInsights();

insights.forEach(insight => {
  console.log(`Pattern: ${insight.pattern}`);
  console.log(`Confidence: ${insight.confidence}`);
  console.log(`Recommendation: ${insight.recommendation}`);
  console.log(`Examples: ${insight.examples.length}`);
});
```

## Example Use Cases

### Use Case 1: Automated Fix Suggestions

When a test fails, the brain can suggest fixes based on past successes:

```typescript
// Test fails
const failure = 'Network timeout connecting to payment API';

// Brain finds similar failures and successful fixes
const suggestion = await brain.suggestFix(failure, 'payment-test');

if (suggestion.confidence > 0.7) {
  console.log('High confidence fix available:');
  console.log(suggestion.suggestedFix);
  // "Add circuit breaker pattern and increase timeout to 10s"

  // Apply fix automatically or show to developer
}
```

### Use Case 2: Impact Analysis for Code Changes

Before making changes, understand the impact:

```typescript
const impact = await brain.identifyImpactZone([
  'src/backend/payment-service.ts'
]);

console.log(`Risk: ${impact.riskLevel}`);
console.log(`Run these tests: ${impact.affectedTests.join(', ')}`);
console.log(`May affect: ${impact.affectedFeatures.join(', ')}`);
```

### Use Case 3: Continuous Learning

The brain improves over time as it sees more test runs:

```typescript
// After each test run
await brain.learnFromFix(
  testName,
  errorMessage,
  fixStrategy,
  wasSuccessful,
  affectedFiles
);

// Get insights about what's working
const stats = await brain.getLearningInsights();
// Shows:
// - Most effective fix patterns (85% success rate)
// - Common error types to focus on
// - Improving test patterns
```

### Use Case 4: Knowledge Base

Build up institutional knowledge about the codebase:

```typescript
// Store knowledge
await brain.storeCodebaseKnowledge(
  'src/backend/ai-brain-server.ts',
  'Main AI server handling chat, function calling, and streaming',
  ['chat', 'voice', 'function-calling'],
  ['openai', 'anthropic', 'socket.io']
);

// Query knowledge
const knowledge = await brain.getCodebaseKnowledge('chat');
// Returns summary, related files, dependencies, test coverage
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-api-key

# Optional
BRAIN_STORAGE_DIR=/path/to/storage  # Default: tests/ai-testing-agent/brain/.storage
```

### Storage Limits

By default, the brain keeps the most recent 1000 memories:

```typescript
// Manually prune old memories
await brain.pruneOldMemories(500);  // Keep only 500 most recent

// Smart auto-pruning keeps:
// - Recent memories
// - High success rate fixes
// - Critical failures
// - Valuable codebase insights
```

### Export/Import

Backup and restore brain knowledge:

```typescript
// Export
await brain.exportKnowledge('./brain-backup.json');

// Import
await brain.importKnowledge('./brain-backup.json');
```

## How It Works

### Vector Embeddings

The brain uses OpenAI's `text-embedding-3-small` model to convert text into 1536-dimensional vectors. Similar concepts have similar vectors, enabling semantic search.

```typescript
// Internally, this:
"Network timeout error"

// Becomes:
[0.123, -0.456, 0.789, ...1536 numbers]

// And can be compared to:
"API connection timed out"
// Which has a similar vector (high cosine similarity)
```

### Similarity Search

Uses cosine similarity to find related memories:

```
similarity = dot(vectorA, vectorB) / (magnitude(A) * magnitude(B))
```

Results are re-ranked by:
- Base similarity (60%)
- Recency (20% - recent memories preferred)
- Success rate (20% - successful fixes preferred)

### Learning Algorithm

Fix patterns are tracked with:
- Success rate (successful fixes / total attempts)
- Confidence (higher with more samples)
- Examples (last 10 uses)

```typescript
confidence = sampleConfidence * 0.6 + rateConfidence * 0.4

where:
  sampleConfidence = min(samples / 5, 1)
  rateConfidence = |successRate - 0.5| * 2
```

### Knowledge Graph

Built using:
- **Nodes**: Files, tests, features, components
- **Edges**: depends_on, tests, implements, uses, related_to
- **BFS traversal**: For impact analysis
- **Coverage analysis**: Finds untested files

## Performance

- **Embedding Generation**: ~100ms per text (OpenAI API)
- **Similarity Search**: ~1ms for 1000 memories (in-memory)
- **Storage**: ~500KB for 1000 memories
- **Persistence**: Auto-saves to JSON (can upgrade to Qdrant)

## Upgrading to Qdrant

For production use with millions of memories, upgrade to Qdrant:

```typescript
// Uncomment in vector-store.ts:
import { QdrantClient } from '@qdrant/js-client-rest';

const brain = new AgentBrain();
brain.vectorStore = new QdrantVectorStore('http://localhost:6333');
await brain.initialize();
```

Benefits:
- Scales to millions of vectors
- Faster search (~10ms for millions)
- Advanced filtering
- Distributed deployment

## Integration with Testing Agent

```typescript
import { DAWGTestingAgent } from '../agent';
import { AgentBrain } from './brain/agent-brain';

class SmartTestingAgent extends DAWGTestingAgent {
  private brain: AgentBrain;

  constructor() {
    super();
    this.brain = new AgentBrain();
  }

  async initialize() {
    await super.initialize();
    await this.brain.initialize();
  }

  async executeTestScenario(scenario: any) {
    const result = await super.executeTestScenario(scenario);

    // Store test result
    await this.brain.remember({
      type: result.status === 'passed' ? 'test_run' : 'test_failure',
      content: `${scenario.name}: ${result.status}`,
      metadata: {
        testName: scenario.name,
        errorType: result.error ? 'error' : undefined,
        duration: result.duration,
      }
    });

    // If failed, try to suggest fix
    if (result.status === 'failed' && result.error) {
      const suggestion = await this.brain.suggestFix(result.error, scenario.name);
      console.log(`Fix suggestion: ${suggestion.suggestedFix}`);
    }

    return result;
  }
}
```

## API Reference

See [examples.ts](./examples.ts) for complete usage examples.

### AgentBrain

Main class for memory and learning operations.

#### Methods

- `initialize()` - Initialize the brain system
- `remember(entry)` - Store a new memory
- `recall(query, limit?, filters?)` - Search for similar memories
- `findSimilarFailures(error, test?, limit?)` - Find similar past failures
- `suggestFix(error, test?)` - Get fix suggestions based on past successes
- `learnFromFix(test, error, fix, success, files)` - Learn from a fix attempt
- `getLearningInsights(category?)` - Get actionable learning insights
- `storeCodebaseKnowledge(file, summary, features, deps)` - Store code knowledge
- `getCodebaseKnowledge(fileOrFeature)` - Query code knowledge
- `identifyImpactZone(files)` - Analyze impact of code changes
- `trackTestPattern(pattern, test, effectiveness, notes)` - Track test pattern
- `getBestTestPatterns(category?)` - Get most effective patterns
- `getMemoryStats()` - Get memory statistics
- `exportKnowledge(file)` - Export to backup file
- `importKnowledge(file)` - Import from backup file
- `pruneOldMemories(keep)` - Prune old memories

## Examples

Run the examples:

```bash
# Run all examples
tsx tests/ai-testing-agent/brain/examples.ts

# Or run individually:
node -e "require('./examples').example1_BasicMemory()"
```

See [examples.ts](./examples.ts) for 8 complete examples covering all features.

## Future Enhancements

Potential improvements:

1. **Multi-modal Embeddings** - Include code diffs, screenshots
2. **Reinforcement Learning** - Learn optimal fix strategies
3. **Collaboration** - Share learnings across teams
4. **Predictive Analysis** - Predict likely failures before they happen
5. **Auto-fix Generation** - Generate code fixes automatically
6. **Integration Testing** - Learn from integration test patterns
7. **Performance Profiling** - Track and optimize test execution times
8. **Visual Analytics** - Dashboard showing learning progress

## Contributing

To extend the brain:

1. Add new memory types in `agent-brain.ts`
2. Implement custom similarity metrics in `vector-store.ts`
3. Add graph algorithms in `knowledge-graph.ts`
4. Extend learning patterns in `learning-engine.ts`

## License

MIT
