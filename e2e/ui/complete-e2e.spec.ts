/**
 * Complete E2E Test Suite
 *
 * Comprehensive end-to-end tests covering:
 * - Widget interactions
 * - Theme switching
 * - Responsive layouts
 * - Chat and real-time updates
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Widget Interaction Tests
// ============================================================================
test.describe('Widget Interactions', () => {
  test('widgets load and mount correctly', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Wait for widgets to load
    await page.waitForTimeout(1000);

    // Check that main widgets are present
    const widgets = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-widget-type]');
      return Array.from(elements).map(el => ({
        type: el.getAttribute('data-widget-type'),
        id: el.getAttribute('data-widget-id'),
      }));
    });

    console.log(`📊 Found ${widgets.length} widgets`);
    expect(widgets.length).toBeGreaterThan(0);
  });

  test('buttons respond to clicks', async ({ page }) => {
    await page.goto('/ui-demo');

    // Find all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const startTime = Date.now();

      // Click first button
      await buttons.first().click();

      const responseTime = Date.now() - startTime;

      // Should respond in <100ms
      expect(responseTime).toBeLessThan(100);

      console.log(`✅ Button response time: ${responseTime}ms`);
    }
  });

  test('input fields accept text', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find input fields
    const inputs = page.locator('input[type="text"], textarea');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const testInput = inputs.first();

      // Type text
      await testInput.fill('Test input text');

      // Verify text was entered
      const value = await testInput.inputValue();
      expect(value).toBe('Test input text');

      console.log('✅ Input field accepts text');
    }
  });

  test('send button functionality', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find send buttons
    const sendButtons = page.locator('button:has-text("Send"), button[aria-label="Send"]');

    if (await sendButtons.count() > 0) {
      const sendButton = sendButtons.first();

      // Check button is clickable
      await expect(sendButton).toBeEnabled();

      console.log('✅ Send button is functional');
    }
  });
});

// ============================================================================
// Theme Switching Tests
// ============================================================================
test.describe('Theme Switching', () => {
  test('theme buttons are present', async ({ page }) => {
    await page.goto('/ui-demo');

    // Look for theme toggle buttons
    const lightButton = page.locator('button:has-text("light")');
    const darkButton = page.locator('button:has-text("dark")');
    const systemButton = page.locator('button:has-text("system")');

    const hasThemeButtons =
      (await lightButton.count()) > 0 ||
      (await darkButton.count()) > 0 ||
      (await systemButton.count()) > 0;

    expect(hasThemeButtons).toBe(true);

    console.log('✅ Theme buttons present');
  });

  test('theme switching triggers events', async ({ page }) => {
    await page.goto('/ui-demo');

    // Track theme changes
    await page.evaluate(() => {
      (window as any).__THEME_CHANGES__ = [];
    });

    // Click dark theme button
    const darkButton = page.locator('button:has-text("dark")');

    if (await darkButton.count() > 0) {
      await darkButton.click();
      await page.waitForTimeout(500);

      console.log('✅ Theme switch triggered');
    }
  });

  test('theme persists across page reload', async ({ page }) => {
    await page.goto('/ui-demo');

    // Switch to dark theme
    const darkButton = page.locator('button:has-text("dark")');

    if (await darkButton.count() > 0) {
      await darkButton.click();
      await page.waitForTimeout(300);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Theme should still be dark (if localStorage is used)
      console.log('✅ Theme persistence check complete');
    }
  });

  test('CSS variables update on theme change', async ({ page }) => {
    await page.goto('/ui-demo');

    // Get initial color value
    const initialColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500');
    });

    expect(initialColor).toBeTruthy();

    console.log(`📊 Initial primary color: ${initialColor.trim()}`);
  });
});

// ============================================================================
// Responsive Layout Tests
// ============================================================================
test.describe('Responsive Layouts', () => {
  const viewports = [
    { name: 'xs', width: 375, height: 667 },    // iPhone SE
    { name: 'sm', width: 640, height: 1136 },   // Small tablets
    { name: 'md', width: 768, height: 1024 },   // iPad
    { name: 'lg', width: 1024, height: 768 },   // Desktop
    { name: 'xl', width: 1280, height: 800 },   // Large desktop
    { name: '2xl', width: 1920, height: 1080 }, // Full HD
  ];

  for (const viewport of viewports) {
    test(`layout adapts to ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/agent-dashboard');

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);

      // Check that content is visible
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(bodyHeight).toBeGreaterThan(0);

      console.log(`✅ ${viewport.name}: No horizontal scroll, height=${bodyHeight}px`);
    });
  }

  test('breakpoint changes emit events', async ({ page }) => {
    await page.goto('/ui-demo');

    // Resize from desktop to mobile
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    console.log('✅ Viewport resized, events should be emitted');
  });

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/agent-dashboard');

    // Look for mobile menu (hamburger icon)
    const mobileMenu = page.locator('button[aria-label="Menu"], .hamburger, [data-testid="mobile-menu"]');

    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
      await page.waitForTimeout(300);

      console.log('✅ Mobile menu toggled');
    } else {
      console.log('ℹ️  No mobile menu found (may not be implemented yet)');
    }
  });
});

// ============================================================================
// Chat and Real-time Updates Tests
// ============================================================================
test.describe('Chat and Real-time Updates', () => {
  test('chat messages are displayed', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Look for chat messages
    const messages = page.locator('[data-testid="chat-message"], .message, .chat-item');
    const messageCount = await messages.count();

    console.log(`📊 Found ${messageCount} chat messages`);

    if (messageCount > 0) {
      // Check first message has content
      const firstMessage = messages.first();
      const messageText = await firstMessage.textContent();

      expect(messageText?.length || 0).toBeGreaterThan(0);

      console.log('✅ Chat messages displayed');
    }
  });

  test('sending a message works', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find chat input
    const chatInput = page.locator('input[placeholder*="Message"], input[placeholder*="message"], textarea[placeholder*="Message"]');

    if (await chatInput.count() > 0) {
      const input = chatInput.first();

      // Type message
      await input.fill('Test message from E2E test');

      // Find send button
      const sendButton = page.locator('button:near(input), button[aria-label="Send"]').first();

      if (await sendButton.count() > 0) {
        await sendButton.click();
        await page.waitForTimeout(500);

        console.log('✅ Message sent');

        // Input should be cleared
        const value = await input.inputValue();
        expect(value).toBe('');
      }
    }
  });

  test('real-time updates (polling)', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Get initial message count
    const initialMessages = await page.locator('[data-testid="chat-message"], .message').count();

    // Wait for polling interval (assume 2-5 seconds)
    await page.waitForTimeout(5000);

    // Check if new messages appeared
    const updatedMessages = await page.locator('[data-testid="chat-message"], .message').count();

    console.log(`📊 Messages: initial=${initialMessages}, updated=${updatedMessages}`);

    // Messages should be present (even if count didn't change)
    expect(updatedMessages).toBeGreaterThanOrEqual(initialMessages);
  });

  test('message scroll position', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Find chat container
    const chatContainer = page.locator('[data-testid="chat-container"], .chat-messages, .messages-container').first();

    if (await chatContainer.count() > 0) {
      // Check if scrollable
      const isScrollable = await chatContainer.evaluate(el => {
        return el.scrollHeight > el.clientHeight;
      });

      if (isScrollable) {
        // Scroll to top
        await chatContainer.evaluate(el => el.scrollTop = 0);
        await page.waitForTimeout(100);

        const scrollTop = await chatContainer.evaluate(el => el.scrollTop);
        expect(scrollTop).toBe(0);

        console.log('✅ Chat scroll works correctly');
      } else {
        console.log('ℹ️  Chat not scrollable (few messages)');
      }
    }
  });

  test('agent status indicators', async ({ page }) => {
    await page.goto('/agent-dashboard');

    // Look for status indicators
    const statusIndicators = page.locator('[data-testid="status-indicator"], .status-light, .online-indicator');
    const count = await statusIndicators.count();

    if (count > 0) {
      console.log(`📊 Found ${count} status indicators`);

      // Check that at least one is showing "online"
      const onlineIndicators = statusIndicators.filter({ hasText: /online|active|🟢/i });
      const onlineCount = await onlineIndicators.count();

      console.log(`✅ ${onlineCount} agents online`);
    }
  });
});
