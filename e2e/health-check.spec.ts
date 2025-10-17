import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should return 200 and valid health status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('checks');
    expect(body).toHaveProperty('version');

    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
  });

  test('should include response time in headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const headers = response.headers();

    expect(headers).toHaveProperty('x-response-time');
    expect(headers['x-response-time']).toMatch(/^\d+ms$/);
  });
});

test.describe('Application', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');

    // Check that the page title is present
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for basic accessibility
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});
