import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * Freestyle Workflow E2E Tests
 *
 * Tests the complete freestyle recording workflow including:
 * - Voice commands (start, stop, pause)
 * - Beat playback toggle
 * - Live transcription
 * - Lyrics organization
 * - Audio recording quality
 */

test.describe('Freestyle Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);

    // Navigate to freestyle page
    await page.goto('/freestyle');
    await page.waitForLoadState('networkidle');

    // Wait for page to be ready
    await expect(page.locator('[data-testid="freestyle-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load freestyle page with all controls', async () => {
    // Verify main components are visible
    await expect(page.locator('[data-testid="record-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="beat-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="waveform-display"]')).toBeVisible();
  });

  test('should enable voice commands and respond to "start recording"', async () => {
    // Enable voice commands
    await page.locator('[data-testid="enable-voice-commands"]').click();
    await expect(page.locator('[data-testid="voice-commands-status"]')).toContainText('Active');

    // Simulate voice command using input (since actual speech recognition requires real audio)
    await page.evaluate(() => {
      // Trigger voice command event
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'start recording' }
      }));
    });

    // Wait for recording to start
    await page.waitForTimeout(500);

    // Verify recording indicator is active
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="recording-indicator"]')).toHaveClass(/recording-active/);
  });

  test('should respond to "stop recording" voice command', async () => {
    // Start recording first
    await page.locator('[data-testid="record-button"]').click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();

    // Enable voice commands
    await page.locator('[data-testid="enable-voice-commands"]').click();

    // Simulate stop command
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'stop recording' }
      }));
    });

    await page.waitForTimeout(500);

    // Verify recording stopped
    await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
  });

  test('should respond to "pause" voice command', async () => {
    // Start recording
    await page.locator('[data-testid="record-button"]').click();
    await page.locator('[data-testid="enable-voice-commands"]').click();

    // Pause recording
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'pause' }
      }));
    });

    await page.waitForTimeout(500);

    // Verify paused state
    await expect(page.locator('[data-testid="pause-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="record-button"]')).toHaveAttribute('data-state', 'paused');
  });

  test('should toggle beat playback on and off', async () => {
    const beatToggle = page.locator('[data-testid="beat-toggle"]');

    // Initially should be off
    await expect(beatToggle).not.toBeChecked();

    // Turn on beat
    await beatToggle.click();
    await expect(beatToggle).toBeChecked();
    await expect(page.locator('[data-testid="beat-player"]')).toBeVisible();

    // Verify audio context is playing
    const isPlaying = await page.evaluate(() => {
      return window.audioContext?.state === 'running';
    });
    expect(isPlaying).toBeTruthy();

    // Turn off beat
    await beatToggle.click();
    await expect(beatToggle).not.toBeChecked();
  });

  test('should display live transcription during recording', async () => {
    // Start recording
    await page.locator('[data-testid="record-button"]').click();

    // Simulate transcription data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('transcription-update', {
        detail: {
          text: 'This is a test freestyle rap line',
          confidence: 0.95,
          timestamp: Date.now()
        }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify transcription appears
    const transcriptionPanel = page.locator('[data-testid="transcription-panel"]');
    await expect(transcriptionPanel).toBeVisible();
    await expect(transcriptionPanel).toContainText('This is a test freestyle rap line');
  });

  test('should organize lyrics into verses and chorus', async () => {
    // Add multiple lines to trigger organization
    const lyrics = [
      'First line of verse one',
      'Second line of verse one',
      'Third line of verse one',
      'Fourth line of verse one',
      'Chorus line one',
      'Chorus line two',
    ];

    for (const line of lyrics) {
      await page.evaluate((lyric) => {
        window.dispatchEvent(new CustomEvent('transcription-update', {
          detail: { text: lyric, confidence: 0.9 }
        }));
      }, line);
      await page.waitForTimeout(200);
    }

    // Check for organized structure
    await expect(page.locator('[data-testid="lyrics-section-verse"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-section-chorus"]')).toBeVisible();

    // Verify lines are in correct sections
    const verseSection = page.locator('[data-testid="lyrics-section-verse"]');
    await expect(verseSection).toContainText('First line of verse one');

    const chorusSection = page.locator('[data-testid="lyrics-section-chorus"]');
    await expect(chorusSection).toContainText('Chorus line one');
  });

  test('should record audio with acceptable quality', async () => {
    // Start recording
    await page.locator('[data-testid="record-button"]').click();

    // Simulate audio input
    await page.evaluate(() => {
      // Create mock audio stream
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const destination = audioContext.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();

      // Dispatch audio data event
      window.dispatchEvent(new CustomEvent('audio-input', {
        detail: {
          stream: destination.stream,
          sampleRate: 48000,
          channels: 2
        }
      }));
    });

    // Record for 3 seconds
    await page.waitForTimeout(3000);

    // Stop recording
    await page.locator('[data-testid="stop-button"]').click();

    // Wait for processing
    await page.waitForTimeout(1000);

    // Verify audio quality metrics
    const qualityInfo = await page.locator('[data-testid="audio-quality-info"]').textContent();
    expect(qualityInfo).toContain('48000 Hz'); // Sample rate
    expect(qualityInfo).toMatch(/Stereo|2 channels/); // Channel count

    // Check recording duration
    const duration = await page.locator('[data-testid="recording-duration"]').textContent();
    expect(duration).toMatch(/0:0[3-4]/); // Should be ~3 seconds
  });

  test('should save freestyle session with metadata', async () => {
    // Record a session
    await page.locator('[data-testid="record-button"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="stop-button"]').click();

    // Add session name
    await page.locator('[data-testid="session-name-input"]').fill('My Freestyle Session');

    // Save session
    await page.locator('[data-testid="save-session-button"]').click();

    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="save-success-message"]')).toContainText('Session saved successfully');

    // Verify session appears in list
    await page.goto('/sessions');
    await expect(page.locator('[data-testid="session-item"]').filter({ hasText: 'My Freestyle Session' })).toBeVisible();
  });

  test('should handle beat tempo changes', async () => {
    // Enable beat
    await page.locator('[data-testid="beat-toggle"]').click();

    // Get initial tempo
    const tempoSlider = page.locator('[data-testid="tempo-slider"]');
    await expect(tempoSlider).toBeVisible();

    // Change tempo to 140 BPM
    await tempoSlider.fill('140');

    // Verify tempo updated
    const tempoDisplay = page.locator('[data-testid="tempo-display"]');
    await expect(tempoDisplay).toContainText('140 BPM');

    // Start recording with new tempo
    await page.locator('[data-testid="record-button"]').click();
    await page.waitForTimeout(1000);

    // Verify beat is playing at correct tempo
    const currentTempo = await page.evaluate(() => {
      return (window as any).beatEngine?.tempo || 0;
    });
    expect(currentTempo).toBe(140);
  });

  test('should export freestyle recording', async () => {
    // Create a recording
    await page.locator('[data-testid="record-button"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="stop-button"]').click();

    // Open export dialog
    await page.locator('[data-testid="export-button"]').click();
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();

    // Select format
    await page.locator('[data-testid="export-format-wav"]').click();

    // Start export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="confirm-export-button"]').click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.wav$/);
  });

  test('should handle errors gracefully - microphone permission denied', async () => {
    // Create new page without microphone permission
    const restrictedPage = await page.context().newPage();
    await restrictedPage.goto('/freestyle');

    // Try to start recording
    await restrictedPage.locator('[data-testid="record-button"]').click();

    // Verify error message
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toContainText(/microphone.*permission/i);

    await restrictedPage.close();
  });

  test('should clear lyrics and start fresh session', async () => {
    // Add some lyrics
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('transcription-update', {
        detail: { text: 'Test lyrics line 1' }
      }));
    });

    await expect(page.locator('[data-testid="lyrics-panel"]')).toContainText('Test lyrics line 1');

    // Clear lyrics
    await page.locator('[data-testid="clear-lyrics-button"]').click();

    // Confirm clear action
    await page.locator('[data-testid="confirm-clear-button"]').click();

    // Verify lyrics cleared
    const lyricsContent = await page.locator('[data-testid="lyrics-panel"]').textContent();
    expect(lyricsContent).not.toContain('Test lyrics line 1');
  });

  test('should show recording timer during session', async () => {
    // Start recording
    await page.locator('[data-testid="record-button"]').click();

    // Verify timer is visible and updating
    const timer = page.locator('[data-testid="recording-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText('0:00');

    // Wait and check timer updated
    await page.waitForTimeout(2000);
    const timerText = await timer.textContent();
    expect(timerText).toMatch(/0:0[2-3]/);
  });

  test('should maintain beat sync during long recording', async () => {
    // Enable beat
    await page.locator('[data-testid="beat-toggle"]').click();
    await page.locator('[data-testid="tempo-slider"]').fill('120');

    // Start recording
    await page.locator('[data-testid="record-button"]').click();

    // Record for 10 seconds
    await page.waitForTimeout(10000);

    // Check beat sync accuracy
    const syncAccuracy = await page.evaluate(() => {
      return (window as any).beatEngine?.getSyncAccuracy() || 0;
    });

    // Should maintain >95% accuracy
    expect(syncAccuracy).toBeGreaterThan(0.95);

    await page.locator('[data-testid="stop-button"]').click();
  });
});
