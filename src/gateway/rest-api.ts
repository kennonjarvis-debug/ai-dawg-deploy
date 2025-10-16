/**
 * REST API for Session Management
 * POST /sessions - Create new session
 * DELETE /sessions/:id - Delete session
 */

import express, { Router } from 'express';
import { SessionManager } from './session-manager';
import { AIService } from './ai-service';
import { SessionConfig, AIAnalysisRequest } from './types';
import { logger } from './logger';
import { tracer } from './telemetry';
import { authenticate } from './middleware/auth';
import { sessionLimiter, aiLimiter, apiLimiter } from './middleware/rate-limit';

export function createRestAPI(sessionManager: SessionManager, aiService: AIService): Router {
  const router = Router();

  /**
   * POST /sessions
   * Create a new SSH PTY session
   * Protected: Requires authentication and rate limiting
   */
  router.post('/sessions', authenticate, sessionLimiter, async (req, res) => {
    const span = tracer.startSpan('create_session');

    try {
      const { hostId, user, cols, rows } = req.body as SessionConfig;

      if (!hostId || !user) {
        span.setStatus({ code: 1, message: 'Missing required fields' });
        span.end();
        return res.status(400).json({
          error: 'Missing required fields: hostId and user are required',
        });
      }

      logger.info('Creating session', { hostId, user });

      const { sessionId, session } = await sessionManager.createSession({
        hostId,
        user,
        cols,
        rows,
      });

      span.setAttribute('session.id', sessionId);
      span.setAttribute('session.host', hostId);
      span.setAttribute('session.user', user);
      span.setStatus({ code: 0 });
      span.end();

      res.status(201).json({
        id: sessionId,
        status: session.status,
        createdAt: session.createdAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create session', { error: errorMessage });

      span.setStatus({ code: 1, message: errorMessage });
      span.recordException(error as Error);
      span.end();

      res.status(500).json({
        error: errorMessage,
      });
    }
  });

  /**
   * DELETE /sessions/:id
   * Terminate a session
   * Protected: Requires authentication
   */
  router.delete('/sessions/:id', authenticate, apiLimiter, (req, res) => {
    const span = tracer.startSpan('delete_session');
    const sessionId = req.params.id;

    try {
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        span.setStatus({ code: 1, message: 'Session not found' });
        span.end();
        return res.status(404).json({ error: 'Session not found' });
      }

      sessionManager.terminateSession(sessionId);

      span.setAttribute('session.id', sessionId);
      span.setStatus({ code: 0 });
      span.end();

      logger.info('Session deleted via API', { sessionId });

      res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete session', { sessionId, error: errorMessage });

      span.setStatus({ code: 1, message: errorMessage });
      span.recordException(error as Error);
      span.end();

      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * GET /sessions/:id
   * Get session info
   * Protected: Requires authentication
   */
  router.get('/sessions/:id', authenticate, apiLimiter, (req, res) => {
    const sessionId = req.params.id;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      hostId: session.hostId,
      user: session.user,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      deniedCommands: session.deniedCommands,
    });
  });

  /**
   * POST /ai/analyze
   * Analyze session with AI (manual trigger only)
   * Protected: Requires authentication and strict rate limiting
   */
  router.post('/ai/analyze', authenticate, aiLimiter, async (req, res) => {
    const span = tracer.startSpan('ai_analyze');

    try {
      const { sessionId, tokenBudget } = req.body as AIAnalysisRequest;

      if (!sessionId) {
        span.setStatus({ code: 1, message: 'Missing sessionId' });
        span.end();
        return res.status(400).json({ error: 'sessionId is required' });
      }

      logger.info('AI analysis requested', { sessionId, tokenBudget });

      const analysis = await aiService.analyzeSession({ sessionId, tokenBudget });

      span.setAttribute('session.id', sessionId);
      span.setAttribute('ai.token_usage', analysis.tokenUsage);
      span.setStatus({ code: 0 });
      span.end();

      res.json(analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('AI analysis failed', { error: errorMessage });

      span.setStatus({ code: 1, message: errorMessage });
      span.recordException(error as Error);
      span.end();

      const statusCode = errorMessage.includes('not found') ? 404 : 503;
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  return router;
}
