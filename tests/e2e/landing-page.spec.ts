import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load without errors', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to landing page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check no console errors (allow demo mode warnings)
    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );
    expect(realErrors).toHaveLength(0);

    // Check page title
    await expect(page).toHaveTitle(/AI DAW/);

    // Check essential elements exist
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should have valid meta tags', async ({ page }) => {
    await page.goto('/');

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('AI DAW');

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
  });

  test('should load all assets successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', request => {
      // Ignore expected API failures in demo mode
      if (!request.url().includes('/api/v1/')) {
        failedRequests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedRequests).toHaveLength(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be usable on mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
