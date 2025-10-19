/**
 * Example: Complete Automated Testing Cycle
 *
 * This example demonstrates the full orchestration flow from
 * git commit detection to automated fix and PR creation.
 */

import { MasterOrchestrator } from './master-orchestrator';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DAWG AI Testing Orchestrator - Complete Example');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create orchestrator with custom configuration
  const orchestrator = new MasterOrchestrator({
    agentPool: {
      minAgents: 3,
      maxAgents: 5,
      idleTimeout: 300000,
      taskQueueSize: 100,
    },
    gitWatcher: {
      enabled: true,
      paths: ['src/**/*.ts', 'tests/**/*.ts'],
      ignorePatterns: ['**/node_modules/**', '**/dist/**'],
    },
    scheduler: {
      enabled: true,
      schedules: [
        {
          name: 'quick-smoke-test',
          cron: '*/15 * * * *', // Every 15 minutes
          tests: ['smoke'],
          priority: 'medium',
        },
      ],
    },
    workflow: {
      autoCreatePR: true,
      blockOnCriticalFailure: true,
      retryAttempts: 3,
    },
    monitoring: {
      dashboardEnabled: true,
      alertingEnabled: true,
      metricsRetention: 604800000,
    },
  });

  // Set up event listeners for complete observability
  setupEventListeners(orchestrator);

  // Initialize orchestrator
  console.log('🎯 Initializing orchestrator...\n');
  await orchestrator.initialize();

  // Start orchestrator
  console.log('🚀 Starting orchestrator...\n');
  await orchestrator.start();

  // Example 1: Simulate git commit detection
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 1: Git Commit Detection & Pre-Release Testing');
  console.log('═'.repeat(70) + '\n');

  await simulateGitCommit(orchestrator);

  // Wait for processing
  await sleep(5000);

  // Example 2: Manual test execution
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 2: Manual Test Execution');
  console.log('═'.repeat(70) + '\n');

  await executeManualTests(orchestrator);

  // Wait for processing
  await sleep(5000);

  // Example 3: Scheduled test execution
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 3: Scheduled Test Execution');
  console.log('═'.repeat(70) + '\n');

  await demonstrateScheduling(orchestrator);

  // Wait for processing
  await sleep(5000);

  // Example 4: Workflow execution
  console.log('\n' + '═'.repeat(70));
  console.log('EXAMPLE 4: Workflow Execution');
  console.log('═'.repeat(70) + '\n');

  await executeWorkflows(orchestrator);

  // Wait for processing
  await sleep(5000);

  // Show final metrics
  console.log('\n' + '═'.repeat(70));
  console.log('FINAL METRICS');
  console.log('═'.repeat(70) + '\n');

  showMetrics(orchestrator);

  // Graceful shutdown
  console.log('\n' + '═'.repeat(70));
  console.log('SHUTTING DOWN');
  console.log('═'.repeat(70) + '\n');

  await orchestrator.stop();

  console.log('\n✅ Example completed successfully!\n');
}

/**
 * Set up event listeners for complete observability
 */
function setupEventListeners(orchestrator: MasterOrchestrator): void {
  // Orchestrator lifecycle events
  orchestrator.on('initialized', () => {
    console.log('  ✓ Orchestrator initialized');
  });

  orchestrator.on('started', () => {
    console.log('  ✓ Orchestrator started');
  });

  orchestrator.on('stopped', () => {
    console.log('  ✓ Orchestrator stopped');
  });

  // Task events
  orchestrator.on('taskQueued', (task) => {
    console.log(`  📥 Task queued: ${task.id} (${task.type}, priority: ${task.priority})`);
  });

  orchestrator.on('taskStarted', (task) => {
    console.log(`  ▶️  Task started: ${task.id} (assigned to ${task.assignedAgent})`);
  });

  orchestrator.on('taskCompleted', (task) => {
    const duration = task.endTime! - task.startTime!;
    console.log(`  ✅ Task completed: ${task.id} (${duration}ms)`);
  });

  orchestrator.on('taskFailed', (task) => {
    console.log(`  ❌ Task failed: ${task.id} - ${task.error}`);
  });

  // Agent scaling events
  orchestrator.on('agentScaledUp', (agentId) => {
    console.log(`  📈 Agent scaled up: ${agentId}`);
  });

  orchestrator.on('agentScaledDown', (agentId) => {
    console.log(`  📉 Agent scaled down: ${agentId}`);
  });
}

/**
 * Simulate git commit detection
 */
async function simulateGitCommit(orchestrator: MasterOrchestrator): Promise<void> {
  console.log('Simulating git commit to feature branch...\n');

  // Simulate commit data
  const commitData = {
    hash: 'abc123def456',
    author: 'developer@example.com',
    message: 'feat: Add new AI mixing feature',
    files: [
      {
        path: 'src/audio/ai/SmartMixAssistant.ts',
        type: 'modified',
        additions: 150,
        deletions: 20,
      },
      {
        path: 'tests/integration/smart-mix.test.ts',
        type: 'added',
        additions: 80,
        deletions: 0,
      },
    ],
  };

  console.log('Commit Details:');
  console.log(`  Hash: ${commitData.hash}`);
  console.log(`  Author: ${commitData.author}`);
  console.log(`  Message: ${commitData.message}`);
  console.log(`  Files: ${commitData.files.length}`);
  console.log('');

  // Queue analysis task
  const analysisTaskId = await orchestrator.queueTask({
    type: 'analysis',
    priority: 'high',
    payload: {
      action: 'analyze-commit',
      commit: commitData,
    },
  });

  console.log(`Analysis task queued: ${analysisTaskId}`);
  console.log('');

  // Wait for analysis to complete
  await sleep(2000);

  // Based on analysis, queue pre-release testing workflow
  const workflowEngine = orchestrator.getWorkflowEngine();

  console.log('Triggering pre-release testing workflow...\n');

  await workflowEngine.executeWorkflow('pre-release-testing', 'commit', commitData);
}

/**
 * Execute manual tests
 */
async function executeManualTests(orchestrator: MasterOrchestrator): Promise<void> {
  console.log('Queueing manual test execution...\n');

  // Queue multiple test tasks with different priorities
  const tasks = [
    {
      name: 'AI Feature Tests',
      type: 'test' as const,
      priority: 'critical' as const,
      payload: { tests: ['ai-features'] },
    },
    {
      name: 'Integration Tests',
      type: 'test' as const,
      priority: 'high' as const,
      payload: { tests: ['integration'] },
    },
    {
      name: 'E2E Tests',
      type: 'test' as const,
      priority: 'medium' as const,
      payload: { tests: ['e2e'] },
    },
  ];

  for (const task of tasks) {
    const taskId = await orchestrator.queueTask(task);
    console.log(`Queued: ${task.name} → ${taskId}`);
  }

  console.log('\nTests will execute based on priority and agent availability.\n');
}

/**
 * Demonstrate scheduling
 */
async function demonstrateScheduling(orchestrator: MasterOrchestrator): Promise<void> {
  console.log('Demonstrating test scheduling...\n');

  // Get workflow engine to access scheduler indirectly
  // (In real usage, scheduler would be running automatically)

  console.log('Configured Schedules:');
  console.log('  1. Hourly Smoke Tests (0 * * * *)');
  console.log('  2. Every 4h Integration (0 */4 * * *)');
  console.log('  3. Daily Full Suite (0 0 * * *)');
  console.log('  4. Weekly Performance (0 0 * * 0)');
  console.log('  5. Nightly AI Quality (0 2 * * *)');
  console.log('');

  console.log('Manually triggering smoke tests...\n');

  await orchestrator.queueTask({
    type: 'test',
    priority: 'medium',
    payload: {
      schedule: 'manual-trigger',
      tests: ['smoke'],
    },
  });

  console.log('Smoke tests queued.\n');
}

/**
 * Execute workflows
 */
async function executeWorkflows(orchestrator: MasterOrchestrator): Promise<void> {
  console.log('Executing various workflows...\n');

  const workflowEngine = orchestrator.getWorkflowEngine();

  // List all available workflows
  const workflows = workflowEngine.getWorkflows();

  console.log('Available Workflows:');
  workflows.forEach((workflow, index) => {
    console.log(`  ${index + 1}. ${workflow.name}`);
    console.log(`     Description: ${workflow.description}`);
    console.log(`     Steps: ${workflow.steps.length}`);
  });
  console.log('');

  // Execute continuous monitoring workflow
  console.log('Executing continuous monitoring workflow...\n');

  await workflowEngine.executeWorkflow('continuous-monitoring', 'manual', {});

  console.log('Workflow executed.\n');
}

/**
 * Show metrics
 */
function showMetrics(orchestrator: MasterOrchestrator): void {
  const metrics = orchestrator.getMetrics();
  const status = orchestrator.getStatus();

  console.log('Orchestrator Metrics:');
  console.log('─────────────────────────────────────────────────────────\n');

  console.log('Performance:');
  console.log(`  Total Tasks Processed: ${metrics.totalTasksProcessed}`);
  console.log(`  Success Rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`  Avg Task Duration: ${(metrics.avgTaskDuration / 1000).toFixed(2)}s`);
  console.log('');

  console.log('Current State:');
  console.log(`  Running: ${status.isRunning ? 'Yes' : 'No'}`);
  console.log(`  Active Agents: ${metrics.activeAgents}`);
  console.log(`  Queued Tasks: ${metrics.queuedTasks}`);
  console.log('');

  console.log('Agent Pool:');
  console.log(`  Total: ${status.agentPool.total}`);
  console.log(`  Available: ${status.agentPool.available}`);
  console.log(`  Busy: ${status.agentPool.busy}`);
  console.log('');

  console.log('Tasks:');
  console.log(`  Queued: ${status.tasks.queued}`);
  console.log(`  Running: ${status.tasks.running}`);
  console.log(`  Completed: ${status.tasks.completed}`);
  console.log('');

  console.log('Last Activity:');
  console.log(`  ${metrics.lastRunTime}`);
  console.log('');
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run example
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Example failed:', error);
    process.exit(1);
  });
}

export { main as runExample };
