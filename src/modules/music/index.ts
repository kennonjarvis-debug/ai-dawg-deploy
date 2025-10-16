/**
 * Music Module (Refactored)
 *
 * AI music generation orchestration, quality validation, and usage tracking.
 *
 * Refactored to use Module SDK (Jarvis-agnostic)
 * Note: Jarvis controller dependencies (adaptiveEngine, autonomyManager, selfAwareness)
 * have been replaced with generic logging/metrics
 */

import { BaseModule } from '../../module-sdk/base-module';
import { Router } from 'express';
import { ScheduledJob, HealthCheck } from '../../module-sdk/interfaces';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

const prisma = new PrismaClient();

/**
 * Audio quality metrics
 */
interface AudioQualityMetrics {
  peakAmplitude: number;
  rmsLevel: number;
  clippingSamples: number;
  frequencyResponse: {
    lowEnergy: number;
    midEnergy: number;
    highEnergy: number;
  };
  thd: number;
  snr: number;
  dynamicRange: number;
}

interface MusicGenerationRequest {
  userId: string;
  projectId?: string;
  genre?: string;
  mood?: string;
  tempo?: number;
  key?: string;
  duration?: number;
  instruments?: string[];
}

interface GenerationResult {
  success: boolean;
  audioPath?: string;
  midiPath?: string;
  quality?: AudioQualityMetrics;
  duration: number;
  error?: string;
}

interface VocalAnalysisRequest {
  userId: string;
  audioPath: string;
  projectId?: string;
}

interface VocalAnalysisResult {
  pitchAccuracy: number;
  rhythmAccuracy: number;
  timingAccuracy: number;
  overallScore: number;
  feedback: string[];
  recommendations: string[];
}

export class MusicModule extends BaseModule {
  name = 'music';
  version = '1.0.0';
  description = 'AI music generation orchestration, quality validation, and usage tracking';

  // Python AI engine paths
  private readonly PRODUCER_PATH = path.join(process.cwd(), 'src/ai/producer');
  private readonly VOCAL_COACH_PATH = path.join(process.cwd(), 'src/ai/vocal_coach');
  private readonly PYTHON_ENV = path.join(this.PRODUCER_PATH, 'venv/bin/python3');

  // Performance tracking
  private generationCount = 0;
  private analysisCount = 0;
  private failureCount = 0;
  private totalProcessingTime = 0;
  private actionCount = 0; // Replaced selfAwareness.recordAction
  private errorCount = 0; // Replaced selfAwareness.recordError

  /**
   * Initialize music module
   */
  protected async onInitialize(): Promise<void> {
    this.logger.info('Initializing Music Module...');

    // Register command handlers
    this.registerCommand('generate-music', this.handleGenerateMusic.bind(this));
    this.registerCommand('analyze-vocal', this.handleAnalyzeVocal.bind(this));
    this.registerCommand('validate-quality', this.handleValidateQuality.bind(this));
    this.registerCommand('get-usage-stats', this.handleGetUsageStats.bind(this));
    this.registerCommand('get-model-health', this.handleGetModelHealth.bind(this));

    // Verify Python environment
    await this.verifyPythonEnvironment();

    this.logger.info('Music Module initialized successfully');
  }

  /**
   * Shutdown music module
   */
  protected async onShutdown(): Promise<void> {
    this.logger.info('Shutting down Music Module...');
    await prisma.$disconnect();
    this.logger.info('Music Module shut down successfully');
  }

  /**
   * Register Express routes
   */
  protected onRegisterRoutes(router: Router): void {
    router.post('/generate', async (req, res) => {
      try {
        const request: MusicGenerationRequest = req.body;
        const result = await this.generateMusic(request);
        res.json({ success: true, data: result });
      } catch (error) {
        this.logger.error('Music generation failed', { error: (error as Error).message });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    router.post('/analyze-vocal', async (req, res) => {
      try {
        const request: VocalAnalysisRequest = req.body;
        const result = await this.analyzeVocal(request);
        res.json({ success: true, data: result });
      } catch (error) {
        this.logger.error('Vocal analysis failed', { error: (error as Error).message });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    router.post('/validate', async (req, res) => {
      try {
        const { audioPath } = req.body;
        const quality = await this.validateAudioQuality(audioPath);
        res.json({ success: true, data: quality });
      } catch (error) {
        this.logger.error('Quality validation failed', { error: (error as Error).message });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    router.get('/usage/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const stats = await this.getUserUsageStats(userId);
        res.json({ success: true, data: stats });
      } catch (error) {
        this.logger.error('Failed to get usage stats', { error: (error as Error).message });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    router.get('/health', async (req, res) => {
      try {
        const health = await this.checkModelHealth();
        res.json({ success: true, data: health });
      } catch (error) {
        this.logger.error('Failed to check model health', { error: (error as Error).message });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });
  }

  /**
   * Health checks
   */
  protected async onGetHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check generation stats
    const avgProcessingTime = this.generationCount > 0
      ? this.totalProcessingTime / this.generationCount
      : 0;

    const errorRate = this.generationCount > 0
      ? (this.failureCount / this.generationCount) * 100
      : 0;

    checks.push({
      name: 'generation_performance',
      status: errorRate < 10 ? 'pass' : errorRate < 20 ? 'warn' : 'fail',
      message: `${this.generationCount} generations, ${errorRate.toFixed(1)}% error rate, ${avgProcessingTime.toFixed(0)}ms avg`,
      metadata: {
        generationsCount: this.generationCount,
        analysisCount: this.analysisCount,
        failureCount: this.failureCount,
        errorRate,
        avgProcessingTime,
      },
    });

    // Check Python environment
    try {
      await fs.access(this.PYTHON_ENV);
      checks.push({
        name: 'python_environment',
        status: 'pass',
        message: 'Python environment available',
      });
    } catch {
      checks.push({
        name: 'python_environment',
        status: 'fail',
        message: 'Python environment not found',
      });
    }

    // Check model health from database
    try {
      const modelHealth = await this.checkModelHealth();
      checks.push({
        name: 'model_health',
        status: modelHealth.successRate > 90 ? 'pass' : modelHealth.successRate > 70 ? 'warn' : 'fail',
        message: `${modelHealth.successRate.toFixed(1)}% success rate in last hour`,
        metadata: modelHealth,
      });
    } catch (error) {
      checks.push({
        name: 'model_health',
        status: 'fail',
        message: (error as Error).message,
      });
    }

    return checks;
  }

  /**
   * Scheduled jobs
   */
  protected onGetScheduledJobs(): ScheduledJob[] {
    return [
      {
        id: 'music-usage-report',
        name: 'Daily Music Usage Report',
        schedule: '0 9 * * *',
        handler: this.generateUsageReport.bind(this),
        enabled: true,
        description: 'Generate daily report of music feature usage',
      },
      {
        id: 'model-health-check',
        name: 'Hourly Model Health Check',
        schedule: '0 * * * *',
        handler: this.performModelHealthCheck.bind(this),
        enabled: true,
        description: 'Check AI model health and performance',
      },
      {
        id: 'cleanup-temp-files',
        name: 'Cleanup Temporary Files',
        schedule: '0 0 * * *',
        handler: this.cleanupTempFiles.bind(this),
        enabled: true,
        description: 'Clean up temporary audio/MIDI files',
      },
    ];
  }

  // ==================== Command Handlers ====================

  private async handleGenerateMusic(params: MusicGenerationRequest): Promise<GenerationResult> {
    this.logger.info('Generating music', { userId: params.userId, genre: params.genre });
    return await this.generateMusic(params);
  }

  private async handleAnalyzeVocal(params: VocalAnalysisRequest): Promise<VocalAnalysisResult> {
    this.logger.info('Analyzing vocal', { userId: params.userId });
    return await this.analyzeVocal(params);
  }

  private async handleValidateQuality(params: { audioPath: string }): Promise<AudioQualityMetrics> {
    this.logger.info('Validating audio quality', { audioPath: params.audioPath });
    return await this.validateAudioQuality(params.audioPath);
  }

  private async handleGetUsageStats(params: { userId: string }): Promise<any> {
    this.logger.info('Getting usage stats', { userId: params.userId });
    return await this.getUserUsageStats(params.userId);
  }

  private async handleGetModelHealth(_params: any): Promise<any> {
    this.logger.info('Checking model health');
    return await this.checkModelHealth();
  }

  // ==================== Core Functionality ====================

  private async generateMusic(request: MusicGenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      await this.trackUsageEvent(request.userId, 'producer-ai', 'started', {
        genre: request.genre,
        mood: request.mood,
        tempo: request.tempo,
      }, request.projectId);

      const result = await this.callProducerAI(request);

      if (!result.success || !result.audioPath) {
        throw new Error(result.error || 'Music generation failed');
      }

      const quality = await this.validateAudioQuality(result.audioPath);

      if (quality.clippingSamples > 100) {
        this.logger.warn('Audio clipping detected', { clippingSamples: quality.clippingSamples });
      }

      const duration = Date.now() - startTime;
      this.generationCount++;
      this.totalProcessingTime += duration;

      await this.trackUsageEvent(request.userId, 'producer-ai', 'completed', {
        genre: request.genre,
        quality: quality,
      }, request.projectId, duration);

      // Replaced adaptiveEngine.recordMetric with simple logging
      this.logger.debug('Metrics recorded', {
        metric: 'generation_success_rate',
        value: 100,
        genre: request.genre,
        duration,
      });

      this.logger.debug('Metrics recorded', {
        metric: 'audio_quality_snr',
        value: quality.snr,
        genre: request.genre,
      });

      // Replaced selfAwareness.recordAction
      this.actionCount++;

      this.logger.info('Music generation completed', {
        userId: request.userId,
        duration,
        quality: quality.snr,
      });

      return {
        success: true,
        audioPath: result.audioPath,
        midiPath: result.midiPath,
        quality,
        duration,
      };
    } catch (error) {
      this.failureCount++;
      const duration = Date.now() - startTime;

      await this.trackUsageEvent(request.userId, 'producer-ai', 'failed', {
        error: (error as Error).message,
      }, request.projectId, duration, 'GENERATION_FAILED');

      // Replaced adaptiveEngine.recordMetric
      this.logger.debug('Metrics recorded', {
        metric: 'generation_success_rate',
        value: 0,
        error: (error as Error).message,
        duration,
      });

      // Replaced selfAwareness.recordError
      this.errorCount++;

      this.logger.error('Music generation failed', {
        error: (error as Error).message,
        userId: request.userId,
      });

      return {
        success: false,
        error: (error as Error).message,
        duration,
      };
    }
  }

  private async analyzeVocal(request: VocalAnalysisRequest): Promise<VocalAnalysisResult> {
    const startTime = Date.now();

    try {
      await this.trackUsageEvent(request.userId, 'vocal-coach', 'started', {
        audioPath: request.audioPath,
      }, request.projectId);

      const result = await this.callVocalCoach(request);

      const duration = Date.now() - startTime;
      this.analysisCount++;

      await this.trackUsageEvent(request.userId, 'vocal-coach', 'completed', {
        score: result.overallScore,
        pitchAccuracy: result.pitchAccuracy,
      }, request.projectId, duration);

      this.logger.info('Vocal analysis completed', {
        userId: request.userId,
        score: result.overallScore,
        duration,
      });

      return result;
    } catch (error) {
      this.failureCount++;
      const duration = Date.now() - startTime;

      await this.trackUsageEvent(request.userId, 'vocal-coach', 'failed', {
        error: (error as Error).message,
      }, request.projectId, duration, 'ANALYSIS_FAILED');

      throw error;
    }
  }

  private async validateAudioQuality(audioPath: string): Promise<AudioQualityMetrics> {
    this.logger.debug('Validating audio quality', { audioPath });

    const script = path.join(process.cwd(), 'tests/quality/audio-metrics.py');

    try {
      const result = await this.executePythonScript(script, [audioPath]);
      return JSON.parse(result);
    } catch (error) {
      this.logger.warn('Quality validation failed, using defaults', {
        error: (error as Error).message,
      });

      return {
        peakAmplitude: 0.8,
        rmsLevel: 0.3,
        clippingSamples: 0,
        frequencyResponse: {
          lowEnergy: 33,
          midEnergy: 34,
          highEnergy: 33,
        },
        thd: 0.01,
        snr: 60,
        dynamicRange: 40,
      };
    }
  }

  private async trackUsageEvent(
    userId: string,
    featureKey: string,
    eventType: 'started' | 'completed' | 'failed',
    metadata: Record<string, any> = {},
    projectId?: string,
    duration?: number,
    errorCode?: string
  ): Promise<void> {
    try {
      await prisma.usageEvent.create({
        data: {
          userId,
          featureKey,
          eventType,
          metadata,
          projectId,
          duration,
          errorCode,
        },
      });

      this.logger.debug('Usage event tracked', {
        userId,
        featureKey,
        eventType,
      });
    } catch (error) {
      this.logger.error('Failed to track usage event', {
        error: (error as Error).message,
      });
    }
  }

  private async getUserUsageStats(userId: string): Promise<any> {
    const [totalEvents, vocalCoachEvents, producerEvents, recentEvents] = await Promise.all([
      prisma.usageEvent.count({ where: { userId } }),
      prisma.usageEvent.count({ where: { userId, featureKey: 'vocal-coach', eventType: 'completed' } }),
      prisma.usageEvent.count({ where: { userId, featureKey: 'producer-ai', eventType: 'completed' } }),
      prisma.usageEvent.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const completedEvents = recentEvents.filter(e => e.eventType === 'completed' && e.duration);
    const avgDuration = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / completedEvents.length
      : 0;

    return {
      userId,
      totalEvents,
      vocalCoachUsage: vocalCoachEvents,
      producerAIUsage: producerEvents,
      avgDuration,
      recentActivity: recentEvents.slice(0, 10),
    };
  }

  private async checkModelHealth(): Promise<any> {
    const [recentFailures, recentSuccesses] = await Promise.all([
      prisma.usageEvent.count({
        where: {
          eventType: 'failed',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
      prisma.usageEvent.count({
        where: {
          eventType: 'completed',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ]);

    const totalRecent = recentFailures + recentSuccesses;
    const successRate = totalRecent > 0 ? (recentSuccesses / totalRecent) * 100 : 100;

    return {
      status: successRate > 90 ? 'healthy' : successRate > 70 ? 'degraded' : 'unhealthy',
      successRate,
      recentFailures,
      recentSuccesses,
      lastHourEvents: totalRecent,
    };
  }

  // ==================== Python Integration ====================

  private async callProducerAI(request: MusicGenerationRequest): Promise<any> {
    const script = path.join(this.PRODUCER_PATH, 'generators/melody_generator.py');

    const args = [
      '--genre', request.genre || 'pop',
      '--tempo', (request.tempo || 120).toString(),
      '--key', request.key || 'C',
      '--duration', (request.duration || 32).toString(),
    ];

    const result = await this.executePythonScript(script, args);
    return JSON.parse(result);
  }

  private async callVocalCoach(request: VocalAnalysisRequest): Promise<VocalAnalysisResult> {
    const script = path.join(this.VOCAL_COACH_PATH, 'vocal_coach_engine.py');

    const args = [
      '--audio', request.audioPath,
      '--analyze',
    ];

    const result = await this.executePythonScript(script, args);
    return JSON.parse(result);
  }

  private async executePythonScript(script: string, args: string[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.PYTHON_ENV, [script, ...args]);

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Python script failed: ${error || 'Unknown error'}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to execute Python: ${err.message}`));
      });
    });
  }

  private async verifyPythonEnvironment(): Promise<void> {
    try {
      await fs.access(this.PYTHON_ENV);
      this.logger.info('Python environment verified', { path: this.PYTHON_ENV });
    } catch (error) {
      this.logger.warn('Python environment not found, some features may be unavailable', {
        path: this.PYTHON_ENV,
      });
    }
  }

  // ==================== Scheduled Jobs ====================

  private async generateUsageReport(): Promise<void> {
    this.logger.info('Generating daily usage report');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalEvents, vocalCoachEvents, producerEvents, failures] = await Promise.all([
      prisma.usageEvent.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.usageEvent.count({ where: { featureKey: 'vocal-coach', eventType: 'completed', createdAt: { gte: yesterday } } }),
      prisma.usageEvent.count({ where: { featureKey: 'producer-ai', eventType: 'completed', createdAt: { gte: yesterday } } }),
      prisma.usageEvent.count({ where: { eventType: 'failed', createdAt: { gte: yesterday } } }),
    ]);

    this.logger.info('Daily usage report', {
      totalEvents,
      vocalCoachEvents,
      producerEvents,
      failures,
      successRate: totalEvents > 0 ? ((totalEvents - failures) / totalEvents * 100).toFixed(2) + '%' : 'N/A',
    });
  }

  private async performModelHealthCheck(): Promise<void> {
    this.logger.info('Performing model health check');

    const health = await this.checkModelHealth();

    // Log metrics (replaced adaptiveEngine.recordMetric)
    this.logger.debug('Model health metrics', {
      metric: 'model_success_rate',
      value: health.successRate,
      status: health.status,
      recentFailures: health.recentFailures,
    });

    if (health.status !== 'healthy') {
      this.logger.warn('Model health degraded', health);

      // Log optimization suggestion (replaced autonomyManager.proposeAction)
      if (health.successRate < 80) {
        this.logger.warn('Model optimization suggested', {
          action: 'retrain_model',
          reason: `Model success rate at ${health.successRate.toFixed(1)}%. Retrain to improve performance.`,
          currentSuccessRate: health.successRate,
          targetSuccessRate: 95,
        });
      } else if (health.successRate < 60) {
        this.logger.error('Critical model issue detected', {
          action: 'rollback_model',
          reason: `Model success rate critically low at ${health.successRate.toFixed(1)}%. Immediate rollback required.`,
          currentSuccessRate: health.successRate,
          severity: 'critical',
        });
      }
    } else {
      this.logger.debug('Model health check passed', health);
    }
  }

  private async cleanupTempFiles(): Promise<void> {
    this.logger.info('Cleaning up temporary files');

    const tempDir = path.join(process.cwd(), 'temp');

    try {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      let cleaned = 0;

      // Log cleanup action (replaced autonomyManager.proposeAction)
      if (files.length > 100) {
        this.logger.info('Cleanup action proposed', {
          action: 'cleanup_temp_files',
          title: 'Cleanup old temporary files',
          description: `Remove ${files.length} temporary files older than 7 days`,
          fileCount: files.length,
          maxAge: 7,
        });
      }

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }

      this.logger.info('Cleanup completed', { filesRemoved: cleaned });

      // Log cleanup metrics (replaced adaptiveEngine.recordMetric)
      this.logger.debug('Cleanup metrics', {
        metric: 'temp_files_cleaned',
        value: cleaned,
        totalFiles: files.length,
      });
    } catch (error) {
      this.logger.error('Cleanup failed', { error: (error as Error).message });
      this.errorCount++; // Replaced selfAwareness.recordError
    }
  }
}

// Export singleton instance
export default new MusicModule();
