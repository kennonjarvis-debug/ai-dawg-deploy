'use client';

import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useAudioPlayback } from '@/hooks/use-audio-playback';
import { useAudioStore } from '@/lib/store';
import { Waveform } from '@/components/audio/waveform';
import { TrackControls } from '@/components/audio/track-controls';
import { MicSelector } from '@/components/audio/mic-selector';
import { downloadAudio, convertToWav, getRecordingFilename } from '@/lib/audio/export';
import { Play, Pause, Square, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export function MainWorkspace() {
  const {
    state,
    startRecording,
    stopRecording,
    initialize,
    startMonitoring,
    stopMonitoring,
    changeDevice,
  } = useAudioRecorder();
  const { loadAudio, play, pause, stop, playback } = useAudioPlayback();
  const { tracks, activeTrackId, addRecording } = useAudioStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const activeRecording = activeTrack?.recordings.find(
    (r) => r.id === activeTrack.activeRecordingId
  );

  // Don't auto-initialize - wait for user action

  useEffect(() => {
    // Load active recording when it changes
    if (activeRecording) {
      loadAudio(activeRecording.blob);
    }
  }, [activeRecording, loadAudio]);

  const handleRecord = async () => {
    if (state.isRecording) {
      const blob = await stopRecording();
      stopMonitoring();
      setIsMonitoring(false);

      if (blob && activeTrackId) {
        const recording = {
          id: `recording-${Date.now()}`,
          blob,
          duration: state.duration,
          createdAt: new Date(),
        };
        addRecording(activeTrackId, recording);
      }
    } else {
      // Initialize if needed, then start recording
      const initialized = await initialize();
      if (initialized) {
        await startRecording();
      }
    }
  };

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
      setIsMonitoring(false);
    } else {
      const initialized = await initialize();
      if (initialized) {
        startMonitoring();
        setIsMonitoring(true);
      }
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    await changeDevice(deviceId);
  };

  const handleExport = async (format: 'webm' | 'wav') => {
    if (!activeRecording || !activeTrack) return;

    setIsExporting(true);
    try {
      const filename = getRecordingFilename(activeTrack.name, activeRecording.createdAt);

      if (format === 'wav') {
        const wavBlob = await convertToWav(activeRecording.blob);
        downloadAudio(wavBlob, filename, 'wav');
      } else {
        downloadAudio(activeRecording.blob, filename, 'webm');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]">
      <div className="flex-1 flex flex-col p-8">
        {activeRecording || state.isRecording ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {state.isRecording
                  ? 'Recording...'
                  : `${activeTrack?.name || 'Track'} - ${activeTrack?.type || 'Vocal'}`}
              </h2>
              {state.isRecording && (
                <span className="text-2xl font-mono text-red-500">
                  {formatDuration(state.duration)}
                </span>
              )}
            </div>

            {/* Waveform */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
              <Waveform
                audioBlob={activeRecording?.blob || null}
                isRecording={state.isRecording}
              />
            </div>

            {/* Playback Controls */}
            {activeRecording && !state.isRecording && (
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {!playback.isPlaying ? (
                    <button
                      onClick={play}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={pause}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={stop}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-sm font-mono">
                    {formatDuration(Math.floor(playback.currentTime))}
                  </span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width: `${(playback.currentTime / playback.duration) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-500">
                    {formatDuration(Math.floor(playback.duration))}
                  </span>
                </div>
              </div>
            )}

            {/* Track Controls */}
            {activeRecording && !state.isRecording && activeTrackId && (
              <TrackControls trackId={activeTrackId} />
            )}

            {/* Export & Recording Buttons */}
            <div className="flex gap-3">
              {activeRecording && !state.isRecording && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('webm')}
                    disabled={isExporting}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Export WebM
                  </button>
                  <button
                    onClick={() => handleExport('wav')}
                    disabled={isExporting}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Export WAV
                  </button>
                </div>
              )}
              <button
                onClick={handleRecord}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  state.isRecording
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {state.isRecording ? 'Stop Recording' : 'New Recording'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎤</div>
              <h2 className="text-2xl font-bold">No recording yet</h2>
              <p className="text-gray-400 max-w-md">
                Click &quot;New Recording&quot; or ask your AI coach to get started!
              </p>
              <button
                onClick={handleRecord}
                className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                New Recording
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audio Input Monitor */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="flex items-center gap-4">
          <MicSelector onDeviceChange={handleDeviceChange} />

          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMonitoring
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMonitoring ? 'Monitoring' : 'Start Monitoring'}
          </button>
        </div>

        {isMonitoring && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Input Level:</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${state.audioLevel * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(state.audioLevel * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
