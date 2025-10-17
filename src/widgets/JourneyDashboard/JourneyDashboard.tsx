/**
 * JourneyDashboard Widget
 * Central hub for adaptive song creation journey
 * Shows current progress, timeline, and quick actions
 */

'use client';

import { useState } from 'react';
import { Play, BookOpen, BarChart3, Target } from 'lucide-react';
import styles from './JourneyDashboard.module.css';

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  current: boolean;
  progress: number; // 0-100
}

interface JourneyData {
  journeyName: string;
  overallProgress: number; // 0-100
  currentStage: JourneyStage;
  allStages: JourneyStage[];
  nextAction: string;
  skillsUnlocked: number;
  sessionsCompleted: number;
  totalSessions: number;
}

interface JourneyDashboardProps {
  journey?: JourneyData;
  onContinue?: () => void;
  onPractice?: () => void;
  onReview?: () => void;
  onNewJourney?: () => void;
}

const mockJourney: JourneyData = {
  journeyName: "First Country Ballad",
  overallProgress: 45,
  currentStage: {
    id: "stage-3",
    name: "Guided Recording",
    description: "Record your vocal performance with real-time coaching",
    completed: false,
    current: true,
    progress: 60,
  },
  allStages: [
    {
      id: "stage-1",
      name: "Songwriting Foundation",
      description: "Create lyrics and melody",
      completed: true,
      current: false,
      progress: 100,
    },
    {
      id: "stage-2",
      name: "Vocal Blueprint",
      description: "Prepare your voice",
      completed: true,
      current: false,
      progress: 100,
    },
    {
      id: "stage-3",
      name: "Guided Recording",
      description: "Record your vocal performance",
      completed: false,
      current: true,
      progress: 60,
    },
    {
      id: "stage-4",
      name: "Production Enhancement",
      description: "Polish and mix your track",
      completed: false,
      current: false,
      progress: 0,
    },
    {
      id: "stage-5",
      name: "Final Delivery",
      description: "Master and export",
      completed: false,
      current: false,
      progress: 0,
    },
  ],
  nextAction: "Continue recording - 2 more takes to go",
  skillsUnlocked: 8,
  sessionsCompleted: 3,
  totalSessions: 6,
};

export function JourneyDashboard({
  journey = mockJourney,
  onContinue,
  onPractice,
  onReview,
  onNewJourney,
}: JourneyDashboardProps) {
  const [showAllStages, setShowAllStages] = useState(false);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{journey.journeyName}</h2>
          <div className={styles.progressBadge}>
            {journey.overallProgress}% Complete
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Target size={16} />
            <span>{journey.sessionsCompleted}/{journey.totalSessions} Sessions</span>
          </div>
          <div className={styles.stat}>
            <BarChart3 size={16} />
            <span>{journey.skillsUnlocked} Skills Unlocked</span>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className={styles.progressBarContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${journey.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Current Stage */}
      <div className={styles.currentStage}>
        <div className={styles.stageHeader}>
          <div className={styles.stageBadge}>Current Stage</div>
          <h3 className={styles.stageName}>{journey.currentStage.name}</h3>
        </div>
        <p className={styles.stageDescription}>{journey.currentStage.description}</p>
        <div className={styles.stageProgress}>
          <div className={styles.stageProgressBar}>
            <div
              className={styles.stageProgressFill}
              style={{ width: `${journey.currentStage.progress}%` }}
            />
          </div>
          <span className={styles.stageProgressText}>
            {journey.currentStage.progress}% complete
          </span>
        </div>
        <div className={styles.nextAction}>
          <span className={styles.nextActionLabel}>Next:</span>
          <span className={styles.nextActionText}>{journey.nextAction}</span>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <h4 className={styles.timelineTitle}>Journey Timeline</h4>
          <button
            className={styles.toggleButton}
            onClick={() => setShowAllStages(!showAllStages)}
          >
            {showAllStages ? 'Hide' : 'Show All'} Stages
          </button>
        </div>
        {showAllStages && (
          <div className={styles.stageList}>
            {journey.allStages.map((stage, index) => (
              <div
                key={stage.id}
                className={`${styles.stageItem} ${
                  stage.current ? styles.stageItemCurrent : ''
                } ${stage.completed ? styles.stageItemCompleted : ''}`}
              >
                <div className={styles.stageNumber}>{index + 1}</div>
                <div className={styles.stageInfo}>
                  <div className={styles.stageItemName}>{stage.name}</div>
                  <div className={styles.stageItemDesc}>{stage.description}</div>
                </div>
                <div className={styles.stageStatus}>
                  {stage.completed ? (
                    <div className={styles.checkmark}>✓</div>
                  ) : stage.current ? (
                    <div className={styles.currentMarker}>{stage.progress}%</div>
                  ) : (
                    <div className={styles.pendingMarker}>—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          onClick={onContinue}
        >
          <Play size={18} />
          Continue Session
        </button>
        <button
          className={styles.actionButton}
          onClick={onPractice}
        >
          <BookOpen size={18} />
          Practice Exercises
        </button>
        <button
          className={styles.actionButton}
          onClick={onReview}
        >
          <BarChart3 size={18} />
          Review Progress
        </button>
      </div>

      {/* New Journey Link */}
      {onNewJourney && (
        <div className={styles.footer}>
          <button className={styles.newJourneyButton} onClick={onNewJourney}>
            + Start New Journey
          </button>
        </div>
      )}
    </div>
  );
}
