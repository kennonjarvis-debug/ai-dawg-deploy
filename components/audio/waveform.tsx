'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
  audioBlob?: Blob | null;
  isRecording?: boolean;
}

export function Waveform({ audioBlob, isRecording }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4a5568',
      progressColor: '#3b82f6',
      cursorColor: '#ef4444',
      barWidth: 2,
      barGap: 1,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (audioBlob && wavesurferRef.current) {
      // Load audio blob into waveform
      const url = URL.createObjectURL(audioBlob);
      wavesurferRef.current.load(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full" />
      {!audioBlob && !isRecording && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No audio recorded yet
        </div>
      )}
    </div>
  );
}
