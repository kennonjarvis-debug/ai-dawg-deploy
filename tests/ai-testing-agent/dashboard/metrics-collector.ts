import fs from 'fs/promises';
import path from 'path';

/**
 * Metrics collection and aggregation for test analytics
 *
 * Tracks:
 * - Test execution history
 * - Pass/fail rates over time
 * - Performance trends
 * - Cost tracking
 * - Failure patterns
 */

interface TestUpdate {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  timestamp: string;
  error?: string;
  priority?: string;
  component?: string;
  cost?: number;
}

interface TestCompletion {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  timestamp: string;
  cost?: number;
}

interface MetricsData {
  testHistory: TestUpdate[];
  completionHistory: TestCompletion[];
  lastUpdated: string;
}

export class TestMetricsCollector {
  private metricsPath: string;
  private data: MetricsData;
  private maxHistorySize: number = 1000;

  constructor() {
    this.metricsPath = path.join(__dirname, 'metrics-data.json');
    this.data = {
      testHistory: [],
      completionHistory: [],
      lastUpdated: new Date().toISOString(),
    };
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const content = await fs.readFile(this.metricsPath, 'utf-8');
      this.data = JSON.parse(content);
    } catch (error) {
      // File doesn't exist yet, use empty data
      await this.saveData();
    }
  }

  private async saveData(): Promise<void> {
    this.data.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.metricsPath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Record a test update
   */
  public async recordTestUpdate(update: TestUpdate): Promise<void> {
    this.data.testHistory.push({
      ...update,
      timestamp: update.timestamp || new Date().toISOString(),
    });

    // Trim history if it gets too large
    if (this.data.testHistory.length > this.maxHistorySize) {
      this.data.testHistory = this.data.testHistory.slice(-this.maxHistorySize);
    }

    await this.saveData();
  }

  /**
   * Record a test run completion
   */
  public async recordTestCompletion(completion: TestCompletion): Promise<void> {
    this.data.completionHistory.push({
      ...completion,
      timestamp: completion.timestamp || new Date().toISOString(),
    });

    // Keep last 100 completion records
    if (this.data.completionHistory.length > 100) {
      this.data.completionHistory = this.data.completionHistory.slice(-100);
    }

    await this.saveData();
  }

  /**
   * Get current status summary
   */
  public async getCurrentStatus(): Promise<any> {
    const last24h = this.getTestsInTimeRange(24 * 60 * 60 * 1000);

    const totalTests = last24h.length;
    const passed = last24h.filter(t => t.status === 'passed').length;
    const failed = last24h.filter(t => t.status === 'failed').length;
    const skipped = last24h.filter(t => t.status === 'skipped').length;

    const avgDuration = totalTests > 0
      ? last24h.reduce((sum, t) => sum + t.duration, 0) / totalTests
      : 0;

    // Calculate pass rate change
    const last48hTo24h = this.getTestsInTimeRange(
      48 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000
    );
    const previousPassRate = last48hTo24h.length > 0
      ? (last48hTo24h.filter(t => t.status === 'passed').length / last48hTo24h.length) * 100
      : 0;
    const currentPassRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const passRateChange = currentPassRate - previousPassRate;

    return {
      totalTests,
      passed,
      failed,
      skipped,
      avgDuration,
      passRate: currentPassRate,
      passRateChange,
      lastUpdated: this.data.lastUpdated,
    };
  }

  /**
   * Get test history with optional limit
   */
  public async getHistory(limit: number = 100): Promise<TestUpdate[]> {
    return this.data.testHistory.slice(-limit).reverse();
  }

  /**
   * Get trends data
   */
  public async getTrends(): Promise<any> {
    // Pass rate history (hourly for last 24 hours)
    const passRateHistory: Array<{ timestamp: string; rate: number }> = [];
    const now = Date.now();

    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;

      const testsInHour = this.data.testHistory.filter(t => {
        const timestamp = new Date(t.timestamp).getTime();
        return timestamp >= hourStart && timestamp < hourEnd;
      });

      const rate = testsInHour.length > 0
        ? (testsInHour.filter(t => t.status === 'passed').length / testsInHour.length) * 100
        : 0;

      passRateHistory.push({
        timestamp: new Date(hourEnd).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        rate,
      });
    }

    // Calculate current vs previous pass rate
    const last24h = this.getTestsInTimeRange(24 * 60 * 60 * 1000);
    const last48hTo24h = this.getTestsInTimeRange(
      48 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000
    );

    const currentPassRate = last24h.length > 0
      ? (last24h.filter(t => t.status === 'passed').length / last24h.length) * 100
      : 0;
    const previousPassRate = last48hTo24h.length > 0
      ? (last48hTo24h.filter(t => t.status === 'passed').length / last48hTo24h.length) * 100
      : 0;

    return {
      passRateHistory,
      currentPassRate,
      previousPassRate,
      passRateChange: currentPassRate - previousPassRate,
    };
  }

  /**
   * Get failure heatmap by component
   */
  public async getFailureHeatmap(): Promise<any> {
    const last7Days = this.getTestsInTimeRange(7 * 24 * 60 * 60 * 1000);
    const failures = last7Days.filter(t => t.status === 'failed');

    // Group by component
    const componentFailures: Record<string, number> = {};

    failures.forEach(test => {
      // Extract component from test name or use provided component
      const component = test.component || this.extractComponent(test.testName);

      if (!componentFailures[component]) {
        componentFailures[component] = 0;
      }
      componentFailures[component]++;
    });

    // Sort by failure count
    const sorted = Object.entries(componentFailures)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 components

    return {
      components: Object.fromEntries(sorted),
      totalFailures: failures.length,
    };
  }

  /**
   * Get cost tracking data
   */
  public async getCostTracking(): Promise<any> {
    // Daily costs for last 7 days
    const dailyCosts: Array<{ date: string; cost: number }> = [];
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;

      const testsInDay = this.data.testHistory.filter(t => {
        const timestamp = new Date(t.timestamp).getTime();
        return timestamp >= dayStart && timestamp < dayEnd;
      });

      // Sum up costs (estimate if not provided)
      const cost = testsInDay.reduce((sum, test) => {
        return sum + (test.cost || this.estimateTestCost(test));
      }, 0);

      dailyCosts.push({
        date: new Date(dayEnd).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        cost: parseFloat(cost.toFixed(4)),
      });
    }

    // Total cost
    const totalCost = dailyCosts.reduce((sum, day) => sum + day.cost, 0);

    // Average cost per test
    const testsLast7Days = this.getTestsInTimeRange(7 * 24 * 60 * 60 * 1000);
    const avgCostPerTest = testsLast7Days.length > 0 ? totalCost / testsLast7Days.length : 0;

    return {
      daily: dailyCosts,
      totalCost: parseFloat(totalCost.toFixed(4)),
      avgCostPerTest: parseFloat(avgCostPerTest.toFixed(6)),
    };
  }

  /**
   * Get tests within a time range
   */
  private getTestsInTimeRange(
    rangeMs: number,
    offsetMs: number = 0
  ): TestUpdate[] {
    const now = Date.now();
    const rangeStart = now - rangeMs - offsetMs;
    const rangeEnd = now - offsetMs;

    return this.data.testHistory.filter(test => {
      const timestamp = new Date(test.timestamp).getTime();
      return timestamp >= rangeStart && timestamp < rangeEnd;
    });
  }

  /**
   * Extract component name from test name
   */
  private extractComponent(testName: string): string {
    // Try to extract component from test name patterns
    const patterns = [
      /^(\w+)-/,                    // prefix-test-name
      /^test-(\w+)/,                // test-component
      /\[(\w+)\]/,                  // [component] test
      /(\w+)\s+integration/i,       // component integration
      /(\w+)\s+e2e/i,              // component e2e
    ];

    for (const pattern of patterns) {
      const match = testName.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    // Default to "uncategorized"
    return 'uncategorized';
  }

  /**
   * Estimate test cost based on test type and duration
   */
  private estimateTestCost(test: TestUpdate): number {
    // Base cost estimates (in USD)
    const costPerSecond = {
      e2e: 0.0001,      // Higher cost for E2E (screenshots, etc.)
      integration: 0.00005,
      unit: 0.00001,
      performance: 0.00008,
      quality: 0.0002,  // Uses GPT-4, higher cost
    };

    // Determine test type from name
    let type = 'unit';
    if (test.testName.includes('e2e')) type = 'e2e';
    else if (test.testName.includes('integration')) type = 'integration';
    else if (test.testName.includes('performance')) type = 'performance';
    else if (test.testName.includes('quality')) type = 'quality';

    const seconds = test.duration / 1000;
    const baseCost = costPerSecond[type] * seconds;

    // Add GPT cost if it's a quality test or AI-related test
    if (type === 'quality' || test.testName.includes('ai-')) {
      // Assume ~1000 tokens at $0.01/1K tokens for GPT-4
      return baseCost + 0.01;
    }

    return baseCost;
  }

  /**
   * Get insights and recommendations
   */
  public async getInsights(): Promise<any> {
    const last24h = this.getTestsInTimeRange(24 * 60 * 60 * 1000);
    const heatmap = await this.getFailureHeatmap();

    const insights = [];
    const recommendations = [];

    // Check for frequent failures
    if (heatmap.components) {
      const topFailure = Object.entries(heatmap.components)[0];
      if (topFailure && topFailure[1] > 5) {
        insights.push(`Component "${topFailure[0]}" has failed ${topFailure[1]} times in the last 7 days`);
        recommendations.push(`Investigate and fix issues in ${topFailure[0]} component`);
      }
    }

    // Check for slow tests
    const slowTests = last24h
      .filter(t => t.duration > 60000) // > 1 minute
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3);

    if (slowTests.length > 0) {
      insights.push(`${slowTests.length} tests are taking over 1 minute to execute`);
      recommendations.push('Optimize slow tests to improve execution time');
    }

    // Check for cost trends
    const costs = await this.getCostTracking();
    if (costs.totalCost > 1.0) {
      insights.push(`Test costs are $${costs.totalCost.toFixed(2)} for the last 7 days`);
      recommendations.push('Consider optimizing API usage to reduce costs');
    }

    return {
      insights,
      recommendations,
    };
  }

  /**
   * Export metrics data for analysis
   */
  public async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.data, null, 2);
    }

    // CSV export
    const headers = ['Timestamp', 'Test Name', 'Status', 'Duration (ms)', 'Component', 'Error'];
    const rows = this.data.testHistory.map(test => [
      test.timestamp,
      test.testName,
      test.status,
      test.duration.toString(),
      test.component || this.extractComponent(test.testName),
      test.error || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * Clear old data (cleanup)
   */
  public async cleanup(retentionDays: number = 30): Promise<void> {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    this.data.testHistory = this.data.testHistory.filter(test => {
      return new Date(test.timestamp).getTime() >= cutoffTime;
    });

    this.data.completionHistory = this.data.completionHistory.filter(completion => {
      return new Date(completion.timestamp).getTime() >= cutoffTime;
    });

    await this.saveData();
    console.log(`Cleaned up data older than ${retentionDays} days`);
  }
}
