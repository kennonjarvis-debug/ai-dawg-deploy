import React, { useState } from 'react';
import { Track as TrackType, useTimelineStore } from '@/stores';
import { AudioClip } from './AudioClip';
import { Volume2, VolumeX, ChevronDown, Plus, Copy, Trash2 } from 'lucide-react';

interface TrackProps {
  track: TrackType;
  isSelected: boolean;
  onSelectTrack: () => void;
}

export const Track: React.FC<TrackProps> = ({ track, isSelected, onSelectTrack }) => {
  const {
    zoom,
    selectedClipIds,
    setSelectedClips,
    updateTrack,
    createPlaylist,
    deletePlaylist,
    activatePlaylist,
    duplicatePlaylist,
  } = useTimelineStore();

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const handleClipClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const multi = e.shiftKey || e.metaKey || e.ctrlKey;
    if (multi) {
      // Multi-select
      if (selectedClipIds.includes(clipId)) {
        setSelectedClips(selectedClipIds.filter((id) => id !== clipId));
      } else {
        setSelectedClips([...selectedClipIds, clipId]);
      }
    } else {
      setSelectedClips([clipId]);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTrack(track.id, { isMuted: !track.isMuted });
  };

  const toggleSolo = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTrack(track.id, { isSolo: !track.isSolo });
  };

  const toggleArm = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTrack(track.id, { isArmed: !track.isArmed });
  };

  const cycleInputMonitoring = (e: React.MouseEvent) => {
    e.stopPropagation();
    const modes: Array<'auto' | 'input-only' | 'off'> = ['auto', 'input-only', 'off'];
    const currentIndex = modes.indexOf(track.inputMonitoring);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    updateTrack(track.id, { inputMonitoring: nextMode });
  };

  // Playlist handlers
  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name) {
      createPlaylist(track.id, name);
    }
    setShowPlaylistMenu(false);
  };

  const handleActivatePlaylist = (playlistId: string) => {
    activatePlaylist(track.id, playlistId);
    setShowPlaylistMenu(false);
  };

  const handleDuplicatePlaylist = (playlistId: string, playlistName: string) => {
    const name = prompt('Enter name for duplicate:', `${playlistName} Copy`);
    if (name) {
      duplicatePlaylist(track.id, playlistId, name);
    }
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    if (track.playlists.length <= 1) {
      alert('Cannot delete the last playlist');
      return;
    }
    if (confirm(`Delete playlist "${playlistName}"?`)) {
      deletePlaylist(track.id, playlistId);
    }
  };

  const activePlaylist = track.playlists.find((p) => p.id === track.activePlaylistId);

  return (
    <div
      className={`flex border-b border-border-base transition-all ${
        isSelected ? 'bg-bg-surface-hover' : 'bg-transparent'
      }`}
      style={{ height: `${track.height}px` }}
    >
      {/* Track header */}
      <div
        className={`w-56 flex-shrink-0 border-r border-border-base p-3 flex flex-col gap-2.5 cursor-pointer transition-all backdrop-blur-md ${
          isSelected
            ? 'bg-bg-surface-hover shadow-xl'
            : 'bg-bg-surface hover:bg-bg-surface-hover'
        }`}
        onClick={onSelectTrack}
      >
        {/* Track name and color indicator */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-8 rounded-full shadow-lg flex-shrink-0"
            style={{
              backgroundColor: track.color,
              boxShadow: `0 0 12px ${track.color}60`
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-base truncate">{track.name}</div>
          </div>
        </div>

        {/* Playlist Selector */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistMenu(!showPlaylistMenu);
            }}
            className="w-full px-2 py-1.5 text-xs rounded-lg bg-bg-surface-2 hover:bg-bg-surface-hover text-text-muted flex items-center justify-between ring-1 ring-border-base transition-all"
          >
            <span className="truncate">{activePlaylist?.name || 'Main'}</span>
            <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
          </button>

          {showPlaylistMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPlaylistMenu(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-surface-2 border border-border-strong rounded-lg shadow-2xl z-20 max-h-64 overflow-auto">
                <div className="p-1">
                  {track.playlists.map((playlist) => (
                    <div key={playlist.id} className="flex items-center gap-1 group">
                      <button
                        onClick={() => handleActivatePlaylist(playlist.id)}
                        className={`flex-1 px-2 py-1.5 text-xs text-left rounded transition-colors ${
                          playlist.id === track.activePlaylistId
                            ? 'bg-primary text-text-base'
                            : 'text-text-muted hover:bg-bg-surface-hover'
                        }`}
                      >
                        <div className="truncate">{playlist.name}</div>
                        <div className="text-[10px] opacity-60">
                          {playlist.clips.length} clip{playlist.clips.length !== 1 ? 's' : ''}
                        </div>
                      </button>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDuplicatePlaylist(playlist.id, playlist.name)}
                          className="p-1 hover:bg-bg-surface-hover rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3 text-text-dim" />
                        </button>
                        {track.playlists.length > 1 && (
                          <button
                            onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                            className="p-1 hover:bg-red-900/50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border-base p-1">
                  <button
                    onClick={handleCreatePlaylist}
                    className="w-full px-2 py-1.5 text-xs text-left text-green-400 hover:bg-bg-surface-hover rounded flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    New Playlist
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Track controls */}
        <div className="flex items-center gap-1.5">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all backdrop-blur-sm font-semibold ${
              track.isMuted
                ? 'bg-yellow-500/30 text-yellow-200 ring-1 ring-yellow-400/50 shadow-lg shadow-yellow-500/20'
                : 'bg-bg-surface-2 text-text-muted hover:bg-bg-surface-hover ring-1 ring-border-base'
            }`}
            title="Mute"
          >
            M
          </button>

          {/* Solo */}
          <button
            onClick={toggleSolo}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all backdrop-blur-sm font-semibold ${
              track.isSolo
                ? 'bg-green-500/30 text-green-200 ring-1 ring-green-400/50 shadow-lg shadow-green-500/20'
                : 'bg-bg-surface-2 text-text-muted hover:bg-bg-surface-hover ring-1 ring-border-base'
            }`}
            title="Solo"
          >
            S
          </button>

          {/* Arm */}
          <button
            onClick={toggleArm}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all backdrop-blur-sm font-semibold ${
              track.isArmed
                ? 'bg-red-500/30 text-red-200 ring-1 ring-red-400/50 shadow-lg shadow-red-500/20'
                : 'bg-bg-surface-2 text-text-muted hover:bg-bg-surface-hover ring-1 ring-border-base'
            }`}
            title="Record Arm"
          >
            R
          </button>

          {/* Input Monitoring */}
          <button
            onClick={cycleInputMonitoring}
            className={`px-2.5 py-1 text-xs rounded-lg transition-all backdrop-blur-sm font-semibold ${
              track.inputMonitoring === 'auto'
                ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/50 shadow-lg shadow-blue-500/20'
                : track.inputMonitoring === 'input-only'
                ? 'bg-green-500/30 text-green-200 ring-1 ring-green-400/50 shadow-lg shadow-green-500/20'
                : 'bg-bg-surface-2 text-text-muted hover:bg-bg-surface-hover ring-1 ring-border-base'
            }`}
            title={`Input Monitoring: ${track.inputMonitoring === 'auto' ? 'Auto' : track.inputMonitoring === 'input-only' ? 'Input Only' : 'Off'}`}
          >
            {track.inputMonitoring === 'auto' ? 'A' : track.inputMonitoring === 'input-only' ? 'I' : 'X'}
          </button>

          {/* Input Level Meter (when armed) */}
          {track.isArmed && track.inputLevel > 0 && (
            <div className="px-2 py-1 rounded-lg bg-bg-base backdrop-blur-sm">
              <div className="w-12 h-1.5 bg-bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                  style={{ width: `${Math.min(100, track.inputLevel * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Volume indicator */}
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-base backdrop-blur-sm">
            {track.isMuted ? (
              <VolumeX className="w-3 h-3 text-yellow-400/70" />
            ) : (
              <Volume2 className="w-3 h-3 text-blue-400/70" />
            )}
            <span className="text-xs text-text-muted font-medium">
              {Math.round(track.volume * 100)}%
            </span>
          </div>
        </div>

        {/* Volume slider with glassmorphic track */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20 backdrop-blur-sm" />
          <input
            type="range"
            min="0"
            max="100"
            value={track.volume * 100}
            onChange={(e) => updateTrack(track.id, { volume: parseInt(e.target.value) / 100 })}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-gradient-to-br
              [&::-webkit-slider-thumb]:from-blue-400
              [&::-webkit-slider-thumb]:to-blue-600
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-blue-500/50
              [&::-webkit-slider-thumb]:ring-2
              [&::-webkit-slider-thumb]:ring-white/30
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-110"
          />
        </div>

        {/* Pan slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-dim font-medium">L</span>
          <div className="flex-1 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-white/10 to-purple-500/20 backdrop-blur-sm" />
            <input
              type="range"
              min="-100"
              max="100"
              value={track.pan * 100}
              onChange={(e) => updateTrack(track.id, { pan: parseInt(e.target.value) / 100 })}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-purple-400
                [&::-webkit-slider-thumb]:to-purple-600
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-purple-500/50
                [&::-webkit-slider-thumb]:ring-2
                [&::-webkit-slider-thumb]:ring-white/30
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110"
            />
          </div>
          <span className="text-[10px] text-text-dim font-medium">R</span>
        </div>
      </div>

      {/* Clip lane */}
      <div className="flex-1 relative bg-bg-base">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, white 20px, white 21px)',
          }}
        />

        {/* Clips */}
        {track.clips.map((clip) => (
          <AudioClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            trackHeight={track.height}
            isSelected={selectedClipIds.includes(clip.id)}
            onClick={(e) => handleClipClick(clip.id, e)}
          />
        ))}
      </div>
    </div>
  );
};
