import { useEffect, useRef } from 'react';

export interface BeatData {
  bpm: number;
  beatTimes: number[];
  currentTime: number;
  beatsPerMeasure?: number;
}

interface RhythmGridProps {
  beatData: BeatData;
  width?: number;
  height?: number;
  beatsVisible?: number;
}

export function RhythmGrid({
  beatData,
  width = 800,
  height = 100,
  beatsVisible = 8
}: RhythmGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let flashIntensity = 0;
    const beatsPerMeasure = beatData.beatsPerMeasure || 4;

    const animate = () => {
      if (!ctx) return;

      // Clear
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Calculate beat spacing
      const beatDuration = 60 / beatData.bpm; // seconds per beat
      const beatSpacing = width / beatsVisible;

      // Calculate current beat position
      const currentBeat = beatData.currentTime / beatDuration;
      const beatInMeasure = currentBeat % beatsPerMeasure;

      // Check if we just hit a beat
      const currentBeatIndex = Math.floor(currentBeat);
      if (currentBeatIndex > lastBeatTimeRef.current) {
        flashIntensity = 1.0;
        lastBeatTimeRef.current = currentBeatIndex;
      }

      // Decay flash
      flashIntensity *= 0.85;

      // Draw measure separators and beat lines
      for (let i = 0; i < beatsVisible; i++) {
        const x = i * beatSpacing;
        const isDownbeat = i % beatsPerMeasure === 0;
        const isMidMeasure = i % beatsPerMeasure === beatsPerMeasure / 2 && beatsPerMeasure > 2;

        // Draw vertical line
        ctx.strokeStyle = isDownbeat ? '#00ff00' : isMidMeasure ? '#888' : '#444';
        ctx.lineWidth = isDownbeat ? 3 : isMidMeasure ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Beat number labels
        ctx.fillStyle = isDownbeat ? '#00ff00' : '#aaa';
        ctx.font = isDownbeat ? 'bold 16px monospace' : '14px monospace';
        const beatNumber = (i % beatsPerMeasure) + 1;
        ctx.fillText(`${beatNumber}`, x + 5, 25);

        // Measure number on downbeats
        if (isDownbeat && i > 0) {
          ctx.fillStyle = '#666';
          ctx.font = '10px monospace';
          ctx.fillText(`M${Math.floor(i / beatsPerMeasure) + 1}`, x + 5, height - 10);
        }
      }

      // Draw subdivision markers (eighth notes)
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      for (let i = 0; i < beatsVisible * 2; i++) {
        if (i % 2 === 1) { // Only odd indices (between beats)
          const x = (i / 2) * beatSpacing;
          ctx.beginPath();
          ctx.moveTo(x, height / 2);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      // Draw current position cursor
      const beatPosition = currentBeat % beatsVisible;
      const x = (beatPosition / beatsVisible) * width;

      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw cursor tip
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 5, 10);
      ctx.lineTo(x + 5, 10);
      ctx.closePath();
      ctx.fill();

      // Flash effect on downbeat
      if (beatInMeasure < 0.1 && flashIntensity > 0.5) {
        ctx.fillStyle = `rgba(0, 255, 0, ${flashIntensity * 0.3})`;
        ctx.fillRect(0, 0, width, height);
      } else if ((currentBeat % 1) < 0.1 && flashIntensity > 0.3) {
        // Flash on regular beat (less intense)
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.2})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw timing accuracy indicator
      const beatFraction = (currentBeat % 1);
      let timingStatus = '';
      let timingColor = '';

      if (beatFraction < 0.05 || beatFraction > 0.95) {
        timingStatus = 'On Beat';
        timingColor = '#00ff00';
      } else if (beatFraction < 0.15 || beatFraction > 0.85) {
        timingStatus = 'Close';
        timingColor = '#ffff00';
      } else if (beatFraction < 0.5) {
        timingStatus = 'Ahead';
        timingColor = '#ff8800';
      } else {
        timingStatus = 'Behind';
        timingColor = '#ff8800';
      }

      ctx.fillStyle = timingColor;
      ctx.font = '12px monospace';
      ctx.fillText(timingStatus, width - 70, height - 10);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [beatData, width, height, beatsVisible]);

  return (
    <div className="rhythm-grid">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rhythm-canvas"
      />
      <div className="rhythm-info">
        <span className="bpm-display">{beatData.bpm} BPM</span>
        <span className="time-signature">{beatData.beatsPerMeasure || 4}/4</span>
      </div>
    </div>
  );
}
