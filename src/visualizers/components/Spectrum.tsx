/**
 * Spectrum - React component for SpectrumViz
 *
 * Usage:
 *   <Spectrum
 *     audioContext={audioContext}
 *     mediaStream={mediaStream}
 *     width={800}
 *     height={200}
 *     style="bars"
 *     scale="logarithmic"
 *   />
 */

'use client';

import { useEffect, useRef } from 'react';
import { SpectrumViz, SpectrumStyle, FrequencyScale } from '../SpectrumViz';

export interface SpectrumProps {
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
  /** Visualization style */
  style?: SpectrumStyle;
  /** Frequency scale */
  scale?: FrequencyScale;
  /** Minimum frequency (Hz) */
  minFrequency?: number;
  /** Maximum frequency (Hz) */
  maxFrequency?: number;
  /** Number of frequency bins */
  binCount?: number;
  /** Show peak hold indicators */
  showPeakHold?: boolean;
  /** Color gradient */
  colors?: string[];
  /** Background color */
  backgroundColor?: string;
  /** Smoothing factor (0-1) */
  smoothing?: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Auto-start visualization */
  autoStart?: boolean;
}

export function Spectrum({
  audioContext,
  mediaStream,
  sourceNode,
  width = 800,
  height = 200,
  style = 'bars',
  scale = 'logarithmic',
  minFrequency = 20,
  maxFrequency = 20000,
  binCount = 128,
  showPeakHold = true,
  colors,
  backgroundColor = 'transparent',
  smoothing = 0.7,
  debug = false,
  autoStart = true,
}: SpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumRef = useRef<SpectrumViz | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    // Create spectrum visualizer
    spectrumRef.current = new SpectrumViz({
      canvas,
      audioContext,
      style,
      scale,
      minFrequency,
      maxFrequency,
      binCount,
      showPeakHold,
      colors,
      backgroundColor,
      smoothing,
      debug,
    });

    // Start if auto-start enabled
    if (autoStart) {
      spectrumRef.current.start();
    }

    return () => {
      spectrumRef.current?.destroy();
      spectrumRef.current = null;
    };
  }, [audioContext, width, height, style, scale, minFrequency, maxFrequency, binCount, showPeakHold, colors, backgroundColor, smoothing, debug, autoStart]);

  // Connect media stream
  useEffect(() => {
    if (!audioContext || !mediaStream || !spectrumRef.current) return;

    try {
      sourceNodeRef.current = audioContext.createMediaStreamSource(mediaStream);
      spectrumRef.current.connectSource(sourceNodeRef.current);
    } catch (error) {
      console.error('[Spectrum] Failed to connect media stream:', error);
    }

    return () => {
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
    };
  }, [audioContext, mediaStream]);

  // Connect source node
  useEffect(() => {
    if (!sourceNode || !spectrumRef.current) return;

    spectrumRef.current.connectSource(sourceNode);

    return () => {
      spectrumRef.current?.disconnectSource();
    };
  }, [sourceNode]);

  // Handle resize
  useEffect(() => {
    if (!spectrumRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    spectrumRef.current.resize(width, height);
  }, [width, height]);

  // Update smoothing
  useEffect(() => {
    spectrumRef.current?.setSmoothing(smoothing);
  }, [smoothing]);

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
