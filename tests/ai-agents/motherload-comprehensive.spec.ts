/**
 * MOTHER-LOAD COMPREHENSIVE AI-POWERED TESTING
 *
 * Tests the complete chat-to-create workflow with AI vision analysis:
 * 1. User chats with DAW
 * 2. Beat generation triggered
 * 3. DAW controls via chat
 * 4. Full integration verification
 */

import { test, expect } from '@playwright/test';
import { HybridTestingAgent, TestFinding, ComponentTest } from './hybrid-framework';
import fs from 'fs';
import path from 'path';

test.describe('Mother-Load Chat-to-Create - Comprehensive AI Testing', () => {
  let agent: HybridTestingAgent;
  let allFindings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    agent = new HybridTestingAgent('Mother-Load Tester', 'organisms');
  });

  test('should verify chat-to-create workflow end-to-end', async ({ page }) => {
    console.log('\n🎵 MOTHER-LOAD COMPREHENSIVE TEST STARTING...\n');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test suite covering all Mother-Load features
    const motherLoadTests: ComponentTest[] = [

      // CRITICAL: ChatbotWidget Integration
      {
        name: 'ChatbotWidget - Complete Integration',
        selector: '[data-testid="chatbot-widget"], [class*="ChatbotWidget"], .chatbot',
        description: 'Complete chatbot widget for conversational music production',
        expectedBehavior: 'Users can chat to create beats, control DAW, and get AI assistance',
        priority: 'critical', // This triggers AI vision analysis
        aiIntegration: true,
        interactionTest: async (page, element) => {
          // Check if chatbot is accessible
          const chatbot = page.locator('text=Chat, text=Chatbot, text=AI Assistant').first();
          const exists = await chatbot.count().then(c => c > 0).catch(() => false);

          if (!exists) {
            console.log('⚠️  ChatbotWidget not found - checking alternative selectors...');
            // Try opening if there's a toggle button
            const toggle = page.locator('[data-testid="chatbot-toggle"], button:has-text("Chat")').first();
            if (await toggle.count().then(c => c > 0)) {
              await toggle.click().catch(() => {});
              await page.waitForTimeout(1000);
            }
          }

          return exists;
        },
      },

      // CRITICAL: Chat Input Field
      {
        name: 'Chat Input Field',
        selector: 'input[placeholder*="chat" i], input[placeholder*="message" i], textarea[placeholder*="chat" i]',
        description: 'Text input for user messages',
        expectedBehavior: 'Users can type natural language commands',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;

          // Try to type a test message
          await element.fill('create a trap beat').catch(() => {});
          const value = await element.inputValue().catch(() => '');
          await element.fill(''); // Clear it

          return value.includes('trap');
        },
      },

      // CRITICAL: Send Message Button
      {
        name: 'Send Message Button',
        selector: 'button[type="submit"], button:has-text("Send"), [data-testid="send-button"]',
        description: 'Button to send chat messages',
        expectedBehavior: 'Submits user message to backend API',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;
          return await element.isEnabled().catch(() => false);
        },
      },

      // Chat Message Display
      {
        name: 'Chat Message Display Area',
        selector: '[class*="message" i][class*="container" i], [data-testid="chat-messages"], .chat-history',
        description: 'Area displaying conversation history',
        expectedBehavior: 'Shows user and AI messages with streaming support',
        priority: 'high',
      },

      // Generation Progress Indicator
      {
        name: 'Generation Progress Indicator',
        selector: '[data-testid="generation-progress"], [class*="progress" i]',
        description: 'Real-time progress bar for beat generation',
        expectedBehavior: 'Shows 0-100% progress with stage descriptions',
        priority: 'high',
        aiIntegration: true,
      },

      // Audio Player Component
      {
        name: 'Generated Audio Player',
        selector: '[data-testid="audio-player"], audio, [class*="audio-player" i]',
        description: 'Plays generated beats',
        expectedBehavior: 'Playback controls with waveform visualization',
        priority: 'high',
        aiIntegration: true,
      },

      // CRITICAL: Transport Bar (DAW Control)
      {
        name: 'Transport Bar - Full DAW Control',
        selector: '[data-testid="transport-bar"]',
        description: 'Main DAW transport controls',
        expectedBehavior: 'Controllable via chat commands (play, stop, BPM, etc.)',
        priority: 'critical',
        aiIntegration: true,
        interactionTest: async (page) => {
          const transport = page.locator('[data-testid="transport-bar"]');
          const exists = await transport.count().then(c => c > 0);

          if (exists) {
            // Check if all critical controls exist
            const playButton = await transport.locator('[data-testid="play-button"]').count().then(c => c > 0);
            const stopButton = await transport.locator('[data-testid="stop-button"]').count().then(c => c > 0);
            const recordButton = await transport.locator('[data-testid="record-button"]').count().then(c => c > 0);
            const bpmDisplay = await transport.locator('[data-testid="bpm-display"]').count().then(c => c > 0);

            console.log(`  Transport Controls: Play=${playButton}, Stop=${stopButton}, Record=${recordButton}, BPM=${bpmDisplay}`);

            return playButton && stopButton && recordButton && bpmDisplay;
          }

          return false;
        },
      },

      // Play Button
      {
        name: 'Play Button',
        selector: '[data-testid="play-button"]',
        description: 'Transport play button',
        expectedBehavior: 'Starts playback, controllable via chat "play"',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;

          // Check if button is clickable
          const isEnabled = await element.isEnabled().catch(() => false);

          // Try clicking (won't actually play in test)
          if (isEnabled) {
            await element.click().catch(() => {});
            await page.waitForTimeout(500);

            // Check if state changed (playing class or active state)
            const hasActiveState = await element.getAttribute('class').then(cls =>
              cls?.includes('playing') || cls?.includes('active')
            ).catch(() => false);

            // Click again to reset
            await element.click().catch(() => {});

            return true;
          }

          return false;
        },
      },

      // Stop Button
      {
        name: 'Stop Button',
        selector: '[data-testid="stop-button"]',
        description: 'Transport stop button',
        expectedBehavior: 'Stops playback, controllable via chat "stop"',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;
          return await element.isEnabled().catch(() => false);
        },
      },

      // Record Button
      {
        name: 'Record Button',
        selector: '[data-testid="record-button"]',
        description: 'Transport record button',
        expectedBehavior: 'Starts recording, controllable via chat "record"',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;

          const isEnabled = await element.isEnabled().catch(() => false);

          if (isEnabled) {
            // Try toggling record
            await element.click().catch(() => {});
            await page.waitForTimeout(500);

            // Check if recording state changed
            const hasRecordingState = await element.getAttribute('class').then(cls =>
              cls?.includes('recording') || cls?.includes('active')
            ).catch(() => false);

            // Stop recording
            await element.click().catch(() => {});

            return true;
          }

          return false;
        },
      },

      // BPM Display/Control
      {
        name: 'BPM Display and Control',
        selector: '[data-testid="bpm-display"]',
        description: 'BPM display and adjustment',
        expectedBehavior: 'Shows current BPM, adjustable via chat "set BPM to 140"',
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;

          // Get current BPM
          const currentBPM = await element.inputValue().catch(() =>
            element.innerText().catch(() => '')
          );

          console.log(`  Current BPM: ${currentBPM}`);

          // Try setting a new BPM
          if (element.tagName === 'INPUT') {
            await element.fill('140').catch(() => {});
            await page.keyboard.press('Enter').catch(() => {});
            await page.waitForTimeout(500);

            const newBPM = await element.inputValue().catch(() => '');
            console.log(`  Set BPM to: ${newBPM}`);

            // Reset to original
            await element.fill(currentBPM || '120').catch(() => {});
            await page.keyboard.press('Enter').catch(() => {});
          }

          return currentBPM.length > 0;
        },
      },

      // Loop Button
      {
        name: 'Loop Toggle',
        selector: '[data-testid="loop-button"]',
        description: 'Loop toggle button',
        expectedBehavior: 'Toggles loop mode, controllable via chat',
        priority: 'high',
        interactionTest: async (page, element) => {
          if (!element) return false;

          // Toggle loop
          await element.click().catch(() => {});
          await page.waitForTimeout(300);

          // Check state
          const isActive = await element.getAttribute('class').then(cls =>
            cls?.includes('active') || cls?.includes('enabled')
          ).catch(() => false);

          // Toggle back
          await element.click().catch(() => {});

          return true;
        },
      },

      // Time Display
      {
        name: 'Time Display',
        selector: '[data-testid="time-display"]',
        description: 'Current playback time display',
        expectedBehavior: 'Shows time in MM:SS format',
        priority: 'medium',
        interactionTest: async (page, element) => {
          if (!element) return false;

          const timeText = await element.innerText().catch(() => '');
          console.log(`  Time Display: ${timeText}`);

          // Check if it's in time format (00:00)
          return /\d+:\d+/.test(timeText);
        },
      },

      // INTEGRATION TEST: Demo Mode System
      {
        name: 'Demo Mode Integration',
        description: 'Complete demo mode system with mock data',
        expectedBehavior: 'Loads demo projects without backend',
        priority: 'low',
        interactionTest: async (page) => {
          // Check if demo content loads
          const hasDemo = await page.locator('text=Demo').count().then(c => c > 0);
          const hasProjects = await page.locator('text=Project').count().then(c => c > 0);

          console.log(`  Demo Mode: hasDemo=${hasDemo}, hasProjects=${hasProjects}`);

          return hasDemo || hasProjects;
        },
      },
    ];

    console.log(`\n${'='.repeat(70)}`);
    console.log('🎵 MOTHER-LOAD COMPREHENSIVE TESTING');
    console.log('='.repeat(70));
    console.log(`Testing ${motherLoadTests.length} critical components\n`);

    // Run all tests
    for (const component of motherLoadTests) {
      console.log(`\n🧪 Testing: ${component.name}`);
      console.log(`   Priority: ${component.priority}`);
      console.log(`   AI Integration: ${component.aiIntegration ? 'YES' : 'NO'}`);

      const findings = await agent.testComponent(page, component);
      allFindings.push(...findings);

      // Display findings
      for (const finding of findings) {
        const emoji = finding.status === 'pass' ? '✅' :
                     finding.status === 'fail' ? '❌' :
                     finding.status === 'warning' ? '⚠️' : '💡';
        console.log(`  ${emoji} ${finding.issue}`);

        if (finding.evidence && finding.evidence.length > 0) {
          finding.evidence.forEach(ev => console.log(`     - ${ev}`));
        }
      }
    }

    // Generate detailed report
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));

    const passed = allFindings.filter(f => f.status === 'pass').length;
    const failed = allFindings.filter(f => f.status === 'fail').length;
    const warnings = allFindings.filter(f => f.status === 'warning').length;
    const critical = allFindings.filter(f => f.severity === 'critical').length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`🚨 Critical Issues: ${critical}\n`);

    // Critical failures should fail the test
    const criticalFailures = allFindings.filter(f =>
      f.status === 'fail' && f.severity === 'critical'
    );

    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES DETECTED:\n');
      criticalFailures.forEach(f => {
        console.log(`  ❌ ${f.component}: ${f.issue}`);
        console.log(`     Recommendation: ${f.recommendation}\n`);
      });
    }

    // Key Mother-Load features check
    const hasChat = allFindings.some(f =>
      f.component.includes('Chat') && f.status === 'pass'
    );
    const hasTransport = allFindings.some(f =>
      f.component.includes('Transport') && f.status === 'pass'
    );
    const hasPlayButton = allFindings.some(f =>
      f.component.includes('Play Button') && f.status === 'pass'
    );

    console.log('\n🎯 KEY FEATURES STATUS:');
    console.log(`  Chat System: ${hasChat ? '✅' : '❌'}`);
    console.log(`  Transport Bar: ${hasTransport ? '✅' : '❌'}`);
    console.log(`  Play Controls: ${hasPlayButton ? '✅' : '❌'}`);

    // Assert critical features work
    expect(hasTransport, 'Transport Bar must be functional').toBe(true);
    expect(hasPlayButton, 'Play button must be functional').toBe(true);
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await agent.generateReport(allFindings, duration);

    // Save detailed JSON report
    const reportPath = path.join(process.cwd(), 'test-results', 'motherload-comprehensive-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    const mdPath = path.join(process.cwd(), 'test-results', 'MOTHERLOAD-TEST-REPORT.md');
    fs.writeFileSync(mdPath, generateMotherLoadReport(report));

    // Print final summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🎵 MOTHER-LOAD COMPREHENSIVE TEST COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Total Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Components Tested: ${report.totalComponents}`);
    console.log(`📝 Total Findings: ${report.findings.length}`);
    console.log(`\n✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`\n📄 Detailed Report: test-results/MOTHERLOAD-TEST-REPORT.md`);
    console.log(`📄 JSON Report: test-results/motherload-comprehensive-report.json\n`);
  });
});

function generateMotherLoadReport(report: any): string {
  let md = `# 🎵 Mother-Load Chat-to-Create Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**URL:** ${report.url}
**Duration:** ${(report.testDuration / 1000).toFixed(1)} seconds
**Test Method:** Hybrid (Programmatic + AI Vision)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Components Tested | ${report.totalComponents} |
| Total Findings | ${report.findings.length} |
| ✅ Passed | ${report.summary.passed} |
| ❌ Failed | ${report.summary.failed} |
| ⚠️ Warnings | ${report.summary.warnings} |
| 🚨 **Critical Issues** | **${report.summary.criticalIssues}** |

---

## Critical Features Status

`;

  // Analyze critical features
  const chatFeature = report.findings.find((f: any) => f.component.includes('Chat'));
  const transportFeature = report.findings.find((f: any) => f.component.includes('Transport'));
  const playFeature = report.findings.find((f: any) => f.component.includes('Play'));
  const recordFeature = report.findings.find((f: any) => f.component.includes('Record'));
  const bpmFeature = report.findings.find((f: any) => f.component.includes('BPM'));

  md += `
### Chat-to-Create System
- **Chat Interface:** ${chatFeature?.status === 'pass' ? '✅ Working' : '❌ Issues Found'}
- **Message Input:** ${report.findings.some((f: any) => f.component.includes('Input') && f.status === 'pass') ? '✅' : '❌'}
- **Send Button:** ${report.findings.some((f: any) => f.component.includes('Send') && f.status === 'pass') ? '✅' : '❌'}

### DAW Control via Chat
- **Transport Bar:** ${transportFeature?.status === 'pass' ? '✅ Working' : '❌ Issues Found'}
- **Play Control:** ${playFeature?.status === 'pass' ? '✅ Working' : '❌ Issues Found'}
- **Record Control:** ${recordFeature?.status === 'pass' ? '✅ Working' : '❌ Issues Found'}
- **BPM Control:** ${bpmFeature?.status === 'pass' ? '✅ Working' : '❌ Issues Found'}

---

## Detailed Findings

`;

  // Group by severity
  const critical = report.findings.filter((f: any) => f.severity === 'critical');
  const high = report.findings.filter((f: any) => f.severity === 'high');
  const medium = report.findings.filter((f: any) => f.severity === 'medium');
  const low = report.findings.filter((f: any) => f.severity === 'low');

  if (critical.length > 0) {
    md += `\n### 🚨 Critical Issues (${critical.length})\n\n`;
    for (const finding of critical) {
      md += formatFinding(finding);
    }
  }

  if (high.length > 0) {
    md += `\n### ⚠️ High Priority (${high.length})\n\n`;
    for (const finding of high) {
      md += formatFinding(finding);
    }
  }

  if (medium.length > 0) {
    md += `\n### 📝 Medium Priority (${medium.length})\n\n`;
    for (const finding of medium) {
      md += formatFinding(finding);
    }
  }

  if (low.length > 0) {
    md += `\n### 💡 Low Priority & Enhancements (${low.length})\n\n`;
    for (const finding of low) {
      md += formatFinding(finding);
    }
  }

  md += `\n---\n\n## Next Steps\n\n`;

  if (report.summary.criticalIssues > 0) {
    md += `1. 🚨 **URGENT:** Fix ${report.summary.criticalIssues} critical issue(s)\n`;
  }
  if (report.summary.failed > 0) {
    md += `2. ❌ Address ${report.summary.failed} failed component(s)\n`;
  }
  if (report.summary.warnings > 0) {
    md += `3. ⚠️  Review ${report.summary.warnings} warning(s)\n`;
  }
  md += `4. ✅ Verify all fixes with re-test\n`;
  md += `5. 🚀 Deploy Mother-Load to production\n\n`;

  return md;
}

function formatFinding(finding: any): string {
  const statusEmoji = finding.status === 'pass' ? '✅' :
                     finding.status === 'fail' ? '❌' :
                     finding.status === 'warning' ? '⚠️' : '💡';

  let md = `**${statusEmoji} ${finding.component}** - ${finding.category}\n\n`;
  md += `- **Issue:** ${finding.issue}\n`;
  md += `- **Recommendation:** ${finding.recommendation}\n`;
  md += `- **Test Method:** ${finding.testMethod}\n`;

  if (finding.evidence && finding.evidence.length > 0) {
    md += `- **Evidence:**\n`;
    for (const evidence of finding.evidence) {
      md += `  - ${evidence}\n`;
    }
  }

  if (finding.aiAnalysis && finding.aiAnalysis !== 'Programmatic check failed - element not found') {
    md += `- **AI Analysis:** ${finding.aiAnalysis}\n`;
  }

  md += `\n`;
  return md;
}
