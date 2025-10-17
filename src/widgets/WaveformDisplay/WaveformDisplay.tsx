'use client';

import { FC, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTransport } from '@/src/core/transport';
import { useTrackStore } from '@/src/core/store';
import styles from './WaveformDisplay.module.css';

interface WaveformDisplayProps {
  className?: string;
}

/**
 * WaveformDisplay Widget
 * Canvas-based waveform visualization with playhead sync
 */
export const WaveformDisplay: FC<WaveformDisplayProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isReady, setIsReady] = useState(false);

  const { tracks, activeTrackId } = useTrackStore();
  const { isPlaying, isRecording } = useTransport();

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const activeRecording = activeTrack?.recordings.find(
    (r) => r.id === activeTrack.activeRecordingId
  );

  // Determine waveform colors based on recording state and track color
  const waveColor = isRecording ? '#ff0000' : activeTrack?.color || '#444444';
  const progressColor = isRecording ? '#ff6666' : '#ffffff';

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      cursorColor: '#00d4ff',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 128,
      normalize: true,
      backend: 'WebAudio',
      hideScrollbar: false,
      minPxPerSec: 50,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setIsReady(true);
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [waveColor, progressColor]);

  // Load audio when active recording changes
  useEffect(() => {
    if (activeRecording && activeRecording.blob && wavesurferRef.current) {
      const url = URL.createObjectURL(activeRecording.blob);

      console.log('Loading waveform for recording:', activeRecording.id);
      console.log('Blob size:', activeRecording.blob.size);
      console.log('Duration:', activeRecording.duration);

      wavesurferRef.current.load(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (!activeRecording && wavesurferRef.current) {
      // Clear waveform when no recording
      wavesurferRef.current.empty();
    }
  }, [activeRecording]);

  // Sync playback with transport
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;

    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying, isReady]);

  // Live waveform visualization during recording
  useEffect(() => {
    if (!isRecording || !activeTrack?.recordArm || !canvasRef.current) {
      // Stop animation if not recording
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Set up audio analyser for live visualization
    const setupAnalyser = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: activeTrack.inputDeviceId
            ? { deviceId: { exact: activeTrack.inputDeviceId } }
            : true,
        });

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        // Animation loop
        const draw = () => {
          if (!isRecording) return;

          animationFrameRef.current = requestAnimationFrame(draw);

          analyser.getByteTimeDomainData(dataArray);

          canvasCtx.fillStyle = 'rgb(17, 17, 17)';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = '#ff0000';
          canvasCtx.beginPath();

          const sliceWidth = (canvas.width * 1.0) / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] ?? 0) / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          canvasCtx.lineTo(canvas.width, canvas.height / 2);
          canvasCtx.stroke();
        };

        draw();
      } catch (error) {
        console.error('Failed to setup audio analyser:', error);
      }
    };

    setupAnalyser();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, [isRecording, activeTrack?.recordArm, activeTrack?.inputDeviceId]);

  // Handle zoom
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.5, 10);
    setZoom(newZoom);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom * 50);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.5, 0.5);
    setZoom(newZoom);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom * 50);
    }
  };

  const handleZoomReset = () => {
    setZoom(1);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(50);
    }
  };

  return (
    <div className={`${styles.waveformDisplay} ${className || ''}`}>
      {/* Zoom Controls */}
      <div className={styles.controls}>
        <div className={styles.zoomControls}>
          <button
            className="btn btn-icon btn-icon-sm"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut style={{ width: '16px', height: '16px' }} />
          </button>
          <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
          <button
            className="btn btn-icon btn-icon-sm"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            className="btn btn-icon btn-icon-sm"
            onClick={handleZoomReset}
            title="Fit to Width"
          >
            <Maximize2 style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {activeTrack && (
          <div className={styles.trackInfo}>
            <span className={styles.trackName}>{activeTrack.name}</span>
            {activeRecording && (
              <span className={styles.duration}>
                {Math.floor(activeRecording.duration / 60)}:
                {String(Math.floor(activeRecording.duration % 60)).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Waveform Container */}
      <div className={styles.waveformContainer}>
        {/* Live recording canvas */}
        {isRecording && activeTrack?.recordArm && (
          <canvas
            ref={canvasRef}
            className={styles.liveWaveform}
            width={1200}
            height={128}
          />
        )}

        {/* WaveSurfer container for playback */}
        <div
          ref={containerRef}
          className={styles.waveform}
          style={{ display: activeRecording && !isRecording ? 'block' : 'none' }}
        />

        {/* Empty state */}
        {!activeRecording && !isRecording && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎵</div>
            <div className={styles.emptyText}>No recording selected</div>
            <div className={styles.emptyHint}>
              Record audio or select a track to see waveform
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
