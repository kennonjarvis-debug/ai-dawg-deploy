/**
 * File API Client
 * Module 10: Cloud Storage & Backend
 *
 * Frontend client for file upload and management
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

import { logger } from '$lib/utils/logger';
/**
 * File record interface
 */
export interface FileRecord {
  id: UUID;
  user_id: UUID;
  project_id?: UUID;
  filename: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
  url?: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * File API client for managing audio files and uploads
 */
export class FileAPI {
  private supabase: SupabaseClient | null;

  constructor() {
    this.supabase = supabase;
  }

  private ensureSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase not configured - file features unavailable in test mode');
    }
    return this.supabase;
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: File,
    projectId?: UUID,
    onProgress?: UploadProgressCallback
  ): Promise<FileRecord> {
    // Validate file
    if (!this.isAudioFile(file)) {
      throw new Error('Only audio files are allowed');
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }

    // Get current user
    const { data: { user } } = await this.ensureSupabase().auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${timestamp}-${sanitizedFilename}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await this.ensureSupabase().storage
      .from('audio-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = this.ensureSupabase().storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await this.ensureSupabase()
      .from('files')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        filename: file.name,
        storage_path: fileName,
        size_bytes: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (dbError) {
      // Try to delete uploaded file if metadata save fails
      await this.ensureSupabase().storage.from('audio-files').remove([fileName]);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    return {
      ...fileRecord,
      url: urlData.publicUrl
    };
  }

  /**
   * List all files for the current user
   */
  async listFiles(projectId?: UUID): Promise<FileRecord[]> {
    let query = this.ensureSupabase()
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: files, error } = await query;

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    // Add public URLs to each file
    return (files || []).map(file => {
      const { data: urlData } = this.ensureSupabase().storage
        .from('audio-files')
        .getPublicUrl(file.storage_path);

      return {
        ...file,
        url: urlData.publicUrl
      };
    });
  }

  /**
   * Get a specific file by ID
   */
  async getFile(id: UUID): Promise<FileRecord> {
    const { data: file, error } = await this.ensureSupabase()
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.ensureSupabase().storage
      .from('audio-files')
      .getPublicUrl(file.storage_path);

    return {
      ...file,
      url: urlData.publicUrl
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(id: UUID): Promise<void> {
    // Get file metadata first
    const { data: file, error: fetchError } = await this.ensureSupabase()
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to find file: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await this.ensureSupabase().storage
      .from('audio-files')
      .remove([file.storage_path]);

    if (storageError) {
      logger.error('Failed to delete file from storage:', storageError);
      // Continue anyway
    }

    // Delete metadata from database
    const { error: dbError } = await this.ensureSupabase()
      .from('files')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(`Failed to delete file metadata: ${dbError.message}`);
    }
  }

  /**
   * Download a file as blob
   */
  async downloadFile(storagePath: string): Promise<Blob> {
    const { data, error } = await this.ensureSupabase().storage
      .from('audio-files')
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Duplicate a file
   */
  async duplicateFile(id: UUID): Promise<FileRecord> {
    // Get original file
    const originalFile = await this.getFile(id);

    // Download file data
    const fileBlob = await this.downloadFile(originalFile.storage_path);

    // Create File object from Blob
    const file = new File([fileBlob], `copy-${originalFile.filename}`, {
      type: originalFile.mime_type
    });

    // Upload as new file
    return this.uploadFile(file, originalFile.project_id);
  }

  /**
   * Get file size in human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file is an audio file
   */
  private isAudioFile(file: File): boolean {
    const audioMimeTypes = [
      'audio/wav',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
      'audio/aac',
      'audio/m4a'
    ];

    const audioExtensions = ['wav', 'mp3', 'ogg', 'flac', 'aac', 'm4a'];

    // Check MIME type
    if (audioMimeTypes.includes(file.type)) {
      return true;
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension ? audioExtensions.includes(extension) : false;
  }

  /**
   * Get total storage used by user
   */
  async getTotalStorageUsed(): Promise<number> {
    const { data: files, error } = await this.ensureSupabase()
      .from('files')
      .select('size_bytes');

    if (error) {
      throw new Error(`Failed to calculate storage: ${error.message}`);
    }

    return (files || []).reduce((total, file) => total + file.size_bytes, 0);
  }

  /**
   * Get Supabase client instance
   */
  getSupabase(): SupabaseClient {
    return this.supabase;
  }
}

// Export singleton instance
export const fileAPI = new FileAPI();
