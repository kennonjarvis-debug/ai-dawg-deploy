/**
 * Multi-Track Recorder Widget
 *
 * Simultaneous recording of up to 8 tracks with individual controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { Circle, Square, Pause, Play, Volume2, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../api/client';

interface Track {
  trackId: string;
  trackNumber: number;
  name: string;
  level: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
}

interface MultiTrackRecorderWidgetProps {
  projectId: string;
  userId: string;
  onRecordingComplete?: (sessionId: string) => void;
}

export const MultiTrackRecorderWidget: React.FC<MultiTrackRecorderWidgetProps> = ({
  projectId,
  userId,
  onRecordingComplete,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize session on mount
  useEffect(() => {
    createSession();
    return () => {
      if (sessionId) {
        stopRecording();
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 100);
      }, 100);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  const createSession = async () => {
    try {
      const defaultTracks = Array.from({ length: 4 }, (_, i) => ({
        name: `Track ${i + 1}`,
        armed: i < 2, // Arm first 2 tracks by default
      }));

      const response = await apiClient.request('POST', '/ai/multitrack/session', {
        projectId,
        userId,
        tracks: defaultTracks,
      });

      setSessionId(response.session.sessionId);
      setTracks(response.session.tracks);
      toast.success('Multi-track session created');
    } catch (error: any) {
      toast.error(`Failed to create session: ${error.message}`);
    }
  };

  const startRecording = async () => {
    if (!sessionId) return;

    try {
      await apiClient.request('POST', `/ai/multitrack/session/${sessionId}/start`);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      toast.success('Recording started');
    } catch (error: any) {
      toast.error(`Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    if (!sessionId) return;

    try {
      const response = await apiClient.request(
        'POST',
        `/ai/multitrack/session/${sessionId}/stop`
      );
      setIsRecording(false);
      setMetrics(response.metrics);
      toast.success('Recording stopped');

      if (onRecordingComplete) {
        onRecordingComplete(sessionId);
      }
    } catch (error: any) {
      toast.error(`Failed to stop recording: ${error.message}`);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Recording resumed' : 'Recording paused');
  };

  const updateTrack = async (trackId: string, updates: Partial<Track>) => {
    if (!sessionId) return;

    try {
      const response = await apiClient.request(
        'PUT',
        `/ai/multitrack/session/${sessionId}/track/${trackId}`,
        updates
      );

      setTracks((prev) =>
        prev.map((t) => (t.trackId === trackId ? { ...t, ...updates } : t))
      );
    } catch (error: any) {
      toast.error(`Failed to update track: ${error.message}`);
    }
  };

  const addTrack = () => {
    if (tracks.length >= 8) {
      toast.error('Maximum 8 tracks allowed');
      return;
    }

    const newTrack: Track = {
      trackId: `track_${tracks.length + 1}`,
      trackNumber: tracks.length + 1,
      name: `Track ${tracks.length + 1}`,
      level: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: true,
    };

    setTracks([...tracks, newTrack]);
  };

  const exportSession = async () => {
    if (!sessionId) return;

    try {
      toast.info('Exporting tracks...');
      const response = await apiClient.request(
        'POST',
        `/ai/multitrack/session/${sessionId}/export`,
        { format: 'wav' }
      );

      toast.success('Session exported successfully');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Circle className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold text-white">Multi-Track Recorder</h3>
        </div>
        <div className="text-2xl font-mono text-white">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!sessionId || tracks.filter((t) => t.armed).length === 0}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Circle className="w-5 h-5" />
            Record
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopRecording}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          </>
        )}
      </div>

      {/* Track List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-400">Tracks</h4>
          <button
            onClick={addTrack}
            disabled={tracks.length >= 8 || isRecording}
            className="text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-3 py-1 rounded transition-colors"
          >
            + Add Track
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tracks.map((track) => (
            <TrackControl
              key={track.trackId}
              track={track}
              isRecording={isRecording}
              onUpdate={(updates) => updateTrack(track.trackId, updates)}
            />
          ))}
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="bg-gray-900 rounded p-3 space-y-2">
          <h4 className="text-white font-semibold text-sm">Recording Metrics</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Tracks Recorded:</span>{' '}
              <span className="text-white font-semibold">{metrics.recordedTracks}</span>
            </div>
            <div>
              <span className="text-gray-400">Duration:</span>{' '}
              <span className="text-white font-semibold">
                {(metrics.totalDuration / 1000).toFixed(1)}s
              </span>
            </div>
            <div>
              <span className="text-gray-400">Avg Latency:</span>{' '}
              <span className="text-white font-semibold">
                {metrics.averageLatency.toFixed(0)}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">Data:</span>{' '}
              <span className="text-white font-semibold">
                {(metrics.dataReceived / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={exportSession}
        disabled={!sessionId || isRecording || !metrics}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export Session
      </button>

      <div className="text-xs text-gray-500 text-center">
        {tracks.filter((t) => t.armed).length} of {tracks.length} tracks armed
      </div>
    </div>
  );
};

// Track Control Component
interface TrackControlProps {
  track: Track;
  isRecording: boolean;
  onUpdate: (updates: Partial<Track>) => void;
}

const TrackControl: React.FC<TrackControlProps> = ({ track, isRecording, onUpdate }) => {
  return (
    <div className="bg-gray-900 rounded p-3">
      <div className="flex items-center gap-2 mb-2">
        {/* Arm Button */}
        <button
          onClick={() => onUpdate({ armed: !track.armed })}
          disabled={isRecording}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            track.armed ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
          } ${isRecording ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-700'}`}
        >
          <Circle className={`w-4 h-4 ${track.armed && isRecording ? 'animate-pulse' : ''}`} />
        </button>

        {/* Track Name */}
        <input
          type="text"
          value={track.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          disabled={isRecording}
          className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
        />

        {/* Mute/Solo */}
        <button
          onClick={() => onUpdate({ muted: !track.muted })}
          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
            track.muted ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          M
        </button>
        <button
          onClick={() => onUpdate({ solo: !track.solo })}
          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
            track.solo ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          S
        </button>
      </div>

      {/* Level Control */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-3 h-3 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={track.level}
          onChange={(e) => onUpdate({ level: parseFloat(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs text-gray-400 w-8">
          {Math.round(track.level * 100)}
        </span>
      </div>

      {/* Pan Control */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-400 w-4">L</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={track.pan}
          onChange={(e) => onUpdate({ pan: parseFloat(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs text-gray-400 w-4">R</span>
      </div>
    </div>
  );
};
