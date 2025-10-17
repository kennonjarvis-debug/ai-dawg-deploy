'use client';

import { useAudioStore } from '@/lib/store';
import { Volume2 } from 'lucide-react';

interface TrackControlsProps {
  trackId: string;
}

export function TrackControls({ trackId }: TrackControlsProps) {
  const { tracks, setTrackVolume, setTrackPan } = useAudioStore();
  const track = tracks.find((t) => t.id === trackId);

  if (!track) return null;

  const volumePercent = Math.round(track.volume * 100);
  const panPercent = Math.round(track.pan * 100);

  return (
    <div className="space-y-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300">Track Controls</h3>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Volume2 className="w-4 h-4" />
            <span>Volume</span>
          </div>
          <span className="text-xs text-gray-500">{volumePercent}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volumePercent}
          onChange={(e) => setTrackVolume(trackId, parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Pan Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Pan</span>
          <span className="text-xs text-gray-500">
            {panPercent === 0 ? 'Center' : panPercent > 0 ? `${panPercent}% R` : `${Math.abs(panPercent)}% L`}
          </span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={panPercent}
          onChange={(e) => setTrackPan(trackId, parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Visual meters */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          <div className="mb-1">Volume Level</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">
          <div className="mb-1">Balance</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-blue-600/30" />
              <div className="w-px bg-white" />
              <div className="flex-1 bg-blue-600/30" />
            </div>
            <div
              className="absolute h-full w-1 bg-blue-500"
              style={{
                left: `${(track.pan + 1) * 50 - 1}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
