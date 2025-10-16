import React from 'react';
import { SessionStatus } from '../types';

interface StatusPillProps {
  status: SessionStatus;
  showLabel?: boolean;
}

const statusConfig: Record<SessionStatus, { color: string; label: string; dot: string }> = {
  connected: {
    color: 'bg-green-500',
    label: 'Connected',
    dot: 'animate-pulse',
  },
  idle: {
    color: 'bg-blue-500',
    label: 'Idle',
    dot: '',
  },
  busy: {
    color: 'bg-yellow-500',
    label: 'Busy',
    dot: 'animate-pulse',
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    dot: '',
  },
};

export function StatusPill({ status, showLabel = true }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.dot}`} />
      {showLabel && (
        <span className="text-xs text-gray-400">{config.label}</span>
      )}
    </div>
  );
}
