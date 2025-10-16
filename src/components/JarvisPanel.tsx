import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface VitalityData {
  vitalityIndex: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recentActions: number;
  errorRate: number;
  timestamp?: string;
}

interface Recommendation {
  id: string;
  type: 'feature_suggestion' | 'workflow_optimization' | 'error_prevention' |
        'performance_improvement' | 'learning_opportunity' | 'proactive_maintenance' | 'usage_insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    endpoint: string;
    parameters?: Record<string, any>;
  };
  estimatedImpact?: string;
  createdAt: string;
}

interface Action {
  id: string;
  moduleName: string;
  actionType: string;
  clearanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  createdAt: string;
}

export function JarvisPanel() {
  const [vitality, setVitality] = useState<VitalityData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchJarvisData();
    const interval = setInterval(fetchJarvisData, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchJarvisData() {
    try {
      const [vitalityRes, actionsRes] = await Promise.all([
        apiClient.get('/jarvis/desktop/quick-vitality').catch(() => ({ data: null })),
        apiClient.get('/jarvis/actions?status=pending').catch(() => ({ data: { actions: [] } }))
      ]);

      setVitality(vitalityRes.data);
      // Recommendations endpoint requires desktop sessionId, not available in web context
      setRecommendations([]);
      setPendingActions(actionsRes.data.actions?.filter((a: Action) => a.clearanceLevel === 'HIGH') || []);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Jarvis data:', err);
      setError('Unable to connect to Jarvis');
      setLoading(false);
    }
  }

  async function approveAction(actionId: string) {
    try {
      await apiClient.post(`/jarvis/actions/${actionId}/approve`);
      await fetchJarvisData(); // Refresh
    } catch (err) {
      console.error('Failed to approve action:', err);
    }
  }

  async function rejectAction(actionId: string) {
    try {
      await apiClient.post(`/jarvis/actions/${actionId}/reject`, {
        reason: 'Rejected by user via AI DAWG UI'
      });
      await fetchJarvisData(); // Refresh
    } catch (err) {
      console.error('Failed to reject action:', err);
    }
  }

  async function dismissRecommendation(recId: string) {
    setRecommendations(recs => recs.filter(r => r.id !== recId));
  }

  if (loading) {
    return (
      <div className="jarvis-panel loading">
        <div className="loading-spinner"></div>
        <p>Connecting to Jarvis...</p>
      </div>
    );
  }

  if (error && !vitality) {
    return (
      <div className="jarvis-panel error">
        <div className="error-icon">⚠️</div>
        <h3>Jarvis Offline</h3>
        <p>{error}</p>
        <button onClick={fetchJarvisData}>Retry</button>
      </div>
    );
  }

  // Guard against null vitality
  if (!vitality) {
    return (
      <div className="jarvis-panel error">
        <div className="error-icon">⚠️</div>
        <h3>No Vitality Data</h3>
        <p>Unable to fetch Jarvis vitality data</p>
        <button onClick={fetchJarvisData}>Retry</button>
      </div>
    );
  }

  // Safe property access with defaults
  const safeVitality = {
    vitalityIndex: vitality.vitalityIndex ?? 0,
    status: vitality.status ?? 'unknown',
    recentActions: vitality.recentActions ?? 0,
    errorRate: vitality.errorRate ?? 0
  };

  const vitalityColor =
    safeVitality.vitalityIndex >= 80 ? '#10b981' :
    safeVitality.vitalityIndex >= 60 ? '#3b82f6' :
    safeVitality.vitalityIndex >= 40 ? '#f59e0b' :
    safeVitality.vitalityIndex >= 20 ? '#ef4444' : '#991b1b';

  const vitalityEmoji =
    safeVitality.status === 'excellent' ? '🚀' :
    safeVitality.status === 'good' ? '✅' :
    safeVitality.status === 'fair' ? '⚡' :
    safeVitality.status === 'poor' ? '⚠️' : '🔴';

  return (
    <div className={`jarvis-panel ${expanded ? 'expanded' : ''}`}>
      {/* Header with collapse toggle */}
      <div className="jarvis-header" onClick={() => setExpanded(!expanded)}>
        <h3>🤖 Jarvis AI Assistant</h3>
        <button className="expand-toggle">{expanded ? '−' : '+'}</button>
      </div>

      {/* Vitality Card - Always visible */}
      <div className="vitality-card" style={{ borderColor: vitalityColor }}>
        <div className="vitality-icon">{vitalityEmoji}</div>
        <div className="vitality-content">
          <div className="vitality-score" style={{ color: vitalityColor }}>
            {safeVitality.vitalityIndex.toFixed(1)}/100
          </div>
          <div className="vitality-status">{safeVitality.status}</div>
        </div>
        <div className="vitality-stats">
          <div className="stat">
            <span className="stat-label">Actions</span>
            <span className="stat-value">{safeVitality.recentActions}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Errors</span>
            <span className="stat-value" style={{
              color: safeVitality.errorRate > 5 ? '#ef4444' : '#10b981'
            }}>
              {safeVitality.errorRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* Pending HIGH Clearance Actions */}
          {pendingActions.length > 0 && (
            <div className="pending-actions">
              <h4>🔴 Actions Requiring Approval</h4>
              {pendingActions.map(action => (
                <div key={action.id} className="action-card high-clearance">
                  <div className="action-header">
                    <span className="clearance-badge high">HIGH</span>
                    <span className="module-badge">{action.moduleName}</span>
                  </div>
                  <h5>{action.title}</h5>
                  <p>{action.description}</p>
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => approveAction(action.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectAction(action.id)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations">
              <h4>💡 AI Recommendations</h4>
              {recommendations.map(rec => (
                <div key={rec.id} className={`recommendation priority-${rec.priority}`}>
                  <div className="rec-header">
                    <span className={`priority-badge ${rec.priority}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <button
                      className="dismiss-btn"
                      onClick={() => dismissRecommendation(rec.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <h5>{rec.title}</h5>
                  <p>{rec.description}</p>
                  {rec.estimatedImpact && (
                    <div className="rec-impact">
                      <strong>Impact:</strong> {rec.estimatedImpact}
                    </div>
                  )}
                  {rec.actionable && rec.action && (
                    <button className="rec-action-btn">
                      {rec.action.label} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <div className="quick-links">
            <a
              href="https://chat.openai.com/g/YOUR_GPT_ID"
              target="_blank"
              rel="noopener noreferrer"
              className="quick-link"
            >
              <span>💬</span>
              <span>Open Jarvis GPT</span>
            </a>
            <button
              className="quick-link"
              onClick={() => window.location.hash = '#jarvis-analytics'}
            >
              <span>📊</span>
              <span>View Analytics</span>
            </button>
          </div>
        </>
      )}

      {/* Refresh indicator */}
      <div className="refresh-indicator">
        <span className="refresh-dot"></span>
        <span className="refresh-text">Live</span>
      </div>
    </div>
  );
}
