#!/usr/bin/env tsx

/**
 * Metrics Collector Service
 *
 * Starts the metrics collector to monitor system health and publish
 * metrics.tick events every 30 seconds.
 *
 * Usage:
 *   npm run metrics:start
 *   or
 *   tsx scripts/start-metrics-collector.ts
 */

import { getMetricsCollector } from '../src/core/metricsCollector';

async function main() {
  console.log('🎯 Starting Metrics Collector...');

  const collector = getMetricsCollector();

  // Start collecting metrics
  await collector.start();

  console.log('✅ Metrics Collector started successfully');
  console.log('📊 Publishing metrics.tick events every 30 seconds');
  console.log('🔍 Monitoring:');
  console.log('   - Journey completion rates');
  console.log('   - AI feedback latency');
  console.log('   - Recording durations');
  console.log('   - System errors');
  console.log('\nPress Ctrl+C to stop\n');

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down Metrics Collector...');
    await collector.stop();
    console.log('✅ Metrics Collector stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Shutting down Metrics Collector...');
    await collector.stop();
    console.log('✅ Metrics Collector stopped');
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('❌ Failed to start Metrics Collector:', error);
  process.exit(1);
});
