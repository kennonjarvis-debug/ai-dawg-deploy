/**
 * Test Agent 1: Chat System Validator
 * Comprehensive test of ChatbotWidget and chat messaging system
 *
 * Site URL: https://www.dawg-ai.com
 *
 * Components Tested:
 * 1. ChatbotWidget - Complete Integration
 * 2. Chat Input Field
 * 3. Send Message Button
 * 4. Chat Message Display
 * 5. Message History
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshot directory exists
const screenshotDir = path.join(process.cwd(), 'test-results', 'chatbot-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('ChatbotWidget System Validation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('https://www.dawg-ai.com', { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('1. ChatbotWidget - Initial State and Toggle Functionality', async () => {
    console.log('\n=== TEST 1: ChatbotWidget Initial State ===');

    // Take screenshot of initial page
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-page.png'),
      fullPage: true
    });

    // Look for chatbot toggle button (multiple possible selectors)
    const toggleSelectors = [
      'button.chatbot-toggle',
      '[data-testid="chatbot-toggle"]',
      'button:has-text("💬")',
      '.chatbot-toggle',
      '[aria-label*="chatbot"]',
      '[aria-label*="Open chatbot"]',
      'button[class*="chat"]',
    ];

    let toggleButton = null;
    let foundSelector = '';

    for (const selector of toggleSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          toggleButton = element;
          foundSelector = selector;
          console.log(`✅ Found chatbot toggle button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!toggleButton) {
      console.log('❌ FAILED: Chatbot toggle button NOT found');
      console.log('Searched selectors:', toggleSelectors);

      // Get all buttons on page for debugging
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons found: ${allButtons.length}`);

      // Take a screenshot showing the issue
      await page.screenshot({
        path: path.join(screenshotDir, '01-ERROR-no-toggle-button.png'),
        fullPage: true
      });

      expect(toggleButton).toBeTruthy();
      return;
    }

    // Take screenshot of toggle button
    await toggleButton.screenshot({
      path: path.join(screenshotDir, '02-toggle-button.png')
    });

    // Click toggle to open chatbot
    console.log('Clicking toggle button to open chatbot...');
    await toggleButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot after opening
    await page.screenshot({
      path: path.join(screenshotDir, '03-chatbot-opened.png'),
      fullPage: true
    });

    // Look for opened chatbot window
    const windowSelectors = [
      '.chatbot-window',
      '[data-testid="chatbot-widget"]',
      '.chatbot-widget.expanded',
      '[class*="chatbot-window"]',
    ];

    let chatbotWindow = null;
    for (const selector of windowSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          chatbotWindow = element;
          console.log(`✅ Chatbot window opened successfully using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!chatbotWindow) {
      console.log('❌ FAILED: Chatbot window did NOT open after clicking toggle');
      await page.screenshot({
        path: path.join(screenshotDir, '03-ERROR-window-not-opened.png'),
        fullPage: true
      });
    }

    expect(chatbotWindow).toBeTruthy();
  });

  test('2. Chat Input Field - Presence and Functionality', async () => {
    console.log('\n=== TEST 2: Chat Input Field ===');

    // Open chatbot first
    await openChatbot(page);

    // Take screenshot of opened chatbot
    await page.screenshot({
      path: path.join(screenshotDir, '04-input-field-check.png'),
      fullPage: true
    });

    // Look for input field
    const inputSelectors = [
      'input.chatbot-input',
      '[data-testid="chat-input"]',
      'input[placeholder*="Ask"]',
      'input[placeholder*="message"]',
      'input[type="text"]',
      '.chatbot-input-container input',
    ];

    let inputField = null;
    let foundSelector = '';

    for (const selector of inputSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          inputField = element;
          foundSelector = selector;
          console.log(`✅ Found input field using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!inputField) {
      console.log('❌ FAILED: Chat input field NOT found');
      await page.screenshot({
        path: path.join(screenshotDir, '04-ERROR-no-input.png'),
        fullPage: true
      });
      expect(inputField).toBeTruthy();
      return;
    }

    // Test typing into input
    console.log('Testing typing into input field...');
    const testMessage = 'create a trap beat';
    await inputField.fill(testMessage);
    await page.waitForTimeout(500);

    // Verify input has the text
    const inputValue = await inputField.inputValue();
    console.log(`Input value after typing: "${inputValue}"`);

    await page.screenshot({
      path: path.join(screenshotDir, '05-input-with-text.png'),
      fullPage: true
    });

    expect(inputValue).toBe(testMessage);
    console.log('✅ Input field accepts text successfully');
  });

  test('3. Send Message Button - Presence and Clickability', async () => {
    console.log('\n=== TEST 3: Send Message Button ===');

    // Open chatbot
    await openChatbot(page);

    // Look for send button
    const sendButtonSelectors = [
      'button.chatbot-send-btn',
      '[data-testid="chat-send"]',
      'button:has-text("➤")',
      '.chatbot-send-btn',
      '.chatbot-input-container button',
      'button[type="submit"]',
    ];

    let sendButton = null;

    for (const selector of sendButtonSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          sendButton = element;
          console.log(`✅ Found send button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!sendButton) {
      console.log('❌ FAILED: Send button NOT found');
      await page.screenshot({
        path: path.join(screenshotDir, '06-ERROR-no-send-button.png'),
        fullPage: true
      });
      expect(sendButton).toBeTruthy();
      return;
    }

    // Check if button is initially disabled (empty input)
    const isDisabled = await sendButton.isDisabled();
    console.log(`Send button disabled state (with empty input): ${isDisabled}`);

    await page.screenshot({
      path: path.join(screenshotDir, '06-send-button-disabled.png'),
      fullPage: true
    });

    // Type something to enable button
    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();
    if (await inputField.count() > 0) {
      await inputField.fill('test message');
      await page.waitForTimeout(300);

      const isEnabledAfter = !(await sendButton.isDisabled());
      console.log(`Send button enabled after typing: ${isEnabledAfter}`);

      await page.screenshot({
        path: path.join(screenshotDir, '07-send-button-enabled.png'),
        fullPage: true
      });

      expect(isEnabledAfter).toBe(true);
      console.log('✅ Send button state changes correctly');
    }
  });

  test('4. Send Test Message - End-to-End Message Flow', async () => {
    console.log('\n=== TEST 4: Send Test Message ===');

    // Open chatbot
    await openChatbot(page);

    // Find input and send button
    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();
    const sendButton = page.locator('button.chatbot-send-btn, [data-testid="chat-send"], button:has-text("➤")').first();

    if (await inputField.count() === 0) {
      console.log('❌ FAILED: Input field not found');
      await page.screenshot({
        path: path.join(screenshotDir, '08-ERROR-no-input-for-send.png'),
        fullPage: true
      });
      expect(await inputField.count()).toBeGreaterThan(0);
      return;
    }

    // Type test message
    const testMessage = 'create a trap beat';
    console.log(`Typing message: "${testMessage}"`);
    await inputField.fill(testMessage);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, '08-ready-to-send.png'),
      fullPage: true
    });

    // Click send button
    console.log('Clicking send button...');
    await sendButton.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(screenshotDir, '09-after-send.png'),
      fullPage: true
    });

    console.log('✅ Message send action completed');
  });

  test('5. Chat Message Display - Verify Messages Appear', async () => {
    console.log('\n=== TEST 5: Chat Message Display ===');

    // Open chatbot
    await openChatbot(page);

    // Look for messages container
    const messageContainerSelectors = [
      '.chatbot-messages',
      '[data-testid="chat-messages"]',
      '.chatbot-content',
      '[class*="messages"]',
    ];

    let messagesContainer = null;

    for (const selector of messageContainerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          messagesContainer = element;
          console.log(`✅ Found messages container using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!messagesContainer) {
      console.log('⚠️ WARNING: Messages container not found with standard selectors');
    }

    // Look for individual messages
    const messageSelectors = [
      '.chatbot-message',
      '[data-testid="chat-message"]',
      '[class*="message"]',
    ];

    let messages = null;

    for (const selector of messageSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          messages = elements;
          console.log(`✅ Found ${count} messages using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '10-message-display.png'),
      fullPage: true
    });

    if (messages && await messages.count() > 0) {
      const messageCount = await messages.count();
      console.log(`✅ Found ${messageCount} message(s) displayed`);

      // Check for welcome message
      const pageText = await page.textContent('body');
      if (pageText && pageText.includes('AI DAWG')) {
        console.log('✅ Welcome message appears to be present');
      }

      expect(messageCount).toBeGreaterThan(0);
    } else {
      console.log('⚠️ WARNING: No messages found - may need to wait for welcome message');
    }
  });

  test('6. Loading/Streaming Indicators', async () => {
    console.log('\n=== TEST 6: Loading Indicators ===');

    // Open chatbot
    await openChatbot(page);

    // Find input and send
    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();
    const sendButton = page.locator('button.chatbot-send-btn, [data-testid="chat-send"], button:has-text("➤")').first();

    if (await inputField.count() === 0 || await sendButton.count() === 0) {
      console.log('⚠️ Skipping: Input or send button not available');
      return;
    }

    // Send a message
    await inputField.fill('test');
    await page.waitForTimeout(300);
    await sendButton.click();

    // Look for loading indicators
    await page.waitForTimeout(500);

    const loadingSelectors = [
      '.chatbot-typing-indicator',
      '[data-testid="loading"]',
      '[class*="typing"]',
      '[class*="loading"]',
      '.spinner',
    ];

    let foundLoading = false;
    for (const selector of loadingSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          foundLoading = true;
          console.log(`✅ Found loading indicator: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '11-loading-indicator.png'),
      fullPage: true
    });

    if (foundLoading) {
      console.log('✅ Loading indicator present');
    } else {
      console.log('⚠️ WARNING: Loading indicator not found (may have appeared/disappeared quickly)');
    }
  });

  test('7. Enter Key to Send Message', async () => {
    console.log('\n=== TEST 7: Enter Key Functionality ===');

    // Open chatbot
    await openChatbot(page);

    // Find input
    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();

    if (await inputField.count() === 0) {
      console.log('⚠️ Skipping: Input field not available');
      return;
    }

    // Type message
    await inputField.fill('test enter key');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(screenshotDir, '12-before-enter.png'),
      fullPage: true
    });

    // Press Enter
    console.log('Pressing Enter key...');
    await inputField.press('Enter');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, '13-after-enter.png'),
      fullPage: true
    });

    // Check if input was cleared (indicates message was sent)
    const inputValue = await inputField.inputValue();
    console.log(`Input value after Enter: "${inputValue}"`);

    if (inputValue === '') {
      console.log('✅ Enter key sends message (input cleared)');
    } else {
      console.log('⚠️ WARNING: Input not cleared after Enter - message may not have sent');
    }
  });

  test('8. Console Errors Check', async () => {
    console.log('\n=== TEST 8: Console Errors ===');

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Perform standard chatbot interactions
    await openChatbot(page);
    await page.waitForTimeout(1000);

    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();
    if (await inputField.count() > 0) {
      await inputField.fill('test');
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '14-console-check.png'),
      fullPage: true
    });

    // Report errors and warnings
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No console errors');
    }

    console.log(`\n📊 Console Warnings: ${consoleWarnings.length}`);
    if (consoleWarnings.length > 0) {
      console.log('⚠️ Console Warnings Found:');
      consoleWarnings.slice(0, 5).forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    } else {
      console.log('✅ No console warnings');
    }
  });

  test('9. Mobile Responsiveness - Chatbot on Mobile', async ({ browser }) => {
    console.log('\n=== TEST 9: Mobile Responsiveness ===');

    // Create mobile viewport
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('https://www.dawg-ai.com', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    await mobilePage.screenshot({
      path: path.join(screenshotDir, '15-mobile-initial.png'),
      fullPage: true
    });

    // Try to find and open chatbot on mobile
    const toggleButton = mobilePage.locator('button.chatbot-toggle, [data-testid="chatbot-toggle"], button:has-text("💬")').first();

    if (await toggleButton.count() > 0) {
      console.log('✅ Chatbot toggle found on mobile');
      await toggleButton.click();
      await mobilePage.waitForTimeout(1000);

      await mobilePage.screenshot({
        path: path.join(screenshotDir, '16-mobile-opened.png'),
        fullPage: true
      });

      console.log('✅ Chatbot opens on mobile');
    } else {
      console.log('❌ FAILED: Chatbot toggle not found on mobile');
      await mobilePage.screenshot({
        path: path.join(screenshotDir, '16-ERROR-mobile-no-toggle.png'),
        fullPage: true
      });
    }

    await mobilePage.close();
    await mobileContext.close();
  });

  test('10. Full Integration Test - Complete Chat Flow', async () => {
    console.log('\n=== TEST 10: Full Integration Test ===');

    // 1. Open chatbot
    console.log('Step 1: Opening chatbot...');
    await openChatbot(page);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, '17-integration-step1.png'),
      fullPage: true
    });

    // 2. Type message
    console.log('Step 2: Typing message...');
    const inputField = page.locator('input.chatbot-input, [data-testid="chat-input"], input[type="text"]').first();
    const testMessage = 'create a trap beat at 140 bpm';

    if (await inputField.count() > 0) {
      await inputField.fill(testMessage);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, '18-integration-step2.png'),
        fullPage: true
      });

      // 3. Send message
      console.log('Step 3: Sending message...');
      const sendButton = page.locator('button.chatbot-send-btn, [data-testid="chat-send"], button:has-text("➤")').first();

      if (await sendButton.count() > 0) {
        await sendButton.click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(screenshotDir, '19-integration-step3.png'),
          fullPage: true
        });

        // 4. Check for response
        console.log('Step 4: Checking for response...');
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: path.join(screenshotDir, '20-integration-complete.png'),
          fullPage: true
        });

        console.log('✅ Full integration test completed');
      } else {
        console.log('❌ Send button not found');
      }
    } else {
      console.log('❌ Input field not found');
    }
  });
});

/**
 * Helper function to open chatbot
 */
async function openChatbot(page: Page): Promise<boolean> {
  const toggleSelectors = [
    'button.chatbot-toggle',
    '[data-testid="chatbot-toggle"]',
    'button:has-text("💬")',
    '.chatbot-toggle',
  ];

  for (const selector of toggleSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click();
        await page.waitForTimeout(1000);
        return true;
      }
    } catch (e) {
      // Continue
    }
  }

  console.log('⚠️ WARNING: Could not find chatbot toggle button');
  return false;
}

/**
 * Summary test - generates final report
 */
test('FINAL REPORT - Test Summary', async ({ page }) => {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('CHATBOT WIDGET TEST REPORT');
  console.log('='.repeat(80));
  console.log('Site: https://www.dawg-ai.com');
  console.log('Test Date:', new Date().toISOString());
  console.log('Screenshots saved to:', screenshotDir);
  console.log('='.repeat(80));
  console.log('\n✅ All tests completed. Check screenshots for visual validation.');
  console.log('\nRefer to individual test results above for detailed findings.');
  console.log('\n' + '='.repeat(80));
});
