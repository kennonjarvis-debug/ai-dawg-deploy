'use client';

import { useState, useEffect } from 'react';
import { Mic2, Plus } from 'lucide-react';
import styles from './CompactVoiceProfile.module.css';

interface VoiceProfile {
  id: string;
  name: string;
  duration: number;
}

export function CompactVoiceProfile() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/voice/clone');
      const data = await response.json();

      if (data.success) {
        setProfiles(data.voiceProfiles || []);
        if (data.voiceProfiles?.length > 0) {
          setSelectedId(data.voiceProfiles[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Mic2 size={14} />
        <span>Voice Profiles</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : profiles.length === 0 ? (
        <div className={styles.empty}>
          <span>No profiles</span>
          <button className={styles.addBtn} title="Add profile">
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={styles.select}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.duration.toFixed(1)}s)
              </option>
            ))}
          </select>

          <div className={styles.stats}>
            <span className={styles.count}>{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span>
            <button className={styles.addBtn} title="Add profile">
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
