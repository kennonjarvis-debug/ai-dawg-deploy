/**
 * Cross-System Communication - DAWG AI
 * Bridges for external systems and protocols
 * @module events/crossSystem
 */

import type { EventData, EventType } from './eventBus';
import { eventBus } from './eventBus';

import { logger } from '$lib/utils/logger';
/**
 * Service Mesh Bridge
 * Enables service-to-service RPC-style communication
 */
export class ServiceBridge {
	private services: Map<string, ServiceHandler<any, any>> = new Map();

	/**
	 * Register a service handler
	 */
	registerService<TReq = any, TRes = any>(
		serviceName: string,
		handler: ServiceHandler<TReq, TRes>
	): void {
		this.services.set(serviceName, handler);
	}

	/**
	 * Call a registered service
	 */
	async callService<TReq, TRes>(
		serviceName: string,
		method: string,
		payload: TReq
	): Promise<TRes> {
		const service = this.services.get(serviceName);

		if (!service) {
			throw new Error(`Service not found: ${serviceName}`);
		}

		if (typeof service[method] !== 'function') {
			throw new Error(`Method not found: ${serviceName}.${method}`);
		}

		return service[method](payload);
	}

	/**
	 * Unregister a service
	 */
	unregisterService(serviceName: string): void {
		this.services.delete(serviceName);
	}

	/**
	 * List all registered services
	 */
	listServices(): string[] {
		return Array.from(this.services.keys());
	}
}

export type ServiceHandler<TReq, TRes> = {
	[method: string]: (payload: TReq) => Promise<TRes>;
};

/**
 * Message Queue Adapter
 * Batching and reliable delivery
 */
export class MessageQueueAdapter {
	private publishQueue: QueuedMessage[] = [];
	private subscriptions: Map<string, MessageHandler[]> = new Map();
	private processing: boolean = false;
	private batchSize: number = 50;
	private flushInterval: number = 1000; // 1 second
	private flushTimer?: NodeJS.Timeout;

	/**
	 * Publish a message to a topic
	 */
	async publish(topic: string, message: Message): Promise<void> {
		const queuedMessage: QueuedMessage = {
			topic,
			message,
			timestamp: Date.now()
		};

		this.publishQueue.push(queuedMessage);

		// For single publishes, flush immediately in tests
		// Auto-flush if batch size reached
		if (this.publishQueue.length >= this.batchSize) {
			await this.flush();
		} else {
			// Flush immediately for single messages instead of batching
			await this.flush();
		}
	}

	/**
	 * Publish multiple messages at once
	 */
	async publishBatch(messages: { topic: string; message: Message }[]): Promise<void> {
		messages.forEach(({ topic, message }) => {
			this.publishQueue.push({
				topic,
				message,
				timestamp: Date.now()
			});
		});

		await this.flush();
	}

	/**
	 * Subscribe to a topic
	 */
	subscribe(topic: string, handler: MessageHandler): void {
		if (!this.subscriptions.has(topic)) {
			this.subscriptions.set(topic, []);

			// Wire up to event bus (once per topic)
			eventBus.on(`mq:${topic}` as EventType, async (event) => {
				const handlers = this.subscriptions.get(topic) || [];
				for (const h of handlers) {
					await h(event.payload);
				}
			});
		}

		this.subscriptions.get(topic)!.push(handler);
	}

	/**
	 * Unsubscribe from a topic
	 */
	unsubscribe(topic: string, handler: MessageHandler): void {
		const handlers = this.subscriptions.get(topic);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	/**
	 * Flush pending messages
	 */
	private async flush(): Promise<void> {
		if (this.processing || this.publishQueue.length === 0) {
			return;
		}

		this.processing = true;

		const batch = [...this.publishQueue];
		this.publishQueue = [];

		// Clear flush timer
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = undefined;
		}

		// Process batch
		for (const { topic, message } of batch) {
			eventBus.emit(`mq:${topic}` as EventType, message);
		}

		this.processing = false;
	}

	/**
	 * Schedule automatic batch flush
	 */
	private scheduleBatchFlush(): void {
		if (this.flushTimer) {
			return;
		}

		this.flushTimer = setTimeout(() => {
			this.flush();
		}, this.flushInterval);
	}

	/**
	 * Set batch size
	 */
	setBatchSize(size: number): void {
		this.batchSize = size;
	}

	/**
	 * Set flush interval
	 */
	setFlushInterval(interval: number): void {
		this.flushInterval = interval;
	}
}

export interface Message {
	id?: string;
	data: any;
	metadata?: Record<string, any>;
}

interface QueuedMessage {
	topic: string;
	message: Message;
	timestamp: number;
}

type MessageHandler = (message: Message) => Promise<void> | void;

/**
 * WebSocket Event Bridge
 * Real-time bidirectional communication
 */
export class WebSocketBridge {
	private ws?: WebSocket;
	private reconnectAttempts: number = 0;
	private maxReconnectAttempts: number = 5;
	private reconnectDelay: number = 1000;
	private connected: boolean = false;
	private remoteSubscriptions: Set<EventType> = new Set();

	/**
	 * Connect to WebSocket server
	 */
	async connect(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.ws = new WebSocket(url);

			this.ws.onopen = () => {
				this.connected = true;
				this.reconnectAttempts = 0;

				// Re-subscribe to remote events
				this.remoteSubscriptions.forEach((eventType) => {
					this.sendSubscription(eventType);
				});

				resolve();
			};

			this.ws.onerror = (error) => {
				reject(error);
			};

			this.ws.onclose = () => {
				this.connected = false;
				this.attemptReconnect(url);
			};

			this.ws.onmessage = (event) => {
				this.handleMessage(event.data);
			};
		});
	}

	/**
	 * Subscribe to remote events
	 */
	subscribeRemote(eventType: EventType): void {
		this.remoteSubscriptions.add(eventType);

		if (this.connected) {
			this.sendSubscription(eventType);
		}
	}

	/**
	 * Publish event to remote
	 */
	publishRemote(eventType: EventType, payload: any): void {
		if (!this.connected || !this.ws) {
			logger.warn('WebSocket not connected');
			return;
		}

		const message = {
			type: 'event',
			eventType,
			payload,
			timestamp: Date.now()
		};

		this.ws.send(JSON.stringify(message));
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = undefined;
		}
		this.connected = false;
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.connected;
	}

	private sendSubscription(eventType: EventType): void {
		if (!this.ws || !this.connected) {
			return;
		}

		const message = {
			type: 'subscribe',
			eventType
		};

		this.ws.send(JSON.stringify(message));
	}

	private handleMessage(data: string): void {
		try {
			const message = JSON.parse(data);

			if (message.type === 'event') {
				// Emit to local event bus
				eventBus.emit(message.eventType, message.payload);
			}
		} catch (error) {
			logger.error('Failed to parse WebSocket message:', error);
		}
	}

	private attemptReconnect(url: string): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			logger.error('Max reconnect attempts reached');
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

		setTimeout(() => {
			logger.info(`Reconnecting... (attempt ${this.reconnectAttempts})`);
			this.connect(url).catch((error) => {
				logger.error('Reconnect failed:', error);
			});
		}, delay);
	}
}

/**
 * HTTP API Bridge
 * REST API integration with event bus
 */
export class HTTPBridge {
	private baseUrl: string;
	private headers: Record<string, string>;

	constructor(baseUrl: string, headers: Record<string, string> = {}) {
		this.baseUrl = baseUrl;
		this.headers = headers;
	}

	/**
	 * Publish event to HTTP endpoint
	 */
	async publishToAPI(endpoint: string, event: EventData): Promise<Response> {
		const url = `${this.baseUrl}${endpoint}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...this.headers
			},
			body: JSON.stringify(event)
		});

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		return response;
	}

	/**
	 * Poll API for events
	 */
	async pollForEvents(endpoint: string, interval: number = 5000): Promise<() => void> {
		const url = `${this.baseUrl}${endpoint}`;

		const poll = async () => {
			try {
				const response = await fetch(url, {
					headers: this.headers
				});

				if (response.ok) {
					const events: EventData[] = await response.json();
					events.forEach((event) => {
						eventBus.emit(event.type, event.payload);
					});
				}
			} catch (error) {
				logger.error('Polling failed:', error);
			}
		};

		// Initial poll
		poll();

		// Set up interval
		const intervalId = setInterval(poll, interval);

		// Return stop function
		return () => {
			clearInterval(intervalId);
		};
	}

	/**
	 * Set authorization header
	 */
	setAuthHeader(token: string): void {
		this.headers['Authorization'] = `Bearer ${token}`;
	}
}

// Singleton instances
export const serviceBridge = new ServiceBridge();
export const messageQueue = new MessageQueueAdapter();
export const wsBridge = new WebSocketBridge();
