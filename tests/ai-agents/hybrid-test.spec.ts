/**
 * UPGRADED: Hybrid AI Testing Suite
 * Fast programmatic checks + selective AI vision analysis
 *
 * Expected runtime: 3-5 minutes (vs 30-67 minutes for pure AI)
 * Coverage: ALL components with programmatic checks, critical components with AI vision
 */

import { test, expect } from '@playwright/test';
import { HybridTestingAgent, TestFinding, AITestReport, ComponentTest } from './hybrid-framework';
import fs from 'fs';
import path from 'path';

test.describe('Hybrid AI Testing - Atoms', () => {
  let atomAgent: HybridTestingAgent;
  let findings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    atomAgent = new HybridTestingAgent('Atom Inspector Alpha', 'atoms');
  });

  test('should test all button atoms with hybrid approach', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons: ComponentTest[] = [
      {
        name: 'New Project Button',
        selector: 'button:has-text("New Project"), [data-testid="new-project-button"]',
        description: 'Primary CTA button for creating projects',
        expectedBehavior: 'Clicks should open project creation modal without errors',
        aiIntegration: false,
        priority: 'critical', // Critical = gets AI analysis
        interactionTest: async (page, element) => {
          if (!element) return false;
          const clickable = await element.isEnabled().catch(() => false);
          return clickable;
        },
      },
      {
        name: 'Logout Button',
        selector: 'button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout-button"]',
        description: 'Secondary action button for user logout',
        expectedBehavior: 'Clicks should clear session and redirect to login',
        aiIntegration: false,
        priority: 'high',
        interactionTest: async (page, element) => {
          if (!element) return false;
          return await element.isVisible().catch(() => false);
        },
      },
      {
        name: 'Filter Button',
        selector: 'button:has-text("Filter"), [data-testid="filter-button"], [aria-label*="filter" i]',
        description: 'Icon button for opening filter options',
        expectedBehavior: 'Clicks should reveal filter dropdown/panel',
        aiIntegration: false,
        priority: 'medium',
      },
      {
        name: 'Close Modal Button',
        selector: 'button:has-text("Close"), button:has-text("Cancel"), [data-testid="close-modal"]',
        description: 'Button to dismiss modals',
        expectedBehavior: 'Closes modal and returns focus to main UI',
        aiIntegration: false,
        priority: 'medium',
      },
    ];

    for (const button of buttons) {
      console.log(`\n🧪 Testing: ${button.name}`);
      const buttonFindings = await atomAgent.testComponent(page, button);
      findings.push(...buttonFindings);

      // Log immediate results
      for (const finding of buttonFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
        console.log(`  ${emoji} [${method}] ${finding.issue}`);
      }
    }
  });

  test('should test all input atoms with hybrid approach', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputs: ComponentTest[] = [
      {
        name: 'Search Projects Input',
        selector: 'input[placeholder*="Search" i], input[type="search"], [data-testid="search-projects"]',
        description: 'Text input for real-time project search',
        expectedBehavior: 'Filters project list as user types, debounced search',
        aiIntegration: false,
        priority: 'high',
        interactionTest: async (page, element) => {
          if (!element) return false;
          // Test if input accepts text
          await element.fill('test').catch(() => {});
          const value = await element.inputValue().catch(() => '');
          await element.fill(''); // Clear
          return value === 'test';
        },
      },
      {
        name: 'Email Input (Login)',
        selector: 'input[type="email"], input[placeholder*="email" i], [data-testid="email-input"]',
        description: 'Email input field for authentication',
        expectedBehavior: 'Validates email format, shows error states',
        aiIntegration: false,
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;
          await element.fill('test@example.com').catch(() => {});
          const value = await element.inputValue().catch(() => '');
          await element.fill(''); // Clear
          return value.includes('@');
        },
      },
      {
        name: 'Password Input (Login)',
        selector: 'input[type="password"], [data-testid="password-input"]',
        description: 'Password input with visibility toggle',
        expectedBehavior: 'Masks input, toggles visibility, validates on submit',
        aiIntegration: false,
        priority: 'critical',
        interactionTest: async (page, element) => {
          if (!element) return false;
          const type = await element.getAttribute('type').catch(() => '');
          return type === 'password';
        },
      },
    ];

    for (const input of inputs) {
      console.log(`\n🧪 Testing: ${input.name}`);
      const inputFindings = await atomAgent.testComponent(page, input);
      findings.push(...inputFindings);

      for (const finding of inputFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
        console.log(`  ${emoji} [${method}] ${finding.issue}`);
      }
    }
  });

  test('should test icon and label atoms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const iconComponents: ComponentTest[] = [
      {
        name: 'Search Icon',
        selector: 'svg[class*="search" i], [aria-label*="search" i] svg',
        description: 'Icon for search functionality',
        expectedBehavior: 'Provides visual affordance for search',
        aiIntegration: false,
        priority: 'low',
      },
      {
        name: 'Logo',
        selector: 'img[alt*="logo" i], svg[class*="logo" i], [class*="Logo"]',
        description: 'Application branding logo',
        expectedBehavior: 'Displays brand identity',
        aiIntegration: false,
        priority: 'medium',
      },
    ];

    for (const icon of iconComponents) {
      console.log(`\n🧪 Testing: ${icon.name}`);
      const iconFindings = await atomAgent.testComponent(page, icon);
      findings.push(...iconFindings);

      for (const finding of iconFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
        console.log(`  ${emoji} [${method}] ${finding.issue}`);
      }
    }
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await atomAgent.generateReport(findings, duration);
    await saveReport(report, 'atoms-hybrid');
    printSummary(report, 'Atoms (Hybrid)');
  });
});

test.describe('Hybrid AI Testing - Molecules', () => {
  let moleculeAgent: HybridTestingAgent;
  let findings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    moleculeAgent = new HybridTestingAgent('Molecule Analyzer Beta', 'molecules');
  });

  test('should test project card molecule', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectCard: ComponentTest = {
      name: 'Project Card Component',
      selector: '[class*="project" i][class*="card" i], [class*="ProjectCard"]',
      description: 'Composite card showing project metadata, thumbnail, and actions',
      expectedBehavior: 'Displays project info, handles click to open, shows delete confirmation',
      aiIntegration: false,
      priority: 'high', // Important visual component gets AI
    };

    console.log(`\n🧪 Testing: ${projectCard.name}`);
    const cardFindings = await moleculeAgent.testComponent(page, projectCard);
    findings.push(...cardFindings);

    for (const finding of cardFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test('should test search bar molecule', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchBar: ComponentTest = {
      name: 'Project Search Bar',
      description: 'Search input with icon and adjacent filter button - molecule combining atoms',
      expectedBehavior: 'Icon provides visual affordance, input filters, button shows options',
      aiIntegration: false,
      priority: 'medium',
    };

    console.log(`\n🧪 Testing: ${searchBar.name}`);
    const searchFindings = await moleculeAgent.testComponent(page, searchBar);
    findings.push(...searchFindings);

    for (const finding of searchFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test('should test authentication form molecules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginForm: ComponentTest = {
      name: 'Login Form Molecule',
      selector: 'form[class*="login" i], form:has(input[type="email"]):has(input[type="password"])',
      description: 'Form combining email, password, and submit button',
      expectedBehavior: 'Validates inputs, submits credentials, shows errors',
      aiIntegration: false,
      priority: 'critical', // Critical user flow gets AI
      interactionTest: async (page, element) => {
        if (!element) return false;
        const hasEmail = await element.locator('input[type="email"]').count().then(c => c > 0);
        const hasPassword = await element.locator('input[type="password"]').count().then(c => c > 0);
        const hasSubmit = await element.locator('button[type="submit"]').count().then(c => c > 0);
        return hasEmail && hasPassword && hasSubmit;
      },
    };

    console.log(`\n🧪 Testing: ${loginForm.name}`);
    const formFindings = await moleculeAgent.testComponent(page, loginForm);
    findings.push(...formFindings);

    for (const finding of formFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await moleculeAgent.generateReport(findings, duration);
    await saveReport(report, 'molecules-hybrid');
    printSummary(report, 'Molecules (Hybrid)');
  });
});

test.describe('Hybrid AI Testing - Organisms', () => {
  let organismAgent: HybridTestingAgent;
  let findings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    organismAgent = new HybridTestingAgent('Organism Evaluator Gamma', 'organisms');
  });

  test('should test project list organism', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectList: ComponentTest = {
      name: 'Project List Organism',
      description: 'Complete project management interface with header, search, grid, and actions',
      expectedBehavior: 'Shows user projects, filters in real-time, handles empty states, manages project CRUD operations',
      aiIntegration: false,
      priority: 'critical', // Major organism gets AI
    };

    console.log(`\n🧪 Testing: ${projectList.name}`);
    const listFindings = await organismAgent.testComponent(page, projectList);
    findings.push(...listFindings);

    for (const finding of listFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test('should test application header organism', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header: ComponentTest = {
      name: 'Application Header',
      selector: 'header, [role="banner"], nav[class*="header" i]',
      description: 'Top navigation bar with branding, user info, and primary CTAs',
      expectedBehavior: 'Displays brand, user context, provides navigation and key actions',
      aiIntegration: false,
      priority: 'high',
    };

    console.log(`\n🧪 Testing: ${header.name}`);
    const headerFindings = await organismAgent.testComponent(page, header);
    findings.push(...headerFindings);

    for (const finding of headerFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await organismAgent.generateReport(findings, duration);
    await saveReport(report, 'organisms-hybrid');
    printSummary(report, 'Organisms (Hybrid)');
  });
});

test.describe('Hybrid AI Testing - AI Integration', () => {
  let aiAgent: HybridTestingAgent;
  let findings: TestFinding[] = [];
  const startTime = Date.now();

  test.beforeAll(async () => {
    aiAgent = new HybridTestingAgent('AI Integration Specialist', 'organisms');
  });

  test('should verify demo mode system', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoModeSystem: ComponentTest = {
      name: 'Demo Mode System',
      description: 'System that bypasses backend and provides mock AI functionality',
      expectedBehavior: 'Loads demo projects, mock entitlements, bypasses API calls, shows demo content without errors',
      aiIntegration: true, // AI integration = gets AI analysis
      priority: 'critical',
      interactionTest: async (page) => {
        // Check for demo projects
        const hasProjects = await page.locator('text=Demo Song').count().then(c => c > 0);
        return hasProjects;
      },
    };

    console.log(`\n🧪 Testing: ${demoModeSystem.name}`);
    const demoFindings = await aiAgent.testComponent(page, demoModeSystem);
    findings.push(...demoFindings);

    for (const finding of demoFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      const method = finding.testMethod === 'ai-vision' ? '🤖 AI' : '⚡ FAST';
      console.log(`  ${emoji} [${method}] ${finding.issue}`);
    }
  });

  test.afterAll(async () => {
    const duration = Date.now() - startTime;
    const report = await aiAgent.generateReport(findings, duration);
    await saveReport(report, 'ai-integration-hybrid');
    printSummary(report, 'AI Integration (Hybrid)');
  });
});

test.describe('Generate Final Hybrid Report', () => {
  test('should compile all hybrid findings into master report', async () => {
    const reports = loadAllReports();

    const masterReport = {
      timestamp: new Date().toISOString(),
      testRun: `Hybrid AI Testing Suite - ${new Date().toLocaleDateString()}`,
      url: 'https://www.dawg-ai.com',
      reports,
      overallSummary: {
        totalComponents: reports.reduce((sum, r) => sum + r.totalComponents, 0),
        totalFindings: reports.reduce((sum, r) => sum + r.findings.length, 0),
        criticalIssues: reports.reduce((sum, r) => sum + r.summary.criticalIssues, 0),
        passed: reports.reduce((sum, r) => sum + r.summary.passed, 0),
        failed: reports.reduce((sum, r) => sum + r.summary.failed, 0),
        warnings: reports.reduce((sum, r) => sum + r.summary.warnings, 0),
        enhancements: reports.reduce((sum, r) => sum + r.summary.enhancements, 0),
        totalDuration: reports.reduce((sum, r) => sum + (r.testDuration || 0), 0),
      },
      testingApproach: 'Hybrid (Fast Programmatic + Selective AI Vision)',
    };

    // Save master report
    const reportPath = path.join(process.cwd(), 'test-results', 'hybrid-master-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(masterReport, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(masterReport);
    const mdPath = path.join(process.cwd(), 'test-results', 'HYBRID-TEST-FINDINGS.md');
    fs.writeFileSync(mdPath, markdownReport);

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🚀 HYBRID AI TESTING COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Total Test Duration: ${(masterReport.overallSummary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`📊 Total Components Tested: ${masterReport.overallSummary.totalComponents}`);
    console.log(`📝 Total Findings: ${masterReport.overallSummary.totalFindings}`);
    console.log(`\n✅ Passed: ${masterReport.overallSummary.passed}`);
    console.log(`❌ Failed: ${masterReport.overallSummary.failed}`);
    console.log(`⚠️  Warnings: ${masterReport.overallSummary.warnings}`);
    console.log(`💡 Enhancements: ${masterReport.overallSummary.enhancements}`);
    console.log(`\n🚨 Critical Issues: ${masterReport.overallSummary.criticalIssues}`);
    console.log(`\n📄 Detailed Report: test-results/HYBRID-TEST-FINDINGS.md`);
    console.log(`📄 JSON Report: test-results/hybrid-master-report.json\n`);
    console.log(`✨ Testing approach: ${masterReport.testingApproach}\n`);
  });
});

// Helper functions
async function saveReport(report: AITestReport, level: string): Promise<void> {
  const reportPath = path.join(process.cwd(), 'test-results', `${level}-report.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

function loadAllReports(): AITestReport[] {
  const reports: AITestReport[] = [];
  const levels = ['atoms-hybrid', 'molecules-hybrid', 'organisms-hybrid', 'ai-integration-hybrid'];

  for (const level of levels) {
    const reportPath = path.join(process.cwd(), 'test-results', `${level}-report.json`);
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, 'utf-8');
      reports.push(JSON.parse(data));
    }
  }

  return reports;
}

function printSummary(report: AITestReport, level: string): void {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`🤖 HYBRID TEST REPORT: ${level}`);
  console.log('='.repeat(60));
  console.log(`Duration: ${(report.testDuration / 1000).toFixed(1)}s`);
  console.log(`Components Tested: ${report.totalComponents}`);
  console.log(`Findings: ${report.findings.length}`);
  console.log(`  ✅ Passed: ${report.summary.passed}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`  💡 Enhancements: ${report.summary.enhancements}`);
  console.log(`  🚨 Critical: ${report.summary.criticalIssues}`);
  console.log(`AI Confidence: ${(report.aiConfidence * 100).toFixed(1)}%`);

  // Show test method breakdown
  const programmatic = report.findings.filter(f => f.testMethod === 'programmatic').length;
  const aiVision = report.findings.filter(f => f.testMethod === 'ai-vision').length;
  console.log(`Test Methods: ⚡ ${programmatic} programmatic, 🤖 ${aiVision} AI vision`);
  console.log('='.repeat(60) + '\n');
}

function generateMarkdownReport(masterReport: any): string {
  let md = `# 🚀 Hybrid AI Testing Report

**Generated:** ${new Date(masterReport.timestamp).toLocaleString()}
**URL:** ${masterReport.url}
**Test Run:** ${masterReport.testRun}
**Testing Approach:** ${masterReport.testingApproach}
**Total Duration:** ${(masterReport.overallSummary.totalDuration / 1000).toFixed(1)} seconds

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Components Tested | ${masterReport.overallSummary.totalComponents} |
| Total Findings | ${masterReport.overallSummary.totalFindings} |
| ✅ Passed | ${masterReport.overallSummary.passed} |
| ❌ Failed | ${masterReport.overallSummary.failed} |
| ⚠️ Warnings | ${masterReport.overallSummary.warnings} |
| 💡 Enhancements | ${masterReport.overallSummary.enhancements} |
| 🚨 **Critical Issues** | **${masterReport.overallSummary.criticalIssues}** |

---

## Testing Methodology

This report uses a **Hybrid Testing Approach** combining:

1. **⚡ Fast Programmatic Checks** - All components tested with automated checks (< 1s each)
   - DOM presence and visibility
   - Element dimensions and positioning
   - Console error monitoring
   - Basic interaction testing
   - Accessibility attributes

2. **🤖 AI Vision Analysis** - Selective deep analysis for:
   - Critical components (buttons, forms, auth)
   - Components with AI integration
   - Components that fail programmatic checks
   - Complex visual organisms

This provides **comprehensive coverage** in **3-5 minutes** instead of 30-67 minutes, while maintaining high-quality insights.

---

## Findings by Component Level

`;

  for (const report of masterReport.reports) {
    const levelName = report.testId.split('-')[2].toUpperCase();
    md += `\n### ${levelName}\n\n`;
    md += `**Duration:** ${(report.testDuration / 1000).toFixed(1)}s\n`;
    md += `**Components:** ${report.totalComponents}\n`;
    md += `**AI Confidence:** ${(report.aiConfidence * 100).toFixed(1)}%\n\n`;

    if (report.findings.length === 0) {
      md += `No findings reported for this level.\n\n`;
      continue;
    }

    // Show test method breakdown
    const programmatic = report.findings.filter((f: any) => f.testMethod === 'programmatic').length;
    const aiVision = report.findings.filter((f: any) => f.testMethod === 'ai-vision').length;
    md += `**Test Methods:** ⚡ ${programmatic} programmatic | 🤖 ${aiVision} AI vision\n\n`;

    // Group by severity
    const critical = report.findings.filter((f: any) => f.severity === 'critical');
    const high = report.findings.filter((f: any) => f.severity === 'high');
    const medium = report.findings.filter((f: any) => f.severity === 'medium');
    const low = report.findings.filter((f: any) => f.severity === 'low');

    if (critical.length > 0) {
      md += `#### 🚨 Critical Issues (${critical.length})\n\n`;
      for (const finding of critical) {
        md += formatFinding(finding);
      }
    }

    if (high.length > 0) {
      md += `#### ⚠️ High Priority (${high.length})\n\n`;
      for (const finding of high) {
        md += formatFinding(finding);
      }
    }

    if (medium.length > 0) {
      md += `#### 📝 Medium Priority (${medium.length})\n\n`;
      for (const finding of medium) {
        md += formatFinding(finding);
      }
    }

    if (low.length > 0) {
      md += `#### 💡 Enhancements & Low Priority (${low.length})\n\n`;
      for (const finding of low) {
        md += formatFinding(finding);
      }
    }
  }

  md += `\n---\n\n## Next Steps\n\n`;
  md += `1. ✅ Review all CRITICAL issues immediately\n`;
  md += `2. ⚠️ Address HIGH priority findings\n`;
  md += `3. 📝 Evaluate MEDIUM priority issues\n`;
  md += `4. 💡 Consider enhancement suggestions for future iterations\n`;
  md += `5. 🔄 Re-run hybrid testing after fixes\n\n`;

  return md;
}

function formatFinding(finding: any): string {
  const statusEmoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : finding.status === 'warning' ? '⚠️' : '💡';
  const methodBadge = finding.testMethod === 'ai-vision' ? '🤖' : '⚡';

  let md = `**${statusEmoji} ${finding.component}** [${methodBadge} ${finding.testMethod}] - ${finding.category}\n\n`;
  md += `- **Issue:** ${finding.issue}\n`;
  md += `- **Recommendation:** ${finding.recommendation}\n`;

  if (finding.evidence && finding.evidence.length > 0) {
    md += `- **Evidence:**\n`;
    for (const evidence of finding.evidence) {
      md += `  - ${evidence}\n`;
    }
  }

  if (finding.aiAnalysis) {
    md += `- **Analysis:** ${finding.aiAnalysis}\n`;
  }

  md += `\n`;

  return md;
}
