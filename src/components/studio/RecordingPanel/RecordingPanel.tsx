import React, { useRef, useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { processAudioFile, revokeAudioURL } from '../../utils/audioFileHandler';
import BackingTrackPlayer from '../AudioPlayer/BackingTrackPlayer';
import './RecordingPanel.css';

/**
 * RecordingPanel Component
 * Left panel containing recording controls and backing track player
 *
 * Features:
 * - Upload backing track (MP3/WAV)
 * - Record button with visual indicator
 * - Stop button
 * - Play corrected audio
 * - Volume meter display
 */
const RecordingPanel: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  // Get state and actions from audio store
  const {
    isRecording,
    backingTrackFile,
    backingTrackName,
    correctedAudioBuffer,
    inputLevel,
    setRecording,
    setBackingTrackFile,
    setBackingTrackBuffer,
    resetRecording,
  } = useAudioStore();

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');

    try {
      // Process the audio file
      const audioInfo = await processAudioFile(file);

      // Store in audio store
      setBackingTrackFile(audioInfo.file, audioInfo.name, audioInfo.duration);
      setBackingTrackBuffer(audioInfo.buffer);

      console.log('Backing track loaded:', audioInfo.name, audioInfo.duration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio file';
      setUploadError(errorMessage);
      console.error('Error processing audio file:', error);
    }

    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle record button
  const handleRecord = () => {
    if (!isRecording) {
      // Start recording
      setRecording(true);
      console.log('Recording started (UI only - Agent 2 will implement actual recording)');
    } else {
      // Pause/resume recording
      console.log('Pause/resume recording');
    }
  };

  // Handle stop button
  const handleStop = () => {
    if (isRecording) {
      setRecording(false);
      console.log('Recording stopped');
    } else {
      // Reset recording if not currently recording
      resetRecording();
      console.log('Recording reset');
    }
  };

  // Handle play corrected audio
  const handlePlayCorrected = () => {
    if (correctedAudioBuffer) {
      console.log('Playing corrected audio (Agent 2 will implement playback)');
    } else {
      console.log('No corrected audio available yet');
    }
  };

  return (
    <div className="recording-panel">
      <h2 className="panel-title">Recording Controls</h2>

      {/* Backing Track Upload */}
      <div className="control-section">
        <h3 className="section-title">Backing Track</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-secondary"
          onClick={handleUploadClick}
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Track
        </button>

        {backingTrackName && (
          <div className="track-info">
            <p className="track-name">{backingTrackName}</p>
          </div>
        )}

        {uploadError && (
          <div className="error-message">{uploadError}</div>
        )}
      </div>

      {/* Backing Track Player */}
      {backingTrackFile && (
        <div className="control-section">
          <BackingTrackPlayer />
        </div>
      )}

      {/* Recording Controls */}
      <div className="control-section">
        <h3 className="section-title">Recording</h3>

        <div className="recording-controls">
          {/* Record Button */}
          <button
            className={`btn btn-record ${isRecording ? 'recording' : ''}`}
            onClick={handleRecord}
            title={isRecording ? 'Pause Recording' : 'Start Recording'}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" />
            </svg>
            {isRecording ? 'Recording...' : 'Record'}
          </button>

          {/* Stop Button */}
          <button
            className="btn btn-stop"
            onClick={handleStop}
            title="Stop Recording"
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            Stop
          </button>
        </div>

        {/* Volume Meter */}
        <div className="volume-meter-container">
          <label className="meter-label">Input Level</label>
          <div className="volume-meter">
            <div
              className="volume-meter-fill"
              style={{ width: `${inputLevel * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Corrected Audio Playback */}
      <div className="control-section">
        <h3 className="section-title">Corrected Audio</h3>
        <button
          className="btn btn-primary"
          onClick={handlePlayCorrected}
          disabled={!correctedAudioBuffer}
          title="Play Auto-tuned Version"
        >
          <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play Corrected
        </button>
        {!correctedAudioBuffer && (
          <p className="hint-text">Record audio to generate corrected version</p>
        )}
      </div>

      {/* Status Indicator */}
      {isRecording && (
        <div className="status-indicator">
          <div className="status-dot" />
          <span>Recording in progress...</span>
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;
