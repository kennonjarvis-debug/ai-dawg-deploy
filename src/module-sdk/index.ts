/**
 * Module SDK
 *
 * Clean, Jarvis-agnostic SDK for building DAWG AI modules
 *
 * This SDK allows modules to run independently without the Jarvis controller,
 * while maintaining compatibility with the Jarvis control plane.
 *
 * @example
 * ```typescript
 * import { BaseModule, Module, ModuleResponse } from '@/module-sdk';
 *
 * class MyModule extends BaseModule {
 *   name = 'my-module';
 *   version = '1.0.0';
 *   description = 'My custom module';
 *
 *   protected async onInitialize(): Promise<void> {
 *     this.registerCommand('hello', async (params) => {
 *       return { message: 'Hello, world!' };
 *     });
 *   }
 * }
 * ```
 */

// Export interfaces
export * from './interfaces';

// Export base module
export { BaseModule } from './base-module';

// Export module registry
export { ModuleRegistry, moduleRegistry } from './module-registry';
