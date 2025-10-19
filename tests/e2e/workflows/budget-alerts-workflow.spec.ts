import { test, expect, Page } from '@playwright/test';

/**
 * Budget Alerts Workflow E2E Tests
 *
 * Tests the complete budget alerts workflow including:
 * - Setting budget limits
 * - Testing usage tracking
 * - Verifying alerts at 75%, 90%, 100%
 * - Checking cost breakdown
 * - Testing history retrieval
 */

test.describe('Budget Alerts Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to budget/billing page
    await page.goto('/billing/budget');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="budget-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load budget alerts page with all controls', async () => {
    // Verify main components
    await expect(page.locator('[data-testid="set-budget-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-usage-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="budget-limit-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
  });

  test('should set monthly budget limit', async () => {
    // Open set budget dialog
    await page.locator('[data-testid="set-budget-button"]').click();
    await expect(page.locator('[data-testid="budget-dialog"]')).toBeVisible();

    // Set budget to $100
    await page.locator('[data-testid="budget-amount-input"]').fill('100');

    // Select monthly period
    await page.locator('[data-testid="budget-period-selector"]').click();
    await page.locator('[data-testid="period-option-monthly"]').click();

    // Save budget
    await page.locator('[data-testid="save-budget-button"]').click();

    // Verify budget set
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="budget-limit-display"]')).toContainText('$100');
  });

  test('should set weekly budget limit', async () => {
    await page.locator('[data-testid="set-budget-button"]').click();

    await page.locator('[data-testid="budget-amount-input"]').fill('25');
    await page.locator('[data-testid="budget-period-selector"]').click();
    await page.locator('[data-testid="period-option-weekly"]').click();

    await page.locator('[data-testid="save-budget-button"]').click();

    // Verify
    await expect(page.locator('[data-testid="budget-limit-display"]')).toContainText('$25');
    await expect(page.locator('[data-testid="budget-period-display"]')).toContainText(/week/i);
  });

  test('should track usage in real-time', async () => {
    // Set a budget first
    await setBudget(page, 100, 'monthly');

    // Simulate usage
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: {
          amount: 15.50,
          service: 'AI Music Generation',
          timestamp: Date.now()
        }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify usage displayed
    const currentUsage = page.locator('[data-testid="current-usage-amount"]');
    await expect(currentUsage).toContainText('$15.50');

    // Usage percentage should update
    const usagePercent = page.locator('[data-testid="usage-percentage"]');
    await expect(usagePercent).toContainText('15.5%');
  });

  test('should show alert at 75% usage threshold', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate usage to 75%
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 75, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify 75% alert
    await expect(page.locator('[data-testid="alert-75-percent"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-75-percent"]')).toContainText(/75%|caution/i);
    await expect(page.locator('[data-testid="alert-75-percent"]')).toHaveClass(/warning|yellow/);
  });

  test('should show alert at 90% usage threshold', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate usage to 90%
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 90, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify 90% alert (more severe)
    await expect(page.locator('[data-testid="alert-90-percent"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-90-percent"]')).toContainText(/90%|warning/i);
    await expect(page.locator('[data-testid="alert-90-percent"]')).toHaveClass(/danger|orange/);
  });

  test('should show alert at 100% usage threshold', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate usage to 100%
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 100, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify 100% alert (critical)
    await expect(page.locator('[data-testid="alert-100-percent"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-100-percent"]')).toContainText(/100%|budget.*exceeded|limit.*reached/i);
    await expect(page.locator('[data-testid="alert-100-percent"]')).toHaveClass(/critical|red/);
  });

  test('should display cost breakdown by service', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate usage from different services
    const services = [
      { name: 'AI Music Generation', cost: 25 },
      { name: 'Stem Separation', cost: 15 },
      { name: 'AI Mastering', cost: 10 },
      { name: 'Voice Analysis', cost: 5 },
    ];

    for (const service of services) {
      await page.evaluate((s) => {
        window.dispatchEvent(new CustomEvent('usage-update', {
          detail: { amount: s.cost, service: s.name, timestamp: Date.now() }
        }));
      }, service);
      await page.waitForTimeout(200);
    }

    // Open cost breakdown
    await page.locator('[data-testid="view-breakdown-button"]').click();

    // Verify each service in breakdown
    for (const service of services) {
      const item = page.locator('[data-testid="breakdown-item"]').filter({ hasText: service.name });
      await expect(item).toBeVisible();
      await expect(item).toContainText(`$${service.cost}`);
    }
  });

  test('should display usage chart', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate usage over time
    const usageData = [10, 25, 40, 55, 70];

    for (const amount of usageData) {
      await page.evaluate((amt) => {
        window.dispatchEvent(new CustomEvent('usage-update', {
          detail: { amount: amt, service: 'AI Services', timestamp: Date.now() }
        }));
      }, amount);
      await page.waitForTimeout(300);
    }

    // Verify chart is visible and populated
    const chart = page.locator('[data-testid="usage-chart"]');
    await expect(chart).toBeVisible();
    await expect(chart.locator('canvas')).toBeVisible();

    // Chart should have data points
    const dataPoints = await page.locator('[data-testid="chart-data-point"]').count();
    expect(dataPoints).toBeGreaterThan(0);
  });

  test('should retrieve usage history', async () => {
    // View history
    await page.locator('[data-testid="view-history-button"]').click();

    // Verify history panel
    await expect(page.locator('[data-testid="usage-history-panel"]')).toBeVisible();

    // Should show historical entries
    await expect(page.locator('[data-testid="history-entry"]').first()).toBeVisible();
  });

  test('should filter history by date range', async () => {
    await page.locator('[data-testid="view-history-button"]').click();

    // Set date range
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    await page.locator('[data-testid="date-range-from"]').fill(lastWeek.toISOString().split('T')[0]);
    await page.locator('[data-testid="date-range-to"]').fill(today.toISOString().split('T')[0]);

    // Apply filter
    await page.locator('[data-testid="apply-date-filter-button"]').click();

    // Verify filtered results
    await expect(page.locator('[data-testid="history-entry"]').first()).toBeVisible();
  });

  test('should filter history by service type', async () => {
    await page.locator('[data-testid="view-history-button"]').click();

    // Filter by specific service
    await page.locator('[data-testid="service-filter"]').click();
    await page.locator('[data-testid="filter-option-ai-mastering"]').click();

    // Verify only AI Mastering entries shown
    const entries = page.locator('[data-testid="history-entry"]');
    const count = await entries.count();

    for (let i = 0; i < count; i++) {
      const entry = entries.nth(i);
      await expect(entry).toContainText(/AI Mastering/i);
    }
  });

  test('should send email notification at 75% threshold', async () => {
    await setBudget(page, 100, 'monthly');

    // Enable email notifications
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="enable-email-alerts-toggle"]').click();
    await page.locator('[data-testid="save-settings-button"]').click();

    // Trigger 75% usage
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 75, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify email notification sent indicator
    await expect(page.locator('[data-testid="email-sent-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-sent-indicator"]')).toContainText(/email.*sent|notification.*sent/i);
  });

  test('should pause services when budget exceeded', async () => {
    await setBudget(page, 100, 'monthly');

    // Enable auto-pause
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="auto-pause-toggle"]').click();
    await page.locator('[data-testid="save-settings-button"]').click();

    // Exceed budget
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 101, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // Verify services paused
    await expect(page.locator('[data-testid="services-paused-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="services-paused-message"]')).toContainText(/services.*paused|budget.*exceeded/i);
  });

  test('should export usage data as CSV', async () => {
    await page.locator('[data-testid="view-history-button"]').click();

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-csv-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/usage.*\.csv$/);
  });

  test('should export usage data as PDF report', async () => {
    await page.locator('[data-testid="view-history-button"]').click();

    // Export as PDF
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-pdf-button"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/usage.*report.*\.pdf$/);
  });

  test('should compare current vs previous period', async () => {
    // View comparison
    await page.locator('[data-testid="compare-periods-button"]').click();

    // Verify comparison display
    await expect(page.locator('[data-testid="current-period-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="previous-period-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-change-percentage"]')).toBeVisible();
  });

  test('should show projected usage based on current trend', async () => {
    await setBudget(page, 100, 'monthly');

    // Simulate consistent usage
    for (let i = 1; i <= 5; i++) {
      await page.evaluate((day) => {
        window.dispatchEvent(new CustomEvent('usage-update', {
          detail: { amount: day * 10, service: 'AI Services', timestamp: Date.now() }
        }));
      }, i);
      await page.waitForTimeout(200);
    }

    // Verify projection shown
    await expect(page.locator('[data-testid="projected-usage"]')).toBeVisible();

    const projection = await page.locator('[data-testid="projected-usage"]').textContent();
    expect(projection).toMatch(/\$\d+/); // Should show dollar amount
  });

  test('should configure custom alert thresholds', async () => {
    await page.locator('[data-testid="settings-button"]').click();

    // Set custom thresholds
    await page.locator('[data-testid="threshold-1-input"]').fill('50');
    await page.locator('[data-testid="threshold-2-input"]').fill('80');
    await page.locator('[data-testid="threshold-3-input"]').fill('95');

    // Save
    await page.locator('[data-testid="save-settings-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
  });

  test('should show budget remaining amount', async () => {
    await setBudget(page, 100, 'monthly');

    // Add some usage
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 35, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(500);

    // Verify remaining shown
    const remaining = page.locator('[data-testid="budget-remaining"]');
    await expect(remaining).toBeVisible();
    await expect(remaining).toContainText('$65');
  });

  test('should reset budget period automatically', async () => {
    // Mock period end
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('budget-period-reset', {
        detail: { newPeriodStart: Date.now() }
      }));
    });

    await page.waitForTimeout(500);

    // Verify reset notification
    await expect(page.locator('[data-testid="period-reset-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-usage-amount"]')).toContainText('$0');
  });

  test('should handle multiple budget alerts simultaneously', async () => {
    await setBudget(page, 100, 'monthly');

    // Quickly go from 75% to 100%
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 75, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 100, service: 'AI Services', timestamp: Date.now() + 1000 }
      }));
    });

    await page.waitForTimeout(500);

    // Both alerts should be in notification history
    await page.locator('[data-testid="notifications-button"]').click();
    await expect(page.locator('[data-testid="notification-item"]').filter({ hasText: '75%' })).toBeVisible();
    await expect(page.locator('[data-testid="notification-item"]').filter({ hasText: '100%' })).toBeVisible();
  });

  test('should disable budget alerts', async () => {
    await page.locator('[data-testid="settings-button"]').click();

    // Disable alerts
    await page.locator('[data-testid="enable-alerts-toggle"]').click();

    // Save
    await page.locator('[data-testid="save-settings-button"]').click();

    // Trigger usage that would normally alert
    await setBudget(page, 100, 'monthly');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 90, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(1000);

    // No alert should show
    await expect(page.locator('[data-testid="alert-90-percent"]')).not.toBeVisible();
  });

  test('should show top spending categories', async () => {
    // Simulate varied usage
    const services = [
      { name: 'AI Music Generation', cost: 45 },
      { name: 'Stem Separation', cost: 30 },
      { name: 'AI Mastering', cost: 20 },
      { name: 'Voice Analysis', cost: 5 },
    ];

    for (const service of services) {
      await page.evaluate((s) => {
        window.dispatchEvent(new CustomEvent('usage-update', {
          detail: { amount: s.cost, service: s.name, timestamp: Date.now() }
        }));
      }, service);
      await page.waitForTimeout(200);
    }

    // View top categories
    await page.locator('[data-testid="top-categories-button"]').click();

    // Verify sorted by cost
    const categories = page.locator('[data-testid="category-item"]');
    const firstCategory = await categories.first().textContent();

    expect(firstCategory).toContain('AI Music Generation'); // Highest cost
  });

  test('should display budget utilization gauge', async () => {
    await setBudget(page, 100, 'monthly');

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('usage-update', {
        detail: { amount: 60, service: 'AI Services', timestamp: Date.now() }
      }));
    });

    await page.waitForTimeout(500);

    // Verify gauge
    const gauge = page.locator('[data-testid="budget-gauge"]');
    await expect(gauge).toBeVisible();

    // Gauge should show 60%
    const gaugeValue = await gauge.getAttribute('data-value');
    expect(gaugeValue).toBe('60');
  });
});

/**
 * Helper function to set budget
 */
async function setBudget(page: Page, amount: number, period: string) {
  await page.locator('[data-testid="set-budget-button"]').click();
  await page.locator('[data-testid="budget-amount-input"]').fill(String(amount));
  await page.locator('[data-testid="budget-period-selector"]').click();
  await page.locator(`[data-testid="period-option-${period}"]`).click();
  await page.locator('[data-testid="save-budget-button"]').click();
  await page.waitForTimeout(500);
}
