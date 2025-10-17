'use client';

import { FC, useEffect, useCallback, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Plus,
  Minus,
  Maximize2,
  Circle,
  Square
} from 'lucide-react';
import { useTransport } from '@/src/core/transport';
import { Waveform } from '@/src/visualizers';
import styles from './TransportControls.module.css';

interface TransportControlsProps {
  className?: string;
  onAddTrack?: () => void;
  onUpload?: () => void;
  audioContext?: AudioContext | null;
  mediaStream?: MediaStream | null;
}

/**
 * Transport Controls Widget
 * Minimal dark design matching modern DAW aesthetic
 */
export const TransportControls: FC<TransportControlsProps> = ({
  className,
  onAddTrack,
  onUpload,
  audioContext,
  mediaStream,
}) => {
  const { isPlaying, isRecording, play, pause, stop, record, stopRecording, position, bpm } = useTransport();
  const [volume, setVolume] = useState(75);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Keyboard shortcuts
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
      }
    },
    [isPlaying, play, pause]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      record();
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  const handleVolumeDecrease = () => {
    setVolume(Math.max(0, volume - 10));
  };

  const handleVolumeIncrease = () => {
    setVolume(Math.min(100, volume + 10));
  };

  // Format time as MM:SS.mmm
  const formatTime = (pos: string) => {
    // Convert bars:beats:sixteenths to time
    // For demo, just show position
    return pos || '00:00.000';
  };

  // Format position as bars.beats.sixteenths
  const formatPosition = (pos: string) => {
    if (!pos) return '001.1.1';
    const parts = pos.split(':');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const bars = (parseInt(parts[0]) + 1).toString().padStart(3, '0');
      const beats = (parseInt(parts[1]) + 1).toString();
      const sixteenths = (parseInt(parts[2]) + 1).toString();
      return `${bars}.${beats}.${sixteenths}`;
    }
    return '001.1.1';
  };

  return (
    <div className={`${styles.transportBar} ${className || ''}`}>
      {/* Left Section: Track Actions */}
      <div className={styles.leftSection}>
        <button className={`btn btn-text ${styles.actionBtn}`} onClick={onAddTrack}>
          <Plus className={styles.icon} />
          <span>Add Track</span>
        </button>

        <button className={`btn btn-text ${styles.actionBtn}`} onClick={onUpload}>
          <span>Upload</span>
        </button>
      </div>

      <div className="separator" style={{ height: '32px' }} />

      {/* Center Section: Transport Controls */}
      <div className={styles.centerSection}>
        {/* BPM Display */}
        <div className="bpm-display">
          {bpm} BPM
        </div>

        <div className="separator" style={{ height: '32px' }} />

        {/* Waveform Indicator */}
        <div className={styles.waveformContainer}>
          {mediaStream && audioContext ? (
            <Waveform
              audioContext={audioContext}
              mediaStream={mediaStream}
              width={120}
              height={40}
              style="mirror"
              scrolling={false}
              lineWidth={1.5}
            />
          ) : (
            <div className={styles.waveformPlaceholder}>
              <span className={styles.waveformText}>No Input</span>
            </div>
          )}
        </div>

        <div className="separator" style={{ height: '32px' }} />

        {/* Transport Buttons */}
        <div className={styles.transportButtons}>
          <button className="btn btn-icon" onClick={() => {}}>
            <SkipBack className={styles.icon} />
          </button>

          <button className="btn btn-icon btn-icon-lg" onClick={handlePlayPause}>
            {isPlaying ? (
              <Pause className={styles.icon} />
            ) : (
              <Play className={styles.icon} style={{ marginLeft: '2px' }} />
            )}
          </button>

          <button className="btn btn-icon" onClick={handleStop}>
            <Square className={styles.icon} />
          </button>

          <button
            className={`btn btn-icon ${isRecording ? styles.recording : ''}`}
            onClick={handleRecord}
          >
            <Circle className={styles.icon} fill={isRecording ? 'currentColor' : 'none'} />
          </button>

          <button className="btn btn-icon" onClick={() => {}}>
            <SkipForward className={styles.icon} />
          </button>

          <button
            className={`btn btn-icon ${isLooping ? styles.active : ''}`}
            onClick={() => setIsLooping(!isLooping)}
          >
            <Repeat className={styles.icon} />
          </button>

          <button
            className={`btn btn-icon ${isShuffling ? styles.active : ''}`}
            onClick={() => setIsShuffling(!isShuffling)}
          >
            <Shuffle className={styles.icon} />
          </button>
        </div>

        <div className="separator" style={{ height: '32px' }} />

        {/* Time Displays */}
        <div className={styles.timeDisplays}>
          <div className="time-display">{formatTime(position)}</div>
          <div className="time-display">{formatPosition(position)}</div>
        </div>
      </div>

      {/* Right Section: Volume Control */}
      <div className={styles.rightSection}>
        <div className="volume-control">
          <button className="btn btn-icon btn-icon-sm">
            <Volume2 className={styles.iconSm} />
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="slider"
            style={{ width: '80px' }}
          />

          <button className="btn btn-icon btn-icon-sm" onClick={handleVolumeDecrease}>
            <Minus className={styles.iconSm} />
          </button>

          <button className="btn btn-icon btn-icon-sm" onClick={handleVolumeIncrease}>
            <Plus className={styles.iconSm} />
          </button>
        </div>

        <div className="separator" style={{ height: '32px', marginLeft: '8px' }} />

        <button className="btn btn-icon" style={{ marginLeft: '8px' }}>
          <Maximize2 className={styles.icon} />
        </button>
      </div>
    </div>
  );
};
