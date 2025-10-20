'use client';

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { getEventBus } from '$lib/../core/eventBus';
import type { Metric } from '$lib/../core/metricsCollector';
import styles from './MetricsDashboard.module.css';

import { logger } from '$lib/utils/logger';
interface MetricsDashboardProps {
  refreshInterval?: number;
}

interface MetricCard {
  title: string;
  value: string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  icon: any;
}

export function MetricsDashboard({ refreshInterval = 30000 }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventBus = getEventBus({ mode: 'gitops', agentName: 'metrics-dashboard' });

    const initEventBus = async () => {
      try {
        await eventBus.connect();
        setIsConnected(true);

        // Subscribe to metrics.tick events
        eventBus.subscribe('metrics.tick', (envelope) => {
          const payload = envelope.payload;
          setMetrics(payload.metrics || []);
          setLastUpdate(envelope.ts);
        });
      } catch (error) {
        logger.error('[MetricsDashboard] Failed to connect to event bus:', error);
      }
    };

    initEventBus();

    return () => {
      eventBus.disconnect();
    };
  }, []);

  const getMetricValue = (name: string): Metric | undefined => {
    return metrics.find((m) => m.name === name);
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'milliseconds') {
      if (value < 1000) return `${value.toFixed(0)}ms`;
      return `${(value / 1000).toFixed(2)}s`;
    }
    if (unit === 'seconds') {
      if (value < 60) return `${value.toFixed(1)}s`;
      if (value < 3600) return `${(value / 60).toFixed(1)}m`;
      return `${(value / 3600).toFixed(1)}h`;
    }
    if (unit === 'count') {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  };

  const getMetricStatus = (name: string, value: number): 'good' | 'warning' | 'critical' => {
    // Journey completion rate
    if (name === 'journey.completion_rate') {
      if (value >= 70) return 'good';
      if (value >= 50) return 'warning';
      return 'critical';
    }

    // Feedback latency
    if (name === 'feedback.latency_ms_avg') {
      if (value <= 100) return 'good';
      if (value <= 500) return 'warning';
      return 'critical';
    }

    // Errors
    if (name === 'errors.total') {
      if (value === 0) return 'good';
      if (value <= 5) return 'warning';
      return 'critical';
    }

    return 'good';
  };

  const cards: MetricCard[] = [
    {
      title: 'Journey Completion Rate',
      value: formatValue(getMetricValue('journey.completion_rate')?.value || 0, 'percent'),
      unit: '',
      status: getMetricStatus(
        'journey.completion_rate',
        getMetricValue('journey.completion_rate')?.value || 0
      ),
      icon: TrendingUp,
    },
    {
      title: 'AI Feedback Latency',
      value: formatValue(getMetricValue('feedback.latency_ms_avg')?.value || 0, 'milliseconds'),
      unit: 'avg',
      status: getMetricStatus(
        'feedback.latency_ms_avg',
        getMetricValue('feedback.latency_ms_avg')?.value || 0
      ),
      icon: Clock,
    },
    {
      title: 'Active Journeys',
      value: formatValue(
        (getMetricValue('journey.starts')?.value || 0) -
          (getMetricValue('journey.completions')?.value || 0) -
          (getMetricValue('journey.abandons')?.value || 0),
        'count'
      ),
      unit: '',
      status: 'good',
      icon: Activity,
    },
    {
      title: 'Total Errors',
      value: formatValue(getMetricValue('errors.total')?.value || 0, 'count'),
      unit: '',
      status: getMetricStatus('errors.total', getMetricValue('errors.total')?.value || 0),
      icon: AlertCircle,
    },
  ];

  const formatLastUpdate = (timestamp: string): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Activity size={16} />
          <span>System Metrics</span>
        </div>
        <div className={styles.status}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : ''}`} />
          <span>{formatLastUpdate(lastUpdate)}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.cards}>
        {cards.map((card) => {
          const Icon = card.icon;
          const statusColor =
            card.status === 'good' ? '#4aff4a' : card.status === 'warning' ? '#ffa500' : '#ff4444';

          return (
            <div key={card.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <Icon size={18} style={{ color: statusColor }} />
                <span className={styles.cardTitle}>{card.title}</span>
              </div>
              <div className={styles.cardValue}>
                <span className={styles.value} style={{ color: statusColor }}>
                  {card.value}
                </span>
                {card.unit && <span className={styles.unit}>{card.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Metrics Table */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>Detailed Metrics</div>
        <div className={styles.table}>
          {metrics.length === 0 ? (
            <div className={styles.empty}>
              <Activity size={24} className={styles.emptyIcon} />
              <p>Waiting for metrics...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((metric) => (
                    <tr key={metric.name}>
                      <td className={styles.metricName}>{metric.name}</td>
                      <td className={styles.metricValue}>
                        {formatValue(metric.value, metric.unit)}
                      </td>
                      <td className={styles.metricUnit}>{metric.unit}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className={styles.footer}>
        <div className={styles.footerStat}>
          <span className={styles.label}>Total Metrics:</span>
          <span className={styles.value}>{metrics.length}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.label}>Status:</span>
          <span className={`${styles.value} ${isConnected ? styles.good : styles.critical}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}
