/**
 * Rate Limiting Middleware for Gateway
 * Protects sensitive endpoints from abuse
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../logger';

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later' },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests, please try again later',
    });
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 * 10 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to sensitive endpoint' },
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests to sensitive endpoint, please try again later',
    });
  },
});

/**
 * Session creation rate limiter
 * 20 sessions per 15 minutes per IP
 */
export const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 session creations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: 'Too many session creation attempts' },
  handler: (req, res) => {
    logger.warn('Session creation rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many session creation attempts, please try again later',
    });
  },
});

/**
 * AI Analysis rate limiter
 * 5 requests per 15 minutes per IP (AI operations are expensive)
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 AI analysis requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI analysis requests' },
  handler: (req, res) => {
    logger.warn('AI analysis rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many AI analysis requests, please try again later',
    });
  },
});
