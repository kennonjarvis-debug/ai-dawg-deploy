/**
 * PitchMonitor - EXAMPLE WIDGET
 *
 * This is a working example showing how to integrate Instance 2's pitch detection
 * system (usePitchDetection hook) into a UI widget.
 *
 * COPY THIS FILE and modify for your needs. Don't edit this example directly.
 *
 * Integration Guide: /PITCH_DETECTION_INTEGRATION.md (full API reference)
 *
 * Features Demonstrated:
 * - usePitchDetection hook integration
 * - Real-time pitch display (frequency, note, cents)
 * - In-tune indicator
 * - Confidence meter
 * - Pitch history tracking
 * - Performance statistics (avg frequency, in-tune %, most common note)
 * - Target note comparison
 * - Visual pitch meter
 */

'use client';

import { useState, useEffect } from 'react';
import { usePitchDetection } from '@/src/core/usePitchDetection';
import styles from './PitchMonitor.example.module.css';

interface PitchMonitorProps {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  enabled?: boolean;
}

export function PitchMonitor({
  audioContext,
  mediaStream,
  enabled = true,
}: PitchMonitorProps) {
  const [targetNote, setTargetNote] = useState<string>('');

  // Initialize pitch detection hook
  const {
    currentPitch,
    pitchHistory,
    statistics,
    start,
    stop,
    isActive,
    clearHistory,
  } = usePitchDetection({
    audioContext,
    mediaStream,
    enabled,
    updateInterval: 50, // 20fps
  });

  useEffect(() => {
    if (enabled && audioContext && mediaStream) {
      start();
    }
    return () => {
      if (isActive) {
        stop();
      }
    };
  }, [enabled, audioContext, mediaStream]);

  if (!audioContext || !mediaStream) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>No audio context or media stream available</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Pitch Monitor</h2>
        <div className={styles.controls}>
          <button
            className={`${styles.button} ${isActive ? styles.active : ''}`}
            onClick={() => (isActive ? stop() : start())}
          >
            {isActive ? 'Stop' : 'Start'}
          </button>
          <button className={styles.button} onClick={clearHistory}>
            Clear
          </button>
        </div>
      </div>

      {/* Current Pitch Display */}
      <section className={styles.currentPitch}>
        {currentPitch ? (
          <>
            <div className={styles.noteDisplay}>
              <div className={styles.note}>{currentPitch.note}</div>
              <div
                className={`${styles.inTuneIndicator} ${currentPitch.inTune ? styles.inTune : ''}`}
              >
                {currentPitch.inTune ? '✓ In Tune' : '× Out of Tune'}
              </div>
            </div>

            <div className={styles.frequency}>
              {currentPitch.frequency.toFixed(2)} Hz
            </div>

            {/* Cents Deviation Meter */}
            <div className={styles.centsMeter}>
              <div className={styles.centsScale}>
                <span>-50</span>
                <span>0</span>
                <span>+50</span>
              </div>
              <div className={styles.centsBar}>
                <div className={styles.centsCenter}></div>
                <div
                  className={styles.centsNeedle}
                  style={{
                    left: `${50 + (currentPitch.cents / 50) * 50}%`,
                  }}
                ></div>
              </div>
              <div className={styles.centsValue}>
                {currentPitch.cents > 0 ? '+' : ''}
                {currentPitch.cents.toFixed(0)} cents
              </div>
            </div>

            {/* Confidence Meter */}
            <div className={styles.confidence}>
              <label>Confidence:</label>
              <div className={styles.confidenceBar}>
                <div
                  className={styles.confidenceFill}
                  style={{ width: `${currentPitch.confidence * 100}%` }}
                ></div>
              </div>
              <span>{(currentPitch.confidence * 100).toFixed(0)}%</span>
            </div>
          </>
        ) : (
          <div className={styles.noPitch}>
            {isActive ? 'Waiting for audio input...' : 'Press Start to begin'}
          </div>
        )}
      </section>

      {/* Target Note Comparison */}
      {currentPitch && (
        <section className={styles.targetNote}>
          <label>Target Note:</label>
          <input
            type="text"
            value={targetNote}
            onChange={(e) => setTargetNote(e.target.value.toUpperCase())}
            placeholder="e.g., A4, C#5"
            className={styles.input}
          />
          {targetNote && (
            <div className={styles.targetComparison}>
              {currentPitch.note === targetNote ? (
                <span className={styles.match}>✓ Match!</span>
              ) : (
                <span className={styles.noMatch}>
                  Current: {currentPitch.note} | Target: {targetNote}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Performance Statistics */}
      {statistics && pitchHistory.length > 0 && (
        <section className={styles.statistics}>
          <h3>Performance Statistics</h3>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <label>Avg Frequency:</label>
              <span>{statistics.averageFrequency.toFixed(2)} Hz</span>
            </div>
            <div className={styles.stat}>
              <label>In-Tune:</label>
              <span>{statistics.inTunePercentage.toFixed(0)}%</span>
            </div>
            <div className={styles.stat}>
              <label>Most Common Note:</label>
              <span>{statistics.mostCommonNote || 'N/A'}</span>
            </div>
            <div className={styles.stat}>
              <label>Total Detections:</label>
              <span>{statistics.totalDetections}</span>
            </div>
            <div className={styles.stat}>
              <label>History Length:</label>
              <span>{pitchHistory.length} points</span>
            </div>
          </div>
        </section>
      )}

      {/* Pitch History Visualization (Simple) */}
      {pitchHistory.length > 0 && (
        <section className={styles.history}>
          <h3>Recent Pitch History</h3>
          <div className={styles.historyList}>
            {pitchHistory.slice(-10).reverse().map((point, index) => (
              <div key={index} className={styles.historyItem}>
                <span className={styles.historyNote}>{point.result.note}</span>
                <span className={styles.historyFreq}>
                  {point.result.frequency.toFixed(1)} Hz
                </span>
                <span
                  className={`${styles.historyInTune} ${point.result.inTune ? styles.inTune : ''}`}
                >
                  {point.result.inTune ? '✓' : '×'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
