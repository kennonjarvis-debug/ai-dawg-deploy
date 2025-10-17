'use client';

import { usePitchDetection } from '@/src/core/usePitchDetection';
import { useEffect, useState, useMemo } from 'react';
import { Pitch, Waveform, Meter } from '@/src/visualizers';
import type { PitchData } from '@/src/visualizers';
import styles from './PitchMonitor.module.css';

interface PitchMonitorProps {
  trackId: string;
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  isRecording: boolean;
}

export function PitchMonitor({
  trackId,
  audioContext,
  mediaStream,
  isRecording
}: PitchMonitorProps) {
  const pitchDetection = usePitchDetection({
    audioContext,
    mediaStream,
    enabled: isRecording,
    updateInterval: 50, // 20fps
  });

  const { currentPitch, statistics, isActive, start, stop, clearHistory } = pitchDetection;

  // Convert pitch detection format to PitchData format for visualizer
  const pitchData: PitchData | null = useMemo(() => {
    if (!currentPitch || currentPitch.frequency === 0) return null;

    return {
      note: currentPitch.note,
      frequency: currentPitch.frequency,
      cents: currentPitch.cents,
      confidence: currentPitch.confidence,
      inTune: currentPitch.inTune,
    };
  }, [currentPitch]);

  // Auto-start/stop with recording
  useEffect(() => {
    if (isRecording && mediaStream) {
      start();
    } else {
      stop();
    }
  }, [isRecording, mediaStream, start, stop]);

  return (
    <div className={styles.monitor}>
      {/* Header with Status */}
      <div className={styles.header}>
        <span className={styles.title}>Pitch Monitor</span>
        {isActive && (
          <span className={styles.activeIndicator} title="Active">
            ● ACTIVE
          </span>
        )}
      </div>

      {/* Main Pitch Visualizer (Canvas) */}
      <div className={styles.pitchVizContainer}>
        <Pitch
          audioContext={audioContext}
          pitchData={pitchData}
          width={500}
          height={280}
          showHistory={true}
          historyDuration={5}
          inTuneThreshold={10}
          showCentsMeter={true}
          showFrequency={true}
          autoStart={true}
        />
      </div>

      {/* Side Panel: Waveform + Meter */}
      <div className={styles.sidePanel}>
        {/* Real-time Waveform */}
        <div className={styles.waveformContainer}>
          <div className={styles.sectionLabel}>Waveform</div>
          <Waveform
            audioContext={audioContext}
            mediaStream={mediaStream}
            width={200}
            height={80}
            style="mirror"
            color="#00e5ff"
            backgroundColor="rgba(0, 0, 0, 0.2)"
            scrolling={false}
            autoStart={true}
          />
        </div>

        {/* VU Meter */}
        <div className={styles.meterContainer}>
          <div className={styles.sectionLabel}>Level</div>
          <Meter
            audioContext={audioContext}
            mediaStream={mediaStream}
            width={200}
            height={60}
            orientation="horizontal"
            showPeakHold={true}
            segments={0}
            autoStart={true}
          />
        </div>
      </div>

      {/* Statistics Panel */}
      <div className={styles.statsPanel}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Confidence</span>
          <span className={styles.statValue}>
            {currentPitch?.confidence
              ? `${(currentPitch.confidence * 100).toFixed(0)}%`
              : '--'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>In Tune</span>
          <span className={styles.statValue}>
            {statistics.totalDetections > 0
              ? `${(statistics.inTunePercentage * 100).toFixed(0)}%`
              : '--'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Detections</span>
          <span className={styles.statValue}>
            {statistics.totalDetections}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Range</span>
          <span className={styles.statValue}>
            {statistics.avgFrequency
              ? `${statistics.minFrequency.toFixed(0)}-${statistics.maxFrequency.toFixed(0)} Hz`
              : '--'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {statistics.totalDetections > 0 && (
          <button
            className={styles.clearButton}
            onClick={clearHistory}
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}
