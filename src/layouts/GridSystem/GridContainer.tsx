/**
 * GridContainer - UI Redesign Phase 1
 *
 * 12-column responsive grid container that adapts to workspace modes.
 * Integrates with ModeContext to apply mode-specific grid templates.
 */

'use client';

import { ReactNode } from 'react';
import { useModeContext } from '@/src/contexts/ModeContext';
import styles from './GridSystem.module.css';

export interface GridContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * GridContainer - Main layout grid with mode-aware templates
 *
 * Automatically applies the correct grid template based on current mode.
 */
export function GridContainer({ children, className }: GridContainerProps) {
  const { mode } = useModeContext();

  // Map mode to CSS class
  const modeClass = {
    record: styles.recordMode,
    edit: styles.editMode,
    mix: styles.mixMode,
    learn: styles.learnMode,
  }[mode];

  return (
    <div className={`${styles.layoutGrid} ${modeClass} ${className || ''}`}>
      {children}
    </div>
  );
}
