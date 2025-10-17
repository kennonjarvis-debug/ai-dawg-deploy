'use client';

import { SkipBack, Play, Square, SkipForward, Circle, Pause } from 'lucide-react';
import { useAudioStore } from '@/lib/store';
import { useAudioPlayback } from '@/hooks/use-audio-playback';

export function TransportControls() {
  const { playback, tracks, activeTrackId } = useAudioStore();
  const { play, pause, stop } = useAudioPlayback();

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const hasRecording = activeTrack && activeTrack.recordings.length > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-gray-800 bg-[#0f0f0f] p-4">
      <div className="flex items-center gap-6">
        {/* Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
            disabled={!hasRecording}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          {!playback.isPlaying ? (
            <button
              onClick={play}
              className="p-2 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
              disabled={!hasRecording}
            >
              <Play className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={pause}
              className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={stop}
            className="p-2 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
            disabled={!hasRecording}
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
            disabled={!hasRecording}
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors ml-2">
            <Circle className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Timecode */}
        <div className="text-sm font-mono text-gray-400">
          {formatTime(playback.currentTime)}
        </div>

        {/* Timeline */}
        <div className="flex-1">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: playback.duration
                  ? `${(playback.currentTime / playback.duration) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>BPM: 90</span>
          <span>Key: G</span>
          <span>Input: Mic</span>
          {hasRecording && (
            <span className="text-green-500">
              ● {activeTrack?.recordings.length} recording
              {activeTrack?.recordings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
