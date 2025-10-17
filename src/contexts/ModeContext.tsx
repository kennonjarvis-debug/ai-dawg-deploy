/**
 * ModeContext - UI Redesign Phase 1
 *
 * Global state management for adaptive workspace modes.
 * Provides mode switching with localStorage persistence.
 *
 * Usage:
 * ```tsx
 * const { mode, setMode, modeConfig } = useModeContext();
 *
 * // Switch modes
 * setMode('record');
 * setMode('edit');
 * setMode('mix');
 * setMode('learn');
 *
 * // Get current mode config
 * console.log(modeConfig.label); // "Record"
 * console.log(modeConfig.widgets); // ['WaveformDisplay', ...]
 * ```
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { WorkspaceMode, ModeContextValue, ModeConfig } from '@/src/types/workspace';
import { MODE_CONFIGS, WORKSPACE_MODE_STORAGE_KEY, DEFAULT_WORKSPACE_MODE } from '@/src/types/workspace';

// Create the context
const ModeContext = createContext<ModeContextValue | undefined>(undefined);

interface ModeProviderProps {
  children: ReactNode;
  initialMode?: WorkspaceMode;
}

/**
 * ModeProvider - Wraps the app to provide workspace mode context
 */
export function ModeProvider({ children, initialMode }: ModeProviderProps) {
  // Initialize mode from localStorage or default
  const [mode, setModeState] = useState<WorkspaceMode>(() => {
    // SSR-safe: only access localStorage on client
    if (typeof window === 'undefined') {
      return initialMode || DEFAULT_WORKSPACE_MODE;
    }

    try {
      const stored = localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY);
      if (stored && (stored === 'record' || stored === 'edit' || stored === 'mix' || stored === 'learn')) {
        return stored as WorkspaceMode;
      }
    } catch (error) {
      console.warn('[ModeContext] Failed to read from localStorage:', error);
    }

    return initialMode || DEFAULT_WORKSPACE_MODE;
  });

  // Persist mode changes to localStorage
  const setMode = (newMode: WorkspaceMode) => {
    setModeState(newMode);

    // Persist to localStorage
    try {
      localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('[ModeContext] Failed to write to localStorage:', error);
    }

    // Optional: Publish event to event bus
    if (typeof window !== 'undefined') {
      console.log(`[ModeContext] Mode switched to: ${newMode}`);
    }
  };

  // Get current mode config
  const modeConfig: ModeConfig = MODE_CONFIGS[mode];

  const value: ModeContextValue = {
    mode,
    setMode,
    modeConfig,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

/**
 * useModeContext - Hook to access workspace mode context
 *
 * @throws Error if used outside of ModeProvider
 */
export function useModeContext(): ModeContextValue {
  const context = useContext(ModeContext);

  if (context === undefined) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }

  return context;
}

/**
 * withModeContext - HOC to wrap components with ModeProvider
 *
 * @example
 * ```tsx
 * export default withModeContext(MyComponent, 'record');
 * ```
 */
export function withModeContext<P extends object>(
  Component: React.ComponentType<P>,
  initialMode?: WorkspaceMode
) {
  return function ModeContextWrapper(props: P) {
    return (
      <ModeProvider initialMode={initialMode}>
        <Component {...props} />
      </ModeProvider>
    );
  };
}
