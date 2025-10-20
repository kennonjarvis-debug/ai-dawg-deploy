/**
 * AudioErrorBoundary - DAWG AI Audio Engine
 * Error boundary wrapper for audio operations with recovery mechanisms
 * @module audio/core/AudioErrorBoundary
 */

import { AudioEngineError, PluginError, ErrorCode, createAudioEngineError } from '../errors';

/**
 * Error notification callback
 */
export type ErrorNotificationCallback = (error: AudioEngineError, context: string) => void;

/**
 * Retry configuration
 */
export interface RetryConfig {
	maxAttempts: number;
	delayMs: number;
	exponentialBackoff: boolean;
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
	/**
	 * Whether to log errors to console
	 */
	logErrors?: boolean;

	/**
	 * Custom error notification handler
	 */
	onError?: ErrorNotificationCallback;

	/**
	 * Whether to enable automatic retry for transient failures
	 */
	enableRetry?: boolean;

	/**
	 * Retry configuration
	 */
	retryConfig?: RetryConfig;

	/**
	 * Whether to bypass failed operations (graceful degradation)
	 */
	enableGracefulDegradation?: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxAttempts: 3,
	delayMs: 100,
	exponentialBackoff: true,
};

/**
 * Error boundary result
 */
export interface ErrorBoundaryResult<T> {
	success: boolean;
	value?: T;
	error?: AudioEngineError;
	bypassed?: boolean;
}

/**
 * AudioErrorBoundary - Wraps audio operations with error handling and recovery
 */
export class AudioErrorBoundary {
	private config: Required<ErrorBoundaryConfig>;
	private errorLog: Array<{ error: AudioEngineError; context: string; timestamp: number }> = [];

	constructor(config: ErrorBoundaryConfig = {}) {
		this.config = {
			logErrors: config.logErrors ?? true,
			onError: config.onError ?? this.defaultErrorHandler.bind(this),
			enableRetry: config.enableRetry ?? true,
			retryConfig: config.retryConfig ?? DEFAULT_RETRY_CONFIG,
			enableGracefulDegradation: config.enableGracefulDegradation ?? true,
		};
	}

	/**
	 * Default error handler - logs to console
	 */
	private defaultErrorHandler(error: AudioEngineError, context: string): void {
		if (this.config.logErrors) {
			console.error(`[AudioErrorBoundary] Error in ${context}:`, {
				message: error.message,
				code: error.code,
				timestamp: error.timestamp,
				stack: error.stack,
			});
		}
	}

	/**
	 * Execute a function with error boundary protection
	 * @param fn - Function to execute
	 * @param context - Context description for error logging
	 * @param fallbackValue - Optional fallback value if operation fails
	 * @returns Result with success status and value or error
	 */
	async execute<T>(
		fn: () => Promise<T> | T,
		context: string,
		fallbackValue?: T
	): Promise<ErrorBoundaryResult<T>> {
		try {
			const result = await this.executeWithRetry(fn, context);
			return { success: true, value: result };
		} catch (error) {
			const audioError = createAudioEngineError(error);
			this.handleError(audioError, context);

			// Try graceful degradation with fallback
			if (this.config.enableGracefulDegradation && fallbackValue !== undefined) {
				return { success: false, value: fallbackValue, error: audioError, bypassed: true };
			}

			return { success: false, error: audioError };
		}
	}

	/**
	 * Execute a synchronous function with error boundary protection
	 * @param fn - Synchronous function to execute
	 * @param context - Context description for error logging
	 * @param fallbackValue - Optional fallback value if operation fails
	 * @returns Result with success status and value or error
	 */
	executeSync<T>(fn: () => T, context: string, fallbackValue?: T): ErrorBoundaryResult<T> {
		try {
			const result = fn();
			return { success: true, value: result };
		} catch (error) {
			const audioError = createAudioEngineError(error);
			this.handleError(audioError, context);

			// Try graceful degradation with fallback
			if (this.config.enableGracefulDegradation && fallbackValue !== undefined) {
				return { success: false, value: fallbackValue, error: audioError, bypassed: true };
			}

			return { success: false, error: audioError };
		}
	}

	/**
	 * Execute function with automatic retry for transient failures
	 */
	private async executeWithRetry<T>(fn: () => Promise<T> | T, context: string): Promise<T> {
		if (!this.config.enableRetry) {
			return await fn();
		}

		const { maxAttempts, delayMs, exponentialBackoff } = this.config.retryConfig;
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error as Error;

				// Don't retry on permanent errors
				if (this.isPermanentError(error)) {
					throw error;
				}

				// If not last attempt, wait and retry
				if (attempt < maxAttempts) {
					const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

					if (this.config.logErrors) {
						console.warn(
							`[AudioErrorBoundary] Retry ${attempt}/${maxAttempts} for ${context} after ${delay}ms`
						);
					}

					await this.sleep(delay);
				}
			}
		}

		throw lastError;
	}

	/**
	 * Check if error is permanent (should not retry)
	 */
	private isPermanentError(error: unknown): boolean {
		if (error instanceof AudioEngineError) {
			// Don't retry these error codes
			const permanentCodes = [
				ErrorCode.NOT_INITIALIZED,
				ErrorCode.INVALID_PARAMETER,
				ErrorCode.PARAMETER_OUT_OF_RANGE,
				ErrorCode.INVALID_TRACK_TYPE,
				ErrorCode.UNSUPPORTED_FORMAT,
				ErrorCode.MICROPHONE_ACCESS_DENIED,
			];

			return permanentCodes.includes(error.code);
		}

		return false;
	}

	/**
	 * Handle error - log and notify
	 */
	private handleError(error: AudioEngineError, context: string): void {
		// Add to error log
		this.errorLog.push({
			error,
			context,
			timestamp: Date.now(),
		});

		// Limit error log size
		if (this.errorLog.length > 100) {
			this.errorLog.shift();
		}

		// Notify error handler
		this.config.onError(error, context);
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Get recent errors
	 */
	getRecentErrors(limit: number = 10): Array<{ error: AudioEngineError; context: string; timestamp: number }> {
		return this.errorLog.slice(-limit);
	}

	/**
	 * Clear error log
	 */
	clearErrorLog(): void {
		this.errorLog = [];
	}

	/**
	 * Get error statistics
	 */
	getStats() {
		const errorsByCode: Record<string, number> = {};
		const errorsByContext: Record<string, number> = {};

		for (const entry of this.errorLog) {
			errorsByCode[entry.error.code] = (errorsByCode[entry.error.code] || 0) + 1;
			errorsByContext[entry.context] = (errorsByContext[entry.context] || 0) + 1;
		}

		return {
			totalErrors: this.errorLog.length,
			errorsByCode,
			errorsByContext,
		};
	}
}

/**
 * Global error boundary instance
 */
let globalErrorBoundary: AudioErrorBoundary | null = null;

/**
 * Get global error boundary instance
 */
export function getGlobalErrorBoundary(): AudioErrorBoundary {
	if (!globalErrorBoundary) {
		globalErrorBoundary = new AudioErrorBoundary();
	}
	return globalErrorBoundary;
}

/**
 * Set global error boundary instance
 */
export function setGlobalErrorBoundary(boundary: AudioErrorBoundary): void {
	globalErrorBoundary = boundary;
}

/**
 * Convenience wrapper for executing async operations with global error boundary
 */
export async function safeExecute<T>(
	fn: () => Promise<T> | T,
	context: string,
	fallbackValue?: T
): Promise<ErrorBoundaryResult<T>> {
	return getGlobalErrorBoundary().execute(fn, context, fallbackValue);
}

/**
 * Convenience wrapper for executing sync operations with global error boundary
 */
export function safeExecuteSync<T>(
	fn: () => T,
	context: string,
	fallbackValue?: T
): ErrorBoundaryResult<T> {
	return getGlobalErrorBoundary().executeSync(fn, context, fallbackValue);
}
