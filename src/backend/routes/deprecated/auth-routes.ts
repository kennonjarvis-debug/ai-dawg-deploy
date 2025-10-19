/**
 * Authentication API Routes
 * Handles user registration, login, OAuth, and session management
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth-service';
import { aiMemoryService } from '../services/ai-memory-service';

export const authRouter = Router();

/**
 * Register new user
 * POST /api/auth/register
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.registerUser({ email, password, name });

    res.status(201).json({
      user: result.user,
      token: result.session.token,
      message: 'User registered successfully',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Login with email/password
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      user: result.user,
      token: result.session.token,
      message: 'Login successful',
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * Google OAuth login
 * POST /api/auth/google
 */
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, profileImage } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    const result = await authService.googleOAuthLogin(googleId, email, name, profileImage);

    res.status(200).json({
      user: result.user,
      token: result.session.token,
      message: 'Google OAuth login successful',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    await authService.logout(token);

    res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.verifySession(token);

    res.status(200).json({ user });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * AI Memory endpoints
 * Store memory
 * POST /api/auth/memory
 */
authRouter.post('/memory', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.verifySession(token);

    const { type, category, content, metadata, importance } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    const memory = await aiMemoryService.storeMemory({
      userId: user.id,
      type,
      category,
      content,
      metadata,
      importance,
    });

    res.status(201).json({ memory });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get memories
 * GET /api/auth/memory
 */
authRouter.get('/memory', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.verifySession(token);

    const { type, category, limit, minImportance } = req.query;

    const memories = await aiMemoryService.retrieveMemories({
      userId: user.id,
      type: type as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : undefined,
      minImportance: minImportance ? parseInt(minImportance as string) : undefined,
    });

    res.status(200).json({ memories });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get conversation context for AI
 * GET /api/auth/memory/context
 */
authRouter.get('/memory/context', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.verifySession(token);
    const { context } = req.query;

    const contextString = await aiMemoryService.getConversationContext(
      user.id,
      context as string | undefined
    );

    res.status(200).json({ context: contextString });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
