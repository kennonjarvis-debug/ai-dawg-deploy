/**
 * WebSocket Server for Terminal Connections
 * Handles real-time terminal I/O over WebSocket
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { SessionManager } from './session-manager';
import { CommandFirewall } from './firewall';
import { SessionMonitor } from './monitor';
import { WebSocketMessage, WebSocketResponse } from './types';
import { logger } from './logger';
import { tracer } from './telemetry';
import { config } from './config';

export class GatewayWebSocketServer {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private firewall: CommandFirewall;
  private monitor: SessionMonitor;
  private heartbeatIntervals: Map<WebSocket, NodeJS.Timeout> = new Map();

  constructor(server: any, sessionManager: SessionManager, firewall: CommandFirewall, monitor: SessionMonitor) {
    this.sessionManager = sessionManager;
    this.firewall = firewall;
    this.monitor = monitor;

    this.wss = new WebSocketServer({
      server,
      path: '/term',
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const span = tracer.startSpan('ws_connection');

    // Extract session ID from URL path: /term/:sessionId
    const urlParts = req.url?.split('/').filter(Boolean);
    const sessionId = urlParts?.[1]; // term/:sessionId

    if (!sessionId) {
      logger.warn('WebSocket connection without session ID');
      ws.close(1008, 'Session ID required');
      span.setStatus({ code: 1, message: 'Session ID required' });
      span.end();
      return;
    }

    span.setAttribute('session.id', sessionId);

    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      logger.warn('WebSocket connection to invalid session', { sessionId });
      ws.close(1008, 'Session not found');
      span.setStatus({ code: 1, message: 'Session not found' });
      span.end();
      return;
    }

    if (!session.sshStream) {
      logger.warn('WebSocket connection to session without SSH stream', { sessionId });
      ws.close(1011, 'SSH stream not available');
      span.setStatus({ code: 1, message: 'SSH stream not available' });
      span.end();
      return;
    }

    logger.info('WebSocket connected', { sessionId });
    span.setStatus({ code: 0 });
    span.end();

    // Initialize monitoring for this session
    this.monitor.initializeSession(sessionId);

    // Set up SSH stream to WebSocket pipe
    session.sshStream.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        const output = data.toString('utf-8');

        // Record output to monitor
        this.monitor.recordOutput(sessionId, output);

        const response: WebSocketResponse = {
          type: 'data',
          data: output,
        };
        ws.send(JSON.stringify(response));
      }
    });

    session.sshStream.on('exit', (code: number) => {
      logger.info('SSH stream exited', { sessionId, exitCode: code });

      // Record exit code
      this.monitor.recordExit(sessionId, code);

      const response: WebSocketResponse = {
        type: 'exit',
        exitCode: code,
      };
      ws.send(JSON.stringify(response));
      ws.close(1000, 'Session ended');
    });

    // Handle WebSocket messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, sessionId, message);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket disconnected', { sessionId });
      this.clearHeartbeat(ws);
      // Note: Don't cleanup monitor here - keep for AI analysis
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', {
        sessionId,
        error: error.message,
      });
    });

    // Start heartbeat
    this.startHeartbeat(ws, sessionId);

    // Send initial status
    const statusResponse: WebSocketResponse = {
      type: 'status',
      status: session.status,
    };
    ws.send(JSON.stringify(statusResponse));
  }

  /**
   * Handle WebSocket messages
   */
  private handleMessage(ws: WebSocket, sessionId: string, message: WebSocketMessage): void {
    switch (message.type) {
      case 'input':
        if (message.data) {
          // Record input
          this.monitor.recordInput(sessionId, message.data);

          // Check if input is a command (ends with newline)
          if (message.data.includes('\n') || message.data.includes('\r')) {
            const command = message.data.trim();
            if (command) {
              const analysis = this.firewall.analyzeCommand(command);

              if (!analysis.allowed) {
                // Command denied by firewall
                this.sessionManager.incrementDeniedCommands(sessionId);
                this.monitor.recordDenied(sessionId, command, analysis.reason || 'Firewall rule');

                const errorResponse: WebSocketResponse = {
                  type: 'error',
                  error: `Command blocked: ${analysis.reason}`,
                };
                ws.send(JSON.stringify(errorResponse));

                logger.warn('Command denied by firewall', {
                  sessionId,
                  riskLevel: analysis.riskLevel,
                });
                return;
              }

              // Record command as allowed
              this.monitor.recordCommand(sessionId, command);

              if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
                logger.warn('High-risk command executed', {
                  sessionId,
                  riskLevel: analysis.riskLevel,
                });
              }
            }
          }

          this.sessionManager.write(sessionId, message.data);
        }
        break;

      case 'resize':
        if (message.cols && message.rows) {
          this.sessionManager.resizeTerminal(sessionId, message.cols, message.rows);
        }
        break;

      case 'heartbeat':
        this.sessionManager.updateActivity(sessionId);
        // Echo heartbeat back
        const response: WebSocketResponse = {
          type: 'status',
          status: this.sessionManager.getSession(sessionId)?.status || 'terminated',
        };
        ws.send(JSON.stringify(response));
        break;

      default:
        logger.warn('Unknown WebSocket message type', {
          sessionId,
          type: (message as any).type,
        });
    }
  }

  /**
   * Start heartbeat interval for WebSocket
   */
  private startHeartbeat(ws: WebSocket, sessionId: string): void {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const session = this.sessionManager.getSession(sessionId);
        if (session) {
          const response: WebSocketResponse = {
            type: 'status',
            status: session.status,
          };
          ws.send(JSON.stringify(response));
        } else {
          ws.close(1000, 'Session terminated');
        }
      } else {
        this.clearHeartbeat(ws);
      }
    }, config.heartbeatInterval);

    this.heartbeatIntervals.set(ws, interval);
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(ws: WebSocket): void {
    const interval = this.heartbeatIntervals.get(ws);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(ws);
    }
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): Promise<void> {
    return new Promise((resolve) => {
      // Clear all heartbeats
      for (const interval of this.heartbeatIntervals.values()) {
        clearInterval(interval);
      }
      this.heartbeatIntervals.clear();

      // Close all connections
      this.wss.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      this.wss.close(() => {
        logger.info('WebSocket server shut down');
        resolve();
      });
    });
  }
}
