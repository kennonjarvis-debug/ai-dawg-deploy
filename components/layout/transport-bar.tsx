'use client';

import { SkipBack, Play, Pause, Square, SkipForward, Circle } from 'lucide-react';
import { useAudioStore } from '@/lib/store';
import { useAudioPlayback } from '@/hooks/use-audio-playback';
import { GlassButton } from '@/components/ui/glass-button';
import { DawgLogo } from '@/components/icons/dawg-logo';
import { useState } from 'react';

export function TransportBar() {
  const { playback, tracks, activeTrackId } = useAudioStore();
  const { play, pause, stop } = useAudioPlayback();
  const [bpm, setBpm] = useState(90);
  const [metronomeActive, setMetronomeActive] = useState(false);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const hasRecording = activeTrack && activeTrack.recordings.length > 0;

  const formatTimecode = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // 30fps
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel border-b border-white/10">
      <div className="container mx-auto px-6 py-4">
        {/* Top Row: Logo, Menu, Settings */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Logo & Menu */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <DawgLogo className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-mint-green bg-clip-text text-transparent">
                DAWG AI
              </span>
            </div>

            {/* Menu Items */}
            <div className="hidden md:flex items-center gap-1 ml-4">
              <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded transition-all">
                File
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded transition-all">
                Edit
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded transition-all">
                Track
              </button>
            </div>
          </div>

          {/* Right: Settings & Help */}
          <div className="flex items-center gap-2">
            <GlassButton size="sm" variant="default">
              Settings
            </GlassButton>
            <GlassButton size="sm" variant="default">
              Help
            </GlassButton>
          </div>
        </div>

        {/* Main Transport Row */}
        <div className="flex items-center justify-between gap-8">
          {/* Left: Timecode Display */}
          <div className="glass rounded-lg px-6 py-3 min-w-[240px]">
            <div className="text-xs text-gray-400 mb-1">TIMECODE</div>
            <div className="font-mono text-2xl font-semibold text-neon-blue tracking-wider">
              {formatTimecode(playback.currentTime)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Duration: {formatTimecode(playback.duration)}
            </div>
          </div>

          {/* Center: Transport Controls */}
          <div className="flex items-center gap-3">
            {/* Skip Back */}
            <GlassButton
              onClick={() => {}}
              disabled={!hasRecording}
              variant="default"
              size="lg"
              icon={<SkipBack className="w-6 h-6" />}
            />

            {/* Play/Pause */}
            {!playback.isPlaying ? (
              <GlassButton
                onClick={play}
                disabled={!hasRecording}
                variant="primary"
                size="lg"
                icon={<Play className="w-7 h-7" />}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <GlassButton
                onClick={pause}
                variant="primary"
                size="lg"
                icon={<Pause className="w-7 h-7" />}
                className="w-16 h-16 rounded-full"
              />
            )}

            {/* Stop */}
            <GlassButton
              onClick={stop}
              disabled={!hasRecording}
              variant="default"
              size="lg"
              icon={<Square className="w-6 h-6" />}
            />

            {/* Skip Forward */}
            <GlassButton
              onClick={() => {}}
              disabled={!hasRecording}
              variant="default"
              size="lg"
              icon={<SkipForward className="w-6 h-6" />}
            />

            {/* Record */}
            <GlassButton
              onClick={() => {}}
              variant="danger"
              size="lg"
              icon={<Circle className="w-6 h-6 fill-current" />}
              className="ml-2"
            />
          </div>

          {/* Right: Session Info */}
          <div className="flex items-center gap-4">
            {/* BPM Control */}
            <div className="glass rounded-lg px-4 py-3 min-w-[140px]">
              <div className="text-xs text-gray-400 mb-1">BPM</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 90)}
                  className="bg-transparent font-mono text-xl font-semibold text-white w-16 focus:outline-none focus:text-neon-blue transition-colors"
                  min="40"
                  max="240"
                />
                <button
                  onClick={() => setMetronomeActive(!metronomeActive)}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    metronomeActive
                      ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {metronomeActive ? '🔊' : '🔇'}
                </button>
              </div>
            </div>

            {/* Time Signature */}
            <div className="glass rounded-lg px-4 py-3 min-w-[80px] text-center">
              <div className="text-xs text-gray-400 mb-1">TIME</div>
              <div className="font-mono text-xl font-semibold text-white">4/4</div>
            </div>

            {/* Sample Rate */}
            <div className="hidden lg:block glass rounded-lg px-4 py-3 min-w-[100px] text-center">
              <div className="text-xs text-gray-400 mb-1">RATE</div>
              <div className="font-mono text-sm text-gray-300">48kHz</div>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="mt-4 relative">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-neon-blue via-mint-green to-neon-blue transition-all duration-100 ease-linear relative"
              style={{
                width: playback.duration
                  ? `${(playback.currentTime / playback.duration) * 100}%`
                  : '0%',
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-neon-blue rounded-full shadow-glow-blue animate-pulse" />
            </div>
          </div>
          {hasRecording && (
            <div className="text-xs text-mint-green/70 mt-1 text-right">
              {activeTrack?.recordings.length} recording{activeTrack?.recordings.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
