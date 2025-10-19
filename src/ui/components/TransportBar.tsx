import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  ChevronUp,
  ChevronDown,
  Circle,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useTransportStore } from '@/stores';
import { cn, formatTime, formatBarsBeatsTicks, secondsToBeats } from '@/lib';

export const TransportBar: React.FC = () => {
  const {
    isPlaying,
    isRecording,
    isLooping,
    currentTime,
    bpm,
    key,
    timeSignature,
    togglePlay,
    toggleRecord,
    toggleLoop,
    setBpm,
    setKey,
    stop,
    skipBackward,
    skipForward,
  } = useTransportStore();

  const [bpmInput, setBpmInput] = useState(bpm.toString());
  const [showKeySelector, setShowKeySelector] = useState(false);

  // Update BPM input when store changes
  useEffect(() => {
    setBpmInput(bpm.toString());
  }, [bpm]);

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpmInput(e.target.value);
  };

  const handleBpmBlur = () => {
    const newBpm = parseInt(bpmInput, 10);
    if (!isNaN(newBpm)) {
      setBpm(newBpm);
    } else {
      setBpmInput(bpm.toString());
    }
  };

  const handleBpmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBpmBlur();
      e.currentTarget.blur();
    }
  };

  const incrementBpm = () => {
    setBpm(bpm + 1);
  };

  const decrementBpm = () => {
    setBpm(bpm - 1);
  };

  const musicKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const handleKeySelect = (selectedKey: string) => {
    setKey(selectedKey);
    setShowKeySelector(false);
  };


  // Calculate bars, beats, ticks from current time
  const totalBeats = secondsToBeats(currentTime, bpm);
  const barsBeatsTicksDisplay = formatBarsBeatsTicks(totalBeats, timeSignature.numerator);

  return (
    <div
      data-testid="transport-bar"
      className="w-full bg-transparent px-6 py-3 flex items-center justify-center gap-8 relative"
    >
      {/* Left Section: BPM and Time Signature */}
      <div className="flex items-center gap-4 absolute left-6">
        {/* BPM Control */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <button
              onClick={incrementBpm}
              className="text-text-dim hover:text-text-base transition-colors p-0 h-3 w-4 flex items-center justify-center"
              aria-label="Increase BPM"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={decrementBpm}
              className="text-text-dim hover:text-text-base transition-colors p-0 h-3 w-4 flex items-center justify-center"
              aria-label="Decrease BPM"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              data-testid="bpm-display"
              type="text"
              value={bpmInput}
              onChange={handleBpmChange}
              onBlur={handleBpmBlur}
              onKeyDown={handleBpmKeyDown}
              className="bg-transparent text-text-base font-medium text-lg w-12 text-center outline-none focus:bg-bg-surface-2 rounded px-1"
              aria-label="BPM"
            />
            <span className="text-text-muted text-sm font-medium">BPM</span>
          </div>
        </div>

        {/* Key Control */}
        <div className="flex items-center gap-2 relative">
          <span className="text-text-muted text-sm font-medium">KEY:</span>
          <button
            onClick={() => setShowKeySelector(!showKeySelector)}
            className="bg-bg-surface-2 text-text-base font-medium text-base px-3 py-1 rounded min-w-[50px] text-center outline-none hover:bg-bg-surface-hover transition-colors"
            aria-label="Musical Key"
          >
            {key}
          </button>

          {showKeySelector && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowKeySelector(false)} />
              <div className="absolute top-full left-0 mt-1 bg-bg-surface-2 border border-border-strong rounded-lg shadow-2xl z-20 grid grid-cols-3 gap-1 p-2">
                {musicKeys.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeySelect(k)}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
                      k === key
                        ? 'bg-primary text-text-base'
                        : 'text-text-muted hover:bg-bg-surface-hover'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Time Signature Display */}
        <div
          data-testid="time-signature"
          className="flex items-center gap-1 text-text-muted text-sm font-mono"
        >
          <div className="w-6 h-6 flex items-center justify-center bg-bg-surface-2 rounded">
            {timeSignature.numerator}
          </div>
          <span>/</span>
          <div className="w-6 h-6 flex items-center justify-center bg-bg-surface-2 rounded">
            {timeSignature.denominator}
          </div>
        </div>
      </div>

      {/* Center Section: Transport Controls and Time Display */}
      <div className="flex items-center gap-6">
        {/* Transport Buttons */}
        <div className="flex items-center gap-2">
          {/* Skip Back */}
          <button
            onClick={skipBackward}
            className="text-text-muted hover:text-text-base transition-colors p-1.5 hover:bg-bg-surface-hover rounded"
            aria-label="Skip Backward"
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause */}
          <button
            data-testid="play-button"
            onClick={togglePlay}
            className={cn(
              'p-2 rounded-full transition-all',
              isPlaying
                ? 'bg-primary hover:bg-primary-hover text-white playing active'
                : 'bg-bg-surface-2 hover:bg-bg-surface-hover text-text-base'
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>

          {/* Stop */}
          <button
            data-testid="stop-button"
            onClick={stop}
            className="p-2 rounded-full transition-all bg-bg-surface-2 hover:bg-bg-surface-hover text-text-base"
            aria-label="Stop"
            title="Stop"
          >
            <Square size={20} fill="currentColor" />
          </button>

          {/* Record */}
          <button
            data-testid="record-button"
            onClick={toggleRecord}
            className={cn(
              'p-2 rounded-full transition-all',
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50 animate-pulse recording active'
                : 'bg-bg-surface-2 hover:bg-bg-surface-hover text-red-400 hover:text-red-300'
            )}
            aria-label={isRecording ? 'Stop Recording' : 'Record'}
            title={isRecording ? 'Stop Recording' : 'Record'}
          >
            <Circle size={20} fill={isRecording ? "red" : "none"} stroke="currentColor" strokeWidth={2} />
          </button>

          {/* Skip Forward */}
          <button
            onClick={skipForward}
            className="text-text-muted hover:text-text-base transition-colors p-1.5 hover:bg-bg-surface-hover rounded"
            aria-label="Skip Forward"
          >
            <SkipForward size={18} />
          </button>

          {/* Loop */}
          <button
            data-testid="loop-button"
            onClick={toggleLoop}
            className={cn(
              'p-1.5 rounded transition-colors',
              isLooping
                ? 'text-primary bg-primary/20 active enabled'
                : 'text-text-muted hover:text-text-base hover:bg-bg-surface-hover'
            )}
            aria-label="Toggle Loop"
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-4">
          {/* Timecode - Green */}
          <div
            data-testid="time-display"
            className="font-mono text-green-400 text-base font-medium min-w-[90px] text-center"
          >
            {formatTime(currentTime)}
          </div>

          {/* Bars.Beats.Ticks */}
          <div className="font-mono text-text-muted text-base font-medium min-w-[90px] text-center">
            {barsBeatsTicksDisplay}
          </div>
        </div>
      </div>
    </div>
  );
};
