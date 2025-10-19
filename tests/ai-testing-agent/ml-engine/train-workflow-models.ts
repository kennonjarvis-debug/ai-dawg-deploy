/**
 * Workflow Model Trainer
 * Trains separate ML models for each of the 8 DAWG AI workflows
 */

import fs from 'fs/promises';
import path from 'path';
import type { WorkflowType } from './workflow-features';

interface TrainingScenario {
  id: string;
  workflowType: WorkflowType;
  features: Record<string, number>;
  failed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface WorkflowModel {
  workflowType: WorkflowType;
  weights: Record<string, number>;
  bias: number;
  featureNames: string[];
  trainedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSize: number;
  validationSize: number;
}

/**
 * Sigmoid activation function
 */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-100, Math.min(100, z))));
}

/**
 * Logistic regression training
 */
function trainLogisticRegression(
  X: number[][],
  y: number[],
  learningRate: number = 0.01,
  iterations: number = 1000
): { weights: number[]; bias: number } {
  const m = X.length;
  const n = X[0].length;
  let weights = new Array(n).fill(0);
  let bias = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const predictions = X.map(x => {
      const z = x.reduce((sum, val, i) => sum + val * weights[i], 0) + bias;
      return sigmoid(z);
    });

    // Gradient descent
    const dw = new Array(n).fill(0);
    let db = 0;

    for (let i = 0; i < m; i++) {
      const error = predictions[i] - y[i];
      db += error;
      for (let j = 0; j < n; j++) {
        dw[j] += error * X[i][j];
      }
    }

    // Update weights
    for (let j = 0; j < n; j++) {
      weights[j] -= (learningRate / m) * dw[j];
    }
    bias -= (learningRate / m) * db;

    // Log progress every 100 iterations
    if (iter % 100 === 0) {
      const loss = predictions.reduce((sum, pred, i) => {
        const l = -y[i] * Math.log(pred + 1e-10) - (1 - y[i]) * Math.log(1 - pred + 1e-10);
        return sum + l;
      }, 0) / m;
      console.log(`  Iteration ${iter}: Loss = ${loss.toFixed(4)}`);
    }
  }

  return { weights, bias };
}

/**
 * Evaluate model performance
 */
function evaluateModel(
  X: number[][],
  y: number[],
  weights: number[],
  bias: number
): { accuracy: number; precision: number; recall: number; f1Score: number } {
  let correct = 0;
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (let i = 0; i < X.length; i++) {
    const z = X[i].reduce((sum, val, j) => sum + val * weights[j], 0) + bias;
    const probability = sigmoid(z);
    const predicted = probability >= 0.5 ? 1 : 0;

    if (predicted === y[i]) correct++;
    if (predicted === 1 && y[i] === 1) truePositives++;
    if (predicted === 1 && y[i] === 0) falsePositives++;
    if (predicted === 0 && y[i] === 1) falseNegatives++;
  }

  const accuracy = correct / X.length;
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
 * Train model for a specific workflow
 */
async function trainWorkflowModel(
  workflowType: WorkflowType,
  scenarios: TrainingScenario[]
): Promise<WorkflowModel> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Training model for: ${workflowType.toUpperCase()}`);
  console.log('='.repeat(60));

  // Filter scenarios for this workflow
  const workflowScenarios = scenarios.filter(s => s.workflowType === workflowType);
  console.log(`Found ${workflowScenarios.length} scenarios`);

  if (workflowScenarios.length < 50) {
    throw new Error(`Insufficient data for ${workflowType}: ${workflowScenarios.length} scenarios`);
  }

  // Extract features and labels
  const featureNames = Object.keys(workflowScenarios[0].features).sort();
  const X = workflowScenarios.map(s => featureNames.map(f => s.features[f] || 0));
  const y = workflowScenarios.map(s => s.failed ? 1 : 0);

  // Split into training and validation sets (80/20)
  const splitIndex = Math.floor(workflowScenarios.length * 0.8);
  const X_train = X.slice(0, splitIndex);
  const y_train = y.slice(0, splitIndex);
  const X_val = X.slice(splitIndex);
  const y_val = y.slice(splitIndex);

  console.log(`Training set: ${X_train.length} samples`);
  console.log(`Validation set: ${X_val.length} samples`);
  console.log(`Features: ${featureNames.length}`);

  // Train model
  console.log('\nTraining...');
  const { weights: weightArray, bias } = trainLogisticRegression(X_train, y_train, 0.1, 500);

  // Convert weights array to object
  const weights: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    weights[name] = weightArray[i];
  });

  // Evaluate on validation set
  console.log('\nEvaluating...');
  const metrics = evaluateModel(X_val, y_val, weightArray, bias);

  console.log(`\nResults:`);
  console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall: ${(metrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`);

  return {
    workflowType,
    weights,
    bias,
    featureNames,
    trainedAt: new Date().toISOString(),
    ...metrics,
    trainingSize: X_train.length,
    validationSize: X_val.length,
  };
}

/**
 * Train models for all workflows
 */
async function trainAllModels() {
  console.log('DAWG AI Workflow ML Model Training');
  console.log('==================================\n');

  // Load training data
  const dataPath = path.join(__dirname, 'workflow-training-data.json');
  console.log(`Loading training data from: ${dataPath}`);

  const data = await fs.readFile(dataPath, 'utf-8');
  const scenarios: TrainingScenario[] = JSON.parse(data);

  console.log(`Loaded ${scenarios.length} training scenarios\n`);

  // Count by workflow
  const workflowCounts: Record<string, number> = {};
  scenarios.forEach(s => {
    workflowCounts[s.workflowType] = (workflowCounts[s.workflowType] || 0) + 1;
  });

  console.log('Scenarios per workflow:');
  Object.entries(workflowCounts).forEach(([workflow, count]) => {
    console.log(`  ${workflow}: ${count}`);
  });

  // Train models for each workflow
  const workflows: WorkflowType[] = [
    'freestyle',
    'melody-to-vocals',
    'stem-separation',
    'ai-mastering',
    'live-vocal-analysis',
    'ai-memory',
    'voice-commands',
    'budget-alerts',
  ];

  const models: WorkflowModel[] = [];

  for (const workflow of workflows) {
    try {
      const model = await trainWorkflowModel(workflow, scenarios);
      models.push(model);
    } catch (error) {
      console.error(`Failed to train model for ${workflow}:`, error);
    }
  }

  // Save models
  const modelsDir = path.join(__dirname, 'models');
  await fs.mkdir(modelsDir, { recursive: true });

  for (const model of models) {
    const modelPath = path.join(modelsDir, `${model.workflowType}-model.json`);
    await fs.writeFile(modelPath, JSON.stringify(model, null, 2));
    console.log(`\nSaved ${model.workflowType} model to: ${modelPath}`);
  }

  // Save summary
  const summary = {
    trainedAt: new Date().toISOString(),
    totalScenarios: scenarios.length,
    modelsCount: models.length,
    models: models.map(m => ({
      workflowType: m.workflowType,
      accuracy: m.accuracy,
      precision: m.precision,
      recall: m.recall,
      f1Score: m.f1Score,
      trainingSize: m.trainingSize,
      validationSize: m.validationSize,
    })),
  };

  const summaryPath = path.join(modelsDir, 'training-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('TRAINING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal models trained: ${models.length}`);
  console.log('\nAccuracy by workflow:');
  models.forEach(m => {
    console.log(`  ${m.workflowType}: ${(m.accuracy * 100).toFixed(2)}%`);
  });

  const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
  console.log(`\nAverage accuracy: ${(avgAccuracy * 100).toFixed(2)}%`);

  return models;
}

// Run if executed directly
if (require.main === module) {
  trainAllModels()
    .then(() => {
      console.log('\n✅ All models trained successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Training failed:', error);
      process.exit(1);
    });
}

export { trainAllModels, trainWorkflowModel };
