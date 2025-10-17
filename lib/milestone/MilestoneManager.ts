/**
 * @package dawg-ai
 * @description Milestone tracking and management service
 * @owner Instance 4 (Data & Storage - Karen)
 */

import {
  type Milestone,
  type MilestoneType,
  type UserMilestones,
  UserMilestonesSchema,
  validateStorageData,
} from '@/lib/types';

// ============================================================================
// DEFAULT MILESTONES
// ============================================================================

const DEFAULT_MILESTONES: Omit<Milestone, 'currentProgress' | 'isUnlocked' | 'unlockedAt' | 'celebrationShown'>[] = [
  {
    id: 'pitch_mastery_1',
    type: 'pitch_mastery',
    title: 'Pitch Perfect Beginner',
    description: 'Achieve 80% pitch accuracy over 5 sessions',
    icon: '🎵',
    target: 5,
  },
  {
    id: 'pitch_mastery_2',
    type: 'pitch_mastery',
    title: 'Pitch Master',
    description: 'Achieve 90% pitch accuracy over 10 sessions',
    icon: '🎼',
    target: 10,
  },
  {
    id: 'pitch_mastery_3',
    type: 'pitch_mastery',
    title: 'Perfect Pitch Legend',
    description: 'Achieve 95% pitch accuracy over 20 sessions',
    icon: '⭐',
    target: 20,
  },
  {
    id: 'consistency_1',
    type: 'consistency',
    title: 'Consistent Singer',
    description: 'Complete 10 practice sessions',
    icon: '🎤',
    target: 10,
  },
  {
    id: 'consistency_2',
    type: 'consistency',
    title: 'Dedicated Vocalist',
    description: 'Complete 50 practice sessions',
    icon: '🎙️',
    target: 50,
  },
  {
    id: 'consistency_3',
    type: 'consistency',
    title: 'Vocal Champion',
    description: 'Complete 100 practice sessions',
    icon: '🏆',
    target: 100,
  },
  {
    id: 'song_completion_1',
    type: 'song_completion',
    title: 'First Song Complete',
    description: 'Record and complete your first full song',
    icon: '🎶',
    target: 1,
  },
  {
    id: 'song_completion_2',
    type: 'song_completion',
    title: 'Album in Progress',
    description: 'Complete 5 full songs',
    icon: '💿',
    target: 5,
  },
  {
    id: 'song_completion_3',
    type: 'song_completion',
    title: 'Prolific Artist',
    description: 'Complete 20 full songs',
    icon: '🎸',
    target: 20,
  },
  {
    id: 'practice_streak_1',
    type: 'practice_streak',
    title: 'Week Warrior',
    description: 'Practice for 7 consecutive days',
    icon: '🔥',
    target: 7,
  },
  {
    id: 'practice_streak_2',
    type: 'practice_streak',
    title: 'Month Master',
    description: 'Practice for 30 consecutive days',
    icon: '💪',
    target: 30,
  },
  {
    id: 'practice_streak_3',
    type: 'practice_streak',
    title: 'Unstoppable',
    description: 'Practice for 100 consecutive days',
    icon: '🚀',
    target: 100,
  },
  {
    id: 'range_expansion_1',
    type: 'range_expansion',
    title: 'Range Explorer',
    description: 'Expand your vocal range by 2 semitones',
    icon: '📈',
    target: 2,
  },
  {
    id: 'range_expansion_2',
    type: 'range_expansion',
    title: 'Range Master',
    description: 'Expand your vocal range by 5 semitones',
    icon: '🎭',
    target: 5,
  },
  {
    id: 'range_expansion_3',
    type: 'range_expansion',
    title: 'Vocal Athlete',
    description: 'Expand your vocal range by 12 semitones (one octave)',
    icon: '💎',
    target: 12,
  },
];

// ============================================================================
// MILESTONE MANAGER CLASS
// ============================================================================

export class MilestoneManager {
  private static instance: MilestoneManager;

  private constructor() {}

  static getInstance(): MilestoneManager {
    if (!MilestoneManager.instance) {
      MilestoneManager.instance = new MilestoneManager();
    }
    return MilestoneManager.instance;
  }

  /**
   * Initialize milestones for a new user
   */
  initialize(userId: string): UserMilestones {
    const now = new Date();

    const milestones: Milestone[] = DEFAULT_MILESTONES.map((template) => ({
      ...template,
      currentProgress: 0,
      isUnlocked: false,
      unlockedAt: undefined,
      celebrationShown: false,
    }));

    const userMilestones: UserMilestones = {
      userId,
      milestones,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: undefined,
      totalMilestonesUnlocked: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save to localStorage
    this.saveToLocalStorage(userMilestones);

    return userMilestones;
  }

  /**
   * Load milestones from localStorage
   */
  loadFromLocalStorage(userId: string): UserMilestones | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(`milestones_${userId}`);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);

      // Convert date strings back to Date objects
      const rawData = {
        ...parsed,
        lastPracticeDate: parsed.lastPracticeDate ? new Date(parsed.lastPracticeDate) : undefined,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        milestones: parsed.milestones.map((m: any) => ({
          ...m,
          unlockedAt: m.unlockedAt ? new Date(m.unlockedAt) : undefined,
        })),
      };

      return validateStorageData(UserMilestonesSchema, rawData, `milestones_${userId}`);
    } catch (error) {
      console.error('[MilestoneManager] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Save milestones to localStorage
   */
  private saveToLocalStorage(userMilestones: UserMilestones): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`milestones_${userMilestones.userId}`, JSON.stringify(userMilestones));
    } catch (error) {
      console.error('[MilestoneManager] Failed to save to localStorage:', error);
    }
  }

  /**
   * Get or create user milestones
   */
  getOrCreate(userId: string): UserMilestones {
    const existing = this.loadFromLocalStorage(userId);
    if (existing) return existing;

    return this.initialize(userId);
  }

  /**
   * Update progress for a specific milestone
   */
  updateProgress(
    userMilestones: UserMilestones,
    milestoneId: string,
    newProgress: number
  ): { updated: UserMilestones; unlocked: boolean } {
    const milestone = userMilestones.milestones.find((m) => m.id === milestoneId);

    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // Don't update if already unlocked
    if (milestone.isUnlocked) {
      return { updated: userMilestones, unlocked: false };
    }

    // Update progress
    milestone.currentProgress = Math.min(newProgress, milestone.target);

    // Check if unlocked
    const wasUnlocked = milestone.isUnlocked;
    milestone.isUnlocked = milestone.currentProgress >= milestone.target;

    // Set unlock timestamp
    if (!wasUnlocked && milestone.isUnlocked) {
      milestone.unlockedAt = new Date();
      userMilestones.totalMilestonesUnlocked += 1;
    }

    userMilestones.updatedAt = new Date();
    this.saveToLocalStorage(userMilestones);

    return {
      updated: userMilestones,
      unlocked: !wasUnlocked && milestone.isUnlocked,
    };
  }

  /**
   * Update practice streak
   */
  updateStreak(userMilestones: UserMilestones, practiceDate: Date): UserMilestones {
    const lastPractice = userMilestones.lastPracticeDate;
    const today = this.normalizeDate(practiceDate);

    // If no last practice, start streak at 1
    if (!lastPractice) {
      userMilestones.currentStreak = 1;
      userMilestones.longestStreak = Math.max(1, userMilestones.longestStreak);
      userMilestones.lastPracticeDate = today;
      userMilestones.updatedAt = new Date();
      this.saveToLocalStorage(userMilestones);
      return userMilestones;
    }

    const lastPracticeNormalized = this.normalizeDate(lastPractice);
    const daysDifference = this.daysBetween(lastPracticeNormalized, today);

    // Same day - no change
    if (daysDifference === 0) {
      return userMilestones;
    }

    // Consecutive day - increment streak
    if (daysDifference === 1) {
      userMilestones.currentStreak += 1;
      userMilestones.longestStreak = Math.max(
        userMilestones.currentStreak,
        userMilestones.longestStreak
      );
    }
    // Streak broken - reset to 1
    else if (daysDifference > 1) {
      userMilestones.currentStreak = 1;
    }

    userMilestones.lastPracticeDate = today;
    userMilestones.updatedAt = new Date();
    this.saveToLocalStorage(userMilestones);

    // Auto-update streak milestones
    this.updateStreakMilestones(userMilestones);

    return userMilestones;
  }

  /**
   * Auto-update streak milestones based on current streak
   */
  private updateStreakMilestones(userMilestones: UserMilestones): void {
    const streakMilestones = userMilestones.milestones.filter(
      (m) => m.type === 'practice_streak'
    );

    for (const milestone of streakMilestones) {
      if (!milestone.isUnlocked) {
        const result = this.updateProgress(
          userMilestones,
          milestone.id,
          userMilestones.currentStreak
        );

        if (result.unlocked) {
          console.log(`[MilestoneManager] Streak milestone unlocked: ${milestone.title}`);
        }
      }
    }
  }

  /**
   * Mark celebration as shown
   */
  markCelebrationShown(userMilestones: UserMilestones, milestoneId: string): UserMilestones {
    const milestone = userMilestones.milestones.find((m) => m.id === milestoneId);

    if (milestone) {
      milestone.celebrationShown = true;
      userMilestones.updatedAt = new Date();
      this.saveToLocalStorage(userMilestones);
    }

    return userMilestones;
  }

  /**
   * Get milestones by type
   */
  getMilestonesByType(userMilestones: UserMilestones, type: MilestoneType): Milestone[] {
    return userMilestones.milestones.filter((m) => m.type === type);
  }

  /**
   * Get unlocked milestones
   */
  getUnlockedMilestones(userMilestones: UserMilestones): Milestone[] {
    return userMilestones.milestones.filter((m) => m.isUnlocked);
  }

  /**
   * Get next milestone to unlock (closest to completion)
   */
  getNextMilestone(userMilestones: UserMilestones): Milestone | null {
    const locked = userMilestones.milestones.filter((m) => !m.isUnlocked);

    if (locked.length === 0) return null;

    return locked.reduce((closest, current) => {
      const closestPercent = closest.currentProgress / closest.target;
      const currentPercent = current.currentProgress / current.target;

      return currentPercent > closestPercent ? current : closest;
    });
  }

  /**
   * Get milestones pending celebration
   */
  getPendingCelebrations(userMilestones: UserMilestones): Milestone[] {
    return userMilestones.milestones.filter(
      (m) => m.isUnlocked && !m.celebrationShown
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Normalize date to midnight UTC
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

    return Math.floor((utc2 - utc1) / msPerDay);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const milestoneManager = MilestoneManager.getInstance();
