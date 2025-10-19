import { test, expect, Page } from '@playwright/test';

/**
 * Voice Commands Workflow E2E Tests
 *
 * Tests the complete voice commands workflow including:
 * - Enabling voice commands
 * - Testing each command: "start recording", "stop", "play", "pause", "save project", "generate beat"
 * - Verifying command execution
 * - Testing command accuracy
 * - Testing command customization
 */

test.describe('Voice Commands Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);

    // Navigate to main DAW page with voice commands
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="studio-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should have voice commands toggle available', async () => {
    // Verify voice commands control
    await expect(page.locator('[data-testid="voice-commands-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="voice-commands-status"]')).toBeVisible();
  });

  test('should enable voice commands', async () => {
    // Initially disabled
    await expect(page.locator('[data-testid="voice-commands-status"]')).toContainText(/inactive|disabled/i);

    // Enable voice commands
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify enabled
    await expect(page.locator('[data-testid="voice-commands-status"]')).toContainText(/active|enabled|listening/i);
    await expect(page.locator('[data-testid="microphone-indicator"]')).toBeVisible();
  });

  test('should respond to "start recording" command', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Simulate voice command
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'start recording', confidence: 0.95 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify recording started
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="record-button"]')).toHaveAttribute('data-recording', 'true');
  });

  test('should respond to "stop recording" command', async () => {
    // Start recording first
    await page.locator('[data-testid="record-button"]').click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();

    // Enable voice commands
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Stop via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'stop recording', confidence: 0.93 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify stopped
    await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="record-button"]')).toHaveAttribute('data-recording', 'false');
  });

  test('should respond to "stop" command', async () => {
    // Start playback
    await page.locator('[data-testid="play-button"]').click();
    await expect(page.locator('[data-testid="playback-indicator"]')).toBeVisible();

    // Enable voice commands
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Stop via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'stop', confidence: 0.98 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify stopped
    await expect(page.locator('[data-testid="playback-indicator"]')).not.toBeVisible();
  });

  test('should respond to "play" command', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Play via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'play', confidence: 0.96 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify playing
    await expect(page.locator('[data-testid="playback-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'true');
  });

  test('should respond to "pause" command', async () => {
    // Start playback
    await page.locator('[data-testid="play-button"]').click();
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Pause via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'pause', confidence: 0.94 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify paused
    await expect(page.locator('[data-testid="pause-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'false');
  });

  test('should respond to "save project" command', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Save via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'save project', confidence: 0.91 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify save dialog or save action
    const saveDialog = page.locator('[data-testid="save-project-dialog"]');
    const saveSuccess = page.locator('[data-testid="save-success-message"]');

    // Either dialog opens or save completes
    const dialogVisible = await saveDialog.isVisible();
    const successVisible = await saveSuccess.isVisible();

    expect(dialogVisible || successVisible).toBeTruthy();
  });

  test('should respond to "generate beat" command', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Generate beat via voice
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'generate beat', confidence: 0.89 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify beat generation started
    await expect(page.locator('[data-testid="beat-generation-dialog"]')).toBeVisible();
  });

  test('should display recognized command feedback', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Send command
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'play', confidence: 0.95 }
      }));
    });

    // Verify feedback shown
    await expect(page.locator('[data-testid="command-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-feedback"]')).toContainText('play');
  });

  test('should show confidence level for commands', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Send command with specific confidence
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'stop', confidence: 0.87 }
      }));
    });

    // Verify confidence displayed
    await expect(page.locator('[data-testid="command-confidence"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-confidence"]')).toContainText('87%');
  });

  test('should reject low confidence commands', async () => {
    // Set confidence threshold high in settings
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();
    await page.locator('[data-testid="confidence-threshold-slider"]').fill('90');
    await page.locator('[data-testid="save-settings-button"]').click();

    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Send low confidence command (below threshold)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'play', confidence: 0.75 }
      }));
    });

    await page.waitForTimeout(500);

    // Command should be rejected
    await expect(page.locator('[data-testid="command-rejected-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="playback-indicator"]')).not.toBeVisible();
  });

  test('should show available commands list', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Open commands list
    await page.locator('[data-testid="show-commands-button"]').click();

    // Verify all commands listed
    const expectedCommands = [
      'start recording',
      'stop recording',
      'play',
      'pause',
      'stop',
      'save project',
      'generate beat',
    ];

    for (const command of expectedCommands) {
      await expect(page.locator('[data-testid="command-item"]').filter({ hasText: command })).toBeVisible();
    }
  });

  test('should customize voice commands', async () => {
    // Open voice commands settings
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();

    // Customize "play" command
    await page.locator('[data-testid="customize-command-play"]').click();
    await page.locator('[data-testid="add-alias-input"]').fill('begin playback');
    await page.locator('[data-testid="add-alias-button"]').click();

    // Save
    await page.locator('[data-testid="save-settings-button"]').click();

    // Enable voice commands
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Use custom command
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'begin playback', confidence: 0.95 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify it works
    await expect(page.locator('[data-testid="playback-indicator"]')).toBeVisible();
  });

  test('should test command accuracy with multiple commands', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    const commands = [
      { command: 'play', expectedState: 'playing' },
      { command: 'pause', expectedState: 'paused' },
      { command: 'stop', expectedState: 'stopped' },
    ];

    for (const cmd of commands) {
      await page.evaluate((c) => {
        window.dispatchEvent(new CustomEvent('voice-command', {
          detail: { command: c.command, confidence: 0.95 }
        }));
      }, cmd);

      await page.waitForTimeout(1000);

      // Verify state changed appropriately
      const state = await page.evaluate(() => {
        return (window as any).transportState || 'unknown';
      });

      expect(state).toBe(cmd.expectedState);
    }
  });

  test('should show command history', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Execute several commands
    const commands = ['play', 'pause', 'stop'];

    for (const cmd of commands) {
      await page.evaluate((c) => {
        window.dispatchEvent(new CustomEvent('voice-command', {
          detail: { command: c, confidence: 0.9 }
        }));
      }, cmd);
      await page.waitForTimeout(500);
    }

    // Open history
    await page.locator('[data-testid="command-history-button"]').click();

    // Verify commands in history
    for (const cmd of commands) {
      await expect(page.locator('[data-testid="history-item"]').filter({ hasText: cmd })).toBeVisible();
    }
  });

  test('should disable voice commands', async () => {
    // Enable first
    await page.locator('[data-testid="voice-commands-toggle"]').click();
    await expect(page.locator('[data-testid="voice-commands-status"]')).toContainText(/active/i);

    // Disable
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify disabled
    await expect(page.locator('[data-testid="voice-commands-status"]')).toContainText(/inactive|disabled/i);
    await expect(page.locator('[data-testid="microphone-indicator"]')).not.toBeVisible();
  });

  test('should handle microphone permission denied', async () => {
    // Create new page without microphone permission
    const restrictedPage = await page.context().newPage();
    await restrictedPage.goto('/studio');

    // Try to enable voice commands
    await restrictedPage.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify error
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toContainText(/microphone.*permission/i);

    await restrictedPage.close();
  });

  test('should handle unrecognized commands', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Send unrecognized command
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'do something random', confidence: 0.95 }
      }));
    });

    await page.waitForTimeout(500);

    // Verify unrecognized message
    await expect(page.locator('[data-testid="unrecognized-command-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="unrecognized-command-message"]')).toContainText(/not.*recognized|unknown/i);
  });

  test('should suggest similar commands for typos', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Send command with typo
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('voice-command', {
        detail: { command: 'ply', confidence: 0.85 } // typo of "play"
      }));
    });

    await page.waitForTimeout(500);

    // Verify suggestion
    await expect(page.locator('[data-testid="command-suggestion"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-suggestion"]')).toContainText(/did.*you.*mean.*play/i);
  });

  test('should adjust microphone sensitivity', async () => {
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();

    // Adjust sensitivity
    const sensitivitySlider = page.locator('[data-testid="mic-sensitivity-slider"]');
    await sensitivitySlider.fill('75');

    // Verify updated
    const sensitivity = await sensitivitySlider.inputValue();
    expect(sensitivity).toBe('75');

    await page.locator('[data-testid="save-settings-button"]').click();
  });

  test('should enable wake word activation', async () => {
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();

    // Enable wake word
    await page.locator('[data-testid="enable-wake-word-toggle"]').click();

    // Set wake word
    await page.locator('[data-testid="wake-word-input"]').fill('Hey DAWG');

    // Save
    await page.locator('[data-testid="save-settings-button"]').click();

    // Enable voice commands
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify wake word required
    await expect(page.locator('[data-testid="wake-word-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="wake-word-status"]')).toContainText('Hey DAWG');
  });

  test('should toggle continuous listening mode', async () => {
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();

    // Enable continuous listening
    await page.locator('[data-testid="continuous-listening-toggle"]').click();

    // Save and enable
    await page.locator('[data-testid="save-settings-button"]').click();
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify always listening
    await expect(page.locator('[data-testid="listening-mode-indicator"]')).toContainText(/continuous|always/i);
  });

  test('should show visual feedback when listening', async () => {
    await page.locator('[data-testid="voice-commands-toggle"]').click();

    // Verify visual indicators
    await expect(page.locator('[data-testid="listening-animation"]')).toBeVisible();
    await expect(page.locator('[data-testid="audio-level-indicator"]')).toBeVisible();

    // Audio level should be animated
    const initialLevel = await page.locator('[data-testid="audio-level-bar"]').getAttribute('style');
    await page.waitForTimeout(500);
    const updatedLevel = await page.locator('[data-testid="audio-level-bar"]').getAttribute('style');

    // Levels should be changing (animation)
    expect(initialLevel).not.toBe(updatedLevel);
  });

  test('should export voice commands configuration', async () => {
    // Configure some custom commands
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();
    await page.locator('[data-testid="customize-command-play"]').click();
    await page.locator('[data-testid="add-alias-input"]').fill('start');
    await page.locator('[data-testid="add-alias-button"]').click();
    await page.locator('[data-testid="save-settings-button"]').click();

    // Export configuration
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-commands-config-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/voice.*commands.*\.json$/);
  });

  test('should import voice commands configuration', async () => {
    const config = JSON.stringify({
      commands: {
        play: ['play', 'start playback'],
        stop: ['stop', 'halt'],
      },
      threshold: 0.85,
      wakeWord: 'Hey DAWG',
    });

    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="voice-commands-settings"]').click();

    // Import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="import-commands-config-button"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'commands-config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(config),
    });

    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
  });
});
