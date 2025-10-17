/**
 * GridArea - UI Redesign Phase 1
 *
 * Semantic grid area component for positioning widgets in the grid.
 * Uses grid-area names defined in mode-specific templates.
 */

'use client';

import { ReactNode } from 'react';
import styles from './GridSystem.module.css';

export interface GridAreaProps {
  area: 'header' | 'wave' | 'controls' | 'lyrics' | 'pitch' | 'coach' | 'effects' | 'tracks' | 'structure' | 'exercises' | 'progress' | 'goals' | 'assessment' | 'dashboard';
  children: ReactNode;
  className?: string;
}

/**
 * GridArea - Positions content in a named grid area
 *
 * @param area - Named grid area from mode template
 * @param children - Content to render in this grid area
 */
export function GridArea({ area, children, className }: GridAreaProps) {
  // Map area names to CSS classes
  const areaClass = {
    header: styles.headerArea,
    wave: styles.waveArea,
    controls: styles.controlsArea,
    lyrics: styles.lyricsArea,
    pitch: styles.pitchArea,
    coach: styles.coachArea,
    effects: styles.effectsArea,
    tracks: styles.tracksArea,
    structure: styles.structureArea,
    exercises: styles.exercisesArea,
    progress: styles.progressArea,
    goals: styles.goalsArea,
    assessment: styles.assessmentArea,
    dashboard: styles.dashboardArea,
  }[area];

  return (
    <div className={`${areaClass} ${className || ''}`}>
      {children}
    </div>
  );
}
