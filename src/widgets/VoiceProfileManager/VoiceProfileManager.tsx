'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Upload, Mic, Check, X } from 'lucide-react';
import styles from './VoiceProfileManager.module.css';

interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  sampleAudioUrl: string;
  s3Key: string;
  duration: number;
  format: string;
  sampleRate: number;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export function VoiceProfileManager() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create new profile state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/voice/clone');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load voice profiles');
      }

      setProfiles(data.voiceProfiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setValidationError(null);
    } catch (err: any) {
      setValidationError('Failed to access microphone: ' + err.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Validate audio duration
  const validateAudio = async (file: Blob): Promise<{ valid: boolean; duration: number; error?: string }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);

        if (duration < 6) {
          resolve({ valid: false, duration, error: 'Audio must be at least 6 seconds long' });
        } else if (duration > 30) {
          resolve({ valid: false, duration, error: 'Audio must be no longer than 30 seconds' });
        } else {
          resolve({ valid: true, duration });
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        resolve({ valid: false, duration: 0, error: 'Failed to load audio file' });
      };
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setValidationError('Please select an audio file');
      return;
    }

    // Validate duration
    const validation = await validateAudio(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid audio file');
      return;
    }

    setAudioFile(file);
    setRecordedBlob(null);
    setValidationError(null);
  };

  // Upload to S3
  const uploadToS3 = async (file: Blob, fileName: string): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file, fileName);

    const response = await fetch('/api/audio/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload audio');
    }

    return { url: data.url, key: data.key };
  };

  // Create voice profile
  const createProfile = async () => {
    if (!profileName.trim()) {
      setValidationError('Please enter a profile name');
      return;
    }

    const audioSource = recordedBlob || audioFile;
    if (!audioSource) {
      setValidationError('Please record or upload an audio sample');
      return;
    }

    setIsCreating(true);
    setValidationError(null);

    try {
      // Validate duration
      const validation = await validateAudio(audioSource);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid audio');
        setIsCreating(false);
        return;
      }

      // Upload to S3
      const fileName = `voice-profile-${Date.now()}.${recordedBlob ? 'webm' : 'wav'}`;
      const { url, key } = await uploadToS3(audioSource, fileName);

      // Create profile
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          sampleAudioUrl: url,
          s3Key: key,
          duration: validation.duration,
          format: recordedBlob ? 'webm' : 'wav',
          fileSize: audioSource.size,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create voice profile');
      }

      // Reset form and reload profiles
      setShowCreateForm(false);
      setProfileName('');
      setAudioFile(null);
      setRecordedBlob(null);
      loadProfiles();
    } catch (err: any) {
      setValidationError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete voice profile
  const deleteProfile = async (profileId: string, profileName: string) => {
    if (!confirm(`Delete voice profile "${profileName}"?`)) {
      return;
    }

    try {
      const response = await fetch('/api/voice/clone', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceProfileId: profileId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete profile');
      }

      loadProfiles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Voice Profiles</h2>
        <button
          className={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ New Profile'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className={styles.createForm}>
          <h3>Create Voice Profile</h3>

          <div className={styles.field}>
            <label>Profile Name:</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g., My Voice"
              className={styles.input}
            />
          </div>

          <div className={styles.audioInput}>
            <h4>Audio Sample (6-30 seconds):</h4>

            <div className={styles.inputOptions}>
              {/* Record Option */}
              <button
                className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isCreating}
              >
                <Mic size={16} />
                {isRecording ? 'Stop Recording' : 'Record'}
              </button>

              {/* Upload Option */}
              <button
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
              >
                <Upload size={16} />
                Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Show selected audio */}
            {(recordedBlob || audioFile) && (
              <div className={styles.audioPreview}>
                <audio
                  src={recordedBlob ? URL.createObjectURL(recordedBlob) : URL.createObjectURL(audioFile!)}
                  controls
                  className={styles.audioPlayer}
                />
                <button
                  className={styles.removeButton}
                  onClick={() => {
                    setRecordedBlob(null);
                    setAudioFile(null);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {validationError && (
            <div className={styles.error}>{validationError}</div>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.submitButton}
              onClick={createProfile}
              disabled={isCreating || !profileName.trim() || (!recordedBlob && !audioFile)}
            >
              {isCreating ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Loading */}
      {isLoading && <div className={styles.loading}>Loading profiles...</div>}

      {/* Profiles List */}
      {!isLoading && profiles.length === 0 && (
        <div className={styles.empty}>
          No voice profiles yet. Create one to generate harmonies!
        </div>
      )}

      {!isLoading && profiles.length > 0 && (
        <div className={styles.profilesList}>
          {profiles.map((profile) => (
            <div key={profile.id} className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <h3>{profile.name}</h3>
                <div className={styles.profileMeta}>
                  <span>{profile.duration.toFixed(1)}s</span>
                  <span>{profile.format.toUpperCase()}</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={styles.profileActions}>
                <audio
                  src={profile.sampleAudioUrl}
                  controls
                  className={styles.profileAudio}
                />
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteProfile(profile.id, profile.name)}
                  title="Delete profile"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
