import { test, expect, Page } from '@playwright/test';

/**
 * AI Memory Workflow E2E Tests
 *
 * Tests the complete AI memory workflow including:
 * - Storing user preferences and memories
 * - Retrieving memories
 * - Testing category filtering
 * - Verifying importance scoring
 * - Testing expiration functionality
 */

test.describe('AI Memory Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to AI memory page
    await page.goto('/ai-memory');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('[data-testid="memory-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load AI memory page with main sections', async () => {
    // Verify main components
    await expect(page.locator('[data-testid="add-memory-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-memories"]')).toBeVisible();
  });

  test('should store a new preference memory', async () => {
    // Open add memory dialog
    await page.locator('[data-testid="add-memory-button"]').click();
    await expect(page.locator('[data-testid="add-memory-dialog"]')).toBeVisible();

    // Fill in memory details
    await page.locator('[data-testid="memory-title-input"]').fill('Favorite Genre');
    await page.locator('[data-testid="memory-content-input"]').fill('User prefers hip-hop and R&B music');

    // Select category
    await page.locator('[data-testid="category-selector"]').click();
    await page.locator('[data-testid="category-option-preference"]').click();

    // Set importance
    await page.locator('[data-testid="importance-slider"]').fill('80');

    // Save memory
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Favorite Genre' })).toBeVisible();
  });

  test('should store different categories of memories', async () => {
    const categories = [
      { name: 'Preference', title: 'Music Style', content: 'Likes energetic beats' },
      { name: 'Fact', title: 'Studio Setup', content: 'Has a home studio with SM7B mic' },
      { name: 'Context', title: 'Current Project', content: 'Working on debut album' },
      { name: 'Goal', title: 'Career Goal', content: 'Release album by end of year' },
    ];

    for (const category of categories) {
      await page.locator('[data-testid="add-memory-button"]').click();
      await page.locator('[data-testid="memory-title-input"]').fill(category.title);
      await page.locator('[data-testid="memory-content-input"]').fill(category.content);
      await page.locator('[data-testid="category-selector"]').click();
      await page.locator(`[data-testid="category-option-${category.name.toLowerCase()}"]`).click();
      await page.locator('[data-testid="save-memory-button"]').click();
      await page.waitForTimeout(500);
    }

    // Verify all saved
    for (const category of categories) {
      await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: category.title })).toBeVisible();
    }
  });

  test('should retrieve all memories', async () => {
    // Add a few memories first
    await addTestMemory(page, 'Test Memory 1', 'Content 1', 'preference');
    await addTestMemory(page, 'Test Memory 2', 'Content 2', 'fact');

    // Reload page to test retrieval
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify memories loaded
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Test Memory 1' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Test Memory 2' })).toBeVisible();
  });

  test('should filter memories by category', async () => {
    // Add memories of different categories
    await addTestMemory(page, 'Preference 1', 'Likes rock', 'preference');
    await addTestMemory(page, 'Fact 1', 'Uses Ableton', 'fact');
    await addTestMemory(page, 'Context 1', 'Recording vocals', 'context');

    // Filter by preference
    await page.locator('[data-testid="category-filter"]').click();
    await page.locator('[data-testid="filter-preference"]').click();

    // Verify only preference memories shown
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Preference 1' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Fact 1' })).not.toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Context 1' })).not.toBeVisible();

    // Clear filter
    await page.locator('[data-testid="clear-filter-button"]').click();

    // All should be visible again
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Fact 1' })).toBeVisible();
  });

  test('should search memories by content', async () => {
    // Add memories
    await addTestMemory(page, 'Vocal Tips', 'Use compression on vocals', 'preference');
    await addTestMemory(page, 'Beat Making', 'Start with drums', 'fact');

    // Search for "vocals"
    await page.locator('[data-testid="search-memories"]').fill('vocals');

    // Only vocal-related memory should show
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Vocal Tips' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Beat Making' })).not.toBeVisible();

    // Clear search
    await page.locator('[data-testid="search-memories"]').clear();

    // All should be visible
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Beat Making' })).toBeVisible();
  });

  test('should display importance score for each memory', async () => {
    // Add memory with specific importance
    await page.locator('[data-testid="add-memory-button"]').click();
    await page.locator('[data-testid="memory-title-input"]').fill('Important Preference');
    await page.locator('[data-testid="memory-content-input"]').fill('Critical user preference');
    await page.locator('[data-testid="category-selector"]').click();
    await page.locator('[data-testid="category-option-preference"]').click();
    await page.locator('[data-testid="importance-slider"]').fill('90');
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify importance displayed
    const memoryItem = page.locator('[data-testid="memory-item"]').filter({ hasText: 'Important Preference' });
    await expect(memoryItem.locator('[data-testid="importance-score"]')).toContainText('90');

    // High importance should have visual indicator
    await expect(memoryItem.locator('[data-testid="importance-badge"]')).toHaveClass(/high|important/);
  });

  test('should sort memories by importance', async () => {
    // Add memories with different importance
    await addTestMemory(page, 'Low Priority', 'Low importance', 'preference', 20);
    await addTestMemory(page, 'High Priority', 'High importance', 'preference', 95);
    await addTestMemory(page, 'Medium Priority', 'Medium importance', 'preference', 50);

    // Sort by importance
    await page.locator('[data-testid="sort-selector"]').click();
    await page.locator('[data-testid="sort-importance-desc"]').click();

    // Verify order (highest first)
    const memoryItems = page.locator('[data-testid="memory-item"]');
    const firstItem = await memoryItems.nth(0).locator('[data-testid="memory-title"]').textContent();
    const lastItem = await memoryItems.nth(2).locator('[data-testid="memory-title"]').textContent();

    expect(firstItem).toContain('High Priority');
    expect(lastItem).toContain('Low Priority');
  });

  test('should edit existing memory', async () => {
    // Add a memory
    await addTestMemory(page, 'Original Title', 'Original content', 'preference');

    // Edit it
    await page.locator('[data-testid="memory-item"]').filter({ hasText: 'Original Title' }).hover();
    await page.locator('[data-testid="edit-memory-button"]').first().click();

    // Modify content
    await page.locator('[data-testid="memory-title-input"]').fill('Updated Title');
    await page.locator('[data-testid="memory-content-input"]').fill('Updated content');

    // Save changes
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify updated
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Updated Title' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Original Title' })).not.toBeVisible();
  });

  test('should delete memory', async () => {
    // Add a memory
    await addTestMemory(page, 'To Delete', 'This will be deleted', 'fact');

    // Delete it
    await page.locator('[data-testid="memory-item"]').filter({ hasText: 'To Delete' }).hover();
    await page.locator('[data-testid="delete-memory-button"]').first().click();

    // Confirm deletion
    await page.locator('[data-testid="confirm-delete-button"]').click();

    // Verify deleted
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'To Delete' })).not.toBeVisible();
    await expect(page.locator('[data-testid="delete-success-message"]')).toBeVisible();
  });

  test('should set memory expiration date', async () => {
    // Add memory with expiration
    await page.locator('[data-testid="add-memory-button"]').click();
    await page.locator('[data-testid="memory-title-input"]').fill('Temporary Memory');
    await page.locator('[data-testid="memory-content-input"]').fill('This expires soon');
    await page.locator('[data-testid="category-selector"]').click();
    await page.locator('[data-testid="category-option-context"]').click();

    // Enable expiration
    await page.locator('[data-testid="enable-expiration-toggle"]').click();

    // Set expiration date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.locator('[data-testid="expiration-date-input"]').fill(dateString);

    // Save
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify expiration shown
    const memoryItem = page.locator('[data-testid="memory-item"]').filter({ hasText: 'Temporary Memory' });
    await expect(memoryItem.locator('[data-testid="expiration-indicator"]')).toBeVisible();
    await expect(memoryItem.locator('[data-testid="expiration-date"]')).toContainText(dateString);
  });

  test('should show expired memories with warning', async () => {
    // Mock an expired memory by setting date in past
    await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      window.dispatchEvent(new CustomEvent('memory-added', {
        detail: {
          title: 'Expired Memory',
          content: 'This is expired',
          category: 'context',
          expirationDate: yesterday.toISOString(),
          importance: 50
        }
      }));
    });

    await page.waitForTimeout(500);

    // Verify expired indicator
    const expiredMemory = page.locator('[data-testid="memory-item"]').filter({ hasText: 'Expired Memory' });
    await expect(expiredMemory).toHaveClass(/expired/);
    await expect(expiredMemory.locator('[data-testid="expired-badge"]')).toBeVisible();
  });

  test('should auto-remove expired memories when enabled', async () => {
    // Enable auto-removal in settings
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="auto-remove-expired-toggle"]').click();
    await page.locator('[data-testid="save-settings-button"]').click();

    // Add expired memory
    await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      window.dispatchEvent(new CustomEvent('memory-added', {
        detail: {
          id: 'expired-1',
          title: 'Should Auto Delete',
          content: 'Expired content',
          category: 'context',
          expirationDate: yesterday.toISOString(),
          importance: 50
        }
      }));
    });

    // Trigger cleanup
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('cleanup-memories'));
    });

    await page.waitForTimeout(1000);

    // Memory should be removed
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Should Auto Delete' })).not.toBeVisible();
  });

  test('should tag memories with custom tags', async () => {
    // Add memory with tags
    await page.locator('[data-testid="add-memory-button"]').click();
    await page.locator('[data-testid="memory-title-input"]').fill('Tagged Memory');
    await page.locator('[data-testid="memory-content-input"]').fill('Content with tags');
    await page.locator('[data-testid="category-selector"]').click();
    await page.locator('[data-testid="category-option-preference"]').click();

    // Add tags
    await page.locator('[data-testid="tags-input"]').fill('vocals, mixing, production');

    // Save
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify tags displayed
    const memoryItem = page.locator('[data-testid="memory-item"]').filter({ hasText: 'Tagged Memory' });
    await expect(memoryItem.locator('[data-testid="tag"]').filter({ hasText: 'vocals' })).toBeVisible();
    await expect(memoryItem.locator('[data-testid="tag"]').filter({ hasText: 'mixing' })).toBeVisible();
  });

  test('should filter memories by tag', async () => {
    // Add memories with different tags
    await addTestMemory(page, 'Vocal Memory', 'About vocals', 'preference', 50, 'vocals');
    await addTestMemory(page, 'Mixing Memory', 'About mixing', 'fact', 50, 'mixing');

    // Click on vocals tag to filter
    await page.locator('[data-testid="tag"]').filter({ hasText: 'vocals' }).first().click();

    // Only vocal memory should show
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Vocal Memory' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Mixing Memory' })).not.toBeVisible();
  });

  test('should export memories as JSON', async () => {
    // Add some memories
    await addTestMemory(page, 'Export Test 1', 'Content 1', 'preference');
    await addTestMemory(page, 'Export Test 2', 'Content 2', 'fact');

    // Export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-memories-button"]').click();
    await page.locator('[data-testid="export-format-json"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/memories.*\.json$/);
  });

  test('should import memories from JSON', async () => {
    // Create mock import file
    const memoriesData = JSON.stringify([
      { title: 'Imported 1', content: 'Content 1', category: 'preference', importance: 70 },
      { title: 'Imported 2', content: 'Content 2', category: 'fact', importance: 80 },
    ]);

    // Import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('[data-testid="import-memories-button"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'memories.json',
      mimeType: 'application/json',
      buffer: Buffer.from(memoriesData),
    });

    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Imported 1' })).toBeVisible();
    await expect(page.locator('[data-testid="memory-item"]').filter({ hasText: 'Imported 2' })).toBeVisible();
  });

  test('should show memory usage statistics', async () => {
    // Add various memories
    await addTestMemory(page, 'Stat Test 1', 'Content', 'preference');
    await addTestMemory(page, 'Stat Test 2', 'Content', 'fact');
    await addTestMemory(page, 'Stat Test 3', 'Content', 'context');

    // View statistics
    await page.locator('[data-testid="statistics-button"]').click();

    // Verify stats displayed
    await expect(page.locator('[data-testid="stat-total-memories"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-by-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-average-importance"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    await page.route('**/api/memories', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Database unavailable' })
      });
    });

    // Try to add memory
    await page.locator('[data-testid="add-memory-button"]').click();
    await page.locator('[data-testid="memory-title-input"]').fill('Test');
    await page.locator('[data-testid="memory-content-input"]').fill('Test content');
    await page.locator('[data-testid="category-selector"]').click();
    await page.locator('[data-testid="category-option-preference"]').click();
    await page.locator('[data-testid="save-memory-button"]').click();

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});

/**
 * Helper function to add a test memory
 */
async function addTestMemory(
  page: Page,
  title: string,
  content: string,
  category: string,
  importance: number = 50,
  tags: string = ''
) {
  await page.locator('[data-testid="add-memory-button"]').click();
  await page.locator('[data-testid="memory-title-input"]').fill(title);
  await page.locator('[data-testid="memory-content-input"]').fill(content);
  await page.locator('[data-testid="category-selector"]').click();
  await page.locator(`[data-testid="category-option-${category}"]`).click();
  await page.locator('[data-testid="importance-slider"]').fill(String(importance));

  if (tags) {
    await page.locator('[data-testid="tags-input"]').fill(tags);
  }

  await page.locator('[data-testid="save-memory-button"]').click();
  await page.waitForTimeout(500);
}
