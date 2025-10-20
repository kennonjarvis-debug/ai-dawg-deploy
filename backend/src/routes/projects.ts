/**
 * Project Routes
 * Module 10: Cloud Storage & Backend
 *
 * Handles CRUD operations for projects
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { projectLimiter } from '../middleware/rateLimiter.js';
import type {
import { logger } from '../../../src/lib/utils/logger.js';
  CreateProjectRequest,
  UpdateProjectRequest,
  Project,
  ProjectData,
  ApiError
} from '../types/index.js';

const router = Router();

// Apply rate limiting to all project routes
router.use(projectLimiter);

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { data: projects, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Error fetching projects', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Failed to fetch projects',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch projects'
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    const { data: project, error } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
      return;
    }

    // Check if user has access (owner or collaborator)
    if (project.user_id !== req.user!.id && !project.is_public) {
      // Check if user is a collaborator
      const { data: collaborator } = await req.supabase
        .from('collaborators')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (!collaborator) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this project'
        });
        return;
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch project'
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { name, data, templateId } = req.body as CreateProjectRequest;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Project name is required'
      });
      return;
    }

    let projectData: ProjectData;

    // If templateId provided, load template data
    if (templateId) {
      const { data: template, error: templateError } = await req.supabase
        .from('project_templates')
        .select('data')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        res.status(404).json({
          error: 'Not found',
          message: 'Template not found'
        });
        return;
      }

      projectData = template.data;
    } else if (data) {
      projectData = data;
    } else {
      // Default empty project
      projectData = {
        tracks: [],
        tempo: 120,
        timeSignature: [4, 4]
      };
    }

    // Create project
    const { data: project, error } = await req.supabase
      .from('projects')
      .insert({
        user_id: req.user!.id,
        name: name.trim(),
        data: projectData
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating project', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Failed to create project',
        message: error.message
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create project'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;
    const { name, data } = req.body as UpdateProjectRequest;

    // Check if project exists and user owns it
    const { data: existingProject, error: fetchError } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !existingProject) {
      res.status(404).json({
        error: 'Not found',
        message: 'Project not found or you do not have permission to edit it'
      });
      return;
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Project name cannot be empty'
        });
        return;
      }
      updates.name = name.trim();
    }

    if (data !== undefined) {
      updates.data = data;
    }

    // Update project
    const { data: updatedProject, error: updateError } = await req.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating project', { updateError });
      res.status(500).json({
        error: 'Failed to update project',
        message: updateError.message
      });
      return;
    }

    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    // Delete project (only if user owns it)
    const { error } = await req.supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      logger.error('Error deleting project', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Failed to delete project',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete project'
    });
  }
});

/**
 * POST /api/projects/:id/share
 * Generate a share link for a project
 */
router.post('/:id/share', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    // Check if project exists and user owns it
    const { data: project, error: fetchError } = await req.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !project) {
      res.status(404).json({
        error: 'Not found',
        message: 'Project not found'
      });
      return;
    }

    // Generate share token if not exists
    let shareToken = project.share_token;

    if (!shareToken) {
      // Generate random token
      const { data: updated, error: updateError } = await req.supabase.rpc(
        'generate_share_token'
      );

      if (updateError) {
        logger.error('Error generating share token', { updateError });
        res.status(500).json({
          error: 'Failed to generate share token',
          message: updateError.message
        });
        return;
      }

      shareToken = updated;

      // Update project with share token
      await req.supabase
        .from('projects')
        .update({
          share_token: shareToken,
          is_public: true
        })
        .eq('id', id);
    }

    res.json({
      success: true,
      data: {
        share_token: shareToken,
        share_url: `${process.env.FRONTEND_URL}/shared/${shareToken}`
      }
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to share project'
    });
  }
});

/**
 * GET /api/projects/shared/:token
 * Get a shared project by token (no auth required)
 */
router.get('/shared/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    // Use service role key for this operation
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error || !project) {
      res.status(404).json({
        error: 'Not found',
        message: 'Shared project not found'
      });
      return;
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch shared project'
    });
  }
});

/**
 * GET /api/projects/:id/versions
 * Get version history for a project
 */
router.get('/:id/versions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.supabase) {
      res.status(500).json({ error: 'Supabase client not initialized' });
      return;
    }

    const { id } = req.params;

    // Check if user has access to project
    const { data: project } = await req.supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!project || project.user_id !== req.user!.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this project'
      });
      return;
    }

    // Fetch versions
    const { data: versions, error } = await req.supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .limit(50); // Limit to last 50 versions

    if (error) {
      logger.error('Error fetching versions', { error: error.message || String(error) });
      res.status(500).json({
        error: 'Failed to fetch versions',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    logger.error('Unexpected error', { error: error.message || String(error) });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch versions'
    });
  }
});

export default router;
