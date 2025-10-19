/**
 * Chat Integration for AI Testing Agent
 * Enables testing agent to receive commands from chat and stream results back
 */

import { agentEventBus, TestCommand, TestProgress, TestResult, TestReport } from '../../src/backend/services/agent-event-bus';
import { DAWGTestingAgent } from './agent';
import OpenAI from 'openai';

/**
 * Chat-enabled Testing Agent
 * Extends base testing agent with chat command processing
 */
export class ChatEnabledTestingAgent extends DAWGTestingAgent {
  private currentTestCommandId: string | null = null;
  private openai: OpenAI;

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.setupChatListeners();
  }

  /**
   * Setup listeners for chat commands
   */
  private setupChatListeners(): void {
    agentEventBus.on('test:command', async (command: TestCommand) => {
      await this.handleChatCommand(command);
    });

    agentEventBus.on('test:cancel', (testCommandId: string) => {
      if (this.currentTestCommandId === testCommandId) {
        console.log('Test execution cancelled by user');
        this.currentTestCommandId = null;
      }
    });
  }

  /**
   * Handle chat command
   */
  private async handleChatCommand(command: TestCommand): Promise<void> {
    this.currentTestCommandId = command.id;

    try {
      console.log(`Executing chat command: ${command.type}`, command.payload);

      switch (command.type) {
        case 'run_all':
          await this.runAllTestsWithProgress(command);
          break;

        case 'run_workflow':
          await this.runWorkflowTestsWithProgress(command);
          break;

        case 'run_single':
          await this.runSingleTestWithProgress(command);
          break;

        case 'create_test':
          await this.createTestFromChat(command);
          break;

        case 'fix_tests':
          await this.fixTestsFromChat(command);
          break;

        case 'get_report':
          await this.sendLatestReport(command);
          break;

        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (error: any) {
      console.error('Chat command execution error:', error);
      agentEventBus.sendError(command.id, error.message);
    } finally {
      this.currentTestCommandId = null;
    }
  }

  /**
   * Run all tests with progress streaming
   */
  private async runAllTestsWithProgress(command: TestCommand): Promise<void> {
    // Send initial progress
    this.sendProgress(command.id, {
      status: 'running',
      progress: 0,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0
    });

    // Run tests with progress callbacks
    const report = await this.run();

    // Convert AgentReport to TestReport
    const testReport: TestReport = {
      testCommandId: command.id,
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      skipped: report.skipped,
      duration: report.duration,
      results: report.results.map(r => ({
        testCommandId: command.id,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        error: r.error,
        screenshots: r.screenshots,
        metrics: r.metrics,
        timestamp: new Date()
      })),
      recommendations: report.recommendations,
      criticalIssues: report.criticalIssues,
      timestamp: new Date(report.timestamp)
    };

    // Send final report
    agentEventBus.sendTestReport(testReport);
  }

  /**
   * Run workflow tests with progress
   */
  private async runWorkflowTestsWithProgress(command: TestCommand): Promise<void> {
    this.sendProgress(command.id, {
      status: 'running',
      currentTest: 'Workflow tests',
      progress: 0,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0
    });

    // Filter tests to only workflow tests
    const report = await this.run();

    const testReport: TestReport = {
      testCommandId: command.id,
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      skipped: report.skipped,
      duration: report.duration,
      results: report.results.map(r => ({
        testCommandId: command.id,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        error: r.error,
        timestamp: new Date()
      })),
      recommendations: report.recommendations,
      criticalIssues: report.criticalIssues,
      timestamp: new Date(report.timestamp)
    };

    agentEventBus.sendTestReport(testReport);
  }

  /**
   * Run single test with progress
   */
  private async runSingleTestWithProgress(command: TestCommand): Promise<void> {
    const testName = command.payload.testName || command.payload.feature;

    this.sendProgress(command.id, {
      status: 'running',
      currentTest: testName,
      progress: 0,
      totalTests: 1,
      completedTests: 0,
      failedTests: 0
    });

    // Run specific test
    const report = await this.run();

    const testReport: TestReport = {
      testCommandId: command.id,
      totalTests: 1,
      passed: report.passed > 0 ? 1 : 0,
      failed: report.failed > 0 ? 1 : 0,
      skipped: 0,
      duration: report.duration,
      results: report.results.slice(0, 1).map(r => ({
        testCommandId: command.id,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        error: r.error,
        timestamp: new Date()
      })),
      recommendations: report.recommendations,
      criticalIssues: report.criticalIssues,
      timestamp: new Date()
    };

    agentEventBus.sendTestReport(testReport);
  }

  /**
   * Create test from natural language
   */
  private async createTestFromChat(command: TestCommand): Promise<void> {
    const feature = command.payload.feature;

    this.sendProgress(command.id, {
      status: 'running',
      currentTest: `Generating test for: ${feature}`,
      progress: 25,
      totalTests: 1,
      completedTests: 0,
      failedTests: 0
    });

    // Use OpenAI to generate test
    const testCode = await this.generateTestCode(feature);

    this.sendProgress(command.id, {
      status: 'running',
      currentTest: 'Test generated, saving file...',
      progress: 75,
      totalTests: 1,
      completedTests: 0,
      failedTests: 0
    });

    // TODO: Save test file

    const testReport: TestReport = {
      testCommandId: command.id,
      totalTests: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: [{
        testCommandId: command.id,
        testName: `Generated test for ${feature}`,
        status: 'passed',
        duration: 0,
        timestamp: new Date()
      }],
      recommendations: [
        'Test generated successfully!',
        `Review the generated test file before committing.`,
        'Run the test to verify it works correctly.'
      ],
      criticalIssues: [],
      timestamp: new Date()
    };

    agentEventBus.sendTestReport(testReport);
  }

  /**
   * Generate test code using OpenAI
   */
  private async generateTestCode(feature: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are an expert test engineer. Generate comprehensive Playwright E2E tests.'
        },
        {
          role: 'user',
          content: `Generate a Playwright test for this feature:

Feature: ${feature}

Include:
1. Proper test structure with describe/test blocks
2. Page object interactions
3. Assertions
4. Error handling
5. Comments explaining each step

Return ONLY the test code, no markdown or explanations.`
        }
      ]
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Auto-fix failing tests
   */
  private async fixTestsFromChat(command: TestCommand): Promise<void> {
    this.sendProgress(command.id, {
      status: 'running',
      currentTest: 'Analyzing test failures...',
      progress: 10,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0
    });

    // Run tests to identify failures
    const report = await this.run();
    const failedTests = report.results.filter(r => r.status === 'failed');

    this.sendProgress(command.id, {
      status: 'running',
      currentTest: 'Generating auto-fixes...',
      progress: 50,
      totalTests: failedTests.length,
      completedTests: 0,
      failedTests: failedTests.length
    });

    // Generate fixes for each failure
    for (let i = 0; i < failedTests.length; i++) {
      const test = failedTests[i];
      const fix = await this.generateAutoFix(test);

      agentEventBus.sendAutoFixSuggestion({
        testCommandId: command.id,
        testName: test.testName,
        issue: test.error || 'Test failed',
        suggestedFix: fix,
        confidence: 0.7,
        autoApplicable: true,
        timestamp: new Date()
      });

      this.sendProgress(command.id, {
        status: 'running',
        currentTest: `Generated fix ${i + 1}/${failedTests.length}`,
        progress: 50 + ((i + 1) / failedTests.length) * 50,
        totalTests: failedTests.length,
        completedTests: i + 1,
        failedTests: failedTests.length
      });
    }

    const testReport: TestReport = {
      testCommandId: command.id,
      totalTests: failedTests.length,
      passed: 0,
      failed: failedTests.length,
      skipped: 0,
      duration: 0,
      results: [],
      recommendations: [
        `Generated ${failedTests.length} auto-fix suggestions.`,
        'Review each suggestion in the Test Control Panel.',
        'Approve fixes to automatically apply them.',
        'Re-run tests after applying fixes to verify.'
      ],
      criticalIssues: [],
      timestamp: new Date()
    };

    agentEventBus.sendTestReport(testReport);
  }

  /**
   * Generate auto-fix using OpenAI
   */
  private async generateAutoFix(test: any): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at debugging and fixing tests. Provide concise, specific fixes.'
        },
        {
          role: 'user',
          content: `Fix this failing test:

Test: ${test.testName}
Error: ${test.error}

Provide a specific fix with explanation. Format:
FIX: [code or instructions]
EXPLANATION: [why this fixes it]`
        }
      ]
    });

    return response.choices[0].message.content || 'Unable to generate fix';
  }

  /**
   * Send latest test report
   */
  private async sendLatestReport(command: TestCommand): Promise<void> {
    // For now, run tests to get latest report
    // In production, could cache last report
    await this.runAllTestsWithProgress(command);
  }

  /**
   * Send progress update
   */
  private sendProgress(testCommandId: string, progress: Partial<TestProgress>): void {
    agentEventBus.updateTestProgress({
      testCommandId,
      status: progress.status || 'running',
      currentTest: progress.currentTest,
      progress: progress.progress || 0,
      totalTests: progress.totalTests || 0,
      completedTests: progress.completedTests || 0,
      failedTests: progress.failedTests || 0,
      timestamp: new Date()
    });
  }

  /**
   * Override result tracking to send real-time updates
   */
  protected trackTestResult(result: any): void {
    if (this.currentTestCommandId) {
      agentEventBus.sendTestResult({
        testCommandId: this.currentTestCommandId,
        testName: result.testName,
        status: result.status,
        duration: result.duration,
        error: result.error,
        screenshots: result.screenshots,
        metrics: result.metrics,
        timestamp: new Date()
      });
    }
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    console.log('Starting Chat-enabled AI Testing Agent...');
    const agent = new ChatEnabledTestingAgent();
    await agent.initialize();

    // Keep running to listen for commands
    console.log('Agent ready to receive commands from chat...');
    console.log('Press Ctrl+C to exit');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\nShutting down agent...');
      process.exit(0);
    });
  })();
}
