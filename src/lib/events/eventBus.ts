import { logger } from '$lib/utils/logger';

/**
 * Event Bus - DAWG AI
 * Centralized event system for inter-module communication
 * @module events/eventBus
 */

/**
 * All possible event types in the system
 */
export type EventType =
	// Playback events
	| 'playback:play'
	| 'playback:stop'
	| 'playback:pause'
	| 'playback:record-start'
	| 'playback:record-stop'
	| 'playback:time-update'

	// Track events
	| 'track:created'
	| 'track:deleted'
	| 'track:updated'
	| 'track:selected'
	| 'track:reordered'

	// MIDI events
	| 'midi:note-added'
	| 'midi:note-removed'
	| 'midi:note-updated'
	| 'midi:pattern-changed'

	// Effect events
	| 'effect:added'
	| 'effect:removed'
	| 'effect:parameter-changed'

	// Voice events
	| 'voice:transcript'
	| 'voice:interim-transcript'
	| 'voice:speaking'
	| 'voice:speaking-done'
	| 'voice:action-executed'

	// AI events
	| 'ai:beat-generated'
	| 'ai:mix-analyzed'
	| 'ai:master-complete'
	| 'ai:prompt-user'
	| 'ai:feature-selected'

	// Project events
	| 'project:saved'
	| 'project:loaded'
	| 'project:updated'

	// Error events
	| 'error:audio-context'
	| 'error:network'
	| 'error:api';

/**
 * Event data structure
 */
export interface EventData<T = any> {
	type: EventType;
	payload: T;
	timestamp: number;
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (data: EventData<T>) => void;

/**
 * EventBus - Singleton event system
 * Provides pub/sub pattern for module communication
 */
export class EventBus {
	private static instance: EventBus;
	private listeners: Map<EventType, Set<EventHandler>>;

	private constructor() {
		this.listeners = new Map();
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): EventBus {
		if (!EventBus.instance) {
			EventBus.instance = new EventBus();
		}
		return EventBus.instance;
	}

	/**
	 * Emit an event to all listeners
	 * @param type - Event type
	 * @param payload - Event payload data
	 */
	emit<T = any>(type: EventType, payload?: T): void {
		const eventData: EventData<T> = {
			type,
			payload: payload as T,
			timestamp: Date.now()
		};

		const handlers = this.listeners.get(type);
		if (handlers) {
			handlers.forEach((handler) => {
				try {
					handler(eventData);
				} catch (error) {
					logger.error(`Error in event handler for ${type}:`, error);
				}
			});
		}

		// Also dispatch as CustomEvent for DOM integration
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent(type, {
					detail: eventData
				})
			);
		}
	}

	/**
	 * Subscribe to an event
	 * @param type - Event type to listen for
	 * @param handler - Handler function
	 * @returns Unsubscribe function
	 */
	on<T = any>(type: EventType, handler: EventHandler<T>): () => void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}

		const handlers = this.listeners.get(type)!;
		handlers.add(handler as EventHandler);

		// Return unsubscribe function
		return () => {
			this.off(type, handler);
		};
	}

	/**
	 * Subscribe to an event that fires only once
	 * @param type - Event type to listen for
	 * @param handler - Handler function
	 * @returns Unsubscribe function
	 */
	once<T = any>(type: EventType, handler: EventHandler<T>): () => void {
		const wrappedHandler: EventHandler<T> = (data) => {
			handler(data);
			this.off(type, wrappedHandler);
		};

		return this.on(type, wrappedHandler);
	}

	/**
	 * Unsubscribe from an event
	 * @param type - Event type
	 * @param handler - Handler function to remove
	 */
	off<T = any>(type: EventType, handler: EventHandler<T>): void {
		const handlers = this.listeners.get(type);
		if (handlers) {
			handlers.delete(handler as EventHandler);

			// Clean up empty sets
			if (handlers.size === 0) {
				this.listeners.delete(type);
			}
		}
	}

	/**
	 * Remove all listeners for a specific event type
	 * @param type - Event type
	 */
	removeAllListeners(type?: EventType): void {
		if (type) {
			this.listeners.delete(type);
		} else {
			this.listeners.clear();
		}
	}

	/**
	 * Get count of listeners for an event type
	 * @param type - Event type
	 * @returns Number of listeners
	 */
	listenerCount(type: EventType): number {
		const handlers = this.listeners.get(type);
		return handlers ? handlers.size : 0;
	}

	/**
	 * Get all event types that have listeners
	 * @returns Array of event types
	 */
	eventTypes(): EventType[] {
		return Array.from(this.listeners.keys());
	}

	/**
	 * Clear all event listeners (use with caution)
	 */
	clear(): void {
		this.listeners.clear();
	}

	/**
	 * Get debug information
	 */
	debug(): void {
		console.group('EventBus Debug Info');
		logger.info('Total event types with listeners:', this.listeners.size);

		this.listeners.forEach((handlers, type) => {
			logger.info(`  ${type}: ${handlers.size} listener(s)`);
		});

		console.groupEnd();
	}
}

/**
 * Convenience function to get EventBus instance
 */
export const eventBus = EventBus.getInstance();

/**
 * Convenience function to emit events
 */
export function emit<T = any>(type: EventType, payload?: T): void {
	eventBus.emit(type, payload);
}

/**
 * Convenience function to subscribe to events
 */
export function on<T = any>(type: EventType, handler: EventHandler<T>): () => void {
	return eventBus.on(type, handler);
}

/**
 * Convenience function to subscribe once
 */
export function once<T = any>(type: EventType, handler: EventHandler<T>): () => void {
	return eventBus.once(type, handler);
}

/**
 * Convenience function to unsubscribe
 */
export function off<T = any>(type: EventType, handler: EventHandler<T>): void {
	eventBus.off(type, handler);
}
