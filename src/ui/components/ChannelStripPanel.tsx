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
  Search,
  Filter,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import * as Dialog from '@radix-ui/react-dialog';
import { Track, Send as SendType, useTimelineStore } from '@/stores';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { toast } from 'sonner';

// Available plugin categories and plugins - Including AI-powered plugins
const AVAILABLE_PLUGINS = [
  // AI Vocal Processing
  {
    id: 'vst3-vocal-de-esser',
    name: 'AI De-Esser',
    category: 'AI Vocal',
    manufacturer: 'DAWG AI',
    description: 'Intelligent AI-powered sibilance control with adaptive frequency tracking',
    isAI: true,
  },
  {
    id: 'ai-auto-tune-pro',
    name: 'Auto-Tune Pro',
    category: 'AI Vocal',
    manufacturer: 'Antares',
    description: 'Industry-standard pitch correction with AI humanize',
    isAI: true,
  },

  // AI Mixing & Mastering
  {
    id: 'vst3-fabfilter-pro-q-4',
    name: 'FabFilter Pro-Q 4',
    category: 'AI EQ',
    manufacturer: 'FabFilter',
    description: 'Professional EQ with AI-assisted frequency analysis',
    isAI: true,
  },
  {
    id: 'vst3-slate-digital-fresh-air',
    name: 'Fresh Air',
    category: 'AI EQ',
    manufacturer: 'Slate Digital',
    description: 'AI-powered high-frequency enhancer for air and brightness',
    isAI: true,
  },
  {
    id: 'au-uad-neve-1073',
    name: 'Neve 1073',
    category: 'Channel Strip',
    manufacturer: 'UAD',
    description: 'Legendary Neve preamp/EQ - Perfect for Pop Country warmth',
    isAI: false,
  },
  {
    id: 'au-uad-ssl-e-channel-strip',
    name: 'SSL E Channel Strip',
    category: 'Channel Strip',
    manufacturer: 'UAD',
    description: 'SSL E-Series Channel Strip - Modern Hip-Hop punch and clarity',
    isAI: false,
  },

  // AI Dynamics
  {
    id: 'vst3-fabfilter-pro-c-2',
    name: 'FabFilter Pro-C 2',
    category: 'AI Compressor',
    manufacturer: 'FabFilter',
    description: 'AI-assisted compression with adaptive attack/release',
    isAI: true,
  },
  {
    id: 'vst3-fabfilter-pro-l-2',
    name: 'FabFilter Pro-L 2',
    category: 'AI Limiter',
    manufacturer: 'FabFilter',
    description: 'Transparent AI-controlled mastering limiter',
    isAI: true,
  },
  {
    id: 'ai-limiter-dawg',
    name: 'AI Limiter',
    category: 'AI Limiter',
    manufacturer: 'DAWG AI',
    description: 'Intelligent limiting with AI loudness optimization for streaming platforms',
    isAI: true,
  },
  {
    id: 'compressor-1176',
    name: '1176 Compressor',
    category: 'Compressor',
    manufacturer: 'DAWG AI',
    description: 'FET compressor emulation - Classic fast compression',
    isAI: false,
  },

  // AI Mastering
  {
    id: 'ozone-12-eq',
    name: 'Ozone 12 EQ',
    category: 'Mastering',
    manufacturer: 'iZotope',
    description: 'AI-powered mastering EQ with Master Assistant',
    isAI: true,
  },
  {
    id: 'ozone-12-imager',
    name: 'Ozone 12 Imager',
    category: 'Mastering',
    manufacturer: 'iZotope',
    description: 'AI stereo width enhancement and imaging',
    isAI: true,
  },

  // AI Utility Effects
  {
    id: 'ai-stereo-doubler',
    name: 'AI Stereo Doubler',
    category: 'AI Utility',
    manufacturer: 'DAWG AI',
    description: 'Intelligent voice/instrument doubling with AI variation and adaptive width',
    isAI: true,
  },
  {
    id: 'ai-stereo-imager',
    name: 'AI Stereo Imager',
    category: 'AI Utility',
    manufacturer: 'DAWG AI',
    description: 'Stereo width enhancement with AI mono compatibility check and frequency-dependent processing',
    isAI: true,
  },
  {
    id: 'ai-saturation',
    name: 'AI Saturation',
    category: 'AI Utility',
    manufacturer: 'DAWG AI',
    description: 'Harmonic saturation with AI-powered analog modeling (tube, tape, transformer)',
    isAI: true,
  },
  {
    id: 'ai-modulation',
    name: 'AI Modulation',
    category: 'AI Utility',
    manufacturer: 'DAWG AI',
    description: 'Multi-effect modulation (chorus/flanger/phaser) with AI depth control and tempo sync',
    isAI: true,
  },

  // Traditional Effects
  {
    id: 'reverb-plate',
    name: 'Plate Reverb',
    category: 'Reverb',
    manufacturer: 'DAWG AI',
    description: 'Classic plate reverb with AI decay adjustment',
    isAI: false,
  },
  {
    id: 'delay-tape',
    name: 'Tape Delay',
    category: 'Delay',
    manufacturer: 'DAWG AI',
    description: 'Vintage tape echo with AI-controlled modulation',
    isAI: false,
  },
  {
    id: 'saturator',
    name: 'Tube Saturator',
    category: 'Saturation',
    manufacturer: 'DAWG AI',
    description: 'Tube saturation and harmonic warmth',
    isAI: false,
  },
  {
    id: 'chorus',
    name: 'Stereo Chorus',
    category: 'Modulation',
    manufacturer: 'DAWG AI',
    description: 'Lush stereo chorus effect',
    isAI: false,
  },
];

interface ChannelStripPanelProps {
  track: Track;
  onClose: () => void;
}

export const ChannelStripPanel: React.FC<ChannelStripPanelProps> = ({ track, onClose }) => {
  const { routing } = useAudioEngine();
  const [activeTab, setActiveTab] = useState<'inserts' | 'sends' | 'io'>('inserts');
  const [expandedSection, setExpandedSection] = useState<string | null>('pre-eq');

  // Initialize local state for inserts if channelStrip doesn't exist
  const [localInserts, setLocalInserts] = useState<any[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: `insert-${track.id}-${i}`,
      slot: i,
      enabled: true,
      pluginInstanceId: null,
      position: i < 4 ? 'pre-eq' : 'post-eq',
    }))
  );

  // Use channelStrip from track if available, otherwise use local state
  const channelStrip = track.channelStrip || { inserts: localInserts };
  const routingTrack = routing?.getTrack(track.id);

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-b from-bg-surface/98 to-bg-surface-2/98 backdrop-blur-2xl border-l border-border-strong shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Compact Tabs Header */}
      <div className="flex border-b border-border-base bg-bg-base/30 relative">
        <button
          onClick={() => setActiveTab('inserts')}
          className={`flex-1 px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inserts'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Plug className="w-3.5 h-3.5" />
          Plugins
        </button>
        <button
          onClick={() => setActiveTab('sends')}
          className={`flex-1 px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sends'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Sends
        </button>
        <button
          onClick={() => setActiveTab('io')}
          className={`flex-1 px-3 py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'io'
              ? 'bg-primary text-white border-b-2 border-primary shadow-lg shadow-primary/20'
              : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          I/O
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 p-1 rounded bg-bg-surface-2 hover:bg-bg-surface-hover transition-colors text-text-muted hover:text-text-base"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
          <SendsView track={track} />
        )}
        {activeTab === 'io' && (
          <IOView track={track} />
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
  // Local state to manage inserts without routing engine
  const [inserts, setInserts] = useState<any[]>(() => {
    const existing = channelStrip?.inserts || [];
    return Array.from({ length: 8 }, (_, i) => {
      const existingInsert = existing.find((insert: any) => insert.slot === i);
      return existingInsert || {
        id: `insert-${trackId}-${i}`,
        slot: i,
        enabled: true,
        pluginInstanceId: null,
        pluginName: null,
        position: i < 4 ? 'pre-eq' : 'post-eq',
      };
    });
  });

  const handleLoadPlugin = (slotIndex: number, pluginId: string, pluginName: string) => {
    setInserts(prev => prev.map((insert, idx) =>
      idx === slotIndex
        ? { ...insert, pluginInstanceId: pluginId, pluginName }
        : insert
    ));
  };

  const handleToggleBypass = (slotIndex: number) => {
    setInserts(prev => prev.map((insert, idx) =>
      idx === slotIndex
        ? { ...insert, enabled: !insert.enabled }
        : insert
    ));
  };

  const handleRemovePlugin = (slotIndex: number) => {
    setInserts(prev => prev.map((insert, idx) =>
      idx === slotIndex
        ? { ...insert, pluginInstanceId: null, pluginName: null }
        : insert
    ));
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-text-base flex items-center gap-1.5">
          <Plug className="w-3 h-3 text-primary" />
          Plugins
        </h3>
        <div className="text-[10px] text-text-muted bg-bg-base px-1.5 py-0.5 rounded">
          {inserts.filter((i) => i.pluginInstanceId).length}/8
        </div>
      </div>

      {/* Insert Slots Grid */}
      <div className="space-y-1">
        {inserts.map((insert, index) => (
          <InsertSlot
            key={insert.id}
            insert={insert}
            trackId={trackId}
            onLoadPlugin={(pluginId, pluginName) => handleLoadPlugin(index, pluginId, pluginName)}
            onToggleBypass={() => handleToggleBypass(index)}
            onRemove={() => handleRemovePlugin(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Insert Slot Component
interface InsertSlotProps {
  insert: any;
  trackId: string;
  onLoadPlugin: (pluginId: string, pluginName: string) => void;
  onToggleBypass: () => void;
  onRemove: () => void;
}

const InsertSlot: React.FC<InsertSlotProps> = ({
  insert,
  trackId,
  onLoadPlugin,
  onToggleBypass,
  onRemove,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPluginBrowser, setShowPluginBrowser] = useState(false);
  const [showPluginUI, setShowPluginUI] = useState(false);

  const handleLoadPlugin = async (pluginId: string, pluginName: string) => {
    setIsLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 300));
      onLoadPlugin(pluginId, pluginName);
      setShowPluginBrowser(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = !insert.pluginInstanceId;

  return (
    <>
      <div
        className={`flex items-center justify-between p-2 rounded border transition-all ${
          isEmpty
            ? 'bg-bg-surface/50 border-border-base hover:border-primary/50 hover:bg-bg-surface cursor-pointer'
            : insert.enabled
            ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 cursor-pointer'
            : 'bg-bg-surface/30 border-border-base opacity-60 cursor-pointer'
        }`}
        onClick={isEmpty ? () => setShowPluginBrowser(true) : () => setShowPluginUI(true)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
              isEmpty
                ? 'bg-bg-base text-text-muted'
                : insert.enabled
                ? 'bg-primary text-white'
                : 'bg-bg-base text-text-muted'
            }`}
          >
            {isEmpty ? <Plus className="w-3 h-3" /> : <Plug className="w-3 h-3" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-text-base truncate">
              {isEmpty ? 'Empty' : insert.pluginName || insert.pluginInstanceId}
            </div>
            <div className="text-[9px] text-text-muted">Slot {insert.slot + 1}</div>
          </div>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBypass();
              }}
              className={`p-1 rounded transition-all ${
                insert.enabled
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'bg-bg-base text-text-muted hover:bg-bg-surface'
              }`}
              title={insert.enabled ? 'Bypass' : 'Enable'}
            >
              <Power className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20"
              title="Remove plugin"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Plugin Browser Dialog */}
      <PluginBrowserDialog
        open={showPluginBrowser}
        onClose={() => setShowPluginBrowser(false)}
        onSelectPlugin={handleLoadPlugin}
        isLoading={isLoading}
      />

      {/* Plugin UI Dialog */}
      {!isEmpty && (
        <PluginUIDialog
          open={showPluginUI}
          onClose={() => setShowPluginUI(false)}
          pluginId={insert.pluginInstanceId}
          pluginName={insert.pluginName}
        />
      )}
    </>
  );
};

// Plugin Browser Dialog Component
interface PluginBrowserDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectPlugin: (pluginId: string, pluginName: string) => void;
  isLoading: boolean;
}

const PluginBrowserDialog: React.FC<PluginBrowserDialogProps> = ({
  open,
  onClose,
  onSelectPlugin,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pluginTypeFilter, setPluginTypeFilter] = useState<'all' | 'ai' | 'user'>('all');

  const filteredPlugins = AVAILABLE_PLUGINS.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = pluginTypeFilter === 'all' ||
                       (pluginTypeFilter === 'ai' && plugin.isAI === true) ||
                       (pluginTypeFilter === 'user' && plugin.isAI === false);
    return matchesSearch && matchesType;
  });

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] bg-bg-surface rounded-xl shadow-2xl border border-border-strong z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-base">
            <div>
              <Dialog.Title className="text-xl font-bold text-text-base">Plugin Browser</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted mt-1">
                Select a plugin to insert
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors text-text-muted hover:text-text-base">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-border-base space-y-3">
            {/* Simplified 3-Button Filter: All / AI / User */}
            <div className="flex gap-2 bg-bg-base rounded-lg p-1">
              <button
                onClick={() => setPluginTypeFilter('all')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  pluginTypeFilter === 'all'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPluginTypeFilter('ai')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  pluginTypeFilter === 'ai'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
                }`}
              >
                AI
              </button>
              <button
                onClick={() => setPluginTypeFilter('user')}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  pluginTypeFilter === 'user'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-muted hover:text-text-base hover:bg-bg-surface/50'
                }`}
              >
                User
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-base border border-border-base rounded-lg text-text-base placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Plugin List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredPlugins.map(plugin => {
                const isAIPlugin = plugin.isAI === true;
                return (
                  <button
                    key={plugin.id}
                    onClick={() => onSelectPlugin(plugin.id, plugin.name)}
                    disabled={isLoading}
                    className={`w-full p-4 rounded-lg border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      isAIPlugin
                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/40 hover:border-purple-500/60 hover:from-purple-500/20 hover:to-blue-500/20'
                        : 'border-border-base bg-bg-surface/50 hover:bg-bg-surface hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isAIPlugin
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                            : 'bg-primary/20'
                        }`}>
                          {isAIPlugin ? (
                            <Zap className="w-5 h-5 text-white" />
                          ) : (
                            <Plug className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-text-base">{plugin.name}</div>
                            {isAIPlugin && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded uppercase tracking-wide">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">{plugin.manufacturer}</div>
                          <div className="text-xs text-text-muted mt-1">{plugin.description}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        isAIPlugin
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {plugin.category}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredPlugins.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <Plug className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No plugins found</p>
                  <p className="text-xs mt-2">Try a different search or category</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-base bg-bg-base/30">
            <div className="text-xs text-text-muted text-center">
              {filteredPlugins.length} plugin{filteredPlugins.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Sends View Component
interface SendsViewProps {
  track: Track;
}

const SendsView: React.FC<SendsViewProps> = ({ track }) => {
  const { tracks, updateTrack } = useTimelineStore();
  const sends = track.sends || [];

  // Get available aux tracks for send destinations
  const auxTracks = tracks.filter(t => t.trackType === 'aux' && t.id !== track.id);

  // Create 8 send slots (similar to inserts)
  const sendSlots = Array.from({ length: 8 }, (_, i) => {
    const existingSend = sends[i];
    return existingSend || null;
  });

  const handleCreateSend = (slotIndex: number, auxTrackId: string, preFader: boolean) => {
    const newSend: SendType = {
      id: `send-${Date.now()}`,
      destination: auxTrackId,
      level: 0.8,
      pan: 0,
      preFader,
      enabled: true,
    };

    const newSends = [...sends];
    // Insert at the specific slot index
    newSends[slotIndex] = newSend;

    updateTrack(track.id, {
      sends: newSends.filter(s => s !== null),
    });

    toast.success('Send created');
  };

  const handleRemoveSend = (sendId: string) => {
    updateTrack(track.id, {
      sends: sends.filter(s => s.id !== sendId),
    });
    toast.success('Send removed');
  };

  const handleUpdateSend = (sendId: string, updates: Partial<SendType>) => {
    updateTrack(track.id, {
      sends: sends.map(s => s.id === sendId ? { ...s, ...updates } : s),
    });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-text-base flex items-center gap-1.5">
          <Send className="w-3 h-3 text-primary" />
          Sends
        </h3>
        <div className="text-[10px] text-text-muted bg-bg-base px-1.5 py-0.5 rounded">
          {sends.length}/8
        </div>
      </div>

      {/* Send Slots Grid */}
      <div className="space-y-1">
        {sendSlots.map((send, index) => (
          <SendSlotButton
            key={`send-slot-${index}`}
            send={send}
            slotIndex={index}
            track={track}
            auxTracks={auxTracks}
            onCreateSend={handleCreateSend}
            onUpdateSend={handleUpdateSend}
            onRemoveSend={handleRemoveSend}
          />
        ))}
      </div>
    </div>
  );
};

// Send Slot Button Component (for empty/filled slots)
interface SendSlotButtonProps {
  send: SendType | null;
  slotIndex: number;
  track: Track;
  auxTracks: Track[];
  onCreateSend: (slotIndex: number, auxTrackId: string, preFader: boolean) => void;
  onUpdateSend: (sendId: string, updates: Partial<SendType>) => void;
  onRemoveSend: (sendId: string) => void;
}

const SendSlotButton: React.FC<SendSlotButtonProps> = ({
  send,
  slotIndex,
  track,
  auxTracks,
  onCreateSend,
  onUpdateSend,
  onRemoveSend,
}) => {
  const { tracks } = useTimelineStore();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const isEmpty = !send;

  const destinationTrack = send ? tracks.find(t => t.id === send.destination) : null;

  if (isEmpty) {
    // Empty send slot
    return (
      <>
        <div
          className="flex items-center justify-between p-2 rounded border bg-bg-surface/50 border-border-base hover:border-primary/50 hover:bg-bg-surface cursor-pointer transition-all"
          onClick={() => setShowSendDialog(true)}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-bg-base text-text-muted flex-shrink-0">
              <Plus className="w-3 h-3" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-text-base">Empty</div>
              <div className="text-[9px] text-text-muted">Slot {slotIndex + 1}</div>
            </div>
          </div>
        </div>

        {/* Send Creation Dialog */}
        {showSendDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center">
            <div className="bg-bg-surface rounded-xl border border-border-strong shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-text-base mb-4">Create Send (Slot {slotIndex + 1})</h3>

              <div className="space-y-4">
                {auxTracks.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No aux tracks available</p>
                    <p className="text-xs mt-2">Create an aux track first</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-text-muted mb-2 block">Select Destination</label>
                    <div className="space-y-2">
                      {auxTracks.map(auxTrack => (
                        <div key={auxTrack.id} className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-bg-base rounded-lg border border-border-base">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: auxTrack.color }} />
                            <span className="text-sm font-medium text-text-base flex-1">{auxTrack.name}</span>
                            <span className="text-xs text-text-muted">{auxTrack.channels === 'mono' ? 'Mono' : 'Stereo'}</span>
                          </div>
                          <div className="flex gap-2 pl-5">
                            <button
                              onClick={() => {
                                onCreateSend(slotIndex, auxTrack.id, true);
                                setShowSendDialog(false);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/40 transition-all"
                            >
                              Pre-Fader
                            </button>
                            <button
                              onClick={() => {
                                onCreateSend(slotIndex, auxTrack.id, false);
                                setShowSendDialog(false);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/40 transition-all"
                            >
                              Post-Fader
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowSendDialog(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-bg-base text-text-base hover:bg-bg-surface-hover transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Filled send slot - use existing SendSlot component
  return (
    <SendSlot
      send={send}
      destinationName={destinationTrack?.name || 'Unknown'}
      onUpdate={(updates) => onUpdateSend(send.id, updates)}
      onRemove={() => onRemoveSend(send.id)}
      trackColor={track.color}
    />
  );
};

// Send Slot Component
interface SendSlotProps {
  send: SendType;
  destinationName: string;
  onUpdate: (updates: Partial<SendType>) => void;
  onRemove: () => void;
  trackColor: string;
}

const SendSlot: React.FC<SendSlotProps> = ({ send, destinationName, onUpdate, onRemove, trackColor }) => {
  const [level, setLevel] = useState(send.level);

  const handleLevelChange = (value: number[]) => {
    const newLevel = value[0];
    setLevel(newLevel);
    onUpdate({ level: newLevel });
  };

  const handleToggleEnabled = () => {
    onUpdate({ enabled: !send.enabled });
  };

  const positionColor = send.preFader
    ? 'from-blue-500/20 to-blue-600/10 border-blue-500/40'
    : 'from-green-500/20 to-green-600/10 border-green-500/40';

  const positionLabel = send.preFader ? 'Pre-Fader' : 'Post-Fader';

  return (
    <div
      className={`p-4 rounded-lg border bg-gradient-to-r ${positionColor} ${
        !send.enabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleEnabled}
            className="w-3 h-3 rounded-full transition-all hover:scale-110"
            style={{ backgroundColor: send.enabled ? trackColor : '#666' }}
            title={send.enabled ? 'Disable send' : 'Enable send'}
          />
          <div>
            <div className="text-sm font-semibold text-text-base">{destinationName}</div>
            <div className="text-[10px] text-text-muted">{positionLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono font-semibold text-primary bg-bg-base px-2 py-1 rounded">
            {(level * 100).toFixed(0)}%
          </div>
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
            title="Remove send"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-7"
        value={[level]}
        onValueChange={handleLevelChange}
        max={1}
        min={0}
        step={0.01}
        disabled={!send.enabled}
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
  track: Track;
}

const IOView: React.FC<IOViewProps> = ({ track }) => {
  const { tracks, updateTrack } = useTimelineStore();
  const [showOutputDialog, setShowOutputDialog] = useState(false);

  const outputDestination = track.outputDestination || 'master';

  // Get destination track if routed to an aux track
  const destinationTrack = outputDestination !== 'master'
    ? tracks.find(t => t.id === outputDestination)
    : null;

  // Get available output destinations (master + all aux tracks except this one)
  const availableOutputs = [
    { id: 'master', name: 'Master', type: 'master' as const },
    ...tracks
      .filter(t => t.trackType === 'aux' && t.id !== track.id)
      .map(t => ({ id: t.id, name: t.name, type: 'aux' as const })),
  ];

  const handleSetOutput = (destinationId: string) => {
    updateTrack(track.id, { outputDestination: destinationId });
    setShowOutputDialog(false);
    toast.success(`Output routed to ${destinationId === 'master' ? 'Master' : destinationTrack?.name || 'Unknown'}`);
  };

  const outputTypeColors = {
    master: 'from-amber-500/20 to-amber-600/10 border-amber-500/40',
    aux: 'from-purple-500/20 to-purple-600/10 border-purple-500/40',
  };

  const outputColor = destinationTrack ? outputTypeColors.aux : outputTypeColors.master;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-base">Input/Output Routing</h3>

      {/* Output Routing */}
      <div className={`p-4 rounded-lg border bg-gradient-to-r ${outputColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-primary" />
            <div>
              <div className="text-xs text-text-muted">Output Routing</div>
              <div className="text-sm font-semibold text-text-base">
                {destinationTrack ? destinationTrack.name : 'Master'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowOutputDialog(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 transition-all"
          >
            Change
          </button>
        </div>
        <div className="text-xs text-text-base bg-bg-base/50 px-3 py-2 rounded-lg">
          → {destinationTrack ? `${destinationTrack.name} (${destinationTrack.channels})` : 'Master Output'}
        </div>
      </div>

      {/* Input Settings */}
      <div className="p-4 rounded-lg border border-border-base bg-bg-surface/50">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-text-muted">Input Settings</div>
            <div className="text-sm font-semibold text-text-base">
              {track.channels === 'mono' ? 'Mono' : 'Stereo'} Input
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Track Type</span>
            <span className="text-text-base font-semibold capitalize">{track.trackType}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Channels</span>
            <span className="text-text-base font-semibold capitalize">{track.channels}</span>
          </div>
        </div>
      </div>

      {/* Output Selection Dialog */}
      {showOutputDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-bg-surface rounded-xl border border-border-strong shadow-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-text-base mb-4">Select Output Destination</h3>

            <div className="space-y-2">
              {availableOutputs.map(output => (
                <button
                  key={output.id}
                  onClick={() => handleSetOutput(output.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    outputDestination === output.id
                      ? 'bg-primary/20 border-primary text-primary font-semibold'
                      : 'bg-bg-base border-border-base text-text-base hover:bg-bg-surface-hover'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{output.name}</div>
                    <div className="text-xs text-text-muted capitalize">{output.type}</div>
                  </div>
                  {outputDestination === output.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowOutputDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-bg-base text-text-base hover:bg-bg-surface-hover transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Plugin UI Dialog Component - Opens when clicking on a loaded plugin
interface PluginUIDialogProps {
  open: boolean;
  onClose: () => void;
  pluginId: string;
  pluginName: string;
}

const PluginUIDialog: React.FC<PluginUIDialogProps> = ({
  open,
  onClose,
  pluginId,
  pluginName,
}) => {
  // Plugin parameters state
  const [parameters, setParameters] = useState(() => getDefaultParameters(pluginId));

  const handleParameterChange = (paramId: string, value: number) => {
    setParameters(prev => ({ ...prev, [paramId]: value }));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-h-[80vh] bg-gradient-to-b from-bg-surface to-bg-surface-2 rounded-xl shadow-2xl border border-border-strong z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-base bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-text-base">{pluginName}</Dialog.Title>
                <Dialog.Description className="text-xs text-text-muted">AI Plugin Parameters</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-bg-surface-hover transition-colors text-text-muted hover:text-text-base">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Plugin Parameters */}
          <div className="flex-1 overflow-y-auto p-6">
            <PluginParameters
              pluginId={pluginId}
              parameters={parameters}
              onParameterChange={handleParameterChange}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-base bg-bg-base/30 flex items-center justify-between">
            <div className="text-xs text-text-muted">
              Web Audio Plugin
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setParameters(getDefaultParameters(pluginId))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg-surface text-text-base hover:bg-bg-surface-hover transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Plugin Parameters Component
interface PluginParametersProps {
  pluginId: string;
  parameters: Record<string, number>;
  onParameterChange: (paramId: string, value: number) => void;
}

const PluginParameters: React.FC<PluginParametersProps> = ({
  pluginId,
  parameters,
  onParameterChange,
}) => {
  const paramConfig = getPluginParameterConfig(pluginId);

  return (
    <div className="grid grid-cols-2 gap-4">
      {paramConfig.map((param) => (
        <div key={param.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-base">{param.label}</label>
            <span className="text-xs text-primary font-mono">
              {formatParameterValue(parameters[param.id], param)}
            </span>
          </div>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-8"
            value={[parameters[param.id]]}
            onValueChange={(value) => onParameterChange(param.id, value[0])}
            max={param.max}
            min={param.min}
            step={param.step}
          >
            <Slider.Track className="bg-bg-base relative grow rounded-full h-2 shadow-inner border border-border-base">
              <Slider.Range className="absolute bg-gradient-to-r from-primary to-purple-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-primary rounded-full hover:from-white hover:to-gray-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-md cursor-grab active:cursor-grabbing"
              aria-label={param.label}
            />
          </Slider.Root>
          <p className="text-[10px] text-text-dim">{param.description}</p>
        </div>
      ))}
    </div>
  );
};

// Helper functions for plugin parameters
function getDefaultParameters(pluginId: string): Record<string, number> {
  const config = getPluginParameterConfig(pluginId);
  const defaults: Record<string, number> = {};
  config.forEach(param => {
    defaults[param.id] = param.default;
  });
  return defaults;
}

interface ParameterConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
  description: string;
}

function getPluginParameterConfig(pluginId: string): ParameterConfig[] {
  // Define parameters for each AI plugin
  const parameterConfigs: Record<string, ParameterConfig[]> = {
    'vst3-vocal-de-esser': [
      { id: 'frequency', label: 'Frequency', min: 2000, max: 12000, default: 7000, step: 100, unit: 'Hz', description: 'Sibilance frequency range' },
      { id: 'threshold', label: 'Threshold', min: -60, max: 0, default: -20, step: 1, unit: 'dB', description: 'Detection threshold' },
      { id: 'range', label: 'Range', min: 0, max: 20, default: 6, step: 0.5, unit: 'dB', description: 'Reduction amount' },
      { id: 'attack', label: 'Attack', min: 0.1, max: 10, default: 1, step: 0.1, unit: 'ms', description: 'Response time' },
    ],
    'ai-auto-tune-pro': [
      { id: 'retune_speed', label: 'Retune Speed', min: 0, max: 100, default: 20, step: 1, unit: '%', description: 'Pitch correction speed' },
      { id: 'humanize', label: 'Humanize', min: 0, max: 100, default: 50, step: 1, unit: '%', description: 'Natural variation' },
      { id: 'flex_tune', label: 'Flex-Tune', min: 0, max: 100, default: 30, step: 1, unit: '%', description: 'Vibrato preservation' },
      { id: 'throat_length', label: 'Throat Length', min: -100, max: 100, default: 0, step: 1, unit: '%', description: 'Formant adjustment' },
    ],
    'vst3-fabfilter-pro-q-4': [
      { id: 'band_1_freq', label: 'Low Freq', min: 20, max: 500, default: 100, step: 1, unit: 'Hz', description: 'Bass frequency' },
      { id: 'band_1_gain', label: 'Low Gain', min: -12, max: 12, default: 0, step: 0.1, unit: 'dB', description: 'Bass level' },
      { id: 'band_2_freq', label: 'Mid Freq', min: 200, max: 5000, default: 1000, step: 10, unit: 'Hz', description: 'Mid frequency' },
      { id: 'band_2_gain', label: 'Mid Gain', min: -12, max: 12, default: 0, step: 0.1, unit: 'dB', description: 'Mid level' },
      { id: 'band_3_freq', label: 'High Freq', min: 2000, max: 20000, default: 8000, step: 100, unit: 'Hz', description: 'Treble frequency' },
      { id: 'band_3_gain', label: 'High Gain', min: -12, max: 12, default: 0, step: 0.1, unit: 'dB', description: 'Treble level' },
    ],
    'vst3-fabfilter-pro-c-2': [
      { id: 'threshold', label: 'Threshold', min: -60, max: 0, default: -20, step: 1, unit: 'dB', description: 'Compression threshold' },
      { id: 'ratio', label: 'Ratio', min: 1, max: 20, default: 4, step: 0.1, unit: ':1', description: 'Compression ratio' },
      { id: 'attack', label: 'Attack', min: 0.01, max: 100, default: 5, step: 0.1, unit: 'ms', description: 'Attack time' },
      { id: 'release', label: 'Release', min: 1, max: 1000, default: 100, step: 1, unit: 'ms', description: 'Release time' },
      { id: 'makeup', label: 'Makeup Gain', min: 0, max: 24, default: 0, step: 0.1, unit: 'dB', description: 'Output gain' },
      { id: 'mix', label: 'Mix', min: 0, max: 100, default: 100, step: 1, unit: '%', description: 'Dry/Wet mix' },
    ],
    'ai-stereo-doubler': [
      { id: 'mix', label: 'Mix', min: 0, max: 100, default: 50, step: 1, unit: '%', description: 'Wet/Dry mix' },
      { id: 'aiVariation', label: 'AI Variation', min: 0, max: 100, default: 70, step: 1, unit: '%', description: 'AI-generated variation amount' },
      { id: 'separation', label: 'Separation', min: 0, max: 100, default: 60, step: 1, unit: '%', description: 'Stereo separation width' },
      { id: 'detune', label: 'Detune', min: -50, max: 50, default: 10, step: 1, unit: 'cents', description: 'Pitch variation' },
      { id: 'delay', label: 'Delay', min: 0, max: 50, default: 15, step: 1, unit: 'ms', description: 'Timing offset' },
      { id: 'brightness', label: 'Brightness', min: -12, max: 12, default: 2, step: 0.5, unit: 'dB', description: 'High frequency adjustment' },
    ],
    'ai-stereo-imager': [
      { id: 'width', label: 'Master Width', min: 0, max: 200, default: 120, step: 1, unit: '%', description: 'Overall stereo width' },
      { id: 'lowWidth', label: 'Low Width', min: 0, max: 100, default: 80, step: 1, unit: '%', description: 'Low frequency width' },
      { id: 'midWidth', label: 'Mid Width', min: 0, max: 200, default: 140, step: 1, unit: '%', description: 'Mid frequency width' },
      { id: 'highWidth', label: 'High Width', min: 0, max: 200, default: 160, step: 1, unit: '%', description: 'High frequency width' },
      { id: 'bassMonoFreq', label: 'Bass Mono', min: 0, max: 200, default: 120, step: 5, unit: 'Hz', description: 'Mono below this frequency' },
      { id: 'correlation', label: 'Correlation', min: -1, max: 1, default: 0.7, step: 0.1, description: 'Stereo correlation target' },
    ],
    'ai-limiter-dawg': [
      { id: 'ceiling', label: 'Ceiling', min: -20, max: 0, default: -0.3, step: 0.1, unit: 'dB', description: 'Output ceiling' },
      { id: 'threshold', label: 'Threshold', min: -20, max: 0, default: -6, step: 0.1, unit: 'dB', description: 'Limiting threshold' },
      { id: 'targetLUFS', label: 'Target LUFS', min: -23, max: -6, default: -14, step: 1, unit: 'LUFS', description: 'Target loudness level' },
      { id: 'attack', label: 'Attack', min: 0.01, max: 10, default: 0.5, step: 0.01, unit: 'ms', description: 'Attack time' },
      { id: 'release', label: 'Release', min: 1, max: 1000, default: 100, step: 1, unit: 'ms', description: 'Release time' },
      { id: 'link', label: 'Stereo Link', min: 0, max: 100, default: 100, step: 1, unit: '%', description: 'Stereo linking amount' },
    ],
    'ai-saturation': [
      { id: 'drive', label: 'Drive', min: 0, max: 100, default: 30, step: 1, unit: '%', description: 'Saturation amount' },
      { id: 'mix', label: 'Mix', min: 0, max: 100, default: 70, step: 1, unit: '%', description: 'Wet/Dry mix' },
      { id: 'evenHarmonics', label: 'Even Harmonics', min: 0, max: 100, default: 60, step: 1, unit: '%', description: 'Even harmonic content' },
      { id: 'oddHarmonics', label: 'Odd Harmonics', min: 0, max: 100, default: 40, step: 1, unit: '%', description: 'Odd harmonic content' },
      { id: 'warmth', label: 'Warmth', min: -12, max: 12, default: 2, step: 0.5, unit: 'dB', description: 'Low frequency warmth' },
      { id: 'brightness', label: 'Brightness', min: -12, max: 12, default: 1, step: 0.5, unit: 'dB', description: 'High frequency brightness' },
    ],
    'ai-modulation': [
      { id: 'mix', label: 'Mix', min: 0, max: 100, default: 40, step: 1, unit: '%', description: 'Wet/Dry mix' },
      { id: 'rate', label: 'Rate', min: 0.01, max: 10, default: 0.5, step: 0.01, unit: 'Hz', description: 'Modulation rate' },
      { id: 'depth', label: 'Depth', min: 0, max: 100, default: 50, step: 1, unit: '%', description: 'Modulation depth' },
      { id: 'feedback', label: 'Feedback', min: -100, max: 100, default: 20, step: 1, unit: '%', description: 'Feedback amount' },
      { id: 'voices', label: 'Voices', min: 1, max: 8, default: 3, step: 1, description: 'Number of chorus voices' },
      { id: 'shimmer', label: 'Shimmer', min: 0, max: 100, default: 30, step: 1, unit: '%', description: 'High frequency shimmer' },
    ],
  };

  // Return parameters for the specific plugin, or generic defaults
  return parameterConfigs[pluginId] || [
    { id: 'param1', label: 'Parameter 1', min: 0, max: 100, default: 50, step: 1, description: 'Generic parameter' },
    { id: 'param2', label: 'Parameter 2', min: 0, max: 100, default: 50, step: 1, description: 'Generic parameter' },
    { id: 'param3', label: 'Parameter 3', min: 0, max: 100, default: 50, step: 1, description: 'Generic parameter' },
    { id: 'param4', label: 'Parameter 4', min: 0, max: 100, default: 50, step: 1, description: 'Generic parameter' },
  ];
}

function formatParameterValue(value: number, param: ParameterConfig): string {
  const formatted = value.toFixed(param.step < 1 ? 1 : 0);
  return param.unit ? `${formatted}${param.unit}` : formatted;
}

export default ChannelStripPanel;
