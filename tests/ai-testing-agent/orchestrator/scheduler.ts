import { EventEmitter } from 'events';
import cron from 'node-cron';
import OpenAI from 'openai';
import type { MasterOrchestrator } from './master-orchestrator';

export interface ScheduleConfig {
  name: string;
  cron: string;
  tests: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  enabled?: boolean;
}

export interface SchedulerConfig {
  enabled: boolean;
  schedules: ScheduleConfig[];
}

export interface ScheduleExecution {
  scheduleName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  taskId?: string;
  result?: any;
  error?: string;
}

export interface SmartSchedulePrediction {
  recommendedTime: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Test Scheduler
 *
 * Manages scheduled test execution:
 * - Cron-based test scheduling
 * - Smart scheduling based on ML predictions
 * - Priority queue for test execution
 * - Resource management and optimization
 * - Historical data analysis
 * - Adaptive scheduling based on patterns
 */
export class TestScheduler extends EventEmitter {
  private orchestrator: MasterOrchestrator;
  private config: SchedulerConfig;
  private openai: OpenAI;
  private schedules: Map<string, cron.ScheduledTask> = new Map();
  private executionHistory: ScheduleExecution[] = [];
  private isRunning: boolean = false;

  constructor(orchestrator: MasterOrchestrator, config: SchedulerConfig) {
    super();
    this.orchestrator = orchestrator;
    this.config = config;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize scheduler
   */
  async initialize(): Promise<void> {
    console.log('   Setting up scheduled tasks...');

    for (const scheduleConfig of this.config.schedules) {
      if (scheduleConfig.enabled !== false) {
        this.addSchedule(scheduleConfig);
      }
    }

    console.log(`   ✓ Configured ${this.schedules.size} schedules\n`);
  }

  /**
   * Start scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log('⏰ Starting scheduler...');
    this.isRunning = true;

    // Start all schedules
    for (const [name, task] of this.schedules) {
      task.start();
      console.log(`   ✓ Started schedule: ${name}`);
    }

    console.log('   ✓ All schedules active\n');
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping scheduler...');
    this.isRunning = false;

    // Stop all schedules
    for (const [name, task] of this.schedules) {
      task.stop();
      console.log(`   ✓ Stopped schedule: ${name}`);
    }

    console.log('   ✓ All schedules stopped\n');
  }

  /**
   * Add a schedule
   */
  addSchedule(scheduleConfig: ScheduleConfig): void {
    const { name, cron: cronExpression } = scheduleConfig;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression for schedule '${name}': ${cronExpression}`);
      return;
    }

    // Create scheduled task
    const task = cron.schedule(
      cronExpression,
      async () => {
        await this.executeSchedule(scheduleConfig);
      },
      {
        scheduled: false, // Don't start immediately
      }
    );

    this.schedules.set(name, task);
    console.log(`   ✓ Added schedule: ${name} (${cronExpression})`);
  }

  /**
   * Remove a schedule
   */
  removeSchedule(name: string): void {
    const task = this.schedules.get(name);
    if (task) {
      task.stop();
      this.schedules.delete(name);
      console.log(`   ✓ Removed schedule: ${name}`);
    }
  }

  /**
   * Execute a scheduled task
   */
  private async executeSchedule(scheduleConfig: ScheduleConfig): Promise<void> {
    const execution: ScheduleExecution = {
      scheduleName: scheduleConfig.name,
      startTime: new Date(),
      status: 'running',
    };

    this.executionHistory.push(execution);

    console.log(`\n⏰ Executing schedule: ${scheduleConfig.name}`);
    console.log(`   Time: ${execution.startTime.toISOString()}`);
    console.log(`   Tests: ${scheduleConfig.tests.join(', ')}\n`);

    this.emit('scheduleStarted', execution);

    try {
      // Queue test task
      const taskId = await this.orchestrator.queueTask({
        type: 'test',
        priority: scheduleConfig.priority || 'medium',
        payload: {
          schedule: scheduleConfig.name,
          tests: scheduleConfig.tests,
          scheduled: true,
        },
      });

      execution.taskId = taskId;

      // Wait for task completion
      const result = await this.waitForTask(taskId);

      execution.endTime = new Date();
      execution.status = 'completed';
      execution.result = result;

      console.log(`✅ Schedule completed: ${scheduleConfig.name}`);
      console.log(`   Duration: ${execution.endTime.getTime() - execution.startTime.getTime()}ms\n`);

      this.emit('scheduleCompleted', execution);

      // Learn from execution for smart scheduling
      await this.learnFromExecution(execution);

    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);

      console.error(`❌ Schedule failed: ${scheduleConfig.name}`);
      console.error(`   Error: ${execution.error}\n`);

      this.emit('scheduleFailed', execution);
    }
  }

  /**
   * Wait for task to complete
   */
  private async waitForTask(taskId: string, timeout: number = 3600000): Promise<any> {
    const startTime = Date.now();

    while (true) {
      const task = this.orchestrator.getTaskStatus(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Task timeout');
      }

      await this.sleep(2000);
    }
  }

  /**
   * Learn from execution for future optimization
   */
  private async learnFromExecution(execution: ScheduleExecution): Promise<void> {
    // Analyze execution patterns
    const recentExecutions = this.executionHistory
      .filter(e => e.scheduleName === execution.scheduleName)
      .slice(-10);

    if (recentExecutions.length < 3) {
      return; // Need more data
    }

    // Calculate metrics
    const successRate = recentExecutions.filter(e => e.status === 'completed').length / recentExecutions.length;
    const avgDuration = recentExecutions
      .filter(e => e.endTime)
      .reduce((sum, e) => sum + (e.endTime!.getTime() - e.startTime.getTime()), 0) / recentExecutions.length;

    // Use ML to optimize schedule if success rate is low
    if (successRate < 0.7) {
      console.log(`📊 Low success rate (${(successRate * 100).toFixed(1)}%) for ${execution.scheduleName}`);
      console.log('   Analyzing optimal scheduling...\n');

      const prediction = await this.predictOptimalSchedule(execution.scheduleName, recentExecutions);

      console.log(`💡 Recommendation: ${prediction.reason}`);
      console.log(`   Suggested time: ${prediction.recommendedTime}\n`);

      this.emit('scheduleOptimizationSuggestion', {
        scheduleName: execution.scheduleName,
        prediction,
      });
    }
  }

  /**
   * Predict optimal schedule using ML
   */
  private async predictOptimalSchedule(
    scheduleName: string,
    executions: ScheduleExecution[]
  ): Promise<SmartSchedulePrediction> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are an expert in test scheduling optimization.
Analyze execution patterns and recommend optimal scheduling times.
Consider:
- Success rates at different times
- Resource availability
- System load patterns
- Test dependencies
- Business hours vs off-hours`,
        },
        {
          role: 'user',
          content: `Analyze these executions and recommend optimal schedule:

Schedule: ${scheduleName}
Recent Executions:
${executions.map(e => `- ${e.startTime.toISOString()}: ${e.status} (${e.endTime ? (e.endTime.getTime() - e.startTime.getTime()) + 'ms' : 'running'})`).join('\n')}

Return JSON with:
{
  "recommendedTime": "cron expression",
  "reason": "explanation",
  "priority": "critical" | "high" | "medium" | "low"
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const prediction = JSON.parse(response.choices[0].message.content || '{}');

    return {
      recommendedTime: prediction.recommendedTime || '0 * * * *',
      reason: prediction.reason || 'No specific recommendation',
      priority: prediction.priority || 'medium',
    };
  }

  /**
   * Smart schedule based on historical data and ML
   */
  async smartSchedule(testType: string): Promise<SmartSchedulePrediction> {
    // Analyze historical data
    const relevantExecutions = this.executionHistory.filter(e =>
      e.scheduleName.includes(testType.toLowerCase())
    );

    if (relevantExecutions.length === 0) {
      // No historical data, use defaults
      return {
        recommendedTime: '0 * * * *', // Every hour
        reason: 'No historical data available, using default hourly schedule',
        priority: 'medium',
      };
    }

    // Use ML to predict optimal time
    return await this.predictOptimalSchedule(testType, relevantExecutions);
  }

  /**
   * Get next execution time for a schedule
   */
  getNextExecutionTime(scheduleName: string): Date | null {
    const task = this.schedules.get(scheduleName);
    if (!task) {
      return null;
    }

    // Parse cron expression to calculate next run
    // This is a simplified version - would need a proper cron parser
    const schedule = this.config.schedules.find(s => s.name === scheduleName);
    if (!schedule) {
      return null;
    }

    // For now, return approximate next execution
    return new Date(Date.now() + 3600000); // 1 hour from now
  }

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(scheduleName?: string): ScheduleExecution[] {
    if (scheduleName) {
      return this.executionHistory.filter(e => e.scheduleName === scheduleName);
    }
    return [...this.executionHistory];
  }

  /**
   * Get schedule statistics
   */
  getScheduleStats(scheduleName: string): any {
    const executions = this.getExecutionHistory(scheduleName);

    if (executions.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        avgDuration: 0,
        lastExecution: null,
      };
    }

    const successful = executions.filter(e => e.status === 'completed').length;
    const durations = executions
      .filter(e => e.endTime)
      .map(e => e.endTime!.getTime() - e.startTime.getTime());

    return {
      totalExecutions: executions.length,
      successRate: (successful / executions.length) * 100,
      avgDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      lastExecution: executions[executions.length - 1],
    };
  }

  /**
   * Manually trigger a schedule
   */
  async triggerSchedule(scheduleName: string): Promise<void> {
    const schedule = this.config.schedules.find(s => s.name === scheduleName);

    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleName}`);
    }

    console.log(`🔄 Manually triggering schedule: ${scheduleName}`);
    await this.executeSchedule(schedule);
  }

  /**
   * Update schedule configuration
   */
  updateSchedule(scheduleName: string, updates: Partial<ScheduleConfig>): void {
    const schedule = this.config.schedules.find(s => s.name === scheduleName);

    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleName}`);
    }

    // Update config
    Object.assign(schedule, updates);

    // Recreate cron task if cron expression changed
    if (updates.cron) {
      this.removeSchedule(scheduleName);
      this.addSchedule(schedule);

      if (this.isRunning) {
        const task = this.schedules.get(scheduleName);
        task?.start();
      }
    }

    console.log(`✓ Updated schedule: ${scheduleName}`);
  }

  /**
   * Get optimal test time based on resource availability
   */
  async getOptimalTestTime(testType: string, duration: number): Promise<Date> {
    // Analyze current system load
    const metrics = this.orchestrator.getMetrics();
    const status = this.orchestrator.getStatus();

    // Use ML to predict optimal time
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in resource scheduling. Recommend optimal test execution times.',
        },
        {
          role: 'user',
          content: `Find optimal time for this test:

Test Type: ${testType}
Duration: ${duration}s
Current System Status:
- Active agents: ${status.agentPool.busy}/${status.agentPool.total}
- Queued tasks: ${status.tasks.queued}
- Current time: ${new Date().toISOString()}

Recommend execution time in next 24 hours.
Return JSON: {"recommendedTime": "ISO timestamp", "reason": "explanation"}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return new Date(result.recommendedTime || Date.now() + 3600000);
  }

  /**
   * Create a dynamic schedule based on conditions
   */
  async createDynamicSchedule(
    name: string,
    condition: () => Promise<boolean>,
    tests: string[],
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    // Check condition periodically
    const checkInterval = 60000; // 1 minute

    const task = cron.schedule('* * * * *', async () => {
      if (await condition()) {
        console.log(`🎯 Dynamic schedule triggered: ${name}`);

        await this.executeSchedule({
          name,
          cron: '* * * * *',
          tests,
          priority,
        });
      }
    });

    this.schedules.set(name, task);

    if (this.isRunning) {
      task.start();
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all schedules
   */
  getSchedules(): ScheduleConfig[] {
    return [...this.config.schedules];
  }

  /**
   * Get scheduler status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      activeSchedules: this.schedules.size,
      totalExecutions: this.executionHistory.length,
      recentExecutions: this.executionHistory.slice(-5),
    };
  }
}
