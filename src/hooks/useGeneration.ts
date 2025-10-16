/**
 * useGeneration Hook
 * Manages music generation jobs, progress tracking, and results
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useGenerationProgress, useGenerationJobs } from './useWebSocket';

export interface GenerationParams {
  // Beat generation
  genre?: string;
  bpm?: number;
  key?: string;
  mood?: string;
  duration?: number;

  // Lyrics generation
  theme?: string;
  style?: string;
  length?: string;

  // Melody generation
  scale?: string;
  lyrics?: string;

  // Stems generation
  type?: 'drums' | 'bass' | 'melody' | 'vocal';

  // Mix/Master
  trackIds?: string[];
  audioFileId?: string;
  preset?: string;
  targetLoudness?: number;
}

export interface GenerationResult {
  jobId: string;
  type: string;
  audioUrl?: string;
  lyrics?: string;
  notes?: any[];
  metadata?: any;
}

type GenerationType = 'beat' | 'lyrics' | 'melody' | 'stems' | 'mix' | 'master';

export function useGeneration() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Track progress for current job
  const {
    progress,
    stage,
    message: progressMessage,
    isComplete,
    isFailed,
    error: jobError,
    result,
    reset: resetProgress,
  } = useGenerationProgress(currentJobId);

  // Track all jobs
  const { activeJobs, completedJobs, clearCompletedJob } = useGenerationJobs();

  /**
   * Start a generation job
   */
  const startGeneration = useCallback(
    async (type: GenerationType, params: GenerationParams): Promise<string | null> => {
      setIsGenerating(true);
      setError(null);
      resetProgress();

      try {
        let response: { jobId: string; status: string };

        switch (type) {
          case 'beat':
            response = await apiClient.generateBeat(params);
            break;
          case 'lyrics':
            response = await apiClient.generateLyrics(params);
            break;
          case 'melody':
            response = await apiClient.generateMelody(params);
            break;
          case 'stems':
            if (!params.type) {
              throw new Error('Stem type is required');
            }
            response = await apiClient.generateStems({
              type: params.type,
              genre: params.genre,
              bpm: params.bpm,
              key: params.key,
            });
            break;
          case 'mix':
            if (!params.trackIds || params.trackIds.length === 0) {
              throw new Error('Track IDs are required for mixing');
            }
            response = await apiClient.mixTracks({
              trackIds: params.trackIds,
              genre: params.genre,
              targetLoudness: params.targetLoudness,
            });
            break;
          case 'master':
            if (!params.audioFileId) {
              throw new Error('Audio file ID is required for mastering');
            }
            response = await apiClient.masterTrackGeneration({
              audioFileId: params.audioFileId,
              preset: params.preset,
              targetLoudness: params.targetLoudness,
            });
            break;
          default:
            throw new Error(`Unknown generation type: ${type}`);
        }

        setCurrentJobId(response.jobId);
        return response.jobId;
      } catch (err: any) {
        console.error('[useGeneration] Failed to start generation:', err);
        setError(err.message || 'Failed to start generation');
        setIsGenerating(false);
        return null;
      }
    },
    [resetProgress]
  );

  /**
   * Shorthand methods for specific generation types
   */
  const generateBeat = useCallback(
    (params: GenerationParams) => startGeneration('beat', params),
    [startGeneration]
  );

  const generateLyrics = useCallback(
    (params: GenerationParams) => startGeneration('lyrics', params),
    [startGeneration]
  );

  const generateMelody = useCallback(
    (params: GenerationParams) => startGeneration('melody', params),
    [startGeneration]
  );

  const generateStems = useCallback(
    (params: GenerationParams) => startGeneration('stems', params),
    [startGeneration]
  );

  const mixTracks = useCallback(
    (params: GenerationParams) => startGeneration('mix', params),
    [startGeneration]
  );

  const masterTrack = useCallback(
    (params: GenerationParams) => startGeneration('master', params),
    [startGeneration]
  );

  /**
   * Get status of a specific job (polling fallback if WebSocket unavailable)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await apiClient.getGenerationStatus(jobId);
      return status;
    } catch (err: any) {
      console.error('[useGeneration] Failed to get job status:', err);
      return null;
    }
  }, []);

  /**
   * Get result of a completed job
   */
  const getJobResult = useCallback(async (jobId: string): Promise<GenerationResult | null> => {
    try {
      const result = await apiClient.getGenerationResult(jobId);
      return result;
    } catch (err: any) {
      console.error('[useGeneration] Failed to get job result:', err);
      return null;
    }
  }, []);

  /**
   * Cancel a generation job
   */
  const cancelGeneration = useCallback(
    async (jobId?: string) => {
      const targetJobId = jobId || currentJobId;
      if (!targetJobId) {
        console.warn('[useGeneration] No job to cancel');
        return false;
      }

      try {
        await apiClient.cancelGeneration(targetJobId);
        if (targetJobId === currentJobId) {
          setCurrentJobId(null);
          resetProgress();
          setIsGenerating(false);
        }
        return true;
      } catch (err: any) {
        console.error('[useGeneration] Failed to cancel generation:', err);
        return false;
      }
    },
    [currentJobId, resetProgress]
  );

  /**
   * Reset current job
   */
  const reset = useCallback(() => {
    setCurrentJobId(null);
    setError(null);
    setIsGenerating(false);
    resetProgress();
  }, [resetProgress]);

  // Update generating state based on progress
  useEffect(() => {
    if (isComplete || isFailed) {
      setIsGenerating(false);
    }
  }, [isComplete, isFailed]);

  // Update error from job
  useEffect(() => {
    if (jobError) {
      setError(jobError);
    }
  }, [jobError]);

  return {
    // Current job state
    currentJobId,
    isGenerating,
    progress,
    stage,
    progressMessage,
    isComplete,
    isFailed,
    error,
    result,

    // All jobs
    activeJobs,
    completedJobs,

    // Actions
    startGeneration,
    generateBeat,
    generateLyrics,
    generateMelody,
    generateStems,
    mixTracks,
    masterTrack,
    getJobStatus,
    getJobResult,
    cancelGeneration,
    clearCompletedJob,
    reset,
  };
}
