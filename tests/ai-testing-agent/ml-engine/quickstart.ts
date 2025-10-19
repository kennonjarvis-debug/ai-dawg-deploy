#!/usr/bin/env node

/**
 * ML Predictive QA Engine - Quick Start
 *
 * This script sets up and demonstrates the ML engine
 */

import { PredictiveQAEngine } from './predictive-qa';
import { TrainingDataCollector } from './training-data-collector';
import { PatternAnalyzer } from './pattern-analyzer';
import fs from 'fs/promises';
import path from 'path';

async function quickStart() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ML-Powered Predictive QA Engine - Quick Start           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check for existing data
    console.log('Step 1: Checking for existing training data...');
    const dbPath = path.join(process.cwd(), 'tests/ml-data/training.db');

    let hasData = false;
    try {
      await fs.access(dbPath);
      hasData = true;
      console.log('✓ Found existing training database\n');
    } catch {
      console.log('✗ No training database found. Will create one.\n');
    }

    // Step 2: Initialize and collect data
    console.log('Step 2: Initializing training data collector...');
    const collector = new TrainingDataCollector();
    await collector.initialize();
    console.log('✓ Data collector initialized\n');

    console.log('Step 3: Collecting training data...');

    // Collect test results
    console.log('  - Collecting test results from reports...');
    await collector.collectTestResults();

    // Collect code changes
    console.log('  - Collecting code changes from git history...');
    await collector.collectCodeChanges(50);

    // Build training dataset
    console.log('  - Building training dataset...');
    const dataset = await collector.buildTrainingDataset();
    console.log(`✓ Collected ${dataset.length} training examples\n`);

    // Show statistics
    const stats = await collector.getStatistics();
    console.log('Dataset Statistics:');
    console.log(`  • Test Results: ${stats.testResults}`);
    console.log(`  • Code Changes: ${stats.codeChanges}`);
    console.log(`  • Training Examples: ${stats.trainingExamples}`);
    console.log(`  • Overall Failure Rate: ${(stats.overallFailureRate * 100).toFixed(1)}%\n`);

    if (stats.topFailingTests.length > 0) {
      console.log('  Top Failing Tests:');
      stats.topFailingTests.slice(0, 3).forEach((test: any) => {
        console.log(`    - ${test.testName}: ${test.failures} failures`);
      });
      console.log('');
    }

    await collector.close();

    // Step 3: Analyze patterns
    console.log('Step 4: Analyzing patterns...');
    const analyzer = new PatternAnalyzer();
    await analyzer.initialize();

    const patterns = await analyzer.analyzePatterns();
    console.log(`✓ Identified ${patterns.failurePatterns.length} failure patterns`);
    console.log(`✓ Identified ${patterns.codeChangePatterns.length} code change patterns`);
    console.log(`✓ Identified ${patterns.correlationPatterns.length} correlation patterns\n`);

    if (patterns.failurePatterns.length > 0) {
      console.log('  Top Failure Pattern:');
      const top = patterns.failurePatterns[0];
      console.log(`    ${top.description}`);
      console.log(`    Impact: ${top.impact.toUpperCase()}, Confidence: ${(top.confidence * 100).toFixed(1)}%\n`);
    }

    await analyzer.close();

    // Step 4: Train ML model
    console.log('Step 5: Training ML model...');
    const engine = new PredictiveQAEngine();
    await engine.initialize();

    if (dataset.length >= 20) {
      await engine.trainModel();
      console.log('✓ Model trained successfully\n');

      // Show model stats
      const modelStats = engine.getModelStats();
      console.log('Model Performance:');
      console.log(`  • Accuracy: ${(modelStats.accuracy * 100).toFixed(1)}%`);
      console.log(`  • Precision: ${(modelStats.precision * 100).toFixed(1)}%`);
      console.log(`  • Recall: ${(modelStats.recall * 100).toFixed(1)}%`);
      console.log(`  • F1 Score: ${(modelStats.f1Score * 100).toFixed(1)}%\n`);
    } else {
      console.log(`⚠ Insufficient training data (${dataset.length}/20 required)`);
      console.log('  Run more tests to collect data, then train the model.\n');
    }

    // Step 5: Demo predictions
    console.log('Step 6: Testing predictions...');

    // Get a test name to predict on
    if (dataset.length > 0) {
      const testNames = [...new Set(dataset.map(d => d.testName))];
      const sampleTest = testNames[0];

      try {
        const prediction = await engine.predict(sampleTest);

        console.log(`\n  Example Prediction for "${sampleTest}":`);
        console.log(`    Risk Score: ${(prediction.riskScore * 100).toFixed(1)}%`);
        console.log(`    Risk Level: ${prediction.riskLevel.toUpperCase()}`);
        console.log(`    Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);

        if (prediction.reasons.length > 0) {
          console.log('    Top Contributing Factors:');
          prediction.reasons.forEach(reason => {
            console.log(`      • ${reason}`);
          });
        }
        console.log('');
      } catch (error) {
        console.log('  Could not generate prediction (model may need more data)\n');
      }
    }

    // Step 6: Demo test plan generation
    if (dataset.length >= 20) {
      console.log('Step 7: Generating optimized test plan...');

      const testNames = [...new Set(dataset.map(d => d.testName))].slice(0, 10);
      const plan = await engine.generateTestPlan(testNames, 15); // 15 min limit

      console.log(`\n  Test Plan (15 minute time limit):`);
      console.log(`    Total Tests: ${plan.orderedTests.length}`);
      console.log(`    Tests to Run: ${plan.testsToRun.length}`);
      console.log(`    Tests to Skip: ${plan.testsToSkip.length}`);
      console.log(`    Estimated Time: ${(plan.totalEstimatedTime / 1000 / 60).toFixed(1)} minutes\n`);

      console.log('  Execution Order:');
      plan.orderedTests.slice(0, 5).forEach((test, i) => {
        const status = plan.testsToRun.includes(test.testName) ? 'RUN' : 'SKIP';
        console.log(
          `    ${i + 1}. [${status}] ${test.testName} - Risk: ${(test.riskScore * 100).toFixed(1)}%`
        );
      });
      console.log('');
    }

    await engine.close();

    // Step 7: Next steps
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Setup Complete! Next Steps:                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('1. Use the ML engine in your tests:');
    console.log('   const engine = new PredictiveQAEngine();');
    console.log('   await engine.initialize();');
    console.log('   const prediction = await engine.predict("test-name");\n');

    console.log('2. Generate optimized test plans:');
    console.log('   const plan = await engine.generateTestPlan(testNames, 20);\n');

    console.log('3. Assess code change risks:');
    console.log('   const risk = await engine.assessCodeChangeRisk(files);\n');

    console.log('4. Enable continuous learning:');
    console.log('   await engine.recordActualResult(testName, result, duration);\n');

    console.log('5. Run examples:');
    console.log('   npx tsx tests/ai-testing-agent/ml-engine/example-usage.ts\n');

    console.log('6. Integrate with DAWG agent:');
    console.log('   npx tsx tests/ai-testing-agent/ml-integration-example.ts\n');

    console.log('Documentation:');
    console.log('  See tests/ai-testing-agent/ml-engine/README.md for full docs\n');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  quickStart();
}

export { quickStart };
