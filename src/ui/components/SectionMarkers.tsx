/**
 * Section Markers
 * Pro Tools-style section markers for song arrangement (Intro, Verse, Chorus, Bridge, Outro)
 */

import React, { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';

export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'breakdown' | 'drop' | 'outro' | 'custom';

export interface SectionMarker {
  id: string;
  name: string;
  type: SectionType;
  time: number; // in seconds
  color: string;
}

interface SectionMarkersProps {
  markers: SectionMarker[];
  zoom: number;
  scrollPosition: number;
  currentTime: number;
  onAddMarker: (marker: Omit<SectionMarker, 'id'>) => void;
  onDeleteMarker: (id: string) => void;
  onUpdateMarker: (id: string, updates: Partial<SectionMarker>) => void;
  onSeekToMarker: (time: number) => void;
}

const SECTION_COLORS: Record<SectionType, string> = {
  intro: '#3b82f6',      // Blue
  verse: '#10b981',      // Green
  chorus: '#f59e0b',     // Amber
  bridge: '#8b5cf6',     // Purple
  breakdown: '#ec4899',  // Pink
  drop: '#ef4444',       // Red
  outro: '#6366f1',      // Indigo
  custom: '#64748b',     // Slate
};

const SECTION_LABELS: Record<SectionType, string> = {
  intro: 'Intro',
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  breakdown: 'Breakdown',
  drop: 'Drop',
  outro: 'Outro',
  custom: 'Custom',
};

export const SectionMarkers: React.FC<SectionMarkersProps> = ({
  markers,
  zoom,
  scrollPosition,
  currentTime,
  onAddMarker,
  onDeleteMarker,
  onUpdateMarker,
  onSeekToMarker,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddSection = (type: SectionType) => {
    const name = type === 'custom' ? prompt('Enter section name:') || 'Section' : `${SECTION_LABELS[type]} ${markers.filter(m => m.type === type).length + 1}`;

    onAddMarker({
      name,
      type,
      time: currentTime,
      color: SECTION_COLORS[type],
    });

    setShowAddMenu(false);
  };

  const handleStartEdit = (marker: SectionMarker) => {
    setEditingId(marker.id);
    setEditName(marker.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdateMarker(id, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sort markers by time
  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);

  return (
    <div className="relative h-12 bg-gradient-to-b from-bg-surface to-bg-surface-2 border-b border-border-strong">
      {/* Current time indicator */}
      <div className="absolute top-2 right-2 z-30 px-3 py-1.5 bg-bg-surface-2 border border-border-base rounded-lg shadow-lg">
        <span className="text-xs font-mono text-text-muted">{formatTime(currentTime)}</span>
      </div>

      {/* Section markers */}
      <div className="absolute inset-0 overflow-hidden pt-8">
        {sortedMarkers.map((marker) => {
          const x = (marker.time - scrollPosition) * zoom;
          const isEditing = editingId === marker.id;

          return (
            <div
              key={marker.id}
              className="absolute top-0 bottom-0 group cursor-pointer transition-all hover:z-20"
              style={{
                left: `${x}px`,
                transform: x < 0 || x > window.innerWidth ? 'translateX(-9999px)' : 'none',
              }}
              onClick={() => !isEditing && onSeekToMarker(marker.time)}
            >
              {/* Marker line */}
              <div
                className="absolute top-0 w-px h-full opacity-50 group-hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: marker.color,
                  boxShadow: `0 0 4px ${marker.color}40`,
                }}
              />

              {/* Marker flag */}
              <div
                className="absolute top-0.5 left-1 px-1.5 py-0.5 rounded shadow group-hover:shadow-md transition-all backdrop-blur-sm border border-black/20"
                style={{
                  backgroundColor: marker.color + 'E6',
                  boxShadow: `0 0 8px ${marker.color}30`,
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(marker.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditName('');
                        }
                      }}
                      className="w-24 px-1 py-0.5 bg-white/20 text-white text-xs font-semibold rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(marker.id)}
                      className="p-0.5 hover:bg-white/20 rounded"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                      {marker.name}
                    </span>

                    {/* Hover actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(marker);
                        }}
                        className="p-0.5 hover:bg-white/20 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-2.5 h-2.5 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${marker.name}"?`)) {
                            onDeleteMarker(marker.id);
                          }
                        }}
                        className="p-0.5 hover:bg-red-400/30 rounded"
                        title="Delete"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Time label */}
              <div className="absolute -bottom-5 left-1 text-[10px] font-mono text-text-dim opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatTime(marker.time)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid lines for visual reference */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-white"
            style={{ left: `${i * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
};
