/**
 * Backend Server
 * Main server for generation API and services
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server as SocketIOServer } from 'socket.io';
import generationRoutes from './routes/generation-routes';
import { initializeWebSocket } from '../api/websocket/server';
import { logger } from './utils/logger';
import { shutdownGenerationQueue } from './queues/generation-queue';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
});

// Initialize WebSocket handlers
initializeWebSocket(io);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.info('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Mount routes
app.use('/api/generate', generationRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
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

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Shutdown services
    await shutdownGenerationQueue();
    io.close();

    logger.info('Backend shutdown complete');
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
const PORT = parseInt(process.env.BACKEND_PORT || '3001');
httpServer.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
  });
});

export { app, httpServer, io };
