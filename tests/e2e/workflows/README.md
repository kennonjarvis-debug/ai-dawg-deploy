# DAWG AI Workflows - E2E Test Suite

Comprehensive end-to-end Playwright tests for all 8 DAWG AI workflows.

## Table of Contents

- [Overview](#overview)
- [Test Files](#test-files)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Configuration](#test-configuration)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

This test suite provides comprehensive E2E coverage for all major DAWG AI workflows:

1. **Freestyle Workflow** - Voice commands, beat playback, live transcription
2. **Melody-to-Vocals** - Melody upload, vocals generation, lyrics quality
3. **Stem Separation** - Audio separation into 4 stems (vocals, drums, bass, other)
4. **AI Mastering** - Loudness targets, mastering chain, genre-specific processing
5. **Live Vocal Analysis** - Real-time pitch detection, sharp/flat alerts, feedback
6. **AI Memory** - Preferences storage, retrieval, filtering, expiration
7. **Voice Commands** - Command recognition, execution, customization
8. **Budget Alerts** - Budget limits, usage tracking, alerts at thresholds

## Test Files

```
tests/e2e/workflows/
├── freestyle-workflow.spec.ts           # 15 test scenarios
├── melody-vocals-workflow.spec.ts       # 22 test scenarios
├── stem-separation-workflow.spec.ts     # 25 test scenarios
├── ai-mastering-workflow.spec.ts        # 26 test scenarios
├── live-vocal-analysis-workflow.spec.ts # 25 test scenarios
├── ai-memory-workflow.spec.ts           # 23 test scenarios
├── voice-commands-workflow.spec.ts      # 25 test scenarios
├── budget-alerts-workflow.spec.ts       # 25 test scenarios
├── fixtures/
│   └── README.md                        # Fixture generation guide
└── README.md                            # This file
```

**Total Test Scenarios: 186**

## Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **Playwright**: v1.55.1 (installed automatically)
- **Browser Permissions**: Microphone access for voice-related tests
- **Test Fixtures**: Audio files (can be generated)

## Installation

### 1. Install Dependencies

```bash
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Generate Test Fixtures (Optional)

```bash
cd tests/e2e/workflows/fixtures
# Use ffmpeg to generate test audio files
ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -ar 48000 test-audio.wav
```

## Running Tests

### Run All Workflow Tests

```bash
npm run test:e2e -- tests/e2e/workflows
```

### Run Specific Workflow Test

```bash
# Freestyle workflow
npm run test:e2e -- tests/e2e/workflows/freestyle-workflow.spec.ts

# Melody-to-Vocals workflow
npm run test:e2e -- tests/e2e/workflows/melody-vocals-workflow.spec.ts

# Stem Separation workflow
npm run test:e2e -- tests/e2e/workflows/stem-separation-workflow.spec.ts

# AI Mastering workflow
npm run test:e2e -- tests/e2e/workflows/ai-mastering-workflow.spec.ts

# Live Vocal Analysis workflow
npm run test:e2e -- tests/e2e/workflows/live-vocal-analysis-workflow.spec.ts

# AI Memory workflow
npm run test:e2e -- tests/e2e/workflows/ai-memory-workflow.spec.ts

# Voice Commands workflow
npm run test:e2e -- tests/e2e/workflows/voice-commands-workflow.spec.ts

# Budget Alerts workflow
npm run test:e2e -- tests/e2e/workflows/budget-alerts-workflow.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed -- tests/e2e/workflows/freestyle-workflow.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui -- tests/e2e/workflows
```

### Run Tests on Specific Browser

```bash
# Chromium only
npx playwright test tests/e2e/workflows --project=chromium

# Firefox only
npx playwright test tests/e2e/workflows --project=firefox

# WebKit only
npx playwright test tests/e2e/workflows --project=webkit
```

### Run Tests in Parallel

```bash
# Run with 4 workers
npx playwright test tests/e2e/workflows --workers=4
```

### Run Single Test Case

```bash
# Run specific test by name
npx playwright test tests/e2e/workflows/freestyle-workflow.spec.ts -g "should load freestyle page"
```

## Test Configuration

### Playwright Configuration

Tests use the configuration in `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/playwright.config.ts`:

```typescript
{
  testDir: './tests',
  timeout: 60000,          // 60 second timeout
  retries: 1,              // Retry failed tests once
  workers: 1,              // Sequential execution
  use: {
    baseURL: 'https://www.dawg-ai.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
}
```

### Environment Variables

```bash
# Set custom base URL
export BASE_URL=http://localhost:4173

# Run tests
npm run test:e2e -- tests/e2e/workflows
```

### Test Data Attributes

All tests use `data-testid` attributes for reliable element selection:

```typescript
await page.locator('[data-testid="record-button"]').click();
```

## Test Reports

### HTML Report

After test execution, view the HTML report:

```bash
npx playwright show-report
```

Report location: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/playwright-report/index.html`

### JSON Report

Test results are also saved as JSON:

```
/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/test-results/results.json
```

### Screenshots & Videos

On test failure:
- **Screenshots**: `test-results/<test-name>/test-failed-1.png`
- **Videos**: `test-results/<test-name>/video.webm`
- **Traces**: `test-results/<test-name>/trace.zip` (viewable in Playwright Trace Viewer)

### View Trace

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Workflow Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run workflow tests
        run: npm run test:e2e -- tests/e2e/workflows

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: test-results/
```

### GitLab CI Example

```yaml
e2e-workflows:
  stage: test
  image: mcr.microsoft.com/playwright:v1.55.1-focal
  script:
    - npm ci
    - npx playwright test tests/e2e/workflows
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 30 days
```

## Troubleshooting

### Common Issues

#### 1. Microphone Permission Denied

**Issue**: Tests fail with "microphone permission denied"

**Solution**:
```typescript
// Grant permissions in beforeEach
await page.context().grantPermissions(['microphone']);
```

#### 2. Timeout Errors

**Issue**: Tests timeout waiting for elements

**Solution**:
- Increase timeout in playwright.config.ts
- Add explicit waits: `await page.waitForTimeout(1000)`
- Use `waitForLoadState`: `await page.waitForLoadState('networkidle')`

#### 3. Flaky Tests

**Issue**: Tests pass/fail inconsistently

**Solution**:
- Enable retries in config
- Add wait conditions before assertions
- Use `toBeVisible({ timeout: 10000 })`

#### 4. File Upload Failures

**Issue**: File upload tests fail

**Solution**:
```typescript
const fileChooserPromise = page.waitForEvent('filechooser');
await page.locator('[data-testid="upload"]').click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles({
  name: 'test.wav',
  mimeType: 'audio/wav',
  buffer: Buffer.from('data')
});
```

#### 5. WebSocket Connection Issues

**Issue**: Real-time features don't work

**Solution**:
- Check WebSocket URL in config
- Monitor WebSocket events:
```typescript
const wsPromise = page.waitForEvent('websocket');
const ws = await wsPromise;
expect(ws.url()).toMatch(/ws:\/\//);
```

### Debug Mode

Run tests in debug mode:

```bash
# Debug specific test
PWDEBUG=1 npx playwright test tests/e2e/workflows/freestyle-workflow.spec.ts

# Debug with headed browser
npx playwright test tests/e2e/workflows/freestyle-workflow.spec.ts --debug
```

### Verbose Logging

```bash
# Show detailed logs
DEBUG=pw:api npx playwright test tests/e2e/workflows
```

## Best Practices

### 1. Use Data Test IDs

Always use `data-testid` attributes:

```html
<!-- Good -->
<button data-testid="record-button">Record</button>

<!-- Avoid -->
<button class="btn-primary">Record</button>
```

### 2. Wait for Network Idle

Before assertions, wait for network to settle:

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Isolate Tests

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Fresh state for each test
  await page.goto('/');
});
```

### 4. Use Helper Functions

Create reusable helpers:

```typescript
async function uploadAudio(page: Page, filename: string) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-testid="upload-zone"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({ name: filename, buffer: Buffer.from('data') });
}
```

### 5. Mock External Services

Mock API calls for faster, more reliable tests:

```typescript
await page.route('**/api/generate', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ result: 'success' })
  });
});
```

### 6. Screenshot on Failure

Automatically capture screenshots:

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({
      path: `test-results/${testInfo.title}-failure.png`
    });
  }
});
```

### 7. Retry Flaky Tests

Configure retries in playwright.config.ts:

```typescript
retries: process.env.CI ? 2 : 1
```

### 8. Parallel Execution Carefully

Some workflows (especially those using microphone/audio) may need sequential execution:

```typescript
test.describe.configure({ mode: 'serial' });
```

## Test Coverage Summary

| Workflow | Test File | Scenarios | Key Features Tested |
|----------|-----------|-----------|---------------------|
| Freestyle | freestyle-workflow.spec.ts | 15 | Voice commands, beat playback, transcription, lyrics organization |
| Melody-to-Vocals | melody-vocals-workflow.spec.ts | 22 | File upload, generation, lyrics quality, audio output |
| Stem Separation | stem-separation-workflow.spec.ts | 25 | 4-stem separation, quality metrics, playback, download |
| AI Mastering | ai-mastering-workflow.spec.ts | 26 | LUFS targets, mastering chain, genre processing, comparison |
| Live Vocal Analysis | live-vocal-analysis-workflow.spec.ts | 25 | Pitch detection, sharp/flat alerts, real-time feedback, WebSocket |
| AI Memory | ai-memory-workflow.spec.ts | 23 | Storage, retrieval, filtering, importance, expiration |
| Voice Commands | voice-commands-workflow.spec.ts | 25 | Command recognition, execution, customization, accuracy |
| Budget Alerts | budget-alerts-workflow.spec.ts | 25 | Budget limits, usage tracking, alerts, cost breakdown |

**Total: 186 test scenarios**

## Contributing

When adding new tests:

1. Use descriptive test names
2. Add `data-testid` attributes to new UI elements
3. Include both success and failure scenarios
4. Document any new helper functions
5. Update this README with new test counts

## Support

For issues or questions:

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [DAWG AI Docs](https://docs.dawg-ai.com)
- Email: support@dawg-ai.com

## License

MIT License - See LICENSE file for details
