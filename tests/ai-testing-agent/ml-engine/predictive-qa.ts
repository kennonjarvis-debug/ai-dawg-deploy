import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { TrainingDataCollector } from './training-data-collector';
import { PatternAnalyzer } from './pattern-analyzer';

interface FeatureVector {
  [key: string]: number;
}

interface TrainingExample {
  testName: string;
  features: FeatureVector;
  label: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface MLModel {
  weights: number[];
  bias: number;
  featureNames: string[];
  trainedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface Prediction {
  testName: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  reasons: string[];
  features: FeatureVector;
  priority: number;
}

interface TestPlan {
  orderedTests: Array<{
    testName: string;
    priority: number;
    riskScore: number;
    estimatedDuration: number;
  }>;
  testsToRun: string[];
  testsToSkip: string[];
  totalEstimatedTime: number;
  reasoning: string[];
}

/**
 * Predictive QA Engine
 *
 * ML-powered engine that:
 * 1. Trains on historical test data
 * 2. Predicts test failure probability
 * 3. Assigns risk scores to code changes
 * 4. Prioritizes test execution
 * 5. Continuously learns from results
 */
export class PredictiveQAEngine {
  private db: sqlite3.Database;
  private config: any;
  private dbPath: string;
  private model: MLModel | null = null;
  private collector: TrainingDataCollector;
  private analyzer: PatternAnalyzer;
  private runsSinceLastTraining = 0;

  constructor(configPath?: string) {
    const configFile = configPath || path.join(__dirname, 'ml-config.json');
    this.config = require(configFile);
    this.dbPath = path.join(process.cwd(), this.config.storage.databasePath);
    this.collector = new TrainingDataCollector(configFile);
    this.analyzer = new PatternAnalyzer(configFile);
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    console.log('Initializing Predictive QA Engine...');

    // Initialize components
    await this.collector.initialize();
    await this.analyzer.initialize();

    this.db = new sqlite3.Database(this.dbPath);

    // Try to load existing model
    await this.loadModel();

    // If no model exists, train one
    if (!this.model) {
      console.log('No trained model found. Training new model...');
      await this.trainModel();
    }

    console.log('Predictive QA Engine initialized');
  }

  /**
   * Train the ML model
   */
  async trainModel(): Promise<void> {
    console.log('Training ML model...');

    // Collect latest data
    await this.collector.collectTestResults();
    await this.collector.collectCodeChanges();

    // Build training dataset
    const trainingData = await this.collector.buildTrainingDataset();

    if (trainingData.length < this.config.training.minSamplesForTraining) {
      console.warn(
        `Insufficient training data: ${trainingData.length} samples (minimum: ${this.config.training.minSamplesForTraining})`
      );
      return;
    }

    console.log(`Training on ${trainingData.length} examples`);

    // Split into training and validation sets
    const splitIndex = Math.floor(trainingData.length * (1 - this.config.training.validationSplit));
    const trainSet = trainingData.slice(0, splitIndex);
    const valSet = trainingData.slice(splitIndex);

    // Extract feature names
    const featureNames = Object.keys(trainingData[0].features);

    // Initialize weights
    let weights = new Array(featureNames.length).fill(0);
    let bias = 0;

    // Gradient descent training
    const learningRate = this.config.model.learningRate;
    const iterations = this.config.model.iterations;
    const lambda = this.config.model.regularization.lambda;

    for (let iter = 0; iter < iterations; iter++) {
      let totalLoss = 0;

      // Shuffle training data
      const shuffled = [...trainSet].sort(() => Math.random() - 0.5);

      for (const example of shuffled) {
        // Convert features to array
        const x = featureNames.map(name => example.features[name] || 0);
        const y = example.label;

        // Forward pass (logistic regression)
        const z = this.dotProduct(weights, x) + bias;
        const prediction = this.sigmoid(z);

        // Calculate loss
        const loss = -y * Math.log(prediction + 1e-10) - (1 - y) * Math.log(1 - prediction + 1e-10);
        totalLoss += loss;

        // Backward pass
        const error = prediction - y;

        // Update weights
        for (let i = 0; i < weights.length; i++) {
          const gradient = error * x[i];
          const regularization = this.config.model.regularization.enabled
            ? lambda * weights[i]
            : 0;
          weights[i] -= learningRate * (gradient + regularization);
        }

        // Update bias
        bias -= learningRate * error;
      }

      // Log progress every 100 iterations
      if (iter % 100 === 0) {
        const avgLoss = totalLoss / shuffled.length;
        console.log(`  Iteration ${iter}: Loss = ${avgLoss.toFixed(4)}`);
      }
    }

    // Evaluate on validation set
    const metrics = this.evaluateModel(weights, bias, featureNames, valSet);

    // Create model
    this.model = {
      weights,
      bias,
      featureNames,
      trainedAt: new Date().toISOString(),
      ...metrics,
    };

    // Save model
    await this.saveModel();

    console.log('Model training complete:');
    console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`);
    console.log(`  Recall: ${(metrics.recall * 100).toFixed(2)}%`);
    console.log(`  F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);

    this.runsSinceLastTraining = 0;
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Dot product
   */
  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  /**
   * Evaluate model on dataset
   */
  private evaluateModel(
    weights: number[],
    bias: number,
    featureNames: string[],
    dataset: TrainingExample[]
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const example of dataset) {
      const x = featureNames.map(name => example.features[name] || 0);
      const y = example.label;

      const z = this.dotProduct(weights, x) + bias;
      const prediction = this.sigmoid(z);
      const predicted = prediction >= 0.5 ? 1 : 0;

      if (predicted === y) {
        correct++;
      }

      if (predicted === 1 && y === 1) {
        truePositives++;
      } else if (predicted === 1 && y === 0) {
        falsePositives++;
      } else if (predicted === 0 && y === 1) {
        falseNegatives++;
      }
    }

    const accuracy = correct / dataset.length;
    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    const f1Score = precision + recall > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Predict test failure risk
   */
  async predict(testName: string, features?: FeatureVector): Promise<Prediction> {
    if (!this.model) {
      throw new Error('Model not trained. Call trainModel() first.');
    }

    // Extract features if not provided
    if (!features) {
      features = await this.collector.extractFeatures(testName, new Date().toISOString());
    }

    // Convert features to array in correct order
    const x = this.model.featureNames.map(name => features![name] || 0);

    // Make prediction
    const z = this.dotProduct(this.model.weights, x) + this.model.bias;
    const probability = this.sigmoid(z);

    // Calculate confidence based on distance from decision boundary
    const confidence = Math.abs(probability - 0.5) * 2;

    // Determine risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (probability >= this.config.prediction.riskThresholds.critical) {
      riskLevel = 'critical';
    } else if (probability >= this.config.prediction.riskThresholds.high) {
      riskLevel = 'high';
    } else if (probability >= this.config.prediction.riskThresholds.medium) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Identify top contributing features
    const reasons = this.identifyTopFeatures(features, x);

    // Calculate priority (higher risk = higher priority)
    const priority = probability;

    return {
      testName,
      riskScore: probability,
      riskLevel,
      confidence,
      reasons,
      features,
      priority,
    };
  }

  /**
   * Identify top contributing features
   */
  private identifyTopFeatures(features: FeatureVector, x: number[]): string[] {
    const contributions = this.model!.featureNames.map((name, i) => ({
      name,
      value: features[name] || 0,
      weight: this.model!.weights[i],
      contribution: Math.abs(this.model!.weights[i] * x[i]),
    }));

    // Sort by contribution
    contributions.sort((a, b) => b.contribution - a.contribution);

    // Format top 3 reasons
    const reasons: string[] = [];
    for (let i = 0; i < Math.min(3, contributions.length); i++) {
      const c = contributions[i];
      if (c.contribution > 0.1) {
        reasons.push(
          `${c.name}: ${c.value.toFixed(2)} (weight: ${c.weight.toFixed(2)})`
        );
      }
    }

    return reasons;
  }

  /**
   * Generate optimized test plan
   */
  async generateTestPlan(
    testNames: string[],
    timeLimit?: number
  ): Promise<TestPlan> {
    console.log('Generating optimized test plan...');

    const predictions: Prediction[] = [];

    // Get predictions for all tests
    for (const testName of testNames) {
      try {
        const prediction = await this.predict(testName);
        predictions.push(prediction);
      } catch (error) {
        console.warn(`Failed to predict for ${testName}:`, error.message);
      }
    }

    // Sort by priority (risk score)
    predictions.sort((a, b) => b.priority - a.priority);

    // Get historical durations
    const get = promisify(this.db.get.bind(this.db));
    const orderedTests = [];
    let totalTime = 0;

    for (const pred of predictions) {
      const result = await get(
        `SELECT AVG(duration) as avg_duration
         FROM test_results
         WHERE test_name = ?`,
        [pred.testName]
      );

      const duration = result?.avg_duration || 5000; // Default 5s
      orderedTests.push({
        testName: pred.testName,
        priority: pred.priority,
        riskScore: pred.riskScore,
        estimatedDuration: duration,
      });

      totalTime += duration;
    }

    // Determine which tests to run/skip based on time limit
    const testsToRun: string[] = [];
    const testsToSkip: string[] = [];
    const reasoning: string[] = [];

    if (timeLimit) {
      let currentTime = 0;
      const timeLimitMs = timeLimit * 60 * 1000;

      for (const test of orderedTests) {
        // Always run critical tests
        if (test.riskScore >= this.config.prediction.riskThresholds.critical) {
          testsToRun.push(test.testName);
          currentTime += test.estimatedDuration;
          reasoning.push(
            `${test.testName}: CRITICAL risk (${(test.riskScore * 100).toFixed(1)}%) - must run`
          );
        }
        // Run high-risk tests if time permits
        else if (test.riskScore >= this.config.prediction.riskThresholds.high) {
          if (currentTime + test.estimatedDuration <= timeLimitMs) {
            testsToRun.push(test.testName);
            currentTime += test.estimatedDuration;
            reasoning.push(
              `${test.testName}: HIGH risk (${(test.riskScore * 100).toFixed(1)}%) - included`
            );
          } else {
            testsToSkip.push(test.testName);
            reasoning.push(
              `${test.testName}: HIGH risk but skipped due to time constraint`
            );
          }
        }
        // Skip low-risk tests
        else if (test.riskScore <= this.config.prioritization.skipThreshold) {
          testsToSkip.push(test.testName);
          reasoning.push(
            `${test.testName}: LOW risk (${(test.riskScore * 100).toFixed(1)}%) - skipped`
          );
        }
        // Run medium-risk tests if time permits
        else {
          if (currentTime + test.estimatedDuration <= timeLimitMs) {
            testsToRun.push(test.testName);
            currentTime += test.estimatedDuration;
            reasoning.push(
              `${test.testName}: MEDIUM risk (${(test.riskScore * 100).toFixed(1)}%) - included`
            );
          } else {
            testsToSkip.push(test.testName);
            reasoning.push(
              `${test.testName}: MEDIUM risk but skipped due to time constraint`
            );
          }
        }
      }
    } else {
      // No time limit - run all tests in priority order
      testsToRun.push(...orderedTests.map(t => t.testName));
      reasoning.push('No time limit - running all tests in priority order');
    }

    console.log(`Test plan generated: ${testsToRun.length} to run, ${testsToSkip.length} to skip`);

    return {
      orderedTests,
      testsToRun,
      testsToSkip,
      totalEstimatedTime: totalTime,
      reasoning,
    };
  }

  /**
   * Record actual test result for continuous learning
   */
  async recordActualResult(
    testName: string,
    result: 'passed' | 'failed',
    duration: number,
    prediction?: Prediction
  ): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Store actual result
    await this.collector.storeTestResult({
      testName,
      testPath: '',
      status: result,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Update prediction record if provided
    if (prediction) {
      await run(
        `UPDATE predictions
         SET actual_result = ?
         WHERE id = (
           SELECT id FROM predictions
           WHERE test_name = ?
           ORDER BY timestamp DESC
           LIMIT 1
         )`,
        [result, testName]
      );

      // Log prediction accuracy
      const correct = (prediction.riskScore >= 0.5 && result === 'failed') ||
                     (prediction.riskScore < 0.5 && result === 'passed');

      if (this.config.logging.logPredictions) {
        console.log(
          `Prediction for ${testName}: ${correct ? 'CORRECT' : 'INCORRECT'} ` +
          `(predicted: ${(prediction.riskScore * 100).toFixed(1)}%, actual: ${result})`
        );
      }
    }

    // Check if we need to retrain
    this.runsSinceLastTraining++;
    if (this.runsSinceLastTraining >= this.config.training.retrainThreshold) {
      console.log('Retraining threshold reached. Triggering retraining...');
      await this.trainModel();
    }
  }

  /**
   * Assess risk of code changes
   */
  async assessCodeChangeRisk(files: string[]): Promise<{
    riskScore: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    affectedTests: string[];
    recommendations: string[];
  }> {
    const analysis = await this.analyzer.detectCodeChangeRisks(files);

    const recommendations: string[] = [];

    if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
      recommendations.push('Run full test suite before deploying');
      recommendations.push('Consider manual review of changes');
    }

    if (analysis.affectedTests.length > 0) {
      recommendations.push(`Prioritize running: ${analysis.affectedTests.slice(0, 3).join(', ')}`);
    }

    if (analysis.riskLevel === 'low') {
      recommendations.push('Can skip some low-priority tests');
    }

    return {
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      affectedTests: analysis.affectedTests,
      recommendations,
    };
  }

  /**
   * Save model to disk
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;

    const modelDir = path.join(process.cwd(), this.config.storage.modelCheckpointPath);
    await fs.mkdir(modelDir, { recursive: true });

    const modelPath = path.join(modelDir, 'model-latest.json');
    await fs.writeFile(modelPath, JSON.stringify(this.model, null, 2));

    // Save checkpoint with timestamp
    if (this.config.training.saveModelCheckpoints) {
      const checkpointPath = path.join(
        modelDir,
        `model-${Date.now()}.json`
      );
      await fs.writeFile(checkpointPath, JSON.stringify(this.model, null, 2));
    }

    console.log(`Model saved to ${modelPath}`);
  }

  /**
   * Load model from disk
   */
  private async loadModel(): Promise<void> {
    try {
      const modelDir = path.join(process.cwd(), this.config.storage.modelCheckpointPath);
      const modelPath = path.join(modelDir, 'model-latest.json');

      const content = await fs.readFile(modelPath, 'utf-8');
      this.model = JSON.parse(content);

      console.log(`Model loaded from ${modelPath}`);
      console.log(`  Trained at: ${this.model.trainedAt}`);
      console.log(`  Accuracy: ${(this.model.accuracy * 100).toFixed(2)}%`);
    } catch (error) {
      // Model doesn't exist yet
      this.model = null;
    }
  }

  /**
   * Get model statistics
   */
  getModelStats(): any {
    if (!this.model) {
      return { status: 'not trained' };
    }

    return {
      status: 'trained',
      trainedAt: this.model.trainedAt,
      accuracy: this.model.accuracy,
      precision: this.model.precision,
      recall: this.model.recall,
      f1Score: this.model.f1Score,
      features: this.model.featureNames.length,
      runsSinceLastTraining: this.runsSinceLastTraining,
    };
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.collector.close();
    await this.analyzer.close();

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
    console.log('Predictive QA Engine');
    console.log('====================\n');

    const engine = new PredictiveQAEngine();
    await engine.initialize();

    // Train model
    await engine.trainModel();

    // Example: Generate test plan
    const testNames = [
      'authentication-test',
      'chat-flow-test',
      'ai-mastering-test',
      'vocal-processor-test',
    ];

    console.log('\nGenerating test plan...');
    const plan = await engine.generateTestPlan(testNames, 15); // 15 minute limit

    console.log('\nTest Plan:');
    console.log(`Total tests: ${plan.orderedTests.length}`);
    console.log(`To run: ${plan.testsToRun.length}`);
    console.log(`To skip: ${plan.testsToSkip.length}`);
    console.log(`Estimated time: ${(plan.totalEstimatedTime / 1000).toFixed(1)}s\n`);

    plan.reasoning.forEach(r => console.log(`  - ${r}`));

    // Example: Assess code change risk
    console.log('\nAssessing code change risk...');
    const risk = await engine.assessCodeChangeRisk([
      'src/backend/ai-brain-server.ts',
      'src/audio/ai/AIMasteringEngine.ts',
    ]);

    console.log(`\nRisk Level: ${risk.riskLevel.toUpperCase()}`);
    console.log(`Risk Score: ${(risk.riskScore * 100).toFixed(1)}%`);
    console.log(`Affected Tests: ${risk.affectedTests.join(', ')}`);
    console.log('Recommendations:');
    risk.recommendations.forEach(r => console.log(`  - ${r}`));

    // Show model stats
    console.log('\nModel Statistics:');
    console.log(JSON.stringify(engine.getModelStats(), null, 2));

    await engine.close();
  })();
}
