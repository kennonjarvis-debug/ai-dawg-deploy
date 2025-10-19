import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Stem Separation Workflow E2E Tests
 *
 * Tests the complete stem separation workflow including:
 * - Uploading audio files for separation
 * - Separating audio into 4 stems (vocals, drums, bass, other)
 * - Verifying stem quality
 * - Testing download functionality
 * - Testing individual stem playback
 */

test.describe('Stem Separation Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to stem separation page
    await page.goto('/stem-separation');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="stem-separation-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load stem separation page with upload zone', async () => {
    // Verify main components
    await expect(page.locator('[data-testid="audio-upload-zone"]')).toBeVisible();
    await expect(page.locator('[data-testid="separate-stems-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-instructions"]')).toBeVisible();
  });

  test('should upload audio file successfully', async () => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="audio-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'full-mix.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('mock audio data'),
    });

    // Verify file uploaded
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('full-mix.wav');
    await expect(page.locator('[data-testid="file-size"]')).toBeVisible();
  });

  test('should accept various audio formats', async () => {
    const formats = [
      { name: 'track.wav', mimeType: 'audio/wav' },
      { name: 'track.mp3', mimeType: 'audio/mp3' },
      { name: 'track.flac', mimeType: 'audio/flac' },
      { name: 'track.m4a', mimeType: 'audio/m4a' },
    ];

    for (const format of formats) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('[data-testid="audio-upload-zone"]').click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({
        name: format.name,
        mimeType: format.mimeType,
        buffer: Buffer.from('audio data'),
      });

      await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();

      // Clear for next iteration
      await page.locator('[data-testid="clear-file-button"]').click();
    }
  });

  test('should reject files that are too large', async () => {
    // Mock a large file (>100MB)
    const largeBuffer = Buffer.alloc(110 * 1024 * 1024); // 110MB

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="audio-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'huge-file.wav',
      mimeType: 'audio/wav',
      buffer: largeBuffer,
    });

    // Should show file size error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/file.*too.*large|size.*limit/i);
  });

  test('should start stem separation process', async () => {
    // Upload file
    await uploadTestAudio(page);

    // Start separation
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Verify separation started
    await expect(page.locator('[data-testid="separation-progress"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-status"]')).toContainText(/separating|processing/i);
  });

  test('should show separation progress with stages', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Verify progress stages
    const stages = [
      'analyzing-audio',
      'separating-vocals',
      'separating-drums',
      'separating-bass',
      'separating-other',
      'finalizing',
    ];

    for (const stage of stages) {
      const stageElement = page.locator(`[data-testid="stage-${stage}"]`);
      await expect(stageElement).toBeVisible({ timeout: 30000 });
    }
  });

  test('should complete separation and display all 4 stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Wait for completion (extended timeout for AI processing)
    await expect(page.locator('[data-testid="separation-complete"]')).toBeVisible({ timeout: 180000 });

    // Verify all 4 stems are displayed
    await expect(page.locator('[data-testid="stem-vocals"]')).toBeVisible();
    await expect(page.locator('[data-testid="stem-drums"]')).toBeVisible();
    await expect(page.locator('[data-testid="stem-bass"]')).toBeVisible();
    await expect(page.locator('[data-testid="stem-other"]')).toBeVisible();
  });

  test('should display stem waveforms', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Check each stem has a waveform
    const stems = ['vocals', 'drums', 'bass', 'other'];

    for (const stem of stems) {
      const waveform = page.locator(`[data-testid="waveform-${stem}"]`);
      await expect(waveform).toBeVisible();

      // Verify waveform has canvas element
      await expect(waveform.locator('canvas')).toBeVisible();
    }
  });

  test('should play individual stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Test playing vocals stem
    const vocalsPlayButton = page.locator('[data-testid="play-stem-vocals"]');
    await vocalsPlayButton.click();

    // Verify playback started
    await expect(page.locator('[data-testid="playback-indicator-vocals"]')).toBeVisible();
    await expect(vocalsPlayButton).toHaveAttribute('data-playing', 'true');

    // Stop playback
    await vocalsPlayButton.click();
    await expect(vocalsPlayButton).toHaveAttribute('data-playing', 'false');
  });

  test('should solo individual stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Solo drums
    await page.locator('[data-testid="solo-stem-drums"]').click();

    // Verify solo state
    await expect(page.locator('[data-testid="stem-drums"]')).toHaveAttribute('data-solo', 'true');

    // Other stems should be muted
    await expect(page.locator('[data-testid="stem-vocals"]')).toHaveAttribute('data-muted', 'true');
    await expect(page.locator('[data-testid="stem-bass"]')).toHaveAttribute('data-muted', 'true');
    await expect(page.locator('[data-testid="stem-other"]')).toHaveAttribute('data-muted', 'true');
  });

  test('should mute individual stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Mute bass
    const muteButton = page.locator('[data-testid="mute-stem-bass"]');
    await muteButton.click();

    // Verify muted
    await expect(page.locator('[data-testid="stem-bass"]')).toHaveAttribute('data-muted', 'true');
    await expect(muteButton).toHaveAttribute('aria-pressed', 'true');

    // Unmute
    await muteButton.click();
    await expect(page.locator('[data-testid="stem-bass"]')).toHaveAttribute('data-muted', 'false');
  });

  test('should adjust volume for individual stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Adjust vocals volume
    const volumeSlider = page.locator('[data-testid="volume-slider-vocals"]');
    await volumeSlider.fill('75');

    // Verify volume updated
    const volume = await volumeSlider.inputValue();
    expect(volume).toBe('75');

    // Volume display should update
    await expect(page.locator('[data-testid="volume-display-vocals"]')).toContainText('75');
  });

  test('should verify stem quality metrics', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Check quality scores for each stem
    const stems = ['vocals', 'drums', 'bass', 'other'];

    for (const stem of stems) {
      const qualityScore = page.locator(`[data-testid="quality-score-${stem}"]`);
      await expect(qualityScore).toBeVisible();

      const scoreText = await qualityScore.textContent();
      const score = parseFloat(scoreText || '0');

      // Quality should be reasonable (0-100 scale)
      expect(score).toBeGreaterThan(60); // At least 60% quality
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('should download individual stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Download vocals stem
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-stem-vocals"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/vocals.*\.wav$/);
  });

  test('should download all stems as ZIP', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Download all stems
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-all-stems"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/stems.*\.zip$/);
  });

  test('should export stems in different formats', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Open export modal
    await page.locator('[data-testid="export-stems-button"]').click();
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();

    // Select format
    await page.locator('[data-testid="export-format-mp3"]').click();

    // Select quality
    await page.locator('[data-testid="export-quality-320kbps"]').click();

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="confirm-export-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test('should play all stems together (full mix)', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Play all stems
    const playAllButton = page.locator('[data-testid="play-all-stems"]');
    await playAllButton.click();

    // Verify all stems are playing
    const stems = ['vocals', 'drums', 'bass', 'other'];
    for (const stem of stems) {
      await expect(page.locator(`[data-testid="playback-indicator-${stem}"]`)).toBeVisible();
    }

    // Verify play button state
    await expect(playAllButton).toHaveAttribute('data-playing', 'true');
  });

  test('should sync playback across all stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Start playback
    await page.locator('[data-testid="play-all-stems"]').click();
    await page.waitForTimeout(2000);

    // Check time positions are synced
    const positions = await page.evaluate(() => {
      const stems = ['vocals', 'drums', 'bass', 'other'];
      return stems.map(stem => {
        const audio = document.querySelector(`[data-testid="audio-${stem}"]`) as HTMLAudioElement;
        return audio?.currentTime || 0;
      });
    });

    // All positions should be within 50ms of each other
    const maxDiff = Math.max(...positions) - Math.min(...positions);
    expect(maxDiff).toBeLessThan(0.05);
  });

  test('should handle separation errors gracefully', async () => {
    // Mock API error
    await page.route('**/api/stem-separation/separate', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Separation service unavailable' })
      });
    });

    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/error|failed/i);

    // Retry button should be available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should cancel separation in progress', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Wait for separation to start
    await expect(page.locator('[data-testid="separation-progress"]')).toBeVisible({ timeout: 5000 });

    // Cancel
    await page.locator('[data-testid="cancel-separation-button"]').click();
    await page.locator('[data-testid="confirm-cancel-button"]').click();

    // Verify cancelled
    await expect(page.locator('[data-testid="separation-cancelled-message"]')).toBeVisible();
  });

  test('should show estimated time for separation', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();

    // Check for time estimate
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible({ timeout: 5000 });

    const estimatedTime = await page.locator('[data-testid="estimated-time"]').textContent();
    expect(estimatedTime).toMatch(/\d+\s*(seconds?|minutes?)/i);
  });

  test('should save separated stems to project', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Save to project
    await page.locator('[data-testid="save-to-project-button"]').click();

    // Enter project name
    await page.locator('[data-testid="project-name-input"]').fill('My Stem Project');

    // Confirm save
    await page.locator('[data-testid="confirm-save-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();

    // Navigate to projects and verify
    await page.goto('/projects');
    await expect(page.locator('[data-testid="project-item"]').filter({ hasText: 'My Stem Project' })).toBeVisible();
  });

  test('should display audio waveform before separation', async () => {
    await uploadTestAudio(page);

    // Waveform should appear after upload
    await expect(page.locator('[data-testid="original-waveform"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-waveform"]').locator('canvas')).toBeVisible();
  });

  test('should show file metadata after upload', async () => {
    await uploadTestAudio(page);

    // Verify metadata displayed
    await expect(page.locator('[data-testid="file-metadata"]')).toBeVisible();

    const metadata = page.locator('[data-testid="file-metadata"]');
    await expect(metadata).toContainText(/duration|length/i);
    await expect(metadata).toContainText(/sample.*rate|hz/i);
    await expect(metadata).toContainText(/channels?|stereo|mono/i);
  });

  test('should compare original with separated stems', async () => {
    await uploadTestAudio(page);
    await page.locator('[data-testid="separate-stems-button"]').click();
    await page.waitForSelector('[data-testid="separation-complete"]', { timeout: 180000 });

    // Enable comparison mode
    await page.locator('[data-testid="comparison-mode-toggle"]').click();

    // Play original
    await page.locator('[data-testid="play-original"]').click();
    await page.waitForTimeout(1000);

    // Switch to stems
    await page.locator('[data-testid="play-stems"]').click();

    // Should be able to A/B compare
    await expect(page.locator('[data-testid="ab-comparison-controls"]')).toBeVisible();
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
    buffer: Buffer.from('mock audio data for testing'),
  });

  await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
}
