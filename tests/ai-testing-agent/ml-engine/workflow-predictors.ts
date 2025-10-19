/**
 * Workflow Failure Predictors
 * Ensemble prediction system for all 8 DAWG AI workflows
 */

import fs from 'fs/promises';
import path from 'path';
import type { WorkflowType, WorkflowFeatures } from './workflow-features';
import { featuresToVector, getCriticalFeatures } from './workflow-features';

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
}

interface WorkflowPrediction {
  workflowType: WorkflowType;
  failureProbability: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  criticalFactors: Array<{
    feature: string;
    value: number;
    weight: number;
    contribution: number;
  }>;
  recommendations: string[];
}

/**
 * Workflow Prediction Engine
 */
export class WorkflowPredictor {
  private models: Map<WorkflowType, WorkflowModel> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize predictor by loading trained models
   */
  async initialize(): Promise<void> {
    console.log('Loading workflow models...');

    const modelsDir = path.join(__dirname, 'models');
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

    for (const workflow of workflows) {
      try {
        const modelPath = path.join(modelsDir, `${workflow}-model.json`);
        const data = await fs.readFile(modelPath, 'utf-8');
        const model: WorkflowModel = JSON.parse(data);
        this.models.set(workflow, model);
        console.log(`  ✓ Loaded ${workflow} (accuracy: ${(model.accuracy * 100).toFixed(1)}%)`);
      } catch (error) {
        console.warn(`  ⚠ Failed to load ${workflow} model:`, error.message);
      }
    }

    this.initialized = true;
    console.log(`Loaded ${this.models.size} workflow models\n`);
  }

  /**
   * Predict failure probability for a workflow
   */
  async predict(features: WorkflowFeatures): Promise<WorkflowPrediction> {
    if (!this.initialized) {
      throw new Error('WorkflowPredictor not initialized. Call initialize() first.');
    }

    const model = this.models.get(features.workflowType);
    if (!model) {
      throw new Error(`No model found for workflow: ${features.workflowType}`);
    }

    // Convert features to vector
    const featureVector = featuresToVector(features);

    // Calculate prediction
    let z = model.bias;
    for (const [featureName, value] of Object.entries(featureVector)) {
      const weight = model.weights[featureName] || 0;
      z += weight * value;
    }

    const failureProbability = this.sigmoid(z);

    // Calculate confidence (distance from decision boundary)
    const confidence = Math.abs(failureProbability - 0.5) * 2;

    // Determine risk level
    let riskLevel: 'critical' | 'high' | 'medium' | 'low';
    if (failureProbability >= 0.8) {
      riskLevel = 'critical';
    } else if (failureProbability >= 0.6) {
      riskLevel = 'high';
    } else if (failureProbability >= 0.4) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Identify critical factors
    const criticalFactors = this.identifyCriticalFactors(
      featureVector,
      model.weights,
      features.workflowType
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      features.workflowType,
      criticalFactors,
      failureProbability
    );

    return {
      workflowType: features.workflowType,
      failureProbability,
      riskLevel,
      confidence,
      criticalFactors,
      recommendations,
    };
  }

  /**
   * Batch predict for multiple workflows
   */
  async predictBatch(featuresArray: WorkflowFeatures[]): Promise<WorkflowPrediction[]> {
    return Promise.all(featuresArray.map(features => this.predict(features)));
  }

  /**
   * Get workflow model statistics
   */
  getModelStats(workflowType: WorkflowType): WorkflowModel | undefined {
    return this.models.get(workflowType);
  }

  /**
   * Get all loaded models
   */
  getAllModels(): WorkflowModel[] {
    return Array.from(this.models.values());
  }

  // ==================== PRIVATE METHODS ====================

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-100, Math.min(100, z))));
  }

  private identifyCriticalFactors(
    featureVector: Record<string, number>,
    weights: Record<string, number>,
    workflowType: WorkflowType
  ): Array<{ feature: string; value: number; weight: number; contribution: number }> {
    // Get critical features for this workflow
    const criticalFeatureNames = getCriticalFeatures(workflowType);

    // Calculate contributions
    const factors = Object.entries(featureVector)
      .map(([feature, value]) => ({
        feature,
        value,
        weight: weights[feature] || 0,
        contribution: Math.abs((weights[feature] || 0) * value),
      }))
      .filter(f => criticalFeatureNames.includes(f.feature) || f.contribution > 0.1)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);

    return factors;
  }

  private generateRecommendations(
    workflowType: WorkflowType,
    criticalFactors: Array<{ feature: string; value: number; weight: number; contribution: number }>,
    failureProbability: number
  ): string[] {
    const recommendations: string[] = [];

    // Workflow-specific recommendations
    const workflowRecommendations: Record<WorkflowType, (factors: typeof criticalFactors) => string[]> = {
      'freestyle': (factors) => {
        const recs: string[] = [];
        const micPerm = factors.find(f => f.feature === 'micPermission');
        const audioCtx = factors.find(f => f.feature === 'audioContextOk');
        const transcription = factors.find(f => f.feature === 'transcriptionAccuracy');

        if (micPerm && micPerm.value < 0.5) {
          recs.push('Request microphone permission before starting recording');
        }
        if (audioCtx && audioCtx.value < 0.5) {
          recs.push('Initialize AudioContext on user gesture (button click)');
        }
        if (transcription && transcription.value < 0.7) {
          recs.push('Implement fallback transcription service or manual lyrics entry');
        }
        return recs;
      },

      'melody-to-vocals': (factors) => {
        const recs: string[] = [];
        const expertAI = factors.find(f => f.feature === 'expertAIAvailable');
        const latency = factors.find(f => f.feature === 'expertAILatency');

        if (expertAI && expertAI.value < 0.5) {
          recs.push('Check Expert Music AI service health before processing');
          recs.push('Implement retry logic with exponential backoff');
        }
        if (latency && latency.value > 0.7) {
          recs.push('Add loading indicator for long-running operations');
          recs.push('Consider implementing request queue to manage API rate limits');
        }
        return recs;
      },

      'stem-separation': (factors) => {
        const recs: string[] = [];
        const memory = factors.find(f => f.feature === 'memoryReq');
        const oom = factors.find(f => f.feature === 'prevOOMErrors');

        if (memory && memory.value > 0.8) {
          recs.push('Reduce FFT size or hop size to lower memory requirements');
          recs.push('Process audio in smaller chunks for long files');
        }
        if (oom && oom.value > 0.5) {
          recs.push('Implement memory monitoring and early warnings');
          recs.push('Add audio duration limits or compression before processing');
        }
        return recs;
      },

      'ai-mastering': (factors) => {
        const recs: string[] = [];
        const clipping = factors.find(f => f.feature === 'prevClipping');
        const complexity = factors.find(f => f.feature === 'processingComplexity');

        if (clipping && clipping.value > 0.6) {
          recs.push('Implement pre-mastering level detection and normalization');
          recs.push('Add clipping detection before writing output');
        }
        if (complexity && complexity.value > 0.8) {
          recs.push('Enable parallel processing for complex audio');
          recs.push('Add processing time estimates to manage user expectations');
        }
        return recs;
      },

      'live-vocal-analysis': (factors) => {
        const recs: string[] = [];
        const ws = factors.find(f => f.feature === 'wsConnected');
        const latency = factors.find(f => f.feature === 'wsLatency');
        const drops = factors.find(f => f.feature === 'droppedFrames');

        if (ws && ws.value < 0.5) {
          recs.push('Implement WebSocket auto-reconnect with exponential backoff');
          recs.push('Buffer analysis results locally during disconnection');
        }
        if (latency && latency.value > 0.6) {
          recs.push('Reduce analysis frequency or buffer size to decrease latency');
          recs.push('Implement latency monitoring and adaptive quality adjustment');
        }
        if (drops && drops.value > 0.5) {
          recs.push('Increase audio buffer size to prevent frame drops');
          recs.push('Optimize analysis algorithms for real-time performance');
        }
        return recs;
      },

      'ai-memory': (factors) => {
        const recs: string[] = [];
        const db = factors.find(f => f.feature === 'dbConnected');
        const timeouts = factors.find(f => f.feature === 'prevDBTimeouts');

        if (db && db.value < 0.5) {
          recs.push('Implement database connection pooling and retry logic');
          recs.push('Add fallback to in-memory cache during DB outages');
        }
        if (timeouts && timeouts.value > 0.5) {
          recs.push('Add database query timeout limits and error handling');
          recs.push('Implement query optimization and indexing');
        }
        return recs;
      },

      'voice-commands': (factors) => {
        const recs: string[] = [];
        const recognition = factors.find(f => f.feature === 'speechRecognitionOk');
        const mic = factors.find(f => f.feature === 'micQuality');
        const confidence = factors.find(f => f.feature === 'avgMatchConfidence');

        if (recognition && recognition.value < 0.5) {
          recs.push('Provide fallback to manual command input');
          recs.push('Show clear messaging when speech recognition is unavailable');
        }
        if (mic && mic.value < 0.6) {
          recs.push('Add microphone quality indicator to UI');
          recs.push('Suggest using external microphone for better results');
        }
        if (confidence && confidence.value < 0.6) {
          recs.push('Implement confirmation dialogs for low-confidence commands');
          recs.push('Show matched command to user before executing');
        }
        return recs;
      },

      'budget-alerts': (factors) => {
        const recs: string[] = [];
        const overDaily = factors.find(f => f.feature === 'overDaily');
        const overMonthly = factors.find(f => f.feature === 'overMonthly');
        const errors = factors.find(f => f.feature === 'prevCostCalcErrors');

        if (overDaily && overDaily.value > 0.5) {
          recs.push('Implement daily spending rate limiting');
          recs.push('Send proactive alerts at 80% threshold');
        }
        if (overMonthly && overMonthly.value > 0.5) {
          recs.push('Enable automatic pause when monthly limit exceeded');
          recs.push('Show spending projection to warn users early');
        }
        if (errors && errors.value > 0.5) {
          recs.push('Add cost calculation validation and error logging');
          recs.push('Implement fallback cost estimation when APIs fail');
        }
        return recs;
      },
    };

    // Add workflow-specific recommendations
    const workflowRecs = workflowRecommendations[workflowType](criticalFactors);
    recommendations.push(...workflowRecs);

    // Add general recommendations based on risk level
    if (failureProbability >= 0.8) {
      recommendations.push('CRITICAL: Implement circuit breaker pattern to prevent cascading failures');
      recommendations.push('Add comprehensive error monitoring and alerting');
    } else if (failureProbability >= 0.6) {
      recommendations.push('Add retry logic with exponential backoff');
      recommendations.push('Implement graceful degradation strategies');
    }

    return recommendations;
  }
}

// Singleton instance
let predictorInstance: WorkflowPredictor | null = null;

export async function getWorkflowPredictor(): Promise<WorkflowPredictor> {
  if (!predictorInstance) {
    predictorInstance = new WorkflowPredictor();
    await predictorInstance.initialize();
  }
  return predictorInstance;
}

// CLI usage
if (require.main === module) {
  (async () => {
    const predictor = new WorkflowPredictor();
    await predictor.initialize();

    console.log('='.repeat(60));
    console.log('WORKFLOW PREDICTOR - MODEL STATISTICS');
    console.log('='.repeat(60));

    const models = predictor.getAllModels();
    models.forEach(model => {
      console.log(`\n${model.workflowType.toUpperCase()}`);
      console.log(`  Accuracy:  ${(model.accuracy * 100).toFixed(2)}%`);
      console.log(`  Precision: ${(model.precision * 100).toFixed(2)}%`);
      console.log(`  Recall:    ${(model.recall * 100).toFixed(2)}%`);
      console.log(`  F1 Score:  ${(model.f1Score * 100).toFixed(2)}%`);
      console.log(`  Trained:   ${new Date(model.trainedAt).toLocaleString()}`);
    });

    console.log('\n✅ All models loaded and ready for predictions');
  })();
}
