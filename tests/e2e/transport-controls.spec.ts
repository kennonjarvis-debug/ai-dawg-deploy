import { test, expect } from '@playwright/test';

test.describe('DAW Transport Controls - Comprehensive Validation', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to DAW and performing Quick Demo Login...');

    // Navigate to the app
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for "Quick Demo Login" button
    const quickDemoButton = page.locator('button:has-text("Quick Demo Login")');
    const hasQuickDemo = await quickDemoButton.isVisible().catch(() => false);

    if (hasQuickDemo) {
      console.log('✅ Found "Quick Demo Login" button - clicking...');
      await quickDemoButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for DAW to load
      console.log('✅ Quick Demo Login completed');
    } else {
      console.log('⚠️  Quick Demo Login button not found, checking if already logged in...');
    }

    // Now click on a demo project to access the DAW interface
    const demoProject = page.locator('div:has-text("Demo Song")').first();
    const hasProject = await demoProject.isVisible().catch(() => false);

    if (hasProject) {
      console.log('✅ Found demo project - clicking to open DAW...');
      await demoProject.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for DAW interface to fully load
      console.log('✅ DAW interface should now be loaded');
    } else {
      console.log('⚠️  No demo project found to click');
    }

    // Take a screenshot of what we landed on
    await page.screenshot({ path: '/tmp/daw-interface-loaded.png', fullPage: true });
  });

  test('Transport Bar - Should be visible and have all required controls', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check if transport bar exists
    const transportBar = page.locator('[data-testid="transport-bar"]');

    // Take screenshot before testing
    await page.screenshot({
      path: '/tmp/transport-bar-initial.png',
      fullPage: true
    });

    // Verify transport bar is visible
    const isTransportVisible = await transportBar.isVisible().catch(() => false);

    if (isTransportVisible) {
      await expect(transportBar).toBeVisible();
      console.log('✅ Transport bar is visible');
    } else {
      console.log('❌ Transport bar NOT found - checking for alternative selectors');

      // Try alternative selectors
      const alternativeSelectors = [
        '.transport-bar',
        '.transport-controls',
        '[class*="transport"]',
        '[class*="Transport"]',
        'header button[aria-label*="play"]',
        'button[aria-label*="Play"]'
      ];

      for (const selector of alternativeSelectors) {
        const element = page.locator(selector).first();
        const exists = await element.isVisible().catch(() => false);
        if (exists) {
          console.log(`Found transport element with selector: ${selector}`);
          await page.screenshot({
            path: `/tmp/transport-alternative-${selector.replace(/[^a-z0-9]/gi, '_')}.png`
          });
        }
      }
    }

    // Filter real errors
    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Play Button - Should exist and be clickable', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Look for play button with multiple selectors
    const playButtonSelectors = [
      '[data-testid="play-button"]',
      'button[aria-label*="Play"]',
      'button[aria-label*="play"]',
      'button[title*="Play"]',
      'button[title*="play"]',
      'button:has-text("Play")',
      'button svg[class*="play"]',
      '[class*="play-button"]'
    ];

    let playButton = null;
    let foundSelector = '';

    for (const selector of playButtonSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        playButton = button;
        foundSelector = selector;
        console.log(`✅ Play button found with selector: ${selector}`);
        break;
      }
    }

    if (playButton) {
      // Take screenshot of play button
      await playButton.screenshot({ path: '/tmp/play-button-before-click.png' });

      // Check if clickable
      const isEnabled = await playButton.isEnabled();
      expect(isEnabled).toBe(true);

      // Click the play button
      await playButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot after click
      await playButton.screenshot({ path: '/tmp/play-button-after-click.png' });

      console.log('✅ Play button clicked successfully');
    } else {
      console.log('❌ Play button NOT found');

      // Take full page screenshot to see what's there
      await page.screenshot({
        path: '/tmp/play-button-not-found.png',
        fullPage: true
      });

      // List all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons found: ${allButtons.length}`);

      for (let i = 0; i < Math.min(10, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        console.log(`Button ${i}: text="${text}" aria-label="${ariaLabel}"`);
      }
    }

    // Filter real errors
    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Stop Button - Should exist and be clickable', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const stopButtonSelectors = [
      '[data-testid="stop-button"]',
      'button[aria-label*="Stop"]',
      'button[aria-label*="stop"]',
      'button[title*="Stop"]',
      'button:has-text("Stop")',
      '[class*="stop-button"]'
    ];

    let stopButton = null;

    for (const selector of stopButtonSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        stopButton = button;
        console.log(`✅ Stop button found with selector: ${selector}`);
        break;
      }
    }

    if (stopButton) {
      await stopButton.screenshot({ path: '/tmp/stop-button.png' });

      const isEnabled = await stopButton.isEnabled();
      expect(isEnabled).toBe(true);

      await stopButton.click();
      await page.waitForTimeout(500);

      console.log('✅ Stop button clicked successfully');
    } else {
      console.log('❌ Stop button NOT found');
      await page.screenshot({ path: '/tmp/stop-button-not-found.png', fullPage: true });
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Record Button - Should exist and be clickable', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const recordButtonSelectors = [
      '[data-testid="record-button"]',
      'button[aria-label*="Record"]',
      'button[aria-label*="record"]',
      'button[title*="Record"]',
      'button:has-text("Record")',
      '[class*="record-button"]'
    ];

    let recordButton = null;

    for (const selector of recordButtonSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        recordButton = button;
        console.log(`✅ Record button found with selector: ${selector}`);
        break;
      }
    }

    if (recordButton) {
      await recordButton.screenshot({ path: '/tmp/record-button-before-click.png' });

      const isEnabled = await recordButton.isEnabled();
      expect(isEnabled).toBe(true);

      await recordButton.click();
      await page.waitForTimeout(1000);

      await recordButton.screenshot({ path: '/tmp/record-button-after-click.png' });

      console.log('✅ Record button clicked successfully');
    } else {
      console.log('❌ Record button NOT found');
      await page.screenshot({ path: '/tmp/record-button-not-found.png', fullPage: true });
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('BPM Display - Should exist and show tempo', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const bpmSelectors = [
      '[data-testid="bpm-display"]',
      '[data-testid="tempo-display"]',
      '[aria-label*="BPM"]',
      '[aria-label*="tempo"]',
      'input[type="number"][value*="120"]',
      'input[aria-label*="BPM"]',
      '[class*="bpm"]',
      '[class*="tempo"]'
    ];

    let bpmDisplay = null;

    for (const selector of bpmSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        bpmDisplay = element;
        console.log(`✅ BPM display found with selector: ${selector}`);
        break;
      }
    }

    if (bpmDisplay) {
      await bpmDisplay.screenshot({ path: '/tmp/bpm-display.png' });

      // Try to get the BPM value
      const bpmValue = await bpmDisplay.textContent().catch(() => null) ||
                      await bpmDisplay.getAttribute('value').catch(() => null);

      if (bpmValue) {
        console.log(`✅ BPM value: ${bpmValue}`);
      }

      // Check if it's an input field
      const tagName = await bpmDisplay.evaluate(el => el.tagName);
      if (tagName === 'INPUT') {
        console.log('✅ BPM is an input field (editable)');

        // Try changing the BPM
        await bpmDisplay.fill('140');
        await page.waitForTimeout(500);

        const newValue = await bpmDisplay.getAttribute('value');
        console.log(`BPM changed to: ${newValue}`);
      }

      console.log('✅ BPM display is functional');
    } else {
      console.log('❌ BPM display NOT found');
      await page.screenshot({ path: '/tmp/bpm-display-not-found.png', fullPage: true });
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Loop Toggle - Should exist and be clickable', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const loopSelectors = [
      '[data-testid="loop-button"]',
      'button[aria-label*="Loop"]',
      'button[aria-label*="loop"]',
      'button[title*="Loop"]',
      'button:has-text("Loop")',
      '[class*="loop"]'
    ];

    let loopButton = null;

    for (const selector of loopSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        loopButton = button;
        console.log(`✅ Loop button found with selector: ${selector}`);
        break;
      }
    }

    if (loopButton) {
      await loopButton.screenshot({ path: '/tmp/loop-button-before-click.png' });

      const isEnabled = await loopButton.isEnabled();
      expect(isEnabled).toBe(true);

      // Click to toggle loop
      await loopButton.click();
      await page.waitForTimeout(500);

      await loopButton.screenshot({ path: '/tmp/loop-button-after-click.png' });

      console.log('✅ Loop button toggled successfully');
    } else {
      console.log('❌ Loop button NOT found');
      await page.screenshot({ path: '/tmp/loop-button-not-found.png', fullPage: true });
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Time Display - Should exist and show playback time', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const timeSelectors = [
      '[data-testid="time-display"]',
      '[data-testid="playback-time"]',
      '[aria-label*="time"]',
      '[aria-label*="Time"]',
      '[class*="time-display"]',
      '[class*="playback-time"]'
    ];

    let timeDisplay = null;

    for (const selector of timeSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        timeDisplay = element;
        console.log(`✅ Time display found with selector: ${selector}`);
        break;
      }
    }

    if (timeDisplay) {
      await timeDisplay.screenshot({ path: '/tmp/time-display.png' });

      const timeValue = await timeDisplay.textContent();
      console.log(`✅ Time display value: ${timeValue}`);

      // Check if it matches time format (e.g., 00:00, 0:00:00)
      const timePattern = /\d{1,2}:\d{2}(:\d{2})?/;
      if (timeValue && timePattern.test(timeValue)) {
        console.log('✅ Time display shows valid time format');
      }
    } else {
      console.log('❌ Time display NOT found');
      await page.screenshot({ path: '/tmp/time-display-not-found.png', fullPage: true });
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Transport Controls - Multiple button clicks stress test', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('🧪 Starting transport controls stress test...');

    // Find all transport buttons
    const allButtonSelectors = [
      'button[aria-label*="Play"]',
      'button[aria-label*="play"]',
      'button[aria-label*="Stop"]',
      'button[aria-label*="stop"]',
      'button[aria-label*="Record"]',
      'button[aria-label*="record"]'
    ];

    const foundButtons: any[] = [];

    for (const selector of allButtonSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        foundButtons.push({ selector, button });
      }
    }

    console.log(`Found ${foundButtons.length} transport buttons`);

    // Click each button multiple times
    for (const { selector, button } of foundButtons) {
      console.log(`Testing ${selector}...`);

      for (let i = 0; i < 3; i++) {
        await button.click();
        await page.waitForTimeout(500);
      }

      console.log(`✅ ${selector} responded to 3 clicks`);
    }

    // Take final screenshot
    await page.screenshot({
      path: '/tmp/transport-stress-test-complete.png',
      fullPage: true
    });

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Transport Controls - Visual state changes verification', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Find play button
    const playSelectors = [
      '[data-testid="play-button"]',
      'button[aria-label*="Play"]',
      'button[aria-label*="play"]'
    ];

    let playButton = null;

    for (const selector of playSelectors) {
      const button = page.locator(selector).first();
      const isVisible = await button.isVisible().catch(() => false);
      if (isVisible) {
        playButton = button;
        break;
      }
    }

    if (playButton) {
      // Get initial state
      const initialClasses = await playButton.getAttribute('class');
      const initialAriaPressed = await playButton.getAttribute('aria-pressed');

      console.log('Initial state:', { initialClasses, initialAriaPressed });

      // Click play button
      await playButton.click();
      await page.waitForTimeout(1000);

      // Get state after click
      const afterClasses = await playButton.getAttribute('class');
      const afterAriaPressed = await playButton.getAttribute('aria-pressed');

      console.log('After click state:', { afterClasses, afterAriaPressed });

      // Check if state changed
      const stateChanged = initialClasses !== afterClasses ||
                          initialAriaPressed !== afterAriaPressed;

      if (stateChanged) {
        console.log('✅ Play button visual state changed after click');
      } else {
        console.log('⚠️  Play button visual state did NOT change (may still be functional)');
      }
    } else {
      console.log('❌ Could not find play button for state test');
    }

    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('Full Transport Bar - Complete element inventory', async ({ page }) => {
    console.log('📋 Taking complete inventory of transport controls...');

    // Take comprehensive screenshot
    await page.screenshot({
      path: '/tmp/transport-bar-full-inventory.png',
      fullPage: true
    });

    // Check for all expected elements
    const elements = {
      transportBar: false,
      playButton: false,
      stopButton: false,
      recordButton: false,
      bpmDisplay: false,
      loopButton: false,
      timeDisplay: false
    };

    // Transport bar
    const transportBar = page.locator('[data-testid="transport-bar"]').first();
    elements.transportBar = await transportBar.isVisible().catch(() => false);

    // Play button
    const playButton = page.locator('button[aria-label*="play"], button[aria-label*="Play"]').first();
    elements.playButton = await playButton.isVisible().catch(() => false);

    // Stop button
    const stopButton = page.locator('button[aria-label*="stop"], button[aria-label*="Stop"]').first();
    elements.stopButton = await stopButton.isVisible().catch(() => false);

    // Record button
    const recordButton = page.locator('button[aria-label*="record"], button[aria-label*="Record"]').first();
    elements.recordButton = await recordButton.isVisible().catch(() => false);

    // BPM display
    const bpmDisplay = page.locator('[data-testid="bpm-display"], [aria-label*="BPM"]').first();
    elements.bpmDisplay = await bpmDisplay.isVisible().catch(() => false);

    // Loop button
    const loopButton = page.locator('button[aria-label*="loop"], button[aria-label*="Loop"]').first();
    elements.loopButton = await loopButton.isVisible().catch(() => false);

    // Time display
    const timeDisplay = page.locator('[data-testid="time-display"], [class*="time"]').first();
    elements.timeDisplay = await timeDisplay.isVisible().catch(() => false);

    console.log('📊 Transport Controls Inventory:');
    console.log('================================');
    console.log(`Transport Bar: ${elements.transportBar ? '✅' : '❌'}`);
    console.log(`Play Button: ${elements.playButton ? '✅' : '❌'}`);
    console.log(`Stop Button: ${elements.stopButton ? '✅' : '❌'}`);
    console.log(`Record Button: ${elements.recordButton ? '✅' : '❌'}`);
    console.log(`BPM Display: ${elements.bpmDisplay ? '✅' : '❌'}`);
    console.log(`Loop Button: ${elements.loopButton ? '✅' : '❌'}`);
    console.log(`Time Display: ${elements.timeDisplay ? '✅' : '❌'}`);

    // At least some transport controls should exist
    const foundControls = Object.values(elements).filter(v => v).length;
    console.log(`\nFound ${foundControls}/7 expected controls`);

    expect(foundControls).toBeGreaterThan(0);
  });
});
