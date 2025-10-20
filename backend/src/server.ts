/**
 * DAWG AI Backend Server
 * Module 10: Cloud Storage & Backend
 *
 * Express server with Supabase integration for project storage,
 * file uploads, and user authentication.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import { logger } from '../../src/lib/utils/logger.js';

// Load environment variables
dotenv.config();

// Import routes
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';

// Create Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging (simple)
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info('HTTP request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'DAWG AI API',
    version: '1.0.0',
    module: 'Module 10: Cloud Storage & Backend',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      files: '/api/files'
    },
    documentation: '/api/docs'
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Global error handler triggered', {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method
  });

  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'File too large',
      message: 'File size exceeds the maximum limit of 100MB'
    });
    return;
  }

  if (error.message === 'Only audio files are allowed') {
    res.status(400).json({
      error: 'Invalid file type',
      message: 'Only audio files are allowed'
    });
    return;
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    error: error.name || 'Internal server error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// SERVER STARTUP
// =====================================================

const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', {
    missingVars: missingEnvVars
  });
  logger.error('Please set these variables in your .env file');
  process.exit(1);
}

// Start server
app.listen(PORT, () => {
  logger.info('DAWG AI Backend Server Running', {
    port: PORT,
    serverUrl: `http://localhost:${PORT}`,
    apiUrl: `http://localhost:${PORT}/api`,
    healthUrl: `http://localhost:${PORT}/health`,
    supabaseUrl: process.env.SUPABASE_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export for testing
export default app;
