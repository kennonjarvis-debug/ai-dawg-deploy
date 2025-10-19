# Quick Start Guide - DAWG AI Workflow Tests

Get up and running with E2E workflow tests in 5 minutes.

## Prerequisites

- Node.js v20+ installed
- npm v9+ installed

## Installation (2 minutes)

```bash
# 1. Navigate to project root
cd /Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium
```

## Run Your First Test (1 minute)

```bash
# Run Freestyle workflow test
npm run test:e2e -- tests/e2e/workflows/freestyle-workflow.spec.ts
```

You should see:
```
Running 15 tests using 1 worker

  ✓ freestyle-workflow.spec.ts:23:3 › should load freestyle page with all controls
  ✓ freestyle-workflow.spec.ts:32:3 › should enable voice commands...
  ...

  15 passed (2.3s)
```

## Run All Workflow Tests (3 minutes)

```bash
npm run test:e2e -- tests/e2e/workflows
```

Expected: **186 tests** will run across all 8 workflows.

## View Test Report

After tests complete:

```bash
npx playwright show-report
```

Opens HTML report in browser with:
- Test results
- Screenshots (on failure)
- Videos (on failure)
- Execution traces

## Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui -- tests/e2e/workflows
```

Benefits:
- Interactive test execution
- Step-by-step debugging
- Live test editing
- Watch mode

## Common Commands

```bash
# Run specific workflow
npm run test:e2e -- tests/e2e/workflows/melody-vocals-workflow.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed -- tests/e2e/workflows/stem-separation-workflow.spec.ts

# Run single test by name
npx playwright test tests/e2e/workflows/ai-mastering-workflow.spec.ts -g "should select -14 LUFS"

# Debug mode
PWDEBUG=1 npx playwright test tests/e2e/workflows/live-vocal-analysis-workflow.spec.ts
```

## Test Structure

Each workflow test follows this pattern:

```typescript
test.describe('Workflow Name', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/workflow-page');
  });

  test('should do something', async () => {
    // Arrange
    await page.locator('[data-testid="button"]').click();

    // Act
    await page.locator('[data-testid="action"]').click();

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## Generate Test Fixtures (Optional)

If you need actual audio files:

```bash
cd tests/e2e/workflows/fixtures
./generate-test-audio.sh
```

Requires: `ffmpeg` (install with `brew install ffmpeg`)

## Troubleshooting

### Tests Timeout
**Solution**: Increase timeout in `playwright.config.ts` or use:
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Microphone Permission Denied
**Solution**: Tests handle this automatically. Check test logs for permission grants.

### Element Not Found
**Solution**: Ensure `data-testid` attributes match. Use:
```bash
npx playwright codegen https://www.dawg-ai.com/workflow-page
```

## Next Steps

1. **Read Full Documentation**: See `README.md` for comprehensive guide
2. **Review Test Files**: Explore individual `.spec.ts` files
3. **Check Test Summary**: See `TEST_SUITE_SUMMARY.md` for details
4. **Customize Tests**: Add your own test scenarios

## Test Coverage

| Workflow | Tests | Status |
|----------|-------|--------|
| Freestyle | 15 | ✅ Ready |
| Melody-to-Vocals | 22 | ✅ Ready |
| Stem Separation | 25 | ✅ Ready |
| AI Mastering | 26 | ✅ Ready |
| Live Vocal Analysis | 25 | ✅ Ready |
| AI Memory | 23 | ✅ Ready |
| Voice Commands | 25 | ✅ Ready |
| Budget Alerts | 25 | ✅ Ready |

**Total: 186 test scenarios**

## Support

- 📖 Full Docs: `tests/e2e/workflows/README.md`
- 📊 Summary: `tests/e2e/workflows/TEST_SUITE_SUMMARY.md`
- 🐛 Issues: GitHub Issues
- 📧 Email: support@dawg-ai.com

Happy Testing! 🎵
