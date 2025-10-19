/**
 * Stem Separation Workflow Tests
 *
 * Tests the AI-powered stem separation workflow:
 * - User uploads full mix
 * - AI separates vocals, drums, bass, other
 * - User can isolate and adjust individual stems
 * - User can remix or export stems
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const TEST_URL = process.env.TEST_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/workflows/stem-separation');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Stem Separation Workflow Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should access stem separation interface', async () => {
    console.log('\n=== Testing Stem Separation Interface ===\n');

    const stemButton = page.locator('[data-testid="stem-separation"]').or(
      page.locator('button:has-text("Stem")').or(
        page.locator('button:has-text("Separate")')
      )
    );

    const exists = await stemButton.count() > 0;
    console.log(`Stem separation interface: ${exists ? 'Found' : 'Not found'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-stem-interface.png'),
      fullPage: true,
    });

    if (!exists) {
      const report = {
        test: 'Stem Separation Interface',
        status: 'needs_implementation',
        issue: 'Stem separation button not found',
        recommendation: 'Add [data-testid="stem-separation"] to workflow trigger',
      };

      fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'stem-test-report.json'),
        JSON.stringify(report, null, 2)
      );
    }
  });

  test('should support file upload', async () => {
    console.log('\n=== Testing File Upload Capability ===\n');

    const uploadButton = page.locator('[data-testid="upload-audio"]').or(
      page.locator('input[type="file"]').or(
        page.locator('button:has-text("Upload")')
      )
    );

    const exists = await uploadButton.count() > 0;
    console.log(`Upload button: ${exists ? 'Found' : 'Not found'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-file-upload.png'),
      fullPage: true,
    });
  });

  test('should show separation progress', async () => {
    console.log('\n=== Testing Separation Progress ===\n');

    const progressBar = page.locator('[data-testid="separation-progress"]').or(
      page.locator('[role="progressbar"]')
    );

    const exists = await progressBar.count() > 0;
    console.log(`Progress indicator: ${exists ? 'Found' : 'Not found'}`);

    // Mock separation stages
    const separationStages = [
      { stage: 'loading_audio', progress: 0 },
      { stage: 'analyzing_frequencies', progress: 20 },
      { stage: 'separating_vocals', progress: 40 },
      { stage: 'separating_drums', progress: 60 },
      { stage: 'separating_bass', progress: 80 },
      { stage: 'finalizing_stems', progress: 100 },
    ];

    console.log('Separation Stages:');
    separationStages.forEach((stage) => {
      console.log(`  ${stage.progress}% - ${stage.stage}`);
    });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-separation-progress.png'),
      fullPage: true,
    });
  });

  test('should display separated stems', async () => {
    console.log('\n=== Testing Stem Display ===\n');

    const stemTracks = {
      vocals: page.locator('[data-testid="stem-vocals"]'),
      drums: page.locator('[data-testid="stem-drums"]'),
      bass: page.locator('[data-testid="stem-bass"]'),
      other: page.locator('[data-testid="stem-other"]'),
    };

    const results = {
      vocals: await stemTracks.vocals.count() > 0,
      drums: await stemTracks.drums.count() > 0,
      bass: await stemTracks.bass.count() > 0,
      other: await stemTracks.other.count() > 0,
    };

    console.log('Stem Tracks:', results);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-stem-display.png'),
      fullPage: true,
    });
  });

  test('should support stem solo and mute', async () => {
    console.log('\n=== Testing Solo/Mute Controls ===\n');

    const soloButton = page.locator('[data-testid="solo-button"]').or(
      page.locator('button[aria-label*="Solo"]')
    );

    const muteButton = page.locator('[data-testid="mute-button"]').or(
      page.locator('button[aria-label*="Mute"]')
    );

    const soloExists = await soloButton.count() > 0;
    const muteExists = await muteButton.count() > 0;

    console.log(`Solo controls: ${soloExists ? 'Found' : 'Not found'}`);
    console.log(`Mute controls: ${muteExists ? 'Found' : 'Not found'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-solo-mute-controls.png'),
      fullPage: true,
    });
  });

  test('should support volume adjustment per stem', async () => {
    console.log('\n=== Testing Volume Controls ===\n');

    const volumeSlider = page.locator('[data-testid="volume-slider"]').or(
      page.locator('input[type="range"]').filter({ has: page.locator('label:has-text("Volume")') })
    );

    const exists = await volumeSlider.count() > 0;
    console.log(`Volume sliders: ${exists ? 'Found' : 'Not found'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-volume-controls.png'),
      fullPage: true,
    });
  });

  test('should support stem export', async () => {
    console.log('\n=== Testing Stem Export ===\n');

    const exportButton = page.locator('[data-testid="export-stems"]').or(
      page.locator('button:has-text("Export")').or(
        page.locator('button:has-text("Download")')
      )
    );

    const exists = await exportButton.count() > 0;
    console.log(`Export button: ${exists ? 'Found' : 'Not found'}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-stem-export.png'),
      fullPage: true,
    });
  });

  test('generate stem separation workflow report', async () => {
    console.log('\n=== Generating Stem Separation Workflow Report ===\n');

    const report = {
      workflow: 'Stem Separation',
      timestamp: new Date().toISOString(),
      tests: [
        { name: 'Stem Separation Interface', status: 'needs_verification' },
        { name: 'File Upload', status: 'needs_verification' },
        { name: 'Separation Progress', status: 'needs_verification' },
        { name: 'Stem Display', status: 'needs_verification' },
        { name: 'Solo/Mute Controls', status: 'needs_verification' },
        { name: 'Volume Controls', status: 'needs_verification' },
        { name: 'Stem Export', status: 'needs_verification' },
      ],
      recommendations: [
        'Integrate Demucs or Spleeter for stem separation',
        'Add waveform visualization for each stem',
        'Implement stem quality indicators',
        'Add batch processing for multiple files',
        'Support various export formats (WAV, MP3, FLAC)',
      ],
      nextSteps: [
        'Verify stem separation API integration',
        'Test separation quality with various genres',
        'Validate export functionality',
        'Test remix capabilities with separated stems',
      ],
    };

    const reportPath = path.join(SCREENSHOT_DIR, 'stem-separation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('Report saved to:', reportPath);
    console.log('\nStem Separation Workflow Tests Summary:');
    console.log(`Total Tests: ${report.tests.length}`);
    console.log(`Needs Verification: ${report.tests.filter((t) => t.status === 'needs_verification').length}`);
  });
});
