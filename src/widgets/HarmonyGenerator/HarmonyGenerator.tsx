'use client';

import { useState, useEffect } from 'react';
import { useTrackStore } from '$lib/../core/store';
import styles from './HarmonyGenerator.module.css';

import { logger } from '$lib/utils/logger';
interface VoiceProfile {
  id: string;
  name: string;
  sampleAudioUrl: string;
  duration: number;
  format: string;
  createdAt: string;
}

interface HarmonyGeneratorProps {
  leadVocalUrl?: string;
  leadVocalDuration?: number;
}

const INTERVALS = [
  { value: 'third_above', label: 'Third Above (+3 semitones)' },
  { value: 'third_below', label: 'Third Below (-3 semitones)' },
  { value: 'fifth_above', label: 'Fifth Above (+7 semitones)' },
  { value: 'fifth_below', label: 'Fifth Below (-7 semitones)' },
  { value: 'octave_above', label: 'Octave Above (+12 semitones)' },
  { value: 'octave_below', label: 'Octave Below (-12 semitones)' },
];

export function HarmonyGenerator({ leadVocalUrl, leadVocalDuration = 10 }: HarmonyGeneratorProps) {
  const addTrack = useTrackStore((state) => state.addTrack);

  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedIntervals, setSelectedIntervals] = useState<string[]>(['third_above']);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<number>(0);
  const [progress, setProgress] = useState(0);

  // Load voice profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  // Update cost estimate when intervals change
  useEffect(() => {
    if (selectedIntervals.length > 0) {
      fetchCostEstimate();
    }
  }, [selectedIntervals, leadVocalDuration]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/voice/clone');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load voice profiles');
      }

      setVoiceProfiles(data.voiceProfiles || []);
      if (data.voiceProfiles?.length > 0) {
        setSelectedProfileId(data.voiceProfiles[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCostEstimate = async () => {
    try {
      const intervalsParam = selectedIntervals.join(',');
      const response = await fetch(
        `/api/voice/harmony?duration=${leadVocalDuration}&intervals=${intervalsParam}`
      );
      const data = await response.json();

      if (data.success) {
        setCostEstimate(data.estimatedCost);
      }
    } catch (err) {
      logger.error('Failed to fetch cost estimate:', err);
    }
  };

  const toggleInterval = (interval: string) => {
    setSelectedIntervals((prev) => {
      if (prev.includes(interval)) {
        return prev.filter((i) => i !== interval);
      } else {
        return [...prev, interval];
      }
    });
  };

  const generateHarmonies = async () => {
    if (!leadVocalUrl) {
      setError('No lead vocal provided. Please record or upload a vocal track first.');
      return;
    }

    if (!selectedProfileId) {
      setError('Please select a voice profile');
      return;
    }

    if (selectedIntervals.length === 0) {
      setError('Please select at least one harmony interval');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/voice/harmony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadVocalUrl,
          voiceProfileId: selectedProfileId,
          intervals: selectedIntervals,
          language: 'en',
        }),
      });

      // Simulate progress (actual API doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 3000);

      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (!data.success) {
        throw new Error(data.error || 'Harmony generation failed');
      }

      // Import harmonies as new tracks
      for (const harmony of data.harmonies) {
        const response = await fetch(harmony.audioUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        addTrack({
          name: `Harmony - ${harmony.interval.replace('_', ' ')}`,
          type: 'audio',
          recordingUrl: url,
        });
      }

      setProgress(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading voice profiles...</div>
      </div>
    );
  }

  if (voiceProfiles.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3>No Voice Profiles</h3>
          <p>Create a voice profile first to generate harmonies</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Harmony Generator</h2>
      </div>

      {/* Voice Profile Selection */}
      <div className={styles.section}>
        <h3>Voice Profile</h3>
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          className={styles.select}
          disabled={isGenerating}
        >
          {voiceProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name} ({profile.duration.toFixed(1)}s)
            </option>
          ))}
        </select>
      </div>

      {/* Interval Selection */}
      <div className={styles.section}>
        <h3>Harmony Intervals</h3>
        <div className={styles.intervals}>
          {INTERVALS.map((interval) => (
            <label key={interval.value} className={styles.intervalOption}>
              <input
                type="checkbox"
                checked={selectedIntervals.includes(interval.value)}
                onChange={() => toggleInterval(interval.value)}
                disabled={isGenerating}
                className={styles.checkbox}
              />
              <span>{interval.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cost Estimate */}
      {selectedIntervals.length > 0 && (
        <div className={styles.costEstimate}>
          <span className={styles.costLabel}>Estimated Cost:</span>
          <span className={styles.costValue}>${costEstimate.toFixed(2)}</span>
          <span className={styles.costDetails}>
            ({selectedIntervals.length} harmony{selectedIntervals.length !== 1 ? 'ies' : 'y'})
          </span>
        </div>
      )}

      {/* Lead Vocal Info */}
      {leadVocalUrl && (
        <div className={styles.leadInfo}>
          <h4>Lead Vocal:</h4>
          <audio src={leadVocalUrl} controls className={styles.audioPlayer} />
          <span className={styles.duration}>{leadVocalDuration.toFixed(1)}s</span>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Progress */}
      {isGenerating && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p>Generating harmonies... {progress}%</p>
          <p className={styles.progressNote}>
            This may take 1-2 minutes per harmony
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        className={styles.generateButton}
        onClick={generateHarmonies}
        disabled={isGenerating || !leadVocalUrl || selectedIntervals.length === 0}
      >
        {isGenerating ? 'Generating...' : 'Generate Harmonies'}
      </button>
    </div>
  );
}
