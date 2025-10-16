/**
 * FAST Comprehensive Component Testing
 * Uses programmatic checks only - completes in < 2 minutes
 *
 * This provides immediate, actionable feedback on ALL components
 * AI vision analysis can be done separately for visual/UX insights
 */

import { test, expect } from '@playwright/test';
import { HybridTestingAgent, TestFinding, AITestReport, ComponentTest } from './hybrid-framework';
import fs from 'fs';
import path from 'path';

test.describe('Fast Comprehensive Testing - All Components', () => {
  let agent: HybridTestingAgent;
  let allFindings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    agent = new HybridTestingAgent('Fast Comprehensive Tester', 'atoms');
  });

  test('should test all interactive components with fast checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All components marked as "low" priority = fast programmatic checks only
    const components: ComponentTest[] = [
      // BUTTONS
      {
        name: 'New Project Button',
        selector: 'button:has-text("New Project"), [data-testid="new-project-button"]',
        description: 'Primary CTA button for creating projects',
        expectedBehavior: 'Clicks should open project creation modal',
        priority: 'low', // Fast check only
        interactionTest: async (page, element) => {
          if (!element) return false;
          return await element.isEnabled().catch(() => false);
        },
      },
      {
        name: 'Logout Button',
        selector: 'button:has-text("Logout"), button:has-text("Sign Out")',
        description: 'User logout button',
        expectedBehavior: 'Logs user out',
        priority: 'low',
        interactionTest: async (page, element) => {
          if (!element) return false;
          return await element.isVisible().catch(() => false);
        },
      },
      {
        name: 'Filter Button',
        selector: 'button:has-text("Filter"), [aria-label*="filter" i]',
        description: 'Project filter button',
        expectedBehavior: 'Opens filter options',
        priority: 'low',
      },
      {
        name: 'Close Modal Button',
        selector: 'button:has-text("Close"), button:has-text("Cancel")',
        description: 'Modal dismiss button',
        expectedBehavior: 'Closes modals',
        priority: 'low',
      },

      // INPUTS
      {
        name: 'Search Projects Input',
        selector: 'input[placeholder*="Search" i], input[type="search"]',
        description: 'Project search input',
        expectedBehavior: 'Filters projects in real-time',
        priority: 'low',
        interactionTest: async (page, element) => {
          if (!element) return false;
          await element.fill('test').catch(() => {});
          const value = await element.inputValue().catch(() => '');
          await element.fill('');
          return value === 'test';
        },
      },
      {
        name: 'Email Input',
        selector: 'input[type="email"], input[placeholder*="email" i]',
        description: 'Email authentication input',
        expectedBehavior: 'Validates email format',
        priority: 'low',
        interactionTest: async (page, element) => {
          if (!element) return false;
          await element.fill('test@example.com').catch(() => {});
          const value = await element.inputValue().catch(() => '');
          await element.fill('');
          return value.includes('@');
        },
      },
      {
        name: 'Password Input',
        selector: 'input[type="password"]',
        description: 'Password authentication input',
        expectedBehavior: 'Masks password input',
        priority: 'low',
        interactionTest: async (page, element) => {
          if (!element) return false;
          const type = await element.getAttribute('type').catch(() => '');
          return type === 'password';
        },
      },

      // MOLECULES
      {
        name: 'Login Form',
        selector: 'form:has(input[type="email"]):has(input[type="password"])',
        description: 'Authentication form',
        expectedBehavior: 'Collects and validates credentials',
        priority: 'low',
        interactionTest: async (page, element) => {
          if (!element) return false;
          const hasEmail = await element.locator('input[type="email"]').count().then(c => c > 0);
          const hasPassword = await element.locator('input[type="password"]').count().then(c => c > 0);
          return hasEmail && hasPassword;
        },
      },
      {
        name: 'Project Card',
        selector: '[class*="project" i][class*="card" i], [class*="ProjectCard"]',
        description: 'Project display card',
        expectedBehavior: 'Shows project metadata and actions',
        priority: 'low',
      },
      {
        name: 'Application Header',
        selector: 'header, [role="banner"], nav[class*="header" i]',
        description: 'Top navigation bar',
        expectedBehavior: 'Provides navigation and branding',
        priority: 'low',
      },
      {
        name: 'Logo',
        selector: 'img[alt*="logo" i], svg[class*="logo" i]',
        description: 'Application logo',
        expectedBehavior: 'Displays brand identity',
        priority: 'low',
      },

      // AI INTEGRATION
      {
        name: 'Demo Mode System',
        description: 'System for demo mode operation',
        expectedBehavior: 'Loads mock data without errors',
        aiIntegration: true,
        priority: 'low', // Even AI components use fast checks first
        interactionTest: async (page) => {
          const hasProjects = await page.locator('text=Demo Song').count().then(c => c > 0);
          const hasProjects2 = await page.locator('text=Demo Project').count().then(c => c > 0);
          return hasProjects || hasProjects2;
        },
      },
    ];

    console.log(`\n${'='.repeat(60)}`);
    console.log('⚡ FAST COMPREHENSIVE COMPONENT TESTING');
    console.log('='.repeat(60));
    console.log(`Testing ${components.length} components with programmatic checks\n`);

    for (const component of components) {
      console.log(`🧪 Testing: ${component.name}`);
      const findings = await agent.testComponent(page, component);
      allFindings.push(...findings);

      for (const finding of findings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${emoji} ${finding.issue}`);
      }
    }
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await agent.generateReport(allFindings, duration);

    // Save report
    const reportPath = path.join(process.cwd(), 'test-results', 'fast-comprehensive-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    const mdPath = path.join(process.cwd(), 'test-results', 'FAST-TEST-REPORT.md');
    fs.writeFileSync(mdPath, generateMarkdownReport(report));

    // Print summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('⚡ FAST COMPREHENSIVE TEST COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Total Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`📊 Components Tested: ${report.totalComponents}`);
    console.log(`📝 Total Findings: ${report.findings.length}`);
    console.log(`\n✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`💡 Enhancements: ${report.summary.enhancements}`);
    console.log(`\n🚨 Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`\n📄 Detailed Report: test-results/FAST-TEST-REPORT.md`);
    console.log(`📄 JSON Report: test-results/fast-comprehensive-report.json\n`);
  });
});

function generateMarkdownReport(report: AITestReport): string {
  let md = `# ⚡ Fast Comprehensive Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}
**URL:** ${report.url}
**Duration:** ${(report.testDuration / 1000).toFixed(1)} seconds
**Test Method:** Fast programmatic checks only

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Components Tested | ${report.totalComponents} |
| Total Findings | ${report.findings.length} |
| ✅ Passed | ${report.summary.passed} |
| ❌ Failed | ${report.summary.failed} |
| ⚠️ Warnings | ${report.summary.warnings} |
| 💡 Enhancements | ${report.summary.enhancements} |
| 🚨 **Critical Issues** | **${report.summary.criticalIssues}** |

---

## Testing Approach

This report uses **Fast Programmatic Testing** which provides:

- ✅ **Instant Feedback**: Tests complete in under 2 minutes
- ✅ **Comprehensive Coverage**: ALL components tested
- ✅ **Actionable Results**: Immediate identification of broken functionality
- ✅ **No API Costs**: Zero Claude API usage
- ✅ **CI/CD Ready**: Fast enough for continuous integration

### What's Tested Programmatically:

- DOM presence and visibility
- Element dimensions and positioning
- Interactive functionality (clicks, typing)
- Console error monitoring
- Accessibility attributes
- Form validation
- Component integration

---

## Findings

`;

  // Group by severity
  const critical = report.findings.filter(f => f.severity === 'critical');
  const high = report.findings.filter(f => f.severity === 'high');
  const medium = report.findings.filter(f => f.severity === 'medium');
  const low = report.findings.filter(f => f.severity === 'low');

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
    md += `\n### 💡 Enhancements & Low Priority (${low.length})\n\n`;
    for (const finding of low) {
      md += formatFinding(finding);
    }
  }

  md += `\n---\n\n## Next Steps\n\n`;
  md += `1. ✅ Fix any CRITICAL issues immediately\n`;
  md += `2. ⚠️ Address HIGH priority findings\n`;
  md += `3. 📝 Review MEDIUM priority issues\n`;
  md += `4. 💡 Consider enhancement suggestions\n`;
  md += `5. 🔄 Re-run fast tests to verify fixes\n\n`;

  md += `## Optional: AI Vision Analysis\n\n`;
  md += `For deeper visual/UX analysis, run AI vision analysis separately:\n`;
  md += `- This takes 30-60 minutes for all components\n`;
  md += `- Costs approximately $10-15 in API calls\n`;
  md += `- Provides insights on visual design, UX, and subtle issues\n`;
  md += `- Best done after fixing critical programmatic issues\n\n`;

  return md;
}

function formatFinding(finding: any): string {
  const statusEmoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : finding.status === 'warning' ? '⚠️' : '💡';

  let md = `**${statusEmoji} ${finding.component}** - ${finding.category}\n\n`;
  md += `- **Issue:** ${finding.issue}\n`;
  md += `- **Recommendation:** ${finding.recommendation}\n`;

  if (finding.evidence && finding.evidence.length > 0) {
    md += `- **Evidence:**\n`;
    for (const evidence of finding.evidence) {
      md += `  - ${evidence}\n`;
    }
  }

  md += `\n`;
  return md;
}
