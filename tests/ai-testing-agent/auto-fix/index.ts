import { FixGenerator, TestFailure, FixOption } from './fix-generator';
import { FixValidator, ValidationResult } from './fix-validator';
import { GitHubPRCreator, PRResult } from './pr-creator';
import fs from 'fs/promises';
import path from 'path';

/**
 * Auto-Fix Orchestrator
 *
 * Main entry point for the automated fix and PR creation system.
 * Coordinates the entire workflow from failure analysis to PR creation.
 */
export class AutoFixOrchestrator {
  private generator: FixGenerator;
  private validator: FixValidator;
  private prCreator: GitHubPRCreator;

  constructor() {
    this.generator = new FixGenerator();
    this.validator = new FixValidator({
      runFullTestSuite: false,
      runAffectedTestsOnly: true,
      checkCoverage: true,
      checkPerformance: true,
    });
    this.prCreator = new GitHubPRCreator();
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Auto-Fix System...\n');

    await this.generator.initialize();
    await this.prCreator.initialize();

    console.log('✅ Auto-Fix System ready\n');
  }

  /**
   * Main workflow: Analyze failure, generate fix, validate, create PR
   */
  async processTestFailure(
    failure: TestFailure,
    options: {
      autoApply?: boolean;
      createPR?: boolean;
      reviewers?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    prResult?: PRResult;
    validationResult?: ValidationResult;
    error?: string;
  }> {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔧 Processing Test Failure: ${failure.testName}`);
      console.log(`${'='.repeat(80)}\n`);

      // Step 1: Analyze failure and generate fixes
      console.log('📊 STEP 1: Analyzing failure and generating fixes...\n');
      const { analysis, options: fixOptions, recommendedOption } =
        await this.generator.generateCompleteFix(failure);

      if (!recommendedOption) {
        console.error('❌ No fix options generated');
        return {
          success: false,
          error: 'Failed to generate fix options',
        };
      }

      // Generate and save analysis report
      const analysisReport = this.generator.generateFixSummary(
        failure,
        analysis,
        fixOptions
      );
      await this.saveReport('fix-analysis', analysisReport);

      // Step 2: Apply the recommended fix
      console.log('\n🔨 STEP 2: Applying recommended fix...\n');
      console.log(`Fix: ${recommendedOption.description}`);
      console.log(
        `Confidence: ${(recommendedOption.confidence * 100).toFixed(1)}%\n`
      );

      // Create backup before applying
      const filesToChange = recommendedOption.changes.map(c => c.file);
      const backupDir = await this.validator.createBackup(filesToChange);
      console.log(`Backup created at: ${backupDir}\n`);

      // Apply the fix
      const modifiedFiles = await this.generator.applyFix(recommendedOption);

      // Step 3: Validate the fix
      console.log('\n✅ STEP 3: Validating fix...\n');
      const validationResult = await this.validator.validateFix(
        failure.testName,
        failure.testFile,
        modifiedFiles
      );

      // Generate validation report
      const validationReport =
        this.validator.generateValidationReport(validationResult);
      await this.saveReport('validation', validationReport);

      // Check if validation passed
      if (!validationResult.success) {
        console.error('\n❌ Validation failed! Rolling back...\n');
        await this.validator.rollbackFix(modifiedFiles, backupDir);

        // Save failed fix to brain for learning
        await this.generator.saveFix(failure, recommendedOption, false);

        return {
          success: false,
          validationResult,
          error: 'Fix validation failed',
        };
      }

      console.log('\n✅ Validation passed!\n');

      // Save successful fix to brain
      await this.generator.saveFix(failure, recommendedOption, true);

      // Step 4: Create PR if requested
      let prResult: PRResult | undefined;

      if (options.createPR) {
        console.log('\n📝 STEP 4: Creating GitHub Pull Request...\n');

        prResult = await this.createPR(
          failure,
          analysis,
          recommendedOption,
          fixOptions,
          validationResult,
          modifiedFiles,
          options.reviewers
        );

        if (prResult.success) {
          console.log(`\n✅ PR Created: ${prResult.prUrl}\n`);
        } else {
          console.error(`\n❌ PR Creation Failed: ${prResult.error}\n`);
        }
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log('✅ Auto-Fix Process Complete!');
      console.log(`${'='.repeat(80)}\n`);

      return {
        success: true,
        prResult,
        validationResult,
      };
    } catch (error) {
      console.error(`\n❌ Auto-Fix Process Failed: ${error.message}\n`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create GitHub PR with all the fix details
   */
  private async createPR(
    failure: TestFailure,
    analysis: any,
    fix: FixOption,
    allFixOptions: FixOption[],
    validation: ValidationResult,
    modifiedFiles: string[],
    reviewers?: string[]
  ): Promise<PRResult> {
    // Load and populate PR template
    const template = await this.prCreator.loadTemplate();
    const prBody = await this.formatPRBody(
      template,
      failure,
      analysis,
      fix,
      allFixOptions,
      validation
    );

    // Create PR
    return await this.prCreator.createAutoFixPR({
      testName: failure.testName,
      fixType: 'Fix',
      files: modifiedFiles,
      commitMessage: `[AUTO-FIX] Fix failing test: ${failure.testName}\n\nGenerated by DAWG AI Testing Agent\nConfidence: ${(fix.confidence * 100).toFixed(1)}%`,
      prBody,
      labels: this.generatePRLabels(analysis, validation),
      reviewers,
    });
  }

  /**
   * Format PR body with all details
   */
  private async formatPRBody(
    template: string,
    failure: TestFailure,
    analysis: any,
    fix: FixOption,
    allFixOptions: FixOption[],
    validation: ValidationResult
  ): string {
    // Format alternative fixes
    const alternativeFixes =
      allFixOptions.length > 1
        ? allFixOptions
            .filter(opt => opt.id !== fix.id)
            .map(
              (opt, idx) => `
**Option ${idx + 1}: ${opt.description}**
- Confidence: ${(opt.confidence * 100).toFixed(1)}%
- Complexity: ${opt.complexity}
- Reasoning: ${opt.reasoning}
`
            )
            .join('\n')
        : 'No alternative approaches were generated.';

    // Format similar fixes
    const similarFixesList =
      analysis.similarPastFixes && analysis.similarPastFixes.length > 0
        ? analysis.similarPastFixes
            .map(
              pastFix => `
- **${pastFix.testName}**
  - Issue: ${pastFix.issue}
  - Solution: ${pastFix.solution}
  - Success: ${pastFix.success ? '✅' : '❌'}
  - Date: ${new Date(pastFix.timestamp).toLocaleDateString()}
`
            )
            .join('\n')
        : '';

    // Format code changes
    const codeChanges = fix.changes.map(change => ({
      file: change.file,
      changeType: change.changeType,
      lineStart: change.lineStart || 1,
      lineEnd: change.lineEnd || 999,
      explanation: change.explanation,
      diffContent: this.generateDiff(change.oldContent, change.newContent),
    }));

    // Format files changed list
    const filesChangedList = fix.changes
      .map(
        c => `- \`${c.file}\` (${c.changeType}): ${c.explanation}`
      )
      .join('\n');

    // Replace template variables (simple implementation)
    let body = template;

    const replacements = {
      testName: failure.testName,
      testFile: failure.testFile,
      confidence: (validation.confidence * 100).toFixed(1),
      validationStatus: validation.success ? '✅ PASSED' : '❌ FAILED',
      errorMessage: failure.errorMessage,
      failureCategory: analysis.category,
      failureSeverity: analysis.severity,
      rootCauseAnalysis: analysis.rootCause,
      stackTrace: failure.stackTrace || 'No stack trace available',
      fixDescription: fix.description,
      fixReasoning: fix.reasoning,
      fixComplexity: fix.complexity,
      breakingChange: fix.breakingChange ? 'Yes ⚠️' : 'No',
      estimatedImpact: fix.estimatedImpact,
      filesChangedList,
      alternativeFixes,
      hasSimilarFixes: similarFixesList.length > 0,
      similarFixesList,
      originalTestStatus: 'FAILED ❌',
      testsPassed: validation.passed,
      testsTotal: validation.total,
      passRate: ((validation.passed / validation.total) * 100).toFixed(1),
      executionTime: (validation.duration / 1000).toFixed(2),
      beforeDuration: '0',
      afterStatus: validation.success ? 'PASSED' : 'FAILED',
      afterStatusIcon: validation.success ? '✅' : '❌',
      afterDuration: '0',
      performanceImpact:
        validation.metrics?.performanceImpact
          ? `${validation.metrics.performanceImpact.toFixed(0)}ms`
          : 'N/A',
      ranAffectedTests: true,
      affectedTestsPassed: validation.passed - 1,
      affectedTestsTotal: validation.total - 1,
      ranFullSuite: false,
      fullSuitePassed: 0,
      fullSuiteTotal: 0,
      hasCoverageData: validation.metrics?.coverageChange !== undefined,
      coverageChange:
        validation.metrics?.coverageChange?.toFixed(1) || 'N/A',
      linesAdded: fix.changes.reduce(
        (sum, c) => sum + (c.changeType === 'create' ? 1 : 0),
        0
      ),
      linesModified: fix.changes.reduce(
        (sum, c) => sum + (c.changeType === 'modify' ? 1 : 0),
        0
      ),
      recommendationsList: analysis.recommendations
        .map(r => `- ${r}`)
        .join('\n'),
      analysisTimestamp: new Date().toISOString(),
      agentVersion: '1.0.0',
      fixGenerationTime: '0',
      validationTime: (validation.duration / 1000).toFixed(2),
      hasAdditionalContext: false,
      additionalContext: '',
      validationPassed: validation.success,
      validationIssues: validation.errors
        .map(e => `- ${e.testName}: ${e.errorMessage}`)
        .join('\n'),
      timestamp: Date.now(),
    };

    // Simple template replacement
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, String(value));
    }

    // Handle conditionals (basic implementation)
    body = body.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, match => {
      // This is a simplified version - a real implementation would need proper parsing
      return match.includes('hasSimilarFixes') && similarFixesList.length > 0
        ? match
            .replace(/{{#if hasSimilarFixes}}/, '')
            .replace(/{{\/if}}/, '')
        : '';
    });

    // Handle each loops (basic implementation)
    body = body.replace(/{{#each codeChanges}}[\s\S]*?{{\/each}}/g, () => {
      return codeChanges
        .map(
          change => `
#### ${change.file}

**Change Type:** ${change.changeType}
**Lines:** ${change.lineStart}-${change.lineEnd}

${change.explanation}

<details>
<summary>View changes</summary>

\`\`\`diff
${change.diffContent}
\`\`\`

</details>
`
        )
        .join('\n');
    });

    return body;
  }

  /**
   * Generate diff content for display
   */
  private generateDiff(
    oldContent: string | undefined,
    newContent: string
  ): string {
    if (!oldContent) {
      return `+ ${newContent}`;
    }

    // Simple diff (in production, use a proper diff library)
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    let diff = '';
    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (i < oldLines.length && oldLines[i] !== newLines[i]) {
        diff += `- ${oldLines[i]}\n`;
      }
      if (i < newLines.length && oldLines[i] !== newLines[i]) {
        diff += `+ ${newLines[i]}\n`;
      }
    }

    return diff || newContent;
  }

  /**
   * Generate appropriate labels for PR
   */
  private generatePRLabels(analysis: any, validation: ValidationResult): string[] {
    const labels = ['auto-fix', 'testing'];

    // Add severity label
    if (analysis.severity === 'critical') {
      labels.push('critical', 'priority-high');
    } else if (analysis.severity === 'high') {
      labels.push('priority-high');
    }

    // Add category label
    labels.push(analysis.category);

    // Add validation status
    if (validation.success) {
      labels.push('verified');
    } else {
      labels.push('needs-review', 'validation-failed');
    }

    // Add confidence label
    if (validation.confidence >= 0.8) {
      labels.push('high-confidence');
    } else if (validation.confidence < 0.5) {
      labels.push('low-confidence', 'needs-review');
    }

    return labels;
  }

  /**
   * Save report to disk
   */
  private async saveReport(type: string, content: string): Promise<void> {
    const reportDir = path.join(
      process.cwd(),
      'tests/reports/auto-fix'
    );
    await fs.mkdir(reportDir, { recursive: true });

    const filename = `${type}-${Date.now()}.md`;
    const filepath = path.join(reportDir, filename);

    await fs.writeFile(filepath, content);
    console.log(`Report saved: ${filepath}`);
  }
}

// Export main orchestrator function
export async function autoFixTestFailure(
  testName: string,
  testFile: string,
  errorOutput: string,
  options?: { createPR?: boolean; reviewers?: string[] }
): Promise<void> {
  const orchestrator = new AutoFixOrchestrator();
  await orchestrator.initialize();

  // Parse error output into TestFailure
  const generator = new FixGenerator();
  const failure = generator.parseTestError(testName, testFile, errorOutput);

  // Process the failure
  const result = await orchestrator.processTestFailure(failure, {
    autoApply: true,
    createPR: options?.createPR ?? true,
    reviewers: options?.reviewers,
  });

  if (!result.success) {
    throw new Error(`Auto-fix failed: ${result.error}`);
  }
}

// Export all components
export { FixGenerator, FixValidator, GitHubPRCreator };
export * from './fix-generator';
export * from './fix-validator';
export * from './pr-creator';
