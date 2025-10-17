'use client';

import { useState } from 'react';
import { Target, ChevronRight, ChevronLeft, Music, Clock, TrendingUp } from 'lucide-react';
import styles from './GoalSettingWizard.module.css';

interface GoalSettingWizardProps {
  vocalProfile: VocalProfile | null;
  onComplete?: (journey: Journey) => void;
}

interface VocalProfile {
  lowestNote: string;
  highestNote: string;
  range: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  controlScore: number;
  pitchAccuracy: number;
  strengths: string[];
  areasToImprove: string[];
}

interface Journey {
  id: string;
  name: string;
  goal: string;
  timeframe: string;
  focusAreas: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedWeeks: number;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  weekNumber: number;
}

const WIZARD_STEPS = [
  {
    id: 'welcome',
    title: 'Create Your Vocal Journey',
    description: 'Let\'s build a personalized training plan based on your assessment.',
  },
  {
    id: 'goal',
    title: 'What\'s Your Goal?',
    description: 'Choose what you want to achieve with your voice.',
  },
  {
    id: 'timeframe',
    title: 'How Much Time?',
    description: 'How much time can you dedicate each week?',
  },
  {
    id: 'focus',
    title: 'Focus Areas',
    description: 'Select areas you want to work on.',
  },
  {
    id: 'preview',
    title: 'Your Journey Preview',
    description: 'Review your personalized training plan.',
  },
];

const GOALS = [
  { id: 'expand-range', label: 'Expand Vocal Range', icon: TrendingUp, weeks: 8 },
  { id: 'improve-control', label: 'Improve Pitch Control', icon: Target, weeks: 6 },
  { id: 'record-song', label: 'Record a Full Song', icon: Music, weeks: 4 },
  { id: 'build-confidence', label: 'Build Performance Confidence', icon: TrendingUp, weeks: 12 },
];

const TIMEFRAMES = [
  { id: '15min', label: '15 min/day', hours: 1.75, difficulty: 'easy' as const },
  { id: '30min', label: '30 min/day', hours: 3.5, difficulty: 'medium' as const },
  { id: '60min', label: '1 hour/day', hours: 7, difficulty: 'hard' as const },
];

const FOCUS_AREAS = [
  { id: 'breath-control', label: 'Breath Control' },
  { id: 'pitch-accuracy', label: 'Pitch Accuracy' },
  { id: 'vocal-range', label: 'Vocal Range' },
  { id: 'tone-quality', label: 'Tone Quality' },
  { id: 'rhythm-timing', label: 'Rhythm & Timing' },
  { id: 'dynamics', label: 'Dynamics & Expression' },
];

export function GoalSettingWizard({ vocalProfile, onComplete }: GoalSettingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const step = WIZARD_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const generateJourney = (): Journey => {
    const goal = GOALS.find((g) => g.id === selectedGoal);
    const timeframe = TIMEFRAMES.find((t) => t.id === selectedTimeframe);

    const estimatedWeeks = goal?.weeks || 8;
    const difficulty = timeframe?.difficulty || 'medium';

    // Generate milestones based on goal and focus areas
    const milestones: Milestone[] = [];

    if (selectedGoal === 'expand-range') {
      milestones.push(
        { id: 'm1', title: 'Establish Baseline', description: 'Document current vocal range', weekNumber: 1 },
        { id: 'm2', title: 'Lower Register Work', description: 'Expand lower range by 2-3 notes', weekNumber: 3 },
        { id: 'm3', title: 'Upper Register Work', description: 'Expand upper range by 2-3 notes', weekNumber: 5 },
        { id: 'm4', title: 'Full Range Integration', description: 'Smooth transitions across full range', weekNumber: 7 },
      );
    } else if (selectedGoal === 'improve-control') {
      milestones.push(
        { id: 'm1', title: 'Pitch Matching Basics', description: 'Match single notes accurately', weekNumber: 1 },
        { id: 'm2', title: 'Interval Training', description: 'Navigate intervals confidently', weekNumber: 3 },
        { id: 'm3', title: 'Scale Mastery', description: 'Execute scales with precision', weekNumber: 5 },
      );
    } else if (selectedGoal === 'record-song') {
      milestones.push(
        { id: 'm1', title: 'Song Selection', description: 'Choose song matching your range', weekNumber: 1 },
        { id: 'm2', title: 'Learn Melody', description: 'Master song melody and phrasing', weekNumber: 2 },
        { id: 'm3', title: 'First Recording', description: 'Complete first full take', weekNumber: 3 },
        { id: 'm4', title: 'Final Production', description: 'Polish and finalize recording', weekNumber: 4 },
      );
    } else if (selectedGoal === 'build-confidence') {
      milestones.push(
        { id: 'm1', title: 'Comfortable Foundation', description: 'Build technical confidence', weekNumber: 1 },
        { id: 'm2', title: 'Performance Practice', description: 'Practice performing songs', weekNumber: 4 },
        { id: 'm3', title: 'Record Performances', description: 'Review and improve recordings', weekNumber: 8 },
        { id: 'm4', title: 'Showcase Ready', description: 'Ready for live performance', weekNumber: 12 },
      );
    }

    return {
      id: `journey_${Date.now()}`,
      name: goal?.label || 'Custom Journey',
      goal: selectedGoal || '',
      timeframe: timeframe?.label || '30 min/day',
      focusAreas,
      difficulty,
      estimatedWeeks,
      milestones,
    };
  };

  const handleComplete = () => {
    const journey = generateJourney();
    if (onComplete) {
      onComplete(journey);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedGoal !== null;
    if (currentStep === 2) return selectedTimeframe !== null;
    if (currentStep === 3) return focusAreas.length > 0;
    return true;
  };

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.progressDot} ${i <= currentStep ? styles.active : ''}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h2>{step.title}</h2>
        <p>{step.description}</p>

        {/* Welcome Step */}
        {currentStep === 0 && vocalProfile && (
          <div className={styles.welcome}>
            <div className={styles.profileSummary}>
              <h3>Your Vocal Profile</h3>
              <div className={styles.profileStats}>
                <div className={styles.profileStat}>
                  <span className={styles.label}>Skill Level</span>
                  <span className={styles.value}>{vocalProfile.skillLevel}</span>
                </div>
                <div className={styles.profileStat}>
                  <span className={styles.label}>Vocal Range</span>
                  <span className={styles.value}>
                    {vocalProfile.lowestNote} - {vocalProfile.highestNote}
                  </span>
                </div>
                <div className={styles.profileStat}>
                  <span className={styles.label}>Pitch Accuracy</span>
                  <span className={styles.value}>{vocalProfile.pitchAccuracy.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {vocalProfile.strengths.length > 0 && (
              <div className={styles.insights}>
                <h4>Your Strengths</h4>
                <ul>
                  {vocalProfile.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {vocalProfile.areasToImprove.length > 0 && (
              <div className={styles.insights}>
                <h4>Growth Opportunities</h4>
                <ul>
                  {vocalProfile.areasToImprove.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Goal Selection */}
        {currentStep === 1 && (
          <div className={styles.goalGrid}>
            {GOALS.map((goal) => {
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  className={`${styles.goalCard} ${selectedGoal === goal.id ? styles.selected : ''}`}
                  onClick={() => setSelectedGoal(goal.id)}
                >
                  <Icon size={32} />
                  <span className={styles.goalLabel}>{goal.label}</span>
                  <span className={styles.goalWeeks}>~{goal.weeks} weeks</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Timeframe Selection */}
        {currentStep === 2 && (
          <div className={styles.timeframeList}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                className={`${styles.timeframeCard} ${selectedTimeframe === tf.id ? styles.selected : ''}`}
                onClick={() => setSelectedTimeframe(tf.id)}
              >
                <Clock size={24} />
                <div className={styles.timeframeInfo}>
                  <span className={styles.timeframeLabel}>{tf.label}</span>
                  <span className={styles.timeframeHours}>~{tf.hours} hours/week</span>
                </div>
                <span className={`${styles.difficultyBadge} ${styles[tf.difficulty]}`}>
                  {tf.difficulty}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Focus Areas */}
        {currentStep === 3 && (
          <div className={styles.focusGrid}>
            {FOCUS_AREAS.map((area) => (
              <button
                key={area.id}
                className={`${styles.focusCard} ${focusAreas.includes(area.id) ? styles.selected : ''}`}
                onClick={() => toggleFocusArea(area.id)}
              >
                {area.label}
              </button>
            ))}
          </div>
        )}

        {/* Journey Preview */}
        {currentStep === 4 && (
          <div className={styles.preview}>
            <div className={styles.journeyCard}>
              <h3>{GOALS.find((g) => g.id === selectedGoal)?.label}</h3>

              <div className={styles.journeyInfo}>
                <div className={styles.infoItem}>
                  <Clock size={16} />
                  <span>{TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.label}</span>
                </div>
                <div className={styles.infoItem}>
                  <Target size={16} />
                  <span>{GOALS.find((g) => g.id === selectedGoal)?.weeks} weeks</span>
                </div>
              </div>

              <div className={styles.focusList}>
                <h4>Focus Areas</h4>
                <div className={styles.focusTags}>
                  {focusAreas.map((areaId) => {
                    const area = FOCUS_AREAS.find((a) => a.id === areaId);
                    return (
                      <span key={areaId} className={styles.focusTag}>
                        {area?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className={styles.milestones}>
                <h4>Your Roadmap</h4>
                {generateJourney().milestones.map((milestone) => (
                  <div key={milestone.id} className={styles.milestone}>
                    <div className={styles.milestoneWeek}>Week {milestone.weekNumber}</div>
                    <div className={styles.milestoneContent}>
                      <div className={styles.milestoneTitle}>{milestone.title}</div>
                      <div className={styles.milestoneDesc}>{milestone.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className={styles.startBtn} onClick={handleComplete}>
                Start Your Journey
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button
          className={styles.navBtn}
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        {currentStep < WIZARD_STEPS.length - 1 && (
          <button
            className={styles.navBtn}
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
