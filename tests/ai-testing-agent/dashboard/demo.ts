#!/usr/bin/env tsx

/**
 * Dashboard Demo Script
 *
 * Simulates test execution to demonstrate dashboard features:
 * - Real-time updates
 * - Pass/fail tracking
 * - Notifications
 * - Trends and analytics
 */

import axios from 'axios';

const DASHBOARD_URL = 'http://localhost:4000';
const DELAY = 1000; // 1 second between tests

interface TestScenario {
  name: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  component: string;
}

const mockTests: TestScenario[] = [
  {
    name: 'voice-chat-to-music-generation',
    duration: 3200,
    status: 'passed',
    priority: 'critical',
    component: 'voice-chat',
  },
  {
    name: 'text-chat-to-daw-control',
    duration: 1800,
    status: 'passed',
    priority: 'critical',
    component: 'text-chat',
  },
  {
    name: 'lyrics-analysis-to-music-generation',
    duration: 4500,
    status: 'passed',
    priority: 'high',
    component: 'lyrics-analysis',
  },
  {
    name: 'smart-mix-to-mastering-pipeline',
    duration: 5200,
    status: 'failed',
    error: 'Audio processing timeout after 5000ms',
    priority: 'high',
    component: 'smart-mix',
  },
  {
    name: 'vocal-coaching-real-time',
    duration: 2100,
    status: 'passed',
    priority: 'medium',
    component: 'vocal-coaching',
  },
  {
    name: 'intent-detection-accuracy',
    duration: 1500,
    status: 'passed',
    priority: 'high',
    component: 'intent-detection',
  },
  {
    name: 'multi-provider-fallback',
    duration: 3800,
    status: 'passed',
    priority: 'critical',
    component: 'multi-provider',
  },
  {
    name: 'cost-monitoring-budget-limits',
    duration: 900,
    status: 'passed',
    priority: 'medium',
    component: 'cost-monitoring',
  },
  {
    name: 'expert-music-circuit-breaker',
    duration: 1200,
    status: 'passed',
    priority: 'high',
    component: 'circuit-breaker',
  },
  {
    name: 'chat-triggers-generation',
    duration: 2800,
    status: 'failed',
    error: 'Failed to connect to generation service',
    priority: 'high',
    component: 'chat',
  },
  {
    name: 'generation-adds-to-project',
    duration: 3500,
    status: 'passed',
    priority: 'high',
    component: 'generation',
  },
  {
    name: 'voice-function-calling',
    duration: 2200,
    status: 'passed',
    priority: 'critical',
    component: 'voice',
  },
  {
    name: 'websocket-streaming',
    duration: 1800,
    status: 'passed',
    priority: 'high',
    component: 'websocket',
  },
  {
    name: 'queue-processing',
    duration: 2500,
    status: 'passed',
    priority: 'medium',
    component: 'queue',
  },
  {
    name: 'state-synchronization',
    duration: 1600,
    status: 'passed',
    priority: 'high',
    component: 'state',
  },
  {
    name: 'api-response-times',
    duration: 1100,
    status: 'passed',
    priority: 'medium',
    component: 'api',
  },
  {
    name: 'websocket-latency',
    duration: 950,
    status: 'passed',
    priority: 'medium',
    component: 'websocket',
  },
  {
    name: 'audio-processing-speed',
    duration: 4200,
    status: 'failed',
    error: 'Processing took 4.2s, expected < 3s',
    priority: 'medium',
    component: 'audio-processing',
  },
  {
    name: 'function-call-overhead',
    duration: 800,
    status: 'passed',
    priority: 'low',
    component: 'function-calling',
  },
  {
    name: 'queue-throughput',
    duration: 2300,
    status: 'passed',
    priority: 'medium',
    component: 'queue',
  },
  {
    name: 'music-generation-quality',
    duration: 6500,
    status: 'passed',
    priority: 'critical',
    component: 'music-generation',
  },
  {
    name: 'lyrics-analysis-accuracy',
    duration: 3200,
    status: 'passed',
    priority: 'high',
    component: 'lyrics-analysis',
  },
  {
    name: 'intent-detection-accuracy-v2',
    duration: 1700,
    status: 'passed',
    priority: 'high',
    component: 'intent-detection',
  },
  {
    name: 'pitch-detection-accuracy',
    duration: 2100,
    status: 'passed',
    priority: 'medium',
    component: 'pitch-detection',
  },
  {
    name: 'mix-recommendation-quality',
    duration: 4800,
    status: 'passed',
    priority: 'high',
    component: 'smart-mix',
  },
];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkDashboard(): Promise<boolean> {
  try {
    await axios.get(`${DASHBOARD_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function sendTestStarted(totalTests: number): Promise<void> {
  try {
    await axios.post(`${DASHBOARD_URL}/api/test-started`, {
      testName: 'Demo Test Suite',
      totalTests,
    });
  } catch (error) {
    console.error('Failed to send test started:', error.message);
  }
}

async function sendTestUpdate(test: TestScenario): Promise<void> {
  try {
    await axios.post(`${DASHBOARD_URL}/api/test-update`, {
      testName: test.name,
      status: test.status,
      duration: test.duration,
      error: test.error,
      priority: test.priority,
      component: test.component,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to send test update:', error.message);
  }
}

async function sendTestCompleted(
  totalTests: number,
  passed: number,
  failed: number,
  skipped: number,
  totalDuration: number
): Promise<void> {
  try {
    await axios.post(`${DASHBOARD_URL}/api/test-completed`, {
      totalTests,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to send test completed:', error.message);
  }
}

async function runDemo(): Promise<void> {
  console.log('🎯 Dashboard Demo Script\n');

  // Check if dashboard is running
  console.log('📡 Checking dashboard connection...');
  const isRunning = await checkDashboard();

  if (!isRunning) {
    console.error('❌ Dashboard is not running!');
    console.log('\nPlease start the dashboard first:');
    console.log('  npm run test:dashboard\n');
    process.exit(1);
  }

  console.log('✅ Dashboard connected!\n');
  console.log(`🌐 Dashboard: ${DASHBOARD_URL}`);
  console.log(`📊 Running ${mockTests.length} demo tests...\n`);

  // Send test started event
  await sendTestStarted(mockTests.length);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let totalDuration = 0;

  // Run each test
  for (let i = 0; i < mockTests.length; i++) {
    const test = mockTests[i];

    console.log(`[${i + 1}/${mockTests.length}] Running: ${test.name}`);

    // Send update to dashboard
    await sendTestUpdate(test);

    // Update counters
    if (test.status === 'passed') passed++;
    else if (test.status === 'failed') failed++;
    else if (test.status === 'skipped') skipped++;
    totalDuration += test.duration;

    // Show result
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
    console.log(`  ${icon} ${test.status.toUpperCase()} (${test.duration}ms)`);
    if (test.error) {
      console.log(`     Error: ${test.error}`);
    }

    // Wait before next test
    await sleep(DELAY);
  }

  // Send completion event
  await sendTestCompleted(mockTests.length, passed, failed, skipped, totalDuration);

  console.log('\n📊 Demo Complete!');
  console.log(`\n  Total Tests: ${mockTests.length}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ⏱️  Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`  📈 Pass Rate: ${((passed / mockTests.length) * 100).toFixed(1)}%`);

  console.log(`\n🌐 View results: ${DASHBOARD_URL}\n`);
}

// Run demo
runDemo().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
