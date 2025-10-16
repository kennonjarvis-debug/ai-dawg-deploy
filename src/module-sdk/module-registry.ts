/**
 * Module Registry
 *
 * Central registry for all AI Dawg modules
 * Manages module lifecycle, discovery, and execution
 */

import {
  Module,
  ModuleResponse,
  HealthStatus,
  ModuleInfo,
  ModuleContext,
  ModuleLogger,
  ScheduledJob,
} from './interfaces';

/**
 * Module Registry
 * Singleton class that manages all registered modules
 */
export class ModuleRegistry {
  private modules: Map<string, Module> = new Map();
  private moduleInfo: Map<string, ModuleInfo> = new Map();
  private logger: ModuleLogger;

  constructor(logger?: ModuleLogger) {
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Register a module
   * @param module Module instance to register
   * @param context Optional module context
   */
  async register(module: Module, context?: ModuleContext): Promise<void> {
    if (this.modules.has(module.name)) {
      throw new Error(`Module already registered: ${module.name}`);
    }

    this.logger.info(`Registering module: ${module.name} v${module.version}`);

    try {
      // Initialize module if it has an initialize method
      if (module.initialize) {
        await module.initialize(context);
      }

      // Store module
      this.modules.set(module.name, module);

      // Store module info
      this.moduleInfo.set(module.name, {
        name: module.name,
        version: module.version,
        description: module.description,
        status: 'healthy', // Will be updated by health checks
        registeredAt: new Date(),
        uptime: 0,
        commands: module.getCommands ? module.getCommands() : [],
        routes: [], // Will be populated when routes are registered
        jobs: module.getScheduledJobs ? module.getScheduledJobs() : [],
      });

      this.logger.info(`Module registered successfully: ${module.name}`);
    } catch (error) {
      this.logger.error(`Failed to register module: ${module.name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Unregister a module
   * @param name Module name to unregister
   */
  async unregister(name: string): Promise<void> {
    const module = this.modules.get(name);

    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }

    this.logger.info(`Unregistering module: ${name}`);

    try {
      // Shutdown module if it has a shutdown method
      if (module.shutdown) {
        await module.shutdown();
      }

      // Remove module
      this.modules.delete(name);
      this.moduleInfo.delete(name);

      this.logger.info(`Module unregistered successfully: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to unregister module: ${name}`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get a module by name
   * @param name Module name
   * @returns Module instance or undefined
   */
  getModule(name: string): Module | undefined {
    return this.modules.get(name);
  }

  /**
   * Check if a module is registered
   * @param name Module name
   * @returns True if module is registered
   */
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Get all registered modules
   * @returns Array of module instances
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get module info for all registered modules
   * @returns Array of module info objects
   */
  async getAllModuleInfo(): Promise<ModuleInfo[]> {
    const infos: ModuleInfo[] = [];

    for (const [name, module] of this.modules.entries()) {
      const info = this.moduleInfo.get(name);
      if (!info) continue;

      // Update health status
      try {
        const health = await module.health();
        info.status = health.status;
        info.uptime = health.uptime || 0;
      } catch (error) {
        info.status = 'unhealthy';
      }

      infos.push(info);
    }

    return infos;
  }

  /**
   * Get module info by name
   * @param name Module name
   * @returns Module info or undefined
   */
  async getModuleInfo(name: string): Promise<ModuleInfo | undefined> {
    const module = this.modules.get(name);
    const info = this.moduleInfo.get(name);

    if (!module || !info) {
      return undefined;
    }

    // Update health status
    try {
      const health = await module.health();
      info.status = health.status;
      info.uptime = health.uptime || 0;
    } catch (error) {
      info.status = 'unhealthy';
    }

    return info;
  }

  /**
   * Execute a command on a module
   * @param moduleName Module name
   * @param command Command to execute
   * @param params Command parameters
   * @returns Promise<ModuleResponse>
   */
  async execute(
    moduleName: string,
    command: string,
    params: any = {}
  ): Promise<ModuleResponse> {
    const module = this.modules.get(moduleName);

    if (!module) {
      return {
        success: false,
        error: `Module not found: ${moduleName}`,
        executionTime: 0,
        metadata: {
          module: moduleName,
          timestamp: new Date(),
        },
      };
    }

    try {
      return await module.execute(command, params);
    } catch (error) {
      this.logger.error(`Module execution failed: ${moduleName}.${command}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: (error as Error).message,
        executionTime: 0,
        metadata: {
          module: moduleName,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get health status of a module
   * @param name Module name
   * @returns Promise<HealthStatus | undefined>
   */
  async getModuleHealth(name: string): Promise<HealthStatus | undefined> {
    const module = this.modules.get(name);

    if (!module) {
      return undefined;
    }

    try {
      return await module.health();
    } catch (error) {
      this.logger.error(`Health check failed: ${name}`, {
        error: (error as Error).message,
      });

      return {
        status: 'unhealthy',
        checks: [
          {
            name: 'health_check',
            status: 'fail',
            message: (error as Error).message,
          },
        ],
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Get aggregated health status of all modules
   * @returns Promise<HealthStatus>
   */
  async getAggregatedHealth(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = [];
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const [name, module] of this.modules.entries()) {
      try {
        const health = await module.health();

        checks.push({
          name: name,
          status: health.status === 'healthy' ? 'pass' : health.status === 'degraded' ? 'warn' : 'fail',
          message: `${name}: ${health.status}`,
          metadata: {
            uptime: health.uptime,
            checks: health.checks,
          },
        });

        if (health.status === 'healthy') healthyCount++;
        else if (health.status === 'degraded') degradedCount++;
        else unhealthyCount++;
      } catch (error) {
        checks.push({
          name: name,
          status: 'fail',
          message: `${name}: health check failed - ${(error as Error).message}`,
        });
        unhealthyCount++;
      }
    }

    // Determine overall status
    let overallStatus: HealthStatus['status'] = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      lastCheck: new Date(),
      details: {
        totalModules: this.modules.size,
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount,
      },
    };
  }

  /**
   * Get all scheduled jobs from all modules
   * @returns Array of scheduled jobs with module context
   */
  getAllScheduledJobs(): Array<ScheduledJob & { module: string }> {
    const jobs: Array<ScheduledJob & { module: string }> = [];

    for (const [name, module] of this.modules.entries()) {
      if (module.getScheduledJobs) {
        const moduleJobs = module.getScheduledJobs();
        for (const job of moduleJobs) {
          jobs.push({
            ...job,
            module: name,
          });
        }
      }
    }

    return jobs;
  }

  /**
   * Get module count
   * @returns Number of registered modules
   */
  getModuleCount(): number {
    return this.modules.size;
  }

  /**
   * Shutdown all modules
   */
  async shutdownAll(): Promise<void> {
    this.logger.info('Shutting down all modules...');

    const shutdownPromises: Promise<void>[] = [];

    for (const [name, module] of this.modules.entries()) {
      if (module.shutdown) {
        this.logger.info(`Shutting down module: ${name}`);
        shutdownPromises.push(
          module.shutdown().catch((error) => {
            this.logger.error(`Failed to shutdown module: ${name}`, {
              error: (error as Error).message,
            });
          })
        );
      }
    }

    await Promise.all(shutdownPromises);

    this.modules.clear();
    this.moduleInfo.clear();

    this.logger.info('All modules shut down');
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): ModuleLogger {
    const log = (level: string, message: string, meta?: Record<string, any>) => {
      const timestamp = new Date().toISOString();
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      console.log(`[${timestamp}] [${level}] [ModuleRegistry] ${message}${metaStr}`);
    };

    return {
      info: (message, meta) => log('INFO', message, meta),
      warn: (message, meta) => log('WARN', message, meta),
      error: (message, meta) => log('ERROR', message, meta),
      debug: (message, meta) => log('DEBUG', message, meta),
    };
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();
