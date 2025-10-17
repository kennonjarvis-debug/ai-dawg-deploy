'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { getEventBus } from '@/src/core/eventBus';
import styles from './AIFeedbackTimeline.module.css';

interface AIFeedbackTimelineProps {
  recordingId?: string;
  journeyId?: string;
  maxItems?: number;
  filterTypes?: FeedbackType[];
}

type FeedbackType = 'coach' | 'comping' | 'mix' | 'master' | 'all';

interface FeedbackEvent {
  id: string;
  timestamp: string;
  type: FeedbackType;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

const FEEDBACK_TYPE_CONFIG = {
  coach: {
    label: 'Coach',
    icon: MessageSquare,
    color: '#4a9eff',
  },
  comping: {
    label: 'Comping',
    icon: TrendingUp,
    color: '#ff9f4a',
  },
  mix: {
    label: 'Mix',
    icon: CheckCircle,
    color: '#4aff9f',
  },
  master: {
    label: 'Master',
    icon: CheckCircle,
    color: '#9f4aff',
  },
};

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: '#4a9eff',
  },
  warning: {
    icon: AlertCircle,
    color: '#ffa500',
  },
  critical: {
    icon: AlertCircle,
    color: '#ff4444',
  },
  success: {
    icon: CheckCircle,
    color: '#4aff4a',
  },
};

export function AIFeedbackTimeline({
  recordingId,
  journeyId,
  maxItems = 50,
}: AIFeedbackTimelineProps) {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<FeedbackType>('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventBus = getEventBus({ mode: 'gitops', agentName: 'ai-feedback-timeline' });

    const initEventBus = async () => {
      try {
        await eventBus.connect();
        setIsConnected(true);

        // Subscribe to all AI feedback events
        eventBus.subscribe('coach.feedback', handleCoachFeedback);
        eventBus.subscribe('comping.suggestion', handleCompingSuggestion);
        eventBus.subscribe('mix.suggestion', handleMixSuggestion);
        eventBus.subscribe('master.completed', handleMasterCompleted);
      } catch (error) {
        console.error('[AIFeedbackTimeline] Failed to connect to event bus:', error);
      }
    };

    initEventBus();

    return () => {
      eventBus.disconnect();
    };
  }, []);

  const handleCoachFeedback = (envelope: any) => {
    const payload = envelope.payload;

    // Filter by recording/journey if specified
    if (recordingId && payload.recording_id !== recordingId) return;
    if (journeyId && payload.journey_id !== journeyId) return;

    const feedbackEvent: FeedbackEvent = {
      id: envelope.id,
      timestamp: envelope.ts,
      type: 'coach',
      severity: payload.severity || 'info',
      title: `Coach: ${payload.feedback_type}`,
      message: payload.message,
      metadata: {
        detected_issue: payload.detected_issue,
        timestamp_sec: payload.timestamp_sec,
      },
    };

    setEvents((prev) => [feedbackEvent, ...prev].slice(0, maxItems));
  };

  const handleCompingSuggestion = (envelope: any) => {
    const payload = envelope.payload;

    if (journeyId && payload.journey_id !== journeyId) return;

    const feedbackEvent: FeedbackEvent = {
      id: envelope.id,
      timestamp: envelope.ts,
      type: 'comping',
      severity: payload.confidence_score > 0.8 ? 'success' : 'info',
      title: 'Comping Suggestion',
      message: `AI analyzed ${payload.comparison_metrics ? Object.keys(payload.comparison_metrics).length : 0} takes`,
      metadata: {
        suggested_comp: payload.suggested_comp,
        confidence: payload.confidence_score,
      },
    };

    setEvents((prev) => [feedbackEvent, ...prev].slice(0, maxItems));
  };

  const handleMixSuggestion = (envelope: any) => {
    const payload = envelope.payload;

    if (journeyId && payload.journey_id !== journeyId) return;

    const feedbackEvent: FeedbackEvent = {
      id: envelope.id,
      timestamp: envelope.ts,
      type: 'mix',
      severity: 'success',
      title: 'Mix Suggestion Ready',
      message: `${payload.suggested_effects.length} effects suggested for ${payload.analysis_summary?.detected_genre || 'your track'}`,
      metadata: {
        effects: payload.suggested_effects,
        reference_track: payload.reference_track,
      },
    };

    setEvents((prev) => [feedbackEvent, ...prev].slice(0, maxItems));
  };

  const handleMasterCompleted = (envelope: any) => {
    const payload = envelope.payload;

    if (journeyId && payload.journey_id !== journeyId) return;

    const feedbackEvent: FeedbackEvent = {
      id: envelope.id,
      timestamp: envelope.ts,
      type: 'master',
      severity: payload.quality_report?.overall_score > 80 ? 'success' : 'warning',
      title: 'Mastering Complete',
      message: `Quality score: ${payload.quality_report?.overall_score}/100 • ${payload.achieved_loudness_lufs} LUFS`,
      metadata: {
        quality_report: payload.quality_report,
        metrics: payload.metrics,
      },
    };

    setEvents((prev) => [feedbackEvent, ...prev].slice(0, maxItems));
  };

  const filteredEvents = events.filter((event) => {
    if (activeFilter === 'all') return true;
    return event.type === activeFilter;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <MessageSquare size={16} />
          <span>AI Feedback Timeline</span>
        </div>
        <div className={styles.status}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : ''}`} />
          <span>{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        {Object.entries(FEEDBACK_TYPE_CONFIG).map(([type, config]) => (
          <button
            key={type}
            className={`${styles.filterBtn} ${activeFilter === type ? styles.active : ''}`}
            onClick={() => setActiveFilter(type as FeedbackType)}
            style={{ '--filter-color': config.color } as any}
          >
            <config.icon size={14} />
            {config.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {filteredEvents.length === 0 ? (
          <div className={styles.empty}>
            <Info size={32} className={styles.emptyIcon} />
            <p>No feedback events yet</p>
            <span className={styles.emptyHint}>
              {isConnected
                ? 'Start recording or practicing to see AI feedback'
                : 'Connecting to event bus...'}
            </span>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const typeConfig = FEEDBACK_TYPE_CONFIG[event.type as keyof typeof FEEDBACK_TYPE_CONFIG];
            const severityConfig = SEVERITY_CONFIG[event.severity];
            const TypeIcon = typeConfig.icon;
            const SeverityIcon = severityConfig.icon;

            return (
              <div key={event.id} className={styles.event}>
                {/* Timeline connector */}
                {index < filteredEvents.length - 1 && <div className={styles.connector} />}

                {/* Event marker */}
                <div
                  className={styles.marker}
                  style={{ backgroundColor: typeConfig.color }}
                >
                  <TypeIcon size={14} />
                </div>

                {/* Event content */}
                <div className={styles.eventContent}>
                  <div className={styles.eventHeader}>
                    <div className={styles.eventTitle}>
                      <SeverityIcon
                        size={14}
                        style={{ color: severityConfig.color }}
                      />
                      <span>{event.title}</span>
                    </div>
                    <div className={styles.eventTime}>
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>

                  <div className={styles.eventMessage}>{event.message}</div>

                  {/* Metadata (expandable) */}
                  {event.metadata && (
                    <details className={styles.eventDetails}>
                      <summary>Details</summary>
                      <pre className={styles.metadata}>
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats footer */}
      <div className={styles.footer}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Events:</span>
          <span className={styles.statValue}>{events.length}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Filtered:</span>
          <span className={styles.statValue}>{filteredEvents.length}</span>
        </div>
      </div>
    </div>
  );
}
