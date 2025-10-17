/**
 * Pitch - React component for PitchViz
 *
 * Usage:
 *   <Pitch
 *     audioContext={audioContext}
 *     pitchData={currentPitch}
 *     width={400}
 *     height={300}
 *     showHistory={true}
 *   />
 */

'use client';

import { useEffect, useRef } from 'react';
import { PitchViz, PitchData, PitchVizConfig } from '../PitchViz';

export interface PitchProps {
  /** Audio context */
  audioContext: AudioContext | null;
  /** Current pitch data (updated externally) */
  pitchData?: PitchData | null;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show pitch history graph */
  showHistory?: boolean;
  /** History duration (seconds) */
  historyDuration?: number;
  /** In-tune threshold (cents) */
  inTuneThreshold?: number;
  /** Show cents meter */
  showCentsMeter?: boolean;
  /** Show frequency readout */
  showFrequency?: boolean;
  /** Custom colors */
  colors?: PitchVizConfig['colors'];
  /** Enable debug mode */
  debug?: boolean;
  /** Auto-start visualization */
  autoStart?: boolean;
}

export function Pitch({
  audioContext,
  pitchData,
  width = 400,
  height = 300,
  showHistory = true,
  historyDuration = 5,
  inTuneThreshold = 10,
  showCentsMeter = true,
  showFrequency = true,
  colors,
  debug = false,
  autoStart = true,
}: PitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pitchVizRef = useRef<PitchViz | null>(null);

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    // Create pitch visualizer
    pitchVizRef.current = new PitchViz({
      canvas,
      audioContext,
      showHistory,
      historyDuration,
      inTuneThreshold,
      showCentsMeter,
      showFrequency,
      colors,
      debug,
    });

    // Start if auto-start enabled
    if (autoStart) {
      pitchVizRef.current.start();
    }

    return () => {
      pitchVizRef.current?.destroy();
      pitchVizRef.current = null;
    };
  }, [audioContext, width, height, showHistory, historyDuration, inTuneThreshold, showCentsMeter, showFrequency, colors, debug, autoStart]);

  // Update pitch data
  useEffect(() => {
    if (!pitchVizRef.current || !pitchData) return;

    pitchVizRef.current.updatePitch(pitchData);
  }, [pitchData]);

  // Handle resize
  useEffect(() => {
    if (!pitchVizRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    pitchVizRef.current.resize(width, height);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}
