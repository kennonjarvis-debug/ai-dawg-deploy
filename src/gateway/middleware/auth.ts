/**
 * JWT Authentication Middleware for Gateway
 * Validates JWT tokens for secure API access
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Authenticates incoming requests using JWT
 * Supports both Bearer token and cookie-based authentication
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    // Get token from either header or cookie
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError: any) {
      logger.warn('JWT verification failed', {
        error: jwtError.name,
        ip: req.ip,
        path: req.path,
      });

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug('Request authenticated', {
      userId: req.user.id,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

/**
 * Authorizes requests based on user roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated', {
        ip: req.ip,
        path: req.path,
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.length && req.user.role && !roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
