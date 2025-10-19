/**
 * Integration Example: Auto-Fix System with DAWG Testing Agent
 *
 * This file shows how to integrate the auto-fix PR system with the existing
 * DAWG AI Testing Agent for seamless automated testing and fixing.
 */

import { DAWGTestingAgent } from '../agent';
import { AutoFixOrchestrator } from './index';
import { TestFailure } from './fix-generator';

/**
 * Enhanced Testing Agent with Auto-Fix Capabilities
 */
export class EnhancedDAWGTestingAgent extends DAWGTestingAgent {
  private autoFixOrchestrator: AutoFixOrchestrator;
  private autoFixEnabled: boolean;
  private autoCreatePR: boolean;

  constructor(options: {
    autoFixEnabled?: boolean;
    autoCreatePR?: boolean;
  } = {}) {
    super();
    this.autoFixEnabled = options.autoFixEnabled ?? true;
    this.autoCreatePR = options.autoCreatePR ?? false;
    this.autoFixOrchestrator = new AutoFixOrchestrator();
  }

  /**
   * Override initialize to also initialize auto-fix system
   */
  async initialize(): Promise<void> {
    await super.initialize();

    if (this.autoFixEnabled) {
      console.log('Initializing Auto-Fix System...');
      await this.autoFixOrchestrator.initialize();
      console.log('Auto-Fix System ready');
    }
  }

  /**
   * Override run to add auto-fix capability
   */
  async run(): Promise<any> {
    console.log('\n🚀 Running Enhanced Testing Agent with Auto-Fix...\n');

    // Run the original test suite
    const report = await super.run();

    // If tests failed and auto-fix is enabled, attempt to fix them
    if (report.failed > 0 && this.autoFixEnabled) {
      console.log('\n🔧 Tests failed. Attempting auto-fix...\n');
      await this.autoFixFailedTests(report);
    }

    return report;
  }

  /**
   * Automatically fix failed tests
   */
  private async autoFixFailedTests(report: any): Promise<void> {
    const failedTests = report.results.filter((r: any) => r.status === 'failed');

    console.log(`Found ${failedTests.length} failed test(s) to fix\n`);

    for (const failedTest of failedTests) {
      try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Attempting to fix: ${failedTest.testName}`);
        console.log(`${'='.repeat(80)}\n`);

        // Convert test result to TestFailure format
        const failure: TestFailure = this.convertToTestFailure(failedTest);

        // Attempt to fix
        const fixResult = await this.autoFixOrchestrator.processTestFailure(
          failure,
          {
            autoApply: true,
            createPR: this.autoCreatePR,
            reviewers: this.getReviewersForTest(failedTest),
          }
        );

        if (fixResult.success) {
          console.log(`✅ Successfully fixed: ${failedTest.testName}\n`);

          if (fixResult.prResult?.success) {
            console.log(`📝 PR created: ${fixResult.prResult.prUrl}\n`);
          }
        } else {
          console.log(`❌ Failed to fix: ${failedTest.testName}`);
          console.log(`   Reason: ${fixResult.error}\n`);
        }
      } catch (error) {
        console.error(
          `❌ Error fixing ${failedTest.testName}: ${error.message}\n`
        );
      }
    }
  }

  /**
   * Convert test result to TestFailure format
   */
  private convertToTestFailure(testResult: any): TestFailure {
    // Determine failure type from error message
    let failureType: TestFailure['failureType'] = 'unknown';
    const errorMsg = testResult.error || '';

    if (errorMsg.includes('Timeout') || errorMsg.includes('timeout')) {
      failureType = 'timeout';
    } else if (errorMsg.includes('expect') || errorMsg.includes('assert')) {
      failureType = 'assertion';
    } else if (errorMsg.includes('Error:')) {
      failureType = 'runtime';
    }

    // Extract test file from test name or use default
    const testFile = this.inferTestFile(testResult.testName);

    return {
      testName: testResult.testName,
      testFile,
      errorMessage: errorMsg,
      stackTrace: testResult.stackTrace,
      failureType,
      context: {
        beforeCode: testResult.context?.before,
        failingCode: testResult.context?.failing,
        expectedValue: testResult.context?.expected,
        actualValue: testResult.context?.actual,
      },
    };
  }

  /**
   * Infer test file path from test name
   */
  private inferTestFile(testName: string): string {
    // Map test names to likely file paths
    const mapping: Record<string, string> = {
      'voice-chat': 'tests/e2e/voice-chat.spec.ts',
      'music-generation': 'tests/e2e/chat-to-create.spec.ts',
      'lyrics-analysis': 'tests/integration/lyrics-analysis.test.ts',
      'smart-mix': 'tests/integration/smart-mix.test.ts',
      'mastering': 'tests/integration/mastering.test.ts',
    };

    for (const [key, file] of Object.entries(mapping)) {
      if (testName.toLowerCase().includes(key)) {
        return file;
      }
    }

    // Default to e2e test
    return 'tests/e2e/unknown.spec.ts';
  }

  /**
   * Get appropriate reviewers based on test type
   */
  private getReviewersForTest(testResult: any): string[] {
    const testName = testResult.testName.toLowerCase();

    // Map test types to reviewers
    if (testName.includes('voice') || testName.includes('realtime')) {
      return ['voice-team-lead', 'qa-engineer'];
    } else if (testName.includes('music') || testName.includes('generation')) {
      return ['ai-team-lead', 'qa-engineer'];
    } else if (testName.includes('mix') || testName.includes('master')) {
      return ['audio-team-lead', 'qa-engineer'];
    }

    // Default reviewers
    return ['qa-engineer'];
  }
}

/**
 * Example: Run enhanced agent from CLI
 */
async function runEnhancedAgent() {
  const agent = new EnhancedDAWGTestingAgent({
    autoFixEnabled: true,
    autoCreatePR: true,
  });

  await agent.initialize();

  const report = await agent.run();

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('ENHANCED TESTING AGENT - FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Auto-Fixed: ${report.autoFixed || 0}`);
  console.log(`PRs Created: ${report.prsCreated || 0}`);
  console.log('='.repeat(80) + '\n');

  return report;
}

/**
 * Example: Integrate with existing test runner
 */
export function integrateWithPlaywright() {
  // Add to playwright.config.ts
  return {
    reporter: [
      ['list'],
      ['html'],
      // Custom reporter that triggers auto-fix
      [
        './tests/ai-testing-agent/auto-fix/playwright-reporter.ts',
        {
          autoFix: true,
          createPR: true,
        },
      ],
    ],
  };
}

/**
 * Example: Integrate with Jest
 */
export function integrateWithJest() {
  // Add to jest.config.js
  return {
    testResultsProcessor: './tests/ai-testing-agent/auto-fix/jest-processor.js',
    globals: {
      autoFix: true,
      createPR: true,
    },
  };
}

/**
 * Example: GitHub Actions integration
 */
export function generateGitHubAction() {
  return `
name: AI Testing with Auto-Fix

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-fix:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run AI Testing Agent with Auto-Fix
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          npm run test:ai-agent -- \\
            --auto-fix \\
            --create-pr \\
            --reviewers="qa-team"

      - name: Upload test reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: tests/reports/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(
              fs.readFileSync('tests/reports/report-latest.json', 'utf8')
            );

            const comment = \`
            ## AI Testing Agent Results

            - Tests Passed: \${report.passed}
            - Tests Failed: \${report.failed}
            - Auto-Fixed: \${report.autoFixed || 0}
            - PRs Created: \${report.prsCreated || 0}

            \${report.prsCreated > 0 ? '🤖 Auto-fix PRs have been created for failing tests!' : ''}
            \`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
`;
}

/**
 * Example: Pre-commit hook integration
 */
export function generatePreCommitHook() {
  return `#!/bin/bash
# .git/hooks/pre-commit

echo "Running AI Testing Agent..."

# Run tests
npm run test:ai-agent

# Check exit code
if [ $? -ne 0 ]; then
  echo ""
  echo "Tests failed. Running auto-fix..."

  # Run with auto-fix (but don't create PR in pre-commit)
  npm run test:ai-agent -- --auto-fix --no-pr

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tests fixed! Please review the changes."
    echo "   Run 'git diff' to see what was fixed."
    echo ""
    read -p "Accept auto-fixes and continue commit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git add -u
      exit 0
    else
      echo "Commit cancelled. Please review and fix manually."
      exit 1
    fi
  else
    echo "❌ Auto-fix failed. Please fix manually."
    exit 1
  fi
fi

exit 0
`;
}

/**
 * Example: Monitoring and alerting
 */
export class AutoFixMonitor {
  async trackMetrics() {
    return {
      totalFailures: 0,
      autoFixAttempts: 0,
      autoFixSuccesses: 0,
      autoFixFailures: 0,
      prsCreated: 0,
      prsMerged: 0,
      avgConfidence: 0,
      avgFixTime: 0,
      topFailureTypes: [],
      learningRate: 0, // How much better we're getting over time
    };
  }

  async sendAlert(metrics: any) {
    // Send to Slack, email, etc.
    console.log('Auto-Fix Metrics:', metrics);
  }
}

// CLI execution
if (require.main === module) {
  runEnhancedAgent().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  runEnhancedAgent,
  EnhancedDAWGTestingAgent,
};
