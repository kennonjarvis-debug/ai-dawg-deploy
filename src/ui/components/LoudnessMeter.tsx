/**
 * LoudnessMeter Component
 *
 * Real-time LUFS (Loudness Units relative to Full Scale) display
 * for AI mastering feedback.
 *
 * Features:
 * - Visual loudness meter with color-coded zones
 * - Target vs current loudness comparison
 * - Supports -14, -9, -6 LUFS targets
 * - Dynamic range (PLR) display
 * - Animated needle movement
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export interface LoudnessMeterProps {
  currentLUFS: number;
  targetLUFS: number;
  truePeak?: number;
  dynamicRange?: number; // PLR - Peak to Loudness Ratio
  isProcessing?: boolean;
  className?: string;
}

export const LoudnessMeter: React.FC<LoudnessMeterProps> = ({
  currentLUFS,
  targetLUFS,
  truePeak = 0,
  dynamicRange = 0,
  isProcessing = false,
  className = ''
}) => {
  const [animatedLUFS, setAnimatedLUFS] = useState(currentLUFS);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate LUFS changes
  useEffect(() => {
    const diff = currentLUFS - animatedLUFS;
    if (Math.abs(diff) > 0.1) {
      const step = diff * 0.15; // Smooth easing
      const timer = setTimeout(() => {
        setAnimatedLUFS(prev => prev + step);
      }, 16); // ~60fps
      return () => clearTimeout(timer);
    } else {
      setAnimatedLUFS(currentLUFS);
    }
  }, [currentLUFS, animatedLUFS]);

  // Draw meter visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Define LUFS range for display (-40 to 0)
    const minLUFS = -40;
    const maxLUFS = 0;

    // Convert LUFS to canvas Y position
    const lufsToY = (lufs: number) => {
      const normalized = (lufs - minLUFS) / (maxLUFS - minLUFS);
      return height - (normalized * height);
    };

    // Draw background zones (color-coded by loudness)
    const zones = [
      { start: -40, end: -20, color: 'rgba(59, 130, 246, 0.15)', label: 'Quiet' },
      { start: -20, end: -14, color: 'rgba(34, 197, 94, 0.15)', label: 'Streaming' },
      { start: -14, end: -9, color: 'rgba(234, 179, 8, 0.15)', label: 'Club' },
      { start: -9, end: -6, color: 'rgba(249, 115, 22, 0.15)', label: 'Hot' },
      { start: -6, end: 0, color: 'rgba(239, 68, 68, 0.15)', label: 'Danger' }
    ];

    zones.forEach(zone => {
      const y1 = lufsToY(zone.end);
      const y2 = lufsToY(zone.start);

      ctx.fillStyle = zone.color;
      ctx.fillRect(0, y1, width, y2 - y1);
    });

    // Draw grid lines and labels
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';

    for (let lufs = -40; lufs <= 0; lufs += 5) {
      const y = lufsToY(lufs);

      // Grid line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillText(`${lufs}`, 5, y - 2);
    }

    // Draw target line
    const targetY = lufsToY(targetLUFS);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw target label
    ctx.fillStyle = 'rgba(168, 85, 247, 1)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`Target: ${targetLUFS} LUFS`, width - 100, targetY - 5);

    // Draw current level bar
    const currentY = lufsToY(animatedLUFS);
    const barWidth = 30;
    const barX = width - barWidth - 10;

    // Determine color based on proximity to target
    const diff = Math.abs(animatedLUFS - targetLUFS);
    let barColor;
    if (diff < 0.5) {
      barColor = 'rgba(34, 197, 94, 0.9)'; // Green - perfect
    } else if (diff < 1.5) {
      barColor = 'rgba(234, 179, 8, 0.9)'; // Yellow - close
    } else {
      barColor = 'rgba(239, 68, 68, 0.9)'; // Red - off target
    }

    // Draw bar
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, currentY, barWidth, height - currentY);

    // Draw current level indicator (needle)
    ctx.strokeStyle = barColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(barX - 5, currentY);
    ctx.stroke();

    // Draw pulse effect if processing
    if (isProcessing) {
      const pulseSize = 8;
      const gradient = ctx.createRadialGradient(
        barX - 10, currentY, 0,
        barX - 10, currentY, pulseSize
      );
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(barX - 10, currentY, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [animatedLUFS, targetLUFS, isProcessing]);

  // Determine status
  const difference = animatedLUFS - targetLUFS;
  const isOnTarget = Math.abs(difference) < 0.5;
  const isClose = Math.abs(difference) < 1.5;

  const getStatusIcon = () => {
    if (isOnTarget) return <Activity className="w-4 h-4 text-green-400" />;
    if (difference > 0) return <TrendingUp className="w-4 h-4 text-orange-400" />;
    return <TrendingDown className="w-4 h-4 text-blue-400" />;
  };

  const getStatusText = () => {
    if (isOnTarget) return 'On target';
    if (difference > 0) return `${Math.abs(difference).toFixed(1)} dB too loud`;
    return `${Math.abs(difference).toFixed(1)} dB too quiet`;
  };

  const getStatusColor = () => {
    if (isOnTarget) return 'text-green-400';
    if (isClose) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`loudness-meter ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Loudness Meter</h3>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Processing
          </div>
        )}
      </div>

      {/* Meter Canvas */}
      <div className="relative bg-gray-950 rounded-lg p-3 border border-gray-700">
        <canvas
          ref={canvasRef}
          width={280}
          height={200}
          className="w-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Stats Display */}
      <div className="mt-3 space-y-2">
        {/* Current vs Target */}
        <div className="flex items-center justify-between bg-gray-800 rounded p-2">
          <span className="text-xs text-gray-400">Current:</span>
          <span className={`text-sm font-bold ${getStatusColor()}`}>
            {animatedLUFS.toFixed(1)} LUFS
          </span>
        </div>

        <div className="flex items-center justify-between bg-gray-800 rounded p-2">
          <span className="text-xs text-gray-400">Target:</span>
          <span className="text-sm font-bold text-purple-400">
            {targetLUFS.toFixed(1)} LUFS
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between bg-gray-800 rounded p-2">
          <span className="text-xs text-gray-400">Status:</span>
          <div className={`flex items-center gap-1 text-xs font-semibold ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>

        {/* Additional metrics */}
        {truePeak !== 0 && (
          <div className="flex items-center justify-between bg-gray-800 rounded p-2">
            <span className="text-xs text-gray-400">True Peak:</span>
            <span className={`text-xs font-semibold ${truePeak > -0.5 ? 'text-red-400' : 'text-gray-300'}`}>
              {truePeak.toFixed(1)} dBTP
            </span>
          </div>
        )}

        {dynamicRange !== 0 && (
          <div className="flex items-center justify-between bg-gray-800 rounded p-2">
            <span className="text-xs text-gray-400">Dynamic Range:</span>
            <span className="text-xs font-semibold text-gray-300">
              {dynamicRange.toFixed(1)} dB
            </span>
          </div>
        )}
      </div>

      {/* Style */}
      <style>{`
        .loudness-meter {
          background: rgba(17, 24, 39, 0.5);
          border: 1px solid rgba(75, 85, 99, 0.5);
          border-radius: 8px;
          padding: 12px;
        }
      `}</style>
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const LoudnessMeterCompact: React.FC<{
  currentLUFS: number;
  targetLUFS: number;
  className?: string;
}> = ({ currentLUFS, targetLUFS, className = '' }) => {
  const difference = currentLUFS - targetLUFS;
  const isOnTarget = Math.abs(difference) < 0.5;

  const getColor = () => {
    if (isOnTarget) return 'text-green-400';
    if (Math.abs(difference) < 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <Volume2 className="w-3 h-3 text-gray-400" />
      <span className="text-gray-400">
        {currentLUFS.toFixed(1)} / {targetLUFS.toFixed(1)} LUFS
      </span>
      <span className={`font-semibold ${getColor()}`}>
        {difference > 0 ? '+' : ''}{difference.toFixed(1)} dB
      </span>
    </div>
  );
};
