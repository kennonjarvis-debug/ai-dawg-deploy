/**
 * GenerationProgress Component
 * Displays real-time progress for music generation jobs
 */

import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export interface GenerationProgressProps {
  progress: number;
  stage: string;
  message?: string;
  isComplete?: boolean;
  isFailed?: boolean;
  error?: string | null;
  className?: string;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  stage,
  message,
  isComplete = false,
  isFailed = false,
  error,
  className = '',
}) => {
  // Determine status color
  const getStatusColor = () => {
    if (isFailed) return 'bg-red-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-primary';
  };

  // Determine status icon
  const getStatusIcon = () => {
    if (isFailed) return <XCircle className="text-red-500" size={20} />;
    if (isComplete) return <CheckCircle2 className="text-green-500" size={20} />;
    return <Loader2 className="text-primary animate-spin" size={20} />;
  };

  // Format stage name
  const formatStage = (stage: string): string => {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`generation-progress ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-base">
            {isFailed ? 'Generation Failed' : isComplete ? 'Generation Complete' : formatStage(stage)}
          </div>
          {message && (
            <div className="text-xs text-text-muted mt-0.5">
              {message}
            </div>
          )}
          {isFailed && error && (
            <div className="text-xs text-red-400 mt-0.5">
              {error}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-sm font-semibold text-text-base">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Styles */}
      <style>{`
        .generation-progress {
          padding: 12px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const GenerationProgressCompact: React.FC<GenerationProgressProps> = ({
  progress,
  stage,
  isComplete = false,
  isFailed = false,
  className = '',
}) => {
  const getStatusColor = () => {
    if (isFailed) return 'bg-red-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-primary';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!isComplete && !isFailed && (
        <Loader2 className="text-primary animate-spin" size={16} />
      )}
      {isComplete && <CheckCircle2 className="text-green-500" size={16} />}
      {isFailed && <XCircle className="text-red-500" size={16} />}
      <div className="flex-1 h-1.5 bg-bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="text-xs font-medium text-text-muted">
        {Math.round(progress)}%
      </div>
    </div>
  );
};
