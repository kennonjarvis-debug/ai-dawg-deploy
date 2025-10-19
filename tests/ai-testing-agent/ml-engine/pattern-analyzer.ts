import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

interface Pattern {
  type: 'failure' | 'code-change' | 'correlation' | 'temporal';
  confidence: number;
  description: string;
  evidence: any[];
  impact: 'high' | 'medium' | 'low';
}

interface FailurePattern extends Pattern {
  type: 'failure';
  testNames: string[];
  frequency: number;
  avgDuration: number;
}

interface CodeChangePattern extends Pattern {
  type: 'code-change';
  files: string[];
  failureCorrelation: number;
}

interface CorrelationPattern extends Pattern {
  type: 'correlation';
  tests: Array<{ testName: string; correlation: number }>;
}

interface TemporalPattern extends Pattern {
  type: 'temporal';
  timeWindow: string;
  failureRate: number;
}

/**
 * Pattern Analyzer
 *
 * Analyzes historical test data to identify patterns in:
 * - Test failures
 * - Code changes that cause issues
 * - Test correlations
 * - Temporal patterns
 */
export class PatternAnalyzer {
  private db: sqlite3.Database;
  private config: any;
  private dbPath: string;

  constructor(configPath?: string) {
    const configFile = configPath || path.join(__dirname, 'ml-config.json');
    this.config = require(configFile);
    this.dbPath = path.join(process.cwd(), this.config.storage.databasePath);
  }

  /**
   * Initialize the analyzer
   */
  async initialize(): Promise<void> {
    this.db = new sqlite3.Database(this.dbPath);
  }

  /**
   * Analyze all patterns
   */
  async analyzePatterns(): Promise<{
    failurePatterns: FailurePattern[];
    codeChangePatterns: CodeChangePattern[];
    correlationPatterns: CorrelationPattern[];
    temporalPatterns: TemporalPattern[];
  }> {
    console.log('Analyzing patterns in test data...\n');

    const failurePatterns = await this.analyzeFailurePatterns();
    const codeChangePatterns = await this.analyzeCodeChangePatterns();
    const correlationPatterns = await this.analyzeTestCorrelations();
    const temporalPatterns = await this.analyzeTemporalPatterns();

    return {
      failurePatterns,
      codeChangePatterns,
      correlationPatterns,
      temporalPatterns,
    };
  }

  /**
   * Analyze failure patterns
   */
  async analyzeFailurePatterns(): Promise<FailurePattern[]> {
    const all = promisify(this.db.all.bind(this.db));

    // Get tests with high failure rates
    const failingTests = await all(`
      SELECT
        test_name,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures,
        AVG(duration) as avg_duration,
        (SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) as failure_rate
      FROM test_results
      GROUP BY test_name
      HAVING failure_rate > 0.2
      ORDER BY failure_rate DESC, failures DESC
    `);

    const patterns: FailurePattern[] = [];

    for (const test of failingTests) {
      // Get recent failure timestamps to check for patterns
      const recentFailures = await all(
        `SELECT timestamp, error
         FROM test_results
         WHERE test_name = ? AND status = 'failed'
         ORDER BY timestamp DESC
         LIMIT 10`,
        [test.test_name]
      );

      const confidence = Math.min(test.failure_rate * test.failures / 10, 1);
      const impact = test.failure_rate > 0.5 ? 'high' : test.failure_rate > 0.3 ? 'medium' : 'low';

      patterns.push({
        type: 'failure',
        testNames: [test.test_name],
        frequency: test.failures,
        avgDuration: test.avg_duration,
        confidence,
        description: `Test "${test.test_name}" has a ${(test.failure_rate * 100).toFixed(1)}% failure rate over ${test.total_runs} runs`,
        evidence: recentFailures,
        impact,
      });
    }

    console.log(`Found ${patterns.length} failure patterns`);
    return patterns;
  }

  /**
   * Analyze code change patterns
   */
  async analyzeCodeChangePatterns(): Promise<CodeChangePattern[]> {
    const all = promisify(this.db.all.bind(this.db));

    // Get code changes and their impact on tests
    const changes = await all(`
      SELECT
        cc.files_changed,
        cc.timestamp as change_time,
        COUNT(tr.id) as affected_tests,
        SUM(CASE WHEN tr.status = 'failed' THEN 1 ELSE 0 END) as failures
      FROM code_changes cc
      LEFT JOIN test_results tr ON
        tr.timestamp > cc.timestamp AND
        tr.timestamp < datetime(cc.timestamp, '+1 hour')
      GROUP BY cc.id
      HAVING failures > 0
      ORDER BY failures DESC
      LIMIT 20
    `);

    const patterns: CodeChangePattern[] = [];

    for (const change of changes) {
      const files = JSON.parse(change.files_changed);
      const failureCorrelation = change.affected_tests > 0
        ? change.failures / change.affected_tests
        : 0;

      if (failureCorrelation > 0.3) {
        const confidence = Math.min(failureCorrelation * (change.failures / 5), 1);
        const impact = failureCorrelation > 0.7 ? 'high' : failureCorrelation > 0.4 ? 'medium' : 'low';

        patterns.push({
          type: 'code-change',
          files,
          failureCorrelation,
          confidence,
          description: `Changes to ${files.length} file(s) correlated with ${(failureCorrelation * 100).toFixed(1)}% test failures`,
          evidence: [{ files, failures: change.failures, affectedTests: change.affected_tests }],
          impact,
        });
      }
    }

    console.log(`Found ${patterns.length} code change patterns`);
    return patterns;
  }

  /**
   * Analyze test correlations
   */
  async analyzeTestCorrelations(): Promise<CorrelationPattern[]> {
    const all = promisify(this.db.all.bind(this.db));

    // Get all test names
    const tests = await all(`
      SELECT DISTINCT test_name
      FROM test_results
    `);

    const patterns: CorrelationPattern[] = [];

    // For each test, find tests that tend to fail together
    for (const test of tests) {
      const correlations = await this.findCorrelatedTests(test.test_name);

      if (correlations.length > 0) {
        const avgCorrelation = correlations.reduce((sum, c) => sum + c.correlation, 0) / correlations.length;
        const confidence = Math.min(avgCorrelation * (correlations.length / 3), 1);
        const impact = avgCorrelation > 0.7 ? 'high' : avgCorrelation > 0.5 ? 'medium' : 'low';

        patterns.push({
          type: 'correlation',
          tests: [
            { testName: test.test_name, correlation: 1.0 },
            ...correlations,
          ],
          confidence,
          description: `Test "${test.test_name}" correlates with ${correlations.length} other tests (avg correlation: ${(avgCorrelation * 100).toFixed(1)}%)`,
          evidence: correlations,
          impact,
        });
      }
    }

    // Sort by confidence and take top patterns
    patterns.sort((a, b) => b.confidence - a.confidence);
    const topPatterns = patterns.slice(0, 10);

    console.log(`Found ${topPatterns.length} correlation patterns`);
    return topPatterns;
  }

  /**
   * Find tests that correlate with a given test
   */
  private async findCorrelatedTests(testName: string): Promise<Array<{ testName: string; correlation: number }>> {
    const all = promisify(this.db.all.bind(this.db));

    // Get failure timestamps for the target test
    const targetFailures = await all(
      `SELECT timestamp
       FROM test_results
       WHERE test_name = ? AND status = 'failed'`,
      [testName]
    );

    if (targetFailures.length < 2) {
      return [];
    }

    // Find other tests that failed around the same time
    const correlations: Array<{ testName: string; correlation: number }> = [];

    const otherTests = await all(
      `SELECT DISTINCT test_name
       FROM test_results
       WHERE test_name != ?`,
      [testName]
    );

    for (const otherTest of otherTests) {
      const otherFailures = await all(
        `SELECT timestamp
         FROM test_results
         WHERE test_name = ? AND status = 'failed'`,
        [otherTest.test_name]
      );

      // Calculate correlation (failures within 1 hour of each other)
      let correlatedFailures = 0;

      for (const targetFailure of targetFailures) {
        const targetTime = new Date(targetFailure.timestamp).getTime();

        for (const otherFailure of otherFailures) {
          const otherTime = new Date(otherFailure.timestamp).getTime();
          const timeDiff = Math.abs(targetTime - otherTime);

          // Within 1 hour
          if (timeDiff < 60 * 60 * 1000) {
            correlatedFailures++;
            break;
          }
        }
      }

      const correlation = correlatedFailures / targetFailures.length;

      if (correlation > 0.5) {
        correlations.push({
          testName: otherTest.test_name,
          correlation,
        });
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation).slice(0, 5);
  }

  /**
   * Analyze temporal patterns
   */
  async analyzeTemporalPatterns(): Promise<TemporalPattern[]> {
    const all = promisify(this.db.all.bind(this.db));

    const patterns: TemporalPattern[] = [];

    // Analyze by hour of day
    const hourlyStats = await all(`
      SELECT
        CAST(strftime('%H', timestamp) AS INTEGER) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
      FROM test_results
      GROUP BY hour
      HAVING total > 5
    `);

    for (const stat of hourlyStats) {
      const failureRate = stat.failures / stat.total;

      if (failureRate > 0.3) {
        const confidence = Math.min(failureRate * (stat.total / 20), 1);
        const impact = failureRate > 0.5 ? 'high' : failureRate > 0.3 ? 'medium' : 'low';

        patterns.push({
          type: 'temporal',
          timeWindow: `Hour ${stat.hour}:00-${stat.hour}:59`,
          failureRate,
          confidence,
          description: `Tests run during hour ${stat.hour} have a ${(failureRate * 100).toFixed(1)}% failure rate`,
          evidence: [{ hour: stat.hour, total: stat.total, failures: stat.failures }],
          impact,
        });
      }
    }

    // Analyze by day of week
    const dailyStats = await all(`
      SELECT
        CAST(strftime('%w', timestamp) AS INTEGER) as day_of_week,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
      FROM test_results
      GROUP BY day_of_week
      HAVING total > 10
    `);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const stat of dailyStats) {
      const failureRate = stat.failures / stat.total;

      if (failureRate > 0.3) {
        const confidence = Math.min(failureRate * (stat.total / 50), 1);
        const impact = failureRate > 0.5 ? 'high' : failureRate > 0.3 ? 'medium' : 'low';

        patterns.push({
          type: 'temporal',
          timeWindow: dayNames[stat.day_of_week],
          failureRate,
          confidence,
          description: `Tests run on ${dayNames[stat.day_of_week]} have a ${(failureRate * 100).toFixed(1)}% failure rate`,
          evidence: [{ dayOfWeek: stat.day_of_week, total: stat.total, failures: stat.failures }],
          impact,
        });
      }
    }

    console.log(`Found ${patterns.length} temporal patterns`);
    return patterns;
  }

  /**
   * Detect code change risks
   */
  async detectCodeChangeRisks(files: string[]): Promise<{
    riskScore: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    reasons: string[];
    affectedTests: string[];
  }> {
    const all = promisify(this.db.all.bind(this.db));

    let riskScore = 0;
    const reasons: string[] = [];
    const affectedTests: string[] = [];

    // Check file type risks
    const fileTypeRisk = this.calculateFileTypeRisk(files);
    riskScore += fileTypeRisk * this.config.features.codeChange.fileType.weight;

    if (fileTypeRisk > 0.7) {
      reasons.push(`High-risk file types modified (score: ${fileTypeRisk.toFixed(2)})`);
    }

    // Check path risks
    const pathRisk = this.calculatePathRisk(files);
    riskScore += pathRisk * this.config.features.codeChange.pathPattern.weight;

    if (pathRisk > 0.7) {
      reasons.push(`High-risk paths modified (score: ${pathRisk.toFixed(2)})`);
    }

    // Check historical failures for these files
    for (const file of files) {
      const historicalImpact = await all(
        `SELECT tr.test_name, COUNT(*) as failures
         FROM code_changes cc
         JOIN test_results tr ON
           tr.timestamp > cc.timestamp AND
           tr.timestamp < datetime(cc.timestamp, '+1 hour') AND
           tr.status = 'failed'
         WHERE cc.files_changed LIKE ?
         GROUP BY tr.test_name
         ORDER BY failures DESC
         LIMIT 5`,
        [`%${file}%`]
      );

      for (const impact of historicalImpact) {
        if (!affectedTests.includes(impact.test_name)) {
          affectedTests.push(impact.test_name);
        }
        riskScore += impact.failures * 0.1;
      }

      if (historicalImpact.length > 0) {
        reasons.push(`File "${file}" historically caused ${historicalImpact.length} test failure(s)`);
      }
    }

    // Normalize risk score
    riskScore = Math.min(riskScore / 10, 1);

    // Determine risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      riskScore,
      riskLevel,
      reasons,
      affectedTests,
    };
  }

  /**
   * Calculate file type risk
   */
  private calculateFileTypeRisk(files: string[]): number {
    const riskMap = this.config.features.codeChange.fileType.riskMap;
    let totalRisk = 0;

    for (const file of files) {
      const ext = file.split('.').pop() || '';
      const baseRisk = riskMap[ext] || 0.5;
      const isTestFile = file.includes('.spec.') || file.includes('.test.');
      const risk = isTestFile ? 0.3 : baseRisk;
      totalRisk += risk;
    }

    return files.length > 0 ? totalRisk / files.length : 0;
  }

  /**
   * Calculate path risk
   */
  private calculatePathRisk(files: string[]): number {
    const riskPaths = this.config.features.codeChange.pathPattern.riskPaths;
    let totalRisk = 0;

    for (const file of files) {
      let maxRisk = 0.5;

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
    console.log('Pattern Analyzer');
    console.log('================\n');

    const analyzer = new PatternAnalyzer();
    await analyzer.initialize();

    const patterns = await analyzer.analyzePatterns();

    console.log('\n=== Failure Patterns ===');
    patterns.failurePatterns.slice(0, 5).forEach(p => {
      console.log(`- [${p.impact.toUpperCase()}] ${p.description}`);
      console.log(`  Confidence: ${(p.confidence * 100).toFixed(1)}%\n`);
    });

    console.log('\n=== Code Change Patterns ===');
    patterns.codeChangePatterns.slice(0, 5).forEach(p => {
      console.log(`- [${p.impact.toUpperCase()}] ${p.description}`);
      console.log(`  Confidence: ${(p.confidence * 100).toFixed(1)}%\n`);
    });

    console.log('\n=== Correlation Patterns ===');
    patterns.correlationPatterns.slice(0, 5).forEach(p => {
      console.log(`- [${p.impact.toUpperCase()}] ${p.description}`);
      console.log(`  Confidence: ${(p.confidence * 100).toFixed(1)}%\n`);
    });

    console.log('\n=== Temporal Patterns ===');
    patterns.temporalPatterns.slice(0, 5).forEach(p => {
      console.log(`- [${p.impact.toUpperCase()}] ${p.description}`);
      console.log(`  Confidence: ${(p.confidence * 100).toFixed(1)}%\n`);
    });

    await analyzer.close();
  })();
}
