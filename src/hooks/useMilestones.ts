/**
 * @package dawg-ai
 * @description React hook for milestone management with cloud sync
 * @owner Instance 4 (Data & Storage - Karen)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserMilestones, Milestone } from '$lib/types';

import { logger } from '$lib/utils/logger';
interface UseMilestonesResult {
  milestones: UserMilestones | null;
  loading: boolean;
  error: string | null;
  unlockMilestone: (milestoneId: string, progress: number) => Promise<boolean>;
  updateStreak: (date?: Date) => Promise<void>;
  markCelebrationShown: (milestoneId: string) => void;
  getPendingCelebrations: () => Milestone[];
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user milestones with cloud sync
 */
export function useMilestones(userId?: string): UseMilestonesResult {
  const [milestones, setMilestones] = useState<UserMilestones | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load milestones from API
   */
  const loadMilestones = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/milestones', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load milestones: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Convert date strings back to Date objects
        const data = result.data;
        const converted = {
          ...data,
          lastPracticeDate: data.lastPracticeDate ? new Date(data.lastPracticeDate) : undefined,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          milestones: data.milestones.map((m: any) => ({
            ...m,
            unlockedAt: m.unlockedAt ? new Date(m.unlockedAt) : undefined,
          })),
        };

        setMilestones(converted);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      logger.error('[useMilestones] Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Update milestone progress
   */
  const unlockMilestone = useCallback(
    async (milestoneId: string, progress: number): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch('/api/milestones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ milestoneId, progress }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update milestone: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          // Convert date strings back to Date objects
          const data = result.data;
          const converted = {
            ...data,
            lastPracticeDate: data.lastPracticeDate ? new Date(data.lastPracticeDate) : undefined,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            milestones: data.milestones.map((m: any) => ({
              ...m,
              unlockedAt: m.unlockedAt ? new Date(m.unlockedAt) : undefined,
            })),
          };

          setMilestones(converted);
          return result.unlocked;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err: any) {
        logger.error('[useMilestones] Unlock error:', err);
        setError(err.message);
        return false;
      }
    },
    [userId]
  );

  /**
   * Update practice streak
   */
  const updateStreak = useCallback(
    async (date: Date = new Date()) => {
      if (!userId) return;

      try {
        const response = await fetch('/api/milestones/streak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ practiceDate: date.toISOString() }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update streak: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          // Convert date strings back to Date objects
          const data = result.data;
          const converted = {
            ...data,
            lastPracticeDate: data.lastPracticeDate ? new Date(data.lastPracticeDate) : undefined,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            milestones: data.milestones.map((m: any) => ({
              ...m,
              unlockedAt: m.unlockedAt ? new Date(m.unlockedAt) : undefined,
            })),
          };

          setMilestones(converted);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err: any) {
        logger.error('[useMilestones] Streak update error:', err);
        setError(err.message);
      }
    },
    [userId]
  );

  /**
   * Mark celebration as shown (local only)
   */
  const markCelebrationShown = useCallback((milestoneId: string) => {
    setMilestones((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId ? { ...m, celebrationShown: true } : m
        ),
      };
    });
  }, []);

  /**
   * Get milestones pending celebration
   */
  const getPendingCelebrations = useCallback((): Milestone[] => {
    if (!milestones) return [];

    return milestones.milestones.filter((m) => m.isUnlocked && !m.celebrationShown);
  }, [milestones]);

  /**
   * Refresh milestones from server
   */
  const refresh = useCallback(async () => {
    await loadMilestones();
  }, [loadMilestones]);

  // Load milestones on mount
  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  return {
    milestones,
    loading,
    error,
    unlockMilestone,
    updateStreak,
    markCelebrationShown,
    getPendingCelebrations,
    refresh,
  };
}
