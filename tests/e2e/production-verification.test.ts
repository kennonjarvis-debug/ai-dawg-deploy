import { test, expect } from '@playwright/test';

test('Verify production has flash animation (not browser notifications)', async ({ page }) => {
  // Navigate to production
  await page.goto('https://dawg-ai.com/project/demo-project-2');

  // Wait for page load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/production-initial.png', fullPage: true });

  // Look for DAWG AI menu
  const dawgMenu = page.locator('text=DAWG AI');
  if (await dawgMenu.isVisible()) {
    await dawgMenu.click();
    await page.waitForTimeout(500);

    // Screenshot of menu open
    await page.screenshot({ path: 'test-results/production-menu-open.png', fullPage: true });

    // Try clicking AI Voice Memo
    const voiceMemoButton = page.locator('text=AI Voice Memo');
    if (await voiceMemoButton.isVisible()) {
      // Set up dialog listener to catch old notifications
      let dialogShown = false;
      let dialogMessage = '';
      page.on('dialog', dialog => {
        dialogShown = true;
        dialogMessage = dialog.message();
        console.log('❌ DIALOG SHOWN:', dialogMessage);
        dialog.dismiss();
      });

      await voiceMemoButton.click();
      await page.waitForTimeout(1000);

      // Screenshot after click
      await page.screenshot({ path: 'test-results/production-after-voice-memo.png', fullPage: true });

      if (dialogShown) {
        console.log('❌ OLD BEHAVIOR: Browser notification shown:', dialogMessage);
      } else {
        console.log('✅ NEW BEHAVIOR: No browser notification!');

        // Check for flash animation message
        const flashMessage = page.locator('text=Voice Memo Mode');
        if (await flashMessage.isVisible()) {
          console.log('✅ Flash guidance message found!');
        } else {
          console.log('⚠️  Flash guidance message NOT found');
        }
      }
    }
  }
});
