import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { FixOption } from './fix-generator';

const execAsync = promisify(exec);

export interface ValidationResult {
  success: boolean;
  allPassed: boolean;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  confidence: number; // 0-1
  errors: TestError[];
  warnings: string[];
  metrics?: {
    coverageChange?: number;
    performanceImpact?: number;
    breakingChanges?: number;
  };
}

export interface TestError {
  testName: string;
  errorMessage: string;
  isOriginalTest: boolean;
  isNewFailure: boolean;
}

export interface ValidationConfig {
  runFullTestSuite: boolean;
  runAffectedTestsOnly: boolean;
  timeout: number;
  retries: number;
  checkCoverage: boolean;
  checkPerformance: boolean;
}

/**
 * Fix Validator
 *
 * Validates generated fixes by:
 * - Running tests on the fixed code
 * - Verifying the original failing test now passes
 * - Ensuring no other tests break
 * - Calculating confidence score
 * - Checking coverage impact
 * - Measuring performance impact
 */
export class FixValidator {
  private config: ValidationConfig;
  private projectRoot: string;

  constructor(
    config?: Partial<ValidationConfig>,
    projectRoot: string = process.cwd()
  ) {
    this.projectRoot = projectRoot;
    this.config = {
      runFullTestSuite: config?.runFullTestSuite ?? false,
      runAffectedTestsOnly: config?.runAffectedTestsOnly ?? true,
      timeout: config?.timeout ?? 120000, // 2 minutes
      retries: config?.retries ?? 1,
      checkCoverage: config?.checkCoverage ?? false,
      checkPerformance: config?.checkPerformance ?? false,
    };
  }

  /**
   * Validate a fix by running tests
   */
  async validateFix(
    originalTestName: string,
    testFile: string,
    fixedFiles: string[]
  ): Promise<ValidationResult> {
    console.log('\nValidating fix...');
    const startTime = Date.now();

    try {
      // Step 1: Run the originally failing test
      console.log('Step 1: Verifying original test now passes...');
      const originalTestResult = await this.runSpecificTest(
        testFile,
        originalTestName
      );

      if (!originalTestResult.success) {
        console.log('Original test still failing');
        return {
          success: false,
          allPassed: false,
          passed: 0,
          failed: 1,
          total: 1,
          duration: Date.now() - startTime,
          confidence: 0,
          errors: [
            {
              testName: originalTestName,
              errorMessage:
                originalTestResult.error || 'Test still fails after fix',
              isOriginalTest: true,
              isNewFailure: false,
            },
          ],
          warnings: ['Original test still failing after fix'],
        };
      }

      console.log('Original test now passes!');

      // Step 2: Run affected tests
      console.log('Step 2: Running affected tests...');
      const affectedTestResult = await this.runAffectedTests(fixedFiles);

      // Step 3: Optionally run full test suite
      let fullSuiteResult: any = null;
      if (this.config.runFullTestSuite) {
        console.log('Step 3: Running full test suite...');
        fullSuiteResult = await this.runAllTests();
      }

      // Calculate results
      const result = this.calculateValidationResult(
        originalTestResult,
        affectedTestResult,
        fullSuiteResult,
        Date.now() - startTime
      );

      // Step 4: Check coverage impact (optional)
      if (this.config.checkCoverage) {
        console.log('Step 4: Checking coverage impact...');
        result.metrics = result.metrics || {};
        result.metrics.coverageChange = await this.checkCoverageImpact();
      }

      // Step 5: Check performance impact (optional)
      if (this.config.checkPerformance) {
        console.log('Step 5: Checking performance impact...');
        result.metrics = result.metrics || {};
        result.metrics.performanceImpact = await this.checkPerformanceImpact(
          testFile,
          originalTestName
        );
      }

      this.logValidationResult(result);

      return result;
    } catch (error) {
      console.error(`Validation error: ${error.message}`);
      return {
        success: false,
        allPassed: false,
        passed: 0,
        failed: 1,
        total: 1,
        duration: Date.now() - startTime,
        confidence: 0,
        errors: [
          {
            testName: originalTestName,
            errorMessage: error.message,
            isOriginalTest: true,
            isNewFailure: false,
          },
        ],
        warnings: ['Validation process failed'],
      };
    }
  }

  /**
   * Run a specific test by name
   */
  private async runSpecificTest(
    testFile: string,
    testName: string
  ): Promise<{ success: boolean; error?: string; duration: number }> {
    const startTime = Date.now();

    try {
      // Determine test runner based on file
      const command = this.getTestCommand(testFile, testName);

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: this.config.timeout,
      });

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Parse error output
      const errorMessage = error.stderr || error.stdout || error.message;

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get appropriate test command for file
   */
  private getTestCommand(testFile: string, testName?: string): string {
    const isPlaywright = testFile.includes('.spec.ts');
    const isJest = testFile.includes('.test.ts');

    if (isPlaywright) {
      // Playwright test
      const nameFilter = testName ? ` -g "${testName}"` : '';
      return `npx playwright test ${testFile}${nameFilter}`;
    } else if (isJest) {
      // Jest test
      const nameFilter = testName ? ` -t "${testName}"` : '';
      return `npm run test:jest -- ${testFile}${nameFilter}`;
    } else {
      // Default to npm test
      return `npm test -- ${testFile}`;
    }
  }

  /**
   * Run tests for files affected by the fix
   */
  private async runAffectedTests(
    fixedFiles: string[]
  ): Promise<{ passed: number; failed: number; errors: TestError[] }> {
    const testFiles = await this.findTestsForFiles(fixedFiles);

    if (testFiles.length === 0) {
      console.log('No affected test files found');
      return { passed: 0, failed: 0, errors: [] };
    }

    console.log(`Found ${testFiles.length} affected test file(s)`);

    let passed = 0;
    let failed = 0;
    const errors: TestError[] = [];

    for (const testFile of testFiles) {
      try {
        const result = await this.runSpecificTest(testFile, '');

        if (result.success) {
          passed++;
        } else {
          failed++;
          errors.push({
            testName: testFile,
            errorMessage: result.error || 'Test failed',
            isOriginalTest: false,
            isNewFailure: true,
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          testName: testFile,
          errorMessage: error.message,
          isOriginalTest: false,
          isNewFailure: true,
        });
      }
    }

    return { passed, failed, errors };
  }

  /**
   * Find test files related to source files
   */
  private async findTestsForFiles(files: string[]): Promise<string[]> {
    const testFiles = new Set<string>();

    for (const file of files) {
      // Skip if already a test file
      if (file.includes('.test.') || file.includes('.spec.')) {
        testFiles.add(file);
        continue;
      }

      // Look for corresponding test files
      const baseName = file.replace(/\.(ts|tsx|js|jsx)$/, '');
      const dir = path.dirname(file);
      const fileName = path.basename(baseName);

      // Common test file patterns
      const patterns = [
        `${baseName}.test.ts`,
        `${baseName}.spec.ts`,
        `${baseName}.test.tsx`,
        `${baseName}.spec.tsx`,
        path.join(dir, '__tests__', `${fileName}.test.ts`),
        path.join(dir, '__tests__', `${fileName}.spec.ts`),
      ];

      for (const pattern of patterns) {
        try {
          await fs.access(path.join(this.projectRoot, pattern));
          testFiles.add(pattern);
        } catch {
          // File doesn't exist, try next pattern
        }
      }
    }

    return Array.from(testFiles);
  }

  /**
   * Run all tests in the project
   */
  private async runAllTests(): Promise<{
    passed: number;
    failed: number;
    errors: TestError[];
  }> {
    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: this.projectRoot,
        timeout: this.config.timeout * 5, // 5x timeout for full suite
      });

      // Parse test output to extract results
      const results = this.parseTestOutput(stdout + stderr);
      return results;
    } catch (error) {
      // Even if tests fail, parse the output
      const output = error.stdout + error.stderr;
      return this.parseTestOutput(output);
    }
  }

  /**
   * Parse test runner output to extract results
   */
  private parseTestOutput(output: string): {
    passed: number;
    failed: number;
    errors: TestError[];
  } {
    const errors: TestError[] = [];
    let passed = 0;
    let failed = 0;

    // Try to extract test results (works for Jest, Playwright, etc.)
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);

    if (passMatch) {
      passed = parseInt(passMatch[1], 10);
    }

    if (failMatch) {
      failed = parseInt(failMatch[1], 10);
    }

    // Extract failed test names
    const failedTestRegex = /●(.+?)(?:\n|$)/g;
    let match;

    while ((match = failedTestRegex.exec(output)) !== null) {
      const testName = match[1].trim();
      const errorStart = output.indexOf(match[0]);
      const errorEnd = output.indexOf('●', errorStart + 1);
      const errorMessage =
        errorEnd > 0
          ? output.slice(errorStart, errorEnd).trim()
          : output.slice(errorStart, errorStart + 500).trim();

      errors.push({
        testName,
        errorMessage,
        isOriginalTest: false,
        isNewFailure: true,
      });
    }

    return { passed, failed, errors };
  }

  /**
   * Calculate overall validation result
   */
  private calculateValidationResult(
    originalTest: any,
    affectedTests: any,
    fullSuite: any,
    duration: number
  ): ValidationResult {
    const total =
      1 + affectedTests.passed + affectedTests.failed + (fullSuite?.failed || 0);
    const passed = 1 + affectedTests.passed + (fullSuite?.passed || 0);
    const failed = affectedTests.failed + (fullSuite?.failed || 0);

    const allPassed = failed === 0;
    const success = originalTest.success && allPassed;

    // Calculate confidence score
    let confidence = 0;

    if (originalTest.success) {
      confidence += 0.5; // Original test passing is critical
    }

    if (affectedTests.failed === 0) {
      confidence += 0.3; // No affected tests breaking is important
    }

    if (fullSuite && fullSuite.failed === 0) {
      confidence += 0.2; // Full suite passing is bonus
    }

    // Combine all errors
    const errors = [
      ...affectedTests.errors,
      ...(fullSuite?.errors || []),
    ];

    // Generate warnings
    const warnings: string[] = [];
    if (affectedTests.failed > 0) {
      warnings.push(`${affectedTests.failed} affected test(s) failed`);
    }
    if (fullSuite && fullSuite.failed > 0) {
      warnings.push(`${fullSuite.failed} test(s) failed in full suite`);
    }

    return {
      success,
      allPassed,
      passed,
      failed,
      total,
      duration,
      confidence,
      errors,
      warnings,
    };
  }

  /**
   * Check test coverage impact
   */
  private async checkCoverageImpact(): Promise<number> {
    try {
      // Run tests with coverage
      const { stdout } = await execAsync('npm run test:coverage', {
        cwd: this.projectRoot,
        timeout: this.config.timeout * 2,
      });

      // Parse coverage percentage
      const coverageMatch = stdout.match(/All files[|\s]+(\d+\.?\d*)/);
      if (coverageMatch) {
        return parseFloat(coverageMatch[1]);
      }

      return 0;
    } catch (error) {
      console.warn('Failed to check coverage:', error.message);
      return 0;
    }
  }

  /**
   * Check performance impact
   */
  private async checkPerformanceImpact(
    testFile: string,
    testName: string
  ): Promise<number> {
    try {
      // Run test multiple times and measure duration
      const iterations = 3;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await this.runSpecificTest(testFile, testName);
        durations.push(result.duration);
      }

      // Return average duration
      return durations.reduce((a, b) => a + b, 0) / durations.length;
    } catch (error) {
      console.warn('Failed to check performance:', error.message);
      return 0;
    }
  }

  /**
   * Log validation results
   */
  private logValidationResult(result: ValidationResult): void {
    console.log('\nValidation Results:');
    console.log(`  Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(
      `  Tests: ${result.passed}/${result.total} passed (${((result.passed / result.total) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Confidence: ${(result.confidence * 100).toFixed(1)}%`
    );
    console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);

    if (result.warnings.length > 0) {
      console.log('\n  Warnings:');
      result.warnings.forEach(w => console.log(`    - ${w}`));
    }

    if (result.errors.length > 0) {
      console.log('\n  Errors:');
      result.errors.slice(0, 3).forEach(e => {
        console.log(`    - ${e.testName}`);
        console.log(`      ${e.errorMessage.split('\n')[0]}`);
      });
      if (result.errors.length > 3) {
        console.log(`    ... and ${result.errors.length - 3} more`);
      }
    }

    if (result.metrics) {
      console.log('\n  Metrics:');
      if (result.metrics.coverageChange !== undefined) {
        console.log(
          `    Coverage: ${result.metrics.coverageChange.toFixed(1)}%`
        );
      }
      if (result.metrics.performanceImpact !== undefined) {
        console.log(
          `    Performance: ${result.metrics.performanceImpact.toFixed(0)}ms avg`
        );
      }
    }
  }

  /**
   * Generate validation report
   */
  generateValidationReport(result: ValidationResult): string {
    const passRate = ((result.passed / result.total) * 100).toFixed(1);

    return `# Fix Validation Report

## Summary
- **Overall Status:** ${result.success ? 'PASSED' : 'FAILED'}
- **All Tests Passed:** ${result.allPassed ? 'Yes' : 'No'}
- **Pass Rate:** ${passRate}%
- **Confidence Score:** ${(result.confidence * 100).toFixed(1)}%
- **Duration:** ${(result.duration / 1000).toFixed(2)}s

## Test Results
- Passed: ${result.passed}
- Failed: ${result.failed}
- Total: ${result.total}

${
  result.errors.length > 0
    ? `
## Failed Tests

${result.errors
  .map(
    e => `
### ${e.testName}
${e.isOriginalTest ? '**[ORIGINAL TEST]**' : ''}
${e.isNewFailure ? '**[NEW FAILURE]**' : ''}

\`\`\`
${e.errorMessage}
\`\`\`
`
  )
  .join('\n')}
`
    : ''
}

${
  result.warnings.length > 0
    ? `
## Warnings
${result.warnings.map(w => `- ${w}`).join('\n')}
`
    : ''
}

${
  result.metrics
    ? `
## Metrics
${result.metrics.coverageChange !== undefined ? `- **Coverage:** ${result.metrics.coverageChange.toFixed(1)}%` : ''}
${result.metrics.performanceImpact !== undefined ? `- **Avg Performance:** ${result.metrics.performanceImpact.toFixed(0)}ms` : ''}
${result.metrics.breakingChanges !== undefined ? `- **Breaking Changes:** ${result.metrics.breakingChanges}` : ''}
`
    : ''
}

---
*Generated by DAWG AI Testing Agent - Fix Validator*
`;
  }

  /**
   * Rollback fix if validation fails
   */
  async rollbackFix(files: string[], backupDir: string): Promise<void> {
    console.log('\nRolling back failed fix...');

    for (const file of files) {
      try {
        const backupPath = path.join(backupDir, file);
        const originalPath = path.join(this.projectRoot, file);

        await fs.copyFile(backupPath, originalPath);
        console.log(`  Restored: ${file}`);
      } catch (error) {
        console.error(`  Failed to restore ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Create backup of files before applying fix
   */
  async createBackup(files: string[]): Promise<string> {
    const backupDir = path.join(
      this.projectRoot,
      '.auto-fix-backups',
      Date.now().toString()
    );

    await fs.mkdir(backupDir, { recursive: true });

    for (const file of files) {
      try {
        const sourcePath = path.join(this.projectRoot, file);
        const backupPath = path.join(backupDir, file);

        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.copyFile(sourcePath, backupPath);

        console.log(`  Backed up: ${file}`);
      } catch (error) {
        console.error(`  Failed to backup ${file}: ${error.message}`);
      }
    }

    return backupDir;
  }
}
