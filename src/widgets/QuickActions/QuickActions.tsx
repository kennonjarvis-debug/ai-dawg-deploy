/**
 * QuickActions Widget
 * Compact action buttons for dashboard
 * Save, Export, Share functionality
 */

'use client';

import { useState } from 'react';
import styles from './QuickActions.module.css';

import { logger } from '$lib/utils/logger';
interface QuickActionsProps {
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  canExport?: boolean;
}

export function QuickActions({
  onSave,
  onExport,
  onShare,
  isSaving = false,
  canExport = true,
}: QuickActionsProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!onSave || isSaving) return;

    try {
      await onSave();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      logger.error('Save failed:', err);
    }
  };

  const handleExport = () => {
    if (!onExport || !canExport) return;
    onExport();
  };

  const handleShare = () => {
    if (!onShare) return;
    onShare();
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleSave}
        className={`${styles.actionButton} ${saveSuccess ? styles.success : ''}`}
        disabled={isSaving}
        title="Save Project"
      >
        {isSaving ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={styles.spinner}
          >
            <circle cx="12" cy="12" r="10" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : saveSuccess ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline points="17 21 17 13 7 13 7 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 3 7 8 15 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className={styles.buttonLabel}>
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
        </span>
      </button>

      <button
        onClick={handleExport}
        className={styles.actionButton}
        disabled={!canExport}
        title="Export to WAV"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.buttonLabel}>Export</span>
      </button>

      <button
        onClick={handleShare}
        className={styles.actionButton}
        disabled={!onShare}
        title="Share Project"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="18" cy="5" r="3" strokeWidth="2" />
          <circle cx="6" cy="12" r="3" strokeWidth="2" />
          <circle cx="18" cy="19" r="3" strokeWidth="2" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="2" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="2" />
        </svg>
        <span className={styles.buttonLabel}>Share</span>
      </button>
    </div>
  );
}
