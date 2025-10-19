import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface TestResult {
  testName: string;
  testPath: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface CodeChange {
  commitHash?: string;
  filesChanged: string[];
  linesAdded: number;
  linesDeleted: number;
  timestamp: string;
  author?: string;
  message?: string;
}

interface TrainingExample {
  testName: string;
  features: FeatureVector;
  label: number; // 0 = passed, 1 = failed
  timestamp: string;
  metadata?: Record<string, any>;
}

interface FeatureVector {
  // Code change features
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  fileTypeRisk: number;
  pathRisk: number;

  // Test history features
  recentFailures: number;
  failureRate: number;
  averageDuration: number;
  daysSinceLastFailure: number;
  consecutivePasses: number;

  // Correlation features
  relatedTestFailures: number;
  sameModuleFailures: number;

  // Complexity features
  cyclomaticComplexity: number;
  nestedDepth: number;

  // Temporal features
  hourOfDay: number;
  dayOfWeek: number;
}

/**
 * Training Data Collector
 *
 * Collects and processes test results and code changes to build
 * a training dataset for the ML predictive QA engine.
 */
export class TrainingDataCollector {
  private db: sqlite3.Database;
  private config: any;
  private dbPath: string;

  constructor(configPath?: string) {
    const configFile = configPath || path.join(__dirname, 'ml-config.json');
    this.config = require(configFile);
    this.dbPath = path.join(process.cwd(), this.config.storage.databasePath);
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

    // Open database
    this.db = new sqlite3.Database(this.dbPath);

    // Create tables
    await this.createTables();
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Test results table
    await run(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        test_path TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        error TEXT,
        metadata TEXT
      )
    `);

    // Create index on test_name for faster queries
    await run(`
      CREATE INDEX IF NOT EXISTS idx_test_name
      ON test_results(test_name)
    `);

    // Create index on timestamp
    await run(`
      CREATE INDEX IF NOT EXISTS idx_timestamp
      ON test_results(timestamp)
    `);

    // Code changes table
    await run(`
      CREATE TABLE IF NOT EXISTS code_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_hash TEXT,
        files_changed TEXT NOT NULL,
        lines_added INTEGER NOT NULL,
        lines_deleted INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        author TEXT,
        message TEXT
      )
    `);

    // Training examples table
    await run(`
      CREATE TABLE IF NOT EXISTS training_examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        features TEXT NOT NULL,
        label INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
      )
    `);

    // Predictions table (for tracking prediction accuracy)
    await run(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        predicted_risk REAL NOT NULL,
        confidence REAL NOT NULL,
        actual_result TEXT,
        timestamp TEXT NOT NULL,
        features TEXT NOT NULL
      )
    `);
  }

  /**
   * Collect test results from reports
   */
  async collectTestResults(reportsDir?: string): Promise<void> {
    const reportsPath = reportsDir || path.join(process.cwd(), 'tests/reports');

    try {
      const files = await fs.readdir(reportsPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(reportsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const report = JSON.parse(content);

        if (report.results && Array.isArray(report.results)) {
          for (const result of report.results) {
            await this.storeTestResult({
              testName: result.testName,
              testPath: result.testPath || '',
              status: result.status,
              duration: result.duration,
              timestamp: report.timestamp,
              error: result.error,
              metadata: result.metadata,
            });
          }
        }
      }

      console.log(`Collected test results from ${jsonFiles.length} reports`);
    } catch (error) {
      console.warn('Failed to collect test results:', error.message);
    }
  }

  /**
   * Store a test result
   */
  async storeTestResult(result: TestResult): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    await run(
      `INSERT INTO test_results
       (test_name, test_path, status, duration, timestamp, error, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.testName,
        result.testPath,
        result.status,
        result.duration,
        result.timestamp,
        result.error || null,
        result.metadata ? JSON.stringify(result.metadata) : null,
      ]
    );
  }

  /**
   * Collect code changes from git history
   */
  async collectCodeChanges(limit: number = 100): Promise<void> {
    try {
      // Get git log with stats
      const { stdout } = await execAsync(
        `git log --numstat --pretty=format:'COMMIT:%H|%an|%ai|%s' -n ${limit}`
      );

      const lines = stdout.split('\n');
      let currentCommit: Partial<CodeChange> | null = null;
      const filesChanged: string[] = [];
      let linesAdded = 0;
      let linesDeleted = 0;

      for (const line of lines) {
        if (line.startsWith('COMMIT:')) {
          // Save previous commit if exists
          if (currentCommit) {
            await this.storeCodeChange({
              ...currentCommit,
              filesChanged,
              linesAdded,
              linesDeleted,
            } as CodeChange);
          }

          // Parse new commit
          const parts = line.substring(7).split('|');
          currentCommit = {
            commitHash: parts[0],
            author: parts[1],
            timestamp: parts[2],
            message: parts[3],
          };
          filesChanged.length = 0;
          linesAdded = 0;
          linesDeleted = 0;
        } else if (line.trim() && !line.startsWith('COMMIT:')) {
          // Parse file stats (format: added\tdeleted\tfilename)
          const parts = line.trim().split('\t');
          if (parts.length >= 3) {
            const added = parseInt(parts[0]) || 0;
            const deleted = parseInt(parts[1]) || 0;
            const filename = parts[2];

            filesChanged.push(filename);
            linesAdded += added;
            linesDeleted += deleted;
          }
        }
      }

      // Save last commit
      if (currentCommit && filesChanged.length > 0) {
        await this.storeCodeChange({
          ...currentCommit,
          filesChanged,
          linesAdded,
          linesDeleted,
        } as CodeChange);
      }

      console.log('Collected code changes from git history');
    } catch (error) {
      console.warn('Failed to collect code changes:', error.message);
    }
  }

  /**
   * Store a code change
   */
  async storeCodeChange(change: CodeChange): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    await run(
      `INSERT INTO code_changes
       (commit_hash, files_changed, lines_added, lines_deleted, timestamp, author, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        change.commitHash || null,
        JSON.stringify(change.filesChanged),
        change.linesAdded,
        change.linesDeleted,
        change.timestamp,
        change.author || null,
        change.message || null,
      ]
    );
  }

  /**
   * Extract features for a test at a given timestamp
   */
  async extractFeatures(testName: string, timestamp: string): Promise<FeatureVector> {
    const all = promisify(this.db.all.bind(this.db));

    // Get test history
    const testHistory = await all(
      `SELECT status, duration, timestamp
       FROM test_results
       WHERE test_name = ? AND timestamp < ?
       ORDER BY timestamp DESC
       LIMIT ${this.config.features.testHistory.recentFailures.windowSize}`,
      [testName, timestamp]
    );

    // Calculate test history features
    const recentFailures = testHistory.filter((r: any) => r.status === 'failed').length;
    const totalRuns = testHistory.length;
    const failureRate = totalRuns > 0 ? recentFailures / totalRuns : 0;

    const durations = testHistory.map((r: any) => r.duration);
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Calculate days since last failure
    const lastFailure = testHistory.find((r: any) => r.status === 'failed');
    const daysSinceLastFailure = lastFailure
      ? (new Date(timestamp).getTime() - new Date(lastFailure.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // Calculate consecutive passes
    let consecutivePasses = 0;
    for (const result of testHistory) {
      if (result.status === 'passed') {
        consecutivePasses++;
      } else {
        break;
      }
    }

    // Get recent code changes
    const recentChanges = await all(
      `SELECT * FROM code_changes
       WHERE timestamp < ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [timestamp]
    );

    const latestChange = recentChanges[0];
    let filesChanged = 0;
    let linesAdded = 0;
    let linesDeleted = 0;
    let fileTypeRisk = 0;
    let pathRisk = 0;

    if (latestChange) {
      const files = JSON.parse(latestChange.files_changed);
      filesChanged = files.length;
      linesAdded = latestChange.lines_added;
      linesDeleted = latestChange.lines_deleted;

      // Calculate file type risk
      fileTypeRisk = this.calculateFileTypeRisk(files);

      // Calculate path risk
      pathRisk = this.calculatePathRisk(files);
    }

    // Get module name from test name (e.g., "authentication" from "authentication-test")
    const moduleName = testName.split('-')[0].split('.')[0];

    // Get related test failures
    const relatedFailures = await all(
      `SELECT COUNT(*) as count
       FROM test_results
       WHERE test_name LIKE ? AND status = 'failed' AND timestamp < ?
       LIMIT 10`,
      [`%${moduleName}%`, timestamp]
    );
    const relatedTestFailures = relatedFailures[0]?.count || 0;

    // Get same module failures
    const moduleFailures = await all(
      `SELECT COUNT(*) as count
       FROM test_results
       WHERE test_name LIKE ? AND status = 'failed' AND timestamp < ?`,
      [`${moduleName}%`, timestamp]
    );
    const sameModuleFailures = moduleFailures[0]?.count || 0;

    // Temporal features
    const date = new Date(timestamp);
    const hourOfDay = date.getHours() / 24; // Normalize to 0-1
    const dayOfWeek = date.getDay() / 7; // Normalize to 0-1

    return {
      filesChanged,
      linesAdded,
      linesDeleted,
      fileTypeRisk,
      pathRisk,
      recentFailures,
      failureRate,
      averageDuration,
      daysSinceLastFailure,
      consecutivePasses,
      relatedTestFailures,
      sameModuleFailures,
      cyclomaticComplexity: 0, // TODO: Calculate from AST
      nestedDepth: 0, // TODO: Calculate from AST
      hourOfDay,
      dayOfWeek,
    };
  }

  /**
   * Calculate file type risk score
   */
  private calculateFileTypeRisk(files: string[]): number {
    const riskMap = this.config.features.codeChange.fileType.riskMap;
    let totalRisk = 0;

    for (const file of files) {
      const ext = file.split('.').pop() || '';
      const baseRisk = riskMap[ext] || 0.5;

      // Check for test files
      const isTestFile = file.includes('.spec.') || file.includes('.test.');
      const risk = isTestFile ? 0.3 : baseRisk;

      totalRisk += risk;
    }

    return files.length > 0 ? totalRisk / files.length : 0;
  }

  /**
   * Calculate path risk score
   */
  private calculatePathRisk(files: string[]): number {
    const riskPaths = this.config.features.codeChange.pathPattern.riskPaths;
    let totalRisk = 0;

    for (const file of files) {
      let maxRisk = 0.5; // Default risk

      for (const pathConfig of riskPaths) {
        if (file.includes(pathConfig.pattern)) {
          maxRisk = Math.max(maxRisk, pathConfig.risk);
        }
      }

      totalRisk += maxRisk;
    }

    return files.length > 0 ? totalRisk / files.length : 0;
  }

  /**
   * Build training dataset
   */
  async buildTrainingDataset(): Promise<TrainingExample[]> {
    const all = promisify(this.db.all.bind(this.db));

    // Get all test results
    const results = await all(
      `SELECT * FROM test_results
       ORDER BY timestamp ASC`
    );

    const trainingExamples: TrainingExample[] = [];

    for (const result of results) {
      // Extract features for this test at this timestamp
      const features = await this.extractFeatures(result.test_name, result.timestamp);

      // Create training example
      const example: TrainingExample = {
        testName: result.test_name,
        features,
        label: result.status === 'failed' ? 1 : 0,
        timestamp: result.timestamp,
        metadata: {
          duration: result.duration,
          error: result.error,
        },
      };

      trainingExamples.push(example);

      // Store in database
      await this.storeTrainingExample(example);
    }

    console.log(`Built ${trainingExamples.length} training examples`);
    return trainingExamples;
  }

  /**
   * Store a training example
   */
  async storeTrainingExample(example: TrainingExample): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    await run(
      `INSERT INTO training_examples
       (test_name, features, label, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        example.testName,
        JSON.stringify(example.features),
        example.label,
        example.timestamp,
        example.metadata ? JSON.stringify(example.metadata) : null,
      ]
    );
  }

  /**
   * Get training dataset
   */
  async getTrainingDataset(): Promise<TrainingExample[]> {
    const all = promisify(this.db.all.bind(this.db));

    const rows = await all(
      `SELECT * FROM training_examples
       ORDER BY timestamp ASC`
    );

    return rows.map((row: any) => ({
      testName: row.test_name,
      features: JSON.parse(row.features),
      label: row.label,
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Clean old data beyond retention period
   */
  async cleanOldData(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    const maxDays = this.config.storage.maxHistoryDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    const cutoffTimestamp = cutoffDate.toISOString();

    await run(
      `DELETE FROM test_results WHERE timestamp < ?`,
      [cutoffTimestamp]
    );

    await run(
      `DELETE FROM code_changes WHERE timestamp < ?`,
      [cutoffTimestamp]
    );

    await run(
      `DELETE FROM training_examples WHERE timestamp < ?`,
      [cutoffTimestamp]
    );

    console.log(`Cleaned data older than ${maxDays} days`);
  }

  /**
   * Get statistics about the training data
   */
  async getStatistics(): Promise<any> {
    const get = promisify(this.db.get.bind(this.db));
    const all = promisify(this.db.all.bind(this.db));

    const testResultCount = await get(`SELECT COUNT(*) as count FROM test_results`);
    const codeChangeCount = await get(`SELECT COUNT(*) as count FROM code_changes`);
    const trainingExampleCount = await get(`SELECT COUNT(*) as count FROM training_examples`);

    const failureRate = await get(
      `SELECT
        COUNT(CASE WHEN status = 'failed' THEN 1 END) * 1.0 / COUNT(*) as rate
       FROM test_results`
    );

    const topFailingTests = await all(
      `SELECT test_name, COUNT(*) as failures
       FROM test_results
       WHERE status = 'failed'
       GROUP BY test_name
       ORDER BY failures DESC
       LIMIT 10`
    );

    return {
      testResults: testResultCount.count,
      codeChanges: codeChangeCount.count,
      trainingExamples: trainingExampleCount.count,
      overallFailureRate: failureRate.rate || 0,
      topFailingTests: topFailingTests.map((t: any) => ({
        testName: t.test_name,
        failures: t.failures,
      })),
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    console.log('Training Data Collector');
    console.log('======================\n');

    const collector = new TrainingDataCollector();
    await collector.initialize();

    // Collect data
    console.log('Collecting test results...');
    await collector.collectTestResults();

    console.log('\nCollecting code changes...');
    await collector.collectCodeChanges(100);

    console.log('\nBuilding training dataset...');
    await collector.buildTrainingDataset();

    console.log('\nCleaning old data...');
    await collector.cleanOldData();

    console.log('\nStatistics:');
    const stats = await collector.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    await collector.close();
    console.log('\nDone!');
  })();
}
