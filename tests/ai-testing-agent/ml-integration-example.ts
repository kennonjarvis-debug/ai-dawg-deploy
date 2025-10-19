/**
 * ML-Enhanced DAWG Testing Agent
 *
 * This example shows how to integrate the ML Predictive QA Engine
 * with the existing DAWG AI Testing Agent.
 */

import { DAWGTestingAgent } from './agent';
import { PredictiveQAEngine } from './ml-engine/predictive-qa';

/**
 * Enhanced DAWG Testing Agent with ML predictions
 */
export class MLEnhancedTestingAgent extends DAWGTestingAgent {
  private mlEngine: PredictiveQAEngine;

  constructor() {
    super();
    this.mlEngine = new PredictiveQAEngine();
  }

  /**
   * Initialize both the agent and ML engine
   */
  async initialize() {
    await super.initialize();
    await this.mlEngine.initialize();
    console.log('ML Predictive QA Engine enabled');
  }

  /**
   * Enhanced run with ML-powered test prioritization
   */
  async run() {
    const startTime = Date.now();

    console.log('\n🚀 Starting ML-enhanced test execution...\n');

    // Step 1: Analyze codebase
    console.log('📊 Step 1: Analyzing codebase...');
    const codebaseAnalysis = await this.analyzeCodebase();

    // Step 2: Generate test plan
    console.log('📋 Step 2: Generating test plan...');
    const testPlan = await this.generateTestPlan(codebaseAnalysis);

    // Step 3: ML-based risk assessment
    console.log('🤖 Step 3: ML risk assessment...');
    await this.performMLRiskAssessment(testPlan);

    // Step 4: Execute tests with ML prioritization
    console.log('🧪 Step 4: Executing tests with ML prioritization...');
    await this.executeTestsWithML(testPlan);

    // Step 5: Analyze results
    console.log('🔍 Step 5: Analyzing results...');
    const analysis = await this.analyzeResults();

    // Step 6: Generate report with ML insights
    console.log('📝 Step 6: Generating enhanced report...');
    const report = await this.generateEnhancedReport(analysis, Date.now() - startTime);

    console.log('\n✅ ML-enhanced testing complete!\n');

    return report;
  }

  /**
   * Perform ML-based risk assessment on test plan
   */
  private async performMLRiskAssessment(testPlan: any[]) {
    console.log('\n  Assessing test risks with ML...');

    for (const test of testPlan) {
      try {
        // Get ML prediction for this test
        const prediction = await this.mlEngine.predict(test.name);

        // Add ML metadata to test
        test.mlPrediction = {
          riskScore: prediction.riskScore,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          reasons: prediction.reasons,
        };

        // Adjust priority based on ML prediction
        const mlPriorityWeight = 0.4; // 40% weight to ML, 60% to original priority
        const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
        const originalPriority = priorityMap[test.priority] || 2;
        const mlPriority = prediction.riskScore * 4;

        test.adjustedPriority = (originalPriority * 0.6) + (mlPriority * mlPriorityWeight);

        console.log(
          `  ${test.name}: ` +
          `ML Risk=${(prediction.riskScore * 100).toFixed(1)}% (${prediction.riskLevel}), ` +
          `Confidence=${(prediction.confidence * 100).toFixed(1)}%`
        );
      } catch (error) {
        console.warn(`  Failed to get ML prediction for ${test.name}`);
      }
    }
  }

  /**
   * Execute tests with ML-based prioritization
   */
  private async executeTestsWithML(testPlan: any[]) {
    // Sort tests by adjusted ML priority
    const sortedTests = testPlan.sort((a, b) => {
      const aPriority = a.adjustedPriority || 0;
      const bPriority = b.adjustedPriority || 0;
      return bPriority - aPriority;
    });

    console.log('\n  Test execution order (ML-optimized):');
    sortedTests.forEach((test, i) => {
      const risk = test.mlPrediction?.riskLevel || 'unknown';
      console.log(`    ${i + 1}. ${test.name} [${risk.toUpperCase()}]`);
    });

    // Execute tests
    for (const test of sortedTests) {
      console.log(`\n  🧪 Running: ${test.name}`);

      const startTime = Date.now();
      const result = await this.executeTestScenario(test);
      const duration = Date.now() - startTime;

      // Record result for ML learning
      if (test.mlPrediction) {
        await this.mlEngine.recordActualResult(
          test.name,
          result.status === 'passed' ? 'passed' : 'failed',
          duration,
          {
            testName: test.name,
            riskScore: test.mlPrediction.riskScore,
            riskLevel: test.mlPrediction.riskLevel,
            confidence: test.mlPrediction.confidence,
            reasons: test.mlPrediction.reasons,
            features: {},
            priority: test.adjustedPriority,
          }
        );
      }

      this.results.push(result);

      const icon = result.status === 'passed' ? '✅' : '❌';
      const mlIcon = test.mlPrediction ? '🤖' : '';
      console.log(`  ${icon} ${mlIcon} ${result.status.toUpperCase()} (${result.duration}ms)`);

      // Show ML prediction accuracy
      if (test.mlPrediction) {
        const predicted = test.mlPrediction.riskScore >= 0.5 ? 'fail' : 'pass';
        const actual = result.status === 'failed' ? 'fail' : 'pass';
        const correct = predicted === actual;
        console.log(`  ML Prediction: ${correct ? 'CORRECT' : 'INCORRECT'} (predicted ${predicted}, actual ${actual})`);
      }

      // Break on critical failure
      if (result.status === 'failed' && test.priority === 'critical') {
        console.log('  ⚠️  Critical test failed, aborting...');
        break;
      }
    }
  }

  /**
   * Generate enhanced report with ML insights
   */
  private async generateEnhancedReport(analysis: any, duration: number) {
    // Get base report
    const report = await this.generateReport(analysis, duration);

    // Add ML statistics
    const mlStats = this.mlEngine.getModelStats();

    // Analyze prediction accuracy
    const predictedTests = this.results.filter(r => (r as any).mlPrediction);
    let correctPredictions = 0;

    for (const result of predictedTests) {
      const prediction = (result as any).mlPrediction;
      const predicted = prediction.riskScore >= 0.5 ? 'failed' : 'passed';
      const actual = result.status;

      if (predicted === actual) {
        correctPredictions++;
      }
    }

    const predictionAccuracy = predictedTests.length > 0
      ? correctPredictions / predictedTests.length
      : 0;

    // Enhance report with ML insights
    (report as any).mlInsights = {
      modelStats: mlStats,
      predictionAccuracy: predictionAccuracy,
      totalPredictions: predictedTests.length,
      correctPredictions: correctPredictions,
      recommendations: [
        ...report.recommendations,
        ...(await this.generateMLRecommendations()),
      ],
    };

    return report;
  }

  /**
   * Generate ML-based recommendations
   */
  private async generateMLRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    // Get pattern analysis
    const patterns = await this.mlEngine['analyzer'].analyzePatterns();

    // Add recommendations based on patterns
    if (patterns.failurePatterns.length > 0) {
      const topPattern = patterns.failurePatterns[0];
      recommendations.push(
        `High failure rate detected in ${topPattern.testNames.join(', ')}. ` +
        `Consider investigating root cause.`
      );
    }

    if (patterns.correlationPatterns.length > 0) {
      const topCorrelation = patterns.correlationPatterns[0];
      recommendations.push(
        `Strong correlation detected between ${topCorrelation.tests.slice(0, 2).map(t => t.testName).join(' and ')}. ` +
        `Consider running these tests together.`
      );
    }

    // Check model stats
    const stats = this.mlEngine.getModelStats();
    if (stats.runsSinceLastTraining >= 8) {
      recommendations.push(
        'ML model will retrain soon. Consider running a full test suite to improve predictions.'
      );
    }

    return recommendations;
  }

  /**
   * Assess risk of code changes
   */
  async assessCodeChanges(files: string[]) {
    console.log('\n🤖 Assessing code change risk with ML...\n');

    const risk = await this.mlEngine.assessCodeChangeRisk(files);

    console.log(`Risk Level: ${risk.riskLevel.toUpperCase()}`);
    console.log(`Risk Score: ${(risk.riskScore * 100).toFixed(1)}%`);

    if (risk.affectedTests.length > 0) {
      console.log(`\nAffected Tests (${risk.affectedTests.length}):`);
      risk.affectedTests.slice(0, 5).forEach(test => {
        console.log(`  - ${test}`);
      });
    }

    console.log('\nRecommendations:');
    risk.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });

    return risk;
  }

  /**
   * Close resources
   */
  async cleanup() {
    await this.mlEngine.close();
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    console.log('🤖 ML-Enhanced DAWG AI Testing Agent');
    console.log('=====================================\n');

    const agent = new MLEnhancedTestingAgent();
    await agent.initialize();

    // Example: Assess recent code changes
    try {
      await agent.assessCodeChanges([
        'src/backend/ai-brain-server.ts',
        'src/audio/ai/SmartMixAssistant.ts',
      ]);
    } catch (error) {
      console.log('No code changes to assess');
    }

    console.log('\n');

    // Run ML-enhanced test suite
    const report = await agent.run();

    // Show ML insights
    if ((report as any).mlInsights) {
      const insights = (report as any).mlInsights;
      console.log('\n📊 ML Insights:');
      console.log(`  Model Status: ${insights.modelStats.status}`);
      console.log(`  Model Accuracy: ${(insights.modelStats.accuracy * 100).toFixed(1)}%`);
      console.log(`  Prediction Accuracy: ${(insights.predictionAccuracy * 100).toFixed(1)}%`);
      console.log(`  Correct Predictions: ${insights.correctPredictions}/${insights.totalPredictions}`);
    }

    await agent.cleanup();

    // Exit with appropriate code
    if (report.failed > 0) {
      console.error(`\n❌ ${report.failed} tests failed`);
      process.exit(1);
    } else {
      console.log(`\n✅ All tests passed!`);
      process.exit(0);
    }
  })();
}
