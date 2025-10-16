/**
 * ChannelStripPanel - Logic Pro X Style Channel Strip
 * Beautiful, professional mixer channel with inserts, sends, and routing
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Radio,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plug,
  Send,
  Power,
  Plus,
  X,
  Settings,
  Zap,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { Track } from '@/stores';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import type { Send as SendType, Insert, Bus } from '@/audio/routing/types';

interface ChannelStripPanelProps {
  track: Track;
  onClose: () => void;
}

export const ChannelStripPanel: React.FC<ChannelStripPanelProps> = ({ track, onClose }) => {
  const { routing } = useAudioEngine();
  const [activeTab, setActiveTab] = useState<'inserts' | 'sends' | 'io'>('inserts');
  const [expandedSection, setExpandedSection] = useState<string | null>('pre-eq');

  const channelStrip = track.channelStrip;
  const routingTrack = routing?.getTrack(track.id);

  if (!channelStrip || !routingTrack) {
    return (
      <div className="absolute top-0 right-0 w-96 h-full bg-bg-surface/95 backdrop-blur-xl border-l border-border-strong shadow-2xl p-6 flex items-center justify-center">
        <div className="text-text-muted text-center">
          <Sliders className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Channel Strip not available</p>
          <p className="text-sm mt-2">Routing engine not initialized</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-b from-bg-surface/98 to-bg-surface-2/98 backdrop-blur-2xl border-l border-border-strong shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-strong bg-bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${track.color}, ${track.color}dd)`,
            }}
          />
          <div>
            <h2 className="text-lg font-bold text-text-base">{track.name}</h2>
            <p className="text-xs text-text-muted">Channel Strip</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-bg-surface-2 hover:bg-bg-surface-hover transition-colors text-text-muted hover:text-text-base"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-base bg-bg-base/30">
        <button
          onClick={() => setActiveTab('inserts')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'inserts'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Plug className="w-4 h-4" />
          Inserts
        </button>
        <button
          onClick={() => setActiveTab('sends')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sends'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Send className="w-4 h-4" />
          Sends
        </button>
        <button
          onClick={() => setActiveTab('io')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'io'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Radio className="w-4 h-4" />
          I/O
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'inserts' && (
          <InsertsView
            channelStrip={channelStrip}
            trackId={track.id}
            expandedSection={expandedSection}
            onToggleSection={(section) =>
              setExpandedSection(expandedSection === section ? null : section)
            }
          />
        )}
        {activeTab === 'sends' && (
          <SendsView channelStrip={channelStrip} trackId={track.id} trackColor={track.color} />
        )}
        {activeTab === 'io' && (
          <IOView channelStrip={channelStrip} trackId={track.id} />
        )}
      </div>
    </div>
  );
};

// Inserts View Component
interface InsertsViewProps {
  channelStrip: any;
  trackId: string;
  expandedSection: string | null;
  onToggleSection: (section: string) => void;
}

const InsertsView: React.FC<InsertsViewProps> = ({
  channelStrip,
  trackId,
  expandedSection,
  onToggleSection,
}) => {
  const { routing } = useAudioEngine();

  const renderInsertSlots = (position: 'pre-eq' | 'eq' | 'post-eq') => {
    const slots = channelStrip.inserts.filter((i: Insert) => i.position === position);
    const positionLabels = {
      'pre-eq': 'Pre-EQ (Slots 0-4)',
      'eq': 'EQ (Slots 5-9)',
      'post-eq': 'Post-EQ (Slots 10-14)',
    };

    return (
      <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
        <button
          onClick={() => onToggleSection(position)}
          className="w-full flex items-center justify-between p-3 hover:bg-bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-base">{positionLabels[position]}</span>
          </div>
          {expandedSection === position ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </button>

        {expandedSection === position && (
          <div className="p-3 space-y-2 bg-bg-base/30 border-t border-border-base">
            {slots.map((insert: Insert) => (
              <InsertSlot key={insert.id} insert={insert} trackId={trackId} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-base">Plugin Inserts (15 Total)</h3>
        <div className="text-xs text-text-muted bg-bg-base px-2 py-1 rounded">
          {channelStrip.inserts.filter((i: Insert) => i.pluginInstanceId).length}/15 Active
        </div>
      </div>

      {renderInsertSlots('pre-eq')}
      {renderInsertSlots('eq')}
      {renderInsertSlots('post-eq')}
    </div>
  );
};

// Insert Slot Component
interface InsertSlotProps {
  insert: Insert;
  trackId: string;
}

const InsertSlot: React.FC<InsertSlotProps> = ({ insert, trackId }) => {
  const { routing } = useAudioEngine();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleBypass = () => {
    if (routing && insert.pluginInstanceId) {
      routing.toggleInsertBypass(trackId, insert.id);
    }
  };

  const handleLoadPlugin = async () => {
    if (routing) {
      setIsLoading(true);
      try {
        // For demo: load a test plugin
        await routing.loadPluginToInsert(trackId, insert.id, 'test-plugin');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isEmpty = !insert.pluginInstanceId;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        isEmpty
          ? 'bg-bg-surface/50 border-border-base hover:border-primary/50 hover:bg-bg-surface cursor-pointer'
          : insert.enabled
          ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40'
          : 'bg-bg-surface/30 border-border-base opacity-60'
      }`}
      onClick={isEmpty ? handleLoadPlugin : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isEmpty
              ? 'bg-bg-base text-text-muted'
              : insert.enabled
              ? 'bg-primary text-white'
              : 'bg-bg-base text-text-muted'
          }`}
        >
          {isEmpty ? <Plus className="w-4 h-4" /> : <Plug className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-text-base">
            {isEmpty ? 'Empty Slot' : insert.pluginInstanceId}
          </div>
          <div className="text-[10px] text-text-muted">Slot {insert.slot}</div>
        </div>
      </div>

      {!isEmpty && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleBypass();
          }}
          className={`p-1.5 rounded-lg transition-all ${
            insert.enabled
              ? 'bg-primary/20 text-primary hover:bg-primary/30'
              : 'bg-bg-base text-text-muted hover:bg-bg-surface'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// Sends View Component
interface SendsViewProps {
  channelStrip: any;
  trackId: string;
  trackColor: string;
}

const SendsView: React.FC<SendsViewProps> = ({ channelStrip, trackId, trackColor }) => {
  const { routing } = useAudioEngine();
  const sends = channelStrip.sends as SendType[];

  const handleCreateSend = () => {
    if (routing) {
      // For demo: create send to bus-1
      routing.createSend(trackId, 'bus-1', 'post-fader');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-base">Send Buses (8 Max)</h3>
        <button
          onClick={handleCreateSend}
          disabled={sends.length >= 8}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            sends.length >= 8
              ? 'bg-bg-base text-text-muted cursor-not-allowed opacity-50'
              : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Send
        </button>
      </div>

      {sends.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">No sends configured</p>
          <p className="text-xs mt-2">Click "Add Send" to create a send bus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sends.map((send) => (
            <SendSlot key={send.id} send={send} trackId={trackId} trackColor={trackColor} />
          ))}
        </div>
      )}
    </div>
  );
};

// Send Slot Component
interface SendSlotProps {
  send: SendType;
  trackId: string;
  trackColor: string;
}

const SendSlot: React.FC<SendSlotProps> = ({ send, trackId, trackColor }) => {
  const { routing } = useAudioEngine();
  const [level, setLevel] = useState(send.level);

  const handleLevelChange = (value: number[]) => {
    const newLevel = value[0];
    setLevel(newLevel);
    if (routing) {
      routing.setSendLevel(trackId, send.id, newLevel);
    }
  };

  const positionColors = {
    'pre-fader': 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
    'post-fader': 'from-green-500/20 to-green-600/10 border-green-500/40',
    'post-pan': 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
  };

  const positionLabels = {
    'pre-fader': 'Pre-Fader',
    'post-fader': 'Post-Fader',
    'post-pan': 'Post-Pan',
  };

  return (
    <div
      className={`p-4 rounded-lg border bg-gradient-to-r ${
        positionColors[send.position]
      } ${send.muted ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: send.enabled ? trackColor : '#666' }}
          />
          <div>
            <div className="text-sm font-semibold text-text-base">{send.destination}</div>
            <div className="text-[10px] text-text-muted">{positionLabels[send.position]}</div>
          </div>
        </div>
        <div className="text-xs font-mono font-semibold text-primary bg-bg-base px-2 py-1 rounded">
          {(level * 100).toFixed(0)}%
        </div>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-7"
        value={[level]}
        onValueChange={handleLevelChange}
        max={1}
        min={0}
        step={0.01}
        disabled={send.muted}
      >
        <Slider.Track className="bg-bg-base relative grow rounded-full h-2 shadow-inner">
          <Slider.Range className="absolute bg-gradient-to-r from-primary to-primary-hover rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-primary rounded-full hover:from-white hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-md"
          aria-label="Send Level"
        />
      </Slider.Root>
    </div>
  );
};

// I/O View Component
interface IOViewProps {
  channelStrip: any;
  trackId: string;
}

const IOView: React.FC<IOViewProps> = ({ channelStrip, trackId }) => {
  const output = channelStrip.output;

  const outputTypeColors = {
    master: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
    bus: 'from-blue-500/20 to-blue-600/10 border-blue-500/40',
    aux: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
    external: 'from-red-500/20 to-red-600/10 border-red-500/40',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-base">Input/Output Routing</h3>

      {/* Output Routing */}
      <div
        className={`p-4 rounded-lg border bg-gradient-to-r ${
          outputTypeColors[output.type as keyof typeof outputTypeColors]
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Radio className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-text-muted">Output Routing</div>
            <div className="text-sm font-semibold text-text-base capitalize">{output.type}</div>
          </div>
        </div>
        <div className="text-xs text-text-base bg-bg-base/50 px-3 py-2 rounded-lg mt-2">
          → {output.destination}
        </div>
      </div>

      {/* Input Settings */}
      <div className="p-4 rounded-lg border border-border-base bg-bg-surface/50">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-text-muted">Input Settings</div>
            <div className="text-sm font-semibold text-text-base">Stereo Input</div>
          </div>
        </div>

        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Stereo Mode</span>
            <span className="text-text-base font-semibold capitalize">{channelStrip.stereoMode}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Phase</span>
            <button
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                channelStrip.phaseInvert
                  ? 'bg-yellow-500 text-white'
                  : 'bg-bg-base text-text-muted'
              }`}
            >
              {channelStrip.phaseInvert ? 'Inverted' : 'Normal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelStripPanel;
