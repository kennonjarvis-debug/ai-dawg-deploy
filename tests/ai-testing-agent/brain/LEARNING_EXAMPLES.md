# How the Agent Brain Learns and Remembers

Real-world examples of the brain's learning and memory capabilities.

## Example 1: Learning From Repeated Timeouts

### Scenario: Test Keeps Timing Out

**Initial State:** Brain has no knowledge of timeout errors.

```typescript
const brain = new AgentBrain();
await brain.initialize();
```

### First Failure (Day 1)

```typescript
// Test fails
await brain.remember({
  type: 'test_failure',
  content: 'Test "api-user-fetch" failed: Request timeout after 30 seconds',
  metadata: {
    testName: 'api-user-fetch',
    errorType: 'timeout',
    affectedFiles: ['src/backend/api/user-service.ts'],
    tags: ['api', 'timeout', 'user']
  }
});

// Developer fixes it
await brain.learnFromFix(
  'api-user-fetch',
  'Request timeout after 30 seconds',
  'Increased timeout from 30s to 60s',
  true,  // it worked!
  ['src/backend/api/user-service.ts']
);
```

**Brain's Knowledge:**
- ✓ Knows timeout errors exist
- ✓ Knows one fix strategy (increase timeout)
- ✓ Success rate: 100% (1/1)
- ✓ Confidence: LOW (only 1 sample)

### Second Failure (Day 3)

```typescript
// Different test, same error type
await brain.remember({
  type: 'test_failure',
  content: 'Test "api-post-fetch" failed: Request timeout after 30 seconds',
  metadata: {
    testName: 'api-post-fetch',
    errorType: 'timeout',
    affectedFiles: ['src/backend/api/post-service.ts'],
    tags: ['api', 'timeout', 'post']
  }
});

// Brain suggests fix based on past success
const suggestion = await brain.suggestFix(
  'Request timeout after 30 seconds',
  'api-post-fetch'
);

console.log(suggestion);
// {
//   suggestedFix: "Increased timeout from 30s to 60s",
//   confidence: 0.34,  // Still low - only 1 prior case
//   reasoning: "Based on 1 similar case with 100% success rate",
//   similarCases: [...]
// }

// Developer applies suggested fix
await brain.learnFromFix(
  'api-post-fetch',
  'Request timeout after 30 seconds',
  'Increased timeout from 30s to 60s',
  true,  // worked again!
  ['src/backend/api/post-service.ts']
);
```

**Brain's Knowledge:**
- ✓ Pattern emerging: timeout → increase timeout
- ✓ Success rate: 100% (2/2)
- ✓ Confidence: MEDIUM (0.45)

### Third Failure (Day 5)

```typescript
// Another timeout
await brain.remember({
  type: 'test_failure',
  content: 'Test "api-comment-fetch" failed: Request timeout after 30 seconds',
  metadata: {
    testName: 'api-comment-fetch',
    errorType: 'timeout',
    affectedFiles: ['src/backend/api/comment-service.ts'],
    tags: ['api', 'timeout', 'comment']
  }
});

// Brain is more confident now
const suggestion = await brain.suggestFix(
  'Request timeout after 30 seconds',
  'api-comment-fetch'
);

console.log(suggestion);
// {
//   suggestedFix: "Increased timeout from 30s to 60s",
//   confidence: 0.52,  // Getting confident!
//   reasoning: "Based on 2 similar cases with 100% success rate",
//   similarCases: [...]
// }

// But this time, developer tries a different approach
await brain.learnFromFix(
  'api-comment-fetch',
  'Request timeout after 30 seconds',
  'Added retry logic with 3 attempts and exponential backoff',
  true,  // also worked!
  ['src/backend/api/comment-service.ts']
);
```

**Brain's Knowledge:**
- ✓ Now knows TWO strategies for timeouts
- ✓ Strategy A: Increase timeout (2/2 = 100%)
- ✓ Strategy B: Add retry logic (1/1 = 100%)
- ✓ Can suggest either based on context

### Fourth Failure (Day 8)

```typescript
// Yet another timeout
const suggestion = await brain.suggestFix(
  'Request timeout after 30 seconds',
  'api-product-fetch'
);

console.log(suggestion);
// {
//   suggestedFix: "Increased timeout from 30s to 60s",
//   confidence: 0.61,  // HIGH confidence now!
//   reasoning: "Based on 3 similar cases with 100% success rate",
//   similarCases: [...]
// }

// This time, it doesn't work
await brain.learnFromFix(
  'api-product-fetch',
  'Request timeout after 30 seconds',
  'Increased timeout from 30s to 60s',
  false,  // FAILED!
  ['src/backend/api/product-service.ts']
);
```

**Brain's Knowledge:**
- ✓ Strategy A now: 66% success rate (2/3)
- ✓ Strategy B still: 100% success rate (1/1)
- ✓ Brain learns that Strategy A isn't always correct
- ✓ Will rank Strategy B higher in future

### Fifth Failure (Day 10)

```typescript
// New timeout error
const suggestion = await brain.suggestFix(
  'Request timeout after 30 seconds',
  'api-order-fetch'
);

console.log(suggestion);
// {
//   suggestedFix: "Added retry logic with 3 attempts and exponential backoff",
//   confidence: 0.34,  // Lower confidence, but this is now preferred
//   reasoning: "Based on 1 similar case with 100% success rate",
//   similarCases: [...]
// }

// Brain now prefers Strategy B because it has 100% success rate
// even though it has fewer samples
```

**Learning Complete!**

After 5 iterations:
- ✓ Knows timeout errors are common
- ✓ Tracks 2 different fix strategies
- ✓ Understands which strategy works better
- ✓ Provides intelligent suggestions
- ✓ Continues to learn from each outcome

## Example 2: Building Codebase Knowledge

### Day 1: First Test Run

```typescript
// Agent analyzes auth-service.ts
await brain.storeCodebaseKnowledge(
  'src/backend/auth-service.ts',
  'Handles user authentication, session management, and JWT tokens',
  ['authentication', 'sessions', 'jwt', 'security'],
  ['bcrypt', 'jsonwebtoken', 'redis', 'database']
);
```

**Brain's Knowledge:**
```
Graph:
  file:auth-service.ts
    └─ implements → feature:authentication
    └─ implements → feature:sessions
    └─ depends_on → file:database
    └─ depends_on → file:redis
```

### Day 2: Add Test Coverage Info

```typescript
// Agent creates a test
await brain.knowledgeGraph.addTest(
  'user-login-test',
  ['src/backend/auth-service.ts'],
  ['authentication', 'sessions']
);
```

**Brain's Knowledge:**
```
Graph:
  file:auth-service.ts
    └─ implements → feature:authentication
    └─ implements → feature:sessions
    └─ depends_on → file:database
    └─ depends_on → file:redis
    ⬆─ tested_by ─ test:user-login-test
```

### Day 3: Detect Impact of Change

```typescript
// Developer wants to modify auth-service.ts
const impact = await brain.identifyImpactZone([
  'src/backend/auth-service.ts'
]);

console.log(impact);
// {
//   affectedTests: ['user-login-test'],
//   affectedFeatures: ['authentication', 'sessions', 'jwt', 'security'],
//   files: ['database', 'redis'],
//   riskLevel: 'medium',
//   reasoning: "1 file changed, 1 test affected, 4 features impacted"
// }
```

### Day 7: More Knowledge Accumulated

```typescript
// After analyzing more files...
await brain.storeCodebaseKnowledge(
  'src/backend/user-service.ts',
  'User CRUD operations',
  ['users', 'profile'],
  ['auth-service.ts', 'database']
);

await brain.storeCodebaseKnowledge(
  'src/frontend/LoginForm.tsx',
  'Login UI component',
  ['authentication', 'ui'],
  ['auth-service.ts', 'react']
);
```

**Brain's Knowledge:**
```
Graph:
  file:auth-service.ts
    ⬅─ depends_on ─ file:user-service.ts
    ⬅─ depends_on ─ file:LoginForm.tsx
    └─ implements → feature:authentication
    ⬆─ tested_by ─ test:user-login-test
```

### Day 10: Smart Impact Analysis

```typescript
// Now when changing auth-service.ts
const impact = await brain.identifyImpactZone([
  'src/backend/auth-service.ts'
]);

console.log(impact);
// {
//   affectedTests: ['user-login-test'],
//   affectedFeatures: ['authentication', 'sessions', 'jwt', 'security'],
//   files: [
//     'database',
//     'redis',
//     'user-service.ts',  // NEW: discovered via graph
//     'LoginForm.tsx'     // NEW: discovered via graph
//   ],
//   riskLevel: 'high',   // INCREASED: more dependencies found
//   reasoning: "1 file changed, 1 test affected, 4 features impacted, 4 dependent files"
// }
```

**Brain has learned:**
- ✓ File dependencies
- ✓ Test coverage
- ✓ Feature relationships
- ✓ Impact ripple effects

## Example 3: Test Pattern Recognition

### Month 1: Tracking Pattern Effectiveness

```typescript
// Week 1: Page Object Model
await brain.trackTestPattern(
  'page-object-model',
  'user-login-test',
  0.85,  // 85% effective
  'Using POM reduced maintenance effort'
);

await brain.trackTestPattern(
  'page-object-model',
  'user-registration-test',
  0.90,  // 90% effective
  'POM made test updates easier'
);

// Week 2: Visual Regression
await brain.trackTestPattern(
  'visual-regression',
  'homepage-layout-test',
  0.75,  // 75% effective
  'Caught layout bugs that unit tests missed'
);

// Week 3: API Mocking
await brain.trackTestPattern(
  'mock-external-apis',
  'payment-integration-test',
  0.95,  // 95% effective
  'Tests run faster and more reliably'
);

await brain.trackTestPattern(
  'mock-external-apis',
  'shipping-calculation-test',
  0.92,  // 92% effective
  'No more flaky failures from external APIs'
);
```

### Month 2: Brain Recommends Best Patterns

```typescript
const bestPatterns = await brain.getBestTestPatterns();

console.log(bestPatterns);
// [
//   {
//     pattern: 'mock-external-apis',
//     avgEffectiveness: 0.935,  // (0.95 + 0.92) / 2
//     usageCount: 2,
//     examples: ['payment-integration-test', 'shipping-calculation-test']
//   },
//   {
//     pattern: 'page-object-model',
//     avgEffectiveness: 0.875,  // (0.85 + 0.90) / 2
//     usageCount: 2,
//     examples: ['user-login-test', 'user-registration-test']
//   },
//   {
//     pattern: 'visual-regression',
//     avgEffectiveness: 0.75,
//     usageCount: 1,
//     examples: ['homepage-layout-test']
//   }
// ]
```

**Brain knows:**
- ✓ API mocking is most effective (93.5%)
- ✓ Page Object Model is reliable (87.5%)
- ✓ Visual regression is useful but less effective (75%)

## Example 4: Semantic Search in Action

### Stored Memories (Over Time)

```typescript
// Memory 1
await brain.remember({
  type: 'test_failure',
  content: 'Login test failed: element not found within timeout',
  metadata: { errorType: 'element_not_found', tags: ['ui', 'timeout'] }
});

// Memory 2
await brain.remember({
  type: 'test_failure',
  content: 'Checkout test failed: button not clickable',
  metadata: { errorType: 'element_not_clickable', tags: ['ui', 'interaction'] }
});

// Memory 3
await brain.remember({
  type: 'test_failure',
  content: 'API test failed: network connection timeout',
  metadata: { errorType: 'network_timeout', tags: ['api', 'timeout'] }
});

// Memory 4
await brain.remember({
  type: 'test_failure',
  content: 'Registration form test failed: input field not visible',
  metadata: { errorType: 'element_not_visible', tags: ['ui', 'form'] }
});
```

### Semantic Search Finds Related Concepts

```typescript
// Search: "element timing out"
const results = await brain.recall('element timing out', 5);

// Results ranked by relevance:
// 1. "Login test failed: element not found within timeout" (0.92 similarity)
//    - Matches: element + timeout
// 2. "Registration form test failed: input field not visible" (0.78 similarity)
//    - Matches: element (field) + visibility issue
// 3. "Checkout test failed: button not clickable" (0.65 similarity)
//    - Matches: element (button) issue
// 4. "API test failed: network connection timeout" (0.45 similarity)
//    - Matches: timeout (but not element-related)
```

**Brain understands:**
- ✓ "element not found" ≈ "element timing out"
- ✓ "not visible" is related to "not found"
- ✓ "button" and "field" are both UI elements
- ✓ Network timeouts are different from UI timeouts

### Intelligent Grouping

```typescript
// The brain can find patterns without exact matches

// Search: "UI elements not appearing"
const uiIssues = await brain.recall('UI elements not appearing', 10, {
  tags: ['ui']
});

// Returns all UI-related element issues, even though they use different words:
// - "element not found"
// - "button not clickable"
// - "input field not visible"
```

## Example 5: Continuous Improvement Over 3 Months

### Month 1: Initial Learning

**Stats:**
- Memories: 45
- Fix patterns: 8
- Test patterns: 3
- Avg fix success rate: 62%

```typescript
const insights = await brain.getLearningInsights();
// [
//   {
//     pattern: "Common timeout errors",
//     confidence: 0.45,
//     recommendation: "Consider adding retry logic"
//   }
// ]
```

### Month 2: Building Expertise

**Stats:**
- Memories: 183
- Fix patterns: 24
- Test patterns: 12
- Avg fix success rate: 78%

```typescript
const insights = await brain.getLearningInsights();
// [
//   {
//     pattern: "High Success Fix Strategies",
//     confidence: 0.72,
//     recommendation: "Use retry logic for network errors (85% success rate)"
//   },
//   {
//     pattern: "Effective Test Patterns",
//     confidence: 0.68,
//     recommendation: "API mocking improves test reliability (92% effective)"
//   }
// ]
```

### Month 3: Expert Level

**Stats:**
- Memories: 412
- Fix patterns: 47
- Test patterns: 28
- Avg fix success rate: 89%

```typescript
const insights = await brain.getLearningInsights();
// [
//   {
//     pattern: "High Success Fix Strategies",
//     confidence: 0.91,
//     examples: 47,
//     recommendation: "Network timeouts: Use circuit breaker (94% success)"
//   },
//   {
//     pattern: "Effective Test Patterns",
//     confidence: 0.87,
//     examples: 28,
//     recommendation: "E2E tests: Use page objects + API mocking (96% effective)"
//   },
//   {
//     pattern: "Common Error Types",
//     confidence: 0.89,
//     recommendation: "Focus on timeout handling - 35% of all failures"
//   },
//   {
//     pattern: "Consistently Effective Patterns",
//     confidence: 0.83,
//     recommendation: "Patterns with 90%+ success: retry-logic, circuit-breaker, api-mocking"
//   }
// ]
```

**Brain has evolved:**
- ✓ From 62% to 89% fix success rate
- ✓ From general suggestions to specific strategies
- ✓ From low confidence to high confidence
- ✓ From reactive to proactive recommendations

## Key Learning Patterns

### 1. Confidence Grows With Data

```
Sample Size  │ Confidence │ Recommendation Quality
─────────────┼────────────┼────────────────────────
1-2 samples  │ 0.2-0.4    │ "Try this, but uncertain"
3-5 samples  │ 0.4-0.6    │ "This might work"
6-10 samples │ 0.6-0.8    │ "This usually works"
11+ samples  │ 0.8-1.0    │ "This is proven"
```

### 2. Success Rate Matters More Than Volume

```
Pattern A: 100 uses, 60% success → Confidence: 0.72
Pattern B: 10 uses, 95% success → Confidence: 0.81

Brain prefers Pattern B despite fewer samples
```

### 3. Recency Affects Relevance

```
Old memory (6 months): Base score × 0.4
Recent memory (1 week): Base score × 0.95

Recent successes are weighted higher
```

### 4. Context-Aware Learning

```
Same error "timeout" in different contexts:

API timeout    → Circuit breaker works best
UI timeout     → Wait for element works best
Network timeout → Retry logic works best

Brain learns context-specific fixes
```

## Conclusion

The Agent Brain learns like a human:
- 📚 **Remembers** every experience
- 🔍 **Finds** similar past situations
- 🧠 **Learns** what works and what doesn't
- 📈 **Improves** recommendations over time
- 🎯 **Specializes** in context-specific solutions
- 🤝 **Builds** institutional knowledge

After enough experience, it becomes an expert assistant that:
- Suggests fixes before you think of them
- Knows which test patterns work best
- Understands code dependencies
- Predicts impact of changes
- Provides high-confidence recommendations

All powered by vector embeddings and continuous learning!
