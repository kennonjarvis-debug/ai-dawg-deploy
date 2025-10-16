import React, { useState, useEffect } from 'react';
import { Music, Download, Trash2, FileAudio, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api';
import { toast } from 'sonner';
import type { AudioFile } from '../../api/types';

interface AudioFileListProps {
  projectId: string;
  onFileSelect?: (file: AudioFile) => void;
}

export const AudioFileList: React.FC<AudioFileListProps> = ({ projectId, onFileSelect }) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAudioFiles();
  }, [projectId]);

  const loadAudioFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listAudioFiles(projectId, { limit: 100 });
      setAudioFiles(response.files);
    } catch (err: any) {
      setError(err.message || 'Failed to load audio files');
      console.error('Failed to load audio files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: AudioFile) => {
    try {
      const { url } = await apiClient.getAudioDownloadUrl(file.id);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${file.filename}`);
    } catch (err: any) {
      toast.error('Failed to download file');
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (file: AudioFile) => {
    if (!confirm(`Delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteAudioFile(file.id);
      setAudioFiles(audioFiles.filter(f => f.id !== file.id));
      toast.success('Audio file deleted');
    } catch (err: any) {
      toast.error('Failed to delete file');
      console.error('Delete error:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2" />
          <p className="text-sm text-gray-400">Loading audio files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadAudioFiles}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (audioFiles.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <FileAudio className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No audio files uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {audioFiles.map((file) => (
        <div
          key={file.id}
          className="p-4 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Music className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {file.filename}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {file.duration && <span>{formatDuration(file.duration)}</span>}
                {file.size && <span>{formatFileSize(file.size)}</span>}
                {file.format && <span className="uppercase">{file.format}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownload(file)}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(file)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {onFileSelect && (
            <button
              onClick={() => { onFileSelect(file); try { window.dispatchEvent(new CustomEvent('audio-file-selected', { detail: { file } })); } catch {} }}
              className="mt-3 w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 transition-colors"
            >
              Add to Timeline
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
