/**
 * ProgressReport Widget
 * Weekly and monthly improvement summaries
 * Visualize progress trends and insights
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './ProgressReport.module.css';

interface ProgressMetric {
  name: string;
  current: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  improvement: number; // percentage
}

interface WeeklyHighlight {
  id: string;
  type: 'achievement' | 'milestone' | 'improvement';
  title: string;
  description: string;
  date: Date;
}

interface ProgressReportProps {
  period?: 'week' | 'month';
  onExport?: () => void;
}

export function ProgressReport({ period = 'week', onExport }: ProgressReportProps) {
  const { data: session } = useSession();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>(period);
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [highlights, setHighlights] = useState<WeeklyHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Load progress data from localStorage or API
  useEffect(() => {
    if (!session) return;

    // Simulate loading progress data
    setTimeout(() => {
      const mockMetrics: ProgressMetric[] = [
        {
          name: 'Pitch Accuracy',
          current: 87,
          previous: 79,
          unit: '%',
          trend: 'up',
          improvement: 10.1,
        },
        {
          name: 'Practice Time',
          current: 245,
          previous: 198,
          unit: 'min',
          trend: 'up',
          improvement: 23.7,
        },
        {
          name: 'Vocal Range',
          current: 2.8,
          previous: 2.5,
          unit: 'octaves',
          trend: 'up',
          improvement: 12.0,
        },
        {
          name: 'Sessions Completed',
          current: 12,
          previous: 9,
          unit: '',
          trend: 'up',
          improvement: 33.3,
        },
        {
          name: 'Average Note Duration',
          current: 4.2,
          previous: 3.8,
          unit: 'sec',
          trend: 'up',
          improvement: 10.5,
        },
        {
          name: 'Error Rate',
          current: 8,
          previous: 14,
          unit: '%',
          trend: 'down',
          improvement: 42.9,
        },
      ];

      const mockHighlights: WeeklyHighlight[] = [
        {
          id: '1',
          type: 'achievement',
          title: 'Pitch Perfect',
          description: 'Achieved 90% pitch accuracy',
          date: new Date(Date.now() - 86400000),
        },
        {
          id: '2',
          type: 'improvement',
          title: 'Range Expansion',
          description: 'Added 3 semitones to upper range',
          date: new Date(Date.now() - 172800000),
        },
        {
          id: '3',
          type: 'milestone',
          title: '10 Sessions Streak',
          description: 'Completed 10 practice sessions',
          date: new Date(Date.now() - 259200000),
        },
      ];

      setMetrics(mockMetrics);
      setHighlights(mockHighlights);
      setLoading(false);
    }, 500);
  }, [session, selectedPeriod]);

  const getTrendIcon = (trend: ProgressMetric['trend']) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const getTrendColor = (metric: ProgressMetric) => {
    // For error rate, down is good
    if (metric.name === 'Error Rate') {
      return metric.trend === 'down' ? 'var(--success)' : 'var(--error)';
    }
    // For other metrics, up is good
    return metric.trend === 'up' ? 'var(--success)' : metric.trend === 'down' ? 'var(--error)' : 'var(--text-tertiary)';
  };

  const getHighlightIcon = (type: WeeklyHighlight['type']) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'milestone':
        return '🎯';
      case 'improvement':
        return '📈';
      default:
        return '✨';
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.noAuth}>
          <p>Sign in to view your progress reports</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Generating report...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Progress Report</h2>
        <div className={styles.controls}>
          <div className={styles.periodToggle}>
            <button
              className={`${styles.periodButton} ${selectedPeriod === 'week' ? styles.active : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              This Week
            </button>
            <button
              className={`${styles.periodButton} ${selectedPeriod === 'month' ? styles.active : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              This Month
            </button>
          </div>
          {onExport && (
            <button className={styles.exportButton} onClick={onExport}>
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {metrics.filter((m) => m.trend === 'up').length}
          </div>
          <div className={styles.summaryLabel}>Improvements</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {highlights.filter((h) => h.type === 'achievement').length}
          </div>
          <div className={styles.summaryLabel}>Achievements</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {Math.round(
              metrics.reduce((acc, m) => acc + m.improvement, 0) / metrics.length
            )}
            %
          </div>
          <div className={styles.summaryLabel}>Avg Growth</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Performance Metrics</h3>
        <div className={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <div key={index} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>{metric.name}</span>
                <span
                  className={styles.trendIcon}
                  style={{ color: getTrendColor(metric) }}
                >
                  {getTrendIcon(metric.trend)}
                </span>
              </div>

              <div className={styles.metricValue}>
                {metric.current}
                <span className={styles.unit}>{metric.unit}</span>
              </div>

              <div className={styles.metricComparison}>
                <span className={styles.previousValue}>
                  Previous: {metric.previous}
                  {metric.unit}
                </span>
                <span
                  className={styles.improvement}
                  style={{ color: getTrendColor(metric) }}
                >
                  {metric.improvement > 0 ? '+' : ''}
                  {metric.improvement.toFixed(1)}%
                </span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(metric.current, 100)}%`,
                    background: getTrendColor(metric),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>This {selectedPeriod === 'week' ? "Week's" : "Month's"} Highlights</h3>
        <div className={styles.highlightsList}>
          {highlights.length === 0 ? (
            <div className={styles.empty}>
              <p>No highlights yet. Keep practicing!</p>
            </div>
          ) : (
            highlights.map((highlight) => (
              <div key={highlight.id} className={styles.highlightCard}>
                <div className={styles.highlightIcon}>
                  {getHighlightIcon(highlight.type)}
                </div>
                <div className={styles.highlightContent}>
                  <div className={styles.highlightTitle}>{highlight.title}</div>
                  <div className={styles.highlightDescription}>
                    {highlight.description}
                  </div>
                  <div className={styles.highlightDate}>
                    {highlight.date.toLocaleDateString()}
                  </div>
                </div>
                <div className={styles.highlightType}>{highlight.type}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Insights */}
      <div className={styles.insights}>
        <h3 className={styles.sectionTitle}>AI Insights</h3>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}>💡</div>
          <div className={styles.insightText}>
            Your pitch accuracy improved by 10% this week! Focus on maintaining this
            consistency while extending your range.
          </div>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}>🎯</div>
          <div className={styles.insightText}>
            You're practicing 23% more than last week. Great commitment! Consider
            adding more breath control exercises to complement your volume work.
          </div>
        </div>
      </div>
    </div>
  );
}
