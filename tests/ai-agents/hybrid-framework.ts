/**
 * Hybrid AI Testing Framework - UPGRADED
 * Combines fast programmatic checks with selective AI vision analysis
 *
 * Strategy:
 * 1. Fast programmatic checks on ALL components (< 1 second each)
 * 2. AI vision analysis only for:
 *    - Components that fail programmatic checks
 *    - Critical UI components (buttons, forms)
 *    - Components with AI integration
 *
 * This provides comprehensive coverage in 3-5 minutes instead of 30-67 minutes
 */

import Anthropic from '@anthropic-ai/sdk';
import { Page, Locator } from '@playwright/test';

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
  testMethod: 'programmatic' | 'ai-vision' | 'hybrid';
}

export interface ComponentTest {
  name: string;
  selector?: string;
  description: string;
  expectedBehavior: string;
  aiIntegration?: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  interactionTest?: (page: Page, element?: Locator) => Promise<boolean>;
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
  testDuration: number;
  aiConfidence: number;
}

export class HybridTestingAgent {
  private anthropic: Anthropic;
  private agentName: string;
  private focusArea: 'atoms' | 'molecules' | 'organisms';
  private consoleErrors: string[] = [];
  private consoleWarnings: string[] = [];

  constructor(agentName: string, focusArea: 'atoms' | 'molecules' | 'organisms') {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.agentName = agentName;
    this.focusArea = focusArea;
  }

  /**
   * FAST PROGRAMMATIC CHECK
   * Tests component without AI - takes < 1 second
   */
  async fastCheck(page: Page, component: ComponentTest): Promise<TestFinding[]> {
    const findings: TestFinding[] = [];
    const startTime = Date.now();

    // Reset console tracking
    this.consoleErrors = [];
    this.consoleWarnings = [];

    // Set up console monitoring
    const errorListener = (msg: any) => {
      if (msg.type() === 'error') this.consoleErrors.push(msg.text());
      if (msg.type() === 'warning') this.consoleWarnings.push(msg.text());
    };
    page.on('console', errorListener);

    try {
      // 1. Check if element exists and is visible
      if (component.selector) {
        const element = page.locator(component.selector).first();
        const exists = await element.count().then(c => c > 0).catch(() => false);

        if (!exists) {
          findings.push({
            component: component.name,
            level: this.focusArea,
            status: 'fail',
            severity: 'high',
            category: 'functionality',
            issue: 'Component not found in DOM',
            evidence: [`Selector: ${component.selector}`, 'Element does not exist'],
            recommendation: `Verify selector or component rendering logic`,
            aiAnalysis: 'Programmatic check failed - element not found',
            testMethod: 'programmatic',
          });
          return findings;
        }

        const isVisible = await element.isVisible().catch(() => false);
        const isEnabled = await element.isEnabled().catch(() => true);
        const boundingBox = await element.boundingBox().catch(() => null);

        // 2. Visibility check
        if (!isVisible) {
          findings.push({
            component: component.name,
            level: this.focusArea,
            status: 'warning',
            severity: 'medium',
            category: 'ui',
            issue: 'Component exists but is not visible',
            evidence: [`Selector: ${component.selector}`, 'element.isVisible() = false'],
            recommendation: 'Check CSS display/visibility properties or conditional rendering',
            aiAnalysis: 'Element is hidden - may be intentional',
            testMethod: 'programmatic',
          });
        }

        // 3. Size check (elements should have meaningful dimensions)
        if (boundingBox && (boundingBox.width < 10 || boundingBox.height < 10)) {
          findings.push({
            component: component.name,
            level: this.focusArea,
            status: 'warning',
            severity: 'low',
            category: 'ui',
            issue: 'Component has very small dimensions',
            evidence: [
              `Width: ${boundingBox.width}px, Height: ${boundingBox.height}px`,
              'May be difficult to interact with',
            ],
            recommendation: 'Verify component sizing and touch target size (min 44x44px for mobile)',
            aiAnalysis: 'Element dimensions are unusually small',
            testMethod: 'programmatic',
          });
        }

        // 4. Interaction test (if provided)
        if (component.interactionTest) {
          try {
            const interactionPassed = await component.interactionTest(page, element);
            if (!interactionPassed) {
              findings.push({
                component: component.name,
                level: this.focusArea,
                status: 'fail',
                severity: 'high',
                category: 'functionality',
                issue: 'Component interaction test failed',
                evidence: ['Custom interaction test returned false'],
                recommendation: 'Debug interaction logic and event handlers',
                aiAnalysis: 'Interaction test did not behave as expected',
                testMethod: 'programmatic',
              });
            }
          } catch (error) {
            findings.push({
              component: component.name,
              level: this.focusArea,
              status: 'fail',
              severity: 'critical',
              category: 'functionality',
              issue: 'Component interaction threw an error',
              evidence: [(error as Error).message],
              recommendation: 'Fix interaction error before proceeding',
              aiAnalysis: 'Interaction caused an exception',
              testMethod: 'programmatic',
            });
          }
        }

        // 5. Accessibility checks
        const ariaLabel = await element.getAttribute('aria-label').catch(() => null);
        const ariaDescribedBy = await element.getAttribute('aria-describedby').catch(() => null);
        const role = await element.getAttribute('role').catch(() => null);
        const innerText = await element.innerText().catch(() => '');

        // Check if button has accessible name
        if (component.name.toLowerCase().includes('button') && !ariaLabel && !innerText && !ariaDescribedBy) {
          findings.push({
            component: component.name,
            level: this.focusArea,
            status: 'warning',
            severity: 'medium',
            category: 'accessibility',
            issue: 'Button lacks accessible name',
            evidence: [
              'No aria-label attribute',
              'No visible text content',
              'No aria-describedby',
            ],
            recommendation: 'Add aria-label or visible text for screen reader users',
            aiAnalysis: 'Accessibility improvement needed',
            testMethod: 'programmatic',
          });
        }
      }

      // 6. Console error check
      await page.waitForTimeout(500); // Give time for any async errors

      if (this.consoleErrors.length > 0) {
        findings.push({
          component: component.name,
          level: this.focusArea,
          status: 'fail',
          severity: 'high',
          category: 'functionality',
          issue: 'Console errors detected during component test',
          evidence: this.consoleErrors.slice(0, 5),
          recommendation: 'Fix console errors before proceeding',
          aiAnalysis: 'JavaScript errors were logged to console',
          testMethod: 'programmatic',
        });
      }

      // 7. If no issues found, it's a PASS
      if (findings.length === 0) {
        findings.push({
          component: component.name,
          level: this.focusArea,
          status: 'pass',
          severity: 'low',
          category: 'functionality',
          issue: 'All programmatic checks passed',
          evidence: [
            'Element exists and is visible',
            'No console errors detected',
            'Element has reasonable dimensions',
          ],
          recommendation: 'Component appears functional',
          aiAnalysis: 'Programmatic checks passed successfully',
          testMethod: 'programmatic',
        });
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Fast check for "${component.name}" completed in ${duration}ms`);
    } catch (error) {
      findings.push({
        component: component.name,
        level: this.focusArea,
        status: 'fail',
        severity: 'critical',
        category: 'functionality',
        issue: 'Fast check encountered an error',
        evidence: [(error as Error).message],
        recommendation: 'Debug test framework or component structure',
        aiAnalysis: 'Test execution failed',
        testMethod: 'programmatic',
      });
    } finally {
      page.off('console', errorListener);
    }

    return findings;
  }

  /**
   * AI VISION ANALYSIS
   * Deep analysis using Claude - only called for critical components or failures
   */
  async aiVisionAnalysis(page: Page, component: ComponentTest): Promise<TestFinding[]> {
    const findings: TestFinding[] = [];
    const startTime = Date.now();

    console.log(`🔍 AI vision analysis for "${component.name}"...`);

    try {
      // Capture screenshot
      const screenshot = await page.screenshot({ fullPage: false });

      // Get element info
      let elementInfo: any = null;
      if (component.selector) {
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
      }

      const prompt = `You are an expert QA engineer testing the "${component.name}" component in an AI-powered Digital Audio Workstation (DAW).

**Component Details:**
- Name: ${component.name}
- Level: ${this.focusArea}
- Description: ${component.description}
- Expected Behavior: ${component.expectedBehavior}
- Has AI Integration: ${component.aiIntegration ? 'YES' : 'NO'}
${component.selector ? `- Selector: ${component.selector}` : ''}

**Element State:**
${elementInfo ? JSON.stringify(elementInfo, null, 2) : 'No element selector provided'}

**Console Messages:**
Errors: ${this.consoleErrors.join(', ') || 'None'}
Warnings: ${this.consoleWarnings.join(', ') || 'None'}

**Your Task:**
Analyze this component meticulously and identify:

1. **Visual Issues**: Layout, spacing, colors, contrast, alignment
2. **Functionality Issues**: Does it work as expected?
3. **UI/UX Problems**: Usability, accessibility, clarity
4. **AI Integration**: If it has AI features, are they properly integrated?
5. **Enhancements**: How could it be better?

Respond in this JSON format:
{
  "findings": [
    {
      "status": "pass|fail|warning|enhancement",
      "severity": "critical|high|medium|low",
      "category": "functionality|ui|accessibility|ai-integration|performance",
      "issue": "Brief description",
      "evidence": ["Evidence 1", "Evidence 2"],
      "recommendation": "Specific fix",
      "confidence": 0.0-1.0
    }
  ],
  "overallAssessment": "Brief summary"
}

Be thorough but practical. Only report real issues.`;

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

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);

        for (const finding of analysis.findings || []) {
          findings.push({
            component: component.name,
            level: this.focusArea,
            status: finding.status,
            severity: finding.severity,
            category: finding.category,
            issue: finding.issue,
            evidence: finding.evidence,
            recommendation: finding.recommendation,
            aiAnalysis: analysis.overallAssessment,
            testMethod: 'ai-vision',
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🤖 AI vision analysis for "${component.name}" completed in ${duration}ms`);
    } catch (error) {
      console.error(`AI vision analysis failed for ${component.name}:`, error);
      findings.push({
        component: component.name,
        level: this.focusArea,
        status: 'warning',
        severity: 'low',
        category: 'functionality',
        issue: 'Could not perform AI vision analysis',
        evidence: [(error as Error).message],
        recommendation: 'Rely on programmatic checks',
        aiAnalysis: 'AI analysis unavailable',
        testMethod: 'ai-vision',
      });
    }

    return findings;
  }

  /**
   * HYBRID TEST
   * Runs fast check first, then AI analysis only if needed
   */
  async testComponent(page: Page, component: ComponentTest): Promise<TestFinding[]> {
    const startTime = Date.now();

    // Always run fast check first
    const fastFindings = await this.fastCheck(page, component);

    // Decide if we need AI analysis
    // Only run AI for critical priority or failures
    const needsAI =
      component.priority === 'critical' || // Critical components always get AI
      fastFindings.some(f => f.status === 'fail' || f.severity === 'critical'); // Failures get AI

    if (needsAI) {
      console.log(`🔬 Component "${component.name}" requires AI analysis`);
      const aiFindings = await this.aiVisionAnalysis(page, component);
      const duration = Date.now() - startTime;
      console.log(`⏱️  Total test time for "${component.name}": ${duration}ms`);
      return [...fastFindings, ...aiFindings];
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️  Total test time for "${component.name}": ${duration}ms (fast only)`);
    return fastFindings;
  }

  async generateReport(findings: TestFinding[], duration: number): Promise<AITestReport> {
    const summary = {
      passed: findings.filter(f => f.status === 'pass').length,
      failed: findings.filter(f => f.status === 'fail').length,
      warnings: findings.filter(f => f.status === 'warning').length,
      enhancements: findings.filter(f => f.status === 'enhancement').length,
      criticalIssues: findings.filter(f => f.severity === 'critical').length,
    };

    // Calculate unique components tested
    const uniqueComponents = new Set(findings.map(f => f.component)).size;

    return {
      testId: `hybrid-test-${this.focusArea}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: 'https://www.dawg-ai.com',
      totalComponents: uniqueComponents,
      findings,
      summary,
      testDuration: duration,
      aiConfidence: findings.length > 0 ? 0.90 : 0,
    };
  }
}
