import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Melody-to-Vocals Workflow E2E Tests
 *
 * Tests the complete melody-to-vocals conversion workflow including:
 * - Uploading hummed melody files
 * - Entering prompt, genre, and mood parameters
 * - Generating vocals from melody
 * - Verifying lyrics quality
 * - Verifying audio output quality
 */

test.describe('Melody-to-Vocals Workflow', () => {
  let page: Page;
  const testMelodyPath = path.join(__dirname, 'fixtures', 'test-melody.wav');

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to melody-to-vocals page
    await page.goto('/melody-to-vocals');
    await page.waitForLoadState('networkidle');

    // Wait for page components to load
    await expect(page.locator('[data-testid="melody-vocals-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load melody-to-vocals page with all controls', async () => {
    // Verify main UI components
    await expect(page.locator('[data-testid="melody-upload-zone"]')).toBeVisible();
    await expect(page.locator('[data-testid="prompt-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="genre-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="mood-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-vocals-button"]')).toBeVisible();
  });

  test('should upload hummed melody file successfully', async () => {
    // Create mock file for upload
    const fileContent = Buffer.from('mock audio data');
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('[data-testid="melody-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'hummed-melody.wav',
      mimeType: 'audio/wav',
      buffer: fileContent,
    });

    // Verify file uploaded
    await expect(page.locator('[data-testid="uploaded-file-name"]')).toContainText('hummed-melody.wav');
    await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
  });

  test('should validate file format - accept WAV files', async () => {
    const validFile = {
      name: 'melody.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('wav audio data'),
    };

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="melody-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(validFile);

    // Should accept WAV
    await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('should validate file format - accept MP3 files', async () => {
    const validFile = {
      name: 'melody.mp3',
      mimeType: 'audio/mp3',
      buffer: Buffer.from('mp3 audio data'),
    };

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="melody-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(validFile);

    // Should accept MP3
    await expect(page.locator('[data-testid="upload-success-indicator"]')).toBeVisible();
  });

  test('should reject invalid file formats', async () => {
    const invalidFile = {
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not audio data'),
    };

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="melody-upload-zone"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(invalidFile);

    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid.*file.*format/i);
  });

  test('should accept and validate prompt input', async () => {
    const prompt = 'Create an uplifting song about overcoming challenges';

    await page.locator('[data-testid="prompt-input"]').fill(prompt);

    // Verify prompt is accepted
    const inputValue = await page.locator('[data-testid="prompt-input"]').inputValue();
    expect(inputValue).toBe(prompt);

    // Should show character count
    await expect(page.locator('[data-testid="prompt-char-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="prompt-char-count"]')).toContainText(`${prompt.length}`);
  });

  test('should enforce minimum prompt length', async () => {
    const shortPrompt = 'Hi';

    await page.locator('[data-testid="prompt-input"]').fill(shortPrompt);
    await page.locator('[data-testid="generate-vocals-button"]').click();

    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/prompt.*too.*short/i);
  });

  test('should select genre from dropdown', async () => {
    const genreSelector = page.locator('[data-testid="genre-selector"]');

    await genreSelector.click();
    await page.locator('[data-testid="genre-option-pop"]').click();

    // Verify selection
    await expect(genreSelector).toContainText('Pop');
  });

  test('should display all available genres', async () => {
    await page.locator('[data-testid="genre-selector"]').click();

    // Verify genre options are present
    const expectedGenres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz'];

    for (const genre of expectedGenres) {
      await expect(page.locator(`[data-testid="genre-option-${genre.toLowerCase()}"]`)).toBeVisible();
    }
  });

  test('should select mood from dropdown', async () => {
    const moodSelector = page.locator('[data-testid="mood-selector"]');

    await moodSelector.click();
    await page.locator('[data-testid="mood-option-energetic"]').click();

    // Verify selection
    await expect(moodSelector).toContainText('Energetic');
  });

  test('should display all available moods', async () => {
    await page.locator('[data-testid="mood-selector"]').click();

    // Verify mood options
    const expectedMoods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Angry', 'Romantic', 'Mysterious'];

    for (const mood of expectedMoods) {
      await expect(page.locator(`[data-testid="mood-option-${mood.toLowerCase()}"]`)).toBeVisible();
    }
  });

  test('should generate vocals from melody with all parameters', async () => {
    // Upload melody
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="melody-upload-zone"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'melody.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('audio data'),
    });

    // Fill in parameters
    await page.locator('[data-testid="prompt-input"]').fill('Create a powerful anthem about freedom');
    await page.locator('[data-testid="genre-selector"]').click();
    await page.locator('[data-testid="genre-option-rock"]').click();
    await page.locator('[data-testid="mood-selector"]').click();
    await page.locator('[data-testid="mood-option-energetic"]').click();

    // Generate vocals
    await page.locator('[data-testid="generate-vocals-button"]').click();

    // Verify generation started
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-status"]')).toContainText(/generating|processing/i);
  });

  test('should show generation progress with stages', async () => {
    // Start generation
    await setupAndGenerate(page);

    // Verify progress stages
    await expect(page.locator('[data-testid="progress-stage-analyzing"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-stage-generating"]')).toBeVisible({ timeout: 30000 });

    // Progress bar should be visible
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Progress percentage should update
    const initialProgress = await progressBar.getAttribute('aria-valuenow');
    await page.waitForTimeout(5000);
    const updatedProgress = await progressBar.getAttribute('aria-valuenow');

    expect(Number(updatedProgress)).toBeGreaterThan(Number(initialProgress));
  });

  test('should complete generation and display results', async () => {
    await setupAndGenerate(page);

    // Wait for generation to complete (with extended timeout)
    await expect(page.locator('[data-testid="generation-complete"]')).toBeVisible({ timeout: 120000 });

    // Verify results are displayed
    await expect(page.locator('[data-testid="generated-vocals-player"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-lyrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible();
  });

  test('should display generated lyrics with proper formatting', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    const lyricsPanel = page.locator('[data-testid="generated-lyrics"]');

    // Verify lyrics structure
    await expect(lyricsPanel).toContainText(/verse|chorus|bridge/i);

    // Check for proper line breaks
    const lyricsText = await lyricsPanel.textContent();
    expect(lyricsText?.split('\n').length).toBeGreaterThan(4); // Multiple lines
  });

  test('should verify lyrics quality metrics', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Check quality indicators
    await expect(page.locator('[data-testid="lyrics-quality-score"]')).toBeVisible();

    const qualityScore = await page.locator('[data-testid="lyrics-quality-score"]').textContent();
    const score = parseFloat(qualityScore || '0');

    // Quality score should be reasonable (0-100 scale)
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should verify audio output quality', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Check audio quality info
    await expect(page.locator('[data-testid="audio-quality-info"]')).toBeVisible();

    const qualityInfo = await page.locator('[data-testid="audio-quality-info"]').textContent();

    // Verify sample rate and bitrate
    expect(qualityInfo).toMatch(/44100|48000/); // Sample rate in Hz
    expect(qualityInfo).toMatch(/stereo|mono/i); // Channel info
  });

  test('should play generated vocals', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    const playButton = page.locator('[data-testid="play-vocals-button"]');
    await playButton.click();

    // Verify playback started
    await expect(page.locator('[data-testid="playback-indicator"]')).toBeVisible();
    await expect(playButton).toHaveAttribute('data-playing', 'true');

    // Check waveform animation
    await expect(page.locator('[data-testid="waveform-animation"]')).toHaveClass(/playing/);
  });

  test('should download generated vocals', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.wav$|\.mp3$/);
  });

  test('should allow regeneration with different parameters', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Click regenerate button
    await page.locator('[data-testid="regenerate-button"]').click();

    // Change parameters
    await page.locator('[data-testid="mood-selector"]').click();
    await page.locator('[data-testid="mood-option-calm"]').click();

    // Generate again
    await page.locator('[data-testid="generate-vocals-button"]').click();

    // Verify new generation started
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle generation errors gracefully', async () => {
    // Mock API error
    await page.route('**/api/v1/melody-vocals/convert', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Generation service unavailable' })
      });
    });

    await setupAndGenerate(page);

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/error|failed/i);

    // Retry button should be available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle file size validation errors', async () => {
    // Create large file (> 50MB)
    const largeFile = {
      name: 'large-melody.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.alloc(51 * 1024 * 1024), // 51MB
    };

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="melody-upload-zone"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(largeFile);

    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/size.*exceeds|too.*large/i);
  });

  test('should handle audio duration validation errors', async () => {
    // Mock API response for duration too long
    await page.route('**/api/v1/melody-vocals/convert', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Audio validation failed',
          errors: ['Audio duration 360s exceeds maximum of 300s']
        })
      });
    });

    await setupAndGenerate(page);

    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/duration.*exceeds/i);
  });

  test('should handle quota exceeded errors', async () => {
    // Mock quota exceeded response
    await page.route('**/api/v1/melody-vocals/convert', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({
          success: false,
          error: 'Quota exceeded',
          quota: {
            dailyUsed: 10,
            dailyLimit: 10,
            monthlyUsed: 50,
            monthlyLimit: 100,
          }
        })
      });
    });

    await setupAndGenerate(page);

    // Verify quota error message
    await expect(page.locator('[data-testid="quota-error"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="quota-error"]')).toContainText(/quota.*exceeded/i);

    // Should show upgrade option
    await expect(page.locator('[data-testid="upgrade-quota-button"]')).toBeVisible();
  });

  test('should handle service unavailable errors with retry', async () => {
    let attemptCount = 0;

    await page.route('**/api/v1/melody-vocals/convert', route => {
      attemptCount++;

      if (attemptCount < 3) {
        // First two attempts fail
        route.fulfill({
          status: 503,
          body: JSON.stringify({ success: false, error: 'Service temporarily unavailable' })
        });
      } else {
        // Third attempt succeeds
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            jobId: 'test-job-123',
            message: 'Conversion job submitted successfully'
          })
        });
      }
    });

    await setupAndGenerate(page);

    // Should show retrying message
    await expect(page.locator('[data-testid="retry-message"]')).toBeVisible({ timeout: 5000 });

    // Eventually should succeed
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible({ timeout: 15000 });
  });

  test('should validate lyrics quality after generation', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    const lyrics = await page.locator('[data-testid="generated-lyrics"]').textContent();

    // Check lyrics aren't empty
    expect(lyrics).toBeTruthy();
    expect(lyrics!.length).toBeGreaterThan(50);

    // Check for no excessive repeated characters (gibberish detection)
    const hasGibberish = /(.)\1{10,}/.test(lyrics!);
    expect(hasGibberish).toBe(false);

    // Check lyrics have some structure
    const hasLines = lyrics!.split('\n').length > 3;
    expect(hasLines).toBe(true);
  });

  test('should display quality warnings if present', async () => {
    // Mock response with warnings
    await page.route('**/api/v1/melody-vocals/status/*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          job: {
            status: 'completed',
            progress: 100,
            result: {
              audioUrl: 'https://example.com/audio.wav',
              lyrics: 'Test lyrics',
              warnings: [
                'Sample rate below recommended 44100Hz',
                'Audio is mono. Stereo recommended.'
              ]
            }
          }
        })
      });
    });

    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Should display warnings
    await expect(page.locator('[data-testid="quality-warnings"]')).toBeVisible();
    await expect(page.locator('[data-testid="quality-warning-item"]')).toHaveCount(2);
  });

  test('should handle network timeout errors', async () => {
    // Mock timeout
    await page.route('**/api/v1/melody-vocals/convert', route => {
      // Never respond to simulate timeout
      setTimeout(() => {
        route.abort('timedout');
      }, 5000);
    });

    await setupAndGenerate(page);

    // Should show timeout error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/timeout|took too long/i);
  });

  test('should track and display processing progress accurately', async () => {
    const progressUpdates: number[] = [];

    // Monitor progress updates
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const data = JSON.parse(event.payload.toString());
          if (data.type === 'melody-vocals:progress') {
            progressUpdates.push(data.percent);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    });

    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Verify progress increased monotonically
    for (let i = 1; i < progressUpdates.length; i++) {
      expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
    }

    // Verify reached 100%
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });

  test('should allow rating and feedback submission', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Give 4-star rating
    await page.locator('[data-testid="rating-star-4"]').click();

    // Add feedback
    await page.locator('[data-testid="feedback-input"]').fill('Great quality vocals!');

    // Submit
    await page.locator('[data-testid="submit-feedback-button"]').click();

    // Verify success
    await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
  });

  test('should handle circuit breaker open state', async () => {
    // Mock circuit breaker open
    await page.route('**/api/v1/melody-vocals/convert', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({
          success: false,
          error: 'Circuit breaker is OPEN. Service unavailable. Try again in 45s'
        })
      });
    });

    await setupAndGenerate(page);

    // Should show circuit breaker message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/circuit.*breaker|service.*unavailable/i);

    // Should show countdown
    await expect(page.locator('[data-testid="retry-countdown"]')).toBeVisible();
  });

  test('should show estimated time for generation', async () => {
    await setupAndGenerate(page);

    // Check for time estimate
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible({ timeout: 5000 });

    const estimatedTime = await page.locator('[data-testid="estimated-time"]').textContent();
    expect(estimatedTime).toMatch(/\d+\s*(seconds?|minutes?)/i);
  });

  test('should cancel generation in progress', async () => {
    await setupAndGenerate(page);

    // Wait for generation to start
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible({ timeout: 5000 });

    // Cancel generation
    await page.locator('[data-testid="cancel-generation-button"]').click();

    // Confirm cancellation
    await page.locator('[data-testid="confirm-cancel-button"]').click();

    // Verify generation cancelled
    await expect(page.locator('[data-testid="generation-cancelled-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="generation-progress"]')).not.toBeVisible();
  });

  test('should save generated vocals to library', async () => {
    await setupAndGenerate(page);
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });

    // Save to library
    await page.locator('[data-testid="save-to-library-button"]').click();

    // Add title
    await page.locator('[data-testid="track-title-input"]').fill('My Generated Track');

    // Confirm save
    await page.locator('[data-testid="confirm-save-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();

    // Navigate to library and verify
    await page.goto('/library');
    await expect(page.locator('[data-testid="track-item"]').filter({ hasText: 'My Generated Track' })).toBeVisible();
  });
});

/**
 * Helper function to set up and start generation
 */
async function setupAndGenerate(page: Page) {
  // Upload file
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('[data-testid="melody-upload-zone"]').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test-melody.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('audio data'),
  });

  // Set parameters
  await page.locator('[data-testid="prompt-input"]').fill('Create an inspiring song about dreams');
  await page.locator('[data-testid="genre-selector"]').click();
  await page.locator('[data-testid="genre-option-pop"]').click();
  await page.locator('[data-testid="mood-selector"]').click();
  await page.locator('[data-testid="mood-option-happy"]').click();

  // Start generation
  await page.locator('[data-testid="generate-vocals-button"]').click();
}
