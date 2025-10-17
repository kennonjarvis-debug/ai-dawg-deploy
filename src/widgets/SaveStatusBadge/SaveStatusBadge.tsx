/**
 * SaveStatusBadge Widget
 * Small badge showing auto-save status
 * Displays: Saved, Saving, Unsaved changes, Error
 */

'use client';

import { useState, useEffect } from 'react';
import styles from './SaveStatusBadge.module.css';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

interface SaveStatusBadgeProps {
  status?: SaveStatus;
  lastSaved?: Date;
  error?: string;
  onManualSave?: () => void;
}

export function SaveStatusBadge({
  status = 'idle',
  lastSaved,
  error,
  onManualSave,
}: SaveStatusBadgeProps) {
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

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={styles.spinner}
          >
            <circle cx="12" cy="12" r="10" strokeWidth="3" opacity="0.25" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'saved':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'error':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'unsaved':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${timeAgo}` : 'Saved';
      case 'error':
        return 'Error saving';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'saving':
        return styles.badgeSaving;
      case 'saved':
        return styles.badgeSaved;
      case 'error':
        return styles.badgeError;
      case 'unsaved':
        return styles.badgeUnsaved;
      default:
        return styles.badgeIdle;
    }
  };

  if (status === 'idle') return null;

  return (
    <div className={`${styles.badge} ${getStatusClass()}`} title={error || undefined}>
      <div className={styles.content}>
        {getStatusIcon()}
        <span className={styles.text}>{getStatusText()}</span>
      </div>

      {status === 'error' && onManualSave && (
        <button
          onClick={onManualSave}
          className={styles.retryButton}
          aria-label="Retry save"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M1 4v6h6M23 20v-6h-6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {status === 'unsaved' && onManualSave && (
        <button
          onClick={onManualSave}
          className={styles.saveNowButton}
          aria-label="Save now"
        >
          Save
        </button>
      )}
    </div>
  );
}
