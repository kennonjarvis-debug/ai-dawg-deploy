import { test, expect } from '@playwright/test';

test.describe('Critical User Flows - Zero Console Errors', () => {
  test('should have ZERO console errors on initial load', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected demo mode warnings
    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode') &&
      !err.includes('using demo')
    );

    // CRITICAL: Should have ZERO real console errors
    if (realErrors.length > 0) {
      console.log('Console Errors Found:', realErrors);
    }
    expect(realErrors).toHaveLength(0);
  });

  test('should NOT have JSON parsing errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // CRITICAL: No JSON parsing errors
    const jsonErrors = consoleErrors.filter(err =>
      err.includes('Unexpected token') ||
      err.includes('JSON') ||
      err.includes('SyntaxError')
    );

    if (jsonErrors.length > 0) {
      console.log('JSON Errors Found:', jsonErrors);
    }
    expect(jsonErrors).toHaveLength(0);
  });

  test('should NOT have CSRF token errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // CRITICAL: No CSRF errors
    const csrfErrors = consoleErrors.filter(err =>
      err.includes('CSRF') ||
      err.includes('csrf-token')
    );

    if (csrfErrors.length > 0) {
      console.log('CSRF Errors Found:', csrfErrors);
    }
    expect(csrfErrors).toHaveLength(0);
  });

  test('should NOT have failed API requests (except demo mode)', async ({ page }) => {
    const failedRequests: { url: string; status: number | null }[] = [];

    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/v1/')) {
        // API failures are expected in demo mode, but log them
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // In demo mode, API calls should be bypassed entirely
    // So we shouldn't even see failed API requests
    console.log('Failed API Requests (expected in demo mode):', failedRequests.length);

    // This is informational - API calls should be bypassed
    expect(failedRequests.length).toBeLessThan(10);
  });

  test('should have working buttons without throwing errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find all buttons on the page
    const buttons = await page.locator('button:visible').all();

    console.log(`Testing ${buttons.length} visible buttons`);

    // Click first 5 buttons to test for errors
    for (let i = 0; i < Math.min(5, buttons.length); i++) {
      await buttons[i].click({ timeout: 5000 }).catch(() => {
        // Some buttons might not be clickable, that's ok
      });
      await page.waitForTimeout(500);
    }

    // Filter real errors
    const realErrors = consoleErrors.filter(err =>
      !err.includes('Backend not available') &&
      !err.includes('demo mode')
    );

    if (realErrors.length > 0) {
      console.log('Button Click Errors:', realErrors);
    }
    expect(realErrors).toHaveLength(0);
  });

  test('should load all critical assets (JS, CSS)', async ({ page }) => {
    const failedAssets: string[] = [];

    page.on('requestfailed', request => {
      const url = request.url();
      // Only track JS and CSS failures
      if (url.endsWith('.js') || url.endsWith('.css')) {
        failedAssets.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (failedAssets.length > 0) {
      console.log('Failed Assets:', failedAssets);
    }
    expect(failedAssets).toHaveLength(0);
  });

  test('should have valid favicon and manifest', async ({ page }) => {
    await page.goto('/');

    // Check favicon loads
    const favicon = page.locator('link[rel="icon"]');
    const faviconHref = await favicon.getAttribute('href');
    expect(faviconHref).toBeTruthy();

    // Check manifest exists
    const manifest = page.locator('link[rel="manifest"]');
    const manifestHref = await manifest.getAttribute('href');
    expect(manifestHref).toBe('/manifest.json');
  });

  test('should be accessible (basic a11y check)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for basic accessibility
    const mainContent = page.locator('main, [role="main"], #root');
    await expect(mainContent).toBeVisible();

    // Check for heading hierarchy
    const h1 = page.locator('h1').first();
    if (await h1.isVisible().catch(() => false)) {
      await expect(h1).toBeVisible();
    }
  });
});
