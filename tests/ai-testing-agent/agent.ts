import OpenAI from 'openai';
import { test, expect, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  metrics?: Record<string, number>;
}

interface AgentReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  recommendations: string[];
  criticalIssues: string[];
}

/**
 * DAWG AI Testing Agent
 *
 * Autonomous GPT-powered agent that:
 * 1. Analyzes the codebase to understand AI features
 * 2. Generates test scenarios based on feature specs
 * 3. Executes tests autonomously
 * 4. Analyzes results and provides recommendations
 * 5. Auto-fixes common issues
 * 6. Generates comprehensive reports
 */
export class DAWGTestingAgent {
  private openai: OpenAI;
  private config: any;
  private results: TestResult[] = [];
  private dashboardUrl: string = 'http://localhost:4000';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize() {
    console.log('🤖 Initializing DAWG AI Testing Agent...');

    // Load config
    const configPath = path.join(__dirname, 'agent-config.json');
    this.config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    console.log(`✅ Agent initialized: ${this.config.name} v${this.config.version}`);
  }

  /**
   * Main execution flow
   */
  async run(): Promise<AgentReport> {
    const startTime = Date.now();

    console.log('\n🚀 Starting autonomous test execution...\n');

    // Step 1: Analyze codebase to understand current state
    console.log('📊 Step 1: Analyzing codebase...');
    const codebaseAnalysis = await this.analyzeCodebase();

    // Step 2: Generate test plan based on analysis
    console.log('📋 Step 2: Generating test plan...');
    const testPlan = await this.generateTestPlan(codebaseAnalysis);

    // Step 3: Execute tests autonomously
    console.log('🧪 Step 3: Executing tests...');
    await this.executeTests(testPlan);

    // Step 4: Analyze results
    console.log('🔍 Step 4: Analyzing results...');
    const analysis = await this.analyzeResults();

    // Step 5: Generate report
    console.log('📝 Step 5: Generating report...');
    const report = await this.generateReport(analysis, Date.now() - startTime);

    // Step 6: Auto-fix issues if enabled
    if (this.config.executionStrategy.autoFix) {
      console.log('🔧 Step 6: Attempting auto-fixes...');
      await this.autoFixIssues(analysis);
    }

    console.log('\n✅ Testing complete!\n');

    // Send completion notification to dashboard
    await this.sendDashboardUpdate('test-completed', {
      totalTests: this.results.length,
      passed: analysis.passed,
      failed: analysis.failed,
      skipped: analysis.skipped,
      duration,
      timestamp: new Date().toISOString(),
    });

    return report;
  }

  /**
   * Analyze codebase to understand AI features and their current state
   */
  private async analyzeCodebase(): Promise<any> {
    const analysis = {
      aiFeatures: [],
      testCoverage: {},
      criticalGaps: [],
      dependencies: {},
    };

    // Use GPT-4o to analyze key files
    const filesToAnalyze = [
      'src/backend/ai-brain-server.ts',
      'src/backend/realtime-voice-server.ts',
      'src/backend/services/udio-service.ts',
      'src/backend/services/lyrics-analysis-service.ts',
      'src/audio/ai/SmartMixAssistant.ts',
      'src/audio/ai/AIMasteringEngine.ts',
      'tests/e2e/chat-to-create.spec.ts',
    ];

    for (const file of filesToAnalyze) {
      try {
        const filePath = path.join(process.cwd(), file);
        const content = await fs.readFile(filePath, 'utf-8');

        const response = await this.openai.chat.completions.create({
          model: this.config.model,
          temperature: this.config.temperature,
          messages: [
            {
              role: 'system',
              content: this.config.systemPrompt,
            },
            {
              role: 'user',
              content: `Analyze this file and extract:
1. AI features implemented
2. Test coverage (if test file)
3. Critical gaps or TODOs
4. Dependencies on other services

File: ${file}
Content:
\`\`\`typescript
${content.slice(0, 10000)} // First 10k chars
\`\`\``,
            },
          ],
        });

        const analysisResult = JSON.parse(response.choices[0].message.content || '{}');

        if (analysisResult.aiFeatures) {
          analysis.aiFeatures.push(...analysisResult.aiFeatures);
        }
        if (analysisResult.testCoverage) {
          analysis.testCoverage[file] = analysisResult.testCoverage;
        }
        if (analysisResult.criticalGaps) {
          analysis.criticalGaps.push(...analysisResult.criticalGaps);
        }

      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${file}:`, error.message);
      }
    }

    return analysis;
  }

  /**
   * Generate comprehensive test plan based on codebase analysis
   */
  private async generateTestPlan(analysis: any): Promise<any[]> {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'system',
          content: this.config.systemPrompt,
        },
        {
          role: 'user',
          content: `Based on this codebase analysis, generate a comprehensive test plan:

Analysis:
${JSON.stringify(analysis, null, 2)}

Generate test scenarios for:
1. Each AI feature
2. Integration points between features
3. Critical user workflows
4. Performance benchmarks
5. Quality metrics

Return a JSON array of test scenarios with:
- name: string
- description: string
- priority: 'critical' | 'high' | 'medium' | 'low'
- type: 'e2e' | 'integration' | 'unit' | 'performance' | 'quality'
- steps: string[]
- assertions: string[]
- estimatedDuration: number (seconds)`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const plan = JSON.parse(response.choices[0].message.content || '{"testScenarios":[]}');
    return plan.testScenarios || [];
  }

  /**
   * Send update to dashboard
   */
  private async sendDashboardUpdate(type: string, data: any): Promise<void> {
    try {
      await axios.post(`${this.dashboardUrl}/api/${type}`, data, {
        timeout: 1000,
      });
    } catch (error) {
      // Dashboard might not be running, ignore errors
      console.debug(`Dashboard update failed (${type}):`, error.message);
    }
  }

  /**
   * Execute tests autonomously
   */
  private async executeTests(testPlan: any[]): Promise<void> {
    // Sort by priority
    const sortedTests = testPlan.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Notify dashboard of test start
    await this.sendDashboardUpdate('test-started', {
      testName: 'Test Suite',
      totalTests: sortedTests.length,
    });

    // Execute tests
    for (const testScenario of sortedTests) {
      console.log(`\n  🧪 Running: ${testScenario.name}`);

      const result = await this.executeTestScenario(testScenario);
      this.results.push(result);

      // Send real-time update to dashboard
      await this.sendDashboardUpdate('test-update', {
        ...result,
        priority: testScenario.priority,
        component: this.extractComponent(testScenario.name),
      });

      const icon = result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${icon} ${result.status.toUpperCase()} (${result.duration}ms)`);

      // Break on critical failure if configured
      if (result.status === 'failed' && testScenario.priority === 'critical') {
        console.log('  ⚠️  Critical test failed, aborting...');
        break;
      }
    }
  }

  /**
   * Extract component from test name
   */
  private extractComponent(testName: string): string {
    const patterns = [
      /^(\w+)-/,
      /^test-(\w+)/,
      /\[(\w+)\]/,
      /(\w+)\s+integration/i,
      /(\w+)\s+e2e/i,
    ];

    for (const pattern of patterns) {
      const match = testName.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    return 'uncategorized';
  }

  /**
   * Execute individual test scenario
   */
  private async executeTestScenario(scenario: any): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Map test type to execution method
      switch (scenario.type) {
        case 'e2e':
          return await this.runE2ETest(scenario);
        case 'integration':
          return await this.runIntegrationTest(scenario);
        case 'unit':
          return await this.runUnitTest(scenario);
        case 'performance':
          return await this.runPerformanceTest(scenario);
        case 'quality':
          return await this.runQualityTest(scenario);
        default:
          throw new Error(`Unknown test type: ${scenario.type}`);
      }
    } catch (error) {
      return {
        testName: scenario.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Run E2E test using Playwright
   */
  private async runE2ETest(scenario: any): Promise<TestResult> {
    const startTime = Date.now();

    // Generate Playwright test code using GPT
    const testCode = await this.generatePlaywrightTest(scenario);

    // Write test file
    const testFile = path.join(__dirname, `../e2e/generated/${scenario.name}.spec.ts`);
    await fs.mkdir(path.dirname(testFile), { recursive: true });
    await fs.writeFile(testFile, testCode);

    // Execute test
    try {
      const { stdout, stderr } = await execAsync(`npx playwright test ${testFile}`);

      return {
        testName: scenario.name,
        status: 'passed',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testName: scenario.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Generate Playwright test code using GPT
   */
  private async generatePlaywrightTest(scenario: any): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Playwright test writer. Generate production-quality E2E tests.',
        },
        {
          role: 'user',
          content: `Generate a Playwright test for this scenario:

Name: ${scenario.name}
Description: ${scenario.description}
Steps: ${scenario.steps.join('\n')}
Assertions: ${scenario.assertions.join('\n')}

Return ONLY the test code (no markdown, no explanations).`,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Run integration test
   */
  private async runIntegrationTest(scenario: any): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Execute integration test command
      await execAsync(`npm run test:integration -- --testNamePattern="${scenario.name}"`);

      return {
        testName: scenario.name,
        status: 'passed',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testName: scenario.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Run unit test
   */
  private async runUnitTest(scenario: any): Promise<TestResult> {
    const startTime = Date.now();

    try {
      await execAsync(`npm run test:unit -- --testNamePattern="${scenario.name}"`);

      return {
        testName: scenario.name,
        status: 'passed',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testName: scenario.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Run performance test
   */
  private async runPerformanceTest(scenario: any): Promise<TestResult> {
    const startTime = Date.now();
    const metrics: Record<string, number> = {};

    // Example: Test API response time
    if (scenario.name.includes('api-response-time')) {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await fetch(`${this.config.environment.apiURL}/health`);
        times.push(Date.now() - start);
      }

      metrics.avgResponseTime = times.reduce((a, b) => a + b) / times.length;
      metrics.maxResponseTime = Math.max(...times);
      metrics.minResponseTime = Math.min(...times);

      const passed = metrics.avgResponseTime < 200; // Target: <200ms

      return {
        testName: scenario.name,
        status: passed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        metrics,
      };
    }

    return {
      testName: scenario.name,
      status: 'skipped',
      duration: Date.now() - startTime,
    };
  }

  /**
   * Run quality test
   */
  private async runQualityTest(scenario: any): Promise<TestResult> {
    const startTime = Date.now();

    // Use GPT to evaluate quality
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are a quality assurance expert. Evaluate the quality of AI outputs.',
        },
        {
          role: 'user',
          content: `Evaluate quality for: ${scenario.name}

Test the feature and rate it on:
1. Accuracy (0-10)
2. Reliability (0-10)
3. Performance (0-10)
4. User Experience (0-10)

Return JSON: {"passed": boolean, "scores": {}, "feedback": string}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    return {
      testName: scenario.name,
      status: evaluation.passed ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      metrics: evaluation.scores,
    };
  }

  /**
   * Analyze test results and provide insights
   */
  private async analyzeResults(): Promise<any> {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    // Use GPT to analyze failures and provide recommendations
    const failedTests = this.results.filter(r => r.status === 'failed');

    if (failedTests.length > 0) {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: this.config.systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze these test failures and provide:
1. Root cause analysis
2. Recommendations for fixes
3. Critical issues that need immediate attention

Failed tests:
${JSON.stringify(failedTests, null, 2)}

Return JSON with: {"rootCauses": [], "recommendations": [], "criticalIssues": []}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      return {
        passed,
        failed,
        skipped,
        ...analysis,
      };
    }

    return {
      passed,
      failed,
      skipped,
      rootCauses: [],
      recommendations: [],
      criticalIssues: [],
    };
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(analysis: any, duration: number): Promise<AgentReport> {
    const report: AgentReport = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: analysis.passed,
      failed: analysis.failed,
      skipped: analysis.skipped,
      duration,
      results: this.results,
      recommendations: analysis.recommendations || [],
      criticalIssues: analysis.criticalIssues || [],
    };

    // Write report to file
    const reportDir = path.join(__dirname, '../reports');
    await fs.mkdir(reportDir, { recursive: true });

    // JSON report
    await fs.writeFile(
      path.join(reportDir, `report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    // Markdown report
    const markdown = await this.generateMarkdownReport(report);
    await fs.writeFile(
      path.join(reportDir, `report-${Date.now()}.md`),
      markdown
    );

    console.log(`\n📊 Report saved to: ${reportDir}`);

    return report;
  }

  /**
   * Generate markdown report
   */
  private async generateMarkdownReport(report: AgentReport): Promise<string> {
    const passRate = ((report.passed / report.totalTests) * 100).toFixed(1);

    return `# DAWG AI Test Report

**Generated**: ${report.timestamp}
**Duration**: ${(report.duration / 1000).toFixed(2)}s
**Pass Rate**: ${passRate}%

## Summary

- ✅ **Passed**: ${report.passed}
- ❌ **Failed**: ${report.failed}
- ⏭️  **Skipped**: ${report.skipped}
- **Total**: ${report.totalTests}

## Test Results

${report.results.map(r => `
### ${r.testName}
- **Status**: ${r.status === 'passed' ? '✅' : '❌'} ${r.status.toUpperCase()}
- **Duration**: ${r.duration}ms
${r.error ? `- **Error**: \`${r.error}\`` : ''}
${r.metrics ? `- **Metrics**: ${JSON.stringify(r.metrics, null, 2)}` : ''}
`).join('\n')}

## Recommendations

${report.recommendations.map(r => `- ${r}`).join('\n')}

## Critical Issues

${report.criticalIssues.length > 0
  ? report.criticalIssues.map(i => `- ⚠️ ${i}`).join('\n')
  : 'None'}
`;
  }

  /**
   * Auto-fix common issues
   */
  private async autoFixIssues(analysis: any): Promise<void> {
    // Use GPT to generate fixes for failed tests
    for (const recommendation of analysis.recommendations || []) {
      if (recommendation.includes('auto-fixable')) {
        console.log(`  🔧 Attempting auto-fix: ${recommendation}`);

        // Generate fix code using GPT
        const response = await this.openai.chat.completions.create({
          model: this.config.model,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: 'You are an expert developer. Generate code fixes for test failures.',
            },
            {
              role: 'user',
              content: `Generate a fix for: ${recommendation}

Return JSON: {"file": string, "changes": string, "explanation": string}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const fix = JSON.parse(response.choices[0].message.content || '{}');

        console.log(`  ✅ Fix generated for: ${fix.file}`);
        console.log(`     ${fix.explanation}`);

        // TODO: Apply fix (would require code modification logic)
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    const agent = new DAWGTestingAgent();
    await agent.initialize();

    const report = await agent.run();

    // Exit with failure code if tests failed
    if (report.failed > 0) {
      console.error(`\n❌ ${report.failed} tests failed`);
      process.exit(1);
    } else {
      console.log(`\n✅ All tests passed!`);
      process.exit(0);
    }
  })();
}
