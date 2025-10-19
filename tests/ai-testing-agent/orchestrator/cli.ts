#!/usr/bin/env node

/**
 * DAWG AI Testing Orchestrator CLI
 *
 * Command-line interface for managing the testing orchestrator
 */

import { MasterOrchestrator } from './master-orchestrator';
import fs from 'fs/promises';
import path from 'path';

interface CLIOptions {
  command: string;
  args: string[];
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  return {
    command,
    args: args.slice(1),
  };
}

/**
 * Load configuration
 */
async function loadConfig(): Promise<any> {
  const configPath = path.join(__dirname, 'config.json');
  const configContent = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Display help
 */
function displayHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║         DAWG AI Testing Orchestrator CLI                         ║
╚═══════════════════════════════════════════════════════════════════╝

USAGE:
  npm run orchestrator <command> [options]

COMMANDS:
  start              Start the orchestrator
  stop               Stop the orchestrator
  status             Show orchestrator status
  queue <type>       Queue a new task
  workflows          List all workflows
  workflow <name>    Execute a specific workflow
  schedules          Show all schedules
  schedule <name>    Trigger a schedule manually
  metrics            Display metrics
  history            Show execution history
  help               Display this help message

EXAMPLES:
  npm run orchestrator start
  npm run orchestrator queue test
  npm run orchestrator workflow pre-release-testing
  npm run orchestrator schedule daily-full-suite
  npm run orchestrator metrics

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY     Required for AI-powered features
  GITHUB_TOKEN       Optional for GitHub integration
  SLACK_WEBHOOK_URL  Optional for Slack notifications

DOCUMENTATION:
  See tests/ai-testing-agent/orchestrator/README.md for more details
`);
}

/**
 * Start orchestrator
 */
async function startOrchestrator(config: any): Promise<void> {
  console.log('🚀 Starting DAWG AI Testing Orchestrator...\n');

  const orchestrator = new MasterOrchestrator(config);

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n📛 Received SIGINT, shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n📛 Received SIGTERM, shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  // Listen to events
  orchestrator.on('taskQueued', (task) => {
    console.log(`📥 Task queued: ${task.id}`);
  });

  orchestrator.on('taskStarted', (task) => {
    console.log(`▶️  Task started: ${task.id}`);
  });

  orchestrator.on('taskCompleted', (task) => {
    console.log(`✅ Task completed: ${task.id}`);
  });

  orchestrator.on('taskFailed', (task) => {
    console.error(`❌ Task failed: ${task.id}`);
  });

  await orchestrator.initialize();
  await orchestrator.start();

  console.log('✅ Orchestrator is running. Press Ctrl+C to stop.\n');

  // Keep process alive
  await new Promise(() => {});
}

/**
 * Show status
 */
async function showStatus(config: any): Promise<void> {
  console.log('📊 Orchestrator Status\n');

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();

  const status = orchestrator.getStatus();
  const metrics = orchestrator.getMetrics();

  console.log('Status:');
  console.log(`  Running: ${status.isRunning ? '✅' : '❌'}`);
  console.log(`  Agent Pool: ${status.agentPool.busy}/${status.agentPool.total} busy`);
  console.log(`  Available: ${status.agentPool.available}`);
  console.log('\nTasks:');
  console.log(`  Queued: ${status.tasks.queued}`);
  console.log(`  Running: ${status.tasks.running}`);
  console.log(`  Completed: ${status.tasks.completed}`);
  console.log('\nMetrics:');
  console.log(`  Total Processed: ${metrics.totalTasksProcessed}`);
  console.log(`  Success Rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`  Avg Duration: ${(metrics.avgTaskDuration / 1000).toFixed(2)}s`);
  console.log(`  Last Run: ${metrics.lastRunTime}`);
  console.log('');
}

/**
 * Queue a task
 */
async function queueTask(config: any, type: string): Promise<void> {
  console.log(`📥 Queueing ${type} task...\n`);

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();
  await orchestrator.start();

  const taskId = await orchestrator.queueTask({
    type: type as any,
    priority: 'high',
    payload: {},
  });

  console.log(`✅ Task queued: ${taskId}\n`);

  // Wait a bit to see progress
  await new Promise(resolve => setTimeout(resolve, 5000));

  const taskStatus = orchestrator.getTaskStatus(taskId);
  console.log(`Status: ${taskStatus?.status}\n`);

  await orchestrator.stop();
}

/**
 * List workflows
 */
async function listWorkflows(config: any): Promise<void> {
  console.log('🔄 Available Workflows\n');

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();

  const workflowEngine = orchestrator.getWorkflowEngine();
  const workflows = workflowEngine.getWorkflows();

  workflows.forEach((workflow, index) => {
    console.log(`${index + 1}. ${workflow.name}`);
    console.log(`   Description: ${workflow.description}`);
    console.log(`   Trigger: ${workflow.trigger}`);
    console.log(`   Steps: ${workflow.steps.length}`);
    console.log('');
  });
}

/**
 * Execute workflow
 */
async function executeWorkflow(config: any, workflowName: string): Promise<void> {
  console.log(`🔄 Executing workflow: ${workflowName}\n`);

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();
  await orchestrator.start();

  const workflowEngine = orchestrator.getWorkflowEngine();

  try {
    const execution = await workflowEngine.executeWorkflow(workflowName, 'manual', {});

    console.log('\n📊 Workflow Execution Summary:');
    console.log(`  Status: ${execution.status}`);
    console.log(`  Duration: ${execution.endTime ? (execution.endTime.getTime() - execution.startTime.getTime()) : 'N/A'}ms`);
    console.log(`  Steps Completed: ${execution.steps.filter(s => s.status === 'completed').length}/${execution.steps.length}`);
    console.log('');

  } catch (error) {
    console.error(`❌ Workflow failed: ${error}`);
  }

  await orchestrator.stop();
}

/**
 * Show schedules
 */
async function showSchedules(config: any): Promise<void> {
  console.log('⏰ Scheduled Tasks\n');

  config.scheduler.schedules.forEach((schedule: any, index: number) => {
    console.log(`${index + 1}. ${schedule.name}`);
    console.log(`   Cron: ${schedule.cron}`);
    console.log(`   Tests: ${schedule.tests.join(', ')}`);
    console.log(`   Priority: ${schedule.priority}`);
    console.log(`   Enabled: ${schedule.enabled !== false ? '✅' : '❌'}`);
    console.log('');
  });
}

/**
 * Trigger schedule
 */
async function triggerSchedule(config: any, scheduleName: string): Promise<void> {
  console.log(`⏰ Triggering schedule: ${scheduleName}\n`);

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();
  await orchestrator.start();

  const workflowEngine = orchestrator.getWorkflowEngine();

  // Find schedule
  const schedule = config.scheduler.schedules.find((s: any) => s.name === scheduleName);

  if (!schedule) {
    console.error(`❌ Schedule not found: ${scheduleName}`);
    return;
  }

  // Queue task
  await orchestrator.queueTask({
    type: 'test',
    priority: schedule.priority || 'medium',
    payload: {
      schedule: scheduleName,
      tests: schedule.tests,
    },
  });

  console.log('✅ Schedule triggered\n');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 5000));

  await orchestrator.stop();
}

/**
 * Show metrics
 */
async function showMetrics(config: any): Promise<void> {
  console.log('📈 Orchestrator Metrics\n');

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();

  const metrics = orchestrator.getMetrics();

  console.log('Performance:');
  console.log(`  Total Tasks Processed: ${metrics.totalTasksProcessed}`);
  console.log(`  Success Rate: ${metrics.successRate.toFixed(1)}%`);
  console.log(`  Average Task Duration: ${(metrics.avgTaskDuration / 1000).toFixed(2)}s`);
  console.log('\nCurrent State:');
  console.log(`  Active Agents: ${metrics.activeAgents}`);
  console.log(`  Queued Tasks: ${metrics.queuedTasks}`);
  console.log('\nLast Run:');
  console.log(`  ${metrics.lastRunTime}`);
  console.log('');
}

/**
 * Show execution history
 */
async function showHistory(config: any): Promise<void> {
  console.log('📜 Execution History\n');

  const orchestrator = new MasterOrchestrator(config);
  await orchestrator.initialize();

  const workflowEngine = orchestrator.getWorkflowEngine();
  const executions = workflowEngine.getExecutionHistory();

  if (executions.length === 0) {
    console.log('No execution history available.\n');
    return;
  }

  executions.slice(-10).forEach((execution, index) => {
    console.log(`${index + 1}. ${execution.workflowName}`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Started: ${execution.startTime.toISOString()}`);
    if (execution.endTime) {
      console.log(`   Duration: ${execution.endTime.getTime() - execution.startTime.getTime()}ms`);
    }
    console.log('');
  });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { command, args } = parseArgs();

  try {
    const config = await loadConfig();

    switch (command) {
      case 'start':
        await startOrchestrator(config);
        break;

      case 'status':
        await showStatus(config);
        break;

      case 'queue':
        if (args.length === 0) {
          console.error('❌ Error: Please specify task type (test, analysis, fix, report)');
          process.exit(1);
        }
        await queueTask(config, args[0]);
        break;

      case 'workflows':
        await listWorkflows(config);
        break;

      case 'workflow':
        if (args.length === 0) {
          console.error('❌ Error: Please specify workflow name');
          process.exit(1);
        }
        await executeWorkflow(config, args[0]);
        break;

      case 'schedules':
        await showSchedules(config);
        break;

      case 'schedule':
        if (args.length === 0) {
          console.error('❌ Error: Please specify schedule name');
          process.exit(1);
        }
        await triggerSchedule(config, args[0]);
        break;

      case 'metrics':
        await showMetrics(config);
        break;

      case 'history':
        await showHistory(config);
        break;

      case 'help':
      default:
        displayHelp();
        break;
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main();
}
