/**
 * FileManager Component
 *
 * Comprehensive S3 file management UI for DAWG AI
 * Features:
 * - File upload with drag & drop
 * - Progress indicators
 * - File list with sorting and filtering
 * - Download, rename, delete operations
 * - Storage quota display
 * - File preview
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  Filter,
  Music,
  FileAudio,
  HardDrive,
  AlertCircle,
  CheckCircle,
  X,
  Loader,
  ChevronDown,
  MoreVertical,
  Eye,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { StoredFile, StorageQuota } from '../../types/storage';

interface FileManagerProps {
  projectId?: string;
  userId?: string;
  onFileSelect?: (file: StoredFile) => void;
  allowMultiple?: boolean;
  maxFileSizeMB?: number;
  showQuota?: boolean;
}

interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  userId = 'user-123', // TODO: Get from auth context
  onFileSelect,
  allowMultiple = false,
  maxFileSizeMB = 100,
  showQuota = true,
}) => {
  // State
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<StoredFile[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'fileName' | 'size'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // API base URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Load files from API
   */
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        userId,
        sortBy,
        sortOrder,
        limit: '100',
      });

      if (projectId) {
        params.append('projectId', projectId);
      }

      const response = await fetch(`${API_URL}/api/storage/files?${params}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setFilteredFiles(data.files);
      } else {
        toast.error(`Failed to load files: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[FileManager] Failed to load files:', error);
      toast.error(`Failed to load files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, projectId, sortBy, sortOrder, API_URL]);

  /**
   * Load storage quota
   */
  const loadQuota = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/storage/quota`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setQuota(data.quota);
      }
    } catch (error: any) {
      console.error('[FileManager] Failed to load quota:', error);
    }
  }, [userId, API_URL]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadFiles();
    if (showQuota) {
      loadQuota();
    }
  }, [loadFiles, loadQuota, showQuota]);

  /**
   * Filter files based on search term
   */
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFiles(files);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = files.filter(
      file =>
        file.fileName.toLowerCase().includes(term) ||
        file.originalName.toLowerCase().includes(term)
    );
    setFilteredFiles(filtered);
  }, [searchTerm, files]);

  // ============================================================================
  // File Upload
  // ============================================================================

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File) => {
    const uploadId = `${file.name}-${Date.now()}`;

    try {
      // Initialize progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: 0,
          status: 'uploading',
        },
      }));

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) {
        formData.append('projectId', projectId);
      }

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [uploadId]: {
              ...prev[uploadId],
              loaded: e.loaded,
              percentage,
            },
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          setUploadProgress(prev => ({
            ...prev,
            [uploadId]: {
              ...prev[uploadId],
              percentage: 100,
              status: 'success',
            },
          }));

          toast.success(`File uploaded: ${file.name}`);

          // Reload files
          loadFiles();
          loadQuota();

          // Clear progress after 2 seconds
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[uploadId];
              return newProgress;
            });
          }, 2000);
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.open('POST', `${API_URL}/api/storage/upload`);
      xhr.setRequestHeader('x-user-id', userId);
      xhr.send(formData);
    } catch (error: any) {
      console.error('[FileManager] Upload failed:', error);

      setUploadProgress(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'error',
          error: error.message,
        },
      }));

      toast.error(`Upload failed: ${error.message}`);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Validate file types
    const invalidFiles = selectedFiles.filter(
      file => !file.type.startsWith('audio/')
    );

    if (invalidFiles.length > 0) {
      toast.error('Only audio files are allowed');
      return;
    }

    // Validate file sizes
    const maxSize = maxFileSizeMB * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed the ${maxFileSizeMB}MB limit`);
      return;
    }

    // Upload files
    selectedFiles.forEach(uploadFile);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle drag & drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // ============================================================================
  // File Operations
  // ============================================================================

  /**
   * Download file
   */
  const downloadFile = async (file: StoredFile) => {
    try {
      const response = await fetch(`${API_URL}/api/storage/download/${file.id}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Open signed URL in new tab
        window.open(data.url, '_blank');
        toast.success('Download started');
      } else {
        toast.error(`Download failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[FileManager] Download failed:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  /**
   * Delete file
   */
  const deleteFile = async (fileId: string, permanent: boolean = false) => {
    try {
      const response = await fetch(
        `${API_URL}/api/storage/files/${fileId}?permanent=${permanent}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(permanent ? 'File permanently deleted' : 'File deleted');
        loadFiles();
        loadQuota();
        setShowDeleteConfirm(null);
      } else {
        toast.error(`Delete failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[FileManager] Delete failed:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  /**
   * Rename file
   */
  const renameFile = async (fileId: string, newName: string) => {
    try {
      const response = await fetch(`${API_URL}/api/storage/files/${fileId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ newName }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File renamed');
        loadFiles();
        setRenameFileId(null);
        setNewFileName('');
      } else {
        toast.error(`Rename failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[FileManager] Rename failed:', error);
      toast.error(`Rename failed: ${error.message}`);
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Format date
   */
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full h-full flex flex-col bg-bg-base text-text-base">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-base">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">File Manager</h2>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple={allowMultiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Storage Quota */}
      {showQuota && quota && (
        <div className="p-4 bg-bg-surface border-b border-border-base">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium">Storage Usage</span>
            </div>
            <span className="text-sm text-text-muted">
              {formatFileSize(quota.usedSpace)} / {formatFileSize(quota.totalLimit)}
            </span>
          </div>
          <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                quota.quotaPercentage >= 90
                  ? 'bg-red-500'
                  : quota.quotaPercentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(quota.quotaPercentage, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {quota.fileCount} files • {quota.quotaPercentage.toFixed(1)}% used
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="p-4 bg-bg-surface border-b border-border-base space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{progress.fileName}</span>
                  <span className="text-xs text-text-muted">{progress.percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progress.status === 'success'
                        ? 'bg-green-500'
                        : progress.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              {progress.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {progress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {progress.status === 'uploading' && <Loader className="w-4 h-4 animate-spin text-primary" />}
            </div>
          ))}
        </div>
      )}

      {/* Search & Filter */}
      <div className="p-4 border-b border-border-base">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-bg-surface border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="uploadedAt">Upload Date</option>
            <option value="fileName">Name</option>
            <option value="size">Size</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-bg-surface border border-border-base rounded-lg hover:bg-bg-hover transition"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                sortOrder === 'asc' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center
              ${isDragging ? 'border-primary bg-primary/10' : 'border-border-base'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <p className="text-lg font-medium mb-2">No files yet</p>
            <p className="text-sm text-text-muted mb-4">
              Drag & drop audio files here or click the upload button
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              Upload Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-bg-surface border border-border-base rounded-lg hover:border-primary/50 transition group"
              >
                {/* File Icon */}
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-primary" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  {renameFileId === file.id ? (
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameFile(file.id, newFileName);
                        } else if (e.key === 'Escape') {
                          setRenameFileId(null);
                          setNewFileName('');
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 bg-bg-base border border-primary rounded focus:outline-none"
                    />
                  ) : (
                    <h3 className="font-medium truncate">{file.fileName}</h3>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span>{formatFileSize(file.size)}</span>
                    {file.duration && <span>{file.duration.toFixed(1)}s</span>}
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-bg-hover rounded transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setRenameFileId(file.id);
                      setNewFileName(file.fileName);
                    }}
                    className="p-2 hover:bg-bg-hover rounded transition"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(file.id)}
                    className="p-2 hover:bg-bg-hover rounded transition text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === file.id && (
                  <div className="absolute inset-0 bg-bg-base/95 flex items-center justify-center gap-3 rounded-lg">
                    <span className="text-sm font-medium">Delete this file?</span>
                    <button
                      onClick={() => deleteFile(file.id, true)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1.5 bg-bg-surface border border-border-base rounded hover:bg-bg-hover transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
