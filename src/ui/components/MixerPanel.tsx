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
      <div className="flex flex-col items-center gap-2 p-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-lg border border-[#404040] shadow-lg w-20 h-full">
        {/* Track Header */}
        <div className="w-full space-y-1">
          {/* Track Name */}
          <div className="text-[10px] font-medium text-gray-300 truncate w-full text-center bg-black/40 px-1.5 py-1 rounded">
            {track.name}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowChannelStrip(!showChannelStrip)}
            className="w-full flex items-center justify-center px-1 py-0.5 rounded bg-black/30 hover:bg-black/50 transition-colors"
          >
            <Settings className="w-2.5 h-2.5 text-gray-400" />
          </button>
        </div>

        {/* VU Meter */}
        <div className="w-full h-2 bg-black/50 rounded overflow-hidden border border-[#404040]">
          <div className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 opacity-40" style={{ width: '60%' }} />
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
            <Slider.Track className="bg-gradient-to-t from-[#1a1a1a] to-[#2a2a2a] relative grow rounded-sm h-full w-1.5 shadow-inner border border-[#404040]">
              <Slider.Range className="absolute bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm w-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-3 bg-gradient-to-b from-gray-300 to-gray-400 border border-gray-500 rounded-sm hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-md cursor-grab active:cursor-grabbing"
              aria-label="Volume"
            />
          </Slider.Root>

          {/* Volume dB Display */}
          <div className="text-[9px] text-blue-400 font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded border border-[#404040]">
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
            <Slider.Track className="bg-gradient-to-r from-[#2a4a5a]/40 via-[#1a1a1a] to-[#5a2a2a]/40 relative grow rounded-sm h-1.5 shadow-inner border border-[#404040]">
              <Slider.Range className="absolute bg-blue-500/30 rounded-sm h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-gradient-to-b from-gray-300 to-gray-400 border border-gray-500 rounded-sm hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-md cursor-grab active:cursor-grabbing"
              aria-label="Pan"
            />
          </Slider.Root>
          <div className="text-[9px] text-center text-gray-400 font-semibold bg-black/40 px-1 py-0.5 rounded">
            {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(pan * 100).toFixed(0)}` : `R${(pan * 100).toFixed(0)}`}
          </div>
        </div>

        {/* Mute/Solo Buttons */}
        <div className="flex gap-1 w-full">
          <button
            onClick={handleMuteToggle}
            className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
              isMuted
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/50'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-orange-600/30 hover:text-orange-300 border border-[#404040]'
            }`}
          >
            M
          </button>
          <button
            onClick={handleSoloToggle}
            className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
              isSolo
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/50'
                : 'bg-[#2a2a2a] text-gray-400 hover:bg-yellow-600/30 hover:text-yellow-300 border border-[#404040]'
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
    <div className="flex flex-col items-center gap-2 p-3 bg-gradient-to-b from-[#3a2a1a] to-[#1a1a1a] rounded-lg border-2 border-[#6a4a2a] shadow-xl w-20 h-full">
      {/* Master Header */}
      <div className="w-full">
        {/* Master Label */}
        <div className="text-[10px] font-bold text-amber-400 truncate w-full text-center uppercase tracking-wider bg-black/40 px-1.5 py-1 rounded border border-[#6a4a2a]">
          Master
        </div>
      </div>

      {/* Master VU Meter */}
      <div className="w-full h-2 bg-black/50 rounded overflow-hidden border border-[#6a4a2a]">
        <div className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 opacity-50" style={{ width: `${volume * 100}%` }} />
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
          <Slider.Track className="bg-gradient-to-t from-[#1a1a1a] to-[#3a2a1a] relative grow rounded-sm h-full w-1.5 shadow-inner border border-[#6a4a2a]">
            <Slider.Range className="absolute bg-gradient-to-t from-amber-700 to-amber-500 rounded-sm w-full shadow-lg" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-3 bg-gradient-to-b from-amber-400 to-amber-600 border border-amber-700 rounded-sm hover:from-amber-300 hover:to-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-xl cursor-grab active:cursor-grabbing"
            aria-label="Master Volume"
          />
        </Slider.Root>

        {/* Volume dB Display */}
        <div className="text-[9px] text-amber-400 font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded border border-[#6a4a2a]">
          {volumeToDb(volume) === -Infinity ? '-∞' : `${volumeToDb(volume).toFixed(1)}`}
        </div>
      </div>

      {/* Mute Button */}
      <div className="w-full">
        <button
          onClick={handleMuteToggle}
          className={`w-full px-1.5 py-1 text-[9px] font-bold rounded transition-all ${
            isMuted
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
              : 'bg-[#3a2a1a] text-amber-400 hover:bg-red-600/30 hover:text-red-300 border border-[#6a4a2a]'
          }`}
        >
          M
        </button>
      </div>

      {/* Volume Percentage */}
      <div className="text-[9px] text-amber-400 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-[#6a4a2a]">
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
