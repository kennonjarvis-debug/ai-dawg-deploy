/**
 * Metrics Collector - System-wide metrics aggregation and publishing
 *
 * Tracks:
 * - Journey completion rates
 * - AI feedback latency
 * - Event processing times
 * - User engagement metrics
 * - System health indicators
 *
 * Publishes metrics.tick events every 30 seconds
 */

import { EventBus, getEventBus } from './eventBus';

import { logger } from '$lib/utils/logger';
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface MetricsSnapshot {
  timestamp: string;
  metrics: Metric[];
  period_sec: number;
}

interface MetricValue {
  value: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdate: number;
}

export class MetricsCollector {
  private eventBus: EventBus;
  private metrics: Map<string, MetricValue>;
  private counters: Map<string, number>;
  private timers: Map<string, number[]>;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickIntervalMs: number = 30000; // 30 seconds
  private started: boolean = false;

  // Journey metrics
  private journeyStarts: number = 0;
  private journeyCompletions: number = 0;
  private journeyAbandons: number = 0;

  // AI feedback metrics
  private feedbackLatencies: number[] = [];
  private feedbackCounts: Map<string, number> = new Map();

  // System health
  private errorCount: number = 0;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || getEventBus({ mode: 'gitops', agentName: 'metrics-collector' });
    this.metrics = new Map();
    this.counters = new Map();
    this.timers = new Map();
  }

  /**
   * Start the metrics collector
   */
  async start(): Promise<void> {
    if (this.started) {
      logger.warn('[MetricsCollector] Already started');
      return;
    }

    // Connect to event bus
    await this.eventBus.connect();

    // Subscribe to relevant events
    this.subscribeToEvents();

    // Start periodic tick
    this.tickInterval = setInterval(() => {
      this.publishMetricsTick();
    }, this.tickIntervalMs);

    this.started = true;
    logger.info('[MetricsCollector] Started (tick interval: 30s)');
  }

  /**
   * Stop the metrics collector
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    await this.eventBus.disconnect();
    this.started = false;
    logger.info('[MetricsCollector] Stopped');
  }

  /**
   * Subscribe to events for metrics collection
   */
  private subscribeToEvents(): void {
    // Journey events
    this.eventBus.subscribe('journey.started', (_envelope) => {
      this.journeyStarts++;
      this.incrementCounter('journey.starts');
    });

    this.eventBus.subscribe('journey.completed', (envelope) => {
      this.journeyCompletions++;
      this.incrementCounter('journey.completions');

      // Track journey duration
      const duration = envelope.payload.total_duration_hours;
      if (duration) {
        this.recordTimer('journey.duration_hours', duration);
      }
    });

    this.eventBus.subscribe('journey.paused', (_envelope) => {
      this.journeyAbandons++;
      this.incrementCounter('journey.abandons');
    });

    // AI feedback events
    this.eventBus.subscribe('coach.feedback', (envelope) => {
      this.incrementCounter('feedback.coach');
      this.trackFeedbackLatency(envelope);
      this.feedbackCounts.set('coach', (this.feedbackCounts.get('coach') || 0) + 1);
    });

    this.eventBus.subscribe('comping.suggestion', (envelope) => {
      this.incrementCounter('feedback.comping');
      this.trackFeedbackLatency(envelope);
      this.feedbackCounts.set('comping', (this.feedbackCounts.get('comping') || 0) + 1);
    });

    this.eventBus.subscribe('mix.suggestion', (envelope) => {
      this.incrementCounter('feedback.mix');
      this.trackFeedbackLatency(envelope);
      this.feedbackCounts.set('mix', (this.feedbackCounts.get('mix') || 0) + 1);
    });

    this.eventBus.subscribe('master.completed', (envelope) => {
      this.incrementCounter('feedback.master');
      this.feedbackCounts.set('master', (this.feedbackCounts.get('master') || 0) + 1);

      // Track mastering processing time
      const processingTime = envelope.payload.processing_time_sec;
      if (processingTime) {
        this.recordTimer('master.processing_time_sec', processingTime);
      }
    });

    // Recording events
    this.eventBus.subscribe('recording.started', (_envelope) => {
      this.incrementCounter('recordings.started');
    });

    this.eventBus.subscribe('recording.stopped', (envelope) => {
      this.incrementCounter('recordings.stopped');

      const duration = envelope.payload.duration_sec;
      if (duration) {
        this.recordTimer('recording.duration_sec', duration);
      }
    });

    // Error tracking
    this.eventBus.subscribe('alerts.error', (_envelope) => {
      this.errorCount++;
      this.incrementCounter('errors.total');
    });
  }

  /**
   * Track AI feedback latency
   */
  private trackFeedbackLatency(envelope: any): void {
    // Calculate latency from event timestamp to now
    const eventTime = new Date(envelope.ts).getTime();
    const now = Date.now();
    const latencyMs = now - eventTime;

    this.feedbackLatencies.push(latencyMs);

    // Keep only last 100 latencies
    if (this.feedbackLatencies.length > 100) {
      this.feedbackLatencies.shift();
    }
  }

  /**
   * Increment a counter metric
   */
  private incrementCounter(name: string, amount: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + amount);
  }

  /**
   * Record a timer value
   */
  private recordTimer(name: string, value: number): void {
    if (!this.timers.has(name)) {
      this.timers.set(name, []);
    }

    this.timers.get(name)!.push(value);

    // Keep only last 100 values
    const values = this.timers.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Calculate journey completion rate
   */
  private calculateJourneyCompletionRate(): number {
    if (this.journeyStarts === 0) return 0;
    return (this.journeyCompletions / this.journeyStarts) * 100;
  }

  /**
   * Calculate average feedback latency
   */
  private calculateAvgFeedbackLatency(): number {
    if (this.feedbackLatencies.length === 0) return 0;
    const sum = this.feedbackLatencies.reduce((a, b) => a + b, 0);
    return sum / this.feedbackLatencies.length;
  }

  /**
   * Calculate percentile for an array of values
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Publish metrics.tick event
   */
  private async publishMetricsTick(): Promise<void> {
    const metrics: Metric[] = [];
    const timestamp = new Date().toISOString();

    // Journey metrics
    metrics.push({
      name: 'journey.completion_rate',
      value: this.calculateJourneyCompletionRate(),
      unit: 'percent',
      timestamp,
    });

    metrics.push({
      name: 'journey.starts',
      value: this.journeyStarts,
      unit: 'count',
      timestamp,
    });

    metrics.push({
      name: 'journey.completions',
      value: this.journeyCompletions,
      unit: 'count',
      timestamp,
    });

    metrics.push({
      name: 'journey.abandons',
      value: this.journeyAbandons,
      unit: 'count',
      timestamp,
    });

    // AI feedback latency
    if (this.feedbackLatencies.length > 0) {
      metrics.push({
        name: 'feedback.latency_ms_avg',
        value: this.calculateAvgFeedbackLatency(),
        unit: 'milliseconds',
        timestamp,
      });

      metrics.push({
        name: 'feedback.latency_ms_p95',
        value: this.calculatePercentile(this.feedbackLatencies, 95),
        unit: 'milliseconds',
        timestamp,
      });

      metrics.push({
        name: 'feedback.latency_ms_p99',
        value: this.calculatePercentile(this.feedbackLatencies, 99),
        unit: 'milliseconds',
        timestamp,
      });
    }

    // Feedback counts by type
    this.feedbackCounts.forEach((count, type) => {
      metrics.push({
        name: `feedback.count.${type}`,
        value: count,
        unit: 'count',
        timestamp,
        tags: { type },
      });
    });

    // Timer metrics
    this.timers.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        metrics.push({
          name: `${name}_avg`,
          value: avg,
          unit: name.includes('_sec') ? 'seconds' : 'milliseconds',
          timestamp,
        });

        metrics.push({
          name: `${name}_p95`,
          value: this.calculatePercentile(values, 95),
          unit: name.includes('_sec') ? 'seconds' : 'milliseconds',
          timestamp,
        });
      }
    });

    // Counter metrics
    this.counters.forEach((value, name) => {
      metrics.push({
        name,
        value,
        unit: 'count',
        timestamp,
      });
    });

    // System health
    metrics.push({
      name: 'errors.total',
      value: this.errorCount,
      unit: 'count',
      timestamp,
    });

    // Publish metrics.tick event
    await this.eventBus.publish('metrics.tick', {
      metrics,
      period_sec: this.tickIntervalMs / 1000,
      collector: 'ai-conductor',
    });

    logger.info(`[MetricsCollector] Published ${metrics.length} metrics`);
  }

  /**
   * Get current metrics snapshot (for debugging)
   */
  getSnapshot(): MetricsSnapshot {
    const metrics: Metric[] = [];
    const timestamp = new Date().toISOString();

    // Add all current metrics
    metrics.push({
      name: 'journey.completion_rate',
      value: this.calculateJourneyCompletionRate(),
      unit: 'percent',
      timestamp,
    });

    return {
      timestamp,
      metrics,
      period_sec: this.tickIntervalMs / 1000,
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.timers.clear();
    this.journeyStarts = 0;
    this.journeyCompletions = 0;
    this.journeyAbandons = 0;
    this.feedbackLatencies = [];
    this.feedbackCounts.clear();
    this.errorCount = 0;
  }
}

// Singleton instance
let metricsCollectorInstance: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new MetricsCollector();
  }
  return metricsCollectorInstance;
}
