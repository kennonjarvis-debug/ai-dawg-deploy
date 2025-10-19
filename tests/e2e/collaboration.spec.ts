/**
 * E2E Tests for Real-time Collaboration
 * Tests multi-user collaboration features including presence, chat, and sync
 */

import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to project and authenticate
    await page.goto('/');
    // TODO: Add authentication flow
  });

  test('users can see each other in presence list', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    // Both users navigate to same project
    await page1.goto('/project/test-project-id');
    await page2.goto('/project/test-project-id');

    // User 1 should see User 2 in presence list
    await expect(page1.locator('[data-testid="presence-list"]')).toContainText('User 2');

    // User 2 should see User 1 in presence list
    await expect(page2.locator('[data-testid="presence-list"]')).toContainText('User 1');

    // Cleanup
    await user1Context.close();
    await user2Context.close();
  });

  test('users can see cursor positions in real-time', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    await page1.goto('/project/test-project-id');
    await page2.goto('/project/test-project-id');

    // User 1 moves cursor on timeline
    await page1.locator('[data-testid="timeline"]').click({ position: { x: 100, y: 50 } });

    // User 2 should see User 1's cursor
    await expect(page2.locator('[data-testid="user-cursor-User1"]')).toBeVisible();

    await user1Context.close();
    await user2Context.close();
  });

  test('track locking prevents concurrent edits', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    await page1.goto('/project/test-project-id');
    await page2.goto('/project/test-project-id');

    // User 1 locks a track
    await page1.locator('[data-testid="track-1"]').click();
    await page1.locator('[data-testid="lock-track-button"]').click();

    // User 1 should see lock indicator
    await expect(page1.locator('[data-testid="track-1-locked"]')).toBeVisible();

    // User 2 should see that track is locked by User 1
    await expect(page2.locator('[data-testid="track-1-locked-by"]')).toContainText('User 1');

    // User 2 should not be able to edit the locked track
    const editButton = page2.locator('[data-testid="track-1-edit"]');
    await expect(editButton).toBeDisabled();

    await user1Context.close();
    await user2Context.close();
  });

  test('chat messages are delivered in real-time', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    await page1.goto('/project/test-project-id');
    await page2.goto('/project/test-project-id');

    // User 1 sends a chat message
    await page1.locator('[data-testid="chat-input"]').fill('Hello from User 1!');
    await page1.locator('[data-testid="chat-send"]').click();

    // User 2 should receive the message
    await expect(page2.locator('[data-testid="chat-messages"]')).toContainText(
      'Hello from User 1!'
    );

    await user1Context.close();
    await user2Context.close();
  });

  test('comments can be added and resolved', async ({ page }) => {
    await page.goto('/project/test-project-id');

    // Add a comment on a track
    await page.locator('[data-testid="track-1"]').click({ button: 'right' });
    await page.locator('[data-testid="add-comment"]').click();
    await page.locator('[data-testid="comment-input"]').fill('This needs work');
    await page.locator('[data-testid="comment-submit"]').click();

    // Comment should appear
    await expect(page.locator('[data-testid="comment-list"]')).toContainText('This needs work');

    // Resolve the comment
    await page.locator('[data-testid="comment-resolve"]').first().click();

    // Comment should be marked as resolved
    await expect(page.locator('[data-testid="comment-resolved"]').first()).toBeVisible();
  });

  test('version history can be created and restored', async ({ page }) => {
    await page.goto('/project/test-project-id');

    // Make a change
    await page.locator('[data-testid="track-1-volume"]').fill('75');

    // Create a version
    await page.locator('[data-testid="version-menu"]').click();
    await page.locator('[data-testid="create-version"]').click();
    await page.locator('[data-testid="version-description"]').fill('Volume adjustment');
    await page.locator('[data-testid="version-save"]').click();

    // Version should appear in history
    await expect(page.locator('[data-testid="version-list"]')).toContainText('Volume adjustment');

    // Make another change
    await page.locator('[data-testid="track-1-volume"]').fill('50');

    // Restore previous version
    await page.locator('[data-testid="version-menu"]').click();
    await page.locator('[data-testid="version-list"]').first().click();
    await page.locator('[data-testid="restore-version"]').click();

    // Volume should be restored to 75
    await expect(page.locator('[data-testid="track-1-volume"]')).toHaveValue('75');
  });

  test('permissions are enforced for viewers', async ({ page }) => {
    // Login as a viewer (not owner or editor)
    await page.goto('/project/test-project-id?role=viewer');

    // Edit buttons should be disabled
    await expect(page.locator('[data-testid="track-add"]')).toBeDisabled();
    await expect(page.locator('[data-testid="track-delete"]')).toBeDisabled();

    // But viewer can still comment
    await expect(page.locator('[data-testid="add-comment-button"]')).toBeEnabled();

    // And viewer can chat
    await expect(page.locator('[data-testid="chat-input"]')).toBeEnabled();
  });

  test('@mentions create notifications', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const page1 = await user1Context.newPage();
    const page2 = await user2Context.newPage();

    await page1.goto('/project/test-project-id');
    await page2.goto('/project/test-project-id');

    // User 1 mentions User 2 in chat
    await page1.locator('[data-testid="chat-input"]').fill('@User2 can you check this?');
    await page1.locator('[data-testid="chat-send"]').click();

    // User 2 should see a notification
    await expect(page2.locator('[data-testid="notification-badge"]')).toBeVisible();
    await expect(page2.locator('[data-testid="notifications"]')).toContainText(
      'User1 mentioned you'
    );

    await user1Context.close();
    await user2Context.close();
  });
});
