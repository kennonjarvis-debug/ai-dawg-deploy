import { Page, Locator } from '@playwright/test';

/**
 * Transport Bar Test Helpers
 *
 * Reusable helper functions for testing transport bar functionality
 */

export type TransportButton = 'play' | 'stop' | 'record' | 'loop' | 'skipBack' | 'skipForward';

export interface TransportButtonState {
  classes: string | null;
  ariaLabel: string | null;
  isEnabled: boolean;
  isActive: boolean;
  isVisible: boolean;
}

/**
 * Find a transport button by type
 */
export async function findTransportButton(
  page: Page,
  buttonType: TransportButton
): Promise<Locator | null> {
  const selectors: Record<TransportButton, string[]> = {
    play: [
      '[data-testid="play-button"]',
      'button[aria-label*="Play"]',
      'button[aria-label*="play"]',
      'button[title*="Play"]',
    ],
    stop: [
      '[data-testid="stop-button"]',
      'button[aria-label*="Stop"]',
      'button[aria-label*="stop"]',
      'button[title*="Stop"]',
    ],
    record: [
      '[data-testid="record-button"]',
      'button[aria-label*="Record"]',
      'button[aria-label*="record"]',
      'button[title*="Record"]',
    ],
    loop: [
      '[data-testid="loop-button"]',
      'button[aria-label*="Loop"]',
      'button[aria-label*="loop"]',
      'button[title*="Loop"]',
    ],
    skipBack: [
      'button[aria-label*="Skip Backward"]',
      'button[aria-label*="skip backward"]',
      'button[title*="Skip Backward"]',
    ],
    skipForward: [
      'button[aria-label*="Skip Forward"]',
      'button[aria-label*="skip forward"]',
      'button[title*="Skip Forward"]',
    ],
  };

  for (const selector of selectors[buttonType]) {
    const button = page.locator(selector).first();
    const isVisible = await button.isVisible().catch(() => false);
    if (isVisible) {
      return button;
    }
  }
  return null;
}

/**
 * Get the state of a transport button
 */
export async function getTransportButtonState(
  button: Locator
): Promise<TransportButtonState> {
  const classes = await button.getAttribute('class');
  const ariaLabel = await button.getAttribute('aria-label');
  const isEnabled = await button.isEnabled();
  const isVisible = await button.isVisible();

  const isActive =
    classes?.includes('active') ||
    classes?.includes('playing') ||
    classes?.includes('recording') ||
    false;

  return {
    classes,
    ariaLabel,
    isEnabled,
    isActive,
    isVisible,
  };
}

/**
 * Wait for a button to reach a specific state
 */
export async function waitForButtonState(
  button: Locator,
  expectedState: Partial<TransportButtonState>,
  timeout = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentState = await getTransportButtonState(button);

    let matches = true;
    if (expectedState.isEnabled !== undefined && currentState.isEnabled !== expectedState.isEnabled) {
      matches = false;
    }
    if (expectedState.isActive !== undefined && currentState.isActive !== expectedState.isActive) {
      matches = false;
    }
    if (expectedState.isVisible !== undefined && currentState.isVisible !== expectedState.isVisible) {
      matches = false;
    }
    if (expectedState.ariaLabel !== undefined && !currentState.ariaLabel?.includes(expectedState.ariaLabel)) {
      matches = false;
    }

    if (matches) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Get BPM display element
 */
export async function getBPMDisplay(page: Page): Promise<Locator | null> {
  const selectors = [
    '[data-testid="bpm-display"]',
    'input[aria-label*="BPM"]',
    'input[aria-label*="bpm"]',
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);
    if (isVisible) {
      return element;
    }
  }
  return null;
}

/**
 * Get time display element
 */
export async function getTimeDisplay(page: Page): Promise<Locator | null> {
  const selectors = [
    '[data-testid="time-display"]',
    '[data-testid="playback-time"]',
    '[aria-label*="time"]',
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);
    if (isVisible) {
      return element;
    }
  }
  return null;
}

/**
 * Setup DAW interface (login and open project)
 */
export async function setupDAW(page: Page): Promise<void> {
  console.log('Setting up DAW interface...');

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check for Quick Demo Login button
  const quickDemoButton = page.locator('button:has-text("Quick Demo Login")');
  const hasQuickDemo = await quickDemoButton.isVisible().catch(() => false);

  if (hasQuickDemo) {
    console.log('Clicking Quick Demo Login...');
    await quickDemoButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Open a demo project to access DAW
  const demoProject = page.locator('div:has-text("Demo Song")').first();
  const hasProject = await demoProject.isVisible().catch(() => false);

  if (hasProject) {
    console.log('Opening demo project...');
    await demoProject.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }

  console.log('DAW setup complete');
}

/**
 * Filter real console errors (exclude known demo mode errors)
 */
export function filterRealErrors(errors: string[]): string[] {
  return errors.filter(
    err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode') &&
      !err.includes('No tracks armed')
  );
}

/**
 * Check if transport bar is visible
 */
export async function isTransportBarVisible(page: Page): Promise<boolean> {
  const transportBar = page.locator('[data-testid="transport-bar"]').first();
  return await transportBar.isVisible().catch(() => false);
}

/**
 * Get all transport control elements
 */
export async function getTransportControls(page: Page) {
  return {
    transportBar: await isTransportBarVisible(page),
    playButton: await findTransportButton(page, 'play'),
    stopButton: await findTransportButton(page, 'stop'),
    recordButton: await findTransportButton(page, 'record'),
    loopButton: await findTransportButton(page, 'loop'),
    skipBackButton: await findTransportButton(page, 'skipBack'),
    skipForwardButton: await findTransportButton(page, 'skipForward'),
    bpmDisplay: await getBPMDisplay(page),
    timeDisplay: await getTimeDisplay(page),
  };
}

/**
 * Take a labeled screenshot
 */
export async function takeScreenshot(
  page: Page,
  label: string,
  fullPage = false
): Promise<void> {
  const timestamp = Date.now();
  const filename = `/tmp/transport-${label}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage });
  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Click button and wait for state change
 */
export async function clickAndWaitForState(
  button: Locator,
  expectedState: Partial<TransportButtonState>,
  timeout = 2000
): Promise<boolean> {
  await button.click();
  return await waitForButtonState(button, expectedState, timeout);
}

/**
 * Verify transport bar has all essential controls
 */
export async function verifyTransportBarComplete(page: Page): Promise<boolean> {
  const controls = await getTransportControls(page);

  return (
    controls.transportBar &&
    controls.playButton !== null &&
    controls.stopButton !== null &&
    controls.recordButton !== null
  );
}

/**
 * Parse time display value (e.g., "00:05" or "0:05.123")
 */
export function parseTimeDisplay(timeString: string | null): number {
  if (!timeString) return 0;

  const parts = timeString.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Wait for time display to update
 */
export async function waitForTimeUpdate(
  page: Page,
  initialTime: string | null,
  timeout = 5000
): Promise<boolean> {
  const timeDisplay = await getTimeDisplay(page);
  if (!timeDisplay) return false;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentTime = await timeDisplay.textContent();
    if (currentTime !== initialTime) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Find track arm buttons
 */
export async function findTrackArmButtons(page: Page): Promise<Locator[]> {
  const selectors = [
    'button[aria-label*="Arm"]',
    'button[aria-label*="arm"]',
    '[data-testid*="arm"]',
    '.track-arm',
  ];

  const buttons: Locator[] = [];

  for (const selector of selectors) {
    const elements = await page.locator(selector).all();
    for (const element of elements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        buttons.push(element);
      }
    }
  }

  return buttons;
}

/**
 * Arm a track for recording
 */
export async function armTrack(page: Page, trackIndex = 0): Promise<boolean> {
  const armButtons = await findTrackArmButtons(page);

  if (armButtons.length > trackIndex) {
    await armButtons[trackIndex].click();
    await page.waitForTimeout(500);
    return true;
  }

  return false;
}

/**
 * Check for recording indicator
 */
export async function hasRecordingIndicator(page: Page): Promise<boolean> {
  const indicators = [
    '.recording',
    '[class*="recording"]',
    '[data-recording="true"]',
    'button.animate-pulse',
  ];

  for (const selector of indicators) {
    const element = page.locator(selector).first();
    const exists = await element.isVisible().catch(() => false);
    if (exists) {
      return true;
    }
  }

  return false;
}

/**
 * Check for toast/warning message
 */
export async function hasWarningMessage(
  page: Page,
  messageText: string
): Promise<boolean> {
  const selectors = [
    `text="${messageText}"`,
    `[role="alert"]:has-text("${messageText}")`,
    `.toast:has-text("${messageText}")`,
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const exists = await element.isVisible().catch(() => false);
    if (exists) {
      return true;
    }
  }

  return false;
}

/**
 * Perform a complete recording cycle
 */
export async function performRecordingCycle(
  page: Page,
  duration = 2000
): Promise<boolean> {
  const recordButton = await findTransportButton(page, 'record');
  const stopButton = await findTransportButton(page, 'stop');

  if (!recordButton || !stopButton) {
    return false;
  }

  // Start recording
  await recordButton.click();
  await page.waitForTimeout(duration);

  // Stop recording
  await stopButton.click();
  await page.waitForTimeout(500);

  return true;
}

/**
 * Get current BPM value
 */
export async function getCurrentBPM(page: Page): Promise<number | null> {
  const bpmDisplay = await getBPMDisplay(page);
  if (!bpmDisplay) return null;

  const value = await bpmDisplay.inputValue();
  return parseInt(value, 10);
}

/**
 * Set BPM value
 */
export async function setBPM(page: Page, bpm: number): Promise<boolean> {
  const bpmDisplay = await getBPMDisplay(page);
  if (!bpmDisplay) return false;

  await bpmDisplay.click();
  await bpmDisplay.fill(bpm.toString());
  await bpmDisplay.press('Enter');
  await page.waitForTimeout(300);

  return true;
}

/**
 * Perform rapid button clicks stress test
 */
export async function rapidClickStressTest(
  buttons: Locator[],
  clicksPerButton = 5,
  delayBetweenClicks = 100
): Promise<void> {
  for (const button of buttons) {
    for (let i = 0; i < clicksPerButton; i++) {
      await button.click();
      await new Promise(resolve => setTimeout(resolve, delayBetweenClicks));
    }
  }
}
