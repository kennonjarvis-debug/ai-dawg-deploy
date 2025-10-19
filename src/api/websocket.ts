// WebSocket Client for Real-time Updates
// Handles project collaboration, live updates, and real-time notifications

import { io, Socket } from 'socket.io-client';

export interface WebSocketEvent {
  type: string;
  payload: any;
}

export type EventHandler = (payload: any) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private token: string | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5
  private messageQueue: Array<{ event: string; data: any }> = [];
  private isOnline = true;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    // Auto-detect protocol and use environment variable for production
    const baseUrl = (() => {
      if (url) return url;

      const envUrl = typeof window !== 'undefined' && import.meta?.env?.VITE_WEBSOCKET_URL
        ? import.meta.env.VITE_WEBSOCKET_URL
        : null;

      if (envUrl) {
        // Ensure https:// URLs work with Socket.IO
        return envUrl;
      }

      // For local development
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3001';
      }

      // For production, use same host with appropriate protocol
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${window.location.hostname}`;
      }

      return 'http://localhost:3001';
    })();

    console.log('[WebSocket] Connecting to:', baseUrl);
    this.url = baseUrl;
  }

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.token = token;
      this.socket = io(this.url, {
        auth: {
          token,
          userId: 'user-123', // Match the hardcoded userId in API routes
        },
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 15000,
        upgrade: true, // Allow upgrade from polling to WebSocket
        rememberUpgrade: true,
        forceNew: false,
        multiplex: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.warn('[WebSocket] Failed to initialize connection:', error);
      // Gracefully continue without WebSocket - app will function in non-realtime mode
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
    this.reconnectAttempts = 0;
    this.messageQueue = [];
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.isOnline = true;
      this.emit('connected', {});

      // Flush message queue on reconnect
      this.flushMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      this.isOnline = false;

      // Exponential backoff with jitter
      const baseDelay = 1000;
      const maxDelay = 30000;
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter, maxDelay);

      // Only log on first attempt and max attempts to reduce console noise
      if (this.reconnectAttempts === 1) {
        console.warn('[WebSocket] Unable to connect - will retry in background');
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('[WebSocket] Max reconnection attempts reached - running in offline mode');
        this.emit('max_reconnect_failed', {});

        // Schedule a retry after a longer delay (5 minutes)
        this.scheduleReconnect(300000);
      } else {
        console.debug(`[WebSocket] Reconnect attempt ${this.reconnectAttempts}, next retry in ${Math.round(delay / 1000)}s`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attemptNumber });
    });

    // Project events
    this.socket.on('project:updated', (data) => this.emit('project:updated', data));
    this.socket.on('project:deleted', (data) => this.emit('project:deleted', data));

    // Track events
    this.socket.on('track:created', (data) => this.emit('track:created', data));
    this.socket.on('track:updated', (data) => this.emit('track:updated', data));
    this.socket.on('track:deleted', (data) => this.emit('track:deleted', data));
    this.socket.on('track:reordered', (data) => this.emit('track:reordered', data));

    // Clip events
    this.socket.on('clip:created', (data) => this.emit('clip:created', data));
    this.socket.on('clip:updated', (data) => this.emit('clip:updated', data));
    this.socket.on('clip:deleted', (data) => this.emit('clip:deleted', data));

    // Collaboration events
    this.socket.on('collaborator:joined', (data) => this.emit('collaborator:joined', data));
    this.socket.on('collaborator:left', (data) => this.emit('collaborator:left', data));
    this.socket.on('cursor:moved', (data) => this.emit('cursor:moved', data));

    // Render events
    this.socket.on('render:progress', (data) => this.emit('render:progress', data));
    this.socket.on('render:completed', (data) => this.emit('render:completed', data));
    this.socket.on('render:failed', (data) => this.emit('render:failed', data));

    // AI processing events
    this.socket.on('ai:processing', (data) => this.emit('ai:processing', data));
    this.socket.on('ai:completed', (data) => this.emit('ai:completed', data));
    this.socket.on('ai:failed', (data) => this.emit('ai:failed', data));

    // DAW integration events (beat generation, etc.)
    this.socket.on('daw:audio:loaded', (data) => this.emit('daw:audio:loaded', data));
    this.socket.on('daw:transport:sync', (data) => this.emit('daw:transport:sync', data));
    this.socket.on('generation:started', (data) => this.emit('generation:started', data));
    this.socket.on('generation:progress', (data) => this.emit('generation:progress', data));
    this.socket.on('generation:completed', (data) => this.emit('generation:completed', data));
    this.socket.on('generation:failed', (data) => this.emit('generation:failed', data));
  }

  // Event Management
  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit(event: string, payload: any) {
    // Debug logging for DAW events
    if (event.startsWith('daw:') || event.startsWith('generation:')) {
      console.log(`[WebSocket] Emitting event: ${event}`, payload);
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (event.startsWith('daw:') || event.startsWith('generation:')) {
        console.log(`[WebSocket] Found ${handlers.size} handler(s) for ${event}`);
      }
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error('[WebSocket] Handler error:', error);
        }
      });
    } else {
      if (event.startsWith('daw:') || event.startsWith('generation:')) {
        console.warn(`[WebSocket] No handlers registered for event: ${event}`);
      }
    }
  }

  // Room Management, Cursor Sharing, and Playback Sync methods are defined below with queue support

  // Status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Message Queue Methods
  private flushMessageQueue() {
    if (this.messageQueue.length === 0 || !this.socket?.connected) {
      return;
    }

    console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.emit(message.event, message.data);
      }
    }
  }

  private queueMessage(event: string, data: any) {
    // Limit queue size to prevent memory issues
    const MAX_QUEUE_SIZE = 100;

    if (this.messageQueue.length >= MAX_QUEUE_SIZE) {
      console.warn('[WebSocket] Message queue full, dropping oldest message');
      this.messageQueue.shift();
    }

    this.messageQueue.push({ event, data });
    console.debug(`[WebSocket] Queued message: ${event} (queue size: ${this.messageQueue.length})`);
  }

  private sendOrQueue(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.queueMessage(event, data);
    }
  }

  private scheduleReconnect(delay: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`[WebSocket] Scheduling reconnect in ${Math.round(delay / 1000)}s`);

    this.reconnectTimer = setTimeout(() => {
      if (this.token && !this.socket?.connected) {
        console.log('[WebSocket] Attempting scheduled reconnect');
        this.reconnectAttempts = 0; // Reset attempts for fresh start
        this.connect(this.token);
      }
    }, delay);
  }

  // Updated emit methods to use queue
  sendCursorPosition(projectId: string, position: { x: number; y: number; time: number }) {
    this.sendOrQueue('cursor:move', { projectId, position });
  }

  syncPlayback(projectId: string, state: { isPlaying: boolean; currentTime: number }) {
    this.sendOrQueue('playback:sync', { projectId, state });
  }

  joinProject(projectId: string) {
    this.sendOrQueue('join:project', { projectId });
  }

  leaveProject(projectId: string) {
    this.sendOrQueue('leave:project', { projectId });
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
