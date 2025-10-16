import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  color?: string;
  height?: number;
  showControls?: boolean;
}

export function WaveformDisplay({
  audioBuffer,
  isPlaying,
  onSeek,
  color = '#4a9eff',
  height = 128,
  showControls = true
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [zoom, setZoom] = useState(10);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: `${color}88`, // Semi-transparent
      cursorColor: '#fff',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height,
      barGap: 1,
      normalize: true,
      backend: 'WebAudio',
      interact: true
    });

    // Handle seeking
    wavesurferRef.current.on('seeking', (progress) => {
      const time = progress * (wavesurferRef.current?.getDuration() || 0);
      setCurrentTime(time);
      onSeek?.(time);
    });

    // Update current time
    wavesurferRef.current.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    // Handle ready event
    wavesurferRef.current.on('ready', () => {
      setDuration(wavesurferRef.current?.getDuration() || 0);
    });

    // Cleanup
    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [color, height, onSeek]);

  useEffect(() => {
    if (audioBuffer && wavesurferRef.current) {
      // Load the audio buffer - WaveSurfer v7 uses load() with AudioBuffer
      wavesurferRef.current.load('', [audioBuffer.getChannelData(0)], audioBuffer.duration);
    }
  }, [audioBuffer]);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 20, 200);
    setZoom(newZoom);
    wavesurferRef.current?.zoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 20, 10);
    setZoom(newZoom);
    wavesurferRef.current?.zoom(newZoom);
  };

  const handleZoomReset = () => {
    setZoom(10);
    wavesurferRef.current?.zoom(10);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="waveform-container">
      <div ref={containerRef} className="waveform" />

      {showControls && (
        <div className="waveform-controls">
          <div className="waveform-time">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="separator">/</span>
            <span className="total-time">{formatTime(duration)}</span>
          </div>

          <div className="waveform-zoom">
            <button onClick={handleZoomOut} title="Zoom Out">-</button>
            <button onClick={handleZoomReset} title="Reset Zoom">Reset</button>
            <button onClick={handleZoomIn} title="Zoom In">+</button>
            <span className="zoom-level">{zoom}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
