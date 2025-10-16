/**
 * Punch Recording Markers
 *
 * Visual timeline markers for punch in/out points
 * Similar to Pro Tools Memory Locations and Logic Pro Autopunch markers
 */

import React, { useState, useCallback } from 'react';
import { Target, Edit2, Trash2, Plus } from 'lucide-react';

export interface PunchMarker {
  id: string;
  name: string;
  punchIn: number; // Time in seconds
  punchOut: number; // Time in seconds
  color: string;
  isActive: boolean;
}

export interface PunchMarkersProps {
  markers: PunchMarker[];
  currentTime: number;
  duration: number;
  onMarkerAdd: (marker: Omit<PunchMarker, 'id'>) => void;
  onMarkerUpdate: (id: string, updates: Partial<PunchMarker>) => void;
  onMarkerDelete: (id: string) => void;
  onMarkerActivate: (id: string) => void;
}

export const PunchMarkers: React.FC<PunchMarkersProps> = ({
  markers,
  currentTime,
  duration,
  onMarkerAdd,
  onMarkerUpdate,
  onMarkerDelete,
  onMarkerActivate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMarkerName, setNewMarkerName] = useState('');

  const handleAddMarker = useCallback(() => {
    const name = newMarkerName.trim() || `Punch ${markers.length + 1}`;
    const punchIn = Math.max(0, currentTime - 5); // 5 seconds before current time
    const punchOut = Math.min(duration, currentTime + 5); // 5 seconds after

    onMarkerAdd({
      name,
      punchIn,
      punchOut,
      color: '#ef4444', // Red by default
      isActive: false,
    });

    setNewMarkerName('');
    setIsAdding(false);
  }, [newMarkerName, markers.length, currentTime, duration, onMarkerAdd]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getMarkerPosition = (time: number): number => {
    return (time / duration) * 100;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Timeline View with Markers */}
      <div className="relative h-12 bg-gray-900 rounded border border-gray-700">
        {/* Current Time Indicator */}
        <div
          className="absolute top-0 w-0.5 h-full bg-blue-500 z-20"
          style={{ left: `${getMarkerPosition(currentTime)}%` }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
        </div>

        {/* Punch Markers */}
        {markers.map((marker) => {
          const leftPos = getMarkerPosition(marker.punchIn);
          const width = getMarkerPosition(marker.punchOut) - leftPos;

          return (
            <div key={marker.id}>
              {/* Punch Region */}
              <div
                className={`absolute top-1 h-10 rounded opacity-30 border-2 transition-all ${
                  marker.isActive
                    ? 'border-white opacity-50'
                    : 'border-transparent hover:opacity-40'
                }`}
                style={{
                  left: `${leftPos}%`,
                  width: `${width}%`,
                  backgroundColor: marker.color,
                }}
                onClick={() => onMarkerActivate(marker.id)}
                title={`${marker.name}: ${formatTime(marker.punchIn)} - ${formatTime(marker.punchOut)}`}
              >
                {/* Marker Name */}
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap text-gray-300">
                  {marker.isActive && <Target className="inline w-3 h-3 mr-1" />}
                  {marker.name}
                </div>
              </div>

              {/* Punch In Handle */}
              <div
                className="absolute top-0 w-1 h-full cursor-ew-resize bg-red-500 hover:bg-red-400"
                style={{ left: `${leftPos}%` }}
                title={`Punch In: ${formatTime(marker.punchIn)}`}
              />

              {/* Punch Out Handle */}
              <div
                className="absolute top-0 w-1 h-full cursor-ew-resize bg-red-500 hover:bg-red-400"
                style={{ left: `${leftPos + width}%` }}
                title={`Punch Out: ${formatTime(marker.punchOut)}`}
              />
            </div>
          );
        })}
      </div>

      {/* Markers List */}
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
              marker.isActive
                ? 'bg-blue-500/20 border border-blue-500'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {/* Active Indicator */}
            <button
              onClick={() => onMarkerActivate(marker.id)}
              className={`p-1 rounded ${marker.isActive ? 'text-blue-500' : 'text-gray-500'}`}
              title={marker.isActive ? 'Active punch region' : 'Click to activate'}
            >
              <Target className="w-4 h-4" />
            </button>

            {/* Color Indicator */}
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: marker.color }}
            />

            {/* Marker Info */}
            <div className="flex-1">
              {editingId === marker.id ? (
                <input
                  type="text"
                  value={marker.name}
                  onChange={(e) =>
                    onMarkerUpdate(marker.id, { name: e.target.value })
                  }
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingId(null);
                  }}
                  className="w-full bg-gray-900 px-2 py-1 rounded text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{marker.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatTime(marker.punchIn)} → {formatTime(marker.punchOut)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => setEditingId(marker.id)}
              className="p-1 text-gray-400 hover:text-blue-500"
              title="Rename marker"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMarkerDelete(marker.id)}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Delete marker"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add New Marker */}
        {isAdding ? (
          <div className="flex items-center gap-2 p-2 bg-gray-800 rounded">
            <input
              type="text"
              value={newMarkerName}
              onChange={(e) => setNewMarkerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMarker();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewMarkerName('');
                }
              }}
              placeholder="Punch marker name..."
              className="flex-1 bg-gray-900 px-2 py-1 rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleAddMarker}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewMarkerName('');
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Punch Marker</span>
          </button>
        )}
      </div>

      {/* Instructions */}
      {markers.length === 0 && !isAdding && (
        <div className="text-xs text-gray-500 text-center py-2">
          Add punch markers to define recording regions.
          <br />
          When activated, recording will automatically punch in/out at marked times.
        </div>
      )}
    </div>
  );
};

export default PunchMarkers;
