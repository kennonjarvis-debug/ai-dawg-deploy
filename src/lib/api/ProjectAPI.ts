/**
 * Project API Client
 * Module 10: Cloud Storage & Backend
 *
 * Frontend client for project CRUD operations
 * Conforms to API_CONTRACTS.md Module 10 specification
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

import { logger } from '$lib/utils/logger';
/**
 * Project data structure (matches API_CONTRACTS.md)
 */
export interface ProjectData {
  tracks: any[];
  tempo: number;
  timeSignature: [number, number];
  effects?: any[];
  automation?: any[];
  clips?: any[];
}

/**
 * Project record from database
 */
export interface Project {
  id: UUID;
  user_id: UUID;
  name: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  share_token?: string;
}

/**
 * Project API client for managing DAW projects
 */
export class ProjectAPI {
  private supabase: SupabaseClient | null;

  constructor() {
    this.supabase = supabase;
  }

  private ensureSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase not configured - project features unavailable in test mode');
    }
    return this.supabase;
  }

  /**
   * Save a new project
   */
  async saveProject(name: string, data: ProjectData): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .insert({
        name,
        data
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save project: ${error.message}`);
    }

    return project;
  }

  /**
   * Load a project by ID
   */
  async loadProject(id: UUID): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to load project: ${error.message}`);
    }

    return project;
  }

  /**
   * List all projects for current user
   */
  async listProjects(): Promise<Project[]> {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }

    return projects || [];
  }

  /**
   * Update an existing project
   */
  async updateProject(id: UUID, name: string, data: ProjectData): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .update({
        name,
        data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return project;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: UUID): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Share a project (generate share token)
   */
  async shareProject(id: UUID): Promise<string> {
    // First, get the current project
    const { data: project, error: fetchError } = await this.supabase
      .from('projects')
      .select('share_token, id')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch project: ${fetchError.message}`);
    }

    // If already has a share token, return it
    if (project.share_token) {
      return project.share_token;
    }

    // Generate new share token
    const shareToken = this.generateShareToken();

    const { error: updateError } = await this.supabase
      .from('projects')
      .update({
        share_token: shareToken,
        is_public: true
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to share project: ${updateError.message}`);
    }

    return shareToken;
  }

  /**
   * Get a shared project by token (no auth required)
   */
  async getSharedProject(token: string): Promise<Project> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error) {
      throw new Error(`Failed to load shared project: ${error.message}`);
    }

    return project;
  }

  /**
   * Upload a file (audio sample, etc.)
   */
  async uploadFile(file: File, projectId?: UUID): Promise<string> {
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const { data: { user } } = await this.ensureSupabase().auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileName = `${user.id}/${timestamp}-${sanitizedFilename}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await this.ensureSupabase().storage
      .from('audio-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Store file metadata
    const { error: metadataError } = await this.supabase
      .from('files')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        filename: file.name,
        storage_path: fileName,
        size_bytes: file.size,
        mime_type: file.type
      });

    if (metadataError) {
      logger.error('Failed to save file metadata:', metadataError);
      // Continue anyway, file is uploaded
    }

    // Get public URL
    const { data: urlData } = this.ensureSupabase().storage
      .from('audio-files')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Get project versions (for undo/redo)
   */
  async getProjectVersions(projectId: UUID): Promise<any[]> {
    const { data: versions, error } = await this.supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }

    return versions || [];
  }

  /**
   * Create a project version snapshot
   */
  async createProjectVersion(projectId: UUID, data: ProjectData): Promise<void> {
    const { error } = await this.ensureSupabase().rpc('create_project_version', {
      p_project_id: projectId,
      p_data: data
    });

    if (error) {
      throw new Error(`Failed to create version: ${error.message}`);
    }
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(id: UUID): Promise<Project> {
    // Load original project
    const original = await this.loadProject(id);

    // Create new project with same data
    const duplicate = await this.saveProject(
      `${original.name} (copy)`,
      original.data
    );

    return duplicate;
  }

  /**
   * Generate a random share token
   */
  private generateShareToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get Supabase client instance (for direct use if needed)
   */
  getSupabase(): SupabaseClient {
    return this.supabase;
  }
}

// Export singleton instance
export const projectAPI = new ProjectAPI();
