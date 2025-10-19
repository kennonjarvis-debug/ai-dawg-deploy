/**
 * Expert Music AI Health Check Service
 *
 * Provides:
 * - Periodic health checks every 30 seconds
 * - Circuit breaker pattern (trips after 3 failures, resets after 5 minutes)
 * - Service status tracking (up/down/degraded)
 * - Uptime metrics and failure logging
 * - Admin alerts for extended downtime
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

const EXPERT_MUSIC_AI_URL = process.env.EXPERT_MUSIC_AI_URL || 'http://localhost:8003';
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const CIRCUIT_BREAKER_THRESHOLD = 3; // Trip after 3 failures
const CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes
const ALERT_THRESHOLD = 300000; // Alert after 5 minutes of downtime

export enum ServiceStatus {
  UP = 'up',
  DOWN = 'down',
  DEGRADED = 'degraded',
  CIRCUIT_OPEN = 'circuit_open',
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit tripped, not allowing requests
  HALF_OPEN = 'half_open', // Testing if service recovered
}

export interface HealthMetrics {
  status: ServiceStatus;
  circuitState: CircuitState;
  consecutiveFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  uptime: number;
  downtime: number;
  lastCheckTime: number;
  lastSuccessTime: number | null;
  lastFailureTime: number | null;
  uptimePercentage: number;
  averageResponseTime: number;
}

export interface QueuedRequest {
  id: string;
  timestamp: number;
  endpoint: string;
  params: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class ExpertMusicHealthCheck extends EventEmitter {
  private status: ServiceStatus = ServiceStatus.DOWN;
  private circuitState: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private uptime: number = 0;
  private downtime: number = 0;
  private lastCheckTime: number = Date.now();
  private lastSuccessTime: number | null = null;
  private lastFailureTime: number | null = null;
  private circuitOpenTime: number | null = null;
  private serviceBecameDownTime: number | null = null;
  private alertSent: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private requestQueue: QueuedRequest[] = [];
  private responseTimes: number[] = [];
  private readonly maxResponseTimeSamples = 100;

  constructor() {
    super();
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    logger.info('Starting Expert Music AI health checks', {
      interval: HEALTH_CHECK_INTERVAL,
      url: EXPERT_MUSIC_AI_URL,
    });

    // Immediate health check
    this.performHealthCheck();

    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks (for cleanup)
   */
  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Stopped Expert Music AI health checks');
    }
  }

  /**
   * Perform a single health check
   */
  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;

    try {
      // Check if circuit is open
      if (this.circuitState === CircuitState.OPEN) {
        const timeSinceOpen = now - (this.circuitOpenTime || now);

        if (timeSinceOpen >= CIRCUIT_BREAKER_TIMEOUT) {
          // Try half-open state to test recovery
          logger.info('Circuit breaker timeout reached, testing service recovery');
          this.circuitState = CircuitState.HALF_OPEN;
        } else {
          // Still in open state, skip health check
          this.updateDowntime(timeSinceLastCheck);
          this.lastCheckTime = now;
          return;
        }
      }

      // Perform health check
      const startTime = Date.now();
      const response = await axios.get(`${EXPERT_MUSIC_AI_URL}/`, {
        timeout: 5000,
      });
      const responseTime = Date.now() - startTime;

      // Record response time
      this.recordResponseTime(responseTime);

      // Check if service is healthy
      const isHealthy = response.status === 200 &&
                       response.data.status === 'running';

      if (isHealthy) {
        this.handleHealthCheckSuccess(timeSinceLastCheck);
      } else {
        this.handleHealthCheckFailure(timeSinceLastCheck, 'Service returned unhealthy status');
      }
    } catch (error: any) {
      this.handleHealthCheckFailure(timeSinceLastCheck, error.message);
    }

    this.lastCheckTime = now;
  }

  /**
   * Handle successful health check
   */
  private handleHealthCheckSuccess(timeSinceLastCheck: number): void {
    const now = Date.now();

    this.consecutiveFailures = 0;
    this.totalSuccesses++;
    this.lastSuccessTime = now;
    this.updateUptime(timeSinceLastCheck);

    // Close circuit if it was open or half-open
    if (this.circuitState !== CircuitState.CLOSED) {
      logger.info('Circuit breaker closed - service recovered', {
        previousState: this.circuitState,
      });
      this.circuitState = CircuitState.CLOSED;
      this.circuitOpenTime = null;
      this.emit('circuit-closed');
    }

    // Update status
    const previousStatus = this.status;
    this.status = ServiceStatus.UP;

    if (previousStatus !== ServiceStatus.UP) {
      logger.info('Expert Music AI service is now UP', {
        downtime: this.serviceBecameDownTime ? now - this.serviceBecameDownTime : 0,
      });
      this.serviceBecameDownTime = null;
      this.alertSent = false;
      this.emit('service-up');

      // Process queued requests
      this.processQueuedRequests();
    }
  }

  /**
   * Handle failed health check
   */
  private handleHealthCheckFailure(timeSinceLastCheck: number, errorMessage: string): void {
    const now = Date.now();

    this.consecutiveFailures++;
    this.totalFailures++;
    this.lastFailureTime = now;
    this.updateDowntime(timeSinceLastCheck);

    logger.warn('Expert Music AI health check failed', {
      consecutiveFailures: this.consecutiveFailures,
      error: errorMessage,
      circuitState: this.circuitState,
    });

    // Check if we should trip the circuit breaker
    if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD &&
        this.circuitState === CircuitState.CLOSED) {
      this.tripCircuitBreaker();
    } else if (this.circuitState === CircuitState.HALF_OPEN) {
      // If health check fails in half-open state, reopen circuit
      logger.warn('Health check failed in half-open state, reopening circuit');
      this.circuitState = CircuitState.OPEN;
      this.circuitOpenTime = now;
      this.emit('circuit-reopened');
    }

    // Update status
    const previousStatus = this.status;
    this.status = this.circuitState === CircuitState.OPEN
      ? ServiceStatus.CIRCUIT_OPEN
      : ServiceStatus.DOWN;

    if (previousStatus === ServiceStatus.UP) {
      this.serviceBecameDownTime = now;
      this.emit('service-down');
    }

    // Check if we should send alert
    if (this.serviceBecameDownTime && !this.alertSent) {
      const downtimeDuration = now - this.serviceBecameDownTime;
      if (downtimeDuration >= ALERT_THRESHOLD) {
        this.sendDowntimeAlert(downtimeDuration);
        this.alertSent = true;
      }
    }
  }

  /**
   * Trip the circuit breaker
   */
  private tripCircuitBreaker(): void {
    logger.error('Circuit breaker TRIPPED - stopping requests to Expert Music AI', {
      consecutiveFailures: this.consecutiveFailures,
      threshold: CIRCUIT_BREAKER_THRESHOLD,
      timeout: CIRCUIT_BREAKER_TIMEOUT,
    });

    this.circuitState = CircuitState.OPEN;
    this.circuitOpenTime = Date.now();
    this.status = ServiceStatus.CIRCUIT_OPEN;
    this.emit('circuit-opened', {
      failures: this.consecutiveFailures,
      timestamp: this.circuitOpenTime,
    });
  }

  /**
   * Send alert for extended downtime
   */
  private sendDowntimeAlert(duration: number): void {
    const durationMinutes = Math.floor(duration / 60000);

    logger.error('ALERT: Expert Music AI has been down for extended period', {
      duration: durationMinutes,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime,
    });

    this.emit('downtime-alert', {
      duration,
      durationMinutes,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessTime: this.lastSuccessTime,
      status: this.status,
    });
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > this.maxResponseTimeSamples) {
      this.responseTimes.shift();
    }
  }

  /**
   * Update uptime counter
   */
  private updateUptime(duration: number): void {
    this.uptime += duration;
  }

  /**
   * Update downtime counter
   */
  private updateDowntime(duration: number): void {
    this.downtime += duration;
  }

  /**
   * Get current health metrics
   */
  public getMetrics(): HealthMetrics {
    const totalTime = this.uptime + this.downtime;
    const uptimePercentage = totalTime > 0 ? (this.uptime / totalTime) * 100 : 0;
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      status: this.status,
      circuitState: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      uptime: this.uptime,
      downtime: this.downtime,
      lastCheckTime: this.lastCheckTime,
      lastSuccessTime: this.lastSuccessTime,
      lastFailureTime: this.lastFailureTime,
      uptimePercentage,
      averageResponseTime,
    };
  }

  /**
   * Check if service is available
   */
  public isServiceAvailable(): boolean {
    return this.status === ServiceStatus.UP &&
           this.circuitState === CircuitState.CLOSED;
  }

  /**
   * Check if circuit breaker is open
   */
  public isCircuitOpen(): boolean {
    return this.circuitState === CircuitState.OPEN;
  }

  /**
   * Get service status
   */
  public getStatus(): ServiceStatus {
    return this.status;
  }

  /**
   * Get circuit breaker state
   */
  public getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Queue a request for later processing when service recovers
   */
  public queueRequest(endpoint: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        endpoint,
        params,
        resolve,
        reject,
      };

      this.requestQueue.push(request);

      logger.info('Request queued for later processing', {
        requestId: request.id,
        endpoint,
        queueLength: this.requestQueue.length,
      });

      this.emit('request-queued', {
        requestId: request.id,
        queueLength: this.requestQueue.length,
      });

      // Reject after 10 minutes if not processed
      setTimeout(() => {
        const index = this.requestQueue.findIndex(r => r.id === request.id);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Request timeout - service did not recover in time'));
        }
      }, 600000);
    });
  }

  /**
   * Process all queued requests
   */
  private async processQueuedRequests(): Promise<void> {
    if (this.requestQueue.length === 0) {
      return;
    }

    logger.info('Processing queued requests', {
      queueLength: this.requestQueue.length,
    });

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        // Emit event so handlers can process the request
        this.emit('process-queued-request', request);
      } catch (error) {
        logger.error('Failed to process queued request', {
          requestId: request.id,
          error,
        });
        request.reject(error);
      }
    }
  }

  /**
   * Get queued requests count
   */
  public getQueuedRequestsCount(): number {
    return this.requestQueue.length;
  }

  /**
   * Manually trigger health check
   */
  public async triggerHealthCheck(): Promise<HealthMetrics> {
    await this.performHealthCheck();
    return this.getMetrics();
  }

  /**
   * Reset circuit breaker (admin action)
   */
  public resetCircuitBreaker(): void {
    logger.warn('Circuit breaker manually reset by admin');
    this.circuitState = CircuitState.CLOSED;
    this.circuitOpenTime = null;
    this.consecutiveFailures = 0;
    this.emit('circuit-reset');
  }

  /**
   * Clear all queued requests
   */
  public clearQueue(): void {
    const clearedCount = this.requestQueue.length;
    this.requestQueue.forEach(req => {
      req.reject(new Error('Queue cleared by admin'));
    });
    this.requestQueue = [];
    logger.info('Request queue cleared', { clearedCount });
  }
}

// Singleton instance
export const expertMusicHealthCheck = new ExpertMusicHealthCheck();

// Setup event listeners for logging
expertMusicHealthCheck.on('service-up', () => {
  logger.info('EVENT: Expert Music AI service is UP');
});

expertMusicHealthCheck.on('service-down', () => {
  logger.warn('EVENT: Expert Music AI service is DOWN');
});

expertMusicHealthCheck.on('circuit-opened', (data) => {
  logger.error('EVENT: Circuit breaker OPENED', data);
});

expertMusicHealthCheck.on('circuit-closed', () => {
  logger.info('EVENT: Circuit breaker CLOSED');
});

expertMusicHealthCheck.on('downtime-alert', (data) => {
  logger.error('EVENT: DOWNTIME ALERT', data);
  // Here you could integrate with external alerting systems
  // - Send email to admins
  // - Send Slack/Discord notification
  // - Trigger PagerDuty alert
  // - etc.
});

expertMusicHealthCheck.on('request-queued', (data) => {
  logger.info('EVENT: Request queued', data);
});

export default expertMusicHealthCheck;
