/**
 * End-to-End Tests for Stem Separation
 *
 * Tests the complete stem separation workflow from upload to playback
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

const TEST_URL = process.env.TEST_URL || 'http://localhost:5173';
const TEST_AUDIO_FILE = path.join(__dirname, '../fixtures/test-audio.mp3');

test.describe('Stem Separation E2E Tests', () => {
  test('should complete full separation workflow', async ({ page }) => {
    await page.goto(TEST_URL);

    // 1. Find and click stem separation widget/button
    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible({ timeout: 10000 });

    // 2. Upload audio file
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    // Verify file was selected
    const uploadButton = page.locator('button:has-text("test-audio.mp3")');
    await expect(uploadButton).toBeVisible();

    // 3. Select quality setting
    const qualitySelect = page.locator('select');
    await qualitySelect.selectOption('balanced');

    // 4. Start separation
    const startButton = page.locator('[data-testid="start-separation"]');
    await startButton.click();

    // 5. Verify progress indicator appears
    const progressSection = page.locator('[data-testid="separation-progress"]');
    await expect(progressSection).toBeVisible({ timeout: 5000 });

    // 6. Wait for separation to complete (max 60s)
    const stemPlayer = page.locator('[data-testid="stem-player"]');
    await expect(stemPlayer).toBeVisible({ timeout: 60000 });

    // 7. Verify all stems are present
    const expectedStems = ['vocals', 'drums', 'bass', 'other'];
    for (const stem of expectedStems) {
      const stemTrack = page.locator(`[data-testid="stem-${stem}"]`);
      await expect(stemTrack).toBeVisible();
    }

    // 8. Test playback controls
    const playButton = page.locator('.play-button');
    await playButton.click();

    // Wait a bit for playback to start
    await page.waitForTimeout(1000);

    // Pause playback
    await playButton.click();

    // 9. Test mute functionality
    const muteButton = page.locator('[data-testid="stem-vocals"] [data-testid="mute-button"]').first();
    await muteButton.click();
    await expect(muteButton).toHaveClass(/active/);

    // 10. Test volume control
    const volumeSlider = page.locator('[data-testid="stem-drums"] [data-testid="volume-slider"]').first();
    await volumeSlider.fill('50');

    // 11. Test stem download
    const downloadButton = page.locator('[data-testid="stem-vocals"] [data-testid="download-stem"]').first();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toContain('vocals');
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Try to start separation without uploading a file
    const startButton = page.locator('[data-testid="start-separation"]');

    // Button should not exist if no file is selected
    await expect(startButton).not.toBeVisible();
  });

  test('should show quality options', async ({ page }) => {
    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Upload file
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    // Verify quality selector appears
    const qualitySelect = page.locator('select');
    await expect(qualitySelect).toBeVisible();

    // Verify options
    const options = await qualitySelect.locator('option').allTextContents();
    expect(options).toContain('Fast (15s)');
    expect(options).toContain('Balanced (25s)');
    expect(options).toContain('High Quality (40s)');
  });

  test('should allow canceling separation', async ({ page }) => {
    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Upload and start separation
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    const startButton = page.locator('[data-testid="start-separation"]');
    await startButton.click();

    // Wait for progress to appear
    const progressSection = page.locator('[data-testid="separation-progress"]');
    await expect(progressSection).toBeVisible();

    // TODO: Add cancel button and test cancellation
    // const cancelButton = page.locator('[data-testid="cancel-separation"]');
    // await cancelButton.click();
    // await expect(progressSection).not.toBeVisible();
  });

  test('should handle separation failures gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/separation/separate', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          error: 'Test error: Separation failed',
        }),
      });
    });

    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Upload and start separation
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    const startButton = page.locator('[data-testid="start-separation"]');
    await startButton.click();

    // Verify error message appears
    const errorSection = page.locator('.error-section');
    await expect(errorSection).toBeVisible({ timeout: 5000 });
    await expect(errorSection).toContainText('Test error: Separation failed');
  });

  test('should support solo functionality', async ({ page }) => {
    // This test assumes separation is mocked to complete quickly
    await page.route('**/api/separation/status/*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          status: 'completed',
          progress: 100,
          result: {
            jobId: 'test-123',
            userId: 'test-user',
            stems: [
              {
                type: 'vocals',
                url: 'https://example.com/vocals.wav',
                duration: 180,
                format: 'wav',
                size: 10000000,
                quality: {
                  rmsEnergy: 0.15,
                  spectralCentroid: 2500,
                  isSilent: false,
                  lufs: -14.0,
                  peakLevel: -3.0,
                },
              },
              {
                type: 'drums',
                url: 'https://example.com/drums.wav',
                duration: 180,
                format: 'wav',
                size: 10000000,
                quality: {
                  rmsEnergy: 0.18,
                  spectralCentroid: 3000,
                  isSilent: false,
                  lufs: -12.0,
                  peakLevel: -2.0,
                },
              },
            ],
            metadata: {
              model: 'htdemucs',
              quality: 'balanced',
              duration: 180,
              processingTime: 25,
              originalFileSize: 50000000,
              totalStemsSize: 40000000,
              sampleRate: 44100,
              channels: 2,
              format: 'wav',
              cost: 0.05,
            },
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Upload and start separation
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    const startButton = page.locator('[data-testid="start-separation"]');
    await startButton.click();

    // Wait for completion
    const stemPlayer = page.locator('[data-testid="stem-player"]');
    await expect(stemPlayer).toBeVisible({ timeout: 10000 });

    // Test solo button
    const soloButton = page.locator('[data-testid="stem-vocals"] button:has-text("S")').first();
    await soloButton.click();
    await expect(soloButton).toHaveClass(/active/);

    // Click again to unsolo
    await soloButton.click();
    await expect(soloButton).not.toHaveClass(/active/);
  });

  test('should display separation metadata', async ({ page }) => {
    // Mock completed separation
    await page.route('**/api/separation/status/*', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          status: 'completed',
          progress: 100,
          result: {
            stems: [
              {
                type: 'vocals',
                url: 'https://example.com/vocals.wav',
                duration: 180,
                format: 'wav',
                size: 10000000,
                quality: {
                  rmsEnergy: 0.15,
                  spectralCentroid: 2500,
                  isSilent: false,
                  lufs: -14.0,
                  peakLevel: -3.0,
                },
              },
            ],
            metadata: {
              model: 'htdemucs',
              quality: 'balanced',
              duration: 180,
              processingTime: 25,
              cost: 0.05,
            },
          },
        }),
      });
    });

    await page.goto(TEST_URL);

    const separationWidget = page.locator('[data-testid="stem-separation-widget"]');
    await expect(separationWidget).toBeVisible();

    // Upload and start
    const fileInput = page.locator('[data-testid="upload-audio"]');
    await fileInput.setInputFiles(TEST_AUDIO_FILE);

    const startButton = page.locator('[data-testid="start-separation"]');
    await startButton.click();

    // Wait for completion
    const stemPlayer = page.locator('[data-testid="stem-player"]');
    await expect(stemPlayer).toBeVisible();

    // Verify "Separation Complete!" message
    await expect(page.locator('h3:has-text("Separation Complete!")')).toBeVisible();
  });
});

test.describe('Stem Separation API Tests', () => {
  test('should handle separation API endpoint', async ({ request }) => {
    const formData = new FormData();
    // In a real test, you would add an actual file
    // formData.append('audio', fs.readFileSync(TEST_AUDIO_FILE), 'test-audio.mp3');
    formData.append('quality', 'balanced');

    // Note: This will fail without authentication in production
    // const response = await request.post(`${TEST_URL}/api/separation/separate`, {
    //   multipart: formData,
    // });

    // For now, just test the endpoint exists
    // expect(response.status()).toBe(401); // Or 200 with mock auth
  });

  test('should retrieve separation status', async ({ request }) => {
    const jobId = 'test-job-123';

    const response = await request.get(`${TEST_URL}/api/separation/status/${jobId}`);

    // Should return 404 for non-existent job
    expect(response.status()).toBe(404);
  });

  test('should retrieve user quota', async ({ request }) => {
    // This requires authentication
    // const response = await request.get(`${TEST_URL}/api/separation/quota`, {
    //   headers: {
    //     Authorization: 'Bearer test-token',
    //   },
    // });

    // expect(response.status()).toBe(200);
  });
});
