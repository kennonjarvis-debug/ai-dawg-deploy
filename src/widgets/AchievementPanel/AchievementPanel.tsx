/**
 * AchievementPanel Widget
 * Display unlocked skills, badges, and milestones
 * Track user progress and accomplishments
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './AchievementPanel.module.css';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'skill' | 'milestone' | 'badge';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number; // 0-100 for locked achievements
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementPanelProps {
  onViewDetails?: (achievementId: string) => void;
}

export function AchievementPanel({ onViewDetails }: AchievementPanelProps) {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'skill' | 'milestone' | 'badge'>('all');
  const [showUnlocked, setShowUnlocked] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load achievements from localStorage or API
  useEffect(() => {
    if (!session) return;

    const savedAchievements = localStorage.getItem('achievements');
    if (savedAchievements) {
      const parsed = JSON.parse(savedAchievements);
      setAchievements(
        parsed.map((a: any) => ({
          ...a,
          unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
        }))
      );
      setLoading(false);
    } else {
      // Initialize with default achievements
      const defaultAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first practice session',
          icon: '🎤',
          category: 'milestone',
          unlocked: true,
          unlockedAt: new Date(),
          rarity: 'common',
        },
        {
          id: '2',
          title: 'Pitch Perfect',
          description: 'Achieve 90% pitch accuracy in a recording',
          icon: '🎯',
          category: 'skill',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 86400000),
          rarity: 'rare',
        },
        {
          id: '3',
          title: 'Range Warrior',
          description: 'Expand your vocal range by one octave',
          icon: '🏆',
          category: 'skill',
          unlocked: false,
          progress: 65,
          rarity: 'epic',
        },
        {
          id: '4',
          title: 'Week Streak',
          description: 'Practice 7 days in a row',
          icon: '🔥',
          category: 'badge',
          unlocked: false,
          progress: 42,
          rarity: 'common',
        },
        {
          id: '5',
          title: 'Studio Master',
          description: 'Complete 50 recordings',
          icon: '🎙️',
          category: 'milestone',
          unlocked: false,
          progress: 18,
          rarity: 'legendary',
        },
        {
          id: '6',
          title: 'Breath Control',
          description: 'Hold a note for 20 seconds',
          icon: '💨',
          category: 'skill',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 172800000),
          rarity: 'rare',
        },
      ];
      setAchievements(defaultAchievements);
      localStorage.setItem('achievements', JSON.stringify(defaultAchievements));
      setLoading(false);
    }
  }, [session]);

  const filteredAchievements = achievements.filter((achievement) => {
    if (filter !== 'all' && achievement.category !== filter) return false;
    if (!showUnlocked && achievement.unlocked) return false;
    return true;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return '#9ca3af';
      case 'rare':
        return '#3b82f6';
      case 'epic':
        return '#a855f7';
      case 'legendary':
        return '#eab308';
      default:
        return '#fff';
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.noAuth}>
          <p>Sign in to track your achievements</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Achievements</h2>
        <div className={styles.stats}>
          <div className={styles.statBadge}>
            <span className={styles.statValue}>{unlockedCount}</span>
            <span className={styles.statLabel}>/ {totalCount}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className={styles.percentage}>{completionRate}%</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'skill' ? styles.active : ''}`}
            onClick={() => setFilter('skill')}
          >
            Skills
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'milestone' ? styles.active : ''}`}
            onClick={() => setFilter('milestone')}
          >
            Milestones
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'badge' ? styles.active : ''}`}
            onClick={() => setFilter('badge')}
          >
            Badges
          </button>
        </div>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={showUnlocked}
            onChange={(e) => setShowUnlocked(e.target.checked)}
          />
          <span>Show unlocked</span>
        </label>
      </div>

      {/* Achievement Grid */}
      <div className={styles.grid}>
        {filteredAchievements.length === 0 ? (
          <div className={styles.empty}>
            <p>No achievements to display</p>
          </div>
        ) : (
          filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`${styles.card} ${!achievement.unlocked ? styles.locked : ''}`}
              onClick={() => onViewDetails?.(achievement.id)}
            >
              <div className={styles.cardHeader}>
                <div
                  className={styles.icon}
                  style={{
                    borderColor: getRarityColor(achievement.rarity),
                    opacity: achievement.unlocked ? 1 : 0.4,
                  }}
                >
                  {achievement.icon}
                </div>
                <div
                  className={styles.rarity}
                  style={{ color: getRarityColor(achievement.rarity) }}
                >
                  {achievement.rarity}
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.achievementTitle}>{achievement.title}</h3>
                <p className={styles.description}>{achievement.description}</p>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className={styles.unlocked}>
                    <span className={styles.checkmark}>✓</span>
                    <span className={styles.unlockedDate}>
                      Unlocked {achievement.unlockedAt.toLocaleDateString()}
                    </span>
                  </div>
                )}

                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressText}>
                      {achievement.progress}% complete
                    </div>
                    <div className={styles.progressBarSmall}>
                      <div
                        className={styles.progressFillSmall}
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.categoryBadge}>
                {achievement.category}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
