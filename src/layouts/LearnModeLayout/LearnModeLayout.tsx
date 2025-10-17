'use client';

import { useState } from 'react';
import { GraduationCap, Target, BookOpen, TrendingUp, Play } from 'lucide-react';
import styles from './LearnModeLayout.module.css';

interface LearnModeLayoutProps {
  journeyId?: string;
  userId?: string;
}

type LearningView = 'journey' | 'practice' | 'lessons' | 'progress';

export function LearnModeLayout({ journeyId, userId }: LearnModeLayoutProps) {
  const [activeView, setActiveView] = useState<LearningView>('journey');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <GraduationCap size={24} />
          <div className={styles.headerTitle}>
            <h1>Learn Mode</h1>
            <p>Your vocal training journey</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Status indicators can be added here */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeView === 'journey' ? styles.active : ''}`}
          onClick={() => setActiveView('journey')}
        >
          <Target size={18} />
          <span>Your Journey</span>
        </button>
        <button
          className={`${styles.tab} ${activeView === 'practice' ? styles.active : ''}`}
          onClick={() => setActiveView('practice')}
        >
          <Play size={18} />
          <span>Practice</span>
        </button>
        <button
          className={`${styles.tab} ${activeView === 'lessons' ? styles.active : ''}`}
          onClick={() => setActiveView('lessons')}
        >
          <BookOpen size={18} />
          <span>Lessons</span>
        </button>
        <button
          className={`${styles.tab} ${activeView === 'progress' ? styles.active : ''}`}
          onClick={() => setActiveView('progress')}
        >
          <TrendingUp size={18} />
          <span>Progress</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {activeView === 'journey' && (
          <div className={styles.journeyView}>
            {/* Journey Timeline */}
            <div className={styles.section}>
              <h2>Your Current Journey</h2>
              <div className={styles.journeyCard}>
                <div className={styles.journeyHeader}>
                  <h3>Record Your First Song</h3>
                  <div className={styles.journeyProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '45%' }} />
                    </div>
                    <span>45% Complete</span>
                  </div>
                </div>

                <div className={styles.milestones}>
                  <div className={`${styles.milestone} ${styles.completed}`}>
                    <div className={styles.milestoneIcon}>✓</div>
                    <div className={styles.milestoneContent}>
                      <h4>Week 1: Vocal Assessment</h4>
                      <p>Complete vocal range and skill evaluation</p>
                    </div>
                  </div>

                  <div className={`${styles.milestone} ${styles.completed}`}>
                    <div className={styles.milestoneIcon}>✓</div>
                    <div className={styles.milestoneContent}>
                      <h4>Week 2: Song Selection</h4>
                      <p>Choose a song that matches your range</p>
                    </div>
                  </div>

                  <div className={`${styles.milestone} ${styles.current}`}>
                    <div className={styles.milestoneIcon}>→</div>
                    <div className={styles.milestoneContent}>
                      <h4>Week 3: Melody Practice</h4>
                      <p>Master the melody with pitch accuracy</p>
                      <button className={styles.continueBtn}>Continue Practice</button>
                    </div>
                  </div>

                  <div className={styles.milestone}>
                    <div className={styles.milestoneIcon}>○</div>
                    <div className={styles.milestoneContent}>
                      <h4>Week 4: Recording & Production</h4>
                      <p>Record multiple takes and create final mix</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Next */}
            <div className={styles.section}>
              <h2>Recommended Next</h2>
              <div className={styles.recommendedGrid}>
                <div className={styles.recommendedCard}>
                  <div className={styles.recommendedIcon}>🎵</div>
                  <h4>Pitch Accuracy Drill</h4>
                  <p>15 min • Beginner</p>
                  <button className={styles.startBtn}>Start</button>
                </div>

                <div className={styles.recommendedCard}>
                  <div className={styles.recommendedIcon}>🎤</div>
                  <h4>Breath Control Exercise</h4>
                  <p>10 min • Intermediate</p>
                  <button className={styles.startBtn}>Start</button>
                </div>

                <div className={styles.recommendedCard}>
                  <div className={styles.recommendedIcon}>🎶</div>
                  <h4>Melody Memory Game</h4>
                  <p>20 min • Fun</p>
                  <button className={styles.startBtn}>Start</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'practice' && (
          <div className={styles.practiceView}>
            <div className={styles.section}>
              <h2>Daily Practice Session</h2>
              <div className={styles.practiceContainer}>
                <div className={styles.practiceCard}>
                  <h3>Today's Focus: Pitch Accuracy</h3>
                  <p>Let's work on hitting notes precisely. We'll start with scales and move to melodic phrases.</p>

                  <div className={styles.sessionPlan}>
                    <div className={styles.sessionStep}>
                      <span className={styles.stepNumber}>1</span>
                      <div>
                        <h4>Warmup Scales</h4>
                        <p>5 minutes • C Major Scale</p>
                      </div>
                    </div>

                    <div className={styles.sessionStep}>
                      <span className={styles.stepNumber}>2</span>
                      <div>
                        <h4>Pitch Matching</h4>
                        <p>10 minutes • Match target notes</p>
                      </div>
                    </div>

                    <div className={styles.sessionStep}>
                      <span className={styles.stepNumber}>3</span>
                      <div>
                        <h4>Song Practice</h4>
                        <p>15 minutes • "Your Song" chorus section</p>
                      </div>
                    </div>
                  </div>

                  <button className={styles.startSessionBtn}>Start 30-Minute Session</button>
                </div>

                <div className={styles.quickPractice}>
                  <h3>Quick Practice (5-10 min)</h3>
                  <div className={styles.quickOptions}>
                    <button className={styles.quickOption}>
                      <span>🎵</span>
                      <span>Warmup Scales</span>
                    </button>
                    <button className={styles.quickOption}>
                      <span>🎤</span>
                      <span>Breath Exercise</span>
                    </button>
                    <button className={styles.quickOption}>
                      <span>🎶</span>
                      <span>Interval Training</span>
                    </button>
                    <button className={styles.quickOption}>
                      <span>🎸</span>
                      <span>Free Practice</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'lessons' && (
          <div className={styles.lessonsView}>
            <div className={styles.section}>
              <h2>Vocal Technique Lessons</h2>
              <div className={styles.lessonCategories}>
                <div className={styles.category}>
                  <h3>Fundamentals</h3>
                  <div className={styles.lessonList}>
                    <div className={`${styles.lesson} ${styles.completed}`}>
                      <div className={styles.lessonIcon}>✓</div>
                      <div>
                        <h4>Proper Breathing Technique</h4>
                        <p>Learn diaphragmatic breathing</p>
                      </div>
                      <span className={styles.duration}>8 min</span>
                    </div>

                    <div className={`${styles.lesson} ${styles.completed}`}>
                      <div className={styles.lessonIcon}>✓</div>
                      <div>
                        <h4>Understanding Vocal Range</h4>
                        <p>Identify your vocal range</p>
                      </div>
                      <span className={styles.duration}>12 min</span>
                    </div>

                    <div className={`${styles.lesson} ${styles.current}`}>
                      <div className={styles.lessonIcon}>→</div>
                      <div>
                        <h4>Pitch Accuracy Basics</h4>
                        <p>Match notes and stay in tune</p>
                      </div>
                      <span className={styles.duration}>15 min</span>
                    </div>

                    <div className={styles.lesson}>
                      <div className={styles.lessonIcon}>○</div>
                      <div>
                        <h4>Vocal Health & Care</h4>
                        <p>Protect your voice</p>
                      </div>
                      <span className={styles.duration}>10 min</span>
                    </div>
                  </div>
                </div>

                <div className={styles.category}>
                  <h3>Technique</h3>
                  <div className={styles.lessonList}>
                    <div className={styles.lesson}>
                      <div className={styles.lessonIcon}>🔒</div>
                      <div>
                        <h4>Vibrato Control</h4>
                        <p>Add expression to your singing</p>
                      </div>
                      <span className={styles.duration}>18 min</span>
                    </div>

                    <div className={styles.lesson}>
                      <div className={styles.lessonIcon}>🔒</div>
                      <div>
                        <h4>Mix Voice Development</h4>
                        <p>Blend chest and head voice</p>
                      </div>
                      <span className={styles.duration}>20 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'progress' && (
          <div className={styles.progressView}>
            <div className={styles.section}>
              <h2>Your Progress</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Practice Time</h3>
                  <div className={styles.statValue}>12.5</div>
                  <div className={styles.statUnit}>hours this month</div>
                </div>

                <div className={styles.statCard}>
                  <h3>Pitch Accuracy</h3>
                  <div className={styles.statValue}>87%</div>
                  <div className={styles.statChange}>+12% from last month</div>
                </div>

                <div className={styles.statCard}>
                  <h3>Vocal Range</h3>
                  <div className={styles.statValue}>A2 - D5</div>
                  <div className={styles.statChange}>+3 semitones</div>
                </div>

                <div className={styles.statCard}>
                  <h3>Lessons Completed</h3>
                  <div className={styles.statValue}>8/24</div>
                  <div className={styles.statUnit}>Fundamentals track</div>
                </div>
              </div>

              {/* Milestones section can be added here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
