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
        className={`w-56 flex-shrink-0 p-3 flex flex-col gap-2.5 cursor-pointer transition-all backdrop-blur-md ${
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
            <div
              className="text-sm font-semibold text-text-base truncate cursor-text hover:bg-bg-surface-2 px-1 py-0.5 rounded transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation();
                const newName = prompt('Rename track:', track.name);
                if (newName && newName.trim()) {
                  updateTrack(track.id, { name: newName.trim() });
                }
              }}
              title="Double-click to rename"
            >
              {track.name}
            </div>
          </div>
          {/* Mono/Stereo Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newChannels = track.channels === 'stereo' ? 'mono' : 'stereo';
              updateTrack(track.id, { channels: newChannels });
            }}
            className="px-1.5 py-0.5 text-[10px] rounded-md bg-bg-surface-2 hover:bg-primary/20 text-text-muted hover:text-primary font-bold ring-1 ring-border-base hover:ring-primary/50 transition-all"
            title={`Toggle to ${track.channels === 'stereo' ? 'mono' : 'stereo'}`}
          >
            {track.channels === 'stereo' ? 'ST' : 'M'}
          </button>
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

        {/* Live Recording Waveform (Pro Tools style) */}
        {track.isRecording && track.liveWaveformData && track.liveRecordingStartTime !== undefined && (
          <LiveRecordingWaveform
            waveformData={track.liveWaveformData}
            startTime={track.liveRecordingStartTime}
            duration={track.liveRecordingDuration || 0}
            zoom={zoom}
            trackHeight={track.height}
            color={track.color}
          />
        )}
      </div>
    </div>
  );
};

// Live Recording Waveform Component (Pro Tools style growing waveform)
interface LiveRecordingWaveformProps {
  waveformData: Float32Array;
  startTime: number;
  duration: number;
  zoom: number;
  trackHeight: number;
  color: string;
}

const LiveRecordingWaveform: React.FC<LiveRecordingWaveformProps> = ({
  waveformData,
  startTime,
  duration,
  zoom,
  trackHeight,
  color,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const width = duration * zoom;
  const height = trackHeight - 16;

  // Draw live waveform
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    const maxAmplitude = height / 2 - 4;

    // Recording red color with pulse effect
    ctx.fillStyle = color + 'CC';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    waveformData.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = amplitude * maxAmplitude;

      // Draw symmetrical waveform (top and bottom)
      ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 0.5), barHeight * 2);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [waveformData, width, height, color]);

  return (
    <div
      className="absolute top-2 rounded-xl overflow-hidden animate-pulse"
      style={{
        left: `${startTime * zoom}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: color + '20',
        border: `2px solid ${color}`,
        boxShadow: `0 0 20px ${color}60`,
      }}
    >
      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Recording indicator */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm flex items-center gap-1.5">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold text-white">REC</span>
      </div>

      {/* Duration indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
        <span className="text-xs font-mono text-white font-semibold">
          {Math.floor(duration)}s
        </span>
      </div>
    </div>
  );
};
