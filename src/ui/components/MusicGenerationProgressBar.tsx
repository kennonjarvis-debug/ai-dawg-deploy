import React from 'react';
import { Music, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface MusicGenerationProgress {
  isGenerating: boolean;
  prompt: string;
  progress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  error?: string;
}

interface MusicGenerationProgressBarProps {
  progress: MusicGenerationProgress | null;
  onDismiss?: () => void;
}

/**
 * Top-level progress bar for music generation
 * Appears at the very top of the screen, above all other content
 */
export const MusicGenerationProgressBar: React.FC<MusicGenerationProgressBarProps> = ({
  progress,
  onDismiss,
}) => {
  if (!progress || !progress.isGenerating) return null;

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/50';
      case 'error':
        return 'bg-red-500/20 border-red-500/50';
      case 'processing':
        return 'bg-purple-500/20 border-purple-500/50';
      default:
        return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
      default:
        return <Music className="w-5 h-5 text-blue-400" />;
    }
  };

  const getProgressBarColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
    }
  };

  return (
    <div
      className={`w-full border-b transition-all duration-300 ${getStatusColor()}`}
      data-testid="music-generation-progress-bar"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">{getStatusIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white truncate">
                {progress.status === 'completed'
                  ? 'Music Generation Complete!'
                  : progress.status === 'error'
                  ? 'Music Generation Failed'
                  : `Generating Music: "${progress.prompt}"`}
              </h3>
              {progress.status === 'processing' && (
                <span className="text-sm font-bold text-purple-300 ml-4">
                  {progress.progress}%
                </span>
              )}
            </div>

            {/* Message */}
            {progress.message && (
              <p className="text-xs text-gray-400 mb-2">{progress.message}</p>
            )}

            {/* Error Message */}
            {progress.status === 'error' && progress.error && (
              <p className="text-xs text-red-300 mb-2">{progress.error}</p>
            )}

            {/* Progress Bar */}
            {progress.status === 'processing' && (
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressBarColor()}`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            )}

            {/* Success message */}
            {progress.status === 'completed' && (
              <p className="text-xs text-green-300">
                Track added to timeline. Click below to dismiss.
              </p>
            )}
          </div>

          {/* Dismiss Button (only show when completed or errored) */}
          {(progress.status === 'completed' || progress.status === 'error') && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
