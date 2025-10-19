/**
 * Expert Music AI Service Status Indicator
 *
 * Displays real-time status of Expert Music AI service
 * Shows circuit breaker state and provides helpful information
 */

import React, { useState, useEffect } from 'react';

export interface ServiceHealthMetrics {
  status: 'up' | 'down' | 'degraded' | 'circuit_open';
  circuitState: 'closed' | 'open' | 'half_open';
  consecutiveFailures: number;
  uptimePercentage: string;
  lastCheckTime: string;
  lastSuccessTime: string | null;
  lastFailureTime: string | null;
}

export interface ServiceHealthResponse {
  success: boolean;
  metrics: ServiceHealthMetrics;
  queuedRequests: number;
}

interface ExpertMusicStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  onStatusChange?: (status: string) => void;
}

export const ExpertMusicStatusIndicator: React.FC<ExpertMusicStatusIndicatorProps> = ({
  showDetails = false,
  compact = false,
  onStatusChange,
}) => {
  const [health, setHealth] = useState<ServiceHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthStatus();

    // Poll health status every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (health && onStatusChange) {
      onStatusChange(health.metrics.status);
    }
  }, [health, onStatusChange]);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/expert-music/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health status');
      }
      const data: ServiceHealthResponse = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError('Unable to check service status');
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'circuit_open':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'up':
        return 'Online';
      case 'down':
        return 'Offline';
      case 'degraded':
        return 'Degraded';
      case 'circuit_open':
        return 'Circuit Open';
      default:
        return 'Unknown';
    }
  };

  const getStatusMessage = (status: string, circuitState: string): string => {
    if (status === 'circuit_open') {
      return 'Service temporarily blocked due to repeated failures. Requests will resume automatically.';
    }
    if (status === 'down') {
      return 'Service is currently unavailable. Please try alternative services.';
    }
    if (status === 'degraded') {
      return 'Service is experiencing issues. Performance may be reduced.';
    }
    return 'Service is operating normally.';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm">Checking service status...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-sm">Status unavailable</span>
      </div>
    );
  }

  const { metrics, queuedRequests } = health;

  if (compact) {
    return (
      <div className="flex items-center space-x-2" title={getStatusMessage(metrics.status, metrics.circuitState)}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.status)} ${metrics.status === 'up' ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium">{getStatusText(metrics.status)}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(metrics.status)} ${metrics.status === 'up' ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Expert Music AI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getStatusText(metrics.status)}
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealthStatus}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {getStatusMessage(metrics.status, metrics.circuitState)}
      </p>

      {showDetails && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Uptime:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {metrics.uptimePercentage}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Circuit State:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {metrics.circuitState.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {metrics.consecutiveFailures > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Consecutive Failures:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {metrics.consecutiveFailures}
              </span>
            </div>
          )}

          {queuedRequests > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Queued Requests:</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {queuedRequests}
              </span>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Last Check:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {new Date(metrics.lastCheckTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {metrics.status !== 'up' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Alternatives:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use Udio or Suno for music generation</li>
            <li>• Queue request for automatic retry</li>
            <li>• Check back in a few minutes</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExpertMusicStatusIndicator;
