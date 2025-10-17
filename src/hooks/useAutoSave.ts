'use client'

// Auto-save hook for automatic project persistence
import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveOptions {
  enabled?: boolean;
  interval?: number; // Milliseconds (default: 30000 = 30 seconds)
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
  debounceDelay?: number; // Milliseconds (default: 2000 = 2 seconds)
}

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: Error | null;
  saveCount: number;
}

/**
 * Auto-save hook
 *
 * Automatically saves data at a regular interval with debouncing
 *
 * @example
 * ```typescript
 * const { status, lastSaved, saveNow } = useAutoSave({
 *   enabled: true,
 *   interval: 30000, // 30 seconds
 *   onSave: async () => {
 *     await saveProject();
 *   },
 *   onError: (error) => {
 *     console.error('Auto-save failed:', error);
 *   }
 * });
 * ```
 */
export function useAutoSave({
  enabled = true,
  interval = 30000,
  onSave,
  onError,
  debounceDelay = 2000,
}: AutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    error: null,
    saveCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasChangesRef = useRef(false);

  // Mark that changes have occurred
  const markDirty = useCallback(() => {
    hasChangesRef.current = true;
  }, []);

  // Perform save
  const performSave = useCallback(async () => {
    // Skip if already saving
    if (isSavingRef.current) {
      return;
    }

    // Skip if no changes
    if (!hasChangesRef.current) {
      return;
    }

    isSavingRef.current = true;
    setState((prev) => ({ ...prev, status: 'saving', error: null }));

    try {
      await onSave();

      hasChangesRef.current = false;

      setState((prev) => ({
        ...prev,
        status: 'saved',
        lastSaved: new Date(),
        error: null,
        saveCount: prev.saveCount + 1,
      }));

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          status: prev.status === 'saved' ? 'idle' : prev.status,
        }));
      }, 2000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed');

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err,
      }));

      if (onError) {
        onError(err);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onError]);

  // Save now (manual trigger)
  const saveNow = useCallback(async () => {
    // Clear any pending saves
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    await performSave();
  }, [performSave]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSave();
    }, debounceDelay);
  }, [performSave, debounceDelay]);

  // Start/stop auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start interval
    intervalRef.current = setInterval(() => {
      performSave();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, performSave]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    saveNow,
    markDirty,
    debouncedSave,
  };
}
