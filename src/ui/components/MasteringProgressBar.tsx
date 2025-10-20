/**
 * MasteringProgressBar Component
 *
 * Step-by-step progress display for AI mastering operations.
 *
 * Shows:
 * - Current processing step with description
 * - Overall progress percentage
 * - Estimated time remaining
 * - Visual progress bar with smooth animations
 * - Step history/completion status
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  Sparkles,
  Volume2,
  Sliders,
  Radio,
  Zap
} from 'lucide-react';

export interface MasteringStep {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-100 for this step
  icon?: React.ReactNode;
}

export interface MasteringProgressBarProps {
  currentStep: number; // 0-4 (5 steps total)
  overallProgress: number; // 0-100
  stepProgress: number; // 0-100 for current step
  estimatedTimeRemaining?: number; // seconds
  isComplete?: boolean;
  isFailed?: boolean;
  error?: string;
  onCancel?: () => void;
  className?: string;
}

const MASTERING_STEPS: MasteringStep[] = [
  {
    id: 'analyze',
    name: 'Analyzing Audio',
    description: 'Measuring loudness, dynamics, and frequency balance',
    progress: 0,
    icon: <Radio className="w-4 h-4" />
  },
  {
    id: 'eq',
    name: 'Applying EQ',
    description: 'Multi-band equalization and tonal shaping',
    progress: 0,
    icon: <Sliders className="w-4 h-4" />
  },
  {
    id: 'compress',
    name: 'Compressing',
    description: 'Multi-band compression for controlled dynamics',
    progress: 0,
    icon: <Volume2 className="w-4 h-4" />
  },
  {
    id: 'stereo',
    name: 'Enhancing Stereo',
    description: 'Stereo width optimization and imaging',
    progress: 0,
    icon: <Zap className="w-4 h-4" />
  },
  {
    id: 'limit',
    name: 'Final Limiting',
    description: 'Precise limiting to target loudness',
    progress: 0,
    icon: <Sparkles className="w-4 h-4" />
  }
];

export const MasteringProgressBar: React.FC<MasteringProgressBarProps> = ({
  currentStep,
  overallProgress,
  stepProgress,
  estimatedTimeRemaining = 0,
  isComplete = false,
  isFailed = false,
  error,
  onCancel,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    const diff = overallProgress - animatedProgress;
    if (Math.abs(diff) > 0.5) {
      const step = diff * 0.1; // Smooth easing
      const timer = setTimeout(() => {
        setAnimatedProgress(prev => prev + step);
      }, 16); // ~60fps
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(overallProgress);
    }
  }, [overallProgress, animatedProgress]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  // Get step status
  const getStepStatus = (stepIndex: number): 'completed' | 'active' | 'pending' => {
    if (isComplete) return 'completed';
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  // Get step icon
  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const step = MASTERING_STEPS[stepIndex];

    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    } else if (status === 'active') {
      return (
        <div className="relative">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        </div>
      );
    } else {
      return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate step ranges (each step is 20% of total)
  const getStepProgressRange = (stepIndex: number) => {
    const stepSize = 100 / MASTERING_STEPS.length;
    return {
      start: stepIndex * stepSize,
      end: (stepIndex + 1) * stepSize
    };
  };

  return (
    <div className={`mastering-progress ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">
            {isComplete ? 'Mastering Complete!' : isFailed ? 'Mastering Failed' : 'AI Mastering'}
          </h3>
        </div>
        {estimatedTimeRemaining > 0 && !isComplete && !isFailed && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formatTime(estimatedTimeRemaining)} remaining
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Overall Progress</span>
          <span className="text-xs font-semibold text-white">
            {Math.round(animatedProgress)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-purple-600/20 to-pink-600/20" />

          {/* Progress fill */}
          <div
            className={`h-full transition-all duration-300 ease-out ${
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : isFailed
                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                : 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
          >
            {/* Shine effect */}
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Error message */}
      {isFailed && error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Step Details */}
      <div className="space-y-2">
        {MASTERING_STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const range = getStepProgressRange(index);
          const isCurrentStep = index === currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded transition-all ${
                status === 'active'
                  ? 'bg-purple-900/30 border border-purple-700/50'
                  : status === 'completed'
                  ? 'bg-green-900/20 border border-green-800/30'
                  : 'bg-gray-800/30 border border-gray-800'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {getStepIcon(index)}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      status === 'active'
                        ? 'text-white'
                        : status === 'completed'
                        ? 'text-green-400'
                        : 'text-gray-500'
                    }`}
                  >
                    Step {index + 1}: {step.name}
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    status === 'active' ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {step.description}
                </p>

                {/* Step progress bar (only show for active step) */}
                {isCurrentStep && status === 'active' && !isComplete && (
                  <div className="mt-2 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-200"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Step percentage */}
              {status === 'completed' && (
                <div className="flex-shrink-0 text-xs font-semibold text-green-400">
                  100%
                </div>
              )}
              {isCurrentStep && status === 'active' && (
                <div className="flex-shrink-0 text-xs font-semibold text-purple-400">
                  {Math.round(stepProgress)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!isComplete && !isFailed && onCancel && (
        <div className="mt-4">
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Cancel Mastering
          </button>
        </div>
      )}

      {/* Style */}
      <style>{`
        .mastering-progress {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          padding: 14px;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const MasteringProgressBarCompact: React.FC<{
  currentStep: number;
  overallProgress: number;
  isComplete?: boolean;
  className?: string;
}> = ({ currentStep, overallProgress, isComplete = false, className = '' }) => {
  const stepName = MASTERING_STEPS[currentStep]?.name || 'Processing';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!isComplete && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
      {isComplete && <CheckCircle2 className="w-4 h-4 text-green-400" />}
      <div className="flex-1">
        <div className="text-xs text-gray-400 mb-1">
          {isComplete ? 'Complete' : stepName}
        </div>
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-purple-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
      <div className="text-xs font-semibold text-white">
        {Math.round(overallProgress)}%
      </div>
    </div>
  );
};
