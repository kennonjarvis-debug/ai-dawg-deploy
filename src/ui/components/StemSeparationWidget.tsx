/**
 * Stem Separation Widget
 *
 * React component for AI-powered stem separation with Demucs
 * Features: File upload, progress tracking, stem player, download stems
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Play, Pause, Download, Volume2, VolumeX, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type {
  SeparationJobStatus,
  StemResult,
  SeparationResult,
  SeparationQuality,
} from '../../types/separation';

interface StemTrack {
  type: string;
  url: string;
  audio?: HTMLAudioElement;
  volume: number;
  muted: boolean;
  soloed: boolean;
  isPlaying: boolean;
}

export const StemSeparationWidget: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<SeparationJobStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [stems, setStems] = useState<StemTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<SeparationQuality>('balanced');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();

  // WebSocket connection for progress updates
  useEffect(() => {
    if (!jobId) return;

    // TODO: Connect to WebSocket for real-time updates
    // const socket = io(WS_URL);
    // socket.on('separation:progress', handleProgress);
    // socket.on('separation:completed', handleCompleted);
    // socket.on('separation:failed', handleFailed);
    // return () => socket.disconnect();

    // For now, poll the API
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/separation/status/${jobId}`);
        const data = await response.json();

        if (data.status === 'completed' && data.result) {
          handleCompleted(data.result);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          handleFailed({ error: data.error });
          clearInterval(pollInterval);
        } else {
          setProgress(data.progress || 0);
          setStatus(data.status);
        }
      } catch (err: any) {
        console.error('Failed to poll job status:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  // Update playback time
  useEffect(() => {
    if (!isPlaying) return;

    const updateTime = () => {
      if (stems.length > 0 && stems[0].audio) {
        setCurrentTime(stems[0].audio.currentTime);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, stems]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Start separation
  const handleSeparate = async () => {
    if (!file) return;

    try {
      setStatus('uploading');
      setProgress(0);
      setStage('Uploading audio file...');
      setError(null);

      const formData = new FormData();
      formData.append('audio', file);
      formData.append('quality', quality);

      const response = await fetch('/api/separation/separate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.jobId);
        setStatus('processing');
        setStage(data.message || 'Processing...');
      } else {
        throw new Error(data.error || 'Failed to start separation');
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('failed');
    }
  };

  // Handle completion
  const handleCompleted = useCallback((result: SeparationResult) => {
    setStatus('completed');
    setProgress(100);
    setStage('Complete!');

    // Create audio elements for each stem
    const stemTracks: StemTrack[] = result.stems.map((stem: StemResult) => {
      const audio = new Audio(stem.url);
      audio.preload = 'auto';
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      return {
        type: stem.type,
        url: stem.url,
        audio,
        volume: 100,
        muted: false,
        soloed: false,
        isPlaying: false,
      };
    });

    setStems(stemTracks);
  }, []);

  // Handle failure
  const handleFailed = useCallback((data: { error: string }) => {
    setStatus('failed');
    setError(data.error);
    setProgress(0);
  }, []);

  // Play/pause all stems
  const togglePlayback = () => {
    stems.forEach((stem) => {
      if (stem.audio) {
        if (isPlaying) {
          stem.audio.pause();
        } else {
          stem.audio.play().catch(console.error);
        }
      }
    });
    setIsPlaying(!isPlaying);
  };

  // Toggle stem mute
  const toggleMute = (index: number) => {
    const newStems = [...stems];
    newStems[index].muted = !newStems[index].muted;

    if (newStems[index].audio) {
      newStems[index].audio.muted = newStems[index].muted;
    }

    setStems(newStems);
  };

  // Toggle stem solo
  const toggleSolo = (index: number) => {
    const newStems = [...stems];
    const wasSoloed = newStems[index].soloed;

    // If unsoloing, unmute all
    if (wasSoloed) {
      newStems.forEach((stem, i) => {
        stem.soloed = false;
        if (stem.audio) {
          stem.audio.muted = stem.muted;
        }
      });
    } else {
      // Solo this stem, mute others
      newStems.forEach((stem, i) => {
        stem.soloed = i === index;
        if (stem.audio) {
          stem.audio.muted = i !== index;
        }
      });
    }

    setStems(newStems);
  };

  // Update stem volume
  const updateVolume = (index: number, volume: number) => {
    const newStems = [...stems];
    newStems[index].volume = volume;

    if (newStems[index].audio) {
      newStems[index].audio.volume = volume / 100;
    }

    setStems(newStems);
  };

  // Download stem
  const downloadStem = (stem: StemTrack) => {
    const link = document.createElement('a');
    link.href = stem.url;
    link.download = `${file?.name.replace(/\.[^/.]+$/, '')}_${stem.type}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all stems
  const downloadAllStems = () => {
    stems.forEach((stem) => downloadStem(stem));
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render
  return (
    <div className="stem-separation-widget" data-testid="stem-separation-widget">
      <div className="widget-header">
        <h2>AI Stem Separation</h2>
        <p>Separate vocals, drums, bass, and instruments using Demucs AI</p>
      </div>

      {/* File Upload Section */}
      {!jobId && (
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            data-testid="upload-audio"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-button"
          >
            <Upload size={20} />
            {file ? file.name : 'Choose Audio File'}
          </button>

          {file && (
            <div className="quality-selector">
              <label>Quality:</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as SeparationQuality)}
              >
                <option value="fast">Fast (15s)</option>
                <option value="balanced">Balanced (25s)</option>
                <option value="high-quality">High Quality (40s)</option>
              </select>
            </div>
          )}

          {file && (
            <button
              onClick={handleSeparate}
              className="separate-button"
              data-testid="start-separation"
            >
              Start Separation
            </button>
          )}
        </div>
      )}

      {/* Progress Section */}
      {jobId && status !== 'completed' && status !== 'failed' && (
        <div className="progress-section" data-testid="separation-progress">
          <div className="progress-icon">
            <Loader2 className="animate-spin" size={48} />
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
          <div className="progress-stage">{stage}</div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="error-section">
          <XCircle size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Stem Player Section */}
      {status === 'completed' && stems.length > 0 && (
        <div className="stem-player" data-testid="stem-player">
          <div className="player-header">
            <CheckCircle size={24} color="#10b981" />
            <h3>Separation Complete!</h3>
            <button onClick={downloadAllStems} className="download-all-button">
              <Download size={16} />
              Download All
            </button>
          </div>

          {/* Transport Controls */}
          <div className="transport-controls">
            <button onClick={togglePlayback} className="play-button">
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Stem Tracks */}
          <div className="stem-tracks">
            {stems.map((stem, index) => (
              <div
                key={stem.type}
                className="stem-track"
                data-testid={`stem-${stem.type}`}
              >
                <div className="stem-header">
                  <span className="stem-name">
                    {stem.type.charAt(0).toUpperCase() + stem.type.slice(1)}
                  </span>
                  <div className="stem-controls">
                    <button
                      onClick={() => toggleSolo(index)}
                      className={stem.soloed ? 'active' : ''}
                      title="Solo"
                    >
                      S
                    </button>
                    <button
                      onClick={() => toggleMute(index)}
                      className={stem.muted ? 'active' : ''}
                      title="Mute"
                      data-testid="mute-button"
                    >
                      {stem.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button
                      onClick={() => downloadStem(stem)}
                      title="Download"
                      data-testid="download-stem"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <div className="stem-volume">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stem.volume}
                    onChange={(e) => updateVolume(index, parseInt(e.target.value))}
                    data-testid="volume-slider"
                  />
                  <span>{stem.volume}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setJobId(null);
              setFile(null);
              setStems([]);
              setStatus('pending');
              setProgress(0);
              setIsPlaying(false);
            }}
            className="reset-button"
          >
            Separate Another File
          </button>
        </div>
      )}

      {/* Styling */}
      <style jsx>{`
        .stem-separation-widget {
          padding: 24px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #fff;
          max-width: 800px;
          margin: 0 auto;
        }

        .widget-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .widget-header h2 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .widget-header p {
          color: #888;
          font-size: 14px;
        }

        .upload-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .upload-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .upload-button:hover {
          background: #1d4ed8;
        }

        .quality-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quality-selector select {
          padding: 8px 16px;
          background: #2a2a2a;
          color: white;
          border: 1px solid #444;
          border-radius: 6px;
          font-size: 14px;
        }

        .separate-button {
          padding: 12px 32px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .separate-button:hover {
          background: #059669;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 32px;
        }

        .progress-icon {
          color: #2563eb;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #10b981);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }

        .progress-stage {
          color: #888;
          font-size: 14px;
        }

        .error-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #dc2626;
          border-radius: 8px;
          color: white;
        }

        .stem-player {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .player-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid #2a2a2a;
        }

        .player-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          margin: 0;
        }

        .download-all-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #2a2a2a;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .download-all-button:hover {
          background: #3a3a3a;
        }

        .transport-controls {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 16px;
          background: #2a2a2a;
          border-radius: 8px;
        }

        .play-button {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          color: white;
          transition: background 0.2s;
        }

        .play-button:hover {
          background: #1d4ed8;
        }

        .time-display {
          display: flex;
          gap: 8px;
          font-size: 14px;
          color: #888;
        }

        .stem-tracks {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stem-track {
          padding: 16px;
          background: #2a2a2a;
          border-radius: 8px;
        }

        .stem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .stem-name {
          font-weight: 600;
          font-size: 16px;
        }

        .stem-controls {
          display: flex;
          gap: 8px;
        }

        .stem-controls button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .stem-controls button:hover {
          background: #3a3a3a;
        }

        .stem-controls button.active {
          background: #2563eb;
          border-color: #2563eb;
        }

        .stem-volume {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stem-volume input[type="range"] {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #1a1a1a;
          outline: none;
        }

        .stem-volume input[type="range"]::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
        }

        .stem-volume span {
          min-width: 45px;
          text-align: right;
          font-size: 14px;
          color: #888;
        }

        .reset-button {
          padding: 12px 24px;
          background: #2a2a2a;
          color: white;
          border: 1px solid #444;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .reset-button:hover {
          background: #3a3a3a;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default StemSeparationWidget;
