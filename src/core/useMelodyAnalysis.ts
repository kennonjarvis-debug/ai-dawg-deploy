/**
 * useMelodyAnalysis Hook - Instance 2 (Audio Engine)
 *
 * Combines pitch detection with melody analysis for AI music generation
 * Integrates with Instance 3's music generation system
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { usePitchDetection } from './usePitchDetection';
import { MelodyAnalyzer } from '@/src/utils/melodyAnalyzer';
import { MelodyAnalysis, VocalCharacteristics } from '@/lib/ai/melody-types';

export interface UseMelodyAnalysisOptions {
  /** Audio context */
  audioContext: AudioContext | null;
  /** Media stream from microphone */
  mediaStream: MediaStream | null;
  /** Enable analysis */
  enabled?: boolean;
  /** BPM for quantization */
  bpm?: number;
  /** Quantize notes to musical grid */
  quantize?: boolean;
  /** Minimum note duration (ms) */
  minNoteDuration?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
}

export interface UseMelodyAnalysisReturn {
  // Analysis results
  melody: MelodyAnalysis | null;
  vocalCharacteristics: VocalCharacteristics | null;

  // Control
  startAnalysis: () => void;
  stopAnalysis: () => void;
  isAnalyzing: boolean;

  // Get current analysis
  analyzeCurrent: () => MelodyAnalysis | null;

  // Clear analysis
  clearAnalysis: () => void;

  // Export
  exportAsText: () => string | null;
  exportForMusicGeneration: () => {
    melody: MelodyAnalysis;
    characteristics: VocalCharacteristics;
  } | null;
}

export function useMelodyAnalysis({
  audioContext,
  mediaStream,
  enabled = true,
  bpm = 120,
  quantize = false,
  minNoteDuration = 100,
  minConfidence = 0.7,
}: UseMelodyAnalysisOptions): UseMelodyAnalysisReturn {
  const [melody, setMelody] = useState<MelodyAnalysis | null>(null);
  const [vocalCharacteristics, setVocalCharacteristics] = useState<VocalCharacteristics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzerRef = useRef<MelodyAnalyzer>(
    new MelodyAnalyzer({
      minNoteDuration,
      minConfidence,
      quantize,
      quantizeResolution: 16, // Sixteenth notes
    })
  );

  const startTimeRef = useRef<number>(0);

  // Use pitch detection
  const {
    pitchHistory,
    start: startPitchDetection,
    stop: stopPitchDetection,
    clearHistory,
  } = usePitchDetection({
    audioContext,
    mediaStream,
    enabled,
    updateInterval: 50, // 20fps
  });

  /**
   * Start melody analysis
   */
  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    startTimeRef.current = Date.now();
    clearHistory();
    startPitchDetection();
  }, [startPitchDetection, clearHistory]);

  /**
   * Stop melody analysis and generate results
   */
  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    stopPitchDetection();

    // Calculate recording duration
    const duration = (Date.now() - startTimeRef.current) / 1000;

    if (pitchHistory.length > 0) {
      // Analyze melody
      const melodyAnalysis = analyzerRef.current.analyzePitchHistory(
        pitchHistory,
        duration,
        bpm
      );
      setMelody(melodyAnalysis);

      // Analyze vocal characteristics
      const vocals = analyzerRef.current.analyzeVocalCharacteristics(pitchHistory);
      setVocalCharacteristics(vocals);
    }
  }, [stopPitchDetection, pitchHistory, bpm]);

  /**
   * Analyze current pitch history without stopping
   */
  const analyzeCurrent = useCallback((): MelodyAnalysis | null => {
    if (pitchHistory.length === 0) return null;

    const duration = (Date.now() - startTimeRef.current) / 1000;
    return analyzerRef.current.analyzePitchHistory(pitchHistory, duration, bpm);
  }, [pitchHistory, bpm]);

  /**
   * Clear all analysis data
   */
  const clearAnalysis = useCallback(() => {
    setMelody(null);
    setVocalCharacteristics(null);
    clearHistory();
  }, [clearHistory]);

  /**
   * Export melody as text (for debugging)
   */
  const exportAsText = useCallback((): string | null => {
    if (!melody) return null;
    return analyzerRef.current.exportAsText(melody);
  }, [melody]);

  /**
   * Export data for music generation API
   */
  const exportForMusicGeneration = useCallback((): {
    melody: MelodyAnalysis;
    characteristics: VocalCharacteristics;
  } | null => {
    if (!melody || !vocalCharacteristics) return null;

    return {
      melody,
      characteristics: vocalCharacteristics,
    };
  }, [melody, vocalCharacteristics]);

  return {
    melody,
    vocalCharacteristics,
    startAnalysis,
    stopAnalysis,
    isAnalyzing,
    analyzeCurrent,
    clearAnalysis,
    exportAsText,
    exportForMusicGeneration,
  };
}
