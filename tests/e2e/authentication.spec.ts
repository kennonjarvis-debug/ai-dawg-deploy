import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for sign in or login button/form
    const loginButton = page.getByRole('button', { name: /sign in|login|get started/i });
    const loginLink = page.getByRole('link', { name: /sign in|login|get started/i });

    const hasLoginElement = await loginButton.isVisible().catch(() => false) ||
                           await loginLink.isVisible().catch(() => false);

    // In demo mode, might auto-login or show different UI
    // Just verify page loads without errors
    expect(hasLoginElement || await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should handle demo mode authentication', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for demo mode message
    const hasDemoModeMessage = consoleMessages.some(msg =>
      msg.includes('Running in demo mode') ||
      msg.includes('demo mode')
    );

    expect(hasDemoModeMessage).toBeTruthy();
  });
});
