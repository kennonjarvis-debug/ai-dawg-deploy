# Quick Start Guide - Agent Brain

Get started with the Agent Brain in 5 minutes.

## Prerequisites

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."
```

## Basic Usage

### 1. Initialize the Brain

```typescript
import { AgentBrain } from './brain';

const brain = new AgentBrain();
await brain.initialize();
```

### 2. Store Your First Memory

```typescript
// Record a test failure
await brain.remember({
  type: 'test_failure',
  content: 'Test "user-login" failed: timeout after 30 seconds',
  metadata: {
    testName: 'user-login',
    errorType: 'timeout',
    affectedFiles: ['src/auth/login.ts'],
    tags: ['auth', 'timeout']
  }
});
```

### 3. Learn From a Fix

```typescript
// Record how you fixed it
await brain.learnFromFix(
  'user-login',                    // test name
  'timeout after 30 seconds',      // error
  'Increased timeout to 60s',      // fix
  true,                            // was successful?
  ['src/auth/login.ts']            // files changed
);
```

### 4. Get Help on Future Failures

```typescript
// Next time a similar error occurs
const suggestion = await brain.suggestFix(
  'timeout after 30 seconds',
  'user-checkout'
);

console.log(suggestion.suggestedFix);
// "Increased timeout to 60s"

console.log(suggestion.confidence);
// 1.0 (100% success rate from past experience)
```

## Common Workflows

### Workflow 1: Test Fails → Find Similar → Apply Fix

```typescript
// 1. Test fails
const errorMessage = 'Network connection timeout';

// 2. Find similar past failures
const similar = await brain.findSimilarFailures(errorMessage, 'api-test');

console.log(`Found ${similar.length} similar failures`);
similar.forEach(f => {
  console.log(`- ${f.memory.metadata.testName}: ${f.similarity.toFixed(2)}`);
});

// 3. Get fix suggestion
const fix = await brain.suggestFix(errorMessage, 'api-test');

if (fix.confidence > 0.7) {
  console.log('High confidence fix:', fix.suggestedFix);
  // Apply the fix
}
```

### Workflow 2: Track Code Knowledge

```typescript
// Store knowledge about your codebase
await brain.storeCodebaseKnowledge(
  'src/backend/payment-service.ts',
  'Handles payment processing via Stripe API',
  ['payments', 'stripe', 'checkout'],
  ['stripe', 'axios', 'auth-service']
);

// Later, query it
const knowledge = await brain.getCodebaseKnowledge('payments');
console.log(knowledge.summary);
console.log('Related files:', knowledge.relatedFiles);
console.log('Test coverage:', knowledge.testCoverage);
```

### Workflow 3: Impact Analysis

```typescript
// Before making changes, understand the impact
const impact = await brain.identifyImpactZone([
  'src/backend/auth-service.ts'
]);

console.log(`Risk Level: ${impact.riskLevel}`);
console.log(`Affected Tests: ${impact.affectedTests.join(', ')}`);
console.log(`Affected Features: ${impact.affectedFeatures.join(', ')}`);

// Decide whether to proceed based on risk level
if (impact.riskLevel === 'critical') {
  console.log('Warning: This change affects critical systems!');
}
```

### Workflow 4: Learn Best Test Patterns

```typescript
// Track test pattern effectiveness
await brain.trackTestPattern(
  'retry-with-backoff',
  'flaky-api-test',
  0.95,  // 95% effective
  'Adding retry logic fixed the flakiness'
);

// Get best patterns
const patterns = await brain.getBestTestPatterns();
console.log('Top 5 most effective patterns:');
patterns.slice(0, 5).forEach((p, i) => {
  console.log(`${i + 1}. ${p.pattern}: ${(p.avgEffectiveness * 100).toFixed(1)}%`);
});
```

## Integration with Testing Agent

Update your testing agent to use the brain:

```typescript
import { DAWGTestingAgent } from './agent';
import { AgentBrain } from './brain/agent-brain';

class SmartAgent extends DAWGTestingAgent {
  private brain: AgentBrain;

  constructor() {
    super();
    this.brain = new AgentBrain();
  }

  async initialize() {
    await super.initialize();
    await this.brain.initialize();
    console.log('Smart agent with brain initialized!');
  }

  // Override test execution to use brain
  async executeTestScenario(scenario: any) {
    const result = await super.executeTestScenario(scenario);

    // Store result in brain
    if (result.status === 'failed' && result.error) {
      await this.brain.remember({
        type: 'test_failure',
        content: `${scenario.name}: ${result.error}`,
        metadata: {
          testName: scenario.name,
          errorType: this.categorizeError(result.error),
          tags: scenario.tags,
        }
      });

      // Try to suggest a fix
      const suggestion = await this.brain.suggestFix(
        result.error,
        scenario.name
      );

      if (suggestion.confidence > 0.6) {
        console.log('\nSuggested fix:', suggestion.suggestedFix);
        console.log('Confidence:', (suggestion.confidence * 100).toFixed(1) + '%');
      }
    } else if (result.status === 'passed') {
      await this.brain.remember({
        type: 'test_run',
        content: `${scenario.name}: passed`,
        metadata: {
          testName: scenario.name,
          duration: result.duration,
        }
      });
    }

    return result;
  }

  // When a fix is applied
  async applyFix(testName: string, error: string, fix: string) {
    // Apply the fix...
    const success = true; // or false based on outcome

    // Learn from it
    await this.brain.learnFromFix(
      testName,
      error,
      fix,
      success,
      ['file-that-was-changed.ts']
    );
  }
}
```

## Running Examples

```bash
# Run all examples
tsx tests/ai-testing-agent/brain/examples.ts

# Run specific example
node -e "
  const { example1_BasicMemory } = require('./examples');
  example1_BasicMemory();
"
```

## Storage and Persistence

The brain automatically saves to:
```
tests/ai-testing-agent/brain/.storage/
├── vector-store.json         # Vector embeddings
├── knowledge-graph.json      # Code relationships
└── learning-engine.json      # Fix patterns
```

Data persists across runs automatically!

## Memory Management

```typescript
// View statistics
const stats = await brain.getMemoryStats();
console.log(`Total memories: ${stats.totalMemories}`);
console.log('By type:', stats.byType);

// Export backup
await brain.exportKnowledge('./backup.json');

// Import backup
await brain.importKnowledge('./backup.json');

// Prune old memories (keeps most recent 500)
const removed = await brain.pruneOldMemories(500);
console.log(`Removed ${removed} old memories`);
```

## Tips & Best Practices

### 1. Be Specific in Memory Content

```typescript
// ❌ Bad - too vague
await brain.remember({
  type: 'test_failure',
  content: 'test failed',
  metadata: {}
});

// ✅ Good - specific and descriptive
await brain.remember({
  type: 'test_failure',
  content: 'Test "checkout-flow" failed: Payment API returned 503 Service Unavailable after 3 retries',
  metadata: {
    testName: 'checkout-flow',
    errorType: 'network',
    tags: ['payment', 'api', 'timeout']
  }
});
```

### 2. Tag Everything

Tags improve searchability:

```typescript
metadata: {
  tags: ['auth', 'critical', 'regression', 'timeout']
}
```

### 3. Record Both Successes and Failures

```typescript
// Don't just record failures - record successes too!
await brain.remember({
  type: 'test_run',
  content: 'All payment tests passed after implementing retry logic',
  metadata: {
    tags: ['payment', 'success', 'retry'],
    successRate: 1.0
  }
});
```

### 4. Track File Changes

Always include affected files:

```typescript
metadata: {
  affectedFiles: [
    'src/backend/payment-service.ts',
    'src/tests/payment.test.ts'
  ]
}
```

### 5. Learn Continuously

After every fix attempt (successful or not):

```typescript
await brain.learnFromFix(
  testName,
  error,
  whatYouTried,
  didItWork,
  filesChanged
);
```

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Explore [examples.ts](./examples.ts) for complete examples
3. Check the API reference in the README
4. Integrate with your testing agent
5. Start building up knowledge!

## Troubleshooting

### "OpenAI API key not found"
```bash
export OPENAI_API_KEY="sk-..."
```

### "Cannot find module './brain'"
Make sure you're importing from the correct path:
```typescript
import { AgentBrain } from './tests/ai-testing-agent/brain';
```

### Storage errors
The `.storage` directory is auto-created. If you get permission errors:
```bash
mkdir -p tests/ai-testing-agent/brain/.storage
chmod 755 tests/ai-testing-agent/brain/.storage
```

### Memory growing too large
Prune regularly:
```typescript
await brain.pruneOldMemories(1000);  // Keep last 1000
```

## Support

For issues or questions, check:
- [README.md](./README.md) - Full documentation
- [examples.ts](./examples.ts) - Working code examples
- Agent implementation in `agent.ts`

Happy learning!
