/**
 * GridPanel - UI Redesign Phase 1
 *
 * Styled panel container for grid areas.
 * Provides consistent styling and optional scrolling behavior.
 */

'use client';

import { ReactNode } from 'react';
import styles from './GridSystem.module.css';

export interface GridPanelProps {
  children: ReactNode;
  variant?: 'default' | 'glass';
  padding?: boolean;
  scrollable?: boolean;
  className?: string;
}

/**
 * GridPanel - Styled container for grid area content
 *
 * @param variant - Visual style ('default' | 'glass')
 * @param padding - Whether to apply internal padding (default: true)
 * @param scrollable - Whether content should scroll (default: false)
 */
export function GridPanel({
  children,
  variant = 'default',
  padding = true,
  scrollable = false,
  className,
}: GridPanelProps) {
  const variantClass = variant === 'glass' ? styles.glass : '';
  const paddingClass = !padding ? styles.noPadding : '';
  const scrollClass = scrollable ? styles.scrollable : '';

  return (
    <div
      className={`${styles.gridPanel} ${variantClass} ${paddingClass} ${scrollClass} ${className || ''}`}
    >
      {children}
    </div>
  );
}
