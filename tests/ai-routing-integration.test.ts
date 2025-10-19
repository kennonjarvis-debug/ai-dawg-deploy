import { test, expect } from '@playwright/test';

/**
 * AI Routing Integration Test
 *
 * Tests Logic Pro X-style routing capabilities through AI commands:
 * - Creating aux tracks (mono/stereo)
 * - Creating audio tracks (mono/stereo)
 * - Creating sends (pre-fader/post-fader)
 * - Controlling track parameters (volume, pan, mute, solo)
 * - End-to-end workflows (reverb bus, parallel compression)
 */

test.describe('AI Routing Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DAW
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="daw-dashboard"]', { timeout: 10000 });

    // Open AI chat widget
    const chatButton = page.locator('button:has-text("AI Assistant")').first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }
  });

  test('should create stereo aux track via AI', async ({ page }) => {
    // Send AI command
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Create a stereo aux track called "Reverb"');
    await chatInput.press('Enter');

    // Wait for AI response
    await page.waitForSelector('text=/Created.*aux track.*Reverb/i', { timeout: 15000 });

    // Verify track was created
    const track = page.locator('[data-track-name="Reverb"]');
    await expect(track).toBeVisible({ timeout: 5000 });
  });

  test('should create mono aux track via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Create a mono aux track called "Vocal Reverb"');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/Created.*aux track.*Vocal Reverb/i', { timeout: 15000 });

    const track = page.locator('[data-track-name="Vocal Reverb"]');
    await expect(track).toBeVisible({ timeout: 5000 });
  });

  test('should create stereo audio track via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Create a stereo audio track called "Lead Vocals"');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/Created.*audio track.*Lead Vocals/i', { timeout: 15000 });

    const track = page.locator('[data-track-name="Lead Vocals"]');
    await expect(track).toBeVisible({ timeout: 5000 });
  });

  test('should create mono audio track via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');
    await chatInput.fill('Create a mono audio track called "Kick Drum"');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/Created.*audio track.*Kick Drum/i', { timeout: 15000 });

    const track = page.locator('[data-track-name="Kick Drum"]');
    await expect(track).toBeVisible({ timeout: 5000 });
  });

  test('should set up reverb bus with sends via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // First create some audio tracks
    await chatInput.fill('Create audio tracks called "Vocals" and "Guitar"');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Ask AI to set up reverb
    await chatInput.fill('Set up a reverb bus for the vocals and guitar tracks');
    await chatInput.press('Enter');

    // Wait for AI to create reverb aux and sends
    await page.waitForSelector('text=/reverb/i', { timeout: 15000 });

    // Verify reverb aux was created
    const reverbTrack = page.locator('[data-track-name*="Reverb"]');
    await expect(reverbTrack).toBeVisible({ timeout: 5000 });
  });

  test('should set up delay send via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create a vocal track
    await chatInput.fill('Create an audio track called "Lead Vocal"');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Ask for delay
    await chatInput.fill('Add a delay send to the Lead Vocal track at 30%');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/delay/i', { timeout: 15000 });
  });

  test('should set up parallel compression via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create drum tracks
    await chatInput.fill('Create audio tracks for kick, snare, and hi-hat');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Ask for parallel compression
    await chatInput.fill('Set up parallel compression for the drum tracks');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/parallel|compression/i', { timeout: 15000 });
  });

  test('should control track volume via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create a track
    await chatInput.fill('Create an audio track called "Bass"');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Set volume
    await chatInput.fill('Set the Bass track volume to 80%');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/volume|set/i', { timeout: 15000 });
  });

  test('should control track pan via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create a track
    await chatInput.fill('Create an audio track called "Guitar"');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Pan left
    await chatInput.fill('Pan the Guitar track 30% to the left');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/pan/i', { timeout: 15000 });
  });

  test('should mute track via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create a track
    await chatInput.fill('Create an audio track called "Drums"');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Mute it
    await chatInput.fill('Mute the Drums track');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/mute/i', { timeout: 15000 });
  });

  test('should solo track via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create tracks
    await chatInput.fill('Create audio tracks called "Vocals" and "Bass"');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Solo vocals
    await chatInput.fill('Solo the Vocals track');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/solo/i', { timeout: 15000 });
  });

  test('should create complete mix setup via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Upload some audio files first (simulate)
    // In a real test, you would upload actual files

    // Ask AI to create a complete mix
    await chatInput.fill('Create a professional mix setup with reverb, delay, and compression buses');
    await chatInput.press('Enter');

    // Wait for AI to create all the routing
    await page.waitForTimeout(10000);

    // Verify multiple aux tracks were created
    const auxTracks = page.locator('[data-track-type="aux"]');
    const count = await auxTracks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle complex routing command via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Complex command
    await chatInput.fill('Create a vocal chain with a stereo reverb bus at 25% send level and a mono delay at 15%');
    await chatInput.press('Enter');

    await page.waitForTimeout(10000);

    // Verify reverb and delay tracks exist
    const reverbTrack = page.locator('[data-track-name*="Reverb"]');
    const delayTrack = page.locator('[data-track-name*="Delay"]');

    await expect(reverbTrack).toBeVisible({ timeout: 5000 });
    await expect(delayTrack).toBeVisible({ timeout: 5000 });
  });

  test('should get all tracks via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create some tracks
    await chatInput.fill('Create audio tracks called Track1, Track2, and Track3');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Ask AI to list tracks
    await chatInput.fill('List all tracks in the project');
    await chatInput.press('Enter');

    // Should see track names in response
    await page.waitForSelector('text=/Track1|Track2|Track3/i', { timeout: 15000 });
  });

  test('should remove send via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create track and reverb
    await chatInput.fill('Create an audio track called "Vocals" and a reverb bus');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Create send
    await chatInput.fill('Send the Vocals to the reverb');
    await chatInput.press('Enter');
    await page.waitForTimeout(2000);

    // Remove send
    await chatInput.fill('Remove the reverb send from Vocals');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/remove|deleted/i', { timeout: 15000 });
  });

  test('should set send level via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create setup
    await chatInput.fill('Create a vocal track with reverb at 50% send level');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Adjust send level
    await chatInput.fill('Change the reverb send to 80%');
    await chatInput.press('Enter');

    await page.waitForSelector('text=/send|80/i', { timeout: 15000 });
  });

  test('should handle pre-fader vs post-fader sends via AI', async ({ page }) => {
    const chatInput = page.locator('[data-testid="ai-chat-input"]');

    // Create headphone mix with pre-fader sends
    await chatInput.fill('Create a headphone mix aux with pre-fader sends from all tracks');
    await chatInput.press('Enter');

    await page.waitForTimeout(5000);

    // Verify headphone mix was created
    const headphoneMix = page.locator('[data-track-name*="Headphone"]');
    await expect(headphoneMix).toBeVisible({ timeout: 5000 });
  });
});
