/**
 * Module Loader
 *
 * Loads and registers all DAWG AI modules with the module registry
 * This replaces the old Jarvis controller module loading system
 */

import { moduleRegistry } from '../module-sdk';
import { logger } from '../backend/utils/logger';

// Import all refactored modules
import marketingModule from './marketing';
import engagementModule from './engagement';
import automationModule from './automation';
import testingModule from './testing';
import musicModule from './music';

/**
 * Initialize and register all modules
 */
export async function loadModules(): Promise<void> {
  logger.info('Loading DAWG AI modules...');

  const modules = [
    marketingModule,
    engagementModule,
    automationModule,
    testingModule,
    musicModule,
  ];

  let successCount = 0;
  let failCount = 0;

  for (const module of modules) {
    try {
      logger.info(`Registering module: ${module.name}`);

      // Create module-specific logger
      const moduleLogger = {
        info: (message: string, meta?: Record<string, any>) => {
          logger.info(`[${module.name}] ${message}`, meta);
        },
        warn: (message: string, meta?: Record<string, any>) => {
          logger.warn(`[${module.name}] ${message}`, meta);
        },
        error: (message: string, meta?: Record<string, any>) => {
          logger.error(`[${module.name}] ${message}`, meta);
        },
        debug: (message: string, meta?: Record<string, any>) => {
          logger.debug(`[${module.name}] ${message}`, meta);
        },
      };

      // Register module with context
      await moduleRegistry.register(module, {
        logger: moduleLogger,
        config: {
          enabled: true,
          priority: 1,
          settings: {},
        },
      });

      successCount++;
      logger.info(`✅ Module registered: ${module.name} v${module.version}`);
    } catch (error) {
      failCount++;
      logger.error(`❌ Failed to register module: ${module.name}`, {
        error: (error as Error).message,
      });
    }
  }

  logger.info(`Module loading complete: ${successCount} succeeded, ${failCount} failed`);

  if (failCount > 0) {
    logger.warn(`Some modules failed to load. System may have reduced functionality.`);
  }
}

/**
 * Shutdown all modules
 */
export async function unloadModules(): Promise<void> {
  logger.info('Shutting down all modules...');

  try {
    await moduleRegistry.shutdownAll();
    logger.info('✅ All modules shut down successfully');
  } catch (error) {
    logger.error('❌ Error during module shutdown', {
      error: (error as Error).message,
    });
  }
}

/**
 * Get module loading status
 */
export function getModuleStatus() {
  return {
    totalModules: moduleRegistry.getModuleCount(),
    modules: moduleRegistry.getAllModules().map(m => ({
      name: m.name,
      version: m.version,
      description: m.description,
    })),
  };
}
