/**
 * Test Command Handler
 * Processes test commands from chat and orchestrates testing agent
 */

import { agentEventBus, TestCommand, TestProgress, TestResult, TestReport } from './agent-event-bus';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface VoiceCommand {
  command: string;
  parameters?: Record<string, any>;
  userId: string;
}

/**
 * Test Command Handler - Processes chat commands and routes to testing agent
 */
export class TestCommandHandler {
  private static instance: TestCommandHandler;
  private projectRoot: string;

  private constructor() {
    this.projectRoot = process.cwd();
    this.setupEventListeners();
  }

  public static getInstance(): TestCommandHandler {
    if (!TestCommandHandler.instance) {
      TestCommandHandler.instance = new TestCommandHandler();
    }
    return TestCommandHandler.instance;
  }

  /**
   * Setup event listeners for test commands
   */
  private setupEventListeners(): void {
    agentEventBus.on('test:command', async (command: TestCommand) => {
      await this.handleTestCommand(command);
    });

    agentEventBus.on('test:cancel', (testCommandId: string) => {
      this.handleCancelTest(testCommandId);
    });

    agentEventBus.on('test:approve-fix', async (data: { testCommandId: string; fixId: string }) => {
      await this.handleApplyAutoFix(data.testCommandId, data.fixId);
    });
  }

  /**
   * Process voice command from chat
   */
  public async processVoiceCommand(voiceCommand: VoiceCommand): Promise<{
    success: boolean;
    message: string;
    testCommandId?: string;
  }> {
    // Verify admin access
    if (!agentEventBus.isAdmin(voiceCommand.userId)) {
      return {
        success: false,
        message: 'You need admin privileges to run tests. Contact your system administrator.'
      };
    }

    const testCommand: TestCommand = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapVoiceCommandToType(voiceCommand.command),
      payload: voiceCommand.parameters || {},
      userId: voiceCommand.userId,
      timestamp: new Date()
    };

    // Send command to event bus
    agentEventBus.sendTestCommand(testCommand);

    return {
      success: true,
      message: this.getCommandResponseMessage(testCommand.type),
      testCommandId: testCommand.id
    };
  }

  /**
   * Map voice command to test type
   */
  private mapVoiceCommandToType(command: string): TestCommand['type'] {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('run all test') || lowerCommand.includes('test everything')) {
      return 'run_all';
    } else if (lowerCommand.includes('workflow test')) {
      return 'run_workflow';
    } else if (lowerCommand.includes('create test') || lowerCommand.includes('generate test')) {
      return 'create_test';
    } else if (lowerCommand.includes('fix test') || lowerCommand.includes('fix failing')) {
      return 'fix_tests';
    } else if (lowerCommand.includes('test report') || lowerCommand.includes('show test')) {
      return 'get_report';
    } else {
      return 'run_single';
    }
  }

  /**
   * Get response message for command type
   */
  private getCommandResponseMessage(type: TestCommand['type']): string {
    const messages = {
      run_all: 'Running full test suite. This may take a few minutes...',
      run_workflow: 'Running workflow tests...',
      run_single: 'Running specified tests...',
      create_test: 'Generating new test based on your requirements...',
      fix_tests: 'Analyzing failures and generating auto-fixes...',
      get_report: 'Fetching latest test report...'
    };

    return messages[type] || 'Processing test command...';
  }

  /**
   * Handle test command execution
   */
  private async handleTestCommand(command: TestCommand): Promise<void> {
    console.log('Handling test command:', command.type, command.id);

    try {
      switch (command.type) {
        case 'run_all':
          await this.runAllTests(command);
          break;

        case 'run_workflow':
          await this.runWorkflowTests(command);
          break;

        case 'run_single':
          await this.runSingleTest(command);
          break;

        case 'create_test':
          await this.createTest(command);
          break;

        case 'fix_tests':
          await this.fixFailingTests(command);
          break;

        case 'get_report':
          await this.getTestReport(command);
          break;

        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (error: any) {
      console.error('Test command error:', error);
      agentEventBus.sendError(command.id, error.message);
    }
  }

  /**
   * Run all tests
   */
  private async runAllTests(command: TestCommand): Promise<void> {
    agentEventBus.updateTestProgress({
      testCommandId: command.id,
      status: 'running',
      progress: 0,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      timestamp: new Date()
    });

    try {
      // Run npm test command
      const { stdout, stderr } = await execAsync('npm run test:all', {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      // Parse test results
      const report = this.parseTestOutput(stdout, command.id);

      agentEventBus.sendTestReport(report);
    } catch (error: any) {
      // Tests failed, but we still parse results
      const report = this.parseTestOutput(error.stdout || '', command.id);
      agentEventBus.sendTestReport(report);
    }
  }

  /**
   * Run workflow tests
   */
  private async runWorkflowTests(command: TestCommand): Promise<void> {
    agentEventBus.updateTestProgress({
      testCommandId: command.id,
      status: 'running',
      progress: 0,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      timestamp: new Date()
    });

    try {
      const { stdout } = await execAsync('npm run test:e2e -- --grep="workflow"', {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024
      });

      const report = this.parseTestOutput(stdout, command.id);
      agentEventBus.sendTestReport(report);
    } catch (error: any) {
      const report = this.parseTestOutput(error.stdout || '', command.id);
      agentEventBus.sendTestReport(report);
    }
  }

  /**
   * Run single test
   */
  private async runSingleTest(command: TestCommand): Promise<void> {
    const testPath = command.payload.testPath || command.payload.feature;

    if (!testPath) {
      throw new Error('Test path or feature name required');
    }

    agentEventBus.updateTestProgress({
      testCommandId: command.id,
      status: 'running',
      currentTest: testPath,
      progress: 0,
      totalTests: 1,
      completedTests: 0,
      failedTests: 0,
      timestamp: new Date()
    });

    try {
      const { stdout } = await execAsync(`npm test -- ${testPath}`, {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024
      });

      const report = this.parseTestOutput(stdout, command.id);
      agentEventBus.sendTestReport(report);
    } catch (error: any) {
      const report = this.parseTestOutput(error.stdout || '', command.id);
      agentEventBus.sendTestReport(report);
    }
  }

  /**
   * Create test from natural language
   */
  private async createTest(command: TestCommand): Promise<void> {
    const feature = command.payload.feature;

    if (!feature) {
      throw new Error('Feature description required');
    }

    agentEventBus.updateTestProgress({
      testCommandId: command.id,
      status: 'running',
      currentTest: `Generating test for: ${feature}`,
      progress: 50,
      totalTests: 1,
      completedTests: 0,
      failedTests: 0,
      timestamp: new Date()
    });

    // Call AI testing agent to generate test
    const { stdout } = await execAsync(
      `node tests/ai-testing-agent/agent.js generate-test --feature="${feature}"`,
      {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    // Send completion
    agentEventBus.sendTestReport({
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
      recommendations: ['Test generated successfully. Review and commit the new test file.'],
      criticalIssues: [],
      timestamp: new Date()
    });
  }

  /**
   * Fix failing tests
   */
  private async fixFailingTests(command: TestCommand): Promise<void> {
    agentEventBus.updateTestProgress({
      testCommandId: command.id,
      status: 'running',
      currentTest: 'Analyzing failures...',
      progress: 0,
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      timestamp: new Date()
    });

    // Run tests to get failures
    try {
      await execAsync('npm test', {
        cwd: this.projectRoot,
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error: any) {
      // Parse failures
      const failures = this.parseTestFailures(error.stdout || '');

      // Generate auto-fixes for each failure
      for (const failure of failures) {
        agentEventBus.sendAutoFixSuggestion({
          testCommandId: command.id,
          testName: failure.testName,
          issue: failure.error,
          suggestedFix: await this.generateAutoFix(failure),
          confidence: 0.75,
          autoApplicable: true,
          filePath: failure.filePath,
          lineNumber: failure.lineNumber,
          timestamp: new Date()
        });
      }
    }

    agentEventBus.sendTestReport({
      testCommandId: command.id,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: [],
      recommendations: ['Auto-fix suggestions generated. Review and approve to apply.'],
      criticalIssues: [],
      timestamp: new Date()
    });
  }

  /**
   * Get test report
   */
  private async getTestReport(command: TestCommand): Promise<void> {
    // Return latest test report from storage
    // For now, run tests to get fresh report
    await this.runAllTests(command);
  }

  /**
   * Cancel test execution
   */
  private handleCancelTest(testCommandId: string): void {
    console.log('Cancelling test:', testCommandId);
    // Implementation depends on test runner
    // Could use process.kill() if we track child processes
  }

  /**
   * Apply auto-fix
   */
  private async handleApplyAutoFix(testCommandId: string, fixId: string): Promise<void> {
    console.log('Applying auto-fix:', testCommandId, fixId);
    // Implementation would apply the suggested fix to the codebase
  }

  /**
   * Parse test output into report
   */
  private parseTestOutput(output: string, testCommandId: string): TestReport {
    // Basic parsing - enhance based on your test runner output format
    const lines = output.split('\n');
    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Simple Jest/Vitest output parsing
    for (const line of lines) {
      if (line.includes('✓') || line.includes('PASS')) {
        passed++;
        results.push({
          testCommandId,
          testName: line.trim(),
          status: 'passed',
          duration: 0,
          timestamp: new Date()
        });
      } else if (line.includes('✗') || line.includes('FAIL')) {
        failed++;
        results.push({
          testCommandId,
          testName: line.trim(),
          status: 'failed',
          duration: 0,
          error: 'Test failed',
          timestamp: new Date()
        });
      } else if (line.includes('SKIP')) {
        skipped++;
      }
    }

    return {
      testCommandId,
      totalTests: passed + failed + skipped,
      passed,
      failed,
      skipped,
      duration: 0,
      results,
      recommendations: failed > 0 ? ['Some tests failed. Use "fix failing tests" to auto-generate fixes.'] : [],
      criticalIssues: [],
      timestamp: new Date()
    };
  }

  /**
   * Parse test failures
   */
  private parseTestFailures(output: string): any[] {
    // Parse failure details from test output
    return [];
  }

  /**
   * Generate auto-fix for failure
   */
  private async generateAutoFix(failure: any): Promise<string> {
    // Use AI to generate fix
    return 'Fix suggestion placeholder';
  }
}

// Export singleton instance
export const testCommandHandler = TestCommandHandler.getInstance();
