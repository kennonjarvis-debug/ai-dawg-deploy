/**
 * Realtime Pitch Display
 * Live pitch visualization with target notes overlay and WebSocket feedback
 * Designed for <100ms latency vocal coaching
 */

import React, { useRef, useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PitchData {
  frequency: number;
  note: string;
  cents: number; // Deviation from perfect pitch (-50 to +50)
  confidence: number;
  isInTune: boolean;
  timestamp: number;
}

interface FeedbackMessage {
  type: 'success' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

interface RealtimePitchDisplayProps {
  isActive: boolean;
  targetNotes?: string[]; // Optional reference notes like ["C4", "D4", "E4"]
  onPitchData?: (data: PitchData) => void;
  webSocketUrl?: string;
  height?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CENTS_TOLERANCE = 15; // ±15 cents is considered "in tune"

export const RealtimePitchDisplay: React.FC<RealtimePitchDisplayProps> = ({
  isActive,
  targetNotes = [],
  onPitchData,
  webSocketUrl,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pitchHistoryRef = useRef<PitchData[]>([]);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peakAccuracy, setPeakAccuracy] = useState(0);
  const [averageDeviation, setAverageDeviation] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Connect to WebSocket for live feedback
  useEffect(() => {
    if (!isActive || !webSocketUrl) return;

    try {
      const ws = new WebSocket(webSocketUrl);

      ws.onopen = () => {
        console.log('[PitchDisplay] WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'pitch') {
            const pitchData: PitchData = {
              frequency: data.frequency,
              note: data.note,
              cents: data.cents,
              confidence: data.confidence,
              isInTune: Math.abs(data.cents) <= CENTS_TOLERANCE,
              timestamp: Date.now(),
            };

            setCurrentPitch(pitchData);
            pitchHistoryRef.current.push(pitchData);

            // Keep last 100 data points for visualization
            if (pitchHistoryRef.current.length > 100) {
              pitchHistoryRef.current.shift();
            }

            // Calculate statistics
            if (pitchHistoryRef.current.length > 10) {
              const recentPitches = pitchHistoryRef.current.slice(-20);
              const inTuneCount = recentPitches.filter(p => p.isInTune).length;
              const accuracy = (inTuneCount / recentPitches.length) * 100;
              setPeakAccuracy(Math.max(peakAccuracy, accuracy));

              const avgCents = recentPitches.reduce((sum, p) => sum + Math.abs(p.cents), 0) / recentPitches.length;
              setAverageDeviation(avgCents);
            }

            onPitchData?.(pitchData);
          } else if (data.type === 'feedback') {
            setFeedback({
              type: data.severity || 'info',
              message: data.message,
              timestamp: Date.now(),
            });

            // Clear feedback after 2 seconds
            setTimeout(() => setFeedback(null), 2000);
          }
        } catch (error) {
          console.error('[PitchDisplay] Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[PitchDisplay] WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[PitchDisplay] WebSocket disconnected');
        setIsConnected(false);
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('[PitchDisplay] Failed to connect WebSocket:', error);
    }
  }, [isActive, webSocketUrl]);

  // Draw pitch visualization
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.offsetWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw center line (perfect pitch)
      const centerY = height / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw in-tune zone (±15 cents)
      const centsToY = (cents: number) => centerY - (cents / 50) * (height * 0.4);
      const inTuneTop = centsToY(CENTS_TOLERANCE);
      const inTuneBottom = centsToY(-CENTS_TOLERANCE);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fillRect(0, inTuneTop, width, inTuneBottom - inTuneTop);

      // Draw zone boundaries
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 1;
      [inTuneTop, inTuneBottom].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw pitch curve
      if (pitchHistoryRef.current.length > 1) {
        const pointsToShow = Math.min(100, pitchHistoryRef.current.length);
        const pointWidth = width / pointsToShow;

        // Create gradient for pitch curve
        const curveGradient = ctx.createLinearGradient(0, 0, width, 0);
        curveGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        curveGradient.addColorStop(1, 'rgba(59, 130, 246, 1)');

        ctx.strokeStyle = curveGradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add glow effect
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;

        ctx.beginPath();

        pitchHistoryRef.current.slice(-pointsToShow).forEach((pitch, i) => {
          const x = i * pointWidth;
          const y = centsToY(pitch.cents);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw points with color coding
        pitchHistoryRef.current.slice(-pointsToShow).forEach((pitch, i) => {
          const x = i * pointWidth;
          const y = centsToY(pitch.cents);

          ctx.fillStyle = pitch.isInTune ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw target notes overlay
      if (targetNotes.length > 0) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';

        targetNotes.forEach((note, i) => {
          const x = 10;
          const y = 20 + i * 20;
          ctx.fillText(`♪ ${note}`, x, y);
        });
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, height, targetNotes]);

  return (
    <div className="relative bg-gradient-to-b from-bg-surface-2 to-bg-surface rounded-xl overflow-hidden border border-border-strong shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-base bg-bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isActive && isConnected ? 'text-green-500 animate-pulse' : 'text-text-dim'}`} />
          <h3 className="text-sm font-bold text-text-base">Live Pitch Tracking</h3>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-text-muted">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Pitch canvas */}
      <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} />

      {/* Current pitch display */}
      {currentPitch && isActive && (
        <div className="absolute top-16 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10 shadow-lg">
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentPitch.isInTune ? 'text-green-400' : 'text-red-400'}`}>
              {currentPitch.note}
            </div>
            <div className="text-xs text-white/70 font-mono mt-1">
              {currentPitch.frequency.toFixed(1)} Hz
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className={`text-sm font-bold ${
                Math.abs(currentPitch.cents) <= 5 ? 'text-green-400' :
                Math.abs(currentPitch.cents) <= CENTS_TOLERANCE ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {currentPitch.cents > 0 ? '+' : ''}{currentPitch.cents.toFixed(0)}¢
              </div>
            </div>

            {/* In-tune indicator */}
            <div className="mt-2">
              {currentPitch.isInTune ? (
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">In Tune!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    {currentPitch.cents > 0 ? 'Sharp' : 'Flat'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {feedback && (
        <div className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-lg backdrop-blur-sm border shadow-lg animate-slide-up ${
          feedback.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
          feedback.type === 'warning' ? 'bg-yellow-500/90 border-yellow-400 text-white' :
          'bg-blue-500/90 border-blue-400 text-white'
        }`}>
          <p className="text-sm font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="px-4 py-3 border-t border-border-base bg-bg-surface/80 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-text-dim">Peak Accuracy</div>
            <div className="text-base font-bold text-green-400">{peakAccuracy.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-text-dim">Avg Deviation</div>
            <div className="text-base font-bold text-blue-400">±{averageDeviation.toFixed(1)}¢</div>
          </div>
        </div>
      </div>

      {/* Idle state */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/90 backdrop-blur-sm">
          <div className="text-center px-6">
            <Activity className="w-12 h-12 mx-auto mb-3 text-text-dim opacity-50" />
            <p className="text-sm font-semibold text-text-muted">Start Recording</p>
            <p className="text-xs text-text-dim mt-1">Pitch tracking will begin automatically</p>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS animation for slide-up (add to global styles)
const styles = `
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
