'use client';

import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, Clock, Cpu, HelpCircle } from 'lucide-react';
import type { AgentCoordinationState } from '$lib/../core/agentCoordination';
import styles from './AgentStatusBoard.module.css';

import { logger } from '$lib/utils/logger';
export function AgentStatusBoard() {
  const [state, setState] = useState<AgentCoordinationState | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadState = async () => {
    try {
      const response = await fetch('/_bus/state/agent-status.json');
      const data = await response.json();
      setState(data);
      setIsLoading(false);
    } catch (error) {
      logger.error('[AgentStatusBoard] Failed to load state:', error);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4aff4a';
      case 'idle':
        return '#ffa500';
      case 'blocked':
        return '#ff4444';
      case 'offline':
        return '#666';
      default:
        return '#888';
    }
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy':
        return '#4aff4a';
      case 'degraded':
        return '#ffa500';
      case 'critical':
        return '#ff4444';
      default:
        return '#888';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'low':
        return '#4a9eff';
      case 'medium':
        return '#ffa500';
      case 'high':
        return '#ff9f4a';
      case 'critical':
        return '#ff4444';
      default:
        return '#888';
    }
  };

  const formatTimeSince = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading || !state) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Clock size={32} />
          <p>Loading agent status...</p>
        </div>
      </div>
    );
  }

  const selectedAgentData = selectedAgent
    ? state.agents.find((a) => a.id === selectedAgent)
    : null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Users size={18} />
          <span>Agent Status Board</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.statBadge}>
            <span className={styles.statValue}>{state.agents.length}</span>
            <span className={styles.statLabel}>Agents</span>
          </div>
          <div className={styles.statBadge}>
            <span
              className={styles.statValue}
              style={{ color: state.help_requests.filter((r) => !r.resolved).length > 0 ? '#ff4444' : '#4aff4a' }}
            >
              {state.help_requests.filter((r) => !r.resolved).length}
            </span>
            <span className={styles.statLabel}>Help Requests</span>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statValue}>{state.resource_pool.utilization_percent}%</span>
            <span className={styles.statLabel}>Utilization</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Agent Grid */}
        <div className={styles.agentGrid}>
          {state.agents.map((agent) => (
            <button
              key={agent.id}
              className={`${styles.agentCard} ${selectedAgent === agent.id ? styles.selected : ''}`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <div className={styles.agentHeader}>
                <div className={styles.agentName}>
                  <div
                    className={styles.statusDot}
                    style={{ backgroundColor: getStatusColor(agent.status) }}
                  />
                  <span>{agent.name}</span>
                </div>
                <div className={styles.agentBadges}>
                  {agent.needs_help && (
                    <div className={styles.badge} style={{ background: '#ff4444' }}>
                      <HelpCircle size={12} />
                    </div>
                  )}
                  {agent.available_to_help && !agent.needs_help && (
                    <div className={styles.badge} style={{ background: '#4aff4a' }}>
                      <CheckCircle size={12} />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.agentRole}>{agent.role}</div>
              <div className={styles.agentTask}>{agent.current_task}</div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${agent.progress}%` }}
                />
                <span className={styles.progressText}>{agent.progress}%</span>
              </div>

              <div className={styles.resourceBar}>
                <Cpu size={12} />
                <div className={styles.resourceFill}>
                  <div
                    className={styles.resourceUsed}
                    style={{
                      width: `${agent.computational_resources.cpu_usage}%`,
                      backgroundColor: '#4a9eff',
                    }}
                  />
                </div>
                <span className={styles.resourceText}>
                  {agent.computational_resources.available_capacity}% free
                </span>
              </div>

              <div className={styles.agentFooter}>
                <div
                  className={styles.healthBadge}
                  style={{ color: getHealthColor(agent.health) }}
                >
                  {agent.health}
                </div>
                <div className={styles.lastUpdate}>{formatTimeSince(agent.last_update)}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Details Panel */}
        {selectedAgentData && (
          <div className={styles.detailsPanel}>
            <div className={styles.detailsHeader}>
              <h3>{selectedAgentData.name}</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedAgent(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.detailsContent}>
              <div className={styles.detailSection}>
                <h4>Capabilities</h4>
                <div className={styles.capabilityTags}>
                  {selectedAgentData.capabilities.map((cap) => (
                    <span key={cap} className={styles.capabilityTag}>
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Current Status</h4>
                <div className={styles.statusGrid}>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Status:</span>
                    <span
                      className={styles.statusValue}
                      style={{ color: getStatusColor(selectedAgentData.status) }}
                    >
                      {selectedAgentData.status}
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Health:</span>
                    <span
                      className={styles.statusValue}
                      style={{ color: getHealthColor(selectedAgentData.health) }}
                    >
                      {selectedAgentData.health}
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Needs Help:</span>
                    <span className={styles.statusValue}>
                      {selectedAgentData.needs_help ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <span className={styles.statusLabel}>Available:</span>
                    <span className={styles.statusValue}>
                      {selectedAgentData.available_to_help ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Resources</h4>
                <div className={styles.resourceMetrics}>
                  <div className={styles.metric}>
                    <span>CPU Usage:</span>
                    <span>{selectedAgentData.computational_resources.cpu_usage}%</span>
                  </div>
                  <div className={styles.metric}>
                    <span>Memory Usage:</span>
                    <span>{selectedAgentData.computational_resources.memory_usage}%</span>
                  </div>
                  <div className={styles.metric}>
                    <span>Available Capacity:</span>
                    <span>{selectedAgentData.computational_resources.available_capacity}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Requests Section */}
      {state.help_requests.filter((r) => !r.resolved).length > 0 && (
        <div className={styles.helpSection}>
          <div className={styles.helpHeader}>
            <AlertCircle size={16} />
            <span>Open Help Requests</span>
          </div>
          <div className={styles.helpList}>
            {state.help_requests
              .filter((r) => !r.resolved)
              .map((request) => (
                <div key={request.id} className={styles.helpRequest}>
                  <div className={styles.helpRequestHeader}>
                    <div className={styles.requester}>{request.requester_name}</div>
                    <div
                      className={styles.urgencyBadge}
                      style={{ backgroundColor: getUrgencyColor(request.urgency) }}
                    >
                      {request.urgency}
                    </div>
                  </div>
                  <div className={styles.helpIssue}>{request.issue}</div>
                  {request.claimed_by && (
                    <div className={styles.claimedBy}>
                      Claimed by:{' '}
                      {state.agents.find((a) => a.id === request.claimed_by)?.name || 'Unknown'}
                    </div>
                  )}
                  <div className={styles.helpTime}>{formatTimeSince(request.created_at)}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Buddy Pairs */}
      {state.buddy_pairs.filter((p) => p.status === 'active').length > 0 && (
        <div className={styles.buddySection}>
          <div className={styles.buddyHeader}>
            <Users size={16} />
            <span>Active Buddy Pairs</span>
          </div>
          <div className={styles.buddyList}>
            {state.buddy_pairs
              .filter((p) => p.status === 'active')
              .map((pair, index) => {
                const primaryAgent = state.agents.find((a) => a.id === pair.primary);
                const buddyAgent = state.agents.find((a) => a.id === pair.buddy);

                return (
                  <div key={index} className={styles.buddyPair}>
                    <div className={styles.buddyNames}>
                      {primaryAgent?.name} ↔ {buddyAgent?.name}
                    </div>
                    <div className={styles.buddyFocus}>{pair.focus}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
