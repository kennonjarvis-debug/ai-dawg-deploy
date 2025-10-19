import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { prisma } from '../../backend/config/database';
import { logger } from '../../backend/utils/logger';
import {
  wsConnectionsGauge,
  wsConnectionsTotal,
  wsErrorsTotal,
  wsMessagesTotal,
  wsLatencyHistogram,
} from '../../backend/metrics';
import type {
  WebSocketEventData,
  ProjectUpdateData,
  TrackEventData,
  ClipEventData,
  PlaybackSyncData,
  CursorMoveData,
  AIEventData,
  RecordingEventData,
  SelectionEventData,
  LyricsEventData,
  ClipsAnalysisData,
} from '../../types/api';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Export io instance for use in other services
let ioInstance: SocketIOServer | null = null;
let redisAdapter: { pubClient: Redis; subClient: Redis } | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export async function initializeWebSocket(io: SocketIOServer) {
  // Configure Redis adapter for multi-instance scaling if enabled
  if (process.env.WEBSOCKET_REDIS_ADAPTER === 'true' && process.env.REDIS_URL) {
    try {
      logger.info('Configuring WebSocket Redis adapter for clustering...');

      const pubClient = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis pub client connection retry attempt ${times}, delay: ${delay}ms`);
          return delay;
        },
      });

      const subClient = pubClient.duplicate();

      // Wait for connections
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          pubClient.on('connect', () => {
            logger.info('Redis pub client connected');
            resolve();
          });
          pubClient.on('error', (err) => {
            logger.error('Redis pub client error:', err);
            reject(err);
          });
        }),
        new Promise<void>((resolve, reject) => {
          subClient.on('connect', () => {
            logger.info('Redis sub client connected');
            resolve();
          });
          subClient.on('error', (err) => {
            logger.error('Redis sub client error:', err);
            reject(err);
          });
        }),
      ]);

      // Attach Redis adapter to Socket.io
      io.adapter(createAdapter(pubClient, subClient));
      redisAdapter = { pubClient, subClient };

      logger.info('✓ WebSocket Redis adapter enabled for clustering');
      logger.info(`  Pub/Sub synchronization active across multiple instances`);
    } catch (error) {
      logger.error('Failed to configure Redis adapter:', error);
      logger.warn('WebSocket will run in single-instance mode (no clustering)');
    }
  } else {
    logger.info('WebSocket Redis adapter disabled - running in single-instance mode');
    logger.info('  Set WEBSOCKET_REDIS_ADAPTER=true and REDIS_URL to enable clustering');
  }

  ioInstance = io;

  // TEMPORARILY DISABLED: Origin verification middleware (for debugging)
  // TODO: Re-enable after fixing WebSocket connection issue
  /*
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
      const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());

      // Verify Origin header to prevent CSRF attacks on WebSocket connections
      if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        logger.warn(`WebSocket connection rejected: Invalid origin ${origin}`);
        return next(new Error('Invalid origin'));
      }

      next();
    } catch (error) {
      logger.error('WebSocket origin verification error:', error);
      next(new Error('Origin verification failed'));
    }
  });
  */

  // TEMPORARILY DISABLED: Authentication middleware (for debugging)
  // TODO: Re-enable after fixing WebSocket connection issue
  /*
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server configuration error'));
      }

      // Verify token
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Get user session
      const session = await prisma.session.findUnique({
        where: { token },
        include: { User: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Invalid or expired token'));
      }

      // Attach user info to socket
      socket.userId = session.User.id;
      socket.username = session.User.username;

      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  */

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const username = socket.username || 'anonymous';
    // When auth is disabled, try to get userId from auth.userId, otherwise fall back to socket.id
    const userId = socket.userId || (socket.handshake.auth?.userId as string) || socket.id;

    logger.info(`WebSocket client connected: ${socket.id} (user: ${username}, userId: ${userId})`);

    // Metrics: track connection
    wsConnectionsGauge.labels('websocket').inc();
    wsConnectionsTotal.labels('websocket', 'connect').inc();

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Project collaboration handlers
    socket.on('join:project', async ({ projectId }: { projectId: string }) => {
      try {
        // Verify user has access to project (only if authenticated)
        if (socket.userId) {
          const project = await prisma.project.findFirst({
            where: {
              id: projectId,
              OR: [
                { userId: socket.userId },
                { Collaborator: { some: { email: socket.username } } },
              ],
            },
          });

          if (!project) {
            socket.emit('error', { message: 'Project not found or access denied' });
            return;
          }
        }

        socket.join(`project:${projectId}`);
        logger.info(`User ${username} joined project ${projectId}`);

        // Notify other collaborators
        socket.to(`project:${projectId}`).emit('collaborator:joined', {
          userId,
          username,
        });

        socket.emit('joined:project', { projectId });
      } catch (error) {
        logger.error('Join project error:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    socket.on('leave:project', ({ projectId }: { projectId: string }) => {
      socket.leave(`project:${projectId}`);
      logger.info(`User ${username} left project ${projectId}`);

      socket.to(`project:${projectId}`).emit('collaborator:left', {
        userId,
        username,
      });
    });

    // Real-time project updates
    socket.on('project:update', async (data: ProjectUpdateData) => {
      const { projectId, update } = data;

      // Broadcast to all users in the project except sender
      socket.to(`project:${projectId}`).emit('project:updated', {
        userId,
        username,
        update,
        timestamp: new Date(),
      });

      logger.debug(`Project update from ${username} in ${projectId}`);
    });

    // Track events
    socket.on('track:create', (data: TrackEventData) => {
      const { projectId, track } = data;
      socket.to(`project:${projectId}`).emit('track:created', {
        userId,
        track,
        timestamp: new Date(),
      });
    });

    socket.on('track:update', (data: TrackEventData) => {
      const { projectId, trackId, changes } = data;
      socket.to(`project:${projectId}`).emit('track:updated', {
        userId,
        trackId,
        changes,
        timestamp: new Date(),
      });
    });

    socket.on('track:delete', (data: TrackEventData) => {
      const { projectId, trackId } = data;
      socket.to(`project:${projectId}`).emit('track:deleted', {
        userId,
        trackId,
        timestamp: new Date(),
      });
    });

    socket.on('track:reorder', (data: TrackEventData) => {
      const { projectId, trackOrders } = data;
      socket.to(`project:${projectId}`).emit('track:reordered', {
        userId,
        trackOrders,
        timestamp: new Date(),
      });
    });

    // Clip events
    socket.on('clip:create', (data: ClipEventData) => {
      const { projectId, clip } = data;
      socket.to(`project:${projectId}`).emit('clip:created', {
        userId,
        clip,
        timestamp: new Date(),
      });
    });

    socket.on('clip:update', (data: ClipEventData) => {
      const { projectId, clipId, changes } = data;
      socket.to(`project:${projectId}`).emit('clip:updated', {
        userId,
        clipId,
        changes,
        timestamp: new Date(),
      });
    });

    socket.on('clip:delete', (data: ClipEventData) => {
      const { projectId, clipId } = data;
      socket.to(`project:${projectId}`).emit('clip:deleted', {
        userId,
        clipId,
        timestamp: new Date(),
      });
    });

    // Playback synchronization
    socket.on('playback:sync', (data: PlaybackSyncData) => {
      const { projectId, state } = data;
      socket.to(`project:${projectId}`).emit('playback:synced', {
        userId,
        state,
        timestamp: new Date(),
      });
    });

    // Cursor position for collaboration awareness
    socket.on('cursor:move', (data: CursorMoveData) => {
      const { projectId, position } = data;
      socket.to(`project:${projectId}`).emit('cursor:moved', {
        userId,
        username,
        position,
      });
    });

    // AI processing events
    socket.on('ai:start', (data: AIEventData) => {
      const { projectId, taskId, taskType } = data;
      socket.to(`project:${projectId}`).emit('ai:started', {
        userId,
        username,
        taskId,
        taskType,
        timestamp: new Date(),
      });
    });

    socket.on('ai:progress', (data: AIEventData) => {
      const { projectId, taskId, progress, message } = data;
      socket.to(`project:${projectId}`).emit('ai:progress-update', {
        userId,
        taskId,
        progress,
        message,
        timestamp: new Date(),
      });
    });

    socket.on('ai:complete', (data: AIEventData) => {
      const { projectId, taskId, result } = data;
      socket.to(`project:${projectId}`).emit('ai:completed', {
        userId,
        username,
        taskId,
        result,
        timestamp: new Date(),
      });
    });

    socket.on('ai:error', (data: AIEventData) => {
      const { projectId, taskId, error } = data;
      socket.to(`project:${projectId}`).emit('ai:failed', {
        userId,
        taskId,
        error,
        timestamp: new Date(),
      });
    });

    // Recording events
    socket.on('recording:start', (data: RecordingEventData) => {
      const { projectId, trackId } = data;
      socket.to(`project:${projectId}`).emit('recording:started', {
        userId,
        username,
        trackId,
        timestamp: new Date(),
      });
    });

    socket.on('recording:stop', (data: RecordingEventData) => {
      const { projectId, trackId, clipId } = data;
      socket.to(`project:${projectId}`).emit('recording:stopped', {
        userId,
        trackId,
        clipId,
        timestamp: new Date(),
      });
    });

    // Selection events
    socket.on('selection:change', (data: SelectionEventData) => {
      const { projectId, selectedClips, selectedTracks } = data;
      socket.to(`project:${projectId}`).emit('selection:changed', {
        userId,
        username,
        selectedClips,
        selectedTracks,
        timestamp: new Date(),
      });
    });

    // Lyrics analysis events
    socket.on('lyrics:update', (data: LyricsEventData) => {
      const { projectId, trackId, lyrics } = data;
      socket.to(`project:${projectId}`).emit('lyrics:updated', {
        userId,
        username,
        trackId,
        lyrics,
        timestamp: new Date(),
      });
    });

    socket.on('lyrics:analyze-request', (data: LyricsEventData) => {
      const { projectId, trackId, lyrics, genre } = data;
      socket.to(`project:${projectId}`).emit('lyrics:analyzing', {
        userId,
        trackId,
        timestamp: new Date(),
      });
    });

    socket.on('lyrics:analysis-complete', (data: LyricsEventData) => {
      const { projectId, trackId, analysis } = data;
      socket.to(`project:${projectId}`).emit('lyrics:analyzed', {
        userId,
        trackId,
        analysis,
        timestamp: new Date(),
      });
    });

    socket.on('lyrics:section-labels-update', (data: LyricsEventData) => {
      const { projectId, trackId, sectionLabels } = data;
      socket.to(`project:${projectId}`).emit('lyrics:section-labels-updated', {
        userId,
        trackId,
        sectionLabels,
        timestamp: new Date(),
      });
    });

    socket.on('lyrics:recommendations-ready', (data: LyricsEventData) => {
      const { projectId, trackId, recommendations } = data;
      socket.to(`project:${projectId}`).emit('lyrics:recommendations', {
        userId,
        trackId,
        recommendations,
        timestamp: new Date(),
      });
    });

    // Multi-clip analysis events
    socket.on('clips:analyze-request', (data: ClipsAnalysisData) => {
      const { projectId, clipIds } = data;
      socket.to(`project:${projectId}`).emit('clips:analyzing', {
        userId,
        clipIds,
        timestamp: new Date(),
      });
    });

    socket.on('clips:analysis-complete', (data: ClipsAnalysisData) => {
      const { projectId, analysis } = data;
      socket.to(`project:${projectId}`).emit('clips:analyzed', {
        userId,
        analysis,
        timestamp: new Date(),
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id} (user: ${username})`);

      // Metrics: track disconnection
      wsConnectionsGauge.labels('websocket').dec();
      wsConnectionsTotal.labels('websocket', 'disconnect').inc();

      // Notify all project rooms the user was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('project:')) {
          socket.to(room).emit('collaborator:left', {
            userId,
            username,
          });
        }
      });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}:`, error);

      // Metrics: track errors
      wsErrorsTotal.labels('websocket', 'socket_error').inc();
    });

    // Helper to track message metrics
    const trackMessage = (eventType: string, direction: 'inbound' | 'outbound') => {
      wsMessagesTotal.labels('websocket', eventType, direction).inc();
    };

    // Track all events
    const originalOn = socket.on.bind(socket);
    socket.on = ((event: string, handler: (...args: unknown[]) => void) => {
      return originalOn(event, (...args: unknown[]) => {
        const start = Date.now();
        trackMessage(event, 'inbound');

        try {
          const result = handler(...args);
          const duration = (Date.now() - start) / 1000;
          wsLatencyHistogram.labels('websocket', event).observe(duration);
          return result;
        } catch (error) {
          wsErrorsTotal.labels('websocket', 'handler_error').inc();
          throw error;
        }
      });
    }) as typeof socket.on;
  });

  logger.info('WebSocket server initialized');
}

// Helper functions for emitting events from other services

export function emitToUser(userId: string, event: string, data: WebSocketEventData) {
  ioInstance?.to(`user:${userId}`).emit(event, data);
}

export function emitToProject(projectId: string, event: string, data: WebSocketEventData) {
  ioInstance?.to(`project:${projectId}`).emit(event, data);
}

export function emitRenderProgress(userId: string, jobId: string, progress: number) {
  emitToUser(userId, 'render:progress', {
    jobId,
    progress,
    timestamp: new Date(),
  });
}

export function emitRenderCompleted(userId: string, jobId: string, result: unknown) {
  emitToUser(userId, 'render:completed', {
    jobId,
    result,
    timestamp: new Date(),
  });
}

export function emitRenderFailed(userId: string, jobId: string, error: string) {
  emitToUser(userId, 'render:failed', {
    jobId,
    error,
    timestamp: new Date(),
  });
}

export function emitAIProcessing(userId: string, taskId: string, status: string) {
  emitToUser(userId, 'ai:processing', {
    taskId,
    status,
    timestamp: new Date(),
  });
}

export function emitAICompleted(userId: string, taskId: string, result: unknown) {
  emitToUser(userId, 'ai:completed', {
    taskId,
    result,
    timestamp: new Date(),
  });
}

export function emitAIFailed(userId: string, taskId: string, error: string) {
  emitToUser(userId, 'ai:failed', {
    taskId,
    error,
    timestamp: new Date(),
  });
}

// Chat-to-create specific event emitters
export function emitChatStream(conversationId: string, chunk: string) {
  ioInstance?.to(`conversation:${conversationId}`).emit('chat:stream', {
    conversationId,
    chunk,
    timestamp: new Date(),
  });
}

export function emitChatComplete(conversationId: string, messageId: string) {
  ioInstance?.to(`conversation:${conversationId}`).emit('chat:complete', {
    conversationId,
    messageId,
    timestamp: new Date(),
  });
}

export function emitGenerationQueued(userId: string, jobId: string, estimatedTime?: number) {
  emitToUser(userId, 'generation:queued', {
    jobId,
    estimatedTime,
    timestamp: new Date(),
  });
}

export function emitGenerationStarted(userId: string, jobId: string) {
  emitToUser(userId, 'generation:started', {
    jobId,
    timestamp: new Date(),
  });
}

export function emitGenerationProgress(userId: string, jobId: string, percent: number, stage: string) {
  emitToUser(userId, 'generation:progress', {
    jobId,
    percent,
    stage,
    timestamp: new Date(),
  });
}

export function emitGenerationCompleted(userId: string, jobId: string, audioUrl: string, metadata: Record<string, unknown>) {
  emitToUser(userId, 'generation:completed', {
    jobId,
    audioUrl,
    metadata,
    timestamp: new Date(),
  });
}

export function emitGenerationFailed(userId: string, jobId: string, error: string) {
  emitToUser(userId, 'generation:failed', {
    jobId,
    error,
    timestamp: new Date(),
  });
}

// Lyrics analysis event emitters
export function emitLyricsAnalyzed(userId: string, trackId: string, analysis: Record<string, unknown>) {
  emitToUser(userId, 'lyrics:analyzed', {
    trackId,
    analysis,
    timestamp: new Date(),
  });
}

export function emitLyricsSectionLabels(userId: string, trackId: string, sectionLabels: Array<{ time: number; label: string }>) {
  emitToUser(userId, 'lyrics:section-labels-updated', {
    trackId,
    sectionLabels,
    timestamp: new Date(),
  });
}

export function emitLyricsRecommendations(userId: string, trackId: string, recommendations: string[]) {
  emitToUser(userId, 'lyrics:recommendations', {
    trackId,
    recommendations,
    timestamp: new Date(),
  });
}

// Multi-clip analysis event emitters
export function emitClipsAnalyzed(userId: string, analysis: Record<string, unknown>) {
  emitToUser(userId, 'clips:analyzed', {
    analysis,
    timestamp: new Date(),
  });
}

// Graceful shutdown
export async function shutdownWebSocket() {
  logger.info('Shutting down WebSocket server...');

  // Close all Socket.io connections
  if (ioInstance) {
    ioInstance.close();
    logger.info('Socket.io server closed');
  }

  // Close Redis connections if using adapter
  if (redisAdapter) {
    try {
      await redisAdapter.pubClient.quit();
      await redisAdapter.subClient.quit();
      logger.info('Redis adapter connections closed');
    } catch (error) {
      logger.error('Error closing Redis connections:', error);
    }
  }

  logger.info('WebSocket server shutdown complete');
}
