/**
 * Advanced Event Patterns - DAWG AI
 * Enterprise-grade event handling patterns
 * @module events/eventPatterns
 */

import type { EventData, EventType } from './eventBus';
import { eventBus } from './eventBus';

import { logger } from '$lib/utils/logger';
/**
 * Event Priority Levels
 */
export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Request/Response Pattern
 * Enables RPC-style communication over event bus
 */
export class RequestResponseBus {
	private pendingRequests: Map<string, RequestContext> = new Map();
	private responseHandlers: Map<string, ResponseHandler<any, any>> = new Map();
	private responseListener: (() => void) | null = null;

	constructor() {
		// Set up global response listener
		this.setupResponseListener();
	}

	private setupResponseListener(): void {
		// Listen to ALL response events
		const originalEmit = eventBus.emit.bind(eventBus);
		const self = this;

		// Intercept emits to catch response events
		eventBus.emit = function <T>(type: EventType, payload?: T): void {
			originalEmit(type, payload);

			// Check if this is a response event
			const typeStr = type as string;
			if (typeStr.includes(':response:')) {
				const parts = typeStr.split(':');
				const requestId = parts[parts.length - 1];

				if (payload && typeof payload === 'object' && 'success' in payload) {
					const responsePayload = payload as any;
					if (responsePayload.success) {
						self.completeRequest(requestId, responsePayload.data);
					} else {
						self.failRequest(requestId, responsePayload.error);
					}
				}
			}
		};
	}

	/**
	 * Send a request and wait for response
	 */
	async request<TReq, TRes>(
		topic: string,
		payload: TReq,
		timeout: number = 5000
	): Promise<TRes> {
		const requestId = this.generateRequestId();
		const responsePromise = this.waitForResponse<TRes>(requestId, timeout);

		// Emit request event
		eventBus.emit(`${topic}:request` as EventType, {
			requestId,
			payload
		});

		return responsePromise;
	}

	/**
	 * Register a response handler for a topic
	 */
	respond<TReq, TRes>(
		topic: string,
		handler: (payload: TReq) => Promise<TRes>
	): () => void {
		this.responseHandlers.set(topic, handler);

		// Listen for requests
		const unsubscribe = eventBus.on(`${topic}:request` as EventType, async (event) => {
			const { requestId, payload } = event.payload;

			try {
				const response = await handler(payload);

				// Send response
				eventBus.emit(`${topic}:response:${requestId}` as EventType, {
					requestId,
					success: true,
					data: response
				});
			} catch (error) {
				// Send error response
				eventBus.emit(`${topic}:response:${requestId}` as EventType, {
					requestId,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		});

		return () => {
			this.responseHandlers.delete(topic);
			unsubscribe();
		};
	}

	private waitForResponse<TRes>(requestId: string, timeout: number): Promise<TRes> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pendingRequests.delete(requestId);
				reject(new Error(`Request timeout after ${timeout}ms`));
			}, timeout);

			const context: RequestContext = {
				requestId,
				timer,
				resolve,
				reject
			};

			this.pendingRequests.set(requestId, context);

			// Store handlers for this request
			context.resolve = resolve;
			context.reject = reject;
		});
	}

	/**
	 * Complete a pending request with success
	 */
	private completeRequest<TRes>(requestId: string, data: TRes): void {
		const context = this.pendingRequests.get(requestId);
		if (context) {
			clearTimeout(context.timer);
			this.pendingRequests.delete(requestId);
			context.resolve(data);
		}
	}

	/**
	 * Complete a pending request with error
	 */
	private failRequest(requestId: string, error: string): void {
		const context = this.pendingRequests.get(requestId);
		if (context) {
			clearTimeout(context.timer);
			this.pendingRequests.delete(requestId);
			context.reject(new Error(error));
		}
	}

	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

interface RequestContext {
	requestId: string;
	timer: NodeJS.Timeout;
	resolve: (value: any) => void;
	reject: (error: Error) => void;
}

type ResponseHandler<TReq, TRes> = (payload: TReq) => Promise<TRes>;

/**
 * Event Store for Replay and Time Travel
 * Enables undo/redo functionality
 */
export class EventStore {
	private events: EventData[] = [];
	private maxSize: number = 1000;
	private isReplaying: boolean = false;

	/**
	 * Record an event to history
	 */
	record(event: EventData): void {
		if (this.isReplaying) {
			return; // Don't record events during replay
		}

		this.events.push({ ...event });

		// Trim if exceeds max size
		if (this.events.length > this.maxSize) {
			this.events.shift();
		}
	}

	/**
	 * Replay events from a specific timestamp
	 */
	replay(fromTimestamp?: number): void {
		this.isReplaying = true;

		const eventsToReplay = fromTimestamp
			? this.events.filter((e) => e.timestamp >= fromTimestamp)
			: this.events;

		eventsToReplay.forEach((event) => {
			eventBus.emit(event.type, event.payload);
		});

		this.isReplaying = false;
	}

	/**
	 * Get event history with optional filter
	 */
	getHistory(filter?: EventFilter): EventData[] {
		if (!filter) {
			return [...this.events];
		}

		return this.events.filter((event) => {
			if (filter.type && event.type !== filter.type) {
				return false;
			}
			if (filter.fromTimestamp && event.timestamp < filter.fromTimestamp) {
				return false;
			}
			if (filter.toTimestamp && event.timestamp > filter.toTimestamp) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Clear all history
	 */
	clear(): void {
		this.events = [];
	}

	/**
	 * Export history as JSON
	 */
	export(): string {
		return JSON.stringify(this.events, null, 2);
	}

	/**
	 * Import history from JSON
	 */
	import(data: string): void {
		try {
			this.events = JSON.parse(data);
		} catch (error) {
			logger.error('Failed to import event history:', error);
		}
	}

	/**
	 * Set max history size
	 */
	setMaxSize(size: number): void {
		this.maxSize = size;
	}
}

export interface EventFilter {
	type?: EventType;
	fromTimestamp?: number;
	toTimestamp?: number;
}

/**
 * Priority Event Bus
 * Processes critical events before low-priority ones
 */
export class PriorityEventBus {
	private queues: Map<EventPriority, EventData[]> = new Map([
		['critical', []],
		['high', []],
		['normal', []],
		['low', []]
	]);

	private readonly priorityOrder: EventPriority[] = ['critical', 'high', 'normal', 'low'];

	/**
	 * Emit event with priority
	 */
	emit(type: EventType, payload: any, priority: EventPriority = 'normal'): void {
		const event: EventData = {
			type,
			payload,
			timestamp: Date.now()
		};

		this.queues.get(priority)!.push(event);

		// Process immediately and synchronously
		this.processQueue();
	}

	private processQueue(): void {
		// Process ALL queues in priority order synchronously
		for (const priority of this.priorityOrder) {
			const queue = this.queues.get(priority)!;

			while (queue.length > 0) {
				const event = queue.shift()!;
				eventBus.emit(event.type, event.payload);
			}
		}
	}

	/**
	 * Get queue sizes by priority
	 */
	getQueueSizes(): Record<EventPriority, number> {
		return {
			critical: this.queues.get('critical')!.length,
			high: this.queues.get('high')!.length,
			normal: this.queues.get('normal')!.length,
			low: this.queues.get('low')!.length
		};
	}
}

/**
 * Circuit Breaker Pattern
 * Prevents cascade failures in distributed systems
 */
export class CircuitBreaker {
	private state: CircuitBreakerState = 'closed';
	private failureCount: number = 0;
	private lastFailureTime?: number;
	private successCount: number = 0;

	constructor(private config: CircuitBreakerConfig) {}

	/**
	 * Execute operation with circuit breaker protection
	 */
	async execute<T>(operation: () => Promise<T>): Promise<T> {
		if (this.state === 'open') {
			if (this.shouldAttemptReset()) {
				this.state = 'half-open';
			} else {
				throw new Error('Circuit breaker is OPEN - operation blocked');
			}
		}

		try {
			const result = await operation();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private onSuccess(): void {
		this.failureCount = 0;

		if (this.state === 'half-open') {
			this.successCount++;

			// Require consecutive successes to close
			if (this.successCount >= this.config.successThreshold) {
				this.state = 'closed';
				this.successCount = 0;
			}
		}
	}

	private onFailure(): void {
		this.failureCount++;
		this.lastFailureTime = Date.now();

		if (this.state === 'half-open') {
			// Immediately open on failure in half-open state
			this.state = 'open';
			this.successCount = 0;
		} else if (this.failureCount >= this.config.failureThreshold) {
			this.state = 'open';
		}
	}

	private shouldAttemptReset(): boolean {
		if (!this.lastFailureTime) {
			return false;
		}

		const timeSinceLastFailure = Date.now() - this.lastFailureTime;
		return timeSinceLastFailure >= this.config.resetTimeout;
	}

	/**
	 * Get current circuit breaker state
	 */
	getState(): CircuitBreakerState {
		return this.state;
	}

	/**
	 * Reset circuit breaker to closed state
	 */
	reset(): void {
		this.state = 'closed';
		this.failureCount = 0;
		this.successCount = 0;
		this.lastFailureTime = undefined;
	}
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
	failureThreshold: number; // Failures before opening
	resetTimeout: number; // Time before trying half-open (ms)
	successThreshold: number; // Successes needed to close from half-open
}

// Default circuit breaker config
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
	failureThreshold: 5,
	resetTimeout: 30000, // 30 seconds
	successThreshold: 2
};

// Singleton instances
export const requestResponseBus = new RequestResponseBus();
export const eventStore = new EventStore();
export const priorityEventBus = new PriorityEventBus();
export const defaultCircuitBreaker = new CircuitBreaker(DEFAULT_CIRCUIT_BREAKER_CONFIG);
