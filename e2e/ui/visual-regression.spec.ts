/**
 * Visual Regression Tests
 *
 * Takes screenshots of all major UI components and pages
 * to detect visual regressions automatically.
 *
 * Run: npm run test:e2e -- visual-regression
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage renders correctly', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('agent dashboard renders correctly', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Wait for all agent cards to load
    await page.waitForSelector('[data-testid="agent-card"]', { timeout: 5000 });

    await expect(page).toHaveScreenshot('agent-dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('UI demo page renders correctly', async ({ page }) => {
    await page.goto('/ui-demo');

    await expect(page).toHaveScreenshot('ui-demo.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test.describe('responsive layouts', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`agent dashboard - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/agent-dashboard');

        await page.waitForSelector('[data-testid="agent-card"]', { timeout: 5000 });

        await expect(page).toHaveScreenshot(`agent-dashboard-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });

  test.describe('UI states', () => {
    test('modal open state', async ({ page }) => {
      await page.goto('/ui-demo');

      // Trigger modal if there's a button to open it
      const modalTrigger = page.locator('[data-testid="open-modal"]');
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click();
        await page.waitForTimeout(300); // Wait for animation

        await expect(page).toHaveScreenshot('modal-open.png', {
          animations: 'disabled',
        });
      }
    });

    test('theme variations', async ({ page }) => {
      await page.goto('/ui-demo');

      // Test light theme
      await expect(page).toHaveScreenshot('theme-light.png', {
        fullPage: true,
        animations: 'disabled',
      });

      // Switch to dark theme
      const darkThemeButton = page.locator('button:has-text("dark")');
      if (await darkThemeButton.count() > 0) {
        await darkThemeButton.click();
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot('theme-dark.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('no visual cut-offs', () => {
    test('all content visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/agent-dashboard');

      // Check that no horizontal scrollbar exists
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });

    test('all content visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/agent-dashboard');

      // Check for overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
