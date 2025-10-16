/**
 * Live Waveform Recorder
 * Renders waveform in real-time during recording with Pro Tools-style aesthetics
 */

import React, { useRef, useEffect, useState } from 'react';
import { Circle } from 'lucide-react';

interface LiveWaveformRecorderProps {
  isRecording: boolean;
  trackId: string;
  trackColor: string;
  height?: number;
}

export const LiveWaveformRecorder: React.FC<LiveWaveformRecorderProps> = ({
  isRecording,
  trackId,
  trackColor,
  height = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [peakLevel, setPeakLevel] = useState(0);
  const [clipWarning, setClipWarning] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Initialize audio analysis
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;

    const initializeAnalyser = async () => {
      try {
        // Get or create audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);

        // Create analyser
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);

        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        // Start recording timer
        const startTime = Date.now();
        const timerInterval = setInterval(() => {
          if (!isRecording) {
            clearInterval(timerInterval);
            return;
          }
          const elapsed = (Date.now() - startTime) / 1000;
          setRecordingDuration(elapsed);
        }, 100);

        // Start waveform animation
        drawWaveform();

        // Cleanup
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          clearInterval(timerInterval);
          stream.getTracks().forEach(track => track.stop());
          source.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize audio analyser:', error);
      }
    };

    initializeAnalyser();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setRecordingDuration(0);
      setPeakLevel(0);
      setClipWarning(false);
    };
  }, [isRecording]);

  // Draw live waveform
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Get waveform data
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    const bufferLength = dataArrayRef.current.length;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate peak level for metering
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArrayRef.current[i] - 128) / 128;
      peak = Math.max(peak, Math.abs(normalized));
    }
    setPeakLevel(peak);

    // Detect clipping (>0.95)
    if (peak > 0.95) {
      setClipWarning(true);
      setTimeout(() => setClipWarning(false), 100);
    }

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    const sliceWidth = width / bufferLength;
    let x = 0;

    // Create gradient for waveform color
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, trackColor + 'DD');
    gradient.addColorStop(0.5, trackColor);
    gradient.addColorStop(1, trackColor + 'DD');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Add glow effect
    ctx.shadowColor = trackColor;
    ctx.shadowBlur = peak > 0.7 ? 12 : 6;

    ctx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw envelope/amplitude fill
    ctx.fillStyle = trackColor + '20';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = (v * height) / 2;
      ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.closePath();
    ctx.fill();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-bg-surface-2 to-bg-surface rounded-xl overflow-hidden border border-border-strong shadow-2xl">
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-full shadow-lg shadow-red-500/50">
          <Circle className="w-3 h-3 fill-white text-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">REC</span>
          <span className="text-xs font-mono text-white/90">{formatTime(recordingDuration)}</span>
        </div>
      )}

      {/* Clipping warning */}
      {clipWarning && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-red-500/95 backdrop-blur-sm rounded-lg shadow-lg animate-pulse">
          <span className="text-xs font-bold text-white uppercase tracking-wider">⚠ CLIP!</span>
        </div>
      )}

      {/* Level meter */}
      <div className="absolute top-14 left-3 right-3 z-10 h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
        <div
          className={`h-full transition-all duration-75 ${
            peakLevel > 0.95
              ? 'bg-red-500'
              : peakLevel > 0.8
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min(peakLevel * 100, 100)}%`,
            boxShadow: `0 0 ${peakLevel * 20}px ${
              peakLevel > 0.95
                ? 'rgba(239, 68, 68, 0.8)'
                : peakLevel > 0.8
                ? 'rgba(234, 179, 8, 0.8)'
                : 'rgba(34, 197, 94, 0.8)'
            }`,
          }}
        />
      </div>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />

      {/* Track info overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
          <span className="text-xs font-semibold text-white/90">Track {trackId.slice(0, 8)}</span>
        </div>

        {isRecording && (
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
            <span className="text-xs font-mono text-white/80">
              Peak: {(peakLevel * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Idle state */}
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-surface/80 backdrop-blur-sm">
          <div className="text-center">
            <Circle className="w-8 h-8 mx-auto mb-2 text-text-dim opacity-50" />
            <p className="text-sm text-text-muted font-medium">Press Record to Start</p>
            <p className="text-xs text-text-dim mt-1">Waveform will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};
