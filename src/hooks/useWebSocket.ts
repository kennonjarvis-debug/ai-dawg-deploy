import { useEffect, useState, useCallback } from 'react';
import { wsClient, EventHandler } from '../api/websocket';

/**
 * React hook for WebSocket event subscriptions
 * Automatically handles subscription and cleanup
 */
export function useWebSocketEvent(event: string, handler: EventHandler) {
  useEffect(() => {
    // Subscribe to event
    const unsubscribe = wsClient.on(event, handler);

    // Cleanup on unmount
    return unsubscribe;
  }, [event, handler]);
}

/**
 * Hook for subscribing to multiple WebSocket events
 */
export function useWebSocketEvents(events: Record<string, EventHandler>) {
  useEffect(() => {
    // Subscribe to all events
    const unsubscribers = Object.entries(events).map(([event, handler]) =>
      wsClient.on(event, handler)
    );

    // Cleanup all subscriptions
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [events]);
}

/**
 * Hook for project room management
 */
export function useProjectRoom(projectId: string | null) {
  useEffect(() => {
    if (!projectId || !wsClient.isConnected()) {
      return;
    }

    // Join project room
    wsClient.joinProject(projectId);

    // Leave room on unmount or project change
    return () => {
      wsClient.leaveProject(projectId);
    };
  }, [projectId]);
}

/**
 * Hook for playback synchronization
 */
export function useSyncPlayback(
  projectId: string | null,
  isPlaying: boolean,
  currentTime: number
) {
  useEffect(() => {
    if (!projectId || !wsClient.isConnected()) {
      return;
    }

    // Sync playback state with other collaborators
    wsClient.syncPlayback(projectId, { isPlaying, currentTime });
  }, [projectId, isPlaying, currentTime]);
}

/**
 * Hook for complete transport state synchronization
 * Syncs ALL transport properties for multi-user collaboration
 */
export function useSyncTransport(
  projectId: string | null,
  transportState: {
    isPlaying: boolean;
    isRecording: boolean;
    isRecordArmed: boolean;
    isLooping: boolean;
    currentTime: number;
    bpm: number;
    key: string;
    timeSignature: { numerator: number; denominator: number };
    loopStart: number;
    loopEnd: number;
    punchMode: 'off' | 'quick-punch' | 'track-punch';
    punchInTime: number | null;
    punchOutTime: number | null;
  }
) {
  useEffect(() => {
    if (!projectId || !wsClient.isConnected()) {
      return;
    }

    // Sync complete transport state with other collaborators
    wsClient.emit('transport:sync', {
      projectId,
      state: transportState,
      timestamp: Date.now(),
    });
  }, [
    projectId,
    transportState.isPlaying,
    transportState.isRecording,
    transportState.isRecordArmed,
    transportState.isLooping,
    transportState.currentTime,
    transportState.bpm,
    transportState.key,
    transportState.timeSignature.numerator,
    transportState.timeSignature.denominator,
    transportState.loopStart,
    transportState.loopEnd,
    transportState.punchMode,
    transportState.punchInTime,
    transportState.punchOutTime,
  ]);
}

// === CHAT-TO-CREATE WEBSOCKET HOOKS ===

/**
 * Chat streaming data
 */
export interface ChatStreamData {
  conversationId: string;
  messageId: string;
  chunk: string;
}

export interface ChatCompleteData {
  conversationId: string;
  messageId: string;
  content: string;
}

export interface ChatErrorData {
  conversationId: string;
  error: string;
}

/**
 * Hook for chat streaming events
 */
export function useChatStreaming(conversationId: string | null) {
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    const handleStream = (data: ChatStreamData) => {
      if (data.conversationId === conversationId) {
        setStreamingMessageId(data.messageId);
        setStreamingMessage((prev) => prev + data.chunk);
        setIsStreaming(true);
      }
    };

    const handleComplete = (data: ChatCompleteData) => {
      if (data.conversationId === conversationId) {
        setStreamingMessage('');
        setStreamingMessageId(null);
        setIsStreaming(false);
      }
    };

    const unsubStream = wsClient.on('chat:stream', handleStream);
    const unsubComplete = wsClient.on('chat:complete', handleComplete);

    return () => {
      unsubStream();
      unsubComplete();
    };
  }, [conversationId]);

  const clearStream = useCallback(() => {
    setStreamingMessage('');
    setStreamingMessageId(null);
    setIsStreaming(false);
  }, []);

  return {
    streamingMessage,
    streamingMessageId,
    isStreaming,
    clearStream,
  };
}

/**
 * Generation job progress data
 */
export interface GenerationQueuedData {
  jobId: string;
  type: string;
  params: any;
}

export interface GenerationProgressData {
  jobId: string;
  progress: number;
  stage: string;
  message?: string;
}

export interface GenerationCompleteData {
  jobId: string;
  audioUrl: string;
  metadata: any;
}

export interface GenerationFailedData {
  jobId: string;
  error: string;
}

/**
 * Hook for generation progress tracking
 */
export function useGenerationProgress(jobId: string | null) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationCompleteData | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const handleQueued = (data: GenerationQueuedData) => {
      if (data.jobId === jobId) {
        setProgress(0);
        setStage('queued');
        setMessage('Generation queued...');
        setIsComplete(false);
        setIsFailed(false);
      }
    };

    const handleProgress = (data: GenerationProgressData) => {
      if (data.jobId === jobId) {
        setProgress(data.progress);
        setStage(data.stage);
        setMessage(data.message || `${data.stage}...`);
      }
    };

    const handleComplete = (data: GenerationCompleteData) => {
      if (data.jobId === jobId) {
        setProgress(100);
        setStage('completed');
        setMessage('Generation complete!');
        setIsComplete(true);
        setResult(data);
      }
    };

    const handleFailed = (data: GenerationFailedData) => {
      if (data.jobId === jobId) {
        setIsFailed(true);
        setError(data.error);
        setMessage(`Failed: ${data.error}`);
      }
    };

    const unsubQueued = wsClient.on('generation:queued', handleQueued);
    const unsubProgress = wsClient.on('generation:progress', handleProgress);
    const unsubComplete = wsClient.on('generation:completed', handleComplete);
    const unsubFailed = wsClient.on('generation:failed', handleFailed);

    return () => {
      unsubQueued();
      unsubProgress();
      unsubComplete();
      unsubFailed();
    };
  }, [jobId]);

  const reset = useCallback(() => {
    setProgress(0);
    setStage('');
    setMessage('');
    setIsComplete(false);
    setIsFailed(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    progress,
    stage,
    message,
    isComplete,
    isFailed,
    error,
    result,
    reset,
  };
}

/**
 * Hook for tracking multiple generation jobs
 */
export function useGenerationJobs() {
  const [jobs, setJobs] = useState<Map<string, GenerationProgressData>>(new Map());
  const [completedJobs, setCompletedJobs] = useState<Map<string, GenerationCompleteData>>(new Map());

  useEffect(() => {
    const handleQueued = (data: GenerationQueuedData) => {
      setJobs((prev) => {
        const updated = new Map(prev);
        updated.set(data.jobId, {
          jobId: data.jobId,
          progress: 0,
          stage: 'queued',
        });
        return updated;
      });
    };

    const handleProgress = (data: GenerationProgressData) => {
      setJobs((prev) => {
        const updated = new Map(prev);
        updated.set(data.jobId, data);
        return updated;
      });
    };

    const handleComplete = (data: GenerationCompleteData) => {
      setJobs((prev) => {
        const updated = new Map(prev);
        updated.delete(data.jobId);
        return updated;
      });
      setCompletedJobs((prev) => {
        const updated = new Map(prev);
        updated.set(data.jobId, data);
        return updated;
      });
    };

    const handleFailed = (data: GenerationFailedData) => {
      setJobs((prev) => {
        const updated = new Map(prev);
        updated.delete(data.jobId);
        return updated;
      });
    };

    const unsubQueued = wsClient.on('generation:queued', handleQueued);
    const unsubProgress = wsClient.on('generation:progress', handleProgress);
    const unsubComplete = wsClient.on('generation:completed', handleComplete);
    const unsubFailed = wsClient.on('generation:failed', handleFailed);

    return () => {
      unsubQueued();
      unsubProgress();
      unsubComplete();
      unsubFailed();
    };
  }, []);

  const clearCompletedJob = useCallback((jobId: string) => {
    setCompletedJobs((prev) => {
      const updated = new Map(prev);
      updated.delete(jobId);
      return updated;
    });
  }, []);

  return {
    activeJobs: jobs,
    completedJobs,
    clearCompletedJob,
  };
}
