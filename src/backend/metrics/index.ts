/**
 * Backend Metrics
 * Prometheus-compatible metrics for monitoring
 */

import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const register = new Registry();

// WebSocket metrics
export const wsConnectionsGauge = new Gauge({
  name: 'ws_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['type'],
  registers: [register],
});

export const wsConnectionsTotal = new Counter({
  name: 'ws_connections_total',
  help: 'Total number of WebSocket connections',
  labelNames: ['type', 'event'],
  registers: [register],
});

export const wsErrorsTotal = new Counter({
  name: 'ws_errors_total',
  help: 'Total number of WebSocket errors',
  labelNames: ['type', 'error_type'],
  registers: [register],
});

export const wsMessagesTotal = new Counter({
  name: 'ws_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'event', 'direction'],
  registers: [register],
});

export const wsLatencyHistogram = new Histogram({
  name: 'ws_latency_seconds',
  help: 'WebSocket message latency',
  labelNames: ['type', 'event'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Generation queue metrics
export const generationJobsTotal = new Counter({
  name: 'generation_jobs_total',
  help: 'Total number of generation jobs',
  labelNames: ['type', 'status'],
  registers: [register],
});

export const generationJobDuration = new Histogram({
  name: 'generation_job_duration_seconds',
  help: 'Duration of generation jobs',
  labelNames: ['type'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const generationQueueSize = new Gauge({
  name: 'generation_queue_size',
  help: 'Number of jobs in generation queue',
  labelNames: ['status'],
  registers: [register],
});
