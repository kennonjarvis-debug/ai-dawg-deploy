/**
 * Example Usage of ML-Powered Predictive QA Engine
 *
 * This file demonstrates how to use the Predictive QA Engine
 * in your test workflows.
 */

import { PredictiveQAEngine } from './predictive-qa';
import { TrainingDataCollector } from './training-data-collector';
import { PatternAnalyzer } from './pattern-analyzer';

/**
 * Example 1: Train the model on historical data
 */
async function example1_TrainModel() {
  console.log('=== Example 1: Train Model ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // The engine will automatically train if no model exists
  // Or you can explicitly trigger training:
  await engine.trainModel();

  // Check model stats
  const stats = engine.getModelStats();
  console.log('Model Stats:', stats);

  await engine.close();
}

/**
 * Example 2: Predict test failure risk
 */
async function example2_PredictRisk() {
  console.log('\n=== Example 2: Predict Test Risk ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // Predict risk for a specific test
  const prediction = await engine.predict('authentication-test');

  console.log('Prediction for authentication-test:');
  console.log(`  Risk Score: ${(prediction.riskScore * 100).toFixed(1)}%`);
  console.log(`  Risk Level: ${prediction.riskLevel}`);
  console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
  console.log('  Top Contributing Factors:');
  prediction.reasons.forEach(reason => console.log(`    - ${reason}`));

  await engine.close();
}

/**
 * Example 3: Generate optimized test plan
 */
async function example3_GenerateTestPlan() {
  console.log('\n=== Example 3: Generate Test Plan ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // List of all available tests
  const allTests = [
    'authentication-test',
    'chat-flow-test',
    'generation-flow-test',
    'ai-mastering-test',
    'vocal-processor-test',
    'landing-page-test',
    'projects-test',
    'audio-system-test',
  ];

  // Generate optimized test plan with 20-minute time limit
  const plan = await engine.generateTestPlan(allTests, 20);

  console.log('Optimized Test Plan:');
  console.log(`  Total Tests: ${plan.orderedTests.length}`);
  console.log(`  Tests to Run: ${plan.testsToRun.length}`);
  console.log(`  Tests to Skip: ${plan.testsToSkip.length}`);
  console.log(`  Estimated Time: ${(plan.totalEstimatedTime / 1000 / 60).toFixed(1)} minutes\n`);

  console.log('Test Execution Order:');
  plan.orderedTests.slice(0, 10).forEach((test, i) => {
    console.log(
      `  ${i + 1}. ${test.testName} - Risk: ${(test.riskScore * 100).toFixed(1)}% - Duration: ${(test.estimatedDuration / 1000).toFixed(1)}s`
    );
  });

  console.log('\nReasoning:');
  plan.reasoning.forEach(reason => console.log(`  - ${reason}`));

  await engine.close();
}

/**
 * Example 4: Assess code change risk
 */
async function example4_AssessCodeChange() {
  console.log('\n=== Example 4: Assess Code Change Risk ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // Simulate a code change
  const changedFiles = [
    'src/backend/ai-brain-server.ts',
    'src/backend/services/udio-service.ts',
    'src/audio/ai/AIMasteringEngine.ts',
  ];

  const risk = await engine.assessCodeChangeRisk(changedFiles);

  console.log('Code Change Risk Assessment:');
  console.log(`  Risk Level: ${risk.riskLevel.toUpperCase()}`);
  console.log(`  Risk Score: ${(risk.riskScore * 100).toFixed(1)}%`);
  console.log(`  Affected Tests: ${risk.affectedTests.length}`);

  if (risk.affectedTests.length > 0) {
    console.log('\n  Tests that may be affected:');
    risk.affectedTests.slice(0, 5).forEach(test => console.log(`    - ${test}`));
  }

  console.log('\n  Recommendations:');
  risk.recommendations.forEach(rec => console.log(`    - ${rec}`));

  await engine.close();
}

/**
 * Example 5: Continuous learning workflow
 */
async function example5_ContinuousLearning() {
  console.log('\n=== Example 5: Continuous Learning ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // Simulate a test run with predictions
  const testName = 'chat-flow-test';

  // Get prediction before running test
  const prediction = await engine.predict(testName);
  console.log(`Predicted risk for ${testName}: ${(prediction.riskScore * 100).toFixed(1)}%`);

  // Simulate running the test (in real usage, you'd actually run it)
  const actualResult = Math.random() > 0.5 ? 'passed' : 'failed';
  const duration = 3500; // ms

  console.log(`Actual result: ${actualResult}`);

  // Record the actual result for continuous learning
  await engine.recordActualResult(testName, actualResult, duration, prediction);

  console.log('Result recorded for continuous learning');
  console.log(`Runs since last training: ${engine.getModelStats().runsSinceLastTraining}`);

  await engine.close();
}

/**
 * Example 6: Analyze patterns in test data
 */
async function example6_AnalyzePatterns() {
  console.log('\n=== Example 6: Analyze Patterns ===\n');

  const analyzer = new PatternAnalyzer();
  await analyzer.initialize();

  const patterns = await analyzer.analyzePatterns();

  console.log('Failure Patterns:');
  patterns.failurePatterns.slice(0, 3).forEach(p => {
    console.log(`  - [${p.impact.toUpperCase()}] ${p.description}`);
    console.log(`    Confidence: ${(p.confidence * 100).toFixed(1)}%`);
  });

  console.log('\nCode Change Patterns:');
  patterns.codeChangePatterns.slice(0, 3).forEach(p => {
    console.log(`  - [${p.impact.toUpperCase()}] ${p.description}`);
    console.log(`    Confidence: ${(p.confidence * 100).toFixed(1)}%`);
  });

  console.log('\nCorrelation Patterns:');
  patterns.correlationPatterns.slice(0, 3).forEach(p => {
    console.log(`  - [${p.impact.toUpperCase()}] ${p.description}`);
    console.log(`    Confidence: ${(p.confidence * 100).toFixed(1)}%`);
  });

  await analyzer.close();
}

/**
 * Example 7: Collect training data
 */
async function example7_CollectData() {
  console.log('\n=== Example 7: Collect Training Data ===\n');

  const collector = new TrainingDataCollector();
  await collector.initialize();

  // Collect test results from reports
  await collector.collectTestResults();

  // Collect code changes from git
  await collector.collectCodeChanges(50);

  // Build training dataset
  const dataset = await collector.buildTrainingDataset();

  console.log(`Collected ${dataset.length} training examples`);

  // Get statistics
  const stats = await collector.getStatistics();
  console.log('\nDataset Statistics:');
  console.log(`  Test Results: ${stats.testResults}`);
  console.log(`  Code Changes: ${stats.codeChanges}`);
  console.log(`  Training Examples: ${stats.trainingExamples}`);
  console.log(`  Overall Failure Rate: ${(stats.overallFailureRate * 100).toFixed(1)}%`);

  console.log('\n  Top Failing Tests:');
  stats.topFailingTests.slice(0, 5).forEach((test: any) => {
    console.log(`    - ${test.testName}: ${test.failures} failures`);
  });

  await collector.close();
}

/**
 * Example 8: Integration with test runner
 */
async function example8_IntegrateWithTestRunner() {
  console.log('\n=== Example 8: Integrate with Test Runner ===\n');

  const engine = new PredictiveQAEngine();
  await engine.initialize();

  // Get all tests
  const allTests = [
    'authentication-test',
    'chat-flow-test',
    'generation-flow-test',
    'ai-mastering-test',
    'vocal-processor-test',
  ];

  // Generate optimized test plan
  const plan = await engine.generateTestPlan(allTests, 10);

  console.log('Running optimized test suite...\n');

  // Simulate running tests in priority order
  for (const testName of plan.testsToRun) {
    // Get prediction
    const prediction = await engine.predict(testName);

    console.log(`Running ${testName}...`);
    console.log(`  Predicted risk: ${(prediction.riskScore * 100).toFixed(1)}%`);

    // Simulate test execution
    const result = Math.random() > prediction.riskScore ? 'passed' : 'failed';
    const duration = 2000 + Math.random() * 3000;

    console.log(`  Result: ${result} (${(duration / 1000).toFixed(1)}s)`);

    // Record result for learning
    await engine.recordActualResult(testName, result, duration, prediction);
  }

  console.log(`\nSkipped ${plan.testsToSkip.length} low-risk tests`);

  await engine.close();
}

// Run all examples
async function runAllExamples() {
  console.log('ML-Powered Predictive QA Engine - Examples');
  console.log('==========================================\n');

  try {
    await example1_TrainModel();
    await example2_PredictRisk();
    await example3_GenerateTestPlan();
    await example4_AssessCodeChange();
    await example5_ContinuousLearning();
    await example6_AnalyzePatterns();
    await example7_CollectData();
    await example8_IntegrateWithTestRunner();

    console.log('\n=== All Examples Completed ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_TrainModel,
  example2_PredictRisk,
  example3_GenerateTestPlan,
  example4_AssessCodeChange,
  example5_ContinuousLearning,
  example6_AnalyzePatterns,
  example7_CollectData,
  example8_IntegrateWithTestRunner,
};
