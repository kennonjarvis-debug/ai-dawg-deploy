/**
 * Dashboard SSE Hook
 * Real-time updates for dashboard data using Server-Sent Events
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { dashboardApi, RevenueData, UsageData, InsightData } from '../services/dashboardApi';

interface SSEEvent {
  type: 'revenue' | 'usage' | 'insight' | 'analytics' | 'connection';
  data: any;
  timestamp: string;
}

interface UseDashboardSSEOptions {
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing SSE connection to dashboard updates
 */
export function useDashboardSSE(options: UseDashboardSSEOptions = {}) {
  const {
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    filters,
    setConnectionStatus,
    addRevenue,
    addUsage,
    addInsight,
    setError,
  } = useDashboardStore();

  /**
   * Handle incoming SSE messages
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const sseEvent: SSEEvent = JSON.parse(event.data);

        switch (sseEvent.type) {
          case 'revenue':
            addRevenue(sseEvent.data as RevenueData);
            break;

          case 'usage':
            addUsage(sseEvent.data as UsageData);
            break;

          case 'insight':
            addInsight(sseEvent.data as InsightData);
            break;

          case 'analytics':
            // Update analytics data
            useDashboardStore.setState((state) => ({
              analytics: {
                ...state.analytics,
                ...sseEvent.data,
              },
            }));
            break;

          case 'connection':
            if (sseEvent.data.status === 'connected') {
              setConnectionStatus('connected');
              reconnectAttemptsRef.current = 0;
              onConnect?.();
            }
            break;

          default:
            console.warn('Unknown SSE event type:', sseEvent.type);
        }

        // Update last updated timestamp
        useDashboardStore.setState({ lastUpdated: new Date() });
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    },
    [addRevenue, addUsage, addInsight, setConnectionStatus, onConnect]
  );

  /**
   * Handle SSE connection errors
   */
  const handleError = useCallback(
    (event: Event) => {
      console.error('SSE connection error:', event);
      setConnectionStatus('disconnected');

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          connect();
        }, reconnectDelay);
      } else {
        const error = new Error('Max reconnection attempts reached');
        setError(error.message);
        onError?.(error);
      }

      onDisconnect?.();
    },
    [setConnectionStatus, setError, reconnectDelay, maxReconnectAttempts, onError, onDisconnect]
  );

  /**
   * Establish SSE connection
   */
  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create new EventSource connection
      const eventSource = dashboardApi.createSSEConnection(filters);

      // Set up event listeners
      eventSource.addEventListener('message', handleMessage);
      eventSource.addEventListener('error', handleError);

      // Handle connection open
      eventSource.addEventListener('open', () => {
        console.log('SSE connection established');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      });

      // Listen for specific event types
      eventSource.addEventListener('revenue', (event: MessageEvent) => {
        handleMessage(event);
      });

      eventSource.addEventListener('usage', (event: MessageEvent) => {
        handleMessage(event);
      });

      eventSource.addEventListener('insight', (event: MessageEvent) => {
        handleMessage(event);
      });

      eventSource.addEventListener('analytics', (event: MessageEvent) => {
        handleMessage(event);
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection error');
    }
  }, [filters, handleMessage, handleError, setConnectionStatus, setError, onConnect]);

  /**
   * Disconnect SSE connection
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionStatus('disconnected');
      onDisconnect?.();
    }
  }, [setConnectionStatus, onDisconnect]);

  /**
   * Reconnect manually
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  /**
   * Set up and tear down SSE connection
   */
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  /**
   * Reconnect when filters change
   */
  useEffect(() => {
    if (enabled && eventSourceRef.current) {
      // Debounce reconnection to avoid too many requests
      const timeout = setTimeout(() => {
        reconnect();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [filters, enabled, reconnect]);

  return {
    connect,
    disconnect,
    reconnect,
    isConnected: useDashboardStore((state) => state.connectionStatus === 'connected'),
  };
}

/**
 * Example usage in a component:
 *
 * ```tsx
 * function DashboardPage() {
 *   const { isConnected, reconnect } = useDashboardSSE({
 *     enabled: true,
 *     onConnect: () => console.log('Connected to real-time updates'),
 *     onDisconnect: () => console.log('Disconnected'),
 *     onError: (error) => console.error('SSE error:', error),
 *   });
 *
 *   return (
 *     <div>
 *       {!isConnected && (
 *         <button onClick={reconnect}>Reconnect</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
