import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onReconnect?: () => void;
}

export function OfflineBanner({ onReconnect }: OfflineBannerProps) {
  return (
    <div className="bg-red-900/50 border-b border-red-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-400" />
          <div>
            <h4 className="text-sm font-semibold text-red-200">
              Connection Lost
            </h4>
            <p className="text-xs text-red-300">
              Unable to connect to terminal server. Retrying...
            </p>
          </div>
        </div>

        {onReconnect && (
          <button
            onClick={onReconnect}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
