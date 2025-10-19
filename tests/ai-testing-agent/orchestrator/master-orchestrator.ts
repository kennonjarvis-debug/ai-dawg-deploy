import { EventEmitter } from 'events';
import { DAWGTestingAgent } from '../agent';
import { GitWatcher } from './git-watcher';
import { TestScheduler } from './scheduler';
import { WorkflowEngine } from './workflow-engine';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

export interface AgentTask {
  id: string;
  type: 'test' | 'analysis' | 'fix' | 'report';
  priority: 'critical' | 'high' | 'medium' | 'low';
  payload: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
}

export interface AgentPoolConfig {
  minAgents: number;
  maxAgents: number;
  idleTimeout: number;
  taskQueueSize: number;
}

export interface OrchestratorConfig {
  agentPool: AgentPoolConfig;
  gitWatcher: {
    enabled: boolean;
    paths: string[];
    ignorePatterns: string[];
  };
  scheduler: {
    enabled: boolean;
    schedules: Array<{
      name: string;
      cron: string;
      tests: string[];
    }>;
  };
  workflow: {
    autoCreatePR: boolean;
    blockOnCriticalFailure: boolean;
    retryAttempts: number;
  };
  monitoring: {
    dashboardEnabled: boolean;
    alertingEnabled: boolean;
    metricsRetention: number;
  };
}

export interface OrchestratorMetrics {
  totalTasksProcessed: number;
  activeAgents: number;
  queuedTasks: number;
  avgTaskDuration: number;
  successRate: number;
  lastRunTime: string;
}

/**
 * Master Orchestrator
 *
 * Coordinates all testing agents and components:
 * - Agent pool management
 * - Task distribution and load balancing
 * - Git commit watching and pre-release testing
 * - Scheduled test execution
 * - Workflow automation
 * - Result aggregation and reporting
 */
export class MasterOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private openai: OpenAI;
  private agentPool: Map<string, DAWGTestingAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private runningTasks: Map<string, AgentTask> = new Map();
  private completedTasks: AgentTask[] = [];
  private gitWatcher?: GitWatcher;
  private scheduler?: TestScheduler;
  private workflowEngine: WorkflowEngine;
  private metrics: OrchestratorMetrics;
  private isRunning: boolean = false;

  constructor(config?: Partial<OrchestratorConfig>) {
    super();

    this.config = this.mergeConfig(config);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.workflowEngine = new WorkflowEngine(this);

    this.metrics = {
      totalTasksProcessed: 0,
      activeAgents: 0,
      queuedTasks: 0,
      avgTaskDuration: 0,
      successRate: 100,
      lastRunTime: new Date().toISOString(),
    };
  }

  /**
   * Initialize orchestrator and all components
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing Master Orchestrator...\n');

    // Initialize agent pool
    console.log('👥 Initializing agent pool...');
    await this.initializeAgentPool();

    // Initialize Git watcher if enabled
    if (this.config.gitWatcher.enabled) {
      console.log('👁️  Initializing Git watcher...');
      this.gitWatcher = new GitWatcher(this, this.config.gitWatcher);
      await this.gitWatcher.initialize();
    }

    // Initialize scheduler if enabled
    if (this.config.scheduler.enabled) {
      console.log('⏰ Initializing scheduler...');
      this.scheduler = new TestScheduler(this, this.config.scheduler);
      await this.scheduler.initialize();
    }

    // Initialize workflow engine
    console.log('🔄 Initializing workflow engine...');
    await this.workflowEngine.initialize();

    console.log('\n✅ Master Orchestrator initialized successfully!\n');

    this.emit('initialized');
  }

  /**
   * Start orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Orchestrator is already running');
      return;
    }

    console.log('🚀 Starting Master Orchestrator...\n');
    this.isRunning = true;

    // Start Git watcher
    if (this.gitWatcher) {
      await this.gitWatcher.start();
    }

    // Start scheduler
    if (this.scheduler) {
      await this.scheduler.start();
    }

    // Start task processor
    this.startTaskProcessor();

    console.log('✅ Master Orchestrator is running!\n');
    this.emit('started');
  }

  /**
   * Stop orchestrator
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Master Orchestrator...\n');
    this.isRunning = false;

    // Stop Git watcher
    if (this.gitWatcher) {
      await this.gitWatcher.stop();
    }

    // Stop scheduler
    if (this.scheduler) {
      await this.scheduler.stop();
    }

    // Wait for running tasks to complete
    console.log('⏳ Waiting for running tasks to complete...');
    await this.waitForRunningTasks();

    console.log('✅ Master Orchestrator stopped\n');
    this.emit('stopped');
  }

  /**
   * Initialize agent pool
   */
  private async initializeAgentPool(): Promise<void> {
    const { minAgents } = this.config.agentPool;

    for (let i = 0; i < minAgents; i++) {
      const agentId = `agent-${i + 1}`;
      const agent = new DAWGTestingAgent();
      await agent.initialize();
      this.agentPool.set(agentId, agent);
    }

    console.log(`   Created ${minAgents} agents in pool\n`);
  }

  /**
   * Queue a task for execution
   */
  async queueTask(task: Omit<AgentTask, 'id' | 'status'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullTask: AgentTask = {
      ...task,
      id: taskId,
      status: 'queued',
    };

    this.taskQueue.push(fullTask);
    this.sortTaskQueue();

    this.metrics.queuedTasks = this.taskQueue.length;

    console.log(`📥 Queued task: ${taskId} (${task.type}, ${task.priority})`);
    this.emit('taskQueued', fullTask);

    return taskId;
  }

  /**
   * Sort task queue by priority
   */
  private sortTaskQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    this.taskQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Start task processor loop
   */
  private startTaskProcessor(): void {
    const processLoop = async () => {
      while (this.isRunning) {
        await this.processTasks();
        await this.sleep(1000); // Check every second
      }
    };

    processLoop();
  }

  /**
   * Process queued tasks
   */
  private async processTasks(): Promise<void> {
    // Get available agents
    const availableAgents = this.getAvailableAgents();

    if (availableAgents.length === 0 && this.taskQueue.length > 0) {
      // Try to scale up if possible
      await this.scaleUpAgents();
    }

    // Assign tasks to available agents
    while (this.taskQueue.length > 0 && availableAgents.length > 0) {
      const task = this.taskQueue.shift()!;
      const agentId = availableAgents.shift()!;

      await this.assignTask(task, agentId);
    }

    this.metrics.queuedTasks = this.taskQueue.length;
    this.metrics.activeAgents = this.runningTasks.size;
  }

  /**
   * Get available agents (not running tasks)
   */
  private getAvailableAgents(): string[] {
    const busyAgents = new Set(
      Array.from(this.runningTasks.values()).map(t => t.assignedAgent!)
    );

    return Array.from(this.agentPool.keys()).filter(
      agentId => !busyAgents.has(agentId)
    );
  }

  /**
   * Assign task to agent
   */
  private async assignTask(task: AgentTask, agentId: string): Promise<void> {
    task.status = 'running';
    task.assignedAgent = agentId;
    task.startTime = Date.now();

    this.runningTasks.set(task.id, task);

    console.log(`🔄 Assigned task ${task.id} to ${agentId}`);
    this.emit('taskStarted', task);

    // Execute task asynchronously
    this.executeTask(task, agentId).catch(error => {
      console.error(`❌ Error executing task ${task.id}:`, error);
      this.handleTaskFailure(task, error);
    });
  }

  /**
   * Execute task with assigned agent
   */
  private async executeTask(task: AgentTask, agentId: string): Promise<void> {
    const agent = this.agentPool.get(agentId)!;

    try {
      let result: any;

      switch (task.type) {
        case 'test':
          result = await agent.run();
          break;

        case 'analysis':
          result = await this.runAnalysis(task.payload);
          break;

        case 'fix':
          result = await this.runFix(task.payload);
          break;

        case 'report':
          result = await this.generateReport(task.payload);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      await this.handleTaskSuccess(task, result);

    } catch (error) {
      await this.handleTaskFailure(task, error);
    }
  }

  /**
   * Handle task success
   */
  private async handleTaskSuccess(task: AgentTask, result: any): Promise<void> {
    task.status = 'completed';
    task.endTime = Date.now();
    task.result = result;

    this.runningTasks.delete(task.id);
    this.completedTasks.push(task);

    this.updateMetrics(task);

    console.log(`✅ Task completed: ${task.id} (${task.endTime! - task.startTime!}ms)`);
    this.emit('taskCompleted', task);

    // Trigger workflows based on task result
    await this.workflowEngine.onTaskCompleted(task);
  }

  /**
   * Handle task failure
   */
  private async handleTaskFailure(task: AgentTask, error: any): Promise<void> {
    task.status = 'failed';
    task.endTime = Date.now();
    task.error = error.message;

    this.runningTasks.delete(task.id);
    this.completedTasks.push(task);

    this.updateMetrics(task);

    console.error(`❌ Task failed: ${task.id} - ${error.message}`);
    this.emit('taskFailed', task);

    // Trigger failure workflows
    await this.workflowEngine.onTaskFailed(task);
  }

  /**
   * Update metrics
   */
  private updateMetrics(task: AgentTask): void {
    this.metrics.totalTasksProcessed++;
    this.metrics.lastRunTime = new Date().toISOString();

    // Calculate average task duration
    const completedWithDuration = this.completedTasks.filter(t => t.startTime && t.endTime);
    const totalDuration = completedWithDuration.reduce(
      (sum, t) => sum + (t.endTime! - t.startTime!),
      0
    );
    this.metrics.avgTaskDuration = totalDuration / completedWithDuration.length;

    // Calculate success rate
    const successful = this.completedTasks.filter(t => t.status === 'completed').length;
    this.metrics.successRate = (successful / this.completedTasks.length) * 100;
  }

  /**
   * Scale up agents
   */
  private async scaleUpAgents(): Promise<void> {
    const { maxAgents } = this.config.agentPool;
    const currentCount = this.agentPool.size;

    if (currentCount >= maxAgents) {
      return;
    }

    const newCount = Math.min(currentCount + 1, maxAgents);
    const agentId = `agent-${newCount}`;

    console.log(`📈 Scaling up: Creating ${agentId}`);

    const agent = new DAWGTestingAgent();
    await agent.initialize();
    this.agentPool.set(agentId, agent);

    this.emit('agentScaledUp', agentId);
  }

  /**
   * Scale down agents
   */
  private async scaleDownAgents(): Promise<void> {
    const { minAgents, idleTimeout } = this.config.agentPool;
    const currentCount = this.agentPool.size;

    if (currentCount <= minAgents) {
      return;
    }

    // Find idle agents
    const busyAgents = new Set(
      Array.from(this.runningTasks.values()).map(t => t.assignedAgent!)
    );

    const idleAgents = Array.from(this.agentPool.keys()).filter(
      agentId => !busyAgents.has(agentId)
    );

    if (idleAgents.length > 0 && currentCount > minAgents) {
      const agentId = idleAgents[idleAgents.length - 1];
      this.agentPool.delete(agentId);

      console.log(`📉 Scaling down: Removed ${agentId}`);
      this.emit('agentScaledDown', agentId);
    }
  }

  /**
   * Run analysis task
   */
  private async runAnalysis(payload: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are an expert code analysis AI. Analyze code changes and predict potential risks.',
        },
        {
          role: 'user',
          content: `Analyze these changes and predict risks:\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Run fix task
   */
  private async runFix(payload: any): Promise<any> {
    // Delegate to workflow engine
    return await this.workflowEngine.generateFix(payload);
  }

  /**
   * Generate report
   */
  private async generateReport(payload: any): Promise<any> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      completedTasks: this.completedTasks.slice(-10), // Last 10 tasks
      summary: await this.generateSummary(),
    };

    // Write report to file
    const reportDir = path.join(__dirname, '../../reports/orchestrator');
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(
      path.join(reportDir, `orchestrator-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  /**
   * Generate summary using GPT
   */
  private async generateSummary(): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are a QA reporting expert. Summarize testing results.',
        },
        {
          role: 'user',
          content: `Summarize these metrics:\n${JSON.stringify(this.metrics, null, 2)}`,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Wait for running tasks to complete
   */
  private async waitForRunningTasks(timeout: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (this.runningTasks.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn('⚠️  Timeout waiting for tasks to complete');
        break;
      }
      await this.sleep(1000);
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      metrics: this.metrics,
      agentPool: {
        total: this.agentPool.size,
        available: this.getAvailableAgents().length,
        busy: this.runningTasks.size,
      },
      tasks: {
        queued: this.taskQueue.length,
        running: this.runningTasks.size,
        completed: this.completedTasks.length,
      },
    };
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): AgentTask | null {
    return (
      this.taskQueue.find(t => t.id === taskId) ||
      this.runningTasks.get(taskId) ||
      this.completedTasks.find(t => t.id === taskId) ||
      null
    );
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config?: Partial<OrchestratorConfig>): OrchestratorConfig {
    const defaults: OrchestratorConfig = {
      agentPool: {
        minAgents: 2,
        maxAgents: 5,
        idleTimeout: 300000, // 5 minutes
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
            name: 'hourly-smoke-tests',
            cron: '0 * * * *',
            tests: ['smoke'],
          },
          {
            name: 'daily-full-suite',
            cron: '0 0 * * *',
            tests: ['all'],
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
        metricsRetention: 604800000, // 7 days
      },
    };

    return {
      ...defaults,
      ...config,
      agentPool: { ...defaults.agentPool, ...config?.agentPool },
      gitWatcher: { ...defaults.gitWatcher, ...config?.gitWatcher },
      scheduler: { ...defaults.scheduler, ...config?.scheduler },
      workflow: { ...defaults.workflow, ...config?.workflow },
      monitoring: { ...defaults.monitoring, ...config?.monitoring },
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get workflow engine
   */
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  /**
   * Get metrics
   */
  getMetrics(): OrchestratorMetrics {
    return { ...this.metrics };
  }
}
