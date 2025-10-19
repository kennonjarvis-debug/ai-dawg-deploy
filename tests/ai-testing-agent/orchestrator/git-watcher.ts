import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import chokidar from 'chokidar';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';
import type { MasterOrchestrator } from './master-orchestrator';

const execAsync = promisify(exec);

export interface GitChange {
  file: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff?: string;
}

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  changes: GitChange[];
}

export interface ChangeImpact {
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedComponents: string[];
  riskFactors: string[];
  recommendedTests: string[];
  estimatedTestTime: number;
  shouldBlockMerge: boolean;
}

export interface GitWatcherConfig {
  enabled: boolean;
  paths: string[];
  ignorePatterns: string[];
}

/**
 * Git Watcher
 *
 * Monitors git commits and code changes:
 * - Watches file system for changes
 * - Detects git commits
 * - Analyzes change impact using ML
 * - Predicts test requirements
 * - Triggers appropriate tests
 * - Blocks merge on critical failures
 */
export class GitWatcher extends EventEmitter {
  private orchestrator: MasterOrchestrator;
  private config: GitWatcherConfig;
  private openai: OpenAI;
  private watcher?: chokidar.FSWatcher;
  private isWatching: boolean = false;
  private repoPath: string;
  private lastCommitHash?: string;

  constructor(orchestrator: MasterOrchestrator, config: GitWatcherConfig) {
    super();
    this.orchestrator = orchestrator;
    this.config = config;
    this.repoPath = process.cwd();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize git watcher
   */
  async initialize(): Promise<void> {
    console.log('   Checking git repository...');

    // Verify git repository
    try {
      await execAsync('git rev-parse --git-dir', { cwd: this.repoPath });
      console.log('   ✓ Git repository detected');
    } catch {
      console.warn('   ⚠️  Not a git repository, git watching disabled');
      this.config.enabled = false;
      return;
    }

    // Get current commit
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.repoPath });
      this.lastCommitHash = stdout.trim();
      console.log(`   ✓ Current commit: ${this.lastCommitHash.slice(0, 7)}`);
    } catch (error) {
      console.warn('   ⚠️  Could not get current commit');
    }
  }

  /**
   * Start watching for changes
   */
  async start(): Promise<void> {
    if (!this.config.enabled || this.isWatching) {
      return;
    }

    console.log('👁️  Starting Git watcher...');
    this.isWatching = true;

    // Watch for file changes
    this.watcher = chokidar.watch(this.config.paths, {
      ignored: this.config.ignorePatterns,
      persistent: true,
      cwd: this.repoPath,
    });

    this.watcher.on('change', async (filePath) => {
      await this.onFileChanged(filePath);
    });

    this.watcher.on('add', async (filePath) => {
      await this.onFileAdded(filePath);
    });

    this.watcher.on('unlink', async (filePath) => {
      await this.onFileDeleted(filePath);
    });

    // Poll for new commits
    this.startCommitPolling();

    console.log('   ✓ Watching for changes\n');
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (!this.isWatching) {
      return;
    }

    console.log('🛑 Stopping Git watcher...');
    this.isWatching = false;

    if (this.watcher) {
      await this.watcher.close();
    }

    console.log('   ✓ Git watcher stopped\n');
  }

  /**
   * Start commit polling
   */
  private startCommitPolling(): void {
    const pollInterval = 10000; // 10 seconds

    const poll = async () => {
      while (this.isWatching) {
        await this.checkForNewCommits();
        await this.sleep(pollInterval);
      }
    };

    poll();
  }

  /**
   * Check for new commits
   */
  private async checkForNewCommits(): Promise<void> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.repoPath });
      const currentHash = stdout.trim();

      if (this.lastCommitHash && currentHash !== this.lastCommitHash) {
        console.log(`\n📝 New commit detected: ${currentHash.slice(0, 7)}`);
        await this.onNewCommit(currentHash);
      }

      this.lastCommitHash = currentHash;
    } catch (error) {
      // Ignore errors (might not be in a git repo)
    }
  }

  /**
   * Handle new commit
   */
  private async onNewCommit(commitHash: string): Promise<void> {
    try {
      // Get commit info
      const commitInfo = await this.getCommitInfo(commitHash);

      console.log(`   Author: ${commitInfo.author}`);
      console.log(`   Message: ${commitInfo.message}`);
      console.log(`   Files changed: ${commitInfo.changes.length}\n`);

      // Analyze change impact
      console.log('🔍 Analyzing change impact...');
      const impact = await this.analyzeChangeImpact(commitInfo);

      console.log(`   Severity: ${impact.severity}`);
      console.log(`   Affected components: ${impact.affectedComponents.join(', ')}`);
      console.log(`   Recommended tests: ${impact.recommendedTests.length}`);
      console.log(`   Block merge: ${impact.shouldBlockMerge ? 'YES' : 'NO'}\n`);

      // Emit event
      this.emit('commitDetected', { commitInfo, impact });

      // Trigger tests based on impact
      await this.triggerTestsForCommit(commitInfo, impact);

    } catch (error) {
      console.error('❌ Error handling commit:', error);
    }
  }

  /**
   * Get commit information
   */
  private async getCommitInfo(commitHash: string): Promise<CommitInfo> {
    // Get commit metadata
    const { stdout: metaOutput } = await execAsync(
      `git show --format="%H|%an|%ad|%s" --no-patch ${commitHash}`,
      { cwd: this.repoPath }
    );

    const [hash, author, date, message] = metaOutput.trim().split('|');

    // Get changed files
    const { stdout: diffOutput } = await execAsync(
      `git diff-tree --no-commit-id --name-status -r ${commitHash}`,
      { cwd: this.repoPath }
    );

    const changes: GitChange[] = [];

    for (const line of diffOutput.trim().split('\n')) {
      if (!line) continue;

      const [status, ...fileParts] = line.split('\t');
      const file = fileParts.join('\t');

      const changeType: GitChange['type'] =
        status === 'A' ? 'added' :
        status === 'M' ? 'modified' :
        status === 'D' ? 'deleted' :
        status.startsWith('R') ? 'renamed' : 'modified';

      // Get diff stats for this file
      try {
        const { stdout: statOutput } = await execAsync(
          `git diff ${commitHash}^ ${commitHash} -- "${file}" | wc -l`,
          { cwd: this.repoPath }
        );
        const lineCount = parseInt(statOutput.trim());

        // Get actual diff
        const { stdout: diffContent } = await execAsync(
          `git diff ${commitHash}^ ${commitHash} -- "${file}"`,
          { cwd: this.repoPath }
        );

        changes.push({
          file,
          type: changeType,
          additions: lineCount,
          deletions: 0,
          diff: diffContent,
        });
      } catch {
        changes.push({
          file,
          type: changeType,
          additions: 0,
          deletions: 0,
        });
      }
    }

    return {
      hash,
      author,
      date,
      message,
      changes,
    };
  }

  /**
   * Analyze change impact using ML
   */
  private async analyzeChangeImpact(commitInfo: CommitInfo): Promise<ChangeImpact> {
    // Prepare context for GPT analysis
    const context = {
      message: commitInfo.message,
      author: commitInfo.author,
      filesChanged: commitInfo.changes.map(c => ({
        file: c.file,
        type: c.type,
        additions: c.additions,
      })),
      diffSummary: commitInfo.changes.map(c => ({
        file: c.file,
        diff: c.diff?.slice(0, 1000), // First 1000 chars
      })),
    };

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are an expert code change impact analyzer for DAWG AI, a music production platform.
Analyze git commits and predict:
1. Severity of changes (critical, high, medium, low)
2. Affected system components
3. Risk factors (breaking changes, performance impact, security issues)
4. Recommended tests to run
5. Whether this change should block merge until tests pass

Consider:
- Changes to AI features are critical
- Changes to backend services are high priority
- Changes to UI/frontend are medium priority
- Changes to tests/docs are low priority`,
        },
        {
          role: 'user',
          content: `Analyze this commit and predict impact:

Commit Message: ${commitInfo.message}
Files Changed (${commitInfo.changes.length}):
${commitInfo.changes.map(c => `- ${c.type}: ${c.file} (+${c.additions})`).join('\n')}

Return JSON with:
{
  "severity": "critical" | "high" | "medium" | "low",
  "affectedComponents": string[],
  "riskFactors": string[],
  "recommendedTests": string[],
  "estimatedTestTime": number (seconds),
  "shouldBlockMerge": boolean
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const impact = JSON.parse(response.choices[0].message.content || '{}');

    return {
      severity: impact.severity || 'medium',
      affectedComponents: impact.affectedComponents || [],
      riskFactors: impact.riskFactors || [],
      recommendedTests: impact.recommendedTests || [],
      estimatedTestTime: impact.estimatedTestTime || 60,
      shouldBlockMerge: impact.shouldBlockMerge || false,
    };
  }

  /**
   * Trigger tests based on commit impact
   */
  private async triggerTestsForCommit(
    commitInfo: CommitInfo,
    impact: ChangeImpact
  ): Promise<void> {
    console.log('🚀 Triggering tests for commit...\n');

    // Queue test task with high priority
    const taskId = await this.orchestrator.queueTask({
      type: 'test',
      priority: impact.severity === 'critical' ? 'critical' : 'high',
      payload: {
        commitHash: commitInfo.hash,
        impact,
        tests: impact.recommendedTests,
      },
    });

    console.log(`   Queued test task: ${taskId}\n`);

    // Wait for test results if blocking
    if (impact.shouldBlockMerge) {
      console.log('⏳ Blocking merge until tests complete...\n');

      const result = await this.waitForTask(taskId);

      if (result.status === 'failed') {
        console.error('❌ CRITICAL: Tests failed, merge should be blocked!\n');
        await this.blockMerge(commitInfo, result);
      } else {
        console.log('✅ Tests passed, merge can proceed\n');
      }
    }
  }

  /**
   * Wait for task to complete
   */
  private async waitForTask(taskId: string, timeout: number = 600000): Promise<any> {
    const startTime = Date.now();

    while (true) {
      const task = this.orchestrator.getTaskStatus(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Task timeout');
      }

      await this.sleep(1000);
    }
  }

  /**
   * Block merge by creating git hook or status
   */
  private async blockMerge(commitInfo: CommitInfo, testResult: any): Promise<void> {
    // Create a file to indicate blocked status
    const blockFile = path.join(this.repoPath, '.git', 'MERGE_BLOCKED');
    await fs.writeFile(blockFile, JSON.stringify({
      commit: commitInfo.hash,
      reason: 'Critical tests failed',
      testResult,
      timestamp: new Date().toISOString(),
    }, null, 2));

    console.log(`🚫 Created merge block file: ${blockFile}`);

    // Emit event for external handling
    this.emit('mergeBlocked', { commitInfo, testResult });
  }

  /**
   * Handle file changed
   */
  private async onFileChanged(filePath: string): Promise<void> {
    console.log(`📝 File changed: ${filePath}`);

    // Debounce rapid changes
    await this.sleep(1000);

    // Analyze if this is a critical file
    if (this.isCriticalFile(filePath)) {
      console.log('   ⚠️  Critical file changed, triggering quick validation...');

      await this.orchestrator.queueTask({
        type: 'test',
        priority: 'high',
        payload: {
          files: [filePath],
          testType: 'quick-validation',
        },
      });
    }
  }

  /**
   * Handle file added
   */
  private async onFileAdded(filePath: string): Promise<void> {
    console.log(`➕ File added: ${filePath}`);
  }

  /**
   * Handle file deleted
   */
  private async onFileDeleted(filePath: string): Promise<void> {
    console.log(`➖ File deleted: ${filePath}`);

    // Check if this breaks imports
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      console.log('   ⚠️  Code file deleted, checking for broken imports...');

      await this.orchestrator.queueTask({
        type: 'analysis',
        priority: 'high',
        payload: {
          action: 'check-broken-imports',
          deletedFile: filePath,
        },
      });
    }
  }

  /**
   * Check if file is critical
   */
  private isCriticalFile(filePath: string): boolean {
    const criticalPaths = [
      'src/backend/ai-brain-server.ts',
      'src/backend/realtime-voice-server.ts',
      'src/backend/services/',
      'src/audio/ai/',
    ];

    return criticalPaths.some(critical => filePath.includes(critical));
  }

  /**
   * Calculate change impact score
   */
  async calculateChangeImpact(changes: GitChange[]): Promise<number> {
    let score = 0;

    for (const change of changes) {
      // File type weighting
      if (change.file.includes('backend') || change.file.includes('services')) {
        score += 5;
      } else if (change.file.includes('ai')) {
        score += 10; // AI changes are highest priority
      } else if (change.file.includes('test')) {
        score += 1;
      } else {
        score += 3;
      }

      // Change type weighting
      if (change.type === 'deleted') {
        score += 5;
      } else if (change.type === 'added') {
        score += 2;
      } else if (change.type === 'modified') {
        score += 1;
      }

      // Size weighting
      score += Math.min(change.additions / 10, 5);
    }

    return score;
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.repoPath,
      });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if branch is protected
   */
  async isProtectedBranch(branch?: string): Promise<boolean> {
    const currentBranch = branch || await this.getCurrentBranch();
    const protectedBranches = ['main', 'master', 'production', 'release'];
    return protectedBranches.includes(currentBranch);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
