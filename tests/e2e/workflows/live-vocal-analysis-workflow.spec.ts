import { test, expect, Page } from '@playwright/test';

/**
 * Live Vocal Analysis Workflow E2E Tests
 *
 * Tests the complete live vocal analysis workflow including:
 * - Starting real-time recording
 * - Verifying pitch detection
 * - Testing sharp/flat alerts
 * - Checking real-time feedback
 * - Verifying WebSocket connection
 */

test.describe('Live Vocal Analysis Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);

    // Navigate to live vocal analysis page
    await page.goto('/live-vocal-analysis');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="vocal-analysis-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load vocal analysis page with all controls', async () => {
    // Verify main components
    await expect(page.locator('[data-testid="start-analysis-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="pitch-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="reference-pitch-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="sensitivity-slider"]')).toBeVisible();
  });

  test('should start live vocal analysis', async () => {
    // Start analysis
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Verify analysis started
    await expect(page.locator('[data-testid="analysis-active-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-analysis-button"]')).toBeVisible();

    // Microphone indicator should be active
    await expect(page.locator('[data-testid="microphone-indicator"]')).toHaveClass(/active|recording/);
  });

  test('should display pitch in real-time', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate pitch data
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 440, // A4
          note: 'A4',
          cents: 0,
          confidence: 0.95
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify pitch display
    const pitchDisplay = page.locator('[data-testid="current-pitch"]');
    await expect(pitchDisplay).toBeVisible();
    await expect(pitchDisplay).toContainText('A4');
  });

  test('should detect sharp pitch and show alert', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate sharp pitch (+20 cents)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 445,
          note: 'A4',
          cents: +20,
          confidence: 0.92
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify sharp alert
    await expect(page.locator('[data-testid="pitch-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="pitch-alert"]')).toContainText(/sharp|\+/i);
    await expect(page.locator('[data-testid="pitch-alert"]')).toHaveClass(/sharp|positive/);

    // Cents display should show +20
    await expect(page.locator('[data-testid="cents-display"]')).toContainText('+20');
  });

  test('should detect flat pitch and show alert', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate flat pitch (-15 cents)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 435,
          note: 'A4',
          cents: -15,
          confidence: 0.90
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify flat alert
    await expect(page.locator('[data-testid="pitch-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="pitch-alert"]')).toContainText(/flat|\-/i);
    await expect(page.locator('[data-testid="pitch-alert"]')).toHaveClass(/flat|negative/);

    // Cents display should show -15
    await expect(page.locator('[data-testid="cents-display"]')).toContainText('-15');
  });

  test('should show in-tune indicator when pitch is accurate', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate perfectly in-tune pitch
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 440,
          note: 'A4',
          cents: 0,
          confidence: 0.98
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify in-tune indicator
    await expect(page.locator('[data-testid="in-tune-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="in-tune-indicator"]')).toHaveClass(/in-tune|perfect/);
    await expect(page.locator('[data-testid="cents-display"]')).toContainText('0');
  });

  test('should display visual pitch meter', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Verify pitch meter is visible
    const pitchMeter = page.locator('[data-testid="pitch-meter"]');
    await expect(pitchMeter).toBeVisible();

    // Simulate pitch and check meter updates
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: { frequency: 440, note: 'A4', cents: +10, confidence: 0.95 }
      }));
    });

    await page.waitForTimeout(500);

    // Meter needle should be visible and positioned
    const needle = page.locator('[data-testid="pitch-meter-needle"]');
    await expect(needle).toBeVisible();
  });

  test('should select reference pitch (A4 = 440Hz default)', async () => {
    // Check default reference
    await expect(page.locator('[data-testid="reference-pitch-selector"]')).toContainText('440');

    // Change reference to 442Hz
    await page.locator('[data-testid="reference-pitch-selector"]').click();
    await page.locator('[data-testid="reference-option-442"]').click();

    // Verify change
    await expect(page.locator('[data-testid="reference-pitch-selector"]')).toContainText('442');
  });

  test('should adjust sensitivity slider', async () => {
    const sensitivitySlider = page.locator('[data-testid="sensitivity-slider"]');

    // Check initial value
    const initialValue = await sensitivitySlider.inputValue();
    expect(Number(initialValue)).toBeGreaterThan(0);

    // Adjust sensitivity
    await sensitivitySlider.fill('75');

    // Verify updated
    const newValue = await sensitivitySlider.inputValue();
    expect(newValue).toBe('75');

    // Display should update
    await expect(page.locator('[data-testid="sensitivity-display"]')).toContainText('75');
  });

  test('should show confidence level of pitch detection', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate pitch with high confidence
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 440,
          note: 'A4',
          cents: 0,
          confidence: 0.95
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify confidence display
    const confidence = page.locator('[data-testid="confidence-level"]');
    await expect(confidence).toBeVisible();
    await expect(confidence).toContainText('95%');

    // High confidence should have positive indicator
    await expect(confidence).toHaveClass(/high|good/);
  });

  test('should show low confidence warning', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate pitch with low confidence
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: {
          frequency: 440,
          note: 'A4',
          cents: 0,
          confidence: 0.45
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify low confidence warning
    await expect(page.locator('[data-testid="confidence-level"]')).toContainText('45%');
    await expect(page.locator('[data-testid="confidence-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-warning"]')).toHaveClass(/low|warning/);
  });

  test('should establish WebSocket connection for real-time data', async () => {
    // Monitor WebSocket connections
    const wsPromise = page.waitForEvent('websocket');

    await page.locator('[data-testid="start-analysis-button"]').click();

    const ws = await wsPromise;
    expect(ws.url()).toMatch(/ws:\/\/|wss:\/\//);

    // Verify connection status indicator
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/connected/i);
  });

  test('should handle WebSocket disconnection gracefully', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Wait for connection
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/connected/i);

    // Simulate disconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-disconnect'));
    });

    // Verify disconnection handled
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/disconnected|reconnecting/i);
    await expect(page.locator('[data-testid="reconnect-button"]')).toBeVisible();
  });

  test('should display frequency spectrum in real-time', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Verify spectrum display
    const spectrum = page.locator('[data-testid="frequency-spectrum"]');
    await expect(spectrum).toBeVisible();
    await expect(spectrum.locator('canvas')).toBeVisible();

    // Should update in real-time
    await page.waitForTimeout(1000);
    const canvasDataBefore = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="frequency-spectrum"] canvas') as HTMLCanvasElement;
      return canvas?.toDataURL();
    });

    await page.waitForTimeout(1000);
    const canvasDataAfter = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="frequency-spectrum"] canvas') as HTMLCanvasElement;
      return canvas?.toDataURL();
    });

    // Canvas should be updating (data should change)
    expect(canvasDataBefore).not.toBe(canvasDataAfter);
  });

  test('should show pitch history graph', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate multiple pitch readings
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4'];
    for (const note of notes) {
      await page.evaluate((n) => {
        window.dispatchEvent(new CustomEvent('pitch-detected', {
          detail: { frequency: 440, note: n, cents: 0, confidence: 0.9 }
        }));
      }, note);
      await page.waitForTimeout(200);
    }

    // Verify pitch history
    const history = page.locator('[data-testid="pitch-history"]');
    await expect(history).toBeVisible();

    // Should show graph with multiple points
    const historyPoints = await page.locator('[data-testid="pitch-history-point"]').count();
    expect(historyPoints).toBeGreaterThan(0);
  });

  test('should provide real-time vocal coaching feedback', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate consistently sharp singing
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('pitch-detected', {
          detail: { frequency: 445, note: 'A4', cents: +20, confidence: 0.9 }
        }));
      });
      await page.waitForTimeout(200);
    }

    // Should show coaching feedback
    await expect(page.locator('[data-testid="coaching-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="coaching-feedback"]')).toContainText(/lower|flat|down/i);
  });

  test('should stop vocal analysis', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();
    await expect(page.locator('[data-testid="analysis-active-indicator"]')).toBeVisible();

    // Stop analysis
    await page.locator('[data-testid="stop-analysis-button"]').click();

    // Verify stopped
    await expect(page.locator('[data-testid="analysis-active-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="start-analysis-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="microphone-indicator"]')).not.toHaveClass(/active|recording/);
  });

  test('should save analysis session data', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate some vocal data
    await page.evaluate(() => {
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new CustomEvent('pitch-detected', {
          detail: { frequency: 440 + i, note: 'A4', cents: i - 5, confidence: 0.9 }
        }));
      }
    });

    await page.waitForTimeout(2000);

    // Stop and save
    await page.locator('[data-testid="stop-analysis-button"]').click();
    await page.locator('[data-testid="save-session-button"]').click();

    // Enter session name
    await page.locator('[data-testid="session-name-input"]').fill('Practice Session 1');
    await page.locator('[data-testid="confirm-save-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
  });

  test('should display performance statistics', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate analysis session
    await page.waitForTimeout(5000);

    await page.locator('[data-testid="stop-analysis-button"]').click();

    // Open stats
    await page.locator('[data-testid="show-stats-button"]').click();

    // Verify statistics
    await expect(page.locator('[data-testid="stat-accuracy"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-average-cents-off"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-time-in-tune"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-pitch-range"]')).toBeVisible();
  });

  test('should adjust alert threshold', async () => {
    // Open settings
    await page.locator('[data-testid="settings-button"]').click();

    // Adjust alert threshold
    const thresholdSlider = page.locator('[data-testid="alert-threshold-slider"]');
    await thresholdSlider.fill('15'); // Alert at ±15 cents instead of default

    // Save settings
    await page.locator('[data-testid="save-settings-button"]').click();

    // Start analysis
    await page.locator('[data-testid="start-analysis-button"]').click();

    // Simulate +14 cents (should NOT alert with 15 cent threshold)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: { frequency: 442, note: 'A4', cents: +14, confidence: 0.9 }
      }));
    });

    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="pitch-alert"]')).not.toBeVisible();

    // Simulate +16 cents (SHOULD alert)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pitch-detected', {
        detail: { frequency: 443, note: 'A4', cents: +16, confidence: 0.9 }
      }));
    });

    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="pitch-alert"]')).toBeVisible();
  });

  test('should handle microphone permission denied', async () => {
    // Create new page without microphone permission
    const restrictedPage = await page.context().newPage();
    await restrictedPage.goto('/live-vocal-analysis');

    // Try to start analysis
    await restrictedPage.locator('[data-testid="start-analysis-button"]').click();

    // Verify error
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 3000 });
    await expect(restrictedPage.locator('[data-testid="error-message"]')).toContainText(/microphone.*permission/i);

    await restrictedPage.close();
  });

  test('should toggle dark mode for better visibility', async () => {
    // Toggle dark mode
    await page.locator('[data-testid="dark-mode-toggle"]').click();

    // Verify dark mode applied
    const container = page.locator('[data-testid="vocal-analysis-container"]');
    await expect(container).toHaveClass(/dark|dark-mode/);
  });

  test('should export session data as CSV', async () => {
    await page.locator('[data-testid="start-analysis-button"]').click();
    await page.waitForTimeout(3000);
    await page.locator('[data-testid="stop-analysis-button"]').click();

    // Export data
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-csv-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
