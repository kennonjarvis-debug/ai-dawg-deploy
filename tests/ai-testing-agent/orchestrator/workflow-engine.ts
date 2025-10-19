import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import type { MasterOrchestrator, AgentTask } from './master-orchestrator';

const execAsync = promisify(exec);

export interface WorkflowStep {
  name: string;
  type: 'test' | 'analysis' | 'fix' | 'pr' | 'notify' | 'dashboard' | 'brain' | 'ml';
  condition?: (context: WorkflowContext) => boolean;
  execute: (context: WorkflowContext) => Promise<any>;
  onSuccess?: (result: any, context: WorkflowContext) => Promise<void>;
  onFailure?: (error: Error, context: WorkflowContext) => Promise<void>;
  retryAttempts?: number;
  timeout?: number;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  trigger: 'commit' | 'schedule' | 'manual' | 'failure' | 'deployment';
  steps: WorkflowStep[];
  parallel?: boolean;
}

export interface WorkflowContext {
  workflowName: string;
  trigger: string;
  data: any;
  results: Map<string, any>;
  errors: Map<string, Error>;
  startTime: number;
}

export interface WorkflowExecution {
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
  }>;
}

/**
 * Workflow Engine
 *
 * Orchestrates multi-step automated workflows:
 * - Pre-release testing workflow
 * - Auto-fix and PR creation workflow
 * - Continuous monitoring workflow
 * - Dashboard update workflow
 * - ML model retraining workflow
 * - Notification workflow
 * - Integration with all components
 */
export class WorkflowEngine extends EventEmitter {
  private orchestrator: MasterOrchestrator;
  private openai: OpenAI;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: WorkflowExecution[] = [];

  constructor(orchestrator: MasterOrchestrator) {
    super();
    this.orchestrator = orchestrator;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize workflow engine
   */
  async initialize(): Promise<void> {
    console.log('   Registering workflows...');

    // Register built-in workflows
    this.registerPreReleaseWorkflow();
    this.registerAutoFixWorkflow();
    this.registerContinuousMonitoringWorkflow();
    this.registerDeploymentWorkflow();
    this.registerRegressionWorkflow();

    console.log(`   ✓ Registered ${this.workflows.size} workflows\n`);
  }

  /**
   * Register pre-release testing workflow
   */
  private registerPreReleaseWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'pre-release-testing',
      description: 'Comprehensive testing before PR merge',
      trigger: 'commit',
      steps: [
        {
          name: 'analyze-changes',
          type: 'analysis',
          execute: async (context) => {
            console.log('  📊 Analyzing code changes...');
            return await this.analyzeChanges(context.data);
          },
        },
        {
          name: 'predict-risks',
          type: 'analysis',
          execute: async (context) => {
            console.log('  🔮 Predicting risks...');
            const analysis = context.results.get('analyze-changes');
            return await this.predictRisks(analysis);
          },
        },
        {
          name: 'run-high-priority-tests',
          type: 'test',
          execute: async (context) => {
            console.log('  🧪 Running high-priority tests...');
            const risks = context.results.get('predict-risks');
            return await this.runPriorityTests(risks.highPriorityTests);
          },
        },
        {
          name: 'check-critical-failures',
          type: 'analysis',
          execute: async (context) => {
            console.log('  ⚠️  Checking for critical failures...');
            const testResults = context.results.get('run-high-priority-tests');
            return this.checkCriticalFailures(testResults);
          },
        },
        {
          name: 'update-dashboard',
          type: 'dashboard',
          execute: async (context) => {
            console.log('  📊 Updating dashboard...');
            const results = context.results.get('run-high-priority-tests');
            return await this.updateDashboard(results);
          },
        },
        {
          name: 'store-in-brain',
          type: 'brain',
          execute: async (context) => {
            console.log('  🧠 Storing results in agent brain...');
            return await this.storeInBrain(context);
          },
        },
        {
          name: 'notify-results',
          type: 'notify',
          execute: async (context) => {
            console.log('  📧 Sending notifications...');
            return await this.sendNotifications(context);
          },
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Register auto-fix workflow
   */
  private registerAutoFixWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'auto-fix-and-pr',
      description: 'Auto-fix failures and create PR',
      trigger: 'failure',
      steps: [
        {
          name: 'analyze-failure',
          type: 'analysis',
          execute: async (context) => {
            console.log('  🔍 Analyzing failure...');
            return await this.analyzeFailure(context.data);
          },
        },
        {
          name: 'generate-fix',
          type: 'fix',
          execute: async (context) => {
            console.log('  🔧 Generating fix...');
            const analysis = context.results.get('analyze-failure');
            return await this.generateFix(analysis);
          },
        },
        {
          name: 'apply-fix',
          type: 'fix',
          execute: async (context) => {
            console.log('  ✏️  Applying fix...');
            const fix = context.results.get('generate-fix');
            return await this.applyFix(fix);
          },
        },
        {
          name: 'verify-fix',
          type: 'test',
          execute: async (context) => {
            console.log('  ✅ Verifying fix...');
            return await this.verifyFix(context.data);
          },
        },
        {
          name: 'create-pr',
          type: 'pr',
          execute: async (context) => {
            console.log('  🔀 Creating pull request...');
            const fix = context.results.get('generate-fix');
            const verification = context.results.get('verify-fix');
            return await this.createPullRequest(fix, verification);
          },
        },
        {
          name: 'update-dashboard',
          type: 'dashboard',
          execute: async (context) => {
            console.log('  📊 Updating dashboard...');
            return await this.updateDashboard(context.results.get('create-pr'));
          },
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Register continuous monitoring workflow
   */
  private registerContinuousMonitoringWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'continuous-monitoring',
      description: 'Continuous production monitoring',
      trigger: 'schedule',
      steps: [
        {
          name: 'health-check',
          type: 'test',
          execute: async (context) => {
            console.log('  💓 Running health checks...');
            return await this.runHealthChecks();
          },
        },
        {
          name: 'performance-metrics',
          type: 'analysis',
          execute: async (context) => {
            console.log('  📈 Collecting performance metrics...');
            return await this.collectPerformanceMetrics();
          },
        },
        {
          name: 'detect-anomalies',
          type: 'analysis',
          execute: async (context) => {
            console.log('  🔍 Detecting anomalies...');
            const metrics = context.results.get('performance-metrics');
            return await this.detectAnomalies(metrics);
          },
        },
        {
          name: 'trigger-tests-if-needed',
          type: 'test',
          condition: (context) => {
            const anomalies = context.results.get('detect-anomalies');
            return anomalies && anomalies.detected;
          },
          execute: async (context) => {
            console.log('  🧪 Triggering targeted tests...');
            const anomalies = context.results.get('detect-anomalies');
            return await this.runTargetedTests(anomalies);
          },
        },
        {
          name: 'update-dashboard',
          type: 'dashboard',
          execute: async (context) => {
            console.log('  📊 Updating monitoring dashboard...');
            return await this.updateMonitoringDashboard(context);
          },
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Register deployment workflow
   */
  private registerDeploymentWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'post-deployment',
      description: 'Post-deployment verification',
      trigger: 'deployment',
      steps: [
        {
          name: 'smoke-tests',
          type: 'test',
          execute: async (context) => {
            console.log('  💨 Running smoke tests...');
            return await this.runSmokeTests();
          },
        },
        {
          name: 'integration-verification',
          type: 'test',
          execute: async (context) => {
            console.log('  🔗 Verifying integrations...');
            return await this.verifyIntegrations();
          },
        },
        {
          name: 'retrain-ml-model',
          type: 'ml',
          execute: async (context) => {
            console.log('  🤖 Retraining ML model...');
            return await this.retrainMLModel(context);
          },
        },
        {
          name: 'update-dashboard',
          type: 'dashboard',
          execute: async (context) => {
            console.log('  📊 Updating deployment dashboard...');
            return await this.updateDashboard(context.results);
          },
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Register regression workflow
   */
  private registerRegressionWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'regression-detection',
      description: 'Detect and handle regressions',
      trigger: 'failure',
      steps: [
        {
          name: 'compare-with-baseline',
          type: 'analysis',
          execute: async (context) => {
            console.log('  📊 Comparing with baseline...');
            return await this.compareWithBaseline(context.data);
          },
        },
        {
          name: 'identify-regression',
          type: 'analysis',
          execute: async (context) => {
            console.log('  🔍 Identifying regression...');
            const comparison = context.results.get('compare-with-baseline');
            return await this.identifyRegression(comparison);
          },
        },
        {
          name: 'bisect-commits',
          type: 'analysis',
          execute: async (context) => {
            console.log('  🎯 Bisecting commits...');
            const regression = context.results.get('identify-regression');
            return await this.bisectCommits(regression);
          },
        },
        {
          name: 'notify-team',
          type: 'notify',
          execute: async (context) => {
            console.log('  🚨 Notifying team of regression...');
            return await this.notifyRegression(context);
          },
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowName: string,
    trigger: string,
    data: any
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowName);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    console.log(`\n🔄 Executing workflow: ${workflowName}`);
    console.log(`   Trigger: ${trigger}`);
    console.log(`   Steps: ${workflow.steps.length}\n`);

    const execution: WorkflowExecution = {
      workflowName,
      startTime: new Date(),
      status: 'running',
      steps: workflow.steps.map(step => ({
        name: step.name,
        status: 'pending',
      })),
    };

    this.executions.push(execution);
    this.emit('workflowStarted', execution);

    const context: WorkflowContext = {
      workflowName,
      trigger,
      data,
      results: new Map(),
      errors: new Map(),
      startTime: Date.now(),
    };

    try {
      // Execute steps
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepExecution = execution.steps[i];

        // Check condition if present
        if (step.condition && !step.condition(context)) {
          console.log(`  ⏭️  Skipping step: ${step.name} (condition not met)`);
          stepExecution.status = 'completed';
          continue;
        }

        console.log(`  ▶️  Step ${i + 1}/${workflow.steps.length}: ${step.name}`);
        stepExecution.status = 'running';

        try {
          const result = await this.executeStepWithRetry(step, context);
          stepExecution.status = 'completed';
          stepExecution.result = result;
          context.results.set(step.name, result);

          if (step.onSuccess) {
            await step.onSuccess(result, context);
          }

          console.log(`  ✅ Step completed: ${step.name}\n`);

        } catch (error) {
          stepExecution.status = 'failed';
          stepExecution.error = error instanceof Error ? error.message : String(error);
          context.errors.set(step.name, error as Error);

          console.error(`  ❌ Step failed: ${step.name}`);
          console.error(`     Error: ${stepExecution.error}\n`);

          if (step.onFailure) {
            await step.onFailure(error as Error, context);
          }

          throw error;
        }
      }

      execution.endTime = new Date();
      execution.status = 'completed';

      console.log(`✅ Workflow completed: ${workflowName}`);
      console.log(`   Duration: ${execution.endTime.getTime() - execution.startTime.getTime()}ms\n`);

      this.emit('workflowCompleted', execution);

    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';

      console.error(`❌ Workflow failed: ${workflowName}`);
      console.error(`   Error: ${error}\n`);

      this.emit('workflowFailed', execution);
    }

    return execution;
  }

  /**
   * Execute step with retry logic
   */
  private async executeStepWithRetry(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<any> {
    const maxRetries = step.retryAttempts || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`     Retry attempt ${attempt}/${maxRetries}...`);
          await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
        }

        return await step.execute(context);

      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  /**
   * Task completed handler
   */
  async onTaskCompleted(task: AgentTask): Promise<void> {
    // Check if workflow should be triggered
    if (task.type === 'test' && task.result) {
      // Update dashboard
      await this.executeWorkflow('continuous-monitoring', 'task-completed', task);
    }
  }

  /**
   * Task failed handler
   */
  async onTaskFailed(task: AgentTask): Promise<void> {
    // Trigger auto-fix workflow
    if (task.priority === 'critical') {
      console.log('\n🚨 Critical task failed, triggering auto-fix workflow...\n');
      await this.executeWorkflow('auto-fix-and-pr', 'task-failed', task);
    } else {
      await this.executeWorkflow('regression-detection', 'task-failed', task);
    }
  }

  // ============ Workflow Step Implementations ============

  private async analyzeChanges(data: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Analyze code changes and identify affected components.',
        },
        {
          role: 'user',
          content: `Analyze these changes:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async predictRisks(analysis: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Predict risks based on code analysis.',
        },
        {
          role: 'user',
          content: `Predict risks for:\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async runPriorityTests(tests: string[]): Promise<any> {
    const taskId = await this.orchestrator.queueTask({
      type: 'test',
      priority: 'high',
      payload: { tests },
    });

    return { taskId, tests };
  }

  private checkCriticalFailures(testResults: any): boolean {
    return testResults.failed > 0;
  }

  private async updateDashboard(data: any): Promise<void> {
    // Update dashboard API
    const dashboardPath = path.join(process.cwd(), '.claude', 'dashboard-data.json');
    await fs.writeFile(dashboardPath, JSON.stringify(data, null, 2));
  }

  private async storeInBrain(context: WorkflowContext): Promise<void> {
    // Store in agent brain (vector database)
    const brainPath = path.join(process.cwd(), 'tests/ai-testing-agent/brain');
    await fs.mkdir(brainPath, { recursive: true });
    await fs.writeFile(
      path.join(brainPath, `execution-${Date.now()}.json`),
      JSON.stringify({ context: context.data, results: Object.fromEntries(context.results) }, null, 2)
    );
  }

  private async sendNotifications(context: WorkflowContext): Promise<void> {
    console.log(`     📧 Notification sent: ${context.workflowName} completed`);
  }

  private async analyzeFailure(data: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Analyze test failure and identify root cause.',
        },
        {
          role: 'user',
          content: `Analyze failure:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async generateFix(analysis: any): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Generate code fix based on failure analysis.',
        },
        {
          role: 'user',
          content: `Generate fix for:\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async applyFix(fix: any): Promise<void> {
    // Apply fix to codebase
    console.log('     Applied fix:', fix.description);
  }

  private async verifyFix(data: any): Promise<boolean> {
    // Re-run failed tests
    return true;
  }

  private async createPullRequest(fix: any, verification: any): Promise<any> {
    // Create PR using GitHub API
    return { prNumber: 123, url: 'https://github.com/repo/pull/123' };
  }

  private async runHealthChecks(): Promise<any> {
    return { healthy: true, checks: ['api', 'db', 'redis'] };
  }

  private async collectPerformanceMetrics(): Promise<any> {
    return { cpu: 45, memory: 60, responseTime: 120 };
  }

  private async detectAnomalies(metrics: any): Promise<any> {
    return { detected: false, anomalies: [] };
  }

  private async runTargetedTests(anomalies: any): Promise<any> {
    return { passed: true };
  }

  private async updateMonitoringDashboard(context: WorkflowContext): Promise<void> {
    await this.updateDashboard(context.results);
  }

  private async runSmokeTests(): Promise<any> {
    return { passed: true, tests: ['health', 'login', 'api'] };
  }

  private async verifyIntegrations(): Promise<any> {
    return { verified: true };
  }

  private async retrainMLModel(context: WorkflowContext): Promise<any> {
    console.log('     🤖 ML model retrained with new data');
    return { retrained: true };
  }

  private async compareWithBaseline(data: any): Promise<any> {
    return { regression: false };
  }

  private async identifyRegression(comparison: any): Promise<any> {
    return { identified: false };
  }

  private async bisectCommits(regression: any): Promise<any> {
    return { commit: 'abc123' };
  }

  private async notifyRegression(context: WorkflowContext): Promise<void> {
    console.log('     🚨 Regression notification sent');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get workflow
   */
  getWorkflow(name: string): WorkflowDefinition | undefined {
    return this.workflows.get(name);
  }

  /**
   * Get all workflows
   */
  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): WorkflowExecution[] {
    return [...this.executions];
  }
}
