/**
 * Meter - React component for MeterViz
 *
 * Usage:
 *   <Meter
 *     audioContext={audioContext}
 *     mediaStream={mediaStream}
 *     width={200}
 *     height={400}
 *     orientation="vertical"
 *   />
 */

'use client';

import { useEffect, useRef } from 'react';
import { MeterViz, MeterVizConfig } from '../MeterViz';

import { logger } from '$lib/utils/logger';
export interface MeterProps {
  /** Audio context */
  audioContext: AudioContext | null;
  /** Media stream to visualize */
  mediaStream?: MediaStream | null;
  /** Audio source node (alternative to mediaStream) */
  sourceNode?: MediaStreamAudioSourceNode | AudioBufferSourceNode | GainNode;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Meter orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show peak hold indicator */
  showPeakHold?: boolean;
  /** Number of segments (0 = continuous) */
  segments?: number;
  /** Custom colors */
  colors?: MeterVizConfig['colors'];
  /** Enable debug mode */
  debug?: boolean;
  /** Auto-start visualization */
  autoStart?: boolean;
}

export function Meter({
  audioContext,
  mediaStream,
  sourceNode,
  width = 40,
  height = 200,
  orientation = 'vertical',
  showPeakHold = true,
  segments = 0,
  colors,
  debug = false,
  autoStart = true,
}: MeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<MeterViz | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    // Create meter visualizer
    meterRef.current = new MeterViz({
      canvas,
      audioContext,
      orientation,
      showPeakHold,
      segments,
      colors,
      debug,
    });

    // Start if auto-start enabled
    if (autoStart) {
      meterRef.current.start();
    }

    return () => {
      meterRef.current?.destroy();
      meterRef.current = null;
    };
  }, [audioContext, width, height, orientation, showPeakHold, segments, colors, debug, autoStart]);

  // Connect media stream
  useEffect(() => {
    if (!audioContext || !mediaStream || !meterRef.current) return;

    try {
      // Create source node from media stream
      sourceNodeRef.current = audioContext.createMediaStreamSource(mediaStream);
      meterRef.current.connectSource(sourceNodeRef.current);
    } catch (error) {
      logger.error('[Meter] Failed to connect media stream:', error);
    }

    return () => {
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
    };
  }, [audioContext, mediaStream]);

  // Connect source node
  useEffect(() => {
    if (!sourceNode || !meterRef.current) return;

    meterRef.current.connectSource(sourceNode);

    return () => {
      meterRef.current?.disconnectSource();
    };
  }, [sourceNode]);

  // Handle resize
  useEffect(() => {
    if (!meterRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    meterRef.current.resize(width, height);
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
