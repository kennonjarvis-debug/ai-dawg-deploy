/**
 * Base Module
 *
 * Abstract base class for all AI Dawg modules
 * Provides common functionality and enforces module interface
 *
 * This is extracted from Jarvis core to be Jarvis-agnostic
 */

import { Router } from 'express';
import {
  Module,
  ModuleResponse,
  HealthStatus,
  HealthCheck,
  ScheduledJob,
  ModuleContext,
  ModuleLogger,
  ModuleConfig,
} from './interfaces';

/**
 * Abstract base class that provides common functionality for all modules
 * Modules should extend this class to inherit standard behavior
 */
export abstract class BaseModule implements Module {
  /** Module name - must be overridden */
  abstract name: string;

  /** Module version - must be overridden */
  abstract version: string;

  /** Module description - must be overridden */
  abstract description: string;

  /** Module initialization timestamp */
  protected startTime: Date | null = null;

  /** Module context */
  protected context: ModuleContext | null = null;

  /** Module logger */
  protected logger: ModuleLogger;

  /** Module enabled state */
  protected enabled: boolean = true;

  /** Command handlers registry */
  private commandHandlers: Map<string, (params: any) => Promise<any>> = new Map();

  /** Module configuration */
  protected config: ModuleConfig | null = null;

  constructor() {
    // Create default logger (will be replaced by actual logger during initialization)
    this.logger = this.createDefaultLogger();
  }

  /**
   * Initialize the module
   * Calls onInitialize() hook which can be overridden by child classes
   */
  async initialize(context?: ModuleContext): Promise<void> {
    this.logger.info(`Initializing ${this.name} module v${this.version}...`);
    this.startTime = new Date();

    if (context) {
      this.context = context;
      this.logger = context.logger;
      this.config = context.config || null;
    }

    try {
      await this.onInitialize();
      this.logger.info(`${this.name} module initialized successfully`);
    } catch (error) {
      this.logger.error(`${this.name} module initialization failed`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Shutdown the module
   * Calls onShutdown() hook which can be overridden by child classes
   */
  async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.name} module...`);

    try {
      await this.onShutdown();
      this.logger.info(`${this.name} module shut down successfully`);
    } catch (error) {
      this.logger.error(`${this.name} module shutdown failed`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Execute a command on this module
   * Main entry point for module execution
   */
  async execute(command: string, params: any = {}): Promise<ModuleResponse> {
    const startTime = Date.now();

    this.logger.debug(`Executing command: ${command}`, {
      command,
      params,
    });

    try {
      // Look up command handler
      const handler = this.commandHandlers.get(command);

      if (!handler) {
        const availableCommands = Array.from(this.commandHandlers.keys()).join(', ');
        throw new Error(
          `Unknown command: ${command}. Available commands: ${availableCommands || 'none'}`
        );
      }

      // Execute command handler
      const data = await handler(params);

      const executionTime = Date.now() - startTime;

      this.logger.info(`Command executed successfully: ${command}`, {
        command,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        data,
        executionTime,
        metadata: {
          module: this.name,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Command execution failed: ${command}`, {
        command,
        error: (error as Error).message,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: false,
        error: (error as Error).message,
        executionTime,
        metadata: {
          module: this.name,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get current health status of the module
   */
  async health(): Promise<HealthStatus> {
    if (!this.startTime) {
      return {
        status: 'unhealthy',
        checks: [
          {
            name: 'initialization',
            status: 'fail',
            message: 'Module not initialized',
          },
        ],
        uptime: 0,
        lastCheck: new Date(),
      };
    }

    const uptime = Date.now() - this.startTime.getTime();

    try {
      // Get module-specific health checks
      const customChecks = await this.onGetHealthChecks();

      // Determine overall status
      const status = this.determineHealthStatus(customChecks);

      return {
        status,
        checks: customChecks,
        uptime,
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Health check failed', {
        error: (error as Error).message,
      });

      return {
        status: 'unhealthy',
        checks: [
          {
            name: 'health_check',
            status: 'fail',
            message: `Health check failed: ${(error as Error).message}`,
          },
        ],
        uptime,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Register Express routes for this module (optional)
   */
  registerRoutes(router: Router): void {
    this.logger.debug(`Registering routes for ${this.name} module`);
    this.onRegisterRoutes(router);
  }

  /**
   * Get scheduled jobs for this module (optional)
   */
  getScheduledJobs(): ScheduledJob[] {
    return this.onGetScheduledJobs();
  }

  /**
   * Register a command handler
   * @param command Command name
   * @param handler Handler function
   */
  protected registerCommand(
    command: string,
    handler: (params: any) => Promise<any>
  ): void {
    if (this.commandHandlers.has(command)) {
      this.logger.warn(`Overwriting existing command handler: ${command}`);
    }

    this.commandHandlers.set(command, handler);
    this.logger.debug(`Registered command handler: ${command}`);
  }

  /**
   * Get list of registered commands
   */
  getCommands(): string[] {
    return Array.from(this.commandHandlers.keys());
  }

  /**
   * Determine overall health status from individual checks
   */
  private determineHealthStatus(checks: HealthCheck[]): HealthStatus['status'] {
    if (checks.length === 0) {
      return 'healthy';
    }

    const hasFailure = checks.some((check) => check.status === 'fail');
    const hasWarning = checks.some((check) => check.status === 'warn');

    if (hasFailure) {
      return 'unhealthy';
    } else if (hasWarning) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Create default logger for use before initialization
   */
  private createDefaultLogger(): ModuleLogger {
    const log = (level: string, message: string, meta?: Record<string, any>) => {
      const timestamp = new Date().toISOString();
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      console.log(`[${timestamp}] [${level}] [${this.name || 'Module'}] ${message}${metaStr}`);
    };

    return {
      info: (message, meta) => log('INFO', message, meta),
      warn: (message, meta) => log('WARN', message, meta),
      error: (message, meta) => log('ERROR', message, meta),
      debug: (message, meta) => log('DEBUG', message, meta),
    };
  }

  /**
   * Get module uptime in milliseconds
   */
  protected getUptime(): number {
    if (!this.startTime) {
      return 0;
    }
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Check if module is initialized
   */
  protected isInitialized(): boolean {
    return this.startTime !== null;
  }

  /**
   * Set module context (called by module registry)
   */
  setContext(context: ModuleContext): void {
    this.context = context;
    this.logger = context.logger;
    this.config = context.config || null;
  }

  // ==================== Lifecycle Hooks ====================

  /**
   * Hook: Called during module initialization
   * Override this in child classes to perform module-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }

  /**
   * Hook: Called during module shutdown
   * Override this in child classes to perform module-specific cleanup
   */
  protected async onShutdown(): Promise<void> {
    // Default: no-op
  }

  /**
   * Hook: Get module-specific health checks
   * Override this in child classes to provide custom health checks
   * @returns Array of health check results
   */
  protected async onGetHealthChecks(): Promise<HealthCheck[]> {
    // Default: basic initialization check
    return [
      {
        name: 'initialization',
        status: 'pass',
        message: 'Module initialized',
      },
    ];
  }

  /**
   * Hook: Register routes for this module
   * Override this in child classes to register Express routes
   */
  protected onRegisterRoutes(router: Router): void {
    // Default: no routes
    this.logger.debug('No routes registered (onRegisterRoutes not implemented)');
  }

  /**
   * Hook: Get scheduled jobs for this module
   * Override this in child classes to provide scheduled jobs
   */
  protected onGetScheduledJobs(): ScheduledJob[] {
    // Default: no scheduled jobs
    return [];
  }
}
