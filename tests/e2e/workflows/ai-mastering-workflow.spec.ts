import { test, expect, Page } from '@playwright/test';

/**
 * AI Mastering Workflow E2E Tests
 *
 * Tests the complete AI mastering workflow including:
 * - Testing different loudness targets (-14, -9, -6 LUFS)
 * - Verifying mastering chain application
 * - Checking audio analysis results
 * - Testing genre-specific mastering
 * - Verifying before/after comparison
 */

test.describe('AI Mastering Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to AI mastering page
    await page.goto('/ai-mastering');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="mastering-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load mastering page with all controls', async () => {
    // Verify main components
    await expect(page.locator('[data-testid="audio-upload-zone"]')).toBeVisible();
    await expect(page.locator('[data-testid="loudness-target-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="genre-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="master-button"]')).toBeVisible();
  });

  test('should upload audio file for mastering', async () => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="audio-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'unmastered-track.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('audio data'),
    });

    // Verify upload
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('unmastered-track.wav');
    await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
  });

  test('should display loudness target options', async () => {
    await page.locator('[data-testid="loudness-target-selector"]').click();

    // Verify all target options
    const targets = ['-14 LUFS', '-9 LUFS', '-6 LUFS'];

    for (const target of targets) {
      await expect(page.locator(`[data-testid="target-option-${target}"]`)).toBeVisible();
    }
  });

  test('should select -14 LUFS target (streaming standard)', async () => {
    await page.locator('[data-testid="loudness-target-selector"]').click();
    await page.locator('[data-testid="target-option--14 LUFS"]').click();

    // Verify selection
    await expect(page.locator('[data-testid="loudness-target-selector"]')).toContainText('-14 LUFS');

    // Should show streaming platform info
    await expect(page.locator('[data-testid="target-info"]')).toContainText(/spotify|apple.*music|streaming/i);
  });

  test('should select -9 LUFS target (club/radio)', async () => {
    await page.locator('[data-testid="loudness-target-selector"]').click();
    await page.locator('[data-testid="target-option--9 LUFS"]').click();

    // Verify selection
    await expect(page.locator('[data-testid="loudness-target-selector"]')).toContainText('-9 LUFS');

    // Should show appropriate use case info
    await expect(page.locator('[data-testid="target-info"]')).toContainText(/club|radio|loud/i);
  });

  test('should select -6 LUFS target (maximum loudness)', async () => {
    await page.locator('[data-testid="loudness-target-selector"]').click();
    await page.locator('[data-testid="target-option--6 LUFS"]').click();

    // Verify selection
    await expect(page.locator('[data-testid="loudness-target-selector"]')).toContainText('-6 LUFS');

    // Should show warning about distortion
    await expect(page.locator('[data-testid="target-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-warning"]')).toContainText(/distortion|careful/i);
  });

  test('should select genre for genre-specific mastering', async () => {
    await page.locator('[data-testid="genre-selector"]').click();

    // Verify genre options
    const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Country', 'Jazz', 'Classical'];

    for (const genre of genres) {
      await expect(page.locator(`[data-testid="genre-option-${genre.toLowerCase()}"]`)).toBeVisible();
    }

    // Select Hip-Hop
    await page.locator('[data-testid="genre-option-hip-hop"]').click();
    await expect(page.locator('[data-testid="genre-selector"]')).toContainText('Hip-Hop');
  });

  test('should analyze audio before mastering', async () => {
    await uploadTestAudio(page);

    // Analysis should start automatically
    await expect(page.locator('[data-testid="audio-analysis-panel"]')).toBeVisible({ timeout: 5000 });

    // Verify analysis results
    await expect(page.locator('[data-testid="current-lufs"]')).toBeVisible();
    await expect(page.locator('[data-testid="peak-level"]')).toBeVisible();
    await expect(page.locator('[data-testid="dynamic-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="frequency-balance"]')).toBeVisible();
  });

  test('should start mastering process with selected settings', async () => {
    await uploadTestAudio(page);

    // Set parameters
    await page.locator('[data-testid="loudness-target-selector"]').click();
    await page.locator('[data-testid="target-option--14 LUFS"]').click();

    await page.locator('[data-testid="genre-selector"]').click();
    await page.locator('[data-testid="genre-option-pop"]').click();

    // Start mastering
    await page.locator('[data-testid="master-button"]').click();

    // Verify mastering started
    await expect(page.locator('[data-testid="mastering-progress"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-status"]')).toContainText(/mastering|processing/i);
  });

  test('should show mastering chain being applied', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'rock');
    await page.locator('[data-testid="master-button"]').click();

    // Verify chain stages
    const stages = [
      'eq-adjustment',
      'compression',
      'saturation',
      'limiting',
      'final-analysis',
    ];

    for (const stage of stages) {
      await expect(page.locator(`[data-testid="chain-stage-${stage}"]`)).toBeVisible({ timeout: 30000 });
    }
  });

  test('should complete mastering and show results', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'electronic');
    await page.locator('[data-testid="master-button"]').click();

    // Wait for completion
    await expect(page.locator('[data-testid="mastering-complete"]')).toBeVisible({ timeout: 120000 });

    // Verify results displayed
    await expect(page.locator('[data-testid="mastered-audio-player"]')).toBeVisible();
    await expect(page.locator('[data-testid="before-after-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible();
  });

  test('should display mastering analysis results', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'pop');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Verify analysis metrics
    const metrics = [
      'achieved-lufs',
      'true-peak',
      'dynamic-range',
      'frequency-spectrum',
      'stereo-width',
    ];

    for (const metric of metrics) {
      await expect(page.locator(`[data-testid="metric-${metric}"]`)).toBeVisible();
    }

    // Verify LUFS target was achieved
    const achievedLufs = await page.locator('[data-testid="achieved-lufs"]').textContent();
    expect(achievedLufs).toContain('-14');
  });

  test('should compare before and after audio', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'hip-hop');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Play original
    await page.locator('[data-testid="play-original"]').click();
    await expect(page.locator('[data-testid="playback-indicator-original"]')).toBeVisible();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="play-original"]').click(); // Stop

    // Play mastered
    await page.locator('[data-testid="play-mastered"]').click();
    await expect(page.locator('[data-testid="playback-indicator-mastered"]')).toBeVisible();
  });

  test('should display waveform comparison', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'r&b');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Verify waveforms
    await expect(page.locator('[data-testid="waveform-original"]')).toBeVisible();
    await expect(page.locator('[data-testid="waveform-mastered"]')).toBeVisible();

    // Both should have canvas elements
    await expect(page.locator('[data-testid="waveform-original"]').locator('canvas')).toBeVisible();
    await expect(page.locator('[data-testid="waveform-mastered"]').locator('canvas')).toBeVisible();
  });

  test('should display frequency spectrum comparison', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'electronic');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Open spectrum view
    await page.locator('[data-testid="spectrum-view-toggle"]').click();

    // Verify spectrum displays
    await expect(page.locator('[data-testid="spectrum-original"]')).toBeVisible();
    await expect(page.locator('[data-testid="spectrum-mastered"]')).toBeVisible();
  });

  test('should apply genre-specific EQ curve for Rock', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'rock');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Check for rock-specific processing
    const processingInfo = await page.locator('[data-testid="processing-details"]').textContent();
    expect(processingInfo).toMatch(/guitar|rock/i);

    // Frequency analysis should show enhanced mids
    const freqAnalysis = await page.locator('[data-testid="frequency-analysis"]').textContent();
    expect(freqAnalysis).toMatch(/mid.*enhanced|midrange/i);
  });

  test('should apply genre-specific processing for Hip-Hop', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-6 LUFS', 'hip-hop');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Hip-hop should emphasize bass
    const processingInfo = await page.locator('[data-testid="processing-details"]').textContent();
    expect(processingInfo).toMatch(/bass|low.*end/i);
  });

  test('should apply gentle mastering for Classical', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'classical');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Classical should preserve dynamics
    const dynamicRange = await page.locator('[data-testid="metric-dynamic-range"]').textContent();
    const drValue = parseFloat(dynamicRange || '0');

    // Should maintain high dynamic range
    expect(drValue).toBeGreaterThan(10); // DR > 10 for classical
  });

  test('should download mastered audio', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'pop');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/mastered.*\.wav$/i);
  });

  test('should export mastered audio in different formats', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'electronic');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Open export options
    await page.locator('[data-testid="export-options-button"]').click();

    // Select MP3
    await page.locator('[data-testid="format-mp3-320"]').click();

    // Download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="confirm-export-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mp3$/);
  });

  test('should show advanced settings panel', async () => {
    await uploadTestAudio(page);

    // Open advanced settings
    await page.locator('[data-testid="advanced-settings-toggle"]').click();

    // Verify advanced controls
    await expect(page.locator('[data-testid="stereo-width-control"]')).toBeVisible();
    await expect(page.locator('[data-testid="bass-enhancement-control"]')).toBeVisible();
    await expect(page.locator('[data-testid="presence-control"]')).toBeVisible();
    await expect(page.locator('[data-testid="saturation-amount"]')).toBeVisible();
  });

  test('should adjust advanced mastering parameters', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="advanced-settings-toggle"]').click();

    // Adjust stereo width
    await page.locator('[data-testid="stereo-width-control"]').fill('120');
    const width = await page.locator('[data-testid="stereo-width-control"]').inputValue();
    expect(width).toBe('120');

    // Adjust bass enhancement
    await page.locator('[data-testid="bass-enhancement-control"]').fill('3');
    const bass = await page.locator('[data-testid="bass-enhancement-control"]').inputValue();
    expect(bass).toBe('3');
  });

  test('should handle mastering errors gracefully', async () => {
    // Mock API error
    await page.route('**/api/mastering/process', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Mastering engine unavailable' })
      });
    });

    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'pop');
    await page.locator('[data-testid="master-button"]').click();

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should cancel mastering in progress', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'rock');
    await page.locator('[data-testid="master-button"]').click();

    // Wait for processing to start
    await expect(page.locator('[data-testid="mastering-progress"]')).toBeVisible({ timeout: 5000 });

    // Cancel
    await page.locator('[data-testid="cancel-mastering-button"]').click();
    await page.locator('[data-testid="confirm-cancel-button"]').click();

    // Verify cancelled
    await expect(page.locator('[data-testid="mastering-cancelled-message"]')).toBeVisible();
  });

  test('should save mastered track to library', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'pop');
    await page.locator('[data-testid="master-button"]').click();
    await page.waitForSelector('[data-testid="mastering-complete"]', { timeout: 120000 });

    // Save to library
    await page.locator('[data-testid="save-to-library-button"]').click();
    await page.locator('[data-testid="track-name-input"]').fill('My Mastered Track');
    await page.locator('[data-testid="confirm-save-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();

    // Check library
    await page.goto('/library');
    await expect(page.locator('[data-testid="track-item"]').filter({ hasText: 'My Mastered Track' })).toBeVisible();
  });

  test('should display mastering time estimate', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-14 LUFS', 'electronic');
    await page.locator('[data-testid="master-button"]').click();

    // Check estimate
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible({ timeout: 5000 });
    const estimate = await page.locator('[data-testid="estimated-time"]').textContent();
    expect(estimate).toMatch(/\d+\s*(seconds?|minutes?)/i);
  });

  test('should show real-time processing updates', async () => {
    await uploadTestAudio(page);
    await setMasteringParameters(page, '-9 LUFS', 'hip-hop');
    await page.locator('[data-testid="master-button"]').click();

    // Monitor progress updates
    await expect(page.locator('[data-testid="mastering-progress"]')).toBeVisible({ timeout: 5000 });

    const progressBar = page.locator('[data-testid="progress-bar"]');
    const initialProgress = await progressBar.getAttribute('aria-valuenow');

    await page.waitForTimeout(5000);

    const updatedProgress = await progressBar.getAttribute('aria-valuenow');
    expect(Number(updatedProgress)).toBeGreaterThan(Number(initialProgress));
  });
});

/**
 * Helper function to upload test audio
 */
async function uploadTestAudio(page: Page) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-testid="audio-upload-zone"]').click();

  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test-track.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('test audio data'),
  });

  await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
}

/**
 * Helper function to set mastering parameters
 */
async function setMasteringParameters(page: Page, lufsTarget: string, genre: string) {
  // Set LUFS target
  await page.locator('[data-testid="loudness-target-selector"]').click();
  await page.locator(`[data-testid="target-option-${lufsTarget}"]`).click();

  // Set genre
  await page.locator('[data-testid="genre-selector"]').click();
  await page.locator(`[data-testid="genre-option-${genre.toLowerCase()}"]`).click();
}
