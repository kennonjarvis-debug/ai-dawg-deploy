/**
 * Event Bus - Multi-Transport Message Broker
 *
 * Supports three transport modes (in order of preference):
 * 1. NATS - High-performance distributed messaging
 * 2. Redis Streams - Redis-based pub/sub
 * 3. GitOps - File-based JSON Lines for local development
 *
 * All events follow the envelope schema defined in SYSTEM / SHARED PREAMBLE
 */

import fs from 'fs';
import path from 'path';
import { createHmac } from 'crypto';

export interface EventEnvelope {
  event: string; // Topic name (e.g., "journey.started")
  version: string; // Schema version (e.g., "v1")
  id: string; // Unique event ID (ULID or UUID)
  trace_id: string; // Trace ID for distributed tracing
  producer: string; // Agent name that produced this event
  ts: string; // ISO8601 timestamp
  signature: string; // HMAC-SHA256 signature
  payload: Record<string, any>; // Event-specific data
}

export type EventHandler = (event: EventEnvelope) => void | Promise<void>;

export interface EventBusConfig {
  mode: 'nats' | 'redis' | 'gitops' | 'test';
  natsUrl?: string;
  redisUrl?: string;
  gitopsPath?: string;
  secret?: string;
  agentName?: string;
}

export class EventBus {
  private config: EventBusConfig;
  private handlers: Map<string, Set<EventHandler>>;
  private connected: boolean = false;
  private gitopsWatcher?: NodeJS.Timeout;
  private lastReadPosition: number = 0;
  private testEvents: EventEnvelope[] = []; // For test mode

  constructor(config: EventBusConfig) {
    this.config = {
      ...config,
      mode: config.mode || 'gitops',
      gitopsPath: config.gitopsPath || path.join(process.cwd(), '_bus/events'),
      secret: config.secret || process.env.DAWGAI_HMAC_SECRET || 'dev-secret',
      agentName: config.agentName || 'unknown',
    };

    this.handlers = new Map();
  }

  /**
   * Connect to the event bus transport
   */
  async connect(): Promise<void> {
    if (this.connected) {
      console.warn('[EventBus] Already connected');
      return;
    }

    switch (this.config.mode) {
      case 'nats':
        await this.connectNATS();
        break;
      case 'redis':
        await this.connectRedis();
        break;
      case 'gitops':
        await this.connectGitOps();
        break;
      case 'test':
        // Test mode - no actual connection needed
        this.connected = true;
        break;
      default:
        throw new Error(`Unsupported transport mode: ${this.config.mode}`);
    }

    this.connected = true;
    console.log(`[EventBus] Connected via ${this.config.mode}`);
  }

  /**
   * Disconnect from the event bus
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    if (this.gitopsWatcher) {
      clearInterval(this.gitopsWatcher);
    }

    this.connected = false;
    console.log('[EventBus] Disconnected');
  }

  /**
   * Publish an event to the bus
   */
  async publish(topic: string, payload: Record<string, any>): Promise<void> {
    if (!this.connected) {
      throw new Error('[EventBus] Not connected');
    }

    const envelope: EventEnvelope = {
      event: topic,
      version: 'v1',
      id: this.generateId(),
      trace_id: this.generateTraceId(),
      producer: this.config.agentName!,
      ts: new Date().toISOString(),
      signature: this.signPayload(payload),
      payload,
    };

    switch (this.config.mode) {
      case 'nats':
        await this.publishNATS(envelope);
        break;
      case 'redis':
        await this.publishRedis(envelope);
        break;
      case 'gitops':
        await this.publishGitOps(envelope);
        break;
      case 'test':
        this.testEvents.push(envelope);
        // Immediately trigger handlers for test mode
        await this.triggerHandlers(topic, envelope);
        break;
    }

    console.log(`[EventBus] Published ${topic} (${envelope.id})`);
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, handler: EventHandler): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }

    this.handlers.get(topic)!.add(handler);
    console.log(`[EventBus] Subscribed to ${topic}`);
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: string, handler: EventHandler): void {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(topic);
      }
    }
  }

  /**
   * Wait for a specific event (useful for tests)
   */
  async waitForEvent(topic: string, timeoutMs: number = 5000): Promise<EventEnvelope> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.unsubscribe(topic, handler);
        reject(new Error(`Timeout waiting for event: ${topic}`));
      }, timeoutMs);

      const handler = (event: EventEnvelope) => {
        clearTimeout(timeout);
        this.unsubscribe(topic, handler);
        resolve(event);
      };

      this.subscribe(topic, handler);
    });
  }

  // ========== NATS Transport ==========

  private async connectNATS(): Promise<void> {
    // TODO: Implement NATS connection
    // const { connect } = require('nats');
    // this.natsConnection = await connect({ servers: this.config.natsUrl });
    throw new Error('[EventBus] NATS transport not yet implemented');
  }

  private async publishNATS(_envelope: EventEnvelope): Promise<void> {
    // TODO: Implement NATS publish
    // await this.natsConnection.publish(envelope.event, JSON.stringify(envelope));
    throw new Error('[EventBus] NATS transport not yet implemented');
  }

  // ========== Redis Transport ==========

  private async connectRedis(): Promise<void> {
    // TODO: Implement Redis connection
    // const { createClient } = require('redis');
    // this.redisClient = createClient({ url: this.config.redisUrl });
    // await this.redisClient.connect();
    throw new Error('[EventBus] Redis transport not yet implemented');
  }

  private async publishRedis(_envelope: EventEnvelope): Promise<void> {
    // TODO: Implement Redis Streams publish
    // await this.redisClient.xAdd(envelope.event, '*', { data: JSON.stringify(envelope) });
    throw new Error('[EventBus] Redis transport not yet implemented');
  }

  // ========== GitOps Transport ==========

  private async connectGitOps(): Promise<void> {
    const today = new Date().toISOString().split('T')[0] as string;
    const gitopsPath: string = this.config.gitopsPath ?? path.join(process.cwd(), '_bus/events');
    const eventsDir = path.join(gitopsPath, today);
    const eventsFile = path.join(eventsDir, 'events.jsonl');

    // Ensure directory exists
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }

    // Create file if it doesn't exist
    if (!fs.existsSync(eventsFile)) {
      fs.writeFileSync(eventsFile, '');
    }

    // Start polling for new events
    this.gitopsWatcher = setInterval(() => {
      this.pollGitOpsEvents();
    }, 1000); // Poll every second

    // Read existing events
    this.lastReadPosition = 0;
    this.pollGitOpsEvents();
  }

  private async publishGitOps(envelope: EventEnvelope): Promise<void> {
    const today = new Date().toISOString().split('T')[0] as string;
    const gitopsPath: string = this.config.gitopsPath ?? path.join(process.cwd(), '_bus/events');
    const eventsDir = path.join(gitopsPath, today);
    const eventsFile = path.join(eventsDir, 'events.jsonl');

    // Ensure directory exists
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }

    // Append event as JSON line
    const line = JSON.stringify(envelope) + '\n';
    fs.appendFileSync(eventsFile, line);
  }

  private pollGitOpsEvents(): void {
    const today = new Date().toISOString().split('T')[0] as string;
    const gitopsPath: string = this.config.gitopsPath ?? path.join(process.cwd(), '_bus/events');
    const eventsFile = path.join(gitopsPath, today, 'events.jsonl');

    if (!fs.existsSync(eventsFile)) {
      return;
    }

    const content = fs.readFileSync(eventsFile, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim() !== '');

    // Process new lines only
    const newLines = lines.slice(this.lastReadPosition);
    this.lastReadPosition = lines.length;

    for (const line of newLines) {
      try {
        const envelope: EventEnvelope = JSON.parse(line);

        // Skip events from ourselves
        if (envelope.producer === this.config.agentName) {
          continue;
        }

        // Trigger handlers
        this.triggerHandlers(envelope.event, envelope);
      } catch (error) {
        console.error('[EventBus] Failed to parse event:', error);
      }
    }
  }

  // ========== Utilities ==========

  private async triggerHandlers(topic: string, envelope: EventEnvelope): Promise<void> {
    const handlers = this.handlers.get(topic);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      try {
        await handler(envelope);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${topic}:`, error);
      }
    }
  }

  private generateId(): string {
    // Simplified ID generation (should use ULID in production)
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private signPayload(payload: Record<string, any>): string {
    const hmac = createHmac('sha256', this.config.secret!);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('base64');
  }

  // Verify signature (currently unused but needed for future validation)
  // @ts-expect-error - Unused but needed for future validation
  private verifySignature(envelope: EventEnvelope): boolean {
    const expectedSignature = this.signPayload(envelope.payload);
    return envelope.signature === expectedSignature;
  }

  // ========== Test Helpers ==========

  /**
   * Get all events published in test mode
   */
  getTestEvents(): EventEnvelope[] {
    return this.testEvents;
  }

  /**
   * Clear test events
   */
  clearTestEvents(): void {
    this.testEvents = [];
  }
}

// Singleton instance for server-side usage
let eventBusInstance: EventBus | null = null;

export function getEventBus(config?: EventBusConfig): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(
      config || {
        mode: 'gitops',
        agentName: 'ai-conductor',
      }
    );
  }
  return eventBusInstance;
}
