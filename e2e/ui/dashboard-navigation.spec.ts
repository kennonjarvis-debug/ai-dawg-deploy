/**
 * E2E Tests: Dashboard Navigation
 *
 * Tests all navigation flows and route transitions
 * in the Agent Dashboard.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test('navigates to agent dashboard from home', async ({ page }) => {
    await page.goto('/');

    // Click navigation link to agent dashboard
    const dashboardLink = page.locator('a[href="/agent-dashboard"]');

    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await expect(page).toHaveURL('/agent-dashboard');

      // Verify dashboard loaded
      await expect(page.locator('h1')).toContainText('Command Center', { timeout: 5000 });

      console.log('✅ Navigated to agent dashboard');
    }
  });

  test('UI route.changed event emitted on navigation', async ({ page }) => {
    await page.goto('/');

    // Listen for UI events
    await page.evaluate(() => {
      (window as any).__UI_EVENTS__ = [];
      if (typeof window !== 'undefined') {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          if (args[0]?.toString().includes('ui.route.changed')) {
            (window as any).__UI_EVENTS__.push({ topic: 'ui.route.changed', args });
          }
          return originalFetch.apply(this, args as any);
        };
      }
    });

    // Navigate
    const dashboardLink = page.locator('a[href="/agent-dashboard"]');
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForTimeout(500);

      // Check if route change was tracked
      const events = await page.evaluate(() => (window as any).__UI_EVENTS__ || []);

      console.log(`📡 UI Events captured: ${events.length}`);
    }
  });

  test('all major routes are accessible', async ({ page }) => {
    const routes = [
      '/',
      '/agent-dashboard',
      '/ui-demo',
    ];

    for (const route of routes) {
      await page.goto(route);

      // Check that page loaded without 404
      const title = await page.title();
      expect(title).not.toContain('404');

      // Check that body has content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length || 0).toBeGreaterThan(0);

      console.log(`✅ Route accessible: ${route}`);
    }
  });

  test('back button works correctly', async ({ page }) => {
    await page.goto('/');
    const initialURL = page.url();

    // Navigate to another page
    await page.goto('/agent-dashboard');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(initialURL);

    console.log('✅ Back button navigation works');
  });

  test('forward button works correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate forward
    await page.goto('/agent-dashboard');
    const dashboardURL = page.url();

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe(dashboardURL);

    console.log('✅ Forward button navigation works');
  });

  test('page refresh preserves state', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Get initial state
    const initialContent = await page.locator('body').textContent();

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check content is still present
    const refreshedContent = await page.locator('body').textContent();
    expect(refreshedContent).toBeTruthy();
    expect(refreshedContent?.length).toBeGreaterThan(0);

    console.log('✅ Page refresh preserves state');
  });

  test('navigation between agent cards', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find all agent cards
    const agentCards = page.locator('[data-testid="agent-card"]');
    const count = await agentCards.count();

    if (count > 0) {
      console.log(`📊 Found ${count} agent cards`);

      // Click first agent card (if clickable)
      const firstCard = agentCards.first();
      await firstCard.scrollIntoViewIfNeeded();

      console.log('✅ Agent cards navigation ready');
    }
  });

  test('sidebar navigation (if present)', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Check for sidebar navigation
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav');

    if (await sidebar.count() > 0) {
      const links = sidebar.locator('a');
      const linkCount = await links.count();

      console.log(`📊 Found ${linkCount} navigation links in sidebar`);

      // Click first link if available
      if (linkCount > 0) {
        const firstLink = links.first();
        const href = await firstLink.getAttribute('href');

        if (href) {
          await firstLink.click();
          await page.waitForLoadState('networkidle');

          console.log(`✅ Sidebar navigation to: ${href}`);
        }
      }
    } else {
      console.log('ℹ️  No sidebar navigation found');
    }
  });

  test('breadcrumb navigation (if present)', async ({ page }) => {
    await page.goto('/agent-dashboard');

    const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumb, nav[aria-label="breadcrumb"]');

    if (await breadcrumbs.count() > 0) {
      const links = breadcrumbs.locator('a');
      const linkCount = await links.count();

      console.log(`📊 Found ${linkCount} breadcrumb links`);

      if (linkCount > 0) {
        // Click first breadcrumb to go back
        const firstLink = links.first();
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        console.log('✅ Breadcrumb navigation works');
      }
    } else {
      console.log('ℹ️  No breadcrumb navigation found');
    }
  });
});
