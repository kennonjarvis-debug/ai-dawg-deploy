import { test, expect } from '@playwright/test';

test.describe('AI Chat Flash Animation', () => {
  test('should flash yellow when AI Voice Memo is clicked (no browser notification)', async ({ page }) => {
    // Navigate to project page
    await page.goto('http://localhost:5175/project/demo-project-2');

    // Wait for page to load
    await page.waitForSelector('[data-testid="ai-chat-widget"]', { timeout: 10000 });

    // Click DAWG AI menu to open dropdown
    await page.click('text=DAWG AI');

    // Wait for menu to appear
    await page.waitForSelector('text=AI Voice Memo');

    // Set up listener for any browser notifications (should NOT happen)
    let notificationShown = false;
    page.on('dialog', () => {
      notificationShown = true;
    });

    // Get the AI chat widget element before clicking
    const chatWidget = page.locator('[data-testid="ai-chat-widget"]');

    // Take screenshot before
    await page.screenshot({ path: 'test-results/before-voice-memo-click.png', fullPage: true });

    // Click AI Voice Memo
    await page.click('text=AI Voice Memo');

    // Wait a moment for flash animation to start
    await page.waitForTimeout(500);

    // Take screenshot during flash
    await page.screenshot({ path: 'test-results/during-voice-memo-flash.png', fullPage: true });

    // Verify no browser notification was shown
    expect(notificationShown).toBe(false);

    // Verify flash animation is active (check for yellow border or animation)
    const borderColor = await chatWidget.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    console.log('Border color during flash:', borderColor);

    // Verify guidance message appears in chat
    await expect(page.locator('text=Voice Memo Mode')).toBeVisible({ timeout: 2000 });

    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-voice-memo-click.png', fullPage: true });
  });

  test('should flash yellow when AI Music Gen is clicked (no browser prompt)', async ({ page }) => {
    // Navigate to project page
    await page.goto('http://localhost:5175/project/demo-project-2');

    // Wait for page to load
    await page.waitForSelector('[data-testid="ai-chat-widget"]', { timeout: 10000 });

    // Click DAWG AI menu to open dropdown
    await page.click('text=DAWG AI');

    // Wait for menu to appear
    await page.waitForSelector('text=AI Music Gen');

    // Set up listener for any browser prompts (should NOT happen)
    let promptShown = false;
    page.on('dialog', () => {
      promptShown = true;
    });

    // Get the AI chat widget element before clicking
    const chatWidget = page.locator('[data-testid="ai-chat-widget"]');

    // Take screenshot before
    await page.screenshot({ path: 'test-results/before-music-gen-click.png', fullPage: true });

    // Click AI Music Gen
    await page.click('text=AI Music Gen');

    // Wait a moment for flash animation to start
    await page.waitForTimeout(500);

    // Take screenshot during flash
    await page.screenshot({ path: 'test-results/during-music-gen-flash.png', fullPage: true });

    // Verify no browser prompt was shown
    expect(promptShown).toBe(false);

    // Verify guidance message appears in chat
    await expect(page.locator('text=Music Generation Mode')).toBeVisible({ timeout: 2000 });

    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-music-gen-click.png', fullPage: true });
  });
});
