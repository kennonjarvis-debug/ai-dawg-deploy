/**
 * UserSettingsModal Widget
 * Modal for user account settings and preferences
 * Profile info, audio devices, UI preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './UserSettingsModal.module.css';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'audio' | 'preferences'>('profile');

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Audio devices
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [defaultInput, setDefaultInput] = useState('');
  const [defaultOutput, setDefaultOutput] = useState('');

  // Preferences
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user data
  useEffect(() => {
    if (!isOpen || !session) return;

    setName(session.user?.name || '');
    setEmail(session.user?.email || '');

    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setAutoSaveEnabled(prefs.autoSaveEnabled ?? true);
      setAutoSaveInterval(prefs.autoSaveInterval ?? 30);
      setTheme(prefs.theme ?? 'dark');
      setDefaultInput(prefs.defaultInput ?? '');
      setDefaultOutput(prefs.defaultOutput ?? '');
    }
  }, [isOpen, session]);

  // Enumerate audio devices
  useEffect(() => {
    if (!isOpen || activeTab !== 'audio') return;

    const getDevices = async () => {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true });

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
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
        setError('Failed to access audio devices. Please grant microphone permission.');
      }
    };

    getDevices();
  }, [isOpen, activeTab]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Save profile changes
      if (activeTab === 'profile') {
        if (!name.trim()) {
          setError('Name is required');
          return;
        }

        // Update session (if using NextAuth update)
        if (update) {
          await update({ name: name.trim() });
        }
      }

      // Save preferences to localStorage
      const preferences = {
        autoSaveEnabled,
        autoSaveInterval,
        theme,
        defaultInput,
        defaultOutput,
      };

      localStorage.setItem('userPreferences', JSON.stringify(preferences));

      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('userPreferencesChanged', { detail: preferences }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
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
          <h2 className={styles.title}>Settings</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? styles.tabActive : styles.tab}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={activeTab === 'audio' ? styles.tabActive : styles.tab}
          >
            Audio Devices
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={activeTab === 'preferences' ? styles.tabActive : styles.tab}
          >
            Preferences
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>Settings saved successfully!</div>}

          {activeTab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label htmlFor="userName">Name</label>
                <input
                  id="userName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="userEmail">Email</label>
                <input
                  id="userEmail"
                  type="email"
                  value={email}
                  disabled
                  className={styles.inputDisabled}
                />
                <span className={styles.hint}>Email cannot be changed</span>
              </div>

              {session?.user?.image && (
                <div className={styles.field}>
                  <label>Profile Picture</label>
                  <img src={session.user.image} alt="Profile" className={styles.avatar} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label htmlFor="defaultInput">Default Input Device</label>
                <select
                  id="defaultInput"
                  value={defaultInput}
                  onChange={(e) => setDefaultInput(e.target.value)}
                  className={styles.select}
                >
                  <option value="">System Default</option>
                  {inputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <span className={styles.hint}>Used when recording new tracks</span>
              </div>

              <div className={styles.field}>
                <label htmlFor="defaultOutput">Default Output Device</label>
                <select
                  id="defaultOutput"
                  value={defaultOutput}
                  onChange={(e) => setDefaultOutput(e.target.value)}
                  className={styles.select}
                >
                  <option value="">System Default</option>
                  {outputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <span className={styles.hint}>Used for playback and monitoring</span>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Enable auto-save
                </label>
                <span className={styles.hint}>Automatically save project changes</span>
              </div>

              {autoSaveEnabled && (
                <div className={styles.field}>
                  <label htmlFor="autoSaveInterval">Auto-save interval (seconds)</label>
                  <input
                    id="autoSaveInterval"
                    type="number"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(parseInt(e.target.value) || 30)}
                    min={10}
                    max={300}
                    className={styles.input}
                  />
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                  className={styles.select}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light (Coming Soon)</option>
                </select>
                <span className={styles.hint}>Light theme coming in future update</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className={styles.keyboardHints}>
          Press <kbd>Esc</kbd> to cancel, <kbd>⌘ Enter</kbd> to save
        </div>
      </div>
    </div>
  );
}
