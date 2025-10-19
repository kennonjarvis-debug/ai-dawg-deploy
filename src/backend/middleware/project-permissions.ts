/**
 * Project Permissions Middleware
 * Verifies user permissions for project operations
 */

import type { Request, Response, NextFunction } from 'express';
import { collaborationService } from '../services/collaboration-service';
import { logger } from '../utils/logger';
import type { ProjectPermissions } from '../../types/collaboration';

interface AuthenticatedRequest extends Request {
  userId?: string;
  permissions?: ProjectPermissions;
}

/**
 * Middleware to check if user has access to a project
 */
export async function requireProjectAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!projectId) {
      res.status(400).json({ error: 'Project ID required' });
      return;
    }

    const permissions = await collaborationService.getPermissions(projectId, userId);
    const hasAccess = permissions.canEdit || permissions.canComment || permissions.canChat;

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Attach permissions to request for use in handlers
    req.permissions = permissions;
    next();
  } catch (error) {
    logger.error('Error in requireProjectAccess middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to require edit permission
 */
export async function requireEditPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.userId;

    if (!userId || !projectId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const canEdit = await collaborationService.hasPermission(projectId, userId, 'canEdit');

    if (!canEdit) {
      res.status(403).json({ error: 'Edit permission required' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in requireEditPermission middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to require owner permission
 */
export async function requireOwnerPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.userId;

    if (!userId || !projectId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const canManage = await collaborationService.hasPermission(
      projectId,
      userId,
      'canManagePermissions'
    );

    if (!canManage) {
      res.status(403).json({ error: 'Owner permission required' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in requireOwnerPermission middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
