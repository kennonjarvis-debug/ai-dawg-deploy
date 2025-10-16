/**
 * AI-Powered Comprehensive Component Testing
 * Tests every atom, molecule, and organism with AI analysis
 */

import { test, expect } from '@playwright/test';
import { AITestingAgent, TestFinding, AITestReport } from './framework';
import fs from 'fs';
import path from 'path';

test.describe('AI Agent Testing Suite - Atoms', () => {
  let atomAgent: AITestingAgent;
  let findings: TestFinding[] = [];

  test.beforeAll(async () => {
    atomAgent = new AITestingAgent('Atom Inspector Alpha', 'atoms');
  });

  test('should test all button atoms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = [
      {
        name: 'New Project Button',
        selector: '[data-testid="new-project-button"]',
        description: 'Primary CTA button for creating projects',
        expectedBehavior: 'Clicks should open project creation modal without errors',
        aiIntegration: false,
      },
      {
        name: 'Logout Button',
        selector: '[data-testid="logout-button"]',
        description: 'Secondary action button for user logout',
        expectedBehavior: 'Clicks should clear session and redirect to login',
        aiIntegration: false,
      },
      {
        name: 'Filter Button',
        selector: '[data-testid="filter-button"]',
        description: 'Icon button for opening filter options',
        expectedBehavior: 'Clicks should reveal filter dropdown/panel',
        aiIntegration: false,
      },
      {
        name: 'Close Modal Button',
        selector: '[data-testid="close-limit-modal"], button:has-text("Close")',
        description: 'Button to dismiss modals',
        expectedBehavior: 'Closes modal and returns focus to main UI',
        aiIntegration: false,
      },
      {
        name: 'Upgrade Plan Link',
        selector: '[data-testid="upgrade-plan-link"]',
        description: 'Navigation link to billing/upgrade page',
        expectedBehavior: 'Navigates to subscription upgrade flow',
        aiIntegration: false,
      },
    ];

    for (const button of buttons) {
      console.log(`\n🔍 AI Agent testing: ${button.name}`);
      const buttonFindings = await atomAgent.analyzeComponent(page, button);
      findings.push(...buttonFindings);

      // Log immediate findings
      for (const finding of buttonFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
      }
    }
  });

  test('should test all input atoms', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputs = [
      {
        name: 'Search Projects Input',
        selector: '[data-testid="search-projects-input"]',
        description: 'Text input for real-time project search',
        expectedBehavior: 'Filters project list as user types, debounced search',
        aiIntegration: false,
      },
      {
        name: 'Email Input (Login)',
        selector: '[data-testid="email-input"]',
        description: 'Email input field for authentication',
        expectedBehavior: 'Validates email format, shows error states',
        aiIntegration: false,
      },
      {
        name: 'Password Input (Login)',
        selector: '[data-testid="password-input"]',
        description: 'Password input with visibility toggle',
        expectedBehavior: 'Masks input, toggles visibility, validates on submit',
        aiIntegration: false,
      },
    ];

    for (const input of inputs) {
      console.log(`\n🔍 AI Agent testing: ${input.name}`);
      const inputFindings = await atomAgent.analyzeComponent(page, input);
      findings.push(...inputFindings);

      for (const finding of inputFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
      }
    }
  });

  test.afterAll(async () => {
    const report = await atomAgent.generateReport(findings);
    await saveReport(report, 'atoms');
    printSummary(report, 'Atoms');
  });
});

test.describe('AI Agent Testing Suite - Molecules', () => {
  let moleculeAgent: AITestingAgent;
  let findings: TestFinding[] = [];

  test.beforeAll(async () => {
    moleculeAgent = new AITestingAgent('Molecule Analyzer Beta', 'molecules');
  });

  test('should test project card molecule', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectCard = {
      name: 'Project Card Component',
      description: 'Composite card showing project metadata, thumbnail, and actions',
      expectedBehavior: 'Displays project info, handles click to open, shows delete confirmation',
      aiIntegration: false,
    };

    console.log(`\n🔍 AI Agent testing: ${projectCard.name}`);
    const cardFindings = await moleculeAgent.analyzeComponent(page, projectCard);
    findings.push(...cardFindings);

    for (const finding of cardFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test('should test search bar molecule', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchBar = {
      name: 'Project Search Bar',
      description: 'Search input with icon and adjacent filter button',
      expectedBehavior: 'Icon provides visual affordance, input filters, button shows options',
      aiIntegration: false,
    };

    console.log(`\n🔍 AI Agent testing: ${searchBar.name}`);
    const searchFindings = await moleculeAgent.analyzeComponent(page, searchBar);
    findings.push(...searchFindings);

    for (const finding of searchFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test('should test modal molecules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to trigger new project modal
    const newProjectButton = page.getByTestId('new-project-button');
    if (await newProjectButton.isVisible().catch(() => false)) {
      await newProjectButton.click();
      await page.waitForTimeout(1000);

      const createProjectModal = {
        name: 'Create Project Modal',
        description: 'Modal dialog with form for creating new projects',
        expectedBehavior: 'Opens with animation, contains form fields, validates input, closes on cancel/submit',
        aiIntegration: false,
      };

      console.log(`\n🔍 AI Agent testing: ${createProjectModal.name}`);
      const modalFindings = await moleculeAgent.analyzeComponent(page, createProjectModal);
      findings.push(...modalFindings);

      for (const finding of modalFindings) {
        const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
        console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
      }
    }
  });

  test.afterAll(async () => {
    const report = await moleculeAgent.generateReport(findings);
    await saveReport(report, 'molecules');
    printSummary(report, 'Molecules');
  });
});

test.describe('AI Agent Testing Suite - Organisms', () => {
  let organismAgent: AITestingAgent;
  let findings: TestFinding[] = [];

  test.beforeAll(async () => {
    organismAgent = new AITestingAgent('Organism Evaluator Gamma', 'organisms');
  });

  test('should test project list organism', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectList = {
      name: 'Project List Organism',
      description: 'Complete project management interface with header, search, grid, and actions',
      expectedBehavior: 'Shows user projects, filters in real-time, handles empty states, manages project CRUD operations',
      aiIntegration: false,
    };

    console.log(`\n🔍 AI Agent testing: ${projectList.name}`);
    const listFindings = await organismAgent.analyzeComponent(page, projectList);
    findings.push(...listFindings);

    for (const finding of listFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test('should test header organism', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = {
      name: 'Application Header',
      description: 'Top navigation bar with branding, user info, and primary CTAs',
      expectedBehavior: 'Displays brand, user context, provides navigation and key actions',
      aiIntegration: false,
    };

    console.log(`\n🔍 AI Agent testing: ${header.name}`);
    const headerFindings = await organismAgent.analyzeComponent(page, header);
    findings.push(...headerFindings);

    for (const finding of headerFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test('should test authentication organism', async ({ page }) => {
    // Navigate to fresh page to see login
    await page.goto('/', { waitUntil: 'networkidle' });

    const authForm = {
      name: 'Authentication Form',
      description: 'Login/register form organism with validation and OAuth options',
      expectedBehavior: 'Validates inputs, shows errors, handles demo mode, integrates with auth providers',
      aiIntegration: false,
    };

    console.log(`\n🔍 AI Agent testing: ${authForm.name}`);
    const authFindings = await organismAgent.analyzeComponent(page, authForm);
    findings.push(...authFindings);

    for (const finding of authFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test.afterAll(async () => {
    const report = await organismAgent.generateReport(findings);
    await saveReport(report, 'organisms');
    printSummary(report, 'Organisms');
  });
});

test.describe('AI Agent Testing Suite - AI Integration', () => {
  let aiIntegrationAgent: AITestingAgent;
  let findings: TestFinding[] = [];

  test.beforeAll(async () => {
    aiIntegrationAgent = new AITestingAgent('AI Integration Specialist Delta', 'organisms');
  });

  test('should verify demo mode AI integration points', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoModeSystem = {
      name: 'Demo Mode System',
      description: 'System that bypasses backend and provides mock AI functionality',
      expectedBehavior: 'Loads demo projects, mock entitlements, bypasses API calls, shows demo content',
      aiIntegration: true,
    };

    console.log(`\n🔍 AI Agent testing: ${demoModeSystem.name}`);
    const demoFindings = await aiIntegrationAgent.analyzeComponent(page, demoModeSystem);
    findings.push(...demoFindings);

    for (const finding of demoFindings) {
      const emoji = finding.status === 'pass' ? '✅' : finding.status === 'fail' ? '❌' : '⚠️';
      console.log(`  ${emoji} ${finding.status.toUpperCase()}: ${finding.issue}`);
    }
  });

  test.afterAll(async () => {
    const report = await aiIntegrationAgent.generateReport(findings);
    await saveReport(report, 'ai-integration');
    printSummary(report, 'AI Integration');
  });
});

test.describe('Generate Final Report', () => {
  test('should compile all findings into master report', async () => {
    const reports = loadAllReports();

    const masterReport = {
      timestamp: new Date().toISOString(),
      testRun: `AI Testing Suite - ${new Date().toLocaleDateString()}`,
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
      },
    };

    // Save master report
    const reportPath = path.join(process.cwd(), 'test-results', 'ai-agent-master-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(masterReport, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(masterReport);
    const mdPath = path.join(process.cwd(), 'test-results', 'AI-AGENT-FINDINGS.md');
    fs.writeFileSync(mdPath, markdownReport);

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🤖 AI TESTING COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Total Components Tested: ${masterReport.overallSummary.totalComponents}`);
    console.log(`📝 Total Findings: ${masterReport.overallSummary.totalFindings}`);
    console.log(`\n✅ Passed: ${masterReport.overallSummary.passed}`);
    console.log(`❌ Failed: ${masterReport.overallSummary.failed}`);
    console.log(`⚠️  Warnings: ${masterReport.overallSummary.warnings}`);
    console.log(`💡 Enhancements: ${masterReport.overallSummary.enhancements}`);
    console.log(`\n🚨 Critical Issues: ${masterReport.overallSummary.criticalIssues}`);
    console.log(`\n📄 Detailed Report: test-results/AI-AGENT-FINDINGS.md`);
    console.log(`📄 JSON Report: test-results/ai-agent-master-report.json\n`);
  });
});

// Helper functions
async function saveReport(report: AITestReport, level: string): Promise<void> {
  const reportPath = path.join(process.cwd(), 'test-results', `ai-agent-${level}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

function loadAllReports(): AITestReport[] {
  const reports: AITestReport[] = [];
  const levels = ['atoms', 'molecules', 'organisms', 'ai-integration'];

  for (const level of levels) {
    const reportPath = path.join(process.cwd(), 'test-results', `ai-agent-${level}.json`);
    if (fs.existsSync(reportPath)) {
      const data = fs.readFileSync(reportPath, 'utf-8');
      reports.push(JSON.parse(data));
    }
  }

  return reports;
}

function printSummary(report: AITestReport, level: string): void {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`🤖 AI AGENT REPORT: ${level}`);
  console.log('='.repeat(60));
  console.log(`Components Tested: ${report.totalComponents}`);
  console.log(`Findings: ${report.findings.length}`);
  console.log(`  ✅ Passed: ${report.summary.passed}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`  💡 Enhancements: ${report.summary.enhancements}`);
  console.log(`  🚨 Critical: ${report.summary.criticalIssues}`);
  console.log(`AI Confidence: ${(report.aiConfidence * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');
}

function generateMarkdownReport(masterReport: any): string {
  let md = `# 🤖 AI Agent Testing Report

**Generated:** ${new Date(masterReport.timestamp).toLocaleString()}
**URL:** ${masterReport.url}
**Test Run:** ${masterReport.testRun}

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

## Findings by Component Level

`;

  for (const report of masterReport.reports) {
    md += `\n### ${report.testId.split('-')[2].toUpperCase()}\n\n`;
    md += `**AI Confidence:** ${(report.aiConfidence * 100).toFixed(1)}%\n\n`;

    if (report.findings.length === 0) {
      md += `No findings reported for this level.\n\n`;
      continue;
    }

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
  md += `1. Review all CRITICAL issues immediately\n`;
  md += `2. Address HIGH priority findings\n`;
  md += `3. Evaluate and implement enhancement suggestions\n`;
  md += `4. Re-run AI testing after fixes\n\n`;

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

  if (finding.aiAnalysis) {
    md += `- **AI Analysis:** ${finding.aiAnalysis}\n`;
  }

  md += `\n`;

  return md;
}
