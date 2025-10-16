import { useEffect, useRef, useState } from 'react';

interface VolumeMeterProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  showPeak?: boolean;
  showClipWarning?: boolean;
}

export function VolumeMeter({
  analyser,
  width = 30,
  height = 200,
  orientation = 'vertical',
  showPeak = true,
  showClipWarning = true
}: VolumeMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const peakLevel = useRef<number>(0);
  const peakHoldTime = useRef<number>(0);
  const [isClipping, setIsClipping] = useState(false);
  const [currentDb, setCurrentDb] = useState(-60);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    let clippingTimeout: ReturnType<typeof setTimeout>;

    const animate = () => {
      if (!ctx || !analyser) return;

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS level
      let sum = 0;
      let max = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
        max = Math.max(max, Math.abs(normalized));
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Convert to dB
      const db = 20 * Math.log10(rms + 0.0001);
      setCurrentDb(db);

      // Normalize for display (0 to 1)
      const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));
      const level = normalizedLevel * (orientation === 'vertical' ? height : width);

      // Check for clipping
      if (max > 0.95) {
        setIsClipping(true);
        clearTimeout(clippingTimeout);
        clippingTimeout = setTimeout(() => setIsClipping(false), 1000);
      }

      // Update peak with hold
      const now = Date.now();
      if (level > peakLevel.current) {
        peakLevel.current = level;
        peakHoldTime.current = now;
      } else if (now - peakHoldTime.current > 1500) {
        // Peak decay after hold time
        peakLevel.current *= 0.95;
      }

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      if (orientation === 'vertical') {
        // Draw vertical meter

        // Create gradient
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#00ff00');      // -60dB (green)
        gradient.addColorStop(0.6, '#00ff00');    // -24dB (green)
        gradient.addColorStop(0.75, '#ffff00');   // -12dB (yellow)
        gradient.addColorStop(0.9, '#ff8800');    // -6dB (orange)
        gradient.addColorStop(0.95, '#ff0000');   // -3dB (red)
        gradient.addColorStop(1, '#ff0000');      // 0dB (red)

        // Draw background scale markers
        ctx.fillStyle = '#333';
        const markers = [0, -3, -6, -12, -24, -48];
        markers.forEach(dbValue => {
          const y = height * (1 - (dbValue + 60) / 60);
          ctx.fillRect(0, y, width, 1);

          // Add dB labels
          if (width > 40) {
            ctx.fillStyle = '#666';
            ctx.font = '8px monospace';
            ctx.fillText(`${dbValue}`, 2, y - 2);
            ctx.fillStyle = '#333';
          }
        });

        // Draw level bar
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - level, width, level);

        // Draw peak indicator
        if (showPeak && peakLevel.current > 0) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, height - peakLevel.current, width, 2);
        }

        // Draw clip warning
        if (showClipWarning && isClipping) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.fillRect(0, 0, width, 30);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('CLIP', width / 2, 20);
          ctx.textAlign = 'left';
        }

      } else {
        // Draw horizontal meter

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.6, '#00ff00');
        gradient.addColorStop(0.75, '#ffff00');
        gradient.addColorStop(0.9, '#ff8800');
        gradient.addColorStop(0.95, '#ff0000');
        gradient.addColorStop(1, '#ff0000');

        // Draw level bar
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, level, height);

        // Draw peak indicator
        if (showPeak && peakLevel.current > 0) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(peakLevel.current, 0, 2, height);
        }

        // Draw clip warning
        if (showClipWarning && isClipping) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.fillRect(width - 40, 0, 40, height);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('CLIP', width - 35, height / 2 + 4);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(clippingTimeout);
    };
  }, [analyser, width, height, orientation, showPeak, showClipWarning]);

  return (
    <div className={`volume-meter ${orientation}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="volume-canvas"
      />
      {orientation === 'vertical' && (
        <div className="db-display">{currentDb.toFixed(1)} dB</div>
      )}
    </div>
  );
}
