/**
 * usePitchDetection Hook - Instance 2 (Audio Engine)
 *
 * Manages real-time pitch detection for vocal coaching
 * Integrates with useRecording hook for live pitch analysis
 *
 * Features:
 * - Real-time pitch tracking during recording
 * - History tracking for visualization
 * - Target note comparison
 * - Performance statistics
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
import { logger } from '$lib/utils/logger';
  PitchDetector,
  PitchDetectionResult,
  PitchDetectorConfig,
} from '@/src/utils/pitchDetection';

export interface UsePitchDetectionOptions {
  /** Audio context for analysis */
  audioContext: AudioContext | null;
  /** Media stream to analyze (from microphone) */
  mediaStream: MediaStream | null;
  /** Enable pitch detection */
  enabled?: boolean;
  /** Analysis interval in milliseconds (default: 50ms = 20fps) */
  updateInterval?: number;
  /** Buffer size for analysis (default: 2048 samples) */
  bufferSize?: number;
  /** Target note for comparison (e.g., "C4") - optional */
  targetNote?: string | null;
  /** Pitch detector configuration */
  detectorConfig?: Partial<PitchDetectorConfig>;
}

export interface PitchHistoryPoint {
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Pitch detection result */
  result: PitchDetectionResult;
}

export interface PitchStatistics {
  /** Average frequency over session */
  averageFrequency: number;
  /** Percentage of time in tune */
  inTunePercentage: number;
  /** Total detections */
  totalDetections: number;
  /** Successful detections (confidence > threshold) */
  successfulDetections: number;
  /** Most common note */
  mostCommonNote: string | null;
}

export interface UsePitchDetectionReturn {
  /** Current pitch detection result */
  currentPitch: PitchDetectionResult | null;
  /** History of pitch detections */
  pitchHistory: PitchHistoryPoint[];
  /** Performance statistics */
  statistics: PitchStatistics;
  /** Whether pitch detection is active */
  isActive: boolean;
  /** Start pitch detection */
  start: () => void;
  /** Stop pitch detection */
  stop: () => void;
  /** Clear history */
  clearHistory: () => void;
  /** Update target note */
  setTargetNote: (note: string | null) => void;
  /** Update detector configuration */
  updateConfig: (config: Partial<PitchDetectorConfig>) => void;
}

export function usePitchDetection({
  audioContext,
  mediaStream,
  enabled = true,
  updateInterval = 50, // 20fps
  bufferSize = 2048,
  targetNote = null,
  detectorConfig = {},
}: UsePitchDetectionOptions): UsePitchDetectionReturn {
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchHistoryPoint[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [statistics, setStatistics] = useState<PitchStatistics>({
    averageFrequency: 0,
    inTunePercentage: 0,
    totalDetections: 0,
    successfulDetections: 0,
    mostCommonNote: null,
  });

  const detectorRef = useRef<PitchDetector | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetNoteRef = useRef<string | null>(targetNote);

  // Update target note ref when prop changes
  useEffect(() => {
    targetNoteRef.current = targetNote;
  }, [targetNote]);

  // Initialize pitch detector when audio context is available
  useEffect(() => {
    if (!audioContext) {
      return;
    }

    const detector = new PitchDetector({
      sampleRate: audioContext.sampleRate,
      ...detectorConfig,
    });

    detectorRef.current = detector;

    return () => {
      detectorRef.current = null;
    };
  }, [audioContext, detectorConfig]);

  // Setup audio analysis nodes when media stream is available
  useEffect(() => {
    if (!audioContext || !mediaStream || !enabled) {
      return;
    }

    // Create analyser node
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = bufferSize * 2; // Need double for FFT
    analyser.smoothingTimeConstant = 0; // No smoothing for pitch detection

    // Create source from media stream
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    // Create buffer for time-domain data
    const buffer = new Float32Array(analyser.fftSize);

    analyserRef.current = analyser;
    sourceRef.current = source;
    bufferRef.current = buffer;

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      analyserRef.current = null;
      sourceRef.current = null;
      bufferRef.current = null;
    };
  }, [audioContext, mediaStream, enabled, bufferSize]);

  /**
   * Perform pitch detection analysis
   */
  const analyze = useCallback(() => {
    if (
      !detectorRef.current ||
      !analyserRef.current ||
      !bufferRef.current ||
      !isActive
    ) {
      return;
    }

    // Get time-domain data from analyser
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);

    // Detect pitch
    const result = detectorRef.current.detect(bufferRef.current as Float32Array);

    // Update current pitch
    setCurrentPitch(result);

    // Add to history if pitch was detected
    if (result.frequency > 0) {
      const timestamp = Date.now() - startTimeRef.current;
      const historyPoint: PitchHistoryPoint = {
        timestamp,
        result,
      };

      setPitchHistory((prev) => {
        // Keep last 1000 points (50 seconds at 20fps)
        const newHistory = [...prev, historyPoint];
        if (newHistory.length > 1000) {
          newHistory.shift();
        }
        return newHistory;
      });

      // Update statistics
      setStatistics((prev) => {
        const totalDetections = prev.totalDetections + 1;
        const successfulDetections = result.confidence > 0.9
          ? prev.successfulDetections + 1
          : prev.successfulDetections;

        const inTuneCount = prev.inTunePercentage * prev.totalDetections;
        const newInTuneCount = inTuneCount + (result.inTune ? 1 : 0);
        const inTunePercentage = newInTuneCount / totalDetections;

        const avgFreq = prev.averageFrequency * prev.totalDetections;
        const averageFrequency = (avgFreq + result.frequency) / totalDetections;

        return {
          averageFrequency,
          inTunePercentage,
          totalDetections,
          successfulDetections,
          mostCommonNote: result.note || prev.mostCommonNote,
        };
      });
    }
  }, [isActive]);

  /**
   * Start pitch detection
   */
  const start = useCallback(() => {
    if (!detectorRef.current || !analyserRef.current) {
      logger.warn('[usePitchDetection] Cannot start - detector not initialized');
      return;
    }

    setIsActive(true);
    startTimeRef.current = Date.now();

    // Start analysis loop
    intervalRef.current = setInterval(analyze, updateInterval);
  }, [analyze, updateInterval]);

  /**
   * Stop pitch detection
   */
  const stop = useCallback(() => {
    setIsActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Clear pitch history and statistics
   */
  const clearHistory = useCallback(() => {
    setPitchHistory([]);
    setStatistics({
      averageFrequency: 0,
      inTunePercentage: 0,
      totalDetections: 0,
      successfulDetections: 0,
      mostCommonNote: null,
    });
  }, []);

  /**
   * Update target note for comparison
   */
  const setTargetNote = useCallback((note: string | null) => {
    targetNoteRef.current = note;
  }, []);

  /**
   * Update detector configuration
   */
  const updateConfig = useCallback((config: Partial<PitchDetectorConfig>) => {
    if (detectorRef.current) {
      detectorRef.current.updateConfig(config);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    currentPitch,
    pitchHistory,
    statistics,
    isActive,
    start,
    stop,
    clearHistory,
    setTargetNote,
    updateConfig,
  };
}
