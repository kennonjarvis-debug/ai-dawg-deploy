import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTerminalStore } from '../stores/terminalStore';

interface UseTerminalWebSocketOptions {
  url: string;
  autoConnect?: boolean;
}

export function useTerminalWebSocket({ url, autoConnect = true }: UseTerminalWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setConnected, setLatency, updateSessionStatus } = useTerminalStore();

  const connect = () => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    const socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Connected to terminal server');
      setConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from terminal server');
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnected(false);
      setIsConnecting(false);
    });

    // Heartbeat for latency measurement
    socket.on('pong', (timestamp: number) => {
      const latency = Date.now() - timestamp;
      setLatency({ ping: latency, lastUpdate: Date.now() });
    });

    // Terminal data
    socket.on('terminal:data', ({ sessionId, data }: { sessionId: string; data: string }) => {
      // This will be handled by individual terminal components
      console.log('Received data for session:', sessionId, data);
    });

    // Session status updates
    socket.on('terminal:status', ({ sessionId, status }: { sessionId: string; status: any }) => {
      updateSessionStatus(sessionId, status);
    });

    socketRef.current = socket;
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  };

  const sendData = (sessionId: string, data: string) => {
    socketRef.current?.emit('terminal:input', { sessionId, data });
  };

  const createSession = (sessionId: string, rows: number, cols: number) => {
    socketRef.current?.emit('session:create', { sessionId, rows, cols });
  };

  const closeSession = (sessionId: string) => {
    socketRef.current?.emit('session:close', { sessionId });
  };

  const resizeSession = (sessionId: string, rows: number, cols: number) => {
    socketRef.current?.emit('session:resize', { sessionId, rows, cols });
  };

  // Heartbeat interval
  useEffect(() => {
    if (!socketRef.current?.connected) return;

    const interval = setInterval(() => {
      socketRef.current?.emit('ping', Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  return {
    socket: socketRef.current,
    isConnecting,
    connect,
    disconnect,
    sendData,
    createSession,
    closeSession,
    resizeSession,
  };
}
