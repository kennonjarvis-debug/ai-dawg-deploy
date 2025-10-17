/**
 * UserProfileCard Widget
 * Display vocal range, strengths, and growth areas
 * Visual profile card for user's singing capabilities
 * NOW POWERED BY KAREN'S ProfileManager 🎯
 */

'use client';

import { useSession } from 'next-auth/react';
import { useProfile } from '@/src/hooks/useProfile';
import styles from './UserProfileCard.module.css';

interface UserProfileCardProps {
  onEditProfile?: () => void;
}

const SKILL_LEVELS = {
  beginner: { label: 'Beginner', color: '#fbbf24' },
  intermediate: { label: 'Intermediate', color: '#3b82f6' },
  advanced: { label: 'Advanced', color: '#8b5cf6' },
  professional: { label: 'Professional', color: '#22c55e' },
};

export function UserProfileCard({ onEditProfile }: UserProfileCardProps) {
  const { data: session } = useSession();
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {error || 'No profile found. Sign in to create one.'}
        </div>
      </div>
    );
  }

  const skillLevel = SKILL_LEVELS[profile.skillLevel];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(session?.user?.name || session?.user?.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{session?.user?.name || 'Vocalist'}</h3>
            <div className={styles.skillBadge} style={{ background: skillLevel.color }}>
              {skillLevel.label}
            </div>
          </div>
        </div>
        {onEditProfile && (
          <button onClick={onEditProfile} className={styles.editButton} title="Edit Profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18V5l12-2v13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" strokeWidth="2" />
              <circle cx="18" cy="16" r="3" strokeWidth="2" />
            </svg>
            <h4 className={styles.sectionTitle}>Vocal Range</h4>
          </div>
          <div className={styles.rangeDisplay}>
            <div className={styles.rangeItem}>
              <span className={styles.rangeLabel}>Lowest</span>
              <span className={styles.rangeValue}>{profile.vocalRange.lowest}</span>
            </div>
            <div className={styles.rangeArrow}>→</div>
            <div className={styles.rangeItem}>
              <span className={styles.rangeLabel}>Highest</span>
              <span className={styles.rangeValue}>{profile.vocalRange.highest}</span>
            </div>
          </div>
          <div className={styles.comfortableRange}>
            <span className={styles.comfortableLabel}>Comfortable:</span>
            <span className={styles.comfortableValue}>{profile.vocalRange.comfortable}</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h4 className={styles.sectionTitle}>Strengths</h4>
          </div>
          <div className={styles.tags}>
            {profile.strengths.map((strength, i) => (
              <span key={i} className={styles.tagStrength}>
                ✓ {strength}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <polyline points="8 12 12 16 16 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h4 className={styles.sectionTitle}>Growth Areas</h4>
          </div>
          <div className={styles.tags}>
            {profile.growthAreas.map((area, i) => (
              <span key={i} className={styles.tagGrowth}>
                → {area}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.practiceHours}</span>
            <span className={styles.statLabel}>Practice Hours</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.sessionsCompleted}</span>
            <span className={styles.statLabel}>Sessions</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{profile.genre}</span>
            <span className={styles.statLabel}>Genre</span>
          </div>
        </div>
      </div>
    </div>
  );
}
