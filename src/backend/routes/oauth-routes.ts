/**
 * OAuth Routes
 * Handles OAuth authentication routes for Google and GitHub
 */

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { oauthService } from '../services/oauth-service';
import type { OAuthProvider, OAuthCallbackQuery } from '../../types/auth';

const router = Router();

// Initialize OAuth strategies
oauthService.initializeStrategies();

// Initialize Passport
router.use(passport.initialize());

/**
 * Google OAuth - Initiate authentication
 * GET /api/auth/google
 */
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = (req.query.redirect as string) || '/';
  const state = oauthService.generateState('google', redirectUrl);

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
    session: false,
  })(req, res, next);
});

/**
 * Google OAuth - Callback
 * GET /api/auth/google/callback
 */
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const { state, error, error_description } = req.query as OAuthCallbackQuery;

    // Handle OAuth errors (user denied access, etc.)
    if (error) {
      const errorMessage = error_description || 'OAuth authentication failed';
      return res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
    }

    // Verify state parameter (CSRF protection)
    if (!state || typeof state !== 'string') {
      return res.redirect('/login?error=Invalid+state+parameter');
    }

    const stateData = oauthService.verifyState(state);
    if (!stateData) {
      return res.redirect('/login?error=Invalid+or+expired+state');
    }

    passport.authenticate('google', { session: false }, (err: any, result: any) => {
      if (err) {
        console.error('Google OAuth error:', err);
        return res.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!result) {
        return res.redirect('/login?error=Authentication+failed');
      }

      // Set session cookie
      res.cookie('session_token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to original URL or dashboard
      const redirectUrl = stateData.redirectUrl || '/dashboard';
      const accountLinked = result.linkedAccount ? '&linked=true' : '';
      const isNewUser = result.isNewUser ? '&new=true' : '';
      res.redirect(`${redirectUrl}?auth=success${accountLinked}${isNewUser}`);
    })(req, res, next);
  }
);

/**
 * GitHub OAuth - Initiate authentication
 * GET /api/auth/github
 */
router.get('/github', (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = (req.query.redirect as string) || '/';
  const state = oauthService.generateState('github', redirectUrl);

  passport.authenticate('github', {
    scope: ['user:email'],
    state,
    session: false,
  })(req, res, next);
});

/**
 * GitHub OAuth - Callback
 * GET /api/auth/github/callback
 */
router.get(
  '/github/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const { state, error, error_description } = req.query as OAuthCallbackQuery;

    // Handle OAuth errors
    if (error) {
      const errorMessage = error_description || 'OAuth authentication failed';
      return res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
    }

    // Verify state parameter
    if (!state || typeof state !== 'string') {
      return res.redirect('/login?error=Invalid+state+parameter');
    }

    const stateData = oauthService.verifyState(state);
    if (!stateData) {
      return res.redirect('/login?error=Invalid+or+expired+state');
    }

    passport.authenticate('github', { session: false }, (err: any, result: any) => {
      if (err) {
        console.error('GitHub OAuth error:', err);
        return res.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
      }

      if (!result) {
        return res.redirect('/login?error=Authentication+failed');
      }

      // Set session cookie
      res.cookie('session_token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to original URL or dashboard
      const redirectUrl = stateData.redirectUrl || '/dashboard';
      const accountLinked = result.linkedAccount ? '&linked=true' : '';
      const isNewUser = result.isNewUser ? '&new=true' : '';
      res.redirect(`${redirectUrl}?auth=success${accountLinked}${isNewUser}`);
    })(req, res, next);
  }
);

/**
 * Get user's connected OAuth accounts
 * GET /api/auth/oauth/accounts
 */
router.get('/oauth/accounts', async (req: Request, res: Response) => {
  try {
    // Get user from session (assumes auth middleware has been run)
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const accounts = await oauthService.getUserOAuthAccounts(userId);
    res.json({ accounts });
  } catch (error: any) {
    console.error('Get OAuth accounts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get OAuth accounts' });
  }
});

/**
 * Unlink OAuth account
 * DELETE /api/auth/oauth/:provider
 */
router.delete('/oauth/:provider', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const provider = req.params.provider as OAuthProvider;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!['google', 'github'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider' });
    }

    await oauthService.unlinkOAuthAccount(userId, provider);
    res.json({ success: true, message: `${provider} account unlinked successfully` });
  } catch (error: any) {
    console.error('Unlink OAuth account error:', error);
    res.status(400).json({ error: error.message || 'Failed to unlink OAuth account' });
  }
});

/**
 * Health check for OAuth configuration
 * GET /api/auth/oauth/config
 */
router.get('/oauth/config', (req: Request, res: Response) => {
  const config = {
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not configured',
    },
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID ? 'configured' : 'not configured',
    },
  };

  res.json(config);
});

export default router;
