import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Modal, Button } from './base';
import clsx from 'clsx';

export interface AIProcessingJob {
  id: string;
  type: 'vocal-analysis' | 'harmony-generation' | 'genre-preset' | 'chord-generation' | 'melody-generation' | 'mastering';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  result?: any;
  error?: string;
}

interface AIProcessingModalProps {
  isOpen: boolean;
  jobs: AIProcessingJob[];
  onClose: () => void;
  onCancel?: (jobId: string) => void;
}

export const AIProcessingModal: React.FC<AIProcessingModalProps> = ({
  isOpen,
  jobs,
  onClose,
  onCancel,
}) => {
  const [showResults, setShowResults] = useState(false);

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const errorJobs = jobs.filter((j) => j.status === 'error');
  const processingJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'pending');

  const allCompleted = jobs.length > 0 && jobs.every((j) => j.status === 'completed' || j.status === 'error');

  useEffect(() => {
    if (allCompleted) {
      setShowResults(true);
    }
  }, [allCompleted]);

  const getJobIcon = (job: AIProcessingJob) => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />;
      case 'pending':
        return <Loader2 className="w-6 h-6 text-gray-400" />;
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vocal-analysis': 'Analyzing Vocals',
      'harmony-generation': 'Generating Harmony',
      'genre-preset': 'Applying Genre Preset',
      'chord-generation': 'Generating Chords',
      'melody-generation': 'Generating Melody',
      'mastering': 'AI Mastering',
    };
    return labels[type] || type;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Processing"
      subtitle={
        allCompleted
          ? `${completedJobs.length} task${completedJobs.length !== 1 ? 's' : ''} completed`
          : `Processing ${jobs.length} task${jobs.length !== 1 ? 's' : ''}...`
      }
      icon={<Sparkles className="w-6 h-6 text-purple-400" />}
      size="lg"
      showCloseButton={allCompleted}
      closeOnOverlayClick={allCompleted}
      closeOnEscape={allCompleted}
      contentClassName="max-h-[60vh] overflow-y-auto"
    >
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={clsx(
              'p-4 rounded-xl border transition-all',
              job.status === 'completed'
                ? 'bg-green-500/10 border-green-500/30'
                : job.status === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-purple-500/10 border-purple-500/30'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">{getJobIcon(job)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {getJobTypeLabel(job.type)}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{job.message}</p>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-300">Progress</span>
                      <span className="text-purple-300 font-semibold">{job.progress}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {job.status === 'error' && job.error && (
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{job.error}</p>
                  </div>
                )}

                {/* Results */}
                {job.status === 'completed' && showResults && job.result && (
                  <div className="mt-3 p-3 bg-black/40 rounded-lg space-y-2">
                    {job.type === 'vocal-analysis' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Pitch Accuracy</span>
                          <span className="text-sm font-semibold text-green-400">
                            {Math.round((job.result.pitchAccuracy || 0) * 100)}%
                          </span>
                        </div>
                        {job.result.issues && job.result.issues.length > 0 && (
                          <div className="pt-2 border-t border-white/10">
                            <span className="text-xs text-gray-400 block mb-1">Issues Found</span>
                            <ul className="space-y-1">
                              {job.result.issues.slice(0, 3).map((issue: any, idx: number) => (
                                <li key={idx} className="text-xs text-yellow-300">
                                  • {issue.description}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {job.type === 'mastering' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Loudness</span>
                          <span className="text-sm font-semibold text-green-400">
                            {job.result.loudness || '-14 LUFS'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Dynamic Range</span>
                          <span className="text-sm font-semibold text-green-400">
                            {job.result.dynamicRange || '8 dB'}
                          </span>
                        </div>
                      </>
                    )}

                    {(job.type === 'harmony-generation' ||
                      job.type === 'chord-generation' ||
                      job.type === 'melody-generation') && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">
                          New track added to timeline
                        </span>
                      </div>
                    )}

                    {job.type === 'genre-preset' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Preset applied successfully</span>
                        </div>
                        {job.result.pluginsApplied && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-400 block mb-1">Plugins Applied:</span>
                            <div className="flex flex-wrap gap-2">
                              {job.result.pluginsApplied.map((plugin: string, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 rounded-full text-purple-300">
                                  {plugin}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              {job.status === 'processing' && onCancel && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancel(job.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Status */}
      <div className="mt-6 pt-4 border-t border-white/10">
        {allCompleted ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {errorJobs.length > 0 ? (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300">
                    {completedJobs.length} completed, {errorJobs.length} failed
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-300">All tasks completed successfully!</span>
                </>
              )}
            </div>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-gray-400">
                Processing {processingJobs.length} task{processingJobs.length !== 1 ? 's' : ''}...
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {completedJobs.length}/{jobs.length} complete
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
