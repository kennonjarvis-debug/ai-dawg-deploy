import React, { useCallback, useState } from 'react';
import { Upload, X, Music, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import type { AudioFile } from '../../api/types';

interface AudioUploaderProps {
  projectId: string;
  onUploadComplete?: (file: AudioFile) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  projectId,
  onUploadComplete,
  accept = 'audio/*,.wav,.mp3,.aiff,.flac,.ogg',
  maxSizeMB = 100,
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const uploadFile = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Check file type
    const isAudio = file.type.startsWith('audio/') ||
      /\.(wav|mp3|aiff|flac|ogg|m4a)$/i.test(file.name);

    if (!isAudio) {
      toast.error('Please upload a valid audio file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload using API client with progress tracking
      const result = await apiClient.uploadAudio(
        projectId,
        file,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      toast.success('Audio file uploaded successfully');

      if (onUploadComplete) {
        onUploadComplete(result.audioFile as any);
      }

      // Broadcast for global listeners (e.g., DAWDashboard) to add clip with audioFileId
      try {
        window.dispatchEvent(new CustomEvent('audio-uploaded', { detail: { file: result.audioFile } }));
      } catch {}

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadFile(file);
    }
  }, [user, onUploadComplete]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadFile(file);
    }
    // Reset input
    e.target.value = '';
  }, [user, onUploadComplete]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('audio-file-input')?.click()}
      >
        <input
          id="audio-file-input"
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          {isUploading ? (
            <>
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {uploadProgress}%
              </p>
            </>
          ) : (
            <>
              <Music className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Drop audio files here or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Supports WAV, MP3, AIFF, FLAC, OGG (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {!user && (
        <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Please log in to upload audio files</span>
        </div>
      )}
    </div>
  );
};
