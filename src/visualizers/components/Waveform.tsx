/**
 * Waveform - React component for WaveformViz
 *
 * Usage:
 *   <Waveform
 *     audioContext={audioContext}
 *     mediaStream={mediaStream}
 *     width={800}
 *     height={200}
 *     style="filled"
 *     scrolling={true}
 *   />
 */

'use client';

import { useEffect, useRef } from 'react';
import { WaveformViz, WaveformStyle } from '../WaveformViz';

export interface WaveformProps {
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
  /** Drawing style */
  style?: WaveformStyle;
  /** Waveform color */
  color?: string | CanvasGradient;
  /** Background color */
  backgroundColor?: string;
  /** Enable scrolling mode (for live recording) */
  scrolling?: boolean;
  /** Line width (for 'line' style) */
  lineWidth?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Auto-start visualization */
  autoStart?: boolean;
}

export function Waveform({
  audioContext,
  mediaStream,
  sourceNode,
  width = 800,
  height = 200,
  style = 'filled',
  color = '#00e5ff',
  backgroundColor = 'transparent',
  scrolling = false,
  lineWidth = 2,
  debug = false,
  autoStart = true,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<WaveformViz | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    // Create waveform visualizer
    waveformRef.current = new WaveformViz({
      canvas,
      audioContext,
      style,
      color,
      backgroundColor,
      scrolling,
      lineWidth,
      debug,
    });

    // Start if auto-start enabled
    if (autoStart) {
      waveformRef.current.start();
    }

    return () => {
      waveformRef.current?.destroy();
      waveformRef.current = null;
    };
  }, [audioContext, width, height, style, color, backgroundColor, scrolling, lineWidth, debug, autoStart]);

  // Connect media stream
  useEffect(() => {
    if (!audioContext || !mediaStream || !waveformRef.current) return;

    try {
      sourceNodeRef.current = audioContext.createMediaStreamSource(mediaStream);
      waveformRef.current.connectSource(sourceNodeRef.current);
    } catch (error) {
      console.error('[Waveform] Failed to connect media stream:', error);
    }

    return () => {
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
    };
  }, [audioContext, mediaStream]);

  // Connect source node
  useEffect(() => {
    if (!sourceNode || !waveformRef.current) return;

    waveformRef.current.connectSource(sourceNode);

    return () => {
      waveformRef.current?.disconnectSource();
    };
  }, [sourceNode]);

  // Handle resize
  useEffect(() => {
    if (!waveformRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    waveformRef.current.resize(width, height);
  }, [width, height]);

  // Update style
  useEffect(() => {
    waveformRef.current?.setStyle(style);
  }, [style]);

  // Update scrolling mode
  useEffect(() => {
    waveformRef.current?.setScrolling(scrolling);
  }, [scrolling]);

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
