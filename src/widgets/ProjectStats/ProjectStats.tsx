/**
 * ProjectStats Widget
 * Compact project overview for dashboard
 * Shows track count, total duration, BPM, last saved
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './ProjectStats.module.css';

interface ProjectStatsProps {
  trackCount: number;
  totalDuration: number; // in seconds
  bpm: number;
  lastSaved?: Date;
  projectName?: string;
}

export function ProjectStats({
  trackCount,
  totalDuration,
  bpm,
  lastSaved,
  projectName = 'Untitled Project',
}: ProjectStatsProps) {
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago every 10 seconds
  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

      if (diff < 10) {
        setTimeAgo('just now');
      } else if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{projectName}</h3>
        {lastSaved && (
          <span className={styles.savedTime}>
            Saved {timeAgo}
          </span>
        )}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" strokeWidth="2" />
            <circle cx="18" cy="16" r="3" strokeWidth="2" />
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{trackCount}</span>
            <span className={styles.statLabel}>Track{trackCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className={styles.stat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatDuration(totalDuration)}</span>
            <span className={styles.statLabel}>Duration</span>
          </div>
        </div>

        <div className={styles.stat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" strokeWidth="2" />
            <circle cx="18" cy="16" r="3" strokeWidth="2" />
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{bpm}</span>
            <span className={styles.statLabel}>BPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
