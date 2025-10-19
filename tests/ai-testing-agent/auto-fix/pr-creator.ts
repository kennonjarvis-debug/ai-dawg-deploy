import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface PROptions {
  branchName: string;
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  reviewers?: string[];
  baseBranch?: string;
}

export interface PRResult {
  success: boolean;
  prNumber?: number;
  prUrl?: string;
  branchName: string;
  error?: string;
}

export interface CommitInfo {
  files: string[];
  message: string;
  description?: string;
}

/**
 * GitHub PR Creator
 *
 * Handles automated PR creation for test fixes:
 * - Creates feature branches
 * - Commits fix code
 * - Creates PRs with detailed descriptions
 * - Adds labels and reviewers
 * - Links to test reports
 */
export class GitHubPRCreator {
  private repoRoot: string;
  private defaultBaseBranch: string;
  private useGhCli: boolean;

  constructor(options: {
    repoRoot?: string;
    baseBranch?: string;
    useGhCli?: boolean;
  } = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
    this.defaultBaseBranch = options.baseBranch || 'main';
    this.useGhCli = options.useGhCli !== false; // Default to true
  }

  /**
   * Initialize and verify GitHub CLI is available
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.useGhCli) {
        // Check if gh CLI is installed and authenticated
        await execAsync('gh --version');
        const { stdout } = await execAsync('gh auth status');
        console.log('GitHub CLI authenticated:', stdout.includes('Logged in'));
        return true;
      }
      return true;
    } catch (error) {
      console.warn('GitHub CLI not available, will use git commands only');
      this.useGhCli = false;
      return false;
    }
  }

  /**
   * Check if we're in a git repository
   */
  async isGitRepo(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.repoRoot });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: this.repoRoot,
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  /**
   * Get repository remote URL
   */
  async getRemoteUrl(): Promise<string> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', {
        cwd: this.repoRoot,
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get remote URL: ${error.message}`);
    }
  }

  /**
   * Create a new branch for the fix
   */
  async createBranch(branchName: string, baseBranch?: string): Promise<void> {
    const base = baseBranch || this.defaultBaseBranch;

    try {
      // Fetch latest changes
      console.log(`Fetching latest changes from ${base}...`);
      await execAsync(`git fetch origin ${base}`, { cwd: this.repoRoot });

      // Create and checkout new branch
      console.log(`Creating branch: ${branchName}`);
      await execAsync(`git checkout -b ${branchName} origin/${base}`, {
        cwd: this.repoRoot,
      });

      console.log(`Successfully created branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Stage and commit changes
   */
  async commitChanges(commitInfo: CommitInfo): Promise<void> {
    try {
      // Stage files
      console.log(`Staging ${commitInfo.files.length} file(s)...`);
      for (const file of commitInfo.files) {
        await execAsync(`git add "${file}"`, { cwd: this.repoRoot });
      }

      // Create commit message
      const fullMessage = commitInfo.description
        ? `${commitInfo.message}\n\n${commitInfo.description}`
        : commitInfo.message;

      // Commit changes
      console.log('Committing changes...');
      await execAsync(`git commit -m "${fullMessage}"`, {
        cwd: this.repoRoot,
      });

      console.log('Changes committed successfully');
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
  }

  /**
   * Push branch to remote
   */
  async pushBranch(branchName: string): Promise<void> {
    try {
      console.log(`Pushing branch ${branchName} to remote...`);
      await execAsync(`git push -u origin ${branchName}`, {
        cwd: this.repoRoot,
      });
      console.log('Branch pushed successfully');
    } catch (error) {
      throw new Error(`Failed to push branch: ${error.message}`);
    }
  }

  /**
   * Create PR using GitHub CLI
   */
  async createPRWithGhCli(options: PROptions): Promise<PRResult> {
    try {
      // Build gh pr create command
      let command = `gh pr create --title "${options.title}" --body "${options.body}"`;

      if (options.baseBranch) {
        command += ` --base ${options.baseBranch}`;
      }

      // Add labels
      if (options.labels && options.labels.length > 0) {
        command += ` --label "${options.labels.join(',')}"`;
      }

      // Add reviewers
      if (options.reviewers && options.reviewers.length > 0) {
        command += ` --reviewer "${options.reviewers.join(',')}"`;
      }

      // Add assignees
      if (options.assignees && options.assignees.length > 0) {
        command += ` --assignee "${options.assignees.join(',')}"`;
      }

      console.log('Creating PR with GitHub CLI...');
      const { stdout } = await execAsync(command, { cwd: this.repoRoot });

      // Extract PR URL from output
      const prUrl = stdout.trim();
      const prNumber = this.extractPRNumber(prUrl);

      return {
        success: true,
        prNumber,
        prUrl,
        branchName: options.branchName,
      };
    } catch (error) {
      return {
        success: false,
        branchName: options.branchName,
        error: error.message,
      };
    }
  }

  /**
   * Create PR using Octokit (GitHub API)
   */
  async createPRWithOctokit(options: PROptions): Promise<PRResult> {
    try {
      // This would require @octokit/rest package
      // For now, return a mock response
      console.warn('Octokit integration not implemented yet');
      return {
        success: false,
        branchName: options.branchName,
        error: 'Octokit integration not available. Please use GitHub CLI.',
      };
    } catch (error) {
      return {
        success: false,
        branchName: options.branchName,
        error: error.message,
      };
    }
  }

  /**
   * Extract PR number from GitHub URL
   */
  private extractPRNumber(url: string): number | undefined {
    const match = url.match(/\/pull\/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Generate PR title for test fix
   */
  generatePRTitle(testName: string, fixType: string = 'Fix'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `[AUTO-FIX] ${fixType} failing test: ${testName}`;
  }

  /**
   * Generate branch name for test fix
   */
  generateBranchName(testName: string): string {
    const timestamp = Date.now();
    const sanitizedName = testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `auto-fix/test-failure-${sanitizedName}-${timestamp}`;
  }

  /**
   * Format PR body from template
   */
  async formatPRBody(template: string, data: any): Promise<string> {
    let body = template;

    // Replace template variables
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return body;
  }

  /**
   * Load PR template from file
   */
  async loadTemplate(templatePath?: string): Promise<string> {
    const defaultPath = path.join(
      __dirname,
      'pr-template.md'
    );
    const filePath = templatePath || defaultPath;

    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Failed to load template: ${error.message}`);
      return this.getDefaultTemplate();
    }
  }

  /**
   * Get default PR template
   */
  private getDefaultTemplate(): string {
    return `## Summary

{{summary}}

## Test Failure

**Test Name:** {{testName}}
**Error Message:**
\`\`\`
{{errorMessage}}
\`\`\`

## Fix Applied

{{fixDescription}}

### Files Changed
{{filesChanged}}

## Verification

{{verificationResults}}

## Test Results

### Before Fix
- Status: FAILED
- Error: {{errorMessage}}

### After Fix
- Status: {{afterStatus}}
- Duration: {{afterDuration}}ms
- All Tests Passing: {{allTestsPassing}}

---

Generated with DAWG AI Testing Agent
`;
  }

  /**
   * Create complete PR workflow
   */
  async createAutoFixPR(options: {
    testName: string;
    fixType: string;
    files: string[];
    commitMessage: string;
    prBody: string;
    labels?: string[];
    reviewers?: string[];
    baseBranch?: string;
  }): Promise<PRResult> {
    try {
      // Verify git repo
      if (!(await this.isGitRepo())) {
        throw new Error('Not a git repository');
      }

      // Generate branch name
      const branchName = this.generateBranchName(options.testName);

      // Create branch
      await this.createBranch(branchName, options.baseBranch);

      // Commit changes
      await this.commitChanges({
        files: options.files,
        message: options.commitMessage,
      });

      // Push branch
      await this.pushBranch(branchName);

      // Create PR
      const prOptions: PROptions = {
        branchName,
        title: this.generatePRTitle(options.testName, options.fixType),
        body: options.prBody,
        labels: options.labels || ['auto-fix', 'testing', 'needs-review'],
        reviewers: options.reviewers,
        baseBranch: options.baseBranch || this.defaultBaseBranch,
      };

      const result = this.useGhCli
        ? await this.createPRWithGhCli(prOptions)
        : await this.createPRWithOctokit(prOptions);

      if (result.success) {
        console.log(`\nPR created successfully!`);
        console.log(`URL: ${result.prUrl}`);
        console.log(`Number: #${result.prNumber}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        branchName: '',
        error: error.message,
      };
    }
  }

  /**
   * Add labels to existing PR
   */
  async addLabels(prNumber: number, labels: string[]): Promise<void> {
    if (!this.useGhCli) {
      console.warn('GitHub CLI not available for adding labels');
      return;
    }

    try {
      await execAsync(
        `gh pr edit ${prNumber} --add-label "${labels.join(',')}"`,
        { cwd: this.repoRoot }
      );
      console.log(`Added labels to PR #${prNumber}: ${labels.join(', ')}`);
    } catch (error) {
      console.error(`Failed to add labels: ${error.message}`);
    }
  }

  /**
   * Add comment to PR
   */
  async addComment(prNumber: number, comment: string): Promise<void> {
    if (!this.useGhCli) {
      console.warn('GitHub CLI not available for adding comments');
      return;
    }

    try {
      await execAsync(`gh pr comment ${prNumber} --body "${comment}"`, {
        cwd: this.repoRoot,
      });
      console.log(`Added comment to PR #${prNumber}`);
    } catch (error) {
      console.error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Close PR
   */
  async closePR(prNumber: number, reason?: string): Promise<void> {
    if (!this.useGhCli) {
      console.warn('GitHub CLI not available for closing PR');
      return;
    }

    try {
      if (reason) {
        await this.addComment(prNumber, `Closing PR: ${reason}`);
      }
      await execAsync(`gh pr close ${prNumber}`, { cwd: this.repoRoot });
      console.log(`Closed PR #${prNumber}`);
    } catch (error) {
      console.error(`Failed to close PR: ${error.message}`);
    }
  }

  /**
   * Get PR status
   */
  async getPRStatus(prNumber: number): Promise<any> {
    if (!this.useGhCli) {
      console.warn('GitHub CLI not available for getting PR status');
      return null;
    }

    try {
      const { stdout } = await execAsync(
        `gh pr view ${prNumber} --json state,title,url,reviewDecision,statusCheckRollup`,
        { cwd: this.repoRoot }
      );
      return JSON.parse(stdout);
    } catch (error) {
      console.error(`Failed to get PR status: ${error.message}`);
      return null;
    }
  }
}

// Export convenience function
export async function createAutoFixPR(
  testName: string,
  files: string[],
  fixDescription: string,
  verificationResults: any
): Promise<PRResult> {
  const creator = new GitHubPRCreator();
  await creator.initialize();

  const prBody = `## Automated Test Fix

**Test:** ${testName}
**Fix Type:** Auto-generated fix
**Status:** ${verificationResults.allPassed ? 'Verified' : 'Needs Review'}

### Fix Description
${fixDescription}

### Verification Results
- Tests Passed: ${verificationResults.passed}/${verificationResults.total}
- Confidence Score: ${(verificationResults.confidence * 100).toFixed(1)}%
- Duration: ${verificationResults.duration}ms

### Files Changed
${files.map(f => `- ${f}`).join('\n')}

---
Generated by DAWG AI Testing Agent
`;

  return await creator.createAutoFixPR({
    testName,
    fixType: 'Fix',
    files,
    commitMessage: `[AUTO-FIX] Fix failing test: ${testName}`,
    prBody,
    labels: ['auto-fix', 'testing', 'needs-review'],
  });
}
