/**
 * Test Agent 3: Beat Generation & Audio System Validator
 *
 * This test validates:
 * - Audio player component existence
 * - Generation progress indicators
 * - Demo content availability
 * - Audio playback functionality
 * - Waveform/visualization components
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SITE_URL = 'https://www.dawg-ai.com';
const SCREENSHOT_DIR = path.join(__dirname, '../../test-results/audio-system');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('Beat Generation & Audio System Validation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(2000);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Check for audio player components', async () => {
    console.log('\n=== TESTING AUDIO PLAYER COMPONENTS ===\n');

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-initial-page.png'),
      fullPage: true
    });

    // Check for audio elements
    const audioElements = await page.locator('audio').count();
    console.log(`Audio elements found: ${audioElements}`);

    // Check for common audio player selectors
    const audioPlayerSelectors = [
      '[data-testid="audio-player"]',
      '[class*="audio-player"]',
      '[class*="AudioPlayer"]',
      '[id*="audio-player"]',
      'audio',
      '.player',
      '[role="region"][aria-label*="audio"]',
      '[role="region"][aria-label*="player"]',
    ];

    let playerFound = false;
    for (const selector of audioPlayerSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found audio player with selector: ${selector} (${count} instances)`);
        playerFound = true;
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `02-audio-player-${selector.replace(/[^a-z0-9]/gi, '-')}.png`),
          fullPage: true
        });
      }
    }

    if (!playerFound) {
      console.log('❌ No audio player found');
    }

    // Check page content for audio-related text
    const pageContent = await page.content();
    const hasAudioReferences = pageContent.includes('audio') ||
                               pageContent.includes('player') ||
                               pageContent.includes('play') ||
                               pageContent.includes('pause');
    console.log(`Page contains audio-related keywords: ${hasAudioReferences}`);
  });

  test('Check for generation progress indicators', async () => {
    console.log('\n=== TESTING GENERATION PROGRESS INDICATORS ===\n');

    // Check for progress indicators
    const progressSelectors = [
      '[data-testid="generation-progress"]',
      '[class*="progress"]',
      '[class*="Progress"]',
      '[role="progressbar"]',
      '.loading',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="Spinner"]',
    ];

    let progressFound = false;
    for (const selector of progressSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found progress indicator: ${selector} (${count} instances)`);
        progressFound = true;

        // Get details about the progress element
        const elements = await page.locator(selector).all();
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          const isVisible = await elements[i].isVisible();
          console.log(`  - Instance ${i + 1}: visible=${isVisible}, text="${text?.trim()}"`);
        }
      }
    }

    if (!progressFound) {
      console.log('❌ No progress indicators found');
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-progress-indicators.png'),
      fullPage: true
    });
  });

  test('Check for demo content and beats', async () => {
    console.log('\n=== TESTING DEMO CONTENT ===\n');

    // Look for demo content
    const demoSelectors = [
      'text=/demo/i',
      'text=/example/i',
      'text=/sample/i',
      '[data-testid*="demo"]',
      '[class*="demo"]',
      '[id*="demo"]',
    ];

    let demoFound = false;
    for (const selector of demoSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found demo content: ${selector} (${count} instances)`);
        demoFound = true;

        const elements = await page.locator(selector).all();
        for (let i = 0; i < Math.min(elements.length, 5); i++) {
          const text = await elements[i].textContent();
          console.log(`  - ${text?.trim().substring(0, 100)}`);
        }
      }
    }

    if (!demoFound) {
      console.log('❌ No demo content found');
    }

    // Look for project/beat/song references
    const contentKeywords = ['project', 'beat', 'song', 'track', 'generation'];
    for (const keyword of contentKeywords) {
      const count = await page.locator(`text=/${keyword}/i`).count();
      if (count > 0) {
        console.log(`Found "${keyword}" references: ${count}`);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-demo-content.png'),
      fullPage: true
    });
  });

  test('Check for waveform and audio visualizations', async () => {
    console.log('\n=== TESTING AUDIO VISUALIZATIONS ===\n');

    // Look for waveform/visualization elements
    const visualizationSelectors = [
      '[class*="waveform"]',
      '[class*="Waveform"]',
      '[data-testid*="waveform"]',
      'canvas',
      '[class*="visualization"]',
      '[class*="Visualization"]',
      'svg[class*="audio"]',
      'svg[class*="wave"]',
    ];

    let vizFound = false;
    for (const selector of visualizationSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found visualization element: ${selector} (${count} instances)`);
        vizFound = true;

        // Take screenshot highlighting these elements
        const elements = await page.locator(selector).all();
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const isVisible = await elements[i].isVisible();
          const bbox = await elements[i].boundingBox();
          console.log(`  - Instance ${i + 1}: visible=${isVisible}, size=${bbox?.width}x${bbox?.height}`);
        }
      }
    }

    if (!vizFound) {
      console.log('❌ No audio visualization found');
    }

    // Check for canvas elements specifically
    const canvasCount = await page.locator('canvas').count();
    console.log(`Canvas elements found: ${canvasCount}`);
    if (canvasCount > 0) {
      const canvases = await page.locator('canvas').all();
      for (let i = 0; i < canvases.length; i++) {
        const bbox = await canvases[i].boundingBox();
        console.log(`  - Canvas ${i + 1}: ${bbox?.width}x${bbox?.height}`);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-visualizations.png'),
      fullPage: true
    });
  });

  test('Interact with any demo content found', async () => {
    console.log('\n=== TESTING DEMO INTERACTIONS ===\n');

    // Try to find and click on demo content
    const clickableDemo = [
      'button:has-text("Demo")',
      'button:has-text("Example")',
      'button:has-text("Try")',
      '[data-testid="demo-project"]',
      '[data-testid="demo-beat"]',
      'text=/demo project/i',
      'text=/example beat/i',
    ];

    let clicked = false;
    for (const selector of clickableDemo) {
      try {
        const element = page.locator(selector).first();
        const count = await page.locator(selector).count();
        if (count > 0) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            console.log(`Clicking on: ${selector}`);
            await element.click();
            clicked = true;

            // Wait for any loading/transition
            await page.waitForTimeout(2000);

            await page.screenshot({
              path: path.join(SCREENSHOT_DIR, `06-after-click-${selector.replace(/[^a-z0-9]/gi, '-')}.png`),
              fullPage: true
            });

            // Check if audio player appeared
            const audioAfterClick = await page.locator('audio').count();
            console.log(`Audio elements after click: ${audioAfterClick}`);

            break;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!clicked) {
      console.log('❌ No clickable demo content found');
    }
  });

  test('Check for play/pause controls', async () => {
    console.log('\n=== TESTING PLAYBACK CONTROLS ===\n');

    // Look for play/pause buttons
    const controlSelectors = [
      'button:has-text("Play")',
      'button:has-text("Pause")',
      'button[aria-label*="play"]',
      'button[aria-label*="pause"]',
      '[data-testid="play-button"]',
      '[data-testid="pause-button"]',
      'button[class*="play"]',
      'button[class*="pause"]',
      '[role="button"][aria-label*="play"]',
    ];

    let controlsFound = false;
    for (const selector of controlSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found control: ${selector} (${count} instances)`);
        controlsFound = true;

        const elements = await page.locator(selector).all();
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          const isVisible = await elements[i].isVisible();
          const isEnabled = await elements[i].isEnabled();
          console.log(`  - Instance ${i + 1}: visible=${isVisible}, enabled=${isEnabled}, text="${text?.trim()}"`);
        }
      }
    }

    if (!controlsFound) {
      console.log('❌ No playback controls found');
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-playback-controls.png'),
      fullPage: true
    });
  });

  test('Check console for audio/generation errors', async () => {
    console.log('\n=== CHECKING CONSOLE ERRORS ===\n');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Navigate and wait for any console messages
    await page.reload();
    await page.waitForTimeout(3000);

    console.log(`Console errors: ${errors.length}`);
    errors.forEach((err, i) => {
      console.log(`  Error ${i + 1}: ${err.substring(0, 200)}`);
    });

    console.log(`Console warnings: ${warnings.length}`);
    warnings.forEach((warn, i) => {
      console.log(`  Warning ${i + 1}: ${warn.substring(0, 200)}`);
    });

    // Filter for audio/generation related errors
    const audioErrors = errors.filter(e =>
      e.toLowerCase().includes('audio') ||
      e.toLowerCase().includes('player') ||
      e.toLowerCase().includes('generation') ||
      e.toLowerCase().includes('beat')
    );

    if (audioErrors.length > 0) {
      console.log(`\n❌ Audio-related errors found: ${audioErrors.length}`);
      audioErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ No audio-related errors found');
    }
  });

  test('Generate comprehensive report', async () => {
    console.log('\n=== GENERATING COMPREHENSIVE REPORT ===\n');

    const report = {
      timestamp: new Date().toISOString(),
      siteUrl: SITE_URL,
      findings: {
        audioPlayer: {
          exists: false,
          count: 0,
          details: [] as string[]
        },
        progressIndicators: {
          exists: false,
          count: 0,
          details: [] as string[]
        },
        demoContent: {
          exists: false,
          count: 0,
          details: [] as string[]
        },
        visualizations: {
          exists: false,
          count: 0,
          details: [] as string[]
        },
        playbackControls: {
          exists: false,
          count: 0,
          details: [] as string[]
        }
      }
    };

    // Audio player check
    const audioCount = await page.locator('audio').count();
    report.findings.audioPlayer.count = audioCount;
    report.findings.audioPlayer.exists = audioCount > 0;
    if (audioCount > 0) {
      report.findings.audioPlayer.details.push(`${audioCount} audio elements found`);
    }

    // Progress indicators
    const progressCount = await page.locator('[role="progressbar"]').count();
    report.findings.progressIndicators.count = progressCount;
    report.findings.progressIndicators.exists = progressCount > 0;

    // Demo content
    const demoCount = await page.locator('text=/demo/i').count();
    report.findings.demoContent.count = demoCount;
    report.findings.demoContent.exists = demoCount > 0;

    // Visualizations
    const canvasCount = await page.locator('canvas').count();
    report.findings.visualizations.count = canvasCount;
    report.findings.visualizations.exists = canvasCount > 0;

    // Playback controls
    const playButtonCount = await page.locator('button:has-text("Play")').count();
    report.findings.playbackControls.count = playButtonCount;
    report.findings.playbackControls.exists = playButtonCount > 0;

    // Save report
    const reportPath = path.join(SCREENSHOT_DIR, 'audio-system-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportPath}`);

    // Print summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Audio Player: ${report.findings.audioPlayer.exists ? '✅' : '❌'} (${report.findings.audioPlayer.count} found)`);
    console.log(`Progress Indicators: ${report.findings.progressIndicators.exists ? '✅' : '❌'} (${report.findings.progressIndicators.count} found)`);
    console.log(`Demo Content: ${report.findings.demoContent.exists ? '✅' : '❌'} (${report.findings.demoContent.count} found)`);
    console.log(`Visualizations: ${report.findings.visualizations.exists ? '✅' : '❌'} (${report.findings.visualizations.count} found)`);
    console.log(`Playback Controls: ${report.findings.playbackControls.exists ? '✅' : '❌'} (${report.findings.playbackControls.count} found)`);
    console.log('\n===================\n');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-final-state.png'),
      fullPage: true
    });
  });
});
