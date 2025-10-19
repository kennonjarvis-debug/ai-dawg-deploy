/**
 * useCollaboration Hook
 * React hook for real-time collaboration features
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsClient } from '../../api/websocket';
import type {
  UserPresence,
  ChatMessage,
  Comment,
  TrackLock,
  ProjectPermissions,
  SendChatMessageRequest,
  CreateCommentRequest,
  LockRequest,
} from '../../types/collaboration';

interface CollaborationState {
  isConnected: boolean;
  activeUsers: UserPresence[];
  chatMessages: ChatMessage[];
  comments: Comment[];
  lockedTracks: Map<string, TrackLock>;
  permissions: ProjectPermissions | null;
  currentUserId: string | null;
}

export function useCollaboration(projectId: string | null) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    activeUsers: [],
    chatMessages: [],
    comments: [],
    lockedTracks: new Map(),
    permissions: null,
    currentUserId: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Join collaboration session
   */
  const join = useCallback(() => {
    if (!projectId) return;

    wsClient.emit('collab:join', { projectId });
  }, [projectId]);

  /**
   * Leave collaboration session
   */
  const leave = useCallback(() => {
    if (!projectId) return;

    wsClient.emit('collab:leave', { projectId });
  }, [projectId]);

  /**
   * Update presence (status, cursor, etc.)
   */
  const updatePresence = useCallback((update: Partial<UserPresence>) => {
    if (!projectId) return;

    wsClient.emit('collab:presence', {
      projectId,
      ...update,
    });
  }, [projectId]);

  /**
   * Update cursor position
   */
  const updateCursor = useCallback((time: number, trackId?: string) => {
    if (!projectId) return;

    wsClient.emit('collab:cursor', {
      projectId,
      cursor: { time, trackId },
    });
  }, [projectId]);

  /**
   * Request track lock
   */
  const requestLock = useCallback(async (trackId: string, duration?: number): Promise<boolean> => {
    if (!projectId) return false;

    return new Promise((resolve) => {
      const handleResponse = (response: { success: boolean }) => {
        wsClient.off('collab:lock-response', handleResponse);
        resolve(response.success);
      };

      wsClient.on('collab:lock-response', handleResponse);

      wsClient.emit('collab:lock-request', {
        projectId,
        trackId,
        duration,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        wsClient.off('collab:lock-response', handleResponse);
        resolve(false);
      }, 5000);
    });
  }, [projectId]);

  /**
   * Release track lock
   */
  const releaseLock = useCallback((trackId: string) => {
    if (!projectId) return;

    wsClient.emit('collab:lock-release', {
      projectId,
      trackId,
    });
  }, [projectId]);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((request: SendChatMessageRequest) => {
    if (!projectId) return;

    wsClient.emit('collab:chat-send', {
      projectId,
      ...request,
    });
  }, [projectId]);

  /**
   * Create comment
   */
  const createComment = useCallback((request: CreateCommentRequest) => {
    if (!projectId) return;

    wsClient.emit('collab:comment-create', {
      projectId,
      ...request,
    });
  }, [projectId]);

  /**
   * Resolve comment
   */
  const resolveComment = useCallback((commentId: string) => {
    if (!projectId) return;

    wsClient.emit('collab:comment-resolve', {
      projectId,
      commentId,
    });
  }, [projectId]);

  /**
   * Create version snapshot
   */
  const createVersion = useCallback((description?: string) => {
    if (!projectId) return;

    wsClient.emit('collab:version-create', {
      projectId,
      description,
    });
  }, [projectId]);

  /**
   * Send heartbeat
   */
  const sendHeartbeat = useCallback(() => {
    if (!projectId) return;

    wsClient.emit('collab:heartbeat', { projectId });
  }, [projectId]);

  // Setup event listeners
  useEffect(() => {
    if (!projectId) return;

    // Handle join confirmation
    const handleJoined = (data: any) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        activeUsers: data.activeUsers || [],
        lockedTracks: new Map(data.lockedTracks?.map((lock: TrackLock) => [lock.trackId, lock]) || []),
        permissions: data.permissions || null,
        currentUserId: data.presence?.userId || null,
      }));
    };

    // Handle user joined
    const handleUserJoined = (data: any) => {
      setState(prev => ({
        ...prev,
        activeUsers: [...prev.activeUsers, data],
      }));
    };

    // Handle user left
    const handleUserLeft = (data: any) => {
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.filter(u => u.userId !== data.userId),
      }));
    };

    // Handle presence update
    const handlePresenceUpdate = (data: any) => {
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(u =>
          u.userId === data.userId ? { ...u, ...data.presence } : u
        ),
      }));
    };

    // Handle track locked
    const handleTrackLocked = (data: TrackLock & { timestamp: Date }) => {
      setState(prev => {
        const newLocks = new Map(prev.lockedTracks);
        newLocks.set(data.trackId, data);
        return { ...prev, lockedTracks: newLocks };
      });
    };

    // Handle track unlocked
    const handleTrackUnlocked = (data: { trackId: string }) => {
      setState(prev => {
        const newLocks = new Map(prev.lockedTracks);
        newLocks.delete(data.trackId);
        return { ...prev, lockedTracks: newLocks };
      });
    };

    // Handle chat message
    const handleChatMessage = (data: { message: ChatMessage }) => {
      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, data.message],
      }));
    };

    // Handle comment added
    const handleCommentAdded = (data: { comment: Comment }) => {
      setState(prev => ({
        ...prev,
        comments: [...prev.comments, data.comment],
      }));
    };

    // Register listeners
    wsClient.on('collab:joined', handleJoined);
    wsClient.on('collab:user-joined', handleUserJoined);
    wsClient.on('collab:user-left', handleUserLeft);
    wsClient.on('collab:presence-update', handlePresenceUpdate);
    wsClient.on('collab:track-locked', handleTrackLocked);
    wsClient.on('collab:track-unlocked', handleTrackUnlocked);
    wsClient.on('collab:chat-message', handleChatMessage);
    wsClient.on('collab:comment-added', handleCommentAdded);

    // Auto-join on mount
    join();

    // Send periodic heartbeat
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      wsClient.off('collab:joined', handleJoined);
      wsClient.off('collab:user-joined', handleUserJoined);
      wsClient.off('collab:user-left', handleUserLeft);
      wsClient.off('collab:presence-update', handlePresenceUpdate);
      wsClient.off('collab:track-locked', handleTrackLocked);
      wsClient.off('collab:track-unlocked', handleTrackUnlocked);
      wsClient.off('collab:chat-message', handleChatMessage);
      wsClient.off('collab:comment-added', handleCommentAdded);
      leave();
    };
  }, [projectId, join, leave, sendHeartbeat]);

  return {
    ...state,
    updatePresence,
    updateCursor,
    requestLock,
    releaseLock,
    sendMessage,
    createComment,
    resolveComment,
    createVersion,
  };
}
