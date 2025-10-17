/**
 * DashboardHeader Component
 * Ready-to-use header combining Instance 4 widgets
 * AuthHeader + ProjectSelector + SaveStatusBadge
 */

'use client';

import { AuthHeader } from '@/src/widgets/AuthHeader/AuthHeader';
import { ProjectSelector } from '@/src/widgets/ProjectSelector/ProjectSelector';
import { SaveStatusBadge } from '@/src/widgets/SaveStatusBadge/SaveStatusBadge';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  currentProjectId?: string;
  currentProjectName?: string;
  onProjectChange?: (projectId: string) => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';
  lastSaved?: Date;
  saveError?: string;
  onManualSave?: () => void;
  onSettingsClick?: () => void;
}

export function DashboardHeader({
  currentProjectId,
  currentProjectName,
  onProjectChange,
  saveStatus = 'idle',
  lastSaved,
  saveError,
  onManualSave,
  onSettingsClick,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" strokeWidth="2" />
            <circle cx="18" cy="16" r="3" strokeWidth="2" />
          </svg>
          <span className={styles.logoText}>DAWG AI</span>
        </div>

        <ProjectSelector
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
          onProjectChange={onProjectChange || (() => {})}
          onNewProject={() => {}}
        />
      </div>

      <div className={styles.center}>
        <SaveStatusBadge
          status={saveStatus}
          lastSaved={lastSaved}
          error={saveError}
          onManualSave={onManualSave}
        />
      </div>

      <div className={styles.right}>
        {onSettingsClick && (
          <button onClick={onSettingsClick} className={styles.settingsButton} title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path
                d="M12 1v6m0 6v6m-5.196-13.928l4.196 4.196m2.828 2.828l4.196 4.196M1 12h6m6 0h6m-13.928 5.196l4.196-4.196m2.828-2.828l4.196-4.196"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <AuthHeader />
      </div>
    </header>
  );
}
