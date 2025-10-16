import { useEffect, useState } from 'react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  startTime: number | null;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

export function RecordingIndicator({
  isRecording,
  startTime,
  sampleRate = 48000,
  channels = 2,
  bitDepth = 16
}: RecordingIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRecording || !startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatFileSize = (seconds: number): string => {
    // Calculate uncompressed file size
    // size = sample_rate * channels * bit_depth/8 * duration
    const bytes = sampleRate * channels * (bitDepth / 8) * seconds;
    const mb = bytes / (1024 * 1024);

    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
  };

  const getQualityLabel = (): string => {
    return `${sampleRate / 1000}kHz / ${bitDepth}-bit / ${channels === 1 ? 'Mono' : 'Stereo'}`;
  };

  return (
    <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
      <div className="rec-status">
        <div className="rec-dot"></div>
        <span className="rec-label">{isRecording ? 'RECORDING' : 'READY'}</span>
      </div>

      {isRecording && (
        <div className="rec-details">
          <div className="rec-time-display">
            <span className="rec-time">{formatTime(elapsedTime)}</span>
          </div>

          <div className="rec-info">
            <div className="rec-size">
              <span className="label">Size:</span>
              <span className="value">{formatFileSize(elapsedTime)}</span>
            </div>
            <div className="rec-quality">
              <span className="label">Quality:</span>
              <span className="value">{getQualityLabel()}</span>
            </div>
          </div>
        </div>
      )}

      {!isRecording && startTime && elapsedTime > 0 && (
        <div className="rec-summary">
          <span>Last recording: {formatTime(elapsedTime)} ({formatFileSize(elapsedTime)})</span>
        </div>
      )}
    </div>
  );
}
