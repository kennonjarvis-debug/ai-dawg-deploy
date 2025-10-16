# Chat-to-Create Testing Strategy

**Generated:** 2025-10-15
**Owner:** Agent 4 - Testing & Quality Assurance Engineer
**Status:** Active Development
**Target Coverage:** 90%+
**Intent Detection Accuracy Target:** 95%+

---

## Executive Summary

This document outlines the comprehensive testing strategy for the Mother-Load chat-to-create implementation. The strategy covers unit tests, integration tests, E2E tests, performance tests, and specialized DAW control testing to ensure users can reliably create music through natural language conversation.

**Key Testing Goals:**
- Ensure 90%+ code coverage on all new services
- Validate 95%+ intent detection accuracy
- Verify DAW control via chat works flawlessly
- Guarantee audio generation pipeline reliability
- Ensure real-time streaming and WebSocket stability
- Validate performance under load (100 concurrent users)

---

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \         10% - Full user flows
                 /--------\
                /          \
               / Integration \    30% - Service interactions
              /--------------\
             /                \
            /   Unit Tests     \  60% - Individual functions
           /--------------------\
```

### Test Distribution
- **Unit Tests:** 60% of tests - Fast, isolated component testing
- **Integration Tests:** 30% of tests - Service interaction validation
- **E2E Tests:** 10% of tests - Complete user journey verification

---

## Critical User Flows

### Flow 1: Chat to Beat Generation
```
User Input: "create a trap beat at 140 bpm"
    ↓
Intent Detection: GENERATE_BEAT { genre: 'trap', bpm: 140 }
    ↓
Queue Generation Job
    ↓
Stream Progress Updates (0% → 100%)
    ↓
Audio URL returned → Load into DAW
    ↓
User can play/edit beat
```

**Test Coverage:**
- Intent detection accuracy
- Entity extraction (genre, BPM, key)
- Job queue processing
- WebSocket progress streaming
- Audio file generation
- DAW loading

### Flow 2: DAW Control via Chat
```
User Input: "play the beat"
    ↓
Intent Detection: PLAY
    ↓
Transport Store Update: togglePlay()
    ↓
DAW starts playback
```

**Test Coverage:**
- All transport commands (play, pause, stop, record)
- BPM changes
- Time signature updates
- Track loading
- Effect application
- Mixing/mastering triggers

### Flow 3: Iterative Refinement
```
User: "create a trap beat"
    ↓
System: Generates beat
    ↓
User: "make it faster"
    ↓
Intent Detection: MODIFY_BPM { adjustment: 'faster' }
    ↓
Context from previous conversation
    ↓
Regenerate with increased BPM
```

**Test Coverage:**
- Context tracking across messages
- Parameter modification
- Conversation history loading
- Regeneration with updated params

---

## Test Categories

### 1. Unit Tests (Priority 1)

#### 1.1 Intent Service Tests
**File:** `/tests/unit/intent-service.test.ts`

**Coverage Requirements:**
- 35+ intent pattern matching
- Entity extraction for all supported parameters:
  - Genre (14+ genres)
  - BPM (60-200 range + descriptive terms like "fast", "slow")
  - Key (all 12 keys + major/minor variations)
  - Mood (dark, chill, energetic, etc.)
  - Duration (seconds)
- Confidence scoring
- Ambiguous input handling
- Edge cases and error scenarios

**Example Test Cases:**
```typescript
describe('IntentService', () => {
  describe('Beat Generation Intent', () => {
    it('should detect "create a trap beat"', () => {
      const result = intentService.detectIntent('create a trap beat');
      expect(result.intent).toBe('GENERATE_BEAT');
      expect(result.entities.genre).toBe('trap');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should extract BPM from "140 bpm trap beat"', () => {
      const result = intentService.detectIntent('make a trap beat at 140 bpm');
      expect(result.entities.bpm).toBe(140);
    });

    it('should extract key from "trap beat in C minor"', () => {
      const result = intentService.detectIntent('create a trap beat in Cm');
      expect(result.entities.key).toBe('Cm');
    });

    it('should handle "make it faster" with context', () => {
      const context = { previousBpm: 120 };
      const result = intentService.detectIntent('make it faster', context);
      expect(result.intent).toBe('MODIFY_BPM');
      expect(result.entities.adjustment).toBe('faster');
    });
  });

  describe('DAW Control Intent', () => {
    it('should detect play command', () => {
      const result = intentService.detectIntent('play');
      expect(result.intent).toBe('PLAY');
    });

    it('should detect stop command variations', () => {
      expect(intentService.detectIntent('stop').intent).toBe('STOP');
      expect(intentService.detectIntent('pause').intent).toBe('PAUSE');
      expect(intentService.detectIntent('halt playback').intent).toBe('STOP');
    });

    it('should detect BPM change', () => {
      const result = intentService.detectIntent('set bpm to 120');
      expect(result.intent).toBe('SET_BPM');
      expect(result.entities.bpm).toBe(120);
    });

    it('should detect recording commands', () => {
      expect(intentService.detectIntent('start recording').intent).toBe('START_RECORDING');
      expect(intentService.detectIntent('stop recording').intent).toBe('STOP_RECORDING');
    });
  });

  describe('Mixing/Mastering Intent', () => {
    it('should detect mix request', () => {
      const result = intentService.detectIntent('mix the track');
      expect(result.intent).toBe('MIX_TRACK');
    });

    it('should detect EQ adjustment', () => {
      const result = intentService.detectIntent('boost the bass');
      expect(result.intent).toBe('ADJUST_EQ');
      expect(result.entities.band).toBe('bass');
      expect(result.entities.adjustment).toBe('boost');
    });

    it('should detect mastering request', () => {
      const result = intentService.detectIntent('master this track');
      expect(result.intent).toBe('MASTER_TRACK');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = intentService.detectIntent('');
      expect(result.intent).toBe('UNKNOWN');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle gibberish', () => {
      const result = intentService.detectIntent('asdfghjkl');
      expect(result.intent).toBe('UNKNOWN');
    });

    it('should handle multiple intents and choose primary', () => {
      const result = intentService.detectIntent('create a trap beat and play it');
      // Should prioritize GENERATE_BEAT over PLAY
      expect(result.intent).toBe('GENERATE_BEAT');
    });
  });
});
```

**Target:** 95% coverage, 95%+ accuracy

#### 1.2 Chat Service Tests
**File:** `/tests/unit/chat-service.test.ts`

**Coverage Requirements:**
- Conversation CRUD operations
- Message persistence
- Pagination
- Context tracking
- Error handling

**Example Test Cases:**
```typescript
describe('ChatService', () => {
  describe('Conversation Management', () => {
    it('should create conversation', async () => {
      const conv = await chatService.createConversation(userId);
      expect(conv.id).toBeDefined();
      expect(conv.userId).toBe(userId);
    });

    it('should list conversations with pagination', async () => {
      await chatService.createConversation(userId);
      const result = await chatService.listConversations(userId, { limit: 10, offset: 0 });
      expect(result.conversations).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should delete conversation and cascade messages', async () => {
      const conv = await chatService.createConversation(userId);
      await chatService.addMessage(conv.id, 'user', 'test');
      await chatService.deleteConversation(conv.id);

      const messages = await chatService.getMessages(conv.id);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Message Operations', () => {
    it('should add message with intent and entities', async () => {
      const conv = await chatService.createConversation(userId);
      const message = await chatService.addMessage(
        conv.id,
        'user',
        'create a trap beat',
        'GENERATE_BEAT',
        { genre: 'trap' }
      );

      expect(message.content).toBe('create a trap beat');
      expect(message.intent).toBe('GENERATE_BEAT');
      expect(message.entities).toEqual({ genre: 'trap' });
    });

    it('should retrieve messages in correct order', async () => {
      const conv = await chatService.createConversation(userId);
      await chatService.addMessage(conv.id, 'user', 'first');
      await chatService.addMessage(conv.id, 'assistant', 'second');

      const messages = await chatService.getMessages(conv.id);
      expect(messages[0].content).toBe('first');
      expect(messages[1].content).toBe('second');
    });
  });
});
```

**Target:** 90% coverage

#### 1.3 Generation Service Tests
**File:** `/tests/unit/generation-service.test.ts`

**Coverage Requirements:**
- Job creation
- Parameter validation
- Queue management
- Progress tracking
- Error handling
- Retry logic

**Example Test Cases:**
```typescript
describe('GenerationService', () => {
  describe('Beat Generation', () => {
    it('should create generation job', async () => {
      const jobId = await generationService.generateBeat(userId, {
        genre: 'trap',
        bpm: 140,
        key: 'Cm'
      });

      expect(jobId).toBeDefined();
      const job = await generationService.getJob(jobId);
      expect(job.status).toBe('queued');
    });

    it('should validate parameters', async () => {
      await expect(generationService.generateBeat(userId, {
        genre: 'invalid-genre',
        bpm: 999 // Invalid BPM
      })).rejects.toThrow('Invalid BPM');
    });

    it('should apply default parameters', async () => {
      const jobId = await generationService.generateBeat(userId, {
        genre: 'trap'
        // No BPM or key specified
      });

      const job = await generationService.getJob(jobId);
      expect(job.input.bpm).toBeGreaterThanOrEqual(140);
      expect(job.input.bpm).toBeLessThanOrEqual(160);
    });
  });

  describe('Error Handling', () => {
    it('should retry on failure', async () => {
      const mockProvider = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ audioUrl: 'success.mp3' });

      const result = await generationService.generateWithRetry(mockProvider);
      expect(mockProvider).toHaveBeenCalledTimes(2);
      expect(result.audioUrl).toBe('success.mp3');
    });

    it('should fail after max retries', async () => {
      const mockProvider = jest.fn()
        .mockRejectedValue(new Error('Permanent failure'));

      await expect(generationService.generateWithRetry(mockProvider))
        .rejects.toThrow('Max retries exceeded');
    });
  });
});
```

**Target:** 90% coverage

---

### 2. Integration Tests (Priority 1)

#### 2.1 Chat Flow Integration
**File:** `/tests/integration/chat-flow.test.ts`

**Coverage Requirements:**
- End-to-end message flow
- Intent detection → Response streaming
- WebSocket event emission
- Database persistence

**Example Test Cases:**
```typescript
describe('Chat Flow Integration', () => {
  it('should handle complete chat message flow', async () => {
    // Create conversation
    const conv = await chatService.createConversation(userId);

    // Send message
    const message = await chatService.addMessage(conv.id, 'user', 'create a trap beat');

    // Verify intent was detected
    expect(message.intent).toBe('GENERATE_BEAT');
    expect(message.entities.genre).toBe('trap');

    // Verify message was persisted
    const messages = await chatService.getMessages(conv.id);
    expect(messages).toHaveLength(1);
  });

  it('should stream response via WebSocket', async (done) => {
    const conv = await chatService.createConversation(userId);

    // Listen for WebSocket events
    socket.on('chat:stream', (data) => {
      expect(data.conversationId).toBe(conv.id);
      expect(data.chunk).toBeDefined();
    });

    socket.on('chat:complete', (data) => {
      expect(data.conversationId).toBe(conv.id);
      done();
    });

    // Send message
    await chatService.addMessage(conv.id, 'user', 'hello');
  });
});
```

**Target:** Cover all critical integration points

#### 2.2 Generation Flow Integration
**File:** `/tests/integration/generation-flow.test.ts`

**Coverage Requirements:**
- Complete generation pipeline
- Job queue → Processing → S3 upload
- WebSocket progress events
- Error recovery

**Example Test Cases:**
```typescript
describe('Generation Flow Integration', () => {
  it('should complete beat generation end-to-end', async () => {
    const jobId = await generationService.generateBeat(userId, {
      genre: 'trap',
      bpm: 140,
      key: 'Cm'
    });

    // Wait for completion (with timeout)
    const result = await waitForGeneration(jobId, 60000);

    expect(result.status).toBe('completed');
    expect(result.output.audioUrl).toMatch(/\.mp3$/);
    expect(result.output.metadata.bpm).toBe(140);
  }, 70000);

  it('should emit progress events', async (done) => {
    let progressEvents = 0;

    socket.on('generation:progress', (data) => {
      expect(data.percent).toBeGreaterThanOrEqual(0);
      expect(data.percent).toBeLessThanOrEqual(100);
      progressEvents++;
    });

    socket.on('generation:completed', (data) => {
      expect(progressEvents).toBeGreaterThan(0);
      expect(data.audioUrl).toBeDefined();
      done();
    });

    await generationService.generateBeat(userId, { genre: 'trap' });
  }, 70000);
});
```

**Target:** Cover complete generation lifecycle

#### 2.3 DAW Control Tests (CRITICAL)
**File:** `/tests/integration/daw-control.test.ts`

**Coverage Requirements:**
- All transport commands via chat
- BPM/time signature changes
- Track loading
- Effect application
- Real-time state updates

**Example Test Cases:**
```typescript
describe('DAW Control via Chat', () => {
  beforeEach(() => {
    // Reset transport state
    transportStore.reset();
  });

  describe('Transport Controls', () => {
    it('should start playback via chat', async () => {
      const { intent } = await intentService.detectIntent('play');
      expect(intent).toBe('PLAY');

      // Trigger DAW action
      transportStore.togglePlay();
      expect(transportStore.isPlaying).toBe(true);
    });

    it('should stop playback via chat', async () => {
      transportStore.togglePlay(); // Start playing

      const { intent } = await intentService.detectIntent('stop');
      expect(intent).toBe('STOP');

      transportStore.togglePlay();
      expect(transportStore.isPlaying).toBe(false);
    });

    it('should start recording via chat', async () => {
      const { intent } = await intentService.detectIntent('start recording');
      expect(intent).toBe('START_RECORDING');

      transportStore.toggleRecord();
      expect(transportStore.isRecording).toBe(true);
    });

    it('should stop recording via chat', async () => {
      transportStore.toggleRecord(); // Start recording

      const { intent } = await intentService.detectIntent('stop recording');
      expect(intent).toBe('STOP_RECORDING');

      transportStore.toggleRecord();
      expect(transportStore.isRecording).toBe(false);
    });
  });

  describe('BPM Control', () => {
    it('should set BPM via chat', async () => {
      const { intent, entities } = await intentService.detectIntent('set bpm to 120');
      expect(intent).toBe('SET_BPM');
      expect(entities.bpm).toBe(120);

      transportStore.setBpm(120);
      expect(transportStore.bpm).toBe(120);
    });

    it('should increase BPM via chat', async () => {
      transportStore.setBpm(100);

      const { intent, entities } = await intentService.detectIntent('make it faster');
      expect(intent).toBe('MODIFY_BPM');

      const newBpm = transportStore.bpm + 10;
      transportStore.setBpm(newBpm);
      expect(transportStore.bpm).toBe(110);
    });
  });

  describe('Track Loading', () => {
    it('should load generated audio into DAW', async () => {
      const audioUrl = 'https://s3.amazonaws.com/test-beat.mp3';

      // Simulate loading track
      const trackId = await dawService.loadAudioTrack(audioUrl);

      expect(trackId).toBeDefined();
      expect(tracksStore.tracks).toHaveLength(1);
      expect(tracksStore.tracks[0].audioUrl).toBe(audioUrl);
    });
  });

  describe('Complex Commands', () => {
    it('should handle "create beat and play it"', async () => {
      // This requires sequential operations
      const { intent, entities } = await intentService.detectIntent('create a trap beat and play it');

      expect(intent).toBe('GENERATE_BEAT');
      expect(entities.genre).toBe('trap');

      // Generate beat
      const jobId = await generationService.generateBeat(userId, entities);
      const result = await waitForGeneration(jobId, 60000);

      // Load into DAW
      const trackId = await dawService.loadAudioTrack(result.output.audioUrl);

      // Play
      transportStore.togglePlay();

      expect(transportStore.isPlaying).toBe(true);
      expect(tracksStore.tracks).toHaveLength(1);
    }, 70000);
  });
});
```

**Target:** 100% coverage of all DAW commands

---

### 3. E2E Tests (Priority 2)

#### 3.1 Chat-to-Create User Flow
**File:** `/tests/e2e/chat-to-create.spec.ts`

**Coverage Requirements:**
- Complete user journey
- UI interactions
- Real-time updates
- Error handling

**Example Test Cases:**
```typescript
describe('Chat-to-Create E2E', () => {
  test('complete chat-to-create flow', async ({ page }) => {
    await page.goto('/');

    // Open chatbot
    await page.click('[data-testid="chatbot-toggle"]');
    await expect(page.locator('[data-testid="chatbot-widget"]')).toBeVisible();

    // Send message
    await page.fill('[data-testid="chat-input"]', 'create a trap beat at 140 bpm');
    await page.click('[data-testid="chat-send"]');

    // Verify intent detected
    await expect(page.locator('text=Generating trap beat')).toBeVisible({ timeout: 5000 });

    // Verify progress bar appears
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();

    // Wait for completion (max 60 seconds)
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 60000 });

    // Verify audio can be played
    await page.click('[data-testid="audio-play-button"]');

    // Verify audio loaded into DAW
    const trackCount = await page.locator('[data-testid="track"]').count();
    expect(trackCount).toBeGreaterThan(0);
  });

  test('DAW control via chat', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="chatbot-toggle"]');

    // User says "play"
    await page.fill('[data-testid="chat-input"]', 'play');
    await page.click('[data-testid="chat-send"]');

    // Verify transport bar shows playing state
    await expect(page.locator('[data-testid="play-button"].playing')).toBeVisible({ timeout: 2000 });

    // User says "stop"
    await page.fill('[data-testid="chat-input"]', 'stop');
    await page.click('[data-testid="chat-send"]');

    // Verify transport bar shows stopped state
    await expect(page.locator('[data-testid="play-button"]:not(.playing)')).toBeVisible({ timeout: 2000 });
  });

  test('conversation history', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="chatbot-toggle"]');

    // Send multiple messages
    await page.fill('[data-testid="chat-input"]', 'create a beat');
    await page.click('[data-testid="chat-send"]');

    await page.fill('[data-testid="chat-input"]', 'make it faster');
    await page.click('[data-testid="chat-send"]');

    // Verify both messages appear
    await expect(page.locator('text=create a beat')).toBeVisible();
    await expect(page.locator('text=make it faster')).toBeVisible();

    // Reload page
    await page.reload();
    await page.click('[data-testid="chatbot-toggle"]');

    // Verify conversation persisted
    await expect(page.locator('text=create a beat')).toBeVisible();
    await expect(page.locator('text=make it faster')).toBeVisible();
  });
});
```

**Target:** Cover top 5 user journeys

---

### 4. Performance Tests (Priority 2)

#### 4.1 Load Testing
**Files:**
- `/tests/load/chat-api-load.js` (k6)
- `/tests/load/generation-queue-load.js` (k6)
- `/tests/load/websocket-stress.js` (k6)

**Coverage Requirements:**
- 100 concurrent users
- 50 concurrent generations
- 1000+ WebSocket connections
- Response time < 200ms
- Generation time < 30s

**Example k6 Test:**
```javascript
// chat-api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    http_req_failed: ['rate<0.05'],    // Error rate < 5%
  },
};

export default function () {
  const payload = JSON.stringify({
    conversationId: __VU, // Use virtual user ID
    message: 'create a trap beat',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  };

  const res = http.post('http://localhost:3000/api/chat/message', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has message id': (r) => JSON.parse(r.body).messageId !== undefined,
  });

  sleep(1);
}
```

**Target:** All performance benchmarks met

#### 4.2 Intent Detection Accuracy Test
**File:** `/tests/accuracy/intent-detection.test.ts`

**Coverage Requirements:**
- 100+ real user messages
- Calculate precision, recall, F1 score
- Identify failure patterns
- Target: 95%+ accuracy

**Example Test:**
```typescript
describe('Intent Detection Accuracy', () => {
  const testDataset = [
    { input: 'create a trap beat', expected: 'GENERATE_BEAT', entities: { genre: 'trap' } },
    { input: 'make a boom bap beat at 90 bpm', expected: 'GENERATE_BEAT', entities: { genre: 'boom bap', bpm: 90 } },
    { input: 'play the song', expected: 'PLAY', entities: {} },
    { input: 'stop', expected: 'STOP', entities: {} },
    { input: 'set bpm to 120', expected: 'SET_BPM', entities: { bpm: 120 } },
    { input: 'make it faster', expected: 'MODIFY_BPM', entities: { adjustment: 'faster' } },
    { input: 'add more bass', expected: 'ADJUST_EQ', entities: { band: 'bass', adjustment: 'boost' } },
    { input: 'mix the track', expected: 'MIX_TRACK', entities: {} },
    { input: 'master this', expected: 'MASTER_TRACK', entities: {} },
    // ... 90+ more test cases
  ];

  it('should achieve 95%+ accuracy on test dataset', () => {
    let correct = 0;
    let total = testDataset.length;

    for (const testCase of testDataset) {
      const result = intentService.detectIntent(testCase.input);

      if (result.intent === testCase.expected) {
        // Check entities match
        const entitiesMatch = Object.keys(testCase.entities).every(key => {
          return result.entities[key] === testCase.entities[key];
        });

        if (entitiesMatch) {
          correct++;
        }
      }
    }

    const accuracy = (correct / total) * 100;
    console.log(`Intent Detection Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Correct: ${correct}/${total}`);

    expect(accuracy).toBeGreaterThanOrEqual(95);
  });

  it('should report failures for review', () => {
    const failures = [];

    for (const testCase of testDataset) {
      const result = intentService.detectIntent(testCase.input);

      if (result.intent !== testCase.expected) {
        failures.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: result.intent,
          confidence: result.confidence,
        });
      }
    }

    if (failures.length > 0) {
      console.log('\n=== Intent Detection Failures ===');
      failures.forEach((failure, i) => {
        console.log(`\n${i + 1}. Input: "${failure.input}"`);
        console.log(`   Expected: ${failure.expected}`);
        console.log(`   Actual: ${failure.actual}`);
        console.log(`   Confidence: ${failure.confidence}`);
      });
    }

    // Save failures for Agent 1 to fix
    fs.writeFileSync(
      'test-results/intent-detection-failures.json',
      JSON.stringify(failures, null, 2)
    );
  });
});
```

**Target:** 95%+ accuracy, document all failures

---

## Test Infrastructure

### Test Database
- Use separate test database
- Reset between test runs
- Seed with realistic data
- Clean up after tests

### Mock Services
- Mock AI providers (OpenAI, Anthropic)
- Mock S3 upload
- Mock WebSocket for unit tests
- Mock audio generation

### Test Utilities
```typescript
// /tests/utils/test-helpers.ts
export async function waitForGeneration(jobId: string, timeout: number) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const job = await generationService.getJob(jobId);

    if (job.status === 'completed') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(`Generation failed: ${job.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Generation timeout');
}

export function createMockConversation(userId: string) {
  return {
    id: uuidv4(),
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  };
}

export function createMockGeneration(status: string = 'completed') {
  return {
    id: uuidv4(),
    userId: 'test-user',
    type: 'beat',
    status,
    input: { genre: 'trap', bpm: 140 },
    output: { audioUrl: 'https://example.com/beat.mp3' },
    provider: 'openai',
    cost: 0.05,
    duration: 25000,
    createdAt: new Date(),
    completedAt: new Date(),
  };
}
```

---

## CI/CD Integration

### Pre-commit Hooks
- Run unit tests
- Run linter
- Type checking

### Pull Request Checks
- All unit tests pass
- All integration tests pass
- Coverage >= 90%
- No critical security issues

### Deployment Pipeline
- Run full test suite
- Run E2E tests
- Performance benchmarks
- Manual QA approval
- Deploy to production

---

## Test Execution Schedule

### Daily
- Unit tests (every commit)
- Fast integration tests
- Code coverage check

### Weekly
- Full E2E suite
- Performance tests
- Intent accuracy validation

### Pre-Release
- Complete regression suite
- Load testing
- Security audit
- Manual QA sign-off

---

## Success Metrics

### Code Coverage
- Overall: 90%+
- Intent Service: 95%+
- Chat Service: 90%+
- Generation Service: 90%+
- DAW Control: 100%

### Accuracy
- Intent Detection: 95%+
- Entity Extraction: 90%+
- Context Understanding: 85%+

### Performance
- API Response Time: < 200ms (p95)
- Generation Time: < 30s average
- WebSocket Latency: < 100ms
- Error Rate: < 1%

### User Experience
- Zero critical bugs in production
- < 5% generation failures
- Real-time updates working 99%+
- Conversation history 100% reliable

---

## Risk Mitigation

### Risk 1: AI Provider Rate Limits
**Mitigation:** Mock providers in tests, test fallback logic

### Risk 2: WebSocket Connection Drops
**Mitigation:** Test reconnection logic, polling fallback

### Risk 3: Long Generation Times
**Mitigation:** Set timeouts, test progress updates, test cancellation

### Risk 4: Database Performance
**Mitigation:** Load test queries, optimize indexes, test pagination

---

## Tools & Frameworks

### Unit Testing
- **Framework:** Jest / Vitest
- **Mocking:** jest.mock(), vitest.mock()
- **Coverage:** c8 / istanbul

### Integration Testing
- **Framework:** Jest / Vitest
- **Database:** Separate test DB with Prisma
- **WebSocket:** socket.io-client

### E2E Testing
- **Framework:** Playwright
- **Browser:** Chromium, Firefox, Safari
- **CI:** GitHub Actions

### Performance Testing
- **Framework:** k6
- **Metrics:** Response time, throughput, error rate
- **Monitoring:** Grafana dashboards

### Accuracy Testing
- **Dataset:** 100+ real user messages
- **Metrics:** Precision, Recall, F1 Score
- **Reporting:** JSON + Markdown reports

---

## Reporting

### Daily Test Reports
- Test execution summary
- Coverage metrics
- Failed tests with logs
- Performance trends

### Weekly Quality Reports
- Intent accuracy trends
- Performance benchmarks
- Bug discovery rate
- Test debt

### Pre-Release Reports
- Complete test coverage
- All critical flows validated
- Performance sign-off
- Security clearance
- QA approval

---

## Next Steps

1. **Days 1-3:** Finalize this strategy, get team approval
2. **Days 4-7:** Write unit tests as Agent 1 completes services
3. **Days 8-10:** Write integration tests
4. **Days 11-14:** Write E2E tests
5. **Days 15-17:** Performance testing
6. **Days 18-19:** Intent accuracy validation
7. **Day 20:** Final test run and sign-off

---

**Status:** Ready for Implementation
**Approval:** Pending
**Next Review:** Day 3
