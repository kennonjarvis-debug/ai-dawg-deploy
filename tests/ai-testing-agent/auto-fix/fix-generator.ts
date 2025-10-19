import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

export interface TestFailure {
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace?: string;
  failureType: 'assertion' | 'timeout' | 'runtime' | 'unknown';
  context?: {
    beforeCode?: string;
    failingCode?: string;
    expectedValue?: any;
    actualValue?: any;
  };
}

export interface FixOption {
  id: string;
  description: string;
  confidence: number; // 0-1
  reasoning: string;
  changes: FileChange[];
  complexity: 'low' | 'medium' | 'high';
  breakingChange: boolean;
  estimatedImpact: string;
}

export interface FileChange {
  file: string;
  changeType: 'modify' | 'create' | 'delete';
  oldContent?: string;
  newContent: string;
  lineStart?: number;
  lineEnd?: number;
  explanation: string;
}

export interface FailureAnalysis {
  rootCause: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  relatedFiles: string[];
  similarPastFixes: PastFix[];
  recommendations: string[];
}

export interface PastFix {
  testName: string;
  issue: string;
  solution: string;
  timestamp: string;
  success: boolean;
}

/**
 * Fix Generator
 *
 * Analyzes test failures and generates fix suggestions:
 * - Uses GPT-4o for intelligent failure analysis
 * - Searches agent brain for similar past fixes
 * - Generates multiple fix options with confidence scores
 * - Provides detailed reasoning for each fix
 */
export class FixGenerator {
  private openai: OpenAI;
  private model: string;
  private brainPath: string;
  private pastFixes: PastFix[] = [];

  constructor(options: { model?: string; brainPath?: string } = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = options.model || 'gpt-4o';
    this.brainPath =
      options.brainPath || path.join(__dirname, '../brain/past-fixes.json');
  }

  /**
   * Initialize and load past fixes
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.brainPath), { recursive: true });
      const content = await fs.readFile(this.brainPath, 'utf-8');
      this.pastFixes = JSON.parse(content);
      console.log(`Loaded ${this.pastFixes.length} past fixes from brain`);
    } catch (error) {
      console.log('No past fixes found, starting fresh');
      this.pastFixes = [];
    }
  }

  /**
   * Analyze test failure and identify root cause
   */
  async analyzeFailure(failure: TestFailure): Promise<FailureAnalysis> {
    console.log(`\nAnalyzing failure: ${failure.testName}`);

    // Search for similar past fixes
    const similarFixes = await this.findSimilarPastFixes(failure);

    // Read relevant files for context
    const fileContext = await this.gatherFileContext(failure);

    // Use GPT-4o to analyze failure
    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are an expert debugging assistant for a TypeScript/Node.js application. Analyze test failures and identify root causes with precision.

Your analysis should:
1. Identify the exact root cause of the failure
2. Categorize the failure type
3. Assess severity
4. Identify all related files that may need changes
5. Provide actionable recommendations

Return valid JSON only.`,
        },
        {
          role: 'user',
          content: `Analyze this test failure:

Test: ${failure.testName}
File: ${failure.testFile}
Error: ${failure.errorMessage}
${failure.stackTrace ? `Stack Trace:\n${failure.stackTrace}` : ''}

Context:
${JSON.stringify(failure.context, null, 2)}

File Context:
${JSON.stringify(fileContext, null, 2)}

Similar Past Fixes:
${JSON.stringify(similarFixes, null, 2)}

Return JSON with:
{
  "rootCause": "Detailed explanation of root cause",
  "category": "assertion_error|timeout|dependency|configuration|logic_error|integration",
  "severity": "critical|high|medium|low",
  "relatedFiles": ["file1.ts", "file2.ts"],
  "recommendations": ["recommendation1", "recommendation2"]
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(
      response.choices[0].message.content || '{}'
    ) as FailureAnalysis;

    analysis.similarPastFixes = similarFixes;

    console.log(`Root cause: ${analysis.rootCause}`);
    console.log(`Severity: ${analysis.severity}`);

    return analysis;
  }

  /**
   * Generate fix options based on failure analysis
   */
  async generateFixOptions(
    failure: TestFailure,
    analysis: FailureAnalysis
  ): Promise<FixOption[]> {
    console.log('Generating fix options...');

    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.2, // Slightly higher for creative solutions
      messages: [
        {
          role: 'system',
          content: `You are an expert developer specializing in automated test fixes. Generate multiple fix options with varying approaches and complexity levels.

Each fix option should:
1. Be practical and implementable
2. Include complete code changes
3. Explain the reasoning clearly
4. Assess confidence and complexity
5. Identify potential breaking changes

Return valid JSON only.`,
        },
        {
          role: 'user',
          content: `Generate fix options for this test failure:

Test: ${failure.testName}
Root Cause: ${analysis.rootCause}
Category: ${analysis.category}
Severity: ${analysis.severity}

Error: ${failure.errorMessage}
${failure.stackTrace ? `Stack:\n${failure.stackTrace.slice(0, 500)}` : ''}

Related Files: ${analysis.relatedFiles.join(', ')}

Past Fixes:
${JSON.stringify(analysis.similarPastFixes, null, 2)}

Generate 2-4 fix options, from simple to complex. Return JSON:
{
  "fixes": [
    {
      "id": "fix-1",
      "description": "Brief description",
      "confidence": 0.85,
      "reasoning": "Why this fix works",
      "changes": [
        {
          "file": "path/to/file.ts",
          "changeType": "modify",
          "newContent": "complete new file content or code snippet",
          "lineStart": 10,
          "lineEnd": 15,
          "explanation": "What this change does"
        }
      ],
      "complexity": "low|medium|high",
      "breakingChange": false,
      "estimatedImpact": "Impact description"
    }
  ]
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const fixes = result.fixes || [];

    console.log(`Generated ${fixes.length} fix option(s)`);

    return fixes;
  }

  /**
   * Find similar past fixes from agent brain
   */
  async findSimilarPastFixes(failure: TestFailure): Promise<PastFix[]> {
    if (this.pastFixes.length === 0) {
      return [];
    }

    // Use GPT to find semantically similar fixes
    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a pattern matching expert. Find similar test failures from past fixes.',
        },
        {
          role: 'user',
          content: `Current Failure:
Test: ${failure.testName}
Error: ${failure.errorMessage}

Past Fixes:
${JSON.stringify(this.pastFixes, null, 2)}

Return JSON with array of similar fixes (max 5), sorted by relevance:
{
  "similarFixes": [
    {
      "testName": "...",
      "issue": "...",
      "solution": "...",
      "timestamp": "...",
      "success": true,
      "relevanceScore": 0.95
    }
  ]
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return (result.similarFixes || []).slice(0, 5);
  }

  /**
   * Gather file context for analysis
   */
  async gatherFileContext(failure: TestFailure): Promise<any> {
    const context: any = {
      testFile: null,
      relatedFiles: [],
    };

    try {
      // Read test file
      const testFilePath = path.join(process.cwd(), failure.testFile);
      context.testFile = await fs.readFile(testFilePath, 'utf-8');

      // Try to identify related source files
      const relatedFiles = await this.identifyRelatedFiles(failure.testFile);
      for (const file of relatedFiles.slice(0, 3)) {
        // Limit to 3 files
        try {
          const content = await fs.readFile(file, 'utf-8');
          context.relatedFiles.push({
            path: file,
            content: content.slice(0, 5000), // First 5k chars
          });
        } catch {
          // Skip files we can't read
        }
      }
    } catch (error) {
      console.warn(`Failed to gather file context: ${error.message}`);
    }

    return context;
  }

  /**
   * Identify related source files from test file
   */
  async identifyRelatedFiles(testFile: string): Promise<string[]> {
    try {
      const content = await fs.readFile(
        path.join(process.cwd(), testFile),
        'utf-8'
      );

      // Extract import statements
      const importRegex = /from ['"](.+?)['"]/g;
      const imports: string[] = [];
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];

        // Convert relative imports to absolute paths
        if (importPath.startsWith('.')) {
          const testDir = path.dirname(testFile);
          importPath = path.join(testDir, importPath);

          // Try common extensions
          for (const ext of ['.ts', '.tsx', '.js']) {
            const fullPath = importPath + ext;
            try {
              await fs.access(path.join(process.cwd(), fullPath));
              imports.push(fullPath);
              break;
            } catch {
              // Try next extension
            }
          }
        }
      }

      return imports;
    } catch {
      return [];
    }
  }

  /**
   * Generate comprehensive fix with all options
   */
  async generateCompleteFix(failure: TestFailure): Promise<{
    analysis: FailureAnalysis;
    options: FixOption[];
    recommendedOption: FixOption | null;
  }> {
    // Step 1: Analyze failure
    const analysis = await this.analyzeFailure(failure);

    // Step 2: Generate fix options
    const options = await this.generateFixOptions(failure, analysis);

    // Step 3: Select recommended option (highest confidence)
    const recommendedOption =
      options.length > 0
        ? options.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          )
        : null;

    if (recommendedOption) {
      console.log(
        `\nRecommended fix: ${recommendedOption.description} (${(recommendedOption.confidence * 100).toFixed(1)}% confidence)`
      );
    }

    return {
      analysis,
      options,
      recommendedOption,
    };
  }

  /**
   * Apply a fix option to files
   */
  async applyFix(option: FixOption): Promise<string[]> {
    const modifiedFiles: string[] = [];

    console.log(`\nApplying fix: ${option.description}`);

    for (const change of option.changes) {
      const filePath = path.join(process.cwd(), change.file);

      try {
        switch (change.changeType) {
          case 'modify':
            if (change.lineStart && change.lineEnd) {
              // Modify specific lines
              const content = await fs.readFile(filePath, 'utf-8');
              const lines = content.split('\n');
              const newLines = [
                ...lines.slice(0, change.lineStart - 1),
                change.newContent,
                ...lines.slice(change.lineEnd),
              ];
              await fs.writeFile(filePath, newLines.join('\n'));
            } else {
              // Replace entire file
              await fs.writeFile(filePath, change.newContent);
            }
            console.log(`  Modified: ${change.file}`);
            modifiedFiles.push(change.file);
            break;

          case 'create':
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, change.newContent);
            console.log(`  Created: ${change.file}`);
            modifiedFiles.push(change.file);
            break;

          case 'delete':
            await fs.unlink(filePath);
            console.log(`  Deleted: ${change.file}`);
            modifiedFiles.push(change.file);
            break;
        }
      } catch (error) {
        console.error(`  Failed to apply change to ${change.file}: ${error.message}`);
      }
    }

    return modifiedFiles;
  }

  /**
   * Save successful fix to brain
   */
  async saveFix(
    failure: TestFailure,
    fix: FixOption,
    success: boolean
  ): Promise<void> {
    const pastFix: PastFix = {
      testName: failure.testName,
      issue: failure.errorMessage,
      solution: fix.description,
      timestamp: new Date().toISOString(),
      success,
    };

    this.pastFixes.push(pastFix);

    // Keep only last 100 fixes
    if (this.pastFixes.length > 100) {
      this.pastFixes = this.pastFixes.slice(-100);
    }

    try {
      await fs.mkdir(path.dirname(this.brainPath), { recursive: true });
      await fs.writeFile(
        this.brainPath,
        JSON.stringify(this.pastFixes, null, 2)
      );
      console.log('Fix saved to agent brain');
    } catch (error) {
      console.error(`Failed to save fix to brain: ${error.message}`);
    }
  }

  /**
   * Parse test error to extract failure details
   */
  parseTestError(
    testName: string,
    testFile: string,
    errorOutput: string
  ): TestFailure {
    // Extract error message
    const errorMatch = errorOutput.match(/Error: (.+?)(?:\n|$)/);
    const errorMessage = errorMatch
      ? errorMatch[1]
      : errorOutput.split('\n')[0];

    // Extract stack trace
    const stackMatch = errorOutput.match(/at .+/g);
    const stackTrace = stackMatch ? stackMatch.join('\n') : undefined;

    // Determine failure type
    let failureType: TestFailure['failureType'] = 'unknown';
    if (errorMessage.includes('Timeout')) {
      failureType = 'timeout';
    } else if (
      errorMessage.includes('expect') ||
      errorMessage.includes('assert')
    ) {
      failureType = 'assertion';
    } else if (errorMessage.includes('Error:')) {
      failureType = 'runtime';
    }

    // Extract context (expected vs actual)
    const expectedMatch = errorOutput.match(/Expected: (.+?)(?:\n|$)/);
    const actualMatch = errorOutput.match(/Received: (.+?)(?:\n|$)/);

    return {
      testName,
      testFile,
      errorMessage,
      stackTrace,
      failureType,
      context: {
        expectedValue: expectedMatch ? expectedMatch[1] : undefined,
        actualValue: actualMatch ? actualMatch[1] : undefined,
      },
    };
  }

  /**
   * Generate fix summary for reporting
   */
  generateFixSummary(
    failure: TestFailure,
    analysis: FailureAnalysis,
    options: FixOption[]
  ): string {
    return `# Fix Analysis: ${failure.testName}

## Failure Details
- **Test:** ${failure.testName}
- **File:** ${failure.testFile}
- **Error:** ${failure.errorMessage}
- **Type:** ${failure.failureType}

## Root Cause Analysis
**Category:** ${analysis.category}
**Severity:** ${analysis.severity}

${analysis.rootCause}

## Fix Options Generated

${options
  .map(
    (opt, idx) => `
### Option ${idx + 1}: ${opt.description}
- **Confidence:** ${(opt.confidence * 100).toFixed(1)}%
- **Complexity:** ${opt.complexity}
- **Breaking Change:** ${opt.breakingChange ? 'Yes' : 'No'}

**Reasoning:** ${opt.reasoning}

**Changes:**
${opt.changes.map(c => `- ${c.changeType} ${c.file}: ${c.explanation}`).join('\n')}

**Impact:** ${opt.estimatedImpact}
`
  )
  .join('\n')}

## Similar Past Fixes
${
  analysis.similarPastFixes.length > 0
    ? analysis.similarPastFixes
        .map(
          fix => `
- **${fix.testName}**
  - Issue: ${fix.issue}
  - Solution: ${fix.solution}
  - Success: ${fix.success ? 'Yes' : 'No'}
`
        )
        .join('\n')
    : 'No similar past fixes found'
}

## Recommendations
${analysis.recommendations.map(r => `- ${r}`).join('\n')}
`;
  }
}
