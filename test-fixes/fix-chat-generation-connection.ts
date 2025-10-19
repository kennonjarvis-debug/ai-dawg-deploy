/**
 * FIX #2: Chat Triggers Generation - Connection Failure
 *
 * Issue: Failed to connect to generation service
 * Solution: Implement retry logic with exponential backoff + health checks
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const GENERATION_SERVICE_CONFIG = {
  url: process.env.EXPERT_MUSIC_AI_URL || 'http://localhost:8003',
  healthCheckInterval: 30000, // Check every 30s
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1s
    maxDelay: 10000, // 10s
    backoffMultiplier: 2
  } as RetryConfig
};

// Circuit breaker state
let serviceAvailable = true;
let lastHealthCheck = 0;
let failureCount = 0;

/**
 * Check if generation service is healthy
 */
export async function checkGenerationServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${GENERATION_SERVICE_CONFIG.url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (response.ok) {
      const data = await response.json();
      serviceAvailable = data.status === 'healthy';
      failureCount = 0;
      lastHealthCheck = Date.now();
      console.log('✅ Generation service healthy');
      return true;
    }

    serviceAvailable = false;
    return false;
  } catch (error) {
    console.error('❌ Generation service health check failed:', error);
    serviceAvailable = false;
    failureCount++;
    return false;
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = GENERATION_SERVICE_CONFIG.retry
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check health before attempting if we've had failures
      if (failureCount > 0) {
        const isHealthy = await checkGenerationServiceHealth();
        if (!isHealthy && attempt < config.maxRetries) {
          throw new Error('Service unhealthy - will retry');
        }
      }

      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        console.log(`⏳ Retry ${attempt + 1}/${config.maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${config.maxRetries} retries: ${lastError!.message}`);
}

/**
 * Trigger music generation with retry logic
 */
export async function triggerMusicGeneration(prompt: string): Promise<any> {
  // Pre-flight health check
  const now = Date.now();
  if (now - lastHealthCheck > GENERATION_SERVICE_CONFIG.healthCheckInterval) {
    await checkGenerationServiceHealth();
  }

  if (!serviceAvailable) {
    throw new Error('Generation service unavailable - try again later');
  }

  // Execute with retry
  return retryWithBackoff(async () => {
    const response = await fetch(`${GENERATION_SERVICE_CONFIG.url}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  });
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring() {
  setInterval(async () => {
    await checkGenerationServiceHealth();
  }, GENERATION_SERVICE_CONFIG.healthCheckInterval);

  console.log('✅ Health monitoring started');
}

// Auto-start health monitoring
if (typeof window === 'undefined') {
  // Server-side only
  startHealthMonitoring();
}

console.log('✅ Fix #2 applied: Retry logic + health checks + circuit breaker');
