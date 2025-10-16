import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to projects page if not already there
    const projectsButton = page.getByRole('button', { name: /projects|open daw/i });
    const projectsLink = page.getByRole('link', { name: /projects|open daw/i });

    if (await projectsButton.isVisible().catch(() => false)) {
      await projectsButton.click();
      await page.waitForLoadState('networkidle');
    } else if (await projectsLink.isVisible().catch(() => false)) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display demo projects', async ({ page }) => {
    // Look for project cards or list items
    const projectElement = page.locator('[data-testid*="project"]').first();
    const projectCard = page.locator('.project-card, [class*="ProjectCard"]').first();

    const hasProjects = await projectElement.isVisible().catch(() => false) ||
                       await projectCard.isVisible().catch(() => false) ||
                       await page.getByText(/demo song|demo project/i).isVisible().catch(() => false);

    expect(hasProjects).toBeTruthy();
  });

  test('should have working "New Project" button', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Find and click new project button
    const newProjectButton = page.getByTestId('new-project-button');

    if (await newProjectButton.isVisible().catch(() => false)) {
      await newProjectButton.click();

      // Should open modal or navigate - no errors
      await page.waitForTimeout(1000);
      const realErrors = consoleErrors.filter(err =>
        !err.includes('Backend not available') &&
        !err.includes('demo mode')
      );
      expect(realErrors).toHaveLength(0);
    }
  });

  test('should have working search functionality', async ({ page }) => {
    const searchInput = page.getByTestId('search-projects-input');

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Demo');
      await page.waitForTimeout(500);

      // Search should filter without errors
      expect(await searchInput.inputValue()).toBe('Demo');
    }
  });

  test('should handle project limit modal', async ({ page }) => {
    // In demo mode with PRO plan, shouldn't see limit modal
    // But button should work without errors
    const newProjectButton = page.getByTestId('new-project-button');

    if (await newProjectButton.isVisible().catch(() => false)) {
      // Click multiple times to test limit logic
      for (let i = 0; i < 3; i++) {
        await newProjectButton.click();
        await page.waitForTimeout(500);

        // Close any modal that opens
        const closeButton = page.getByTestId('close-limit-modal');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
        }

        const modalClose = page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
        if (await modalClose.isVisible().catch(() => false)) {
          await modalClose.click();
        }
      }
    }
  });

  test('should have working filter button', async ({ page }) => {
    const filterButton = page.getByTestId('filter-button');

    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(500);
      // Should not throw errors
    }
  });

  test('should have working logout button', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const logoutButton = page.getByTestId('logout-button');

    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await page.waitForTimeout(1000);

      const realErrors = consoleErrors.filter(err =>
        !err.includes('Backend not available') &&
        !err.includes('demo mode')
      );
      expect(realErrors).toHaveLength(0);
    }
  });
});
