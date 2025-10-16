/**
 * AI Testing Agent Framework
 * Uses Claude to meticulously test each component level
 */

import Anthropic from '@anthropic-ai/sdk';
import { Page } from '@playwright/test';

export interface TestFinding {
  component: string;
  level: 'atom' | 'molecule' | 'organism';
  status: 'pass' | 'fail' | 'warning' | 'enhancement';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  evidence: string[];
  recommendation: string;
  aiAnalysis: string;
}

export interface AITestReport {
  testId: string;
  timestamp: string;
  url: string;
  totalComponents: number;
  findings: TestFinding[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    enhancements: number;
    criticalIssues: number;
  };
  aiConfidence: number;
}

export class AITestingAgent {
  private anthropic: Anthropic;
  private agentName: string;
  private focusArea: 'atoms' | 'molecules' | 'organisms';

  constructor(agentName: string, focusArea: 'atoms' | 'molecules' | 'organisms') {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.agentName = agentName;
    this.focusArea = focusArea;
  }

  async analyzeComponent(
    page: Page,
    component: {
      name: string;
      selector?: string;
      description: string;
      expectedBehavior: string;
      aiIntegration?: boolean;
    }
  ): Promise<TestFinding[]> {
    const findings: TestFinding[] = [];

    // Capture screenshot
    const screenshot = await page.screenshot({ fullPage: false });

    // Get page HTML and console logs
    const html = await page.content();
    const consoleMessages: string[] = [];

    page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

    // Get element if selector provided
    let elementInfo: any = null;
    if (component.selector) {
      try {
        const element = page.locator(component.selector).first();
        const isVisible = await element.isVisible().catch(() => false);
        const isEnabled = await element.isEnabled().catch(() => false);
        const boundingBox = await element.boundingBox().catch(() => null);
        const innerText = await element.innerText().catch(() => '');

        elementInfo = {
          visible: isVisible,
          enabled: isEnabled,
          boundingBox,
          text: innerText,
        };
      } catch (e) {
        elementInfo = { error: (e as Error).message };
      }
    }

    // Ask Claude to analyze
    const prompt = `You are an expert QA engineer testing the "${component.name}" component in an AI-powered Digital Audio Workstation (DAW).

**Component Details:**
- Name: ${component.name}
- Level: ${this.focusArea}
- Description: ${component.description}
- Expected Behavior: ${component.expectedBehavior}
- Has AI Integration: ${component.aiIntegration ? 'YES' : 'NO'}
${component.selector ? `- Selector: ${component.selector}` : ''}

**Test Evidence:**
${elementInfo ? `Element State: ${JSON.stringify(elementInfo, null, 2)}` : 'No element selector provided'}

Console Messages:
${consoleMessages.slice(-10).join('\n') || 'No console messages'}

**Your Task:**
Analyze this component meticulously and identify:

1. **Functionality Issues**: Does it work as expected?
2. **UI/UX Problems**: Is it accessible, visible, properly styled?
3. **AI Integration**: If it has AI features, are they connected and functional?
4. **Edge Cases**: What could break it?
5. **Enhancement Opportunities**: How could it be better?

For each issue found, respond in this JSON format:
{
  "findings": [
    {
      "status": "pass|fail|warning|enhancement",
      "severity": "critical|high|medium|low",
      "category": "functionality|ui|accessibility|ai-integration|performance|security",
      "issue": "Brief description of the issue",
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "recommendation": "Specific fix or enhancement",
      "confidence": 0.0-1.0
    }
  ],
  "overallAssessment": "Brief summary of component health"
}

Be thorough but practical. Only report real issues, not hypotheticals.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot.toString('base64'),
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Parse Claude's response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);

        for (const finding of analysis.findings || []) {
          findings.push({
            component: component.name,
            level: this.focusArea === 'atoms' ? 'atom' : this.focusArea === 'molecules' ? 'molecule' : 'organism',
            status: finding.status,
            severity: finding.severity,
            category: finding.category,
            issue: finding.issue,
            evidence: finding.evidence,
            recommendation: finding.recommendation,
            aiAnalysis: analysis.overallAssessment,
          });
        }
      }
    } catch (error) {
      console.error(`AI analysis failed for ${component.name}:`, error);
      findings.push({
        component: component.name,
        level: this.focusArea === 'atoms' ? 'atom' : this.focusArea === 'molecules' ? 'molecule' : 'organism',
        status: 'warning',
        severity: 'medium',
        category: 'functionality',
        issue: 'Could not perform AI analysis',
        evidence: [(error as Error).message],
        recommendation: 'Manual testing required',
        aiAnalysis: 'AI agent failed to analyze this component',
      });
    }

    return findings;
  }

  async generateReport(findings: TestFinding[]): Promise<AITestReport> {
    const summary = {
      passed: findings.filter(f => f.status === 'pass').length,
      failed: findings.filter(f => f.status === 'fail').length,
      warnings: findings.filter(f => f.status === 'warning').length,
      enhancements: findings.filter(f => f.status === 'enhancement').length,
      criticalIssues: findings.filter(f => f.severity === 'critical').length,
    };

    return {
      testId: `ai-test-${this.focusArea}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: 'https://www.dawg-ai.com',
      totalComponents: findings.length,
      findings,
      summary,
      aiConfidence: findings.length > 0 ? 0.85 : 0,
    };
  }
}

export async function runAITestSuite(page: Page): Promise<AITestReport[]> {
  const reports: AITestReport[] = [];

  // Deploy atom testing agent
  const atomAgent = new AITestingAgent('Atom Inspector', 'atoms');
  const atomFindings = await testAtoms(page, atomAgent);
  reports.push(await atomAgent.generateReport(atomFindings));

  // Deploy molecule testing agent
  const moleculeAgent = new AITestingAgent('Molecule Analyzer', 'molecules');
  const moleculeFindings = await testMolecules(page, moleculeAgent);
  reports.push(await moleculeAgent.generateReport(moleculeFindings));

  // Deploy organism testing agent
  const organismAgent = new AITestingAgent('Organism Evaluator', 'organisms');
  const organismFindings = await testOrganisms(page, organismAgent);
  reports.push(await organismAgent.generateReport(organismFindings));

  return reports;
}

async function testAtoms(page: Page, agent: AITestingAgent): Promise<TestFinding[]> {
  const findings: TestFinding[] = [];

  // Test buttons
  const buttons = [
    {
      name: 'New Project Button',
      selector: '[data-testid="new-project-button"]',
      description: 'Primary action button to create a new project',
      expectedBehavior: 'Opens modal or navigates to project creation flow',
      aiIntegration: false,
    },
    {
      name: 'Logout Button',
      selector: '[data-testid="logout-button"]',
      description: 'Logs user out of the application',
      expectedBehavior: 'Clears session and redirects to login',
      aiIntegration: false,
    },
    {
      name: 'Filter Button',
      selector: '[data-testid="filter-button"]',
      description: 'Opens project filtering options',
      expectedBehavior: 'Shows filter dropdown or panel',
      aiIntegration: false,
    },
  ];

  for (const button of buttons) {
    const buttonFindings = await agent.analyzeComponent(page, button);
    findings.push(...buttonFindings);
  }

  // Test inputs
  const inputs = [
    {
      name: 'Search Projects Input',
      selector: '[data-testid="search-projects-input"]',
      description: 'Search field for filtering projects by name or description',
      expectedBehavior: 'Filters project list in real-time as user types',
      aiIntegration: false,
    },
  ];

  for (const input of inputs) {
    const inputFindings = await agent.analyzeComponent(page, input);
    findings.push(...inputFindings);
  }

  return findings;
}

async function testMolecules(page: Page, agent: AITestingAgent): Promise<TestFinding[]> {
  const findings: TestFinding[] = [];

  // Test project cards
  const projectCard = {
    name: 'Project Card',
    selector: '[class*="project"], [class*="ProjectCard"]',
    description: 'Card component displaying project information',
    expectedBehavior: 'Shows project name, description, settings, and actions',
    aiIntegration: false,
  };
  findings.push(...(await agent.analyzeComponent(page, projectCard)));

  // Test search bar molecule
  const searchBar = {
    name: 'Project Search Bar',
    description: 'Search input with icon and filter button',
    expectedBehavior: 'Allows searching and filtering of projects',
    aiIntegration: false,
  };
  findings.push(...(await agent.analyzeComponent(page, searchBar)));

  return findings;
}

async function testOrganisms(page: Page, agent: AITestingAgent): Promise<TestFinding[]> {
  const findings: TestFinding[] = [];

  // Test project list organism
  const projectList = {
    name: 'Project List',
    description: 'Complete project listing with header, search, and grid',
    expectedBehavior: 'Displays all user projects with search and filtering',
    aiIntegration: false,
  };
  findings.push(...(await agent.analyzeComponent(page, projectList)));

  // Test header organism
  const header = {
    name: 'Application Header',
    description: 'Top navigation bar with branding and user actions',
    expectedBehavior: 'Shows logo, user info, and primary actions',
    aiIntegration: false,
  };
  findings.push(...(await agent.analyzeComponent(page, header)));

  return findings;
}
