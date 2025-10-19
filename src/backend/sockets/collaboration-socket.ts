/**
 * Collaboration WebSocket Handlers
 * Real-time collaboration event handlers for Socket.IO
 * Integrates CRDT, presence, chat, and locking services
 */

import type { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { crdtService } from '../services/crdt-service';
import { presenceService } from '../services/presence-service';
import { collaborationService } from '../services/collaboration-service';
import { projectChatService } from '../services/project-chat-service';
import type {
  PresenceUpdate,
  SyncMessage,
  LockRequest,
  SendChatMessageRequest,
  CreateCommentRequest,
} from '../../types/collaboration';

interface CollaborationSocket extends Socket {
  userId?: string;
  username?: string;
  projectRooms: Set<string>;
}

/**
 * Setup collaboration event handlers for a socket
 */
export function setupCollaborationHandlers(socket: CollaborationSocket): void {
  // Track which project rooms this socket has joined
  socket.projectRooms = new Set();

  /**
   * Join a project collaboration session
   */
  socket.on('collab:join', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      const userId = socket.userId || socket.id;
      const username = socket.username || 'Anonymous';

      // Verify user has access to project
      const permissions = await collaborationService.getPermissions(projectId, userId);
      if (!permissions.canEdit && !permissions.canComment) {
        socket.emit('collab:error', {
          message: 'You do not have access to this project',
        });
        return;
      }

      // Join Socket.IO room
      const roomName = `collab:${projectId}`;
      socket.join(roomName);
      socket.projectRooms.add(projectId);

      // Register presence
      const presence = await presenceService.join(projectId, userId, username);

      // Get CRDT document and sync state
      const doc = crdtService.getDocument(projectId);
      const stateVector = crdtService.getStateVector(projectId);

      // Subscribe to CRDT updates
      const unsubscribe = crdtService.subscribe(projectId, (update: Uint8Array) => {
        socket.emit('collab:sync', {
          type: 'update',
          update,
          timestamp: new Date(),
        });
      });

      // Store unsubscribe function for cleanup
      socket.data.crdtUnsubscribe = socket.data.crdtUnsubscribe || new Map();
      socket.data.crdtUnsubscribe.set(projectId, unsubscribe);

      // Get current session stats
      const stats = await collaborationService.getSessionStats(projectId);

      // Get all active users
      const activeUsers = await presenceService.getAll(projectId);

      // Get locked tracks
      const lockedTracks = await collaborationService.getLockedTracks(projectId);

      // Notify other users
      socket.to(roomName).emit('collab:user-joined', {
        userId,
        username,
        avatar: undefined,
        color: presence.color,
        timestamp: new Date(),
      });

      // Send initial state to joining user
      socket.emit('collab:joined', {
        projectId,
        stateVector,
        presence,
        activeUsers,
        lockedTracks,
        stats,
        permissions,
        timestamp: new Date(),
      });

      logger.info(`User ${username} (${userId}) joined collaboration session for project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:join:', error);
      socket.emit('collab:error', {
        message: 'Failed to join collaboration session',
      });
    }
  });

  /**
   * Leave a project collaboration session
   */
  socket.on('collab:leave', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      const userId = socket.userId || socket.id;

      await leaveProject(socket, projectId);

      logger.info(`User ${userId} left collaboration session for project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:leave:', error);
    }
  });

  /**
   * Sync CRDT updates
   */
  socket.on('collab:sync', async (data: SyncMessage & { projectId: string }) => {
    try {
      const { projectId, type, update, stateVector } = data;
      const userId = socket.userId || socket.id;

      if (type === 'update' && update) {
        // Apply update to CRDT
        crdtService.applyUpdate(projectId, update, userId);

        // Broadcast to other users (CRDT service will handle this via subscription)
        logger.debug(`Applied CRDT update from user ${userId} for project ${projectId}`);
      } else if (type === 'sync' && stateVector) {
        // Client requesting sync (e.g., after reconnect)
        const stateDiff = crdtService.getStateDifference(projectId, stateVector);

        socket.emit('collab:sync', {
          type: 'update',
          update: stateDiff,
          timestamp: new Date(),
        });

        logger.debug(`Sent state diff to user ${userId} for project ${projectId}`);
      }
    } catch (error) {
      logger.error('Error in collab:sync:', error);
      socket.emit('collab:error', {
        message: 'Failed to sync changes',
      });
    }
  });

  /**
   * Update presence (status, cursor position, etc.)
   */
  socket.on('collab:presence', async (data: PresenceUpdate & { projectId: string }) => {
    try {
      const { projectId, ...update } = data;
      const userId = socket.userId || socket.id;

      await presenceService.update(projectId, userId, update);

      // Broadcast to other users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:presence-update', {
        userId,
        presence: update,
        timestamp: new Date(),
      });

      logger.debug(`Updated presence for user ${userId} in project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:presence:', error);
    }
  });

  /**
   * Heartbeat to keep presence alive
   */
  socket.on('collab:heartbeat', async (data: { projectId: string }) => {
    try {
      const { projectId } = data;
      const userId = socket.userId || socket.id;

      await presenceService.heartbeat(projectId, userId);
    } catch (error) {
      logger.error('Error in collab:heartbeat:', error);
    }
  });

  /**
   * Move cursor
   */
  socket.on('collab:cursor', async (data: {
    projectId: string;
    cursor: { time: number; trackId?: string };
  }) => {
    try {
      const { projectId, cursor } = data;
      const userId = socket.userId || socket.id;
      const username = socket.username || 'Anonymous';

      await presenceService.updateCursor(projectId, userId, cursor);

      // Get user color
      const presence = await presenceService.get(projectId, userId);

      // Broadcast to other users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:cursor-moved', {
        userId,
        username,
        color: presence?.color || '#4ECDC4',
        cursor,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error in collab:cursor:', error);
    }
  });

  /**
   * Request track lock
   */
  socket.on('collab:lock-request', async (data: { projectId: string } & LockRequest) => {
    try {
      const { projectId, ...request } = data;
      const userId = socket.userId || socket.id;
      const username = socket.username || 'Anonymous';

      const result = await collaborationService.requestTrackLock(
        projectId,
        userId,
        username,
        request
      );

      // Send result to requester
      socket.emit('collab:lock-response', result);

      // If successful, notify other users
      if (result.success && result.lock) {
        const roomName = `collab:${projectId}`;
        socket.to(roomName).emit('collab:track-locked', {
          trackId: result.lock.trackId,
          userId,
          username,
          expiresAt: result.lock.expiresAt,
          timestamp: new Date(),
        });

        logger.info(`User ${username} locked track ${request.trackId} in project ${projectId}`);
      }
    } catch (error) {
      logger.error('Error in collab:lock-request:', error);
      socket.emit('collab:lock-response', {
        success: false,
        message: 'Failed to acquire lock',
      });
    }
  });

  /**
   * Release track lock
   */
  socket.on('collab:lock-release', async (data: { projectId: string; trackId: string }) => {
    try {
      const { projectId, trackId } = data;
      const userId = socket.userId || socket.id;

      await collaborationService.releaseTrackLock(projectId, trackId, userId);

      // Notify all users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:track-unlocked', {
        trackId,
        userId,
        timestamp: new Date(),
      });

      socket.emit('collab:lock-released', { trackId });

      logger.info(`User ${userId} released lock on track ${trackId} in project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:lock-release:', error);
      socket.emit('collab:error', {
        message: 'Failed to release lock',
      });
    }
  });

  /**
   * Send chat message
   */
  socket.on('collab:chat-send', async (data: { projectId: string } & SendChatMessageRequest) => {
    try {
      const { projectId, ...request } = data;
      const userId = socket.userId || socket.id;

      const message = await projectChatService.sendMessage(projectId, userId, request);

      // Broadcast to all users in project (including sender for confirmation)
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:chat-message', {
        message,
        timestamp: new Date(),
      });

      socket.emit('collab:chat-sent', { message });

      logger.debug(`Chat message sent by user ${userId} in project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:chat-send:', error);
      socket.emit('collab:error', {
        message: 'Failed to send chat message',
      });
    }
  });

  /**
   * Create comment
   */
  socket.on('collab:comment-create', async (data: { projectId: string } & CreateCommentRequest) => {
    try {
      const { projectId, ...request } = data;
      const userId = socket.userId || socket.id;

      const comment = await projectChatService.createComment(projectId, userId, request);

      // Broadcast to all users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:comment-added', {
        comment,
        timestamp: new Date(),
      });

      socket.emit('collab:comment-created', { comment });

      logger.debug(`Comment created by user ${userId} in project ${projectId}`);
    } catch (error) {
      logger.error('Error in collab:comment-create:', error);
      socket.emit('collab:error', {
        message: 'Failed to create comment',
      });
    }
  });

  /**
   * Resolve comment
   */
  socket.on('collab:comment-resolve', async (data: { commentId: string; projectId: string }) => {
    try {
      const { commentId, projectId } = data;
      const userId = socket.userId || socket.id;

      const comment = await projectChatService.updateComment(commentId, userId, {
        isResolved: true,
      });

      // Broadcast to all users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:comment-resolved', {
        commentId,
        userId,
        timestamp: new Date(),
      });

      socket.emit('collab:comment-updated', { comment });

      logger.debug(`Comment ${commentId} resolved by user ${userId}`);
    } catch (error) {
      logger.error('Error in collab:comment-resolve:', error);
      socket.emit('collab:error', {
        message: 'Failed to resolve comment',
      });
    }
  });

  /**
   * Create version snapshot
   */
  socket.on('collab:version-create', async (data: {
    projectId: string;
    description?: string;
  }) => {
    try {
      const { projectId, description } = data;
      const userId = socket.userId || socket.id;

      const version = await collaborationService.createVersion(projectId, userId, description);

      // Notify all users
      const roomName = `collab:${projectId}`;
      socket.to(roomName).emit('collab:version-created', {
        version,
        userId,
        timestamp: new Date(),
      });

      socket.emit('collab:version-created', { version });

      logger.info(`Version ${version.version} created for project ${projectId} by user ${userId}`);
    } catch (error) {
      logger.error('Error in collab:version-create:', error);
      socket.emit('collab:error', {
        message: 'Failed to create version',
      });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId || socket.id;

      // Leave all project rooms
      for (const projectId of socket.projectRooms) {
        await leaveProject(socket, projectId);
      }

      logger.info(`User ${userId} disconnected from collaboration`);
    } catch (error) {
      logger.error('Error in disconnect handler:', error);
    }
  });
}

/**
 * Helper function to handle leaving a project
 */
async function leaveProject(socket: CollaborationSocket, projectId: string): Promise<void> {
  const userId = socket.userId || socket.id;
  const username = socket.username || 'Anonymous';
  const roomName = `collab:${projectId}`;

  // Leave Socket.IO room
  socket.leave(roomName);
  socket.projectRooms.delete(projectId);

  // Unsubscribe from CRDT updates
  const unsubscribe = socket.data.crdtUnsubscribe?.get(projectId);
  if (unsubscribe) {
    unsubscribe();
    socket.data.crdtUnsubscribe.delete(projectId);
  }

  // Remove presence
  await presenceService.leave(projectId, userId);

  // Release any held locks
  const locks = await collaborationService.getLockedTracks(projectId);
  for (const lock of locks) {
    if (lock.userId === userId && lock.autoRelease) {
      await collaborationService.releaseTrackLock(projectId, lock.trackId, userId);

      // Notify others
      socket.to(roomName).emit('collab:track-unlocked', {
        trackId: lock.trackId,
        userId,
        timestamp: new Date(),
      });
    }
  }

  // Notify other users
  socket.to(roomName).emit('collab:user-left', {
    userId,
    username,
    timestamp: new Date(),
  });
}

/**
 * Emit collaboration event to a project room (used by services)
 */
export function emitToProject(
  io: any,
  projectId: string,
  event: string,
  data: any
): void {
  const roomName = `collab:${projectId}`;
  io.to(roomName).emit(event, data);
}
