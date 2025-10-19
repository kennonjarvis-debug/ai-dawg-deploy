/**
 * TransportControls - Playback control interface for piano roll
 */

import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  Circle,
  Repeat,
  Volume2,
} from 'lucide-react';

interface TransportControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  tempo: number;
  currentBeat: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  metronomeEnabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onTempoChange: (tempo: number) => void;
  onLoopToggle: () => void;
  onMetronomeToggle: () => void;
  onLoopRangeChange: (start: number, end: number) => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  isRecording,
  tempo,
  currentBeat,
  loopEnabled,
  loopStart,
  loopEnd,
  metronomeEnabled,
  onPlay,
  onPause,
  onStop,
  onRecord,
  onTempoChange,
  onLoopToggle,
  onMetronomeToggle,
  onLoopRangeChange,
}) => {
  const formatTime = (beat: number): string => {
    const bars = Math.floor(beat / 4) + 1;
    const beats = Math.floor(beat % 4) + 1;
    const ticks = Math.floor((beat % 1) * 960);
    return `${bars}.${beats}.${ticks.toString().padStart(3, '0')}`;
  };

  return (
    <div className="bg-gray-800 text-white px-4 py-3 flex items-center gap-4 border-b border-gray-700">
      {/* Transport Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStop}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Stop"
        >
          <Square className="w-5 h-5" />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Pause"
          >
            <Pause className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="p-2 hover:bg-gray-700 rounded transition-colors bg-blue-600 hover:bg-blue-700"
            title="Play"
          >
            <Play className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onRecord}
          className={`p-2 rounded transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'hover:bg-gray-700'
          }`}
          title="Record"
        >
          <Circle className="w-5 h-5" fill={isRecording ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={onStop}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Return to Start"
        >
          <SkipBack className="w-5 h-5" />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Position Display */}
      <div className="font-mono text-lg">
        {formatTime(currentBeat)}
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Tempo Control */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">BPM</label>
        <input
          type="number"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
          min="40"
          max="300"
        />
        <input
          type="range"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-24 accent-blue-600"
          min="40"
          max="300"
        />
      </div>

      <div className="w-px h-8 bg-gray-700" />

      {/* Loop Control */}
      <button
        onClick={onLoopToggle}
        className={`p-2 rounded transition-colors ${
          loopEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'
        }`}
        title="Toggle Loop"
      >
        <Repeat className="w-5 h-5" />
      </button>

      {loopEnabled && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            value={loopStart}
            onChange={(e) => onLoopRangeChange(Number(e.target.value), loopEnd)}
            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1"
            min="0"
            step="0.25"
          />
          <span>-</span>
          <input
            type="number"
            value={loopEnd}
            onChange={(e) => onLoopRangeChange(loopStart, Number(e.target.value))}
            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1"
            min={loopStart}
            step="0.25"
          />
        </div>
      )}

      <div className="w-px h-8 bg-gray-700" />

      {/* Metronome */}
      <button
        onClick={onMetronomeToggle}
        className={`p-2 rounded transition-colors ${
          metronomeEnabled ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-700'
        }`}
        title="Toggle Metronome"
      >
        <Volume2 className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-500 animate-pulse">
          <Circle className="w-3 h-3" fill="currentColor" />
          <span className="text-sm font-medium">RECORDING</span>
        </div>
      )}
    </div>
  );
};
