# 🤖 DAWG AI Testing Agent

An autonomous GPT-powered testing agent that comprehensively tests all AI features, validates integrations, and ensures production readiness.

## Features

- ✅ **Autonomous Test Generation**: Analyzes codebase and generates test scenarios
- ✅ **Multi-Level Testing**: E2E, Integration, Unit, Performance, Quality
- ✅ **Intelligent Analysis**: GPT-4o analyzes failures and provides recommendations
- ✅ **Auto-Fix Capability**: Attempts to fix common issues automatically
- ✅ **Comprehensive Reporting**: JSON, Markdown, and HTML reports
- ✅ **CI/CD Integration**: Can run in automated pipelines
- ✅ **Priority-Based Execution**: Critical tests run first
- ✅ **Parallel Execution**: Runs multiple tests concurrently

## Installation

```bash
# Install dependencies
npm install openai @playwright/test

# Set OpenAI API key
export OPENAI_API_KEY="sk-..."
```

## Usage

### Run All Tests

```bash
npm run test:ai-agent
```

### Run Specific Test Suite

```bash
# AI Features only
npm run test:ai-agent -- --suite=aiFeatures

# Integration tests only
npm run test:ai-agent -- --suite=integration

# Performance tests only
npm run test:ai-agent -- --suite=performance
```

### Run in CI/CD

```bash
# GitHub Actions
- name: Run AI Testing Agent
  run: npm run test:ai-agent
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Configuration

Edit `agent-config.json` to customize:

```json
{
  "model": "gpt-4o",
  "temperature": 0.1,
  "executionStrategy": {
    "mode": "autonomous",
    "parallelization": true,
    "maxConcurrentTests": 5,
    "generateMissingTests": true,
    "autoFix": true
  }
}
```

## Test Suites

### 1. AI Features (Critical)

Tests all core AI features:
- Voice chat → music generation
- Text chat → DAW control
- Lyrics analysis → music generation
- Smart mix → mastering pipeline
- Vocal coaching (real-time)
- Intent detection accuracy
- Multi-provider fallback
- Cost monitoring & budget limits
- Expert Music AI circuit breaker

### 2. Integration (High Priority)

Tests integration points:
- Chat triggers generation
- Generation adds to project
- Voice function calling
- WebSocket streaming
- Queue processing
- State synchronization

### 3. Performance (Medium Priority)

Performance benchmarks:
- API response times (<200ms target)
- WebSocket latency (<50ms target)
- Audio processing speed
- Function call overhead
- Queue throughput

### 4. Quality (High Priority)

AI output quality:
- Music generation quality
- Lyrics analysis accuracy
- Intent detection accuracy (>78%)
- Pitch detection accuracy
- Mix recommendation quality

## Reports

The agent generates comprehensive reports:

```
tests/reports/
├── report-1234567890.json    # Structured data
├── report-1234567890.md      # Human-readable
└── report-1234567890.html    # Visual dashboard
```

### Sample Report

```markdown
# DAWG AI Test Report

**Generated**: 2025-10-19T12:00:00Z
**Duration**: 127.45s
**Pass Rate**: 92.3%

## Summary
- ✅ Passed: 36
- ❌ Failed: 3
- ⏭️  Skipped: 1
- Total: 40

## Critical Issues
- ⚠️ Intent detection accuracy below threshold (75% < 80%)
- ⚠️ Music generation timeout on Expert Music AI
- ⚠️ WebSocket connection dropped during stress test

## Recommendations
- Implement retry logic for Intent Detection Service
- Add circuit breaker timeout to Expert Music AI
- Increase WebSocket connection timeout to 60s
```

## Architecture

```
User/CI/CD
    ↓
DAWGTestingAgent
    ↓
┌────────────────────┐
│ 1. Analyze         │  ← Reads codebase, understands features
│    Codebase        │
└────────┬───────────┘
         │
┌────────▼───────────┐
│ 2. Generate        │  ← GPT-4o creates test scenarios
│    Test Plan       │
└────────┬───────────┘
         │
┌────────▼───────────┐
│ 3. Execute         │  ← Runs Playwright, Jest, custom tests
│    Tests           │
└────────┬───────────┘
         │
┌────────▼───────────┐
│ 4. Analyze         │  ← GPT-4o analyzes failures
│    Results         │
└────────┬───────────┘
         │
┌────────▼───────────┐
│ 5. Generate        │  ← Creates JSON/MD/HTML reports
│    Report          │
└────────┬───────────┘
         │
┌────────▼───────────┐
│ 6. Auto-Fix        │  ← GPT-4o generates fixes (optional)
│    Issues          │
└────────────────────┘
```

## Workflow Examples

### Example 1: Voice Chat to Music Generation

```typescript
// Agent generates this test automatically:
test('voice-chat-to-music-generation', async ({ page }) => {
  // Navigate to app
  await page.goto('/app');

  // Start voice chat
  await page.click('[data-testid="voice-chat-button"]');

  // Simulate voice command (mocked)
  await page.evaluate(() => {
    window.mockVoiceCommand('generate a trap beat at 140 BPM');
  });

  // Wait for function call
  await page.waitForSelector('[data-testid="function-call:generate_music"]');

  // Wait for generation to complete
  await page.waitForSelector('[data-testid="generation-complete"]', {
    timeout: 60000
  });

  // Verify audio added to project
  const tracks = await page.locator('[data-testid="track"]').count();
  expect(tracks).toBeGreaterThan(0);

  // Verify audio playback
  await page.click('[data-testid="play-button"]');
  const isPlaying = await page.locator('[data-testid="transport-playing"]').isVisible();
  expect(isPlaying).toBe(true);
});
```

### Example 2: Smart Mix to Mastering Pipeline

```typescript
test('smart-mix-to-mastering-pipeline', async () => {
  // Load test project with multiple tracks
  const project = await loadTestProject('multi-track-demo.json');

  // Run Smart Mix
  const mixResult = await smartMixAssistant.analyzeMix(project.tracks);

  // Verify recommendations
  expect(mixResult.frequencyConflicts.length).toBeGreaterThan(0);
  expect(mixResult.panningRecommendations.length).toBeGreaterThan(0);

  // Apply recommendations
  await smartMixAssistant.applyRecommendations(mixResult);

  // Run Mastering
  const masterResult = await aiMasteringEngine.master(project.mixdown, {
    target: 'streaming', // -14 LUFS
  });

  // Verify LUFS target met
  expect(masterResult.integratedLUFS).toBeCloseTo(-14, 1);
  expect(masterResult.truePeak).toBeLessThan(-1);

  // Verify no clipping
  expect(masterResult.issues.find(i => i.type === 'clipping')).toBeUndefined();
});
```

## Cost Estimation

Running the full test suite:
- ~100 GPT-4o API calls
- ~50k tokens input, ~20k tokens output
- Estimated cost: $2.50-$5.00 per run

## Best Practices

1. **Run regularly**: Daily in CI/CD, after major changes
2. **Review reports**: Check recommendations and critical issues
3. **Fix failures**: Address issues before merging
4. **Update config**: Adjust thresholds as needed
5. **Monitor trends**: Track pass rates over time

## Troubleshooting

### Tests timing out
```json
{
  "timeoutPerTest": 180000  // Increase to 3 minutes
}
```

### Too many API calls
```json
{
  "useRealAPIs": false,  // Use mocks instead
  "mockExternalServices": true
}
```

### Parallel execution issues
```json
{
  "parallelization": false,  // Run sequentially
  "maxConcurrentTests": 1
}
```

## Roadmap

- [ ] Visual regression testing
- [ ] Audio quality analysis (ML-based)
- [ ] Load testing for concurrent users
- [ ] Security testing (SQL injection, XSS, etc.)
- [ ] Accessibility testing (WCAG 2.1)
- [ ] Mobile app testing (React Native)
- [ ] Performance profiling
- [ ] Cost optimization recommendations

## Contributing

To add new test scenarios, edit `agent-config.json`:

```json
{
  "testSuites": {
    "customSuite": {
      "priority": "high",
      "tests": [
        "your-custom-test-name"
      ]
    }
  }
}
```

The agent will automatically generate test code based on the test name and description.

## License

MIT
