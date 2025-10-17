'use client';

import { FC, useState, useCallback, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

/**
 * FileUpload Widget
 * Drag & drop or click to upload audio files
 */
export const FileUpload: FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedFormats = ['.wav', '.mp3', '.ogg', '.flac', '.m4a'],
  maxSizeMB = 100,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Format not supported. Accepted: ${acceptedFormats.join(', ')}`,
      };
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File too large. Max size: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  // Process files
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const newUploadFiles: UploadFile[] = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file);
        const uploadFile: UploadFile = {
          file,
          id: `${Date.now()}-${Math.random()}`,
          status: validation.valid ? 'pending' : 'error',
          progress: 0,
          error: validation.error,
        };

        newUploadFiles.push(uploadFile);

        if (validation.valid) {
          validFiles.push(file);
        }
      });

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected, acceptedFormats, maxSizeMB]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  // Handle click to open file picker
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove file from list
  const handleRemoveFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Clear all files
  const handleClearAll = useCallback(() => {
    setUploadFiles([]);
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`${styles.fileUpload} ${className || ''}`}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload className={styles.uploadIcon} />
        <div className={styles.dropZoneText}>
          <div className={styles.primaryText}>
            Drag & drop audio files here
          </div>
          <div className={styles.secondaryText}>
            or click to browse
          </div>
        </div>
        <div className={styles.formatText}>
          Supported formats: {acceptedFormats.join(', ')}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        multiple
        onChange={handleFileInputChange}
        className={styles.fileInput}
      />

      {/* File list */}
      {uploadFiles.length > 0 && (
        <div className={styles.fileList}>
          <div className={styles.fileListHeader}>
            <span className={styles.fileCount}>
              {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClearAll}
              className={styles.clearButton}
            >
              Clear All
            </button>
          </div>

          {uploadFiles.map((uploadFile) => (
            <div key={uploadFile.id} className={styles.fileItem}>
              <div className={styles.fileIcon}>
                <File style={{ width: '16px', height: '16px' }} />
              </div>

              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{uploadFile.file.name}</div>
                <div className={styles.fileSize}>
                  {formatFileSize(uploadFile.file.size)}
                </div>
              </div>

              <div className={styles.fileStatus}>
                {uploadFile.status === 'success' && (
                  <CheckCircle className={styles.statusIconSuccess} />
                )}
                {uploadFile.status === 'error' && (
                  <AlertCircle className={styles.statusIconError} />
                )}
                {uploadFile.status === 'uploading' && (
                  <div className={styles.spinner} />
                )}
              </div>

              <button
                onClick={() => handleRemoveFile(uploadFile.id)}
                className={styles.removeButton}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>

              {uploadFile.error && (
                <div className={styles.fileError}>{uploadFile.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
