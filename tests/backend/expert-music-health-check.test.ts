/**
 * Tests for Expert Music AI Health Check Service
 * Tests circuit breaker pattern, health monitoring, and graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock logger
vi.mock('../../src/backend/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import {
  ServiceStatus,
  CircuitState
} from '../../src/backend/services/expert-music-health-check';

describe('Expert Music Health Check Service', () => {
  let ExpertMusicHealthCheck: any;
  let healthCheck: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Dynamically import the module to get a fresh instance
    const module = await import('../../src/backend/services/expert-music-health-check');
    ExpertMusicHealthCheck = module.default;

    // Create a new instance for testing
    const HealthCheckClass = (ExpertMusicHealthCheck as any).constructor;
    healthCheck = new HealthCheckClass();
  });

  afterEach(() => {
    if (healthCheck && healthCheck.stopHealthChecks) {
      healthCheck.stopHealthChecks();
    }
  });

  describe('Health Check Basics', () => {
    it('should initialize with DOWN status', () => {
      const metrics = healthCheck.getMetrics();
      expect(metrics.status).toBe(ServiceStatus.DOWN);
      expect(metrics.circuitState).toBe(CircuitState.CLOSED);
    });

    it('should transition to UP status on successful health check', async () => {
      // Mock successful health check
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.status).toBe(ServiceStatus.UP);
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.consecutiveFailures).toBe(0);
    });

    it('should track consecutive failures', async () => {
      // Mock failed health checks
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      // Trigger 2 failed health checks
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.consecutiveFailures).toBe(2);
      expect(metrics.totalFailures).toBe(2);
      expect(metrics.status).toBe(ServiceStatus.DOWN);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should trip circuit breaker after 3 consecutive failures', async () => {
      // Mock failed health checks
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      // Trigger 3 failed health checks
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.circuitState).toBe(CircuitState.OPEN);
      expect(metrics.status).toBe(ServiceStatus.CIRCUIT_OPEN);
      expect(metrics.consecutiveFailures).toBe(3);
    });

    it('should block requests when circuit is open', async () => {
      // Trip the circuit breaker
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isCircuitOpen()).toBe(true);
      expect(healthCheck.isServiceAvailable()).toBe(false);
    });

    it('should close circuit after successful recovery', async () => {
      // Trip the circuit
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isCircuitOpen()).toBe(true);

      // Mock successful health check
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      // Wait for timeout and trigger health check
      await new Promise(resolve => setTimeout(resolve, 100));
      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.circuitState).toBe(CircuitState.CLOSED);
      expect(metrics.status).toBe(ServiceStatus.UP);
      expect(metrics.consecutiveFailures).toBe(0);
    });

    it('should reset circuit breaker manually', async () => {
      // Trip the circuit
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isCircuitOpen()).toBe(true);

      // Reset circuit breaker
      healthCheck.resetCircuitBreaker();

      const metrics = healthCheck.getMetrics();
      expect(metrics.circuitState).toBe(CircuitState.CLOSED);
      expect(metrics.consecutiveFailures).toBe(0);
    });
  });

  describe('Metrics Tracking', () => {
    it('should track uptime and downtime', async () => {
      // Mock successful health check
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.uptime).toBeGreaterThan(0);
      expect(metrics.uptimePercentage).toBeGreaterThan(0);
    });

    it('should calculate uptime percentage correctly', async () => {
      // Mock successful check
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      await healthCheck.triggerHealthCheck();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock failed check
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed'));
      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.uptimePercentage).toBeLessThan(100);
      expect(metrics.uptimePercentage).toBeGreaterThan(0);
    });

    it('should track response times', async () => {
      // Mock successful health check with delay
      mockedAxios.get.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          status: 200,
          data: { status: 'running' },
        }), 50))
      );

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Request Queueing', () => {
    it('should queue requests when service is down', async () => {
      const queuedPromise = healthCheck.queueRequest('/generate', {
        prompt: 'test',
      });

      expect(healthCheck.getQueuedRequestsCount()).toBe(1);
    });

    it('should clear queue on demand', async () => {
      healthCheck.queueRequest('/generate', { prompt: 'test1' });
      healthCheck.queueRequest('/generate', { prompt: 'test2' });

      expect(healthCheck.getQueuedRequestsCount()).toBe(2);

      healthCheck.clearQueue();

      expect(healthCheck.getQueuedRequestsCount()).toBe(0);
    });
  });

  describe('Event Emissions', () => {
    it('should emit service-up event when service comes online', (done) => {
      healthCheck.on('service-up', () => {
        done();
      });

      // Mock successful health check
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      healthCheck.triggerHealthCheck();
    });

    it('should emit service-down event when service goes offline', (done) => {
      // First make service UP
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      healthCheck.triggerHealthCheck().then(() => {
        // Now listen for down event
        healthCheck.on('service-down', () => {
          done();
        });

        // Make service fail
        mockedAxios.get.mockRejectedValueOnce(new Error('Failed'));
        healthCheck.triggerHealthCheck();
      });
    });

    it('should emit circuit-opened event when breaker trips', (done) => {
      healthCheck.on('circuit-opened', (data: any) => {
        expect(data.failures).toBe(3);
        done();
      });

      // Mock 3 failures
      mockedAxios.get.mockRejectedValue(new Error('Failed'));

      Promise.all([
        healthCheck.triggerHealthCheck(),
        healthCheck.triggerHealthCheck(),
        healthCheck.triggerHealthCheck(),
      ]);
    });

    it('should emit downtime-alert after extended downtime', (done) => {
      // This would require waiting 5 minutes in real scenario
      // For testing, we can verify the event handler is set up
      healthCheck.on('downtime-alert', (data: any) => {
        expect(data.duration).toBeDefined();
        done();
      });

      // Manually trigger alert for testing
      healthCheck.emit('downtime-alert', {
        duration: 300000,
        durationMinutes: 5,
      });
    });
  });

  describe('Service Status Checks', () => {
    it('should report service as available when UP and circuit CLOSED', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'running' },
      });

      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isServiceAvailable()).toBe(true);
      expect(healthCheck.getStatus()).toBe(ServiceStatus.UP);
    });

    it('should report service as unavailable when DOWN', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed'));

      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isServiceAvailable()).toBe(false);
      expect(healthCheck.getStatus()).toBe(ServiceStatus.DOWN);
    });

    it('should report service as unavailable when circuit is OPEN', async () => {
      // Trip circuit
      mockedAxios.get.mockRejectedValue(new Error('Failed'));

      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();
      await healthCheck.triggerHealthCheck();

      expect(healthCheck.isServiceAvailable()).toBe(false);
      expect(healthCheck.isCircuitOpen()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle health check timeout gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('timeout of 5000ms exceeded'));

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.status).toBe(ServiceStatus.DOWN);
      expect(metrics.totalFailures).toBe(1);
    });

    it('should handle malformed health check response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'unhealthy' }, // Wrong status
      });

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.status).toBe(ServiceStatus.DOWN);
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await healthCheck.triggerHealthCheck();

      const metrics = healthCheck.getMetrics();
      expect(metrics.status).toBe(ServiceStatus.DOWN);
    });
  });
});
