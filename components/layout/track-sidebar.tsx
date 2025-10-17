'use client';

import { Plus, Volume2, VolumeX, Music2, Trash2 } from 'lucide-react';
import { useAudioStore } from '@/lib/store';

export function TrackSidebar() {
  const {
    tracks,
    activeTrackId,
    setActiveTrack,
    addTrack,
    toggleTrackMute,
    setActiveRecording,
    removeRecording,
  } = useAudioStore();

  const handleAddTrack = () => {
    const trackNumber = tracks.length + 1;
    addTrack(`Track ${trackNumber}`, 'vocal');
  };

  const activeTrack = tracks.find((t) => t.id === activeTrackId);

  return (
    <div className="w-64 border-r border-gray-800 flex flex-col bg-[#0f0f0f]">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Tracks</h2>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tracks List */}
        <div className="p-4 space-y-2">
          {tracks.map((track) => (
          <div
            key={track.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              track.id === activeTrackId
                ? 'bg-blue-900/30 border-blue-700'
                : 'bg-[#1a1a1a] border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setActiveTrack(track.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    track.recordings.length > 0 ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                />
                <span className="text-sm font-medium">{track.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrackMute(track.id);
                }}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {track.muted ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <div className="text-xs text-gray-400 capitalize">{track.type}</div>
            {track.recordings.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {track.recordings.length} recording{track.recordings.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}

          {/* Add Track Button */}
          <button
            onClick={handleAddTrack}
            className="w-full p-3 rounded-lg border border-dashed border-gray-700 hover:border-gray-600 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Track</span>
          </button>
        </div>

        {/* Recordings Library */}
        {activeTrack && activeTrack.recordings.length > 0 && (
          <div className="border-t border-gray-800 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400">Recordings</h3>
              <p className="text-xs text-gray-500 mt-1">
                {activeTrack.recordings.length} take{activeTrack.recordings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeTrack.recordings.map((recording, index) => (
                <div
                  key={recording.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                    recording.id === activeTrack.activeRecordingId
                      ? 'bg-blue-900/30 border-blue-700'
                      : 'bg-[#1a1a1a] border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setActiveRecording(activeTrack.id, recording.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Take {index + 1}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm('Delete this recording? This cannot be undone.')
                        ) {
                          removeRecording(activeTrack.id, recording.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.floor(recording.duration / 60)}:
                    {(recording.duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {recording.createdAt.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
