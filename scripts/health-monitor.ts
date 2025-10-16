#!/usr/bin/env tsx

/**
 * Automated Health Monitoring System
 *
 * Monitors all Railway services and alerts when issues are detected.
 * Runs continuously and sends alerts via multiple channels.
 */

import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const SERVICES = [
  {
    name: 'Backend',
    url: 'https://dawg-ai-backend-production.up.railway.app/health',
    railwayService: 'dawg-ai-backend'
  },
  {
    name: 'Gateway',
    url: 'https://dawg-ai-gateway-production.up.railway.app/health',
    railwayService: 'dawg-ai-gateway'
  },
  {
    name: 'Frontend',
    url: 'https://www.dawg-ai.com',
    railwayService: 'web'
  }
];

const CHECK_INTERVAL = 60000; // 1 minute
const FAILURE_THRESHOLD = 3; // Alert after 3 consecutive failures
const RECOVERY_THRESHOLD = 2; // Alert recovery after 2 consecutive successes

interface ServiceStatus {
  name: string;
  healthy: boolean;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastChecked: Date;
  lastError?: string;
  responseTime?: number;
  alerted: boolean;
}

const serviceStatuses = new Map<string, ServiceStatus>();

// Initialize service statuses
SERVICES.forEach(service => {
  serviceStatuses.set(service.name, {
    name: service.name,
    healthy: true,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    lastChecked: new Date(),
    alerted: false
  });
});

/**
 * Check health of a single service
 */
async function checkServiceHealth(service: typeof SERVICES[0]): Promise<{
  healthy: boolean;
  error?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const request = https.get(service.url, { timeout: 10000 }, (res) => {
      const responseTime = Date.now() - startTime;

      if (res.statusCode === 200) {
        resolve({ healthy: true, responseTime });
      } else {
        resolve({
          healthy: false,
          error: `HTTP ${res.statusCode}`,
          responseTime
        });
      }
    });

    request.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        healthy: false,
        error: error.message,
        responseTime
      });
    });

    request.on('timeout', () => {
      request.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        healthy: false,
        error: 'Timeout after 10s',
        responseTime
      });
    });
  });
}

/**
 * Get Railway service deployment status
 */
async function getRailwayStatus(serviceName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`railway status --json`);
    const data = JSON.parse(stdout);

    const service = data.services.edges.find(
      (edge: any) => edge.node.name === serviceName
    );

    if (service) {
      return service.node.serviceInstances.edges[0]?.node.latestDeployment?.status || 'UNKNOWN';
    }

    return 'NOT_FOUND';
  } catch (error) {
    return 'ERROR';
  }
}

/**
 * Send alert via macOS notification
 */
function sendMacNotification(title: string, message: string) {
  exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
}

/**
 * Send alert via speech (macOS)
 */
function sendSpeechAlert(message: string) {
  exec(`say "${message}"`);
}

/**
 * Send alert via terminal bell
 */
function sendTerminalBell() {
  process.stdout.write('\x07'); // Bell character
}

/**
 * Log alert to file
 */
async function logAlert(severity: 'ERROR' | 'WARNING' | 'INFO' | 'RECOVERY', message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${severity}] ${message}\n`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(logEntry);
  console.log('='.repeat(80));

  // Write to log file
  const fs = await import('fs/promises');
  await fs.appendFile('/tmp/health-monitor.log', logEntry);
}

/**
 * Send alerts for service failure
 */
async function alertServiceFailure(status: ServiceStatus, railwayStatus: string) {
  const message = `${status.name} service is DOWN! ${status.lastError}. Railway status: ${railwayStatus}`;

  await logAlert('ERROR', message);
  sendMacNotification('🚨 Service Alert', message);
  sendTerminalBell();

  // Critical alert - use speech
  if (status.consecutiveFailures === FAILURE_THRESHOLD) {
    sendSpeechAlert(`Critical alert: ${status.name} service is down`);
  }
}

/**
 * Send alerts for service recovery
 */
async function alertServiceRecovery(status: ServiceStatus) {
  const message = `✅ ${status.name} service RECOVERED after ${status.consecutiveFailures} failures`;

  await logAlert('RECOVERY', message);
  sendMacNotification('✅ Service Recovered', message);
}

/**
 * Send warning for slow response
 */
async function alertSlowResponse(status: ServiceStatus) {
  const message = `⚠️ ${status.name} service is slow (${status.responseTime}ms)`;

  await logAlert('WARNING', message);
}

/**
 * Monitor all services
 */
async function monitorServices() {
  console.clear();
  console.log('🔍 Health Monitor Running...');
  console.log('Time:', new Date().toLocaleString());
  console.log('='.repeat(80));

  for (const service of SERVICES) {
    const status = serviceStatuses.get(service.name)!;
    const result = await checkServiceHealth(service);

    status.lastChecked = new Date();
    status.responseTime = result.responseTime;

    if (result.healthy) {
      // Service is healthy
      status.consecutiveFailures = 0;
      status.consecutiveSuccesses++;

      // Check if this is a recovery
      if (status.alerted && status.consecutiveSuccesses >= RECOVERY_THRESHOLD) {
        await alertServiceRecovery(status);
        status.alerted = false;
      }

      // Check for slow response
      if (result.responseTime > 5000) {
        await alertSlowResponse(status);
      }

      console.log(`✅ ${service.name}: OK (${result.responseTime}ms)`);
    } else {
      // Service is unhealthy
      status.consecutiveSuccesses = 0;
      status.consecutiveFailures++;
      status.lastError = result.error;

      console.log(`❌ ${service.name}: FAILED (${result.error})`);

      // Alert if threshold reached
      if (status.consecutiveFailures >= FAILURE_THRESHOLD && !status.alerted) {
        const railwayStatus = await getRailwayStatus(service.railwayService);
        await alertServiceFailure(status, railwayStatus);
        status.alerted = true;
      }
    }
  }

  // Print summary
  console.log('='.repeat(80));
  console.log('Status Summary:');
  serviceStatuses.forEach(status => {
    const icon = status.healthy ? '✅' : '❌';
    const alert = status.alerted ? ' 🚨 ALERTED' : '';
    console.log(`  ${icon} ${status.name}: ${status.consecutiveFailures} failures, ${status.consecutiveSuccesses} successes${alert}`);
  });

  console.log('='.repeat(80));
  console.log(`Next check in ${CHECK_INTERVAL / 1000} seconds...`);
}

/**
 * Check Railway deployment status
 */
async function checkRailwayDeployments() {
  try {
    const { stdout } = await execAsync('railway status --json');
    const data = JSON.parse(stdout);

    console.log('\nRailway Deployment Status:');
    data.services.edges.forEach((edge: any) => {
      const name = edge.node.name;
      const status = edge.node.serviceInstances.edges[0]?.node.latestDeployment?.status || 'UNKNOWN';

      let icon = '⏳';
      if (status === 'SUCCESS') icon = '✅';
      else if (status === 'FAILED') icon = '❌';
      else if (status === 'BUILDING' || status === 'DEPLOYING') icon = '🔄';

      console.log(`  ${icon} ${name}: ${status}`);
    });
  } catch (error) {
    console.error('Failed to check Railway status:', error);
  }
}

/**
 * Main monitoring loop
 */
async function main() {
  console.log('🚀 Starting Health Monitor...');
  console.log(`Monitoring ${SERVICES.length} services`);
  console.log(`Check interval: ${CHECK_INTERVAL / 1000}s`);
  console.log(`Failure threshold: ${FAILURE_THRESHOLD} consecutive failures`);
  console.log(`Recovery threshold: ${RECOVERY_THRESHOLD} consecutive successes`);
  console.log('='.repeat(80));

  // Initial Railway status check
  await checkRailwayDeployments();

  // Start monitoring loop
  while (true) {
    try {
      await monitorServices();
    } catch (error) {
      console.error('Error during monitoring:', error);
    }

    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down health monitor...');
  await logAlert('INFO', 'Health monitor stopped');
  process.exit(0);
});

// Start monitoring
main().catch(console.error);
