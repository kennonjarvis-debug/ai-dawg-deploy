/**
 * DashboardCompactBar Component
 * Ready-to-use bottom bar combining all 4 compact widgets
 * ProjectStats + QuickActions + CompactPitchMonitor + CompactEQControls
 */

'use client';

import { ProjectStats } from '@/src/widgets/ProjectStats/ProjectStats';
import { QuickActions } from '@/src/widgets/QuickActions/QuickActions';
import styles from './DashboardCompactBar.module.css';

interface DashboardCompactBarProps {
  // ProjectStats props
  projectName?: string;
  trackCount: number;
  totalDuration: number;
  bpm: number;
  lastSaved?: Date;

  // QuickActions props
  onSave?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  canExport?: boolean;

  // Optional: Audio widgets (Instance 1 can add CompactPitchMonitor + CompactEQControls)
  showAudioWidgets?: boolean;
}

export function DashboardCompactBar({
  projectName,
  trackCount,
  totalDuration,
  bpm,
  lastSaved,
  onSave,
  onExport,
  onShare,
  isSaving = false,
  canExport = true,
  showAudioWidgets = false,
}: DashboardCompactBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.widget}>
        <ProjectStats
          projectName={projectName}
          trackCount={trackCount}
          totalDuration={totalDuration}
          bpm={bpm}
          lastSaved={lastSaved}
        />
      </div>

      <div className={styles.widget}>
        <QuickActions
          onSave={onSave}
          onExport={onExport}
          onShare={onShare}
          isSaving={isSaving}
          canExport={canExport}
        />
      </div>

      {showAudioWidgets && (
        <>
          <div className={styles.widget}>
            {/* Instance 1: Add CompactPitchMonitor here */}
            <div className={styles.placeholder}>
              <span>Pitch Monitor</span>
            </div>
          </div>

          <div className={styles.widget}>
            {/* Instance 1: Add CompactEQControls here */}
            <div className={styles.placeholder}>
              <span>EQ Controls</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
