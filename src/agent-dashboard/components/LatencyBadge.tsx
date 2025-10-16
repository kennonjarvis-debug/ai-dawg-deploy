import React from 'react';
import { Activity } from 'lucide-react';
import { LatencyInfo } from '../types';

interface LatencyBadgeProps {
  latency: LatencyInfo | null;
}

export function LatencyBadge({ latency }: LatencyBadgeProps) {
  if (!latency) return null;

  const getLatencyColor = (ping: number) => {
    if (ping < 50) return 'text-green-500';
    if (ping < 150) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full">
      <Activity className={`w-4 h-4 ${getLatencyColor(latency.ping)}`} />
      <span className="text-xs text-gray-400">
        {latency.ping}ms
      </span>
    </div>
  );
}
