/**
 * Live Pitch Display Component
 *
 * Real-time pitch visualization with sharp/flat detection
 * Features:
 * - Visual pitch meter showing current note
 * - Sharp/flat indicator (±50 cents)
 * - Color coding: Green (in tune), Yellow (slightly off), Red (>30 cents off)
 * - Target pitch line based on song key
 * - Real-time cents offset display
 * - Historical pitch graph (last 10 seconds)
 * - Draggable and resizable wrapper
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { DraggableResizableWrapper } from './DraggableResizableWrapper';

interface PitchData {
  frequency: number | null;
  note: string | null;
  octave: number | null;
  cents: number;
  confidence: number;
  isInTune: boolean;
  isSharp: boolean;
  isFlat: boolean;
  targetFrequency: number | null;
  timestamp: number;
}

interface LivePitchDisplayProps {
  isVisible: boolean;
  trackId?: string;
  projectId?: string;
  userId?: string;
  websocketUrl?: string;
  expectedKey?: string;
  showHistory?: boolean;
  historyDuration?: number; // seconds
}

const NOTE_COLORS = {
  inTune: '#10b981', // Green
  slightlyOff: '#f59e0b', // Yellow
  veryOff: '#ef4444', // Red
  background: 'rgba(20, 20, 30, 0.95)',
  border: 'rgba(255, 255, 255, 0.1)',
};

export const LivePitchDisplay: React.FC<LivePitchDisplayProps> = ({
  isVisible,
  trackId = 'track-1',
  projectId = 'project-1',
  userId = 'user-123',
  websocketUrl = 'http://localhost:3000',
  expectedKey = 'C',
  showHistory = true,
  historyDuration = 10,
}) => {
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(websocketUrl, {
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[LivePitchDisplay] WebSocket connected');
      setIsConnected(true);
      if (projectId) {
        socket.emit('join:project', { projectId });
      }
    });

    socket.on('disconnect', () => {
      console.log('[LivePitchDisplay] WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('live-pitch-data', (data: PitchData & { trackId: string }) => {
      if (data.trackId === trackId) {
        setCurrentPitch(data);

        // Update history
        setPitchHistory((prev) => {
          const updated = [...prev, data];
          // Keep only last N seconds
          const cutoffTime = Date.now() - historyDuration * 1000;
          return updated.filter((p) => p.timestamp > cutoffTime);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [websocketUrl, userId, projectId, trackId, historyDuration]);

  // Draw pitch meter
  useEffect(() => {
    if (!canvasRef.current || !currentPitch) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = NOTE_COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Draw pitch meter background
    const meterHeight = 60;
    const meterY = (height - meterHeight) / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(20, meterY, width - 40, meterHeight);

    // Draw center line (target pitch)
    const centerX = width / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, meterY);
    ctx.lineTo(centerX, meterY + meterHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw pitch indicators
    const centsRange = 50; // ±50 cents
    const pixelsPerCent = (width - 40) / (2 * centsRange);
    const offset = currentPitch.cents * pixelsPerCent;
    const indicatorX = centerX + offset;

    // Choose color based on deviation
    let color = NOTE_COLORS.inTune;
    if (Math.abs(currentPitch.cents) > 30) {
      color = NOTE_COLORS.veryOff;
    } else if (Math.abs(currentPitch.cents) > 10) {
      color = NOTE_COLORS.slightlyOff;
    }

    // Draw pitch indicator
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(indicatorX, meterY + meterHeight / 2, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Draw cents markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let cents = -50; cents <= 50; cents += 10) {
      const x = centerX + cents * pixelsPerCent;
      ctx.fillText(cents.toString(), x, meterY - 5);

      // Draw tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x, meterY);
      ctx.lineTo(x, meterY + 10);
      ctx.stroke();
    }

    // Draw note name
    if (currentPitch.note) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${currentPitch.note}${currentPitch.octave}`,
        width / 2,
        meterY - 25
      );
    }

    // Draw frequency
    if (currentPitch.frequency) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px monospace';
      ctx.fillText(
        `${currentPitch.frequency.toFixed(1)} Hz`,
        width / 2,
        meterY + meterHeight + 25
      );
    }

    // Draw cents offset
    const centsText = currentPitch.cents >= 0
      ? `+${currentPitch.cents.toFixed(0)}`
      : currentPitch.cents.toFixed(0);
    ctx.fillStyle = color;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${centsText}¢`, width / 2, meterY + meterHeight + 45);

    // Draw sharp/flat indicator
    let tuningText = 'IN TUNE';
    if (currentPitch.isSharp) {
      tuningText = 'SHARP ♯';
    } else if (currentPitch.isFlat) {
      tuningText = 'FLAT ♭';
    }

    ctx.fillStyle = color;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(tuningText, width / 2, meterY + meterHeight + 65);

    // Draw confidence
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px monospace';
    ctx.fillText(
      `Confidence: ${(currentPitch.confidence * 100).toFixed(0)}%`,
      width / 2,
      height - 10
    );
  }, [currentPitch]);

  // Draw pitch history graph
  useEffect(() => {
    if (!historyCanvasRef.current || !showHistory || pitchHistory.length < 2) return;

    const canvas = historyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Calculate Y-axis range (±50 cents)
    const minCents = -50;
    const maxCents = 50;
    const centsRange = maxCents - minCents;

    // Draw center line (0 cents)
    const centerY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let cents = -40; cents <= 40; cents += 20) {
      const y = centerY - (cents / centsRange) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw pitch history line
    if (pitchHistory.length > 0) {
      const timeRange = historyDuration * 1000;
      const now = Date.now();

      ctx.strokeStyle = NOTE_COLORS.inTune;
      ctx.lineWidth = 2;
      ctx.beginPath();

      pitchHistory.forEach((pitch, index) => {
        if (pitch.frequency === null) return;

        const timeOffset = (now - pitch.timestamp) / timeRange;
        const x = width - timeOffset * width;
        const y = centerY - (pitch.cents / centsRange) * height;

        // Color based on tuning
        let color = NOTE_COLORS.inTune;
        if (Math.abs(pitch.cents) > 30) {
          color = NOTE_COLORS.veryOff;
        } else if (Math.abs(pitch.cents) > 10) {
          color = NOTE_COLORS.slightlyOff;
        }

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.stroke();
    }

    // Draw time labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Now', width - 5, height - 5);
    ctx.textAlign = 'left';
    ctx.fillText(`-${historyDuration}s`, 5, height - 5);
  }, [pitchHistory, showHistory, historyDuration]);

  if (!isVisible) return null;

  return (
    <DraggableResizableWrapper
      id="live-pitch-display"
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 500, height: showHistory ? 500 : 300 }}
      minWidth={400}
      minHeight={showHistory ? 400 : 250}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: NOTE_COLORS.background,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${NOTE_COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${NOTE_COLORS.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? NOTE_COLORS.inTune : NOTE_COLORS.veryOff,
                animation: isConnected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
              }}
            />
            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
              Live Pitch Monitor
            </span>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: 'monospace',
            }}
          >
            Key: {expectedKey}
          </div>
        </div>

        {/* Pitch Meter Canvas */}
        <canvas
          ref={canvasRef}
          width={468}
          height={220}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            marginBottom: showHistory ? '16px' : '0',
          }}
        />

        {/* Pitch History Canvas */}
        {showHistory && (
          <div style={{ flex: 1, minHeight: 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '8px',
              }}
            >
              Pitch History
            </div>
            <canvas
              ref={historyCanvasRef}
              width={468}
              height={200}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
              }}
            />
          </div>
        )}

        {/* Status */}
        {!currentPitch && (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px',
            }}
          >
            {isConnected ? 'Waiting for audio input...' : 'Connecting...'}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </DraggableResizableWrapper>
  );
};

export default LivePitchDisplay;
