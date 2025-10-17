import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sliders, Settings, ChevronDown, Activity } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { Track, useTimelineStore, useTransportStore } from '@/stores';
import { ChannelStripPanel } from './ChannelStripPanel';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Removed old ChannelSettings - replaced with full ChannelStripPanel

interface MixerChannelProps {
  track: Track;
}

const MixerChannel: React.FC<MixerChannelProps> = ({ track }) => {
  const { updateTrack } = useTimelineStore();
  const [volume, setVolume] = useState(track.volume);
  const [pan, setPan] = useState(track.pan);
  const [isMuted, setIsMuted] = useState(track.isMuted);
  const [isSolo, setIsSolo] = useState(track.isSolo);
  const [showChannelStrip, setShowChannelStrip] = useState(false);

  // Convert linear volume (0-1) to dB (-Infinity to 0)
  const volumeToDb = (vol: number) => {
    if (vol === 0) return -Infinity;
    return 20 * Math.log10(vol);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    updateTrack(track.id, { volume: newVolume });
  };

  const handlePanChange = (value: number[]) => {
    const newPan = value[0];
    setPan(newPan);
    updateTrack(track.id, { pan: newPan });
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    updateTrack(track.id, { isMuted: newMuted });
  };

  const handleSoloToggle = () => {
    const newSolo = !isSolo;
    setIsSolo(newSolo);
    updateTrack(track.id, { isSolo: newSolo });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 p-3 bg-gradient-to-b from-purple-900/20 via-black/80 to-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl shadow-purple-500/10 w-20 h-full">
        {/* Track Header */}
        <div className="w-full space-y-1">
          {/* Track Name */}
          <div className="text-[10px] font-medium text-gray-200 truncate w-full text-center bg-black/60 px-1.5 py-1 rounded border border-white/5">
            {track.name}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowChannelStrip(!showChannelStrip)}
            className="w-full flex items-center justify-center px-1 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all"
          >
            <Settings className="w-2.5 h-2.5 text-purple-400" />
          </button>
        </div>

        {/* VU Meter */}
        <div className="w-full h-2 bg-black/60 rounded overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60 shadow-lg" style={{ width: '60%' }} />
        </div>

        {/* Volume Fader */}
        <div className="flex flex-col items-center gap-1.5 flex-1 py-2">
          <Slider.Root
            className="relative flex items-center select-none touch-none h-full w-6"
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.01}
            orientation="vertical"
          >
            <Slider.Track className="bg-gradient-to-t from-black/80 via-purple-900/20 to-black/60 relative grow rounded-sm h-full w-1.5 shadow-inner border border-white/10">
              <Slider.Range className="absolute bg-gradient-to-t from-blue-600 via-purple-500 to-blue-400 rounded-sm w-full shadow-lg shadow-blue-500/50" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-3 bg-gradient-to-b from-purple-400 to-purple-600 border border-purple-700 rounded-sm hover:from-purple-300 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-lg shadow-purple-500/50 cursor-grab active:cursor-grabbing"
              aria-label="Volume"
            />
          </Slider.Root>

          {/* Volume dB Display */}
          <div className="text-[9px] text-blue-400 font-mono font-bold bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
            {volumeToDb(volume) === -Infinity ? '-∞' : `${volumeToDb(volume).toFixed(1)}`}
          </div>
        </div>

        {/* Pan Control */}
        <div className="w-full space-y-0.5">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-6"
            value={[pan]}
            onValueChange={handlePanChange}
            max={1}
            min={-1}
            step={0.01}
          >
            <Slider.Track className="bg-gradient-to-r from-blue-500/20 via-black/60 to-pink-500/20 relative grow rounded-sm h-1.5 shadow-inner border border-white/10">
              <Slider.Range className="absolute bg-purple-500/40 rounded-sm h-full shadow-md" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-gradient-to-b from-purple-400 to-purple-600 border border-purple-700 rounded-sm hover:from-purple-300 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-lg shadow-purple-500/50 cursor-grab active:cursor-grabbing"
              aria-label="Pan"
            />
          </Slider.Root>
          <div className="text-[9px] text-center text-gray-300 font-semibold bg-black/60 px-1 py-0.5 rounded border border-white/5">
            {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(pan * 100).toFixed(0)}` : `R${(pan * 100).toFixed(0)}`}
          </div>
        </div>

        {/* Mute/Solo Buttons */}
        <div className="flex gap-1 w-full">
          <button
            onClick={handleMuteToggle}
            className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
              isMuted
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/50 border border-pink-500'
                : 'bg-black/40 text-gray-400 hover:bg-pink-500/20 hover:text-pink-300 border border-white/10 hover:border-pink-500/30'
            }`}
          >
            M
          </button>
          <button
            onClick={handleSoloToggle}
            className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
              isSolo
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50 border border-purple-500'
                : 'bg-black/40 text-gray-400 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 hover:border-purple-500/30'
            }`}
          >
            S
          </button>
        </div>
      </div>

      {/* Channel Strip Panel - Logic Pro X Style */}
      {showChannelStrip && (
        <ChannelStripPanel track={track} onClose={() => setShowChannelStrip(false)} />
      )}
    </>
  );
};

const MasterChannel: React.FC = () => {
  const { masterVolume, setMasterVolume } = useTransportStore();
  const [volume, setVolume] = useState(masterVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(masterVolume);

  // Sync with store
  useEffect(() => {
    setVolume(masterVolume);
  }, [masterVolume]);

  // Convert linear volume (0-1) to dB (-Infinity to 0)
  const volumeToDb = (vol: number) => {
    if (vol === 0) return -Infinity;
    return 20 * Math.log10(vol);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setMasterVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setMasterVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setMasterVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-gradient-to-b from-pink-900/30 via-purple-900/20 to-black/90 backdrop-blur-sm rounded-lg border-2 border-pink-500/30 shadow-2xl shadow-pink-500/20 w-20 h-full">
      {/* Master Header */}
      <div className="w-full">
        {/* Master Label */}
        <div className="text-[10px] font-bold text-pink-400 truncate w-full text-center uppercase tracking-wider bg-black/60 px-1.5 py-1 rounded border border-pink-500/30">
          Master
        </div>
      </div>

      {/* Master VU Meter */}
      <div className="w-full h-2 bg-black/60 rounded overflow-hidden border border-white/10">
        <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-400 opacity-70 shadow-lg shadow-pink-500/50" style={{ width: `${volume * 100}%` }} />
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1.5 flex-1 py-2">
        <Slider.Root
          className="relative flex items-center select-none touch-none h-full w-6"
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          min={0}
          step={0.01}
          orientation="vertical"
        >
          <Slider.Track className="bg-gradient-to-t from-black/80 via-pink-900/30 to-black/60 relative grow rounded-sm h-full w-1.5 shadow-inner border border-white/10">
            <Slider.Range className="absolute bg-gradient-to-t from-pink-700 via-pink-500 to-pink-400 rounded-sm w-full shadow-xl shadow-pink-500/60" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-3 bg-gradient-to-b from-pink-400 to-pink-600 border border-pink-700 rounded-sm hover:from-pink-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-xl shadow-pink-500/60 cursor-grab active:cursor-grabbing"
            aria-label="Master Volume"
          />
        </Slider.Root>

        {/* Volume dB Display */}
        <div className="text-[9px] text-pink-400 font-mono font-bold bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
          {volumeToDb(volume) === -Infinity ? '-∞' : `${volumeToDb(volume).toFixed(1)}`}
        </div>
      </div>

      {/* Mute Button */}
      <div className="w-full">
        <button
          onClick={handleMuteToggle}
          className={`w-full px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
            isMuted
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 border border-red-500'
              : 'bg-black/40 text-pink-400 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/30'
          }`}
        >
          M
        </button>
      </div>

      {/* Volume Percentage */}
      <div className="text-[9px] text-pink-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
        {Math.round(volume * 100)}%
      </div>
    </div>
  );
};

export const MixerPanel: React.FC = () => {
  const { tracks } = useTimelineStore();

  return (
    <div className="flex flex-col h-full bg-bg-surface border-l border-border-base">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-base">
        <Sliders className="w-5 h-5 text-text-muted" />
        <h2 className="text-lg font-semibold text-text-base">
          Mixer
        </h2>
      </div>

      {/* Mixer Channels */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-3 h-full">
          {/* Track Channels */}
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-text-dim">
              <div className="text-center">
                <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tracks to mix</p>
                <p className="text-sm mt-1">Add tracks to see mixer channels</p>
              </div>
            </div>
          ) : (
            <>
              {tracks.map((track) => (
                <MixerChannel key={track.id} track={track} />
              ))}

              {/* Separator */}
              <div className="w-px h-full bg-border-strong mx-2" />
            </>
          )}

          {/* Master Channel - Always visible */}
          <MasterChannel />
        </div>
      </div>
    </div>
  );
};
