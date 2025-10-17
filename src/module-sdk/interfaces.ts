/**
 * Module SDK Interfaces
 *
 * Clean, Jarvis-agnostic interfaces for DAWG AI modules
 * This SDK allows modules to run independently without Jarvis controller
 */

import { Router } from 'express';

/**
 * Core Module Interface
 * All DAWG AI modules must implement this interface
 */
export interface Module {
  /** Unique module identifier */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Human-readable module description */
  description: string;

  /**
   * Execute a command on this module
   * @param command - Command name to execute
   * @param params - Command-specific parameters
   * @returns Promise<ModuleResponse> with execution result
   */
  execute(command: string, params: any): Promise<ModuleResponse>;

  /**
   * Get current health status of the module
   * @returns Promise<HealthStatus> with health information
   */
  health(): Promise<HealthStatus>;

  /**
   * Initialize the module
   * Called during module registration
   */
  initialize?(): Promise<void>;

  /**
   * Shutdown the module gracefully
   * Called during system shutdown
   */
  shutdown?(): Promise<void>;

  /**
   * Register Express routes for this module (optional)
   * Routes will be mounted under /api/v1/modules/{module-name}/
   */
  registerRoutes?(router: Router): void;

  /**
   * Get scheduled jobs for this module (optional)
   * @returns Array of job definitions
   */
  getScheduledJobs?(): ScheduledJob[];
}

/**
 * Standard response format for all module executions
 */
export interface ModuleResponse {
  /** Whether the execution was successful */
  success: boolean;

  /** Result data if successful */
  data?: any;

  /** Error message if failed */
  error?: string;

  /** Execution time in milliseconds */
  executionTime: number;

  /** Additional metadata */
  metadata?: {
    /** Module that executed the command */
    module: string;

    /** Execution timestamp */
    timestamp: Date;

    /** Additional metadata fields */
    [key: string]: any;
  };
}

/**
 * Health check response format
 */
export interface HealthStatus {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Individual health checks */
  checks: HealthCheck[];

  /** Module uptime in milliseconds */
  uptime?: number;

  /** Last health check timestamp */
  lastCheck?: Date;

  /** Additional health details */
  details?: Record<string, any>;
}

/**
 * Individual health check result
 */
export interface HealthCheck {
  /** Check name */
  name: string;

  /** Check status */
  status: 'pass' | 'fail' | 'warn';

  /** Human-readable message */
  message?: string;

  /** Check-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Scheduled job definition
 */
export interface ScheduledJob {
  /** Unique job identifier */
  id: string;

  /** Job name for logging */
  name: string;

  /** Cron expression (e.g., "0 9 * * *" for daily at 9 AM) */
  schedule: string;

  /** Job execution function */
  handler: () => Promise<void>;

  /** Whether the job is enabled */
  enabled: boolean;

  /** Job description */
  description?: string;

  /** Timezone for schedule (default: UTC) */
  timezone?: string;

  /** Retry configuration */
  retry?: {
    /** Maximum retry attempts */
    maxAttempts: number;

    /** Delay between retries in milliseconds */
    delayMs: number;
  };
}

/**
 * Module logger interface
 * Provides consistent logging across all modules
 */
export interface ModuleLogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

/**
 * Module context provided during initialization
 * Contains module-specific configuration and utilities
 */
export interface ModuleContext {
  /** Module-specific logger */
  logger: ModuleLogger;

  /** Module configuration */
  config?: ModuleConfig;

  /** Emit an event to other modules (optional) */
  emit?(event: string, data: any): void;

  /** Subscribe to events from other modules (optional) */
  on?(event: string, handler: (data: any) => void): void;
}

/**
 * Module configuration
 */
export interface ModuleConfig {
  /** Whether the module is enabled */
  enabled: boolean;

  /** Module priority (lower numbers = higher priority) */
  priority?: number;

  /** Module-specific settings */
  settings?: Record<string, any>;

  /** Feature flags */
  features?: Record<string, boolean>;

  /** Resource limits */
  limits?: {
    /** Max concurrent operations */
    maxConcurrency?: number;

    /** Max memory usage in MB */
    maxMemoryMB?: number;

    /** Request timeout in milliseconds */
    timeoutMs?: number;
  };
}

/**
 * Module metrics interface
 * For reporting performance and usage metrics
 */
export interface ModuleMetrics {
  /** Record a metric value */
  record(name: string, value: number, metadata?: Record<string, any>): void;

  /** Increment a counter */
  increment(name: string, value?: number): void;

  /** Record timing information */
  timing(name: string, duration: number): void;
}

/**
 * Event types emitted by modules
 */
export enum ModuleEvent {
  /** Module initialized */
  INITIALIZED = 'module:initialized',

  /** Module shutdown */
  SHUTDOWN = 'module:shutdown',

  /** Module health changed */
  HEALTH_CHANGED = 'module:health-changed',

  /** Command executed */
  COMMAND_EXECUTED = 'module:command-executed',

  /** Command failed */
  COMMAND_FAILED = 'module:command-failed',

  /** Generic error */
  ERROR = 'module:error',
}

/**
 * Event payload structure
 */
export interface ModuleEventPayload {
  /** Event type */
  event: ModuleEvent;

  /** Module name */
  module: string;

  /** Event timestamp */
  timestamp: Date;

  /** Event data */
  data: any;

  /** Event metadata */
  metadata?: Record<string, any>;
}

/**
 * Module registration info
 */
export interface ModuleInfo {
  /** Module name */
  name: string;

  /** Module version */
  version: string;

  /** Module description */
  description: string;

  /** Module status */
  status: HealthStatus['status'];

  /** When module was registered */
  registeredAt: Date;

  /** Module uptime */
  uptime: number;

  /** Available commands */
  commands?: string[];

  /** Available routes */
  routes?: string[];

  /** Scheduled jobs */
  jobs?: ScheduledJob[];
}
