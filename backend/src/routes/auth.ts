/**
 * Authentication Routes
 * Module 10: Cloud Storage & Backend
 *
 * Handles user authentication via Supabase Auth
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authenticate.js';
import { logger } from '../../../src/lib/utils/logger.js';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null
        }
      }
    });

    if (error) {
      logger.error('Signup error', { error: error.message, email });
      res.status(400).json({
        error: 'Signup failed',
        message: error.message
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    logger.error('Unexpected signup error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
router.post('/signin', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
      return;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Signin error', { error: error.message, email });
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    logger.error('Unexpected signin error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign in'
    });
  }
});

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
router.post('/signout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { error } = await req.supabase.auth.signOut();

    if (error) {
      logger.error('Signout error', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        error: 'Signout failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    logger.error('Unexpected signout error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign out'
    });
  }
});

/**
 * GET /api/auth/session
 * Get current session info
 */
router.get('/session', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { data: { session }, error } = await req.supabase.auth.getSession();

    if (error) {
      logger.error('Session error', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        error: 'Failed to get session',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: {
        session,
        user: req.user
      }
    });
  } catch (error) {
    logger.error('Unexpected session error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get session'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh the session token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Refresh token is required'
      });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      logger.error('Token refresh error', { error: error.message });
      res.status(401).json({
        error: 'Refresh failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: {
        session: data.session
      }
    });
  } catch (error) {
    logger.error('Unexpected refresh error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh session'
    });
  }
});

/**
 * GET /api/auth/user
 * Get current user profile
 */
router.get('/user', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { data: { user }, error } = await req.supabase.auth.getUser();

    if (error || !user) {
      res.status(404).json({
        error: 'User not found',
        message: 'Could not fetch user profile'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Unexpected get user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user'
    });
  }
});

/**
 * PUT /api/auth/user
 * Update user profile
 */
router.put('/user', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { name, avatar_url } = req.body;

    const updates: any = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    const { data, error } = await req.supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      logger.error('Update user error', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        error: 'Update failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: data.user
      }
    });
  } catch (error) {
    logger.error('Unexpected update user error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Request password reset email
 */
router.post('/reset-password', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Email is required'
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      logger.error('Reset password error', { error: error.message, email });
      res.status(500).json({
        error: 'Reset failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Unexpected reset password error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to send reset email'
    });
  }
});

/**
 * POST /api/auth/update-password
 * Update password (requires current session)
 */
router.post('/update-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        error: 'Validation error',
        message: 'New password is required'
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    const { data, error } = await req.supabase.auth.updateUser({
      password
    });

    if (error) {
      logger.error('Update password error', { error: error.message, userId: req.user?.id });
      res.status(500).json({
        error: 'Update failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        user: data.user
      }
    });
  } catch (error) {
    logger.error('Unexpected update password error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update password'
    });
  }
});

export default router;
