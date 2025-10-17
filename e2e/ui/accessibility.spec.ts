/**
 * Accessibility Tests (WCAG AA)
 *
 * Ensures UI meets WCAG 2.1 Level AA standards:
 * - Contrast ratios
 * - Keyboard navigation
 * - Screen reader support
 * - ARIA labels
 *
 * Uses @axe-core/playwright for automated testing
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    console.log(`✅ Accessibility scan passed: ${accessibilityScanResults.passes.length} checks`);
  });

  test('agent dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/agent-dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('❌ Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.error(`  - ${violation.id}: ${violation.description}`);
        console.error(`    Impact: ${violation.impact}`);
        console.error(`    Nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('UI demo has no accessibility violations', async ({ page }) => {
    await page.goto('/ui-demo');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const computedStyle = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        hasFocusStyle: computedStyle.outline !== 'none' ||
                       computedStyle.border !== 'none' ||
                       computedStyle.boxShadow !== 'none',
      };
    });

    expect(focusedElement).not.toBeNull();
    expect(focusedElement?.hasFocusStyle).toBe(true);

    console.log(`✅ Keyboard navigation: Focus on ${focusedElement?.tagName}`);
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Check for color contrast violations specifically
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    const contrastViolations = contrastResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.error('❌ Color contrast violations:');
      contrastViolations[0].nodes.forEach((node) => {
        console.error(`  - ${node.html}`);
        console.error(`    ${node.failureSummary}`);
      });
    }

    expect(contrastViolations).toHaveLength(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt || img.alt.trim() === '').length;
    });

    expect(imagesWithoutAlt).toBe(0);

    console.log(`✅ All images have alt text`);
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/agent-dashboard');

    const unlabeledInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs.filter(input => {
        const id = input.id;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;

        return !ariaLabel && !ariaLabelledBy && !label;
      }).length;
    });

    expect(unlabeledInputs).toBe(0);

    console.log(`✅ All form inputs have labels`);
  });

  test('headings are hierarchical', async ({ page }) => {
    await page.goto('/agent-dashboard');

    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim().substring(0, 50),
      }));
    });

    // Check that headings don't skip levels
    let previousLevel = 0;
    for (const heading of headingStructure) {
      if (previousLevel > 0) {
        const levelDiff = heading.level - previousLevel;
        expect(levelDiff).toBeLessThanOrEqual(1);
      }
      previousLevel = heading.level;
    }

    console.log(`✅ Heading structure is hierarchical`);
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find all clickable elements
    const clickableElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [onclick]'
      ));

      return elements.map(el => ({
        tagName: el.tagName,
        tabIndex: (el as HTMLElement).tabIndex,
        role: el.getAttribute('role'),
      }));
    });

    // All interactive elements should be keyboard accessible (tabIndex >= 0)
    const nonAccessible = clickableElements.filter(el => el.tabIndex < 0);

    expect(nonAccessible).toHaveLength(0);

    console.log(`✅ All ${clickableElements.length} interactive elements are keyboard accessible`);
  });

  test('ARIA roles are valid', async ({ page }) => {
    await page.goto('/agent-dashboard');

    const ariaResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .include('body')
      .analyze();

    const ariaViolations = ariaResults.violations.filter(
      v => v.id.startsWith('aria-')
    );

    if (ariaViolations.length > 0) {
      console.error('❌ ARIA violations:');
      ariaViolations.forEach((violation) => {
        console.error(`  - ${violation.id}: ${violation.description}`);
      });
    }

    expect(ariaViolations).toHaveLength(0);
  });
});
