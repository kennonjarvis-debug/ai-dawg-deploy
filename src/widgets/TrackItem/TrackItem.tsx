'use client';

import { FC, useState } from 'react';
import { Volume2, Circle, Trash2, Copy, Download, Sliders, Activity, Mic } from 'lucide-react';
import { Track } from '$lib/../core/types';
import { useTrackStore } from '$lib/../core/store';
import { usePlayback } from '$lib/../core/usePlayback';
import { exportRecording } from '@/src/utils/exportAudio';
import { DeviceSelector } from './DeviceSelector';
import { EffectsPanel } from '@/src/widgets/EffectsPanel/EffectsPanel';
import { PitchMonitor } from '@/src/widgets/PitchMonitor/PitchMonitor';
import { VocalEffectsPanel } from '@/src/widgets/VocalEffectsPanel/VocalEffectsPanel';
import styles from './TrackItem.module.css';

import { logger } from '$lib/utils/logger';
interface TrackItemProps {
  track: Track;
  isActive: boolean;
  onSelect: () => void;
}

/**
 * TrackItem Component
 * Displays a single track with controls (solo/mute/record, volume)
 */
export const TrackItem: FC<TrackItemProps> = ({ track, isActive, onSelect }) => {
  const {
    toggleSolo,
    toggleMute,
    toggleRecordArm,
    setVolume,
    updateTrack,
    removeTrack,
    duplicateTrack,
    setInputDevice,
    setOutputDevice,
  } = useTrackStore();

  const { audioContext, initializeAudioContext } = usePlayback();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(track.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showPitchMonitor, setShowPitchMonitor] = useState(false);
  const [showVocalEffects, setShowVocalEffects] = useState(false);

  const handleNameSubmit = () => {
    if (nameValue.trim()) {
      updateTrack(track.id, { name: nameValue.trim() });
    } else {
      setNameValue(track.name);
    }
    setIsEditingName(false);
  };

  const handleColorChange = (color: string) => {
    updateTrack(track.id, { color });
    setShowColorPicker(false);
  };

  const trackColors = [
    '#ff5555', '#ff6b6b', '#ff8080',
    '#ff9955', '#ffaa55', '#ffcc55',
    '#55ff55', '#55ff88', '#55ffaa',
    '#55aaff', '#5588ff', '#5555ff',
    '#aa55ff', '#ff55ff', '#ff55aa',
    '#888888', '#aaaaaa', '#cccccc',
  ];

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(track.id, parseInt(e.target.value));
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (track.recordings.length === 0) {
      alert('No recordings to export');
      return;
    }

    const activeRecording = track.recordings.find(
      (r) => r.id === track.activeRecordingId
    ) || track.recordings[0];

    if (!activeRecording || !activeRecording.blob) {
      alert('No valid recording to export');
      return;
    }

    try {
      await exportRecording(activeRecording.blob, {
        format: 'wav',
        filename: `${track.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.wav`,
      });
    } catch (error) {
      logger.error('Export failed:', error);
      alert('Failed to export recording');
    }
  };

  return (
    <div
      className={`${styles.trackItem} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
    >
      {/* Track Color Indicator */}
      <div className={styles.colorIndicatorWrapper}>
        <div
          className={styles.colorIndicator}
          style={{ background: track.color }}
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          title="Change color"
        />

        {/* Color Picker Popup */}
        {showColorPicker && (
          <div className={styles.colorPicker} onClick={(e) => e.stopPropagation()}>
            <div className={styles.colorPickerGrid}>
              {trackColors.map((color) => (
                <button
                  key={color}
                  className={styles.colorOption}
                  style={{ background: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Track Content */}
      <div className={styles.trackContent}>
        {/* Top Row: Name and Controls */}
        <div className={styles.topRow}>
          {/* Track Name */}
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setNameValue(track.name);
                  setIsEditingName(false);
                }
              }}
              className={styles.nameInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={styles.trackName}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              {track.name}
            </div>
          )}

          {/* Control Buttons */}
          <div className={styles.controls}>
            <button
              className={`btn btn-icon btn-icon-sm ${
                track.solo ? styles.soloed : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSolo(track.id);
              }}
              title="Solo"
            >
              S
            </button>

            <button
              className={`btn btn-icon btn-icon-sm ${
                track.mute ? styles.muted : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMute(track.id);
              }}
              title="Mute"
            >
              M
            </button>

            <button
              className={`btn btn-icon btn-icon-sm ${
                track.recordArm ? styles.recording : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleRecordArm(track.id);
              }}
              title="Record Arm"
            >
              <Circle style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Volume and Actions */}
        <div className={styles.bottomRow}>
          {/* Volume Control */}
          <div className={styles.volumeControl}>
            <Volume2 style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            <input
              type="range"
              min="0"
              max="100"
              value={track.volume}
              onChange={handleVolumeChange}
              onClick={(e) => e.stopPropagation()}
              className="slider"
              style={{ flex: 1, minWidth: 0 }}
            />
            <span className={styles.volumeValue}>{track.volume}</span>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={`btn btn-icon btn-icon-sm ${showPitchMonitor ? styles.pitchActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowPitchMonitor(!showPitchMonitor);
              }}
              title="Pitch Monitor"
            >
              <Activity style={{ width: '12px', height: '12px' }} />
            </button>

            <button
              className={`btn btn-icon btn-icon-sm ${showVocalEffects ? styles.vocalActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowVocalEffects(!showVocalEffects);
              }}
              title="Vocal Effects"
            >
              <Mic style={{ width: '12px', height: '12px' }} />
            </button>

            <button
              className={`btn btn-icon btn-icon-sm ${showEffects ? styles.effectsActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowEffects(!showEffects);
              }}
              title="Effects"
            >
              <Sliders style={{ width: '12px', height: '12px' }} />
            </button>

            {track.recordings.length > 0 && (
              <button
                className="btn btn-icon btn-icon-sm"
                onClick={handleExport}
                title="Export as WAV"
              >
                <Download style={{ width: '12px', height: '12px' }} />
              </button>
            )}

            <button
              className="btn btn-icon btn-icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                duplicateTrack(track.id);
              }}
              title="Duplicate"
            >
              <Copy style={{ width: '12px', height: '12px' }} />
            </button>

            <button
              className="btn btn-icon btn-icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete track "${track.name}"?`)) {
                  removeTrack(track.id);
                }
              }}
              title="Delete"
            >
              <Trash2 style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        </div>

        {/* Recording Count */}
        {track.recordings.length > 0 && (
          <div className={styles.recordingCount}>
            {track.recordings.length} recording{track.recordings.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Device Selectors */}
        <div className={styles.deviceRow}>
          <DeviceSelector
            type="input"
            selectedDeviceId={track.inputDeviceId}
            onDeviceChange={(deviceId) => setInputDevice(track.id, deviceId)}
          />
          <DeviceSelector
            type="output"
            selectedDeviceId={track.outputDeviceId}
            onDeviceChange={(deviceId) => setOutputDevice(track.id, deviceId)}
          />
        </div>

        {/* Pitch Monitor */}
        {showPitchMonitor && (
          <PitchMonitor
            trackId={track.id}
            audioContext={audioContext || initializeAudioContext()}
            mediaStream={null}
            isRecording={track.recordArm}
          />
        )}

        {/* Vocal Effects Panel */}
        {showVocalEffects && (
          <VocalEffectsPanel
            trackId={track.id}
            audioContext={audioContext || initializeAudioContext()}
          />
        )}

        {/* Effects Panel */}
        {showEffects && (
          <EffectsPanel
            trackId={track.id}
            audioContext={audioContext || initializeAudioContext()}
          />
        )}
      </div>
    </div>
  );
};
