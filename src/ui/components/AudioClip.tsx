import React, { useRef, useEffect, useState } from 'react';
import { AudioClip as AudioClipType, useTimelineStore } from '../../stores/timelineStore';

interface AudioClipProps {
  clip: AudioClipType;
  zoom: number;
  trackHeight: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const AudioClip: React.FC<AudioClipProps> = ({
  clip,
  zoom,
  trackHeight,
  isSelected,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; startTime: number } | null>(null);
  const [resizeMode, setResizeMode] = useState<'left' | 'right' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; startTime: number; duration: number } | null>(null);
  const { updateClip } = useTimelineStore();

  const width = clip.duration * zoom;
  const height = trackHeight - 16; // Padding for glassmorphic spacing

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !clip.waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const waveformData = clip.waveformData;
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    const maxAmplitude = height / 2 - 4;

    // Set waveform color based on clip color with glow effect
    const alpha = isSelected ? 0.9 : 0.7;
    ctx.fillStyle = clip.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');

    // Add glow effect
    if (isSelected) {
      ctx.shadowColor = clip.color;
      ctx.shadowBlur = 8;
    }

    waveformData.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = amplitude * maxAmplitude;

      // Draw symmetrical waveform (top and bottom)
      ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 0.5), barHeight * 2);
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw fade in/out overlays with gradients
    if (clip.fadeIn > 0) {
      const fadeInWidth = clip.fadeIn * zoom;
      const gradient = ctx.createLinearGradient(0, 0, fadeInWidth, 0);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, fadeInWidth, height);
    }

    if (clip.fadeOut > 0) {
      const fadeOutWidth = clip.fadeOut * zoom;
      const fadeOutStart = width - fadeOutWidth;
      const gradient = ctx.createLinearGradient(fadeOutStart, 0, width, 0);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fillRect(fadeOutStart, 0, fadeOutWidth, height);
    }
  }, [clip, width, height, zoom, isSelected]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      startTime: clip.startTime,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaTime = deltaX / zoom;
    const newStartTime = Math.max(0, dragStart.startTime + deltaTime); // Can't go before 0

    // Update clip position in real-time
    updateClip(clip.id, { startTime: newStartTime });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, mode: 'left' | 'right') => {
    e.stopPropagation();
    setResizeMode(mode);
    setResizeStart({
      x: e.clientX,
      startTime: clip.startTime,
      duration: clip.duration,
    });
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizeMode || !resizeStart) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaTime = deltaX / zoom;

    if (resizeMode === 'left') {
      // Resize from left: adjust startTime and duration
      const newStartTime = Math.max(0, resizeStart.startTime + deltaTime);
      const newDuration = Math.max(0.1, resizeStart.duration - (newStartTime - resizeStart.startTime));
      updateClip(clip.id, { startTime: newStartTime, duration: newDuration });
    } else {
      // Resize from right: adjust duration only
      const newDuration = Math.max(0.1, resizeStart.duration + deltaTime);
      updateClip(clip.id, { duration: newDuration });
    }
  };

  const handleResizeMouseUp = () => {
    setResizeMode(null);
    setResizeStart(null);
  };

  // Add global mouse event listeners for dragging and resizing
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, zoom]);

  useEffect(() => {
    if (resizeMode) {
      window.addEventListener('mousemove', handleResizeMouseMove);
      window.addEventListener('mouseup', handleResizeMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [resizeMode, resizeStart, zoom]);

  return (
    <div
      className={`absolute top-2 rounded-xl overflow-hidden cursor-move transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-400/70 shadow-2xl shadow-blue-500/30 scale-[1.02]'
          : 'shadow-lg hover:shadow-xl hover:scale-[1.01]'
      } ${isDragging ? 'opacity-60 cursor-grabbing' : 'cursor-grab'} backdrop-blur-sm`}
      style={{
        left: `${clip.startTime * zoom}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: clip.color + '25', // Glass effect with transparency
        border: `1px solid ${clip.color}40`,
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${clip.color}15 0%, transparent 50%, ${clip.color}10 100%)`
        }}
      />

      {/* Clip name with glass background */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm">
        <div className="text-xs font-semibold text-white/90 pointer-events-none">
          {clip.name}
        </div>
      </div>

      {/* Gain indicator (if not 0) */}
      {clip.gain !== 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm">
          <div className="text-xs font-medium text-white/80 pointer-events-none">
            {clip.gain > 0 ? '+' : ''}
            {clip.gain.toFixed(1)}dB
          </div>
        </div>
      )}

      {/* Resize handles with glass effect */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-white/20 to-transparent hover:from-blue-400/40 cursor-ew-resize backdrop-blur-sm z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-white/20 to-transparent hover:from-blue-400/40 cursor-ew-resize backdrop-blur-sm z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
      />
    </div>
  );
};
