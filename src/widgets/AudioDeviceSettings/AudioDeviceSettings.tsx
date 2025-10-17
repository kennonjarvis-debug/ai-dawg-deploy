/**
 * AudioDeviceSettings Widget
 * Project-level default audio device configuration
 * Sets default input/output devices for new tracks
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './AudioDeviceSettings.module.css';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface AudioDeviceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AudioDevicePreferences) => void;
  defaultInput?: string;
  defaultOutput?: string;
}

export interface AudioDevicePreferences {
  defaultInputDeviceId: string;
  defaultOutputDeviceId: string;
  sampleRate: number;
  bufferSize: number;
}

const SAMPLE_RATES = [44100, 48000, 88200, 96000];
const BUFFER_SIZES = [128, 256, 512, 1024, 2048, 4096];

export function AudioDeviceSettings({
  isOpen,
  onClose,
  onSave,
  defaultInput = '',
  defaultOutput = '',
}: AudioDeviceSettingsProps) {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState(defaultInput);
  const [selectedOutput, setSelectedOutput] = useState(defaultOutput);
  const [sampleRate, setSampleRate] = useState(48000);
  const [bufferSize, setBufferSize] = useState(512);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Enumerate audio devices
  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        // Request permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionGranted(true);

        const devices = await navigator.mediaDevices.enumerateDevices();

        const inputs = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
            kind: 'audioinput' as const,
          }));

        const outputs = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
            kind: 'audiooutput' as const,
          }));

        setInputDevices(inputs);
        setOutputDevices(outputs);
        setError(null);
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
        setError('Failed to access audio devices. Please grant microphone permission.');
        setPermissionGranted(false);
      }
    };

    getDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      getDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [isOpen]);

  // Load preferences from localStorage
  useEffect(() => {
    if (!isOpen) return;

    const savedPrefs = localStorage.getItem('audioDevicePreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setSelectedInput(prefs.defaultInputDeviceId || defaultInput);
      setSelectedOutput(prefs.defaultOutputDeviceId || defaultOutput);
      setSampleRate(prefs.sampleRate || 48000);
      setBufferSize(prefs.bufferSize || 512);
    } else {
      setSelectedInput(defaultInput);
      setSelectedOutput(defaultOutput);
    }
  }, [isOpen, defaultInput, defaultOutput]);

  const handleSave = () => {
    try {
      setSaving(true);
      setError(null);

      const preferences: AudioDevicePreferences = {
        defaultInputDeviceId: selectedInput,
        defaultOutputDeviceId: selectedOutput,
        sampleRate,
        bufferSize,
      };

      // Save to localStorage
      localStorage.setItem('audioDevicePreferences', JSON.stringify(preferences));

      // Notify parent
      onSave(preferences);

      // Dispatch event for other components
      window.dispatchEvent(
        new CustomEvent('audioDevicePreferencesChanged', { detail: preferences })
      );

      onClose();
    } catch (err: any) {
      console.error('Failed to save audio device settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getLatencyEstimate = () => {
    // Rough latency calculation: bufferSize / sampleRate * 1000 (ms)
    const latency = (bufferSize / sampleRate) * 1000;
    return latency.toFixed(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className={styles.header}>
          <h2 className={styles.title}>Audio Device Settings</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {!permissionGranted && (
            <div className={styles.warning}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Microphone permission required to detect audio devices</span>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default Devices</h3>
            <p className={styles.sectionHint}>
              These devices will be used by default when creating new tracks
            </p>

            <div className={styles.field}>
              <label htmlFor="inputDevice">Input Device (Microphone)</label>
              <select
                id="inputDevice"
                value={selectedInput}
                onChange={(e) => setSelectedInput(e.target.value)}
                className={styles.select}
                disabled={!permissionGranted}
              >
                <option value="">System Default</option>
                {inputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="outputDevice">Output Device (Speakers/Headphones)</label>
              <select
                id="outputDevice"
                value={selectedOutput}
                onChange={(e) => setSelectedOutput(e.target.value)}
                className={styles.select}
                disabled={!permissionGranted}
              >
                <option value="">System Default</option>
                {outputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Audio Quality</h3>
            <p className={styles.sectionHint}>
              Higher sample rates = better quality. Lower buffer sizes = lower latency.
            </p>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="sampleRate">Sample Rate (Hz)</label>
                <select
                  id="sampleRate"
                  value={sampleRate}
                  onChange={(e) => setSampleRate(parseInt(e.target.value))}
                  className={styles.select}
                >
                  {SAMPLE_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate >= 1000 ? `${rate / 1000}kHz` : `${rate}Hz`}
                      {rate === 44100 && ' (CD Quality)'}
                      {rate === 48000 && ' (Recommended)'}
                      {rate === 96000 && ' (High Quality)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="bufferSize">Buffer Size (samples)</label>
                <select
                  id="bufferSize"
                  value={bufferSize}
                  onChange={(e) => setBufferSize(parseInt(e.target.value))}
                  className={styles.select}
                >
                  {BUFFER_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                      {size === 128 && ' (Lowest Latency)'}
                      {size === 512 && ' (Recommended)'}
                      {size === 2048 && ' (High CPU Usage)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.latencyInfo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>
                Estimated latency: <strong>{getLatencyEstimate()}ms</strong>
                {parseFloat(getLatencyEstimate()) < 20 && ' (Excellent for recording)'}
                {parseFloat(getLatencyEstimate()) >= 20 &&
                  parseFloat(getLatencyEstimate()) < 40 &&
                  ' (Good for recording)'}
                {parseFloat(getLatencyEstimate()) >= 40 && ' (May feel delayed - reduce buffer size)'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className={styles.keyboardHints}>
          Press <kbd>Esc</kbd> to cancel, <kbd>⌘ Enter</kbd> to save
        </div>
      </div>
    </div>
  );
}
