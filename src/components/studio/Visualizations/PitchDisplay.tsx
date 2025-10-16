import { useEffect, useRef } from 'react';

export interface PitchData {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
  timestamp: number;
}

interface PitchDisplayProps {
  pitchData: PitchData[];
  targetNote?: string;
  width?: number;
  height?: number;
  showHistory?: boolean;
}

export function PitchDisplay({
  pitchData,
  targetNote = 'A4',
  width = 800,
  height = 200,
  showHistory = true
}: PitchDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines (for cents deviation)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;

      // Draw horizontal grid lines every 10 cents
      for (let i = -50; i <= 50; i += 10) {
        const y = height / 2 - (i / 100) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Add cent labels
        if (i !== 0) {
          ctx.fillStyle = '#666';
          ctx.font = '10px monospace';
          ctx.fillText(`${i > 0 ? '+' : ''}${i}¢`, 5, y - 2);
        }
      }

      // Draw center line (perfect pitch)
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw "In Tune" zone (±10 cents)
      ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
      const tuneZoneHeight = (20 / 100) * height;
      ctx.fillRect(0, height / 2 - tuneZoneHeight / 2, width, tuneZoneHeight);

      if (pitchData.length === 0) {
        // Draw "No Signal" message
        ctx.fillStyle = '#666';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No pitch detected', width / 2, height / 2);
        ctx.textAlign = 'left';
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Draw pitch history as a line graph
      if (showHistory && pitchData.length > 1) {
        const pointsToShow = Math.min(pitchData.length, Math.floor(width / 2));
        const recentData = pitchData.slice(-pointsToShow);

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();

        recentData.forEach((data, i) => {
          const x = (i / pointsToShow) * width;

          // Clamp cents to ±50
          const clampedCents = Math.max(-50, Math.min(50, data.cents));
          const normalizedCents = clampedCents / 100; // -0.5 to 0.5
          const y = height / 2 - (normalizedCents * height);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();
      }

      // Draw current pitch indicator
      if (pitchData.length > 0) {
        const current = pitchData[pitchData.length - 1];
        const clampedCents = Math.max(-50, Math.min(50, current.cents));
        const normalizedCents = clampedCents / 100;
        const y = height / 2 - (normalizedCents * height);

        // Color based on accuracy
        const isOnPitch = Math.abs(current.cents) < 10;
        const isClose = Math.abs(current.cents) < 20;

        ctx.fillStyle = isOnPitch ? '#00ff00' : isClose ? '#ffff00' : '#ff4444';

        // Draw current position circle
        ctx.beginPath();
        ctx.arc(width - 20, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer ring for emphasis
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width - 20, y, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Display current note and cents
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(current.note, 20, 40);

        // Display cents with color
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = isOnPitch ? '#00ff00' : isClose ? '#ffff00' : '#ff4444';
        const centsText = `${current.cents > 0 ? '+' : ''}${current.cents.toFixed(0)}¢`;
        ctx.fillText(centsText, 20, 70);

        // Display frequency
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.fillText(`${current.frequency.toFixed(1)} Hz`, 20, 95);

        // Display confidence
        if (current.confidence < 0.8) {
          ctx.fillStyle = '#ff8800';
          ctx.font = '12px monospace';
          ctx.fillText(`Confidence: ${(current.confidence * 100).toFixed(0)}%`, 20, 115);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pitchData, width, height, targetNote, showHistory]);

  return (
    <div className="pitch-display">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="pitch-canvas"
      />
      <div className="pitch-legend">
        <span className="legend-item">
          <span className="dot green"></span> On Pitch (&lt;10¢)
        </span>
        <span className="legend-item">
          <span className="dot yellow"></span> Close (&lt;20¢)
        </span>
        <span className="legend-item">
          <span className="dot red"></span> Off Pitch (&gt;20¢)
        </span>
      </div>
    </div>
  );
}
