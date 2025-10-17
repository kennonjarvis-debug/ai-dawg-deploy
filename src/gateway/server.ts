/**
 * Gateway Server
 * Main entry point for the Gateway & Terminal Service
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionManager } from './session-manager';
import { CommandFirewall } from './firewall';
import { SessionMonitor } from './monitor';
import { AIService } from './ai-service';
import { GatewayWebSocketServer } from './websocket-server';
import { createRestAPI } from './rest-api';
import { logger } from './logger';
import { config } from './config';
import { shutdownTelemetry } from './telemetry';
import { LokiTransport } from './loki-transport';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing for JWT authentication
app.use(cookieParser());

// Compression
app.use(compression());

// Add Loki transport if configured
if (process.env.LOKI_HOST) {
  logger.add(
    new LokiTransport({
      host: process.env.LOKI_HOST,
      labels: {
        service: 'gateway',
        environment: process.env.NODE_ENV || 'development',
      },
    })
  );
  logger.info('Loki transport enabled', { host: process.env.LOKI_HOST });
}

// Request logging
app.use((req, _res, next) => {
  logger.info('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Initialize services
const sessionManager = new SessionManager();
const firewall = new CommandFirewall();
const monitor = new SessionMonitor();
const aiService = new AIService(monitor);
const wsServer = new GatewayWebSocketServer(httpServer, sessionManager, firewall, monitor);

// Mount REST API
app.use('/api', createRestAPI(sessionManager, aiService));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Serve static files from dist folder in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../dist');

// Serve static assets (JS, CSS, images, etc.)
app.use(express.static(distPath));

// Serve index.html for all non-API routes (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Shutdown services
    await wsServer.shutdown();
    sessionManager.shutdown();
    await shutdownTelemetry();

    // Close Loki transport if it exists
    logger.transports.forEach((transport) => {
      if (transport instanceof LokiTransport) {
        transport.close();
      }
    });

    logger.info('Gateway shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
httpServer.listen(config.port, () => {
  logger.info(`Gateway server running on port ${config.port}`, {
    maxSessions: config.maxSessions,
    sessionTTL: config.sessionTTL,
    inactivityTimeout: config.inactivityTimeout,
    enableAI: config.enableAI,
  });
});

export { app, httpServer, sessionManager };
