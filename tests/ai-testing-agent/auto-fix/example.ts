#!/usr/bin/env tsx
/**
 * Auto-Fix System Example
 *
 * This file demonstrates how the auto-fix PR creation system works
 * with a real test failure scenario.
 */

import { AutoFixOrchestrator } from './index';
import { TestFailure } from './fix-generator';

/**
 * Example 1: Simple assertion failure
 */
async function exampleAssertionFailure() {
  console.log('='.repeat(80));
  console.log('EXAMPLE 1: Assertion Failure');
  console.log('='.repeat(80));

  const failure: TestFailure = {
    testName: 'should generate music from voice command',
    testFile: 'tests/e2e/voice-to-music.spec.ts',
    errorMessage:
      'expect(received).toContain(expected)\n\nExpected substring: "music generated"\nReceived string: "error: timeout"',
    stackTrace: `at Object.<anonymous> (tests/e2e/voice-to-music.spec.ts:45:23)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
    failureType: 'assertion',
    context: {
      expectedValue: 'music generated',
      actualValue: 'error: timeout',
      failingCode: `
const response = await page.locator('.ai-response').textContent();
expect(response).toContain('music generated');
      `,
    },
  };

  const orchestrator = new AutoFixOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.processTestFailure(failure, {
    autoApply: false, // Don't auto-apply for demo
    createPR: false, // Don't create PR for demo
  });

  console.log('\nResult:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.validationResult) {
    console.log(
      'Confidence:',
      (result.validationResult.confidence * 100).toFixed(1) + '%'
    );
  }
}

/**
 * Example 2: Timeout failure
 */
async function exampleTimeoutFailure() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 2: Timeout Failure');
  console.log('='.repeat(80));

  const failure: TestFailure = {
    testName: 'should stream real-time voice responses',
    testFile: 'tests/e2e/realtime-voice.spec.ts',
    errorMessage: 'Timeout 30000ms exceeded waiting for WebSocket connection',
    stackTrace: `at waitForWebSocket (tests/e2e/realtime-voice.spec.ts:78:10)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
    failureType: 'timeout',
    context: {
      failingCode: `
await page.click('.start-voice');
await page.waitForSelector('.voice-active', { timeout: 30000 });
      `,
    },
  };

  const orchestrator = new AutoFixOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.processTestFailure(failure, {
    autoApply: false,
    createPR: false,
  });

  console.log('\nResult:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.validationResult) {
    console.log(
      'Confidence:',
      (result.validationResult.confidence * 100).toFixed(1) + '%'
    );
  }
}

/**
 * Example 3: Integration failure with full PR creation
 */
async function exampleWithPRCreation() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 3: Full PR Creation Workflow');
  console.log('='.repeat(80));

  const failure: TestFailure = {
    testName: 'should analyze lyrics and generate music',
    testFile: 'tests/integration/lyrics-to-music.test.ts',
    errorMessage: 'TypeError: Cannot read property "genre" of undefined',
    stackTrace: `at LyricsAnalysisService.analyzeGenre (src/backend/services/lyrics-analysis-service.ts:156:20)
    at Object.<anonymous> (tests/integration/lyrics-to-music.test.ts:89:5)`,
    failureType: 'runtime',
    context: {
      failingCode: `
const analysis = await lyricsService.analyzeLyrics(lyrics);
const genre = analysis.genre.primary; // Error here: analysis.genre is undefined
      `,
    },
  };

  const orchestrator = new AutoFixOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.processTestFailure(failure, {
    autoApply: true, // Auto-apply the fix
    createPR: true, // Create actual PR
    reviewers: ['team-lead', 'qa-lead'], // Request reviews
  });

  console.log('\nResult:', result.success ? 'SUCCESS' : 'FAILED');

  if (result.prResult && result.prResult.success) {
    console.log('\nPR Created Successfully!');
    console.log('URL:', result.prResult.prUrl);
    console.log('Number:', result.prResult.prNumber);
    console.log('Branch:', result.prResult.branchName);
  }

  if (result.validationResult) {
    console.log('\nValidation Results:');
    console.log(
      '  Confidence:',
      (result.validationResult.confidence * 100).toFixed(1) + '%'
    );
    console.log(
      '  Tests Passed:',
      `${result.validationResult.passed}/${result.validationResult.total}`
    );
    console.log('  Duration:', result.validationResult.duration + 'ms');
  }
}

/**
 * Example 4: Direct API usage
 */
async function exampleDirectAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 4: Direct API Usage');
  console.log('='.repeat(80));

  const { autoFixTestFailure } = await import('./index');

  // Simulate a test failure with error output
  const errorOutput = `
Error: expect(received).toBe(expected)

Expected: "success"
Received: "error"

    at Object.<anonymous> (tests/ai/music-generation.test.ts:34:5)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
  `;

  try {
    await autoFixTestFailure(
      'should generate music successfully',
      'tests/ai/music-generation.test.ts',
      errorOutput,
      {
        createPR: true,
        reviewers: ['engineering-team'],
      }
    );

    console.log('\n✅ Auto-fix completed successfully!');
  } catch (error) {
    console.error('\n❌ Auto-fix failed:', error.message);
  }
}

/**
 * Example PR that would be created
 */
function showExamplePR() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE PR OUTPUT');
  console.log('='.repeat(80));

  const examplePR = `
# [AUTO-FIX] Fix failing test: should generate music from voice command

## Summary

This PR contains an automated fix generated by the DAWG AI Testing Agent for a failing test. The fix has been analyzed, generated, and validated using GPT-4o.

**Test:** \`should generate music from voice command\`
**File:** \`tests/e2e/voice-to-music.spec.ts\`
**Fix Confidence:** 87.5%
**Validation Status:** ✅ PASSED

---

## Test Failure Analysis

### Error Details

\`\`\`
expect(received).toContain(expected)

Expected substring: "music generated"
Received string: "error: timeout"
\`\`\`

### Root Cause

**Category:** timeout
**Severity:** high

The test is failing because the WebSocket connection to the music generation service is timing out before receiving a response. The issue is caused by an insufficient timeout value (5000ms) that doesn't account for the actual music generation time, which can take 10-15 seconds.

---

## Fix Strategy

### Recommended Approach

Increase the WebSocket timeout to 30 seconds and add proper retry logic with exponential backoff.

**Reasoning:** The music generation service can take 10-15 seconds to process voice input and generate music. The current 5-second timeout is insufficient. Adding retry logic ensures robustness against transient failures.

**Complexity:** low
**Breaking Change:** No
**Estimated Impact:** This fix will improve test reliability without affecting production behavior.

### Files Changed

- \`tests/e2e/voice-to-music.spec.ts\` (modify): Increase timeout and add retry logic
- \`tests/helpers/websocket-helper.ts\` (modify): Add exponential backoff helper

---

## Verification Results

### Test Execution

| Metric | Value |
|--------|-------|
| Original Test Status | PASSED ✅ |
| Tests Passed | 12 / 12 |
| Pass Rate | 100% |
| Confidence Score | 87.5% |
| Execution Time | 45.3s |

### Before Fix

\`\`\`
Status: FAILED ❌
Error: Timeout 5000ms exceeded
Duration: 5012ms
\`\`\`

### After Fix

\`\`\`
Status: PASSED ✅
Duration: 12453ms
Performance Impact: 12450ms avg
\`\`\`

---

## Similar Past Fixes

The AI Agent found similar issues that were fixed previously:

- **should stream real-time audio**
  - Issue: WebSocket timeout in audio streaming
  - Solution: Increased timeout to 30s
  - Success: ✅
  - Date: 2025-10-15

- **should process long voice commands**
  - Issue: Timeout waiting for AI response
  - Solution: Added retry logic with backoff
  - Success: ✅
  - Date: 2025-10-12

---

## Review Checklist

Before merging this auto-generated fix, please verify:

- [ ] The fix addresses the root cause identified
- [ ] All tests pass (especially the originally failing test)
- [ ] No new test failures introduced
- [ ] Code quality meets project standards
- [ ] No unintended side effects in related functionality

---

<sub>🤖 Generated with DAWG AI Testing Agent</sub>
  `;

  console.log(examplePR);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Show what a PR would look like
    showExamplePR();

    console.log('\n\n' + '='.repeat(80));
    console.log('RUNNING LIVE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\nNote: The following examples will use GPT-4o to analyze');
    console.log('failures and generate fixes. Set OPENAI_API_KEY to run.\n');

    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        '⚠️  OPENAI_API_KEY not set. Skipping live examples.\n'
      );
      console.log('To run live examples, set your OpenAI API key:');
      console.log('export OPENAI_API_KEY="your-key-here"\n');
      return;
    }

    // Run examples (uncomment to run live)
    // await exampleAssertionFailure();
    // await exampleTimeoutFailure();
    // await exampleWithPRCreation(); // This will create a real PR!
    // await exampleDirectAPI();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  exampleAssertionFailure,
  exampleTimeoutFailure,
  exampleWithPRCreation,
  exampleDirectAPI,
  showExamplePR,
};
