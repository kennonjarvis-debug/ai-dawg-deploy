/**
 * ModeSwitcher - UI Redesign Phase 1.3
 *
 * Tab-style mode switcher with keyboard shortcuts and smooth transitions.
 * Allows users to toggle between Record/Edit/Mix/Learn workspace modes.
 */

'use client';

import { useEffect } from 'react';
import { Mic, Edit3, Sliders, BookOpen } from 'lucide-react';
import { useModeContext } from '@/src/contexts/ModeContext';
import type { WorkspaceMode } from '@/src/types/workspace';
import styles from './ModeSwitcher.module.css';

export interface ModeSwitcherProps {
  showLabels?: boolean;
  className?: string;
}

const MODE_CONFIG = {
  record: {
    icon: Mic,
    label: 'Record',
    shortcut: 'R',
    ariaLabel: 'Switch to Record mode (Press R)',
  },
  edit: {
    icon: Edit3,
    label: 'Edit',
    shortcut: 'E',
    ariaLabel: 'Switch to Edit mode (Press E)',
  },
  mix: {
    icon: Sliders,
    label: 'Mix',
    shortcut: 'M',
    ariaLabel: 'Switch to Mix mode (Press M)',
  },
  learn: {
    icon: BookOpen,
    label: 'Learn',
    shortcut: 'L',
    ariaLabel: 'Switch to Learn mode (Press L)',
  },
} as const;

/**
 * ModeSwitcher - Tab-style workspace mode switcher
 *
 * Features:
 * - Visual tab navigation
 * - Keyboard shortcuts (R/E/M/L)
 * - Active state indication
 * - Smooth transitions
 * - Full accessibility (ARIA labels, keyboard nav)
 *
 * @param showLabels - Show text labels alongside icons (default: true)
 * @param className - Additional CSS classes
 */
export function ModeSwitcher({ showLabels = true, className }: ModeSwitcherProps) {
  const { mode, setMode } = useModeContext();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // Map keys to modes
      const keyModeMap: Record<string, WorkspaceMode> = {
        r: 'record',
        e: 'edit',
        m: 'mix',
        l: 'learn',
      };

      const newMode = keyModeMap[key];
      if (newMode) {
        event.preventDefault();
        setMode(newMode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setMode]);

  const modes: WorkspaceMode[] = ['record', 'edit', 'mix', 'learn'];

  return (
    <div
      className={`${styles.modeSwitcher} ${className || ''}`}
      role="tablist"
      aria-label="Workspace modes"
    >
      {modes.map((modeKey) => {
        const config = MODE_CONFIG[modeKey];
        const Icon = config.icon;
        const isActive = mode === modeKey;

        return (
          <button
            key={modeKey}
            className={`${styles.modeTab} ${isActive ? styles.active : ''}`}
            onClick={() => setMode(modeKey)}
            role="tab"
            aria-selected={isActive}
            aria-label={config.ariaLabel}
            title={`${config.label} mode (${config.shortcut})`}
          >
            <Icon className={styles.icon} size={18} aria-hidden="true" />
            {showLabels && <span className={styles.label}>{config.label}</span>}
            <span className={styles.shortcut} aria-hidden="true">
              {config.shortcut}
            </span>
          </button>
        );
      })}
      <div
        className={styles.activeIndicator}
        style={{
          transform: `translateX(${modes.indexOf(mode) * 100}%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
