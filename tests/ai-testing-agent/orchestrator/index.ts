/**
 * DAWG AI Testing Orchestrator
 *
 * Main entry point for the orchestration system
 */

export { MasterOrchestrator } from './master-orchestrator';
export { GitWatcher } from './git-watcher';
export { TestScheduler } from './scheduler';
export { WorkflowEngine } from './workflow-engine';

export type {
  AgentTask,
  AgentPoolConfig,
  OrchestratorConfig,
  OrchestratorMetrics,
} from './master-orchestrator';

export type {
  GitChange,
  CommitInfo,
  ChangeImpact,
  GitWatcherConfig,
} from './git-watcher';

export type {
  ScheduleConfig,
  SchedulerConfig,
  ScheduleExecution,
  SmartSchedulePrediction,
} from './scheduler';

export type {
  WorkflowStep,
  WorkflowDefinition,
  WorkflowContext,
  WorkflowExecution,
} from './workflow-engine';
