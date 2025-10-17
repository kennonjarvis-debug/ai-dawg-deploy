/**
 * EQCurve - React component for EQCurveViz
 *
 * Usage:
 *   <EQCurve
 *     audioContext={audioContext}
 *     eqParams={{
 *       low: { frequency: 100, gain: 0, Q: 1, type: 'lowshelf' },
 *       mid: { frequency: 1000, gain: 0, Q: 1, type: 'peaking' },
 *       high: { frequency: 8000, gain: 0, Q: 1, type: 'highshelf' },
 *     }}
 *     width={400}
 *     height={200}
 *   />
 */

'use client';

import { useEffect, useRef } from 'react';
import { EQCurveViz, EQCurveParams } from '../EQCurveViz';

export interface EQCurveProps {
  /** Audio context */
  audioContext: AudioContext | null;
  /** EQ parameters */
  eqParams: EQCurveParams;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show frequency labels */
  showLabels?: boolean;
  /** Curve color */
  curveColor?: string;
  /** Grid color */
  gridColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Enable debug mode */
  debug?: boolean;
  /** Auto-start visualization */
  autoStart?: boolean;
}

export function EQCurve({
  audioContext,
  eqParams,
  width = 400,
  height = 200,
  showGrid = true,
  showLabels = true,
  curveColor = '#00e5ff',
  gridColor = 'rgba(255, 255, 255, 0.1)',
  backgroundColor = 'transparent',
  debug = false,
  autoStart = true,
}: EQCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eqCurveRef = useRef<EQCurveViz | null>(null);

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioContext) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    // Create EQ curve visualizer
    eqCurveRef.current = new EQCurveViz({
      canvas,
      audioContext,
      eqParams,
      showGrid,
      showLabels,
      curveColor,
      gridColor,
      backgroundColor,
      debug,
    });

    // Start if auto-start enabled
    if (autoStart) {
      eqCurveRef.current.start();
    }

    return () => {
      eqCurveRef.current?.destroy();
      eqCurveRef.current = null;
    };
  }, [audioContext, width, height, showGrid, showLabels, curveColor, gridColor, backgroundColor, debug, autoStart]);

  // Update EQ params when they change
  useEffect(() => {
    eqCurveRef.current?.updateEQParams(eqParams);
  }, [eqParams]);

  // Handle resize
  useEffect(() => {
    if (!eqCurveRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    eqCurveRef.current.resize(width, height);
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
