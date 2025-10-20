import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Music2, TrendingUp, Sliders, Wand2, ChevronDown, Scissors, AlignCenter, Music, Volume2, Zap, Mic, Drum, Guitar, Piano, Radio } from 'lucide-react';

export interface AIDawgMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  requiresSelection?: boolean;
  category: 'vocal' | 'production' | 'ai';
}

interface AIDawgMenuProps {
  selectedClipCount: number;
  onAIComp: () => void;
  onAITimeAlign: () => void;
  onAIPitch: () => void;
  onAIMix: (style?: string) => void;
  onAIMaster: () => void;
  onAIMusic: () => void;
  onAIDawg: () => void;
  onAnalyzeVocals: () => void;
  onGenerateHarmony: () => void;
  onApplyGenrePreset: (genre: string) => void;
  onGenerateBeat: (style?: string) => void;
  onGenerateInstrument: (type?: string) => void;
  onComposeFullSong: (style?: string) => void;
  onVoiceMemo: () => void;
  onToggleMultiTrackRecorder: () => void;
}

export const AIDawgMenu: React.FC<AIDawgMenuProps> = ({
  selectedClipCount,
  onAIComp,
  onAITimeAlign,
  onAIPitch,
  onAIMix,
  onAIMaster,
  onAIMusic,
  onAIDawg,
  onAnalyzeVocals,
  onGenerateHarmony,
  onApplyGenrePreset,
  onGenerateBeat,
  onGenerateInstrument,
  onComposeFullSong,
  onVoiceMemo,
  onToggleMultiTrackRecorder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenreSubmenu, setShowGenreSubmenu] = useState(false);
  const [showBeatStyleSubmenu, setShowBeatStyleSubmenu] = useState(false);
  const [showInstrumentSubmenu, setShowInstrumentSubmenu] = useState(false);
  const [showCompositionSubmenu, setShowCompositionSubmenu] = useState(false);
  const [showMixStyleSubmenu, setShowMixStyleSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const genres = [
    { id: 'morgan-wallen', label: 'Morgan Wallen Style', emoji: '🎸' },
    { id: 'drake', label: 'Drake Style', emoji: '🎤' },
    { id: 'pop', label: 'Modern Pop', emoji: '✨' },
    { id: 'rock', label: 'Rock', emoji: '🤘' },
    { id: 'electronic', label: 'Electronic', emoji: '🎹' },
  ];

  const beatStyles = [
    { id: 'metro-boomin', label: 'Metro Boomin', emoji: '🔥' },
    { id: 'drake', label: '808 Mafia', emoji: '💎' },
    { id: 'timbaland', label: 'Timbaland', emoji: '⚡' },
    { id: 'pharrell', label: 'Pharrell', emoji: '✨' },
    { id: 'southside', label: 'Southside', emoji: '🎯' },
    { id: 'pierre-bourne', label: 'Pierre Bourne', emoji: '🌟' },
  ];

  const instrumentTypes = [
    { id: 'bass', label: 'Bass Line', emoji: '🎸' },
    { id: 'melody', label: 'Melody', emoji: '🎹' },
    { id: 'chords', label: 'Chord Progression', emoji: '🎼' },
    { id: 'synth', label: 'Synth Lead', emoji: '🎛️' },
    { id: 'guitar', label: 'Guitar Riff', emoji: '🎸' },
  ];

  const compositionStyles = [
    { id: 'full-beat', label: 'Full Beat (Trap/Hip-Hop)', emoji: '🔥' },
    { id: 'lo-fi', label: 'Lo-Fi Instrumental', emoji: '🌙' },
    { id: 'pop-track', label: 'Pop Production', emoji: '✨' },
    { id: 'edm-drop', label: 'EDM Drop', emoji: '⚡' },
    { id: 'rock-track', label: 'Rock Song', emoji: '🤘' },
  ];

  const mixStyles = [
    { id: 'clean', label: 'Clean Mix', emoji: '✨', description: 'Transparent, natural sound' },
    { id: 'warm', label: 'Warm Mix', emoji: '🔥', description: 'Analog warmth, vintage vibe' },
    { id: 'punchy', label: 'Punchy Mix', emoji: '💥', description: 'Aggressive, in-your-face' },
    { id: 'radio-ready', label: 'Radio-Ready', emoji: '📻', description: 'Competitive loudness' },
    { id: 'auto', label: 'AI Auto (Intelligent)', emoji: '🤖', description: 'Let AI choose the best style' },
  ];

  const menuItems: AIDawgMenuItem[] = [
    // DAWG AI FEATURES
    {
      id: 'ai-dawg-full',
      label: '⚡ DAWG AI (Full)',
      icon: <Zap className="w-5 h-5" />,
      action: onAIDawg,
      requiresSelection: true,
      category: 'ai',
    },
    {
      id: 'ai-voice-memo',
      label: 'AI Voice Memo',
      icon: <Mic className="w-5 h-5" />,
      action: onVoiceMemo,
      category: 'ai',
    },
    {
      id: 'multi-track-recorder',
      label: 'Multi-Track Recorder',
      icon: <Radio className="w-5 h-5" />,
      action: onToggleMultiTrackRecorder,
      category: 'ai',
    },
    {
      id: 'ai-comp',
      label: 'AI Comp',
      icon: <Scissors className="w-5 h-5" />,
      action: onAIComp,
      requiresSelection: true,
      category: 'ai',
    },
    {
      id: 'ai-time-align',
      label: 'AI Time Align',
      icon: <AlignCenter className="w-5 h-5" />,
      action: onAITimeAlign,
      requiresSelection: true,
      category: 'ai',
    },
    {
      id: 'ai-pitch-correct',
      label: 'AI Pitch Correct',
      icon: <Music className="w-5 h-5" />,
      action: onAIPitch,
      requiresSelection: true,
      category: 'ai',
    },
    {
      id: 'ai-mix',
      label: 'AI Mix',
      icon: <Sliders className="w-5 h-5" />,
      action: () => setShowMixStyleSubmenu(!showMixStyleSubmenu),
      requiresSelection: true,
      category: 'ai',
    },
    {
      id: 'ai-master',
      label: 'AI Master',
      icon: <Volume2 className="w-5 h-5" />,
      action: onAIMaster,
      requiresSelection: true,
      category: 'ai',
    },
    // VOCAL TOOLS
    {
      id: 'analyze-vocals',
      label: 'Analyze Vocals',
      icon: <TrendingUp className="w-5 h-5" />,
      action: onAnalyzeVocals,
      requiresSelection: true,
      category: 'vocal',
    },
    {
      id: 'generate-harmony',
      label: 'Generate Harmony',
      icon: <Music2 className="w-5 h-5" />,
      action: onGenerateHarmony,
      requiresSelection: true,
      category: 'vocal',
    },
    {
      id: 'apply-genre-preset',
      label: 'Apply Genre Preset',
      icon: <Wand2 className="w-5 h-5" />,
      action: () => setShowGenreSubmenu(!showGenreSubmenu),
      requiresSelection: true,
      category: 'vocal',
    },
    // PRODUCTION
    {
      id: 'ai-beat-generation',
      label: 'AI Beat Generation',
      icon: <Drum className="w-5 h-5" />,
      action: () => setShowBeatStyleSubmenu(!showBeatStyleSubmenu),
      category: 'production',
    },
    {
      id: 'ai-instrument-gen',
      label: 'AI Instrument Gen',
      icon: <Guitar className="w-5 h-5" />,
      action: () => setShowInstrumentSubmenu(!showInstrumentSubmenu),
      category: 'production',
    },
    {
      id: 'ai-full-composition',
      label: 'AI Full Composition',
      icon: <Radio className="w-5 h-5" />,
      action: () => setShowCompositionSubmenu(!showCompositionSubmenu),
      category: 'production',
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowGenreSubmenu(false);
        setShowBeatStyleSubmenu(false);
        setShowInstrumentSubmenu(false);
        setShowCompositionSubmenu(false);
        setShowMixStyleSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuItemClick = (item: AIDawgMenuItem) => {
    if (item.requiresSelection && selectedClipCount === 0) {
      // Show tooltip or warning
      return;
    }

    // Don't close menu for submenu items
    const submenuItems = ['apply-genre-preset', 'ai-beat-generation', 'ai-instrument-gen', 'ai-full-composition', 'ai-mix'];
    if (!submenuItems.includes(item.id)) {
      item.action();
      setIsOpen(false);
      setShowGenreSubmenu(false);
      setShowBeatStyleSubmenu(false);
      setShowInstrumentSubmenu(false);
      setShowCompositionSubmenu(false);
      setShowMixStyleSubmenu(false);
    } else {
      item.action();
    }
  };

  const handleGenreSelect = (genreId: string) => {
    onApplyGenrePreset(genreId);
    setIsOpen(false);
    setShowGenreSubmenu(false);
  };

  const handleBeatStyleSelect = (styleId: string) => {
    onGenerateBeat(styleId);
    setIsOpen(false);
    setShowBeatStyleSubmenu(false);
  };

  const handleInstrumentSelect = (instrumentId: string) => {
    onGenerateInstrument(instrumentId);
    setIsOpen(false);
    setShowInstrumentSubmenu(false);
  };

  const handleCompositionSelect = (styleId: string) => {
    onComposeFullSong(styleId);
    setIsOpen(false);
    setShowCompositionSubmenu(false);
  };

  const handleMixStyleSelect = (styleId: string) => {
    onAIMix(styleId);
    setIsOpen(false);
    setShowMixStyleSubmenu(false);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai':
        return '⚡ DAWG AI FEATURES';
      case 'vocal':
        return 'VOCAL TOOLS';
      case 'production':
        return 'AI MUSIC GENERATION';
      default:
        return category;
    }
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AIDawgMenuItem[]>);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium shadow-lg shadow-purple-500/25 transition-all"
      >
        <Sparkles className="w-5 h-5" />
        DAWG AI
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Clip Counter */}
      {selectedClipCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          {selectedClipCount}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden z-50">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="border-b border-white/10 last:border-0">
              {/* Category Header */}
              <div className="px-4 py-2 bg-white/5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {getCategoryLabel(category)}
                </span>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                {items.map((item) => {
                  const isDisabled = item.requiresSelection && selectedClipCount === 0;

                  return (
                    <div key={item.id} className="relative">
                      <button
                        onClick={() => handleMenuItemClick(item)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-purple-500/20 hover:text-white'
                        } ${item.id === 'apply-genre-preset' && showGenreSubmenu ? 'bg-purple-500/10' : ''}`}
                      >
                        <div className={`${isDisabled ? 'text-gray-500' : 'text-purple-400'}`}>
                          {item.icon}
                        </div>
                        <span className={`flex-1 text-left text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-200'}`}>
                          {item.label}
                        </span>
                        {item.requiresSelection && (
                          <span className="text-xs text-gray-500">
                            {selectedClipCount > 0 ? `${selectedClipCount} clip${selectedClipCount > 1 ? 's' : ''}` : 'Select clips'}
                          </span>
                        )}
                        {item.id === 'apply-genre-preset' && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showGenreSubmenu ? '-rotate-90' : 'rotate-0'}`} />
                        )}
                        {item.id === 'ai-beat-generation' && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBeatStyleSubmenu ? '-rotate-90' : 'rotate-0'}`} />
                        )}
                        {item.id === 'ai-instrument-gen' && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showInstrumentSubmenu ? '-rotate-90' : 'rotate-0'}`} />
                        )}
                        {item.id === 'ai-full-composition' && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCompositionSubmenu ? '-rotate-90' : 'rotate-0'}`} />
                        )}
                        {item.id === 'ai-mix' && (
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMixStyleSubmenu ? '-rotate-90' : 'rotate-0'}`} />
                        )}
                      </button>

                      {/* Mix Style Submenu */}
                      {item.id === 'ai-mix' && showMixStyleSubmenu && !isDisabled && (
                        <div className="bg-black/60 border-t border-white/10 py-2">
                          {mixStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleMixStyleSelect(style.id)}
                              className="w-full flex items-center gap-3 px-8 py-2 hover:bg-purple-500/20 transition-all group"
                            >
                              <span className="text-lg">{style.emoji}</span>
                              <div className="flex-1 text-left">
                                <div className="text-sm text-gray-300 font-medium">{style.label}</div>
                                <div className="text-xs text-gray-500 group-hover:text-gray-400">{style.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Genre Submenu */}
                      {item.id === 'apply-genre-preset' && showGenreSubmenu && !isDisabled && (
                        <div className="bg-black/60 border-t border-white/10 py-2">
                          {genres.map((genre) => (
                            <button
                              key={genre.id}
                              onClick={() => handleGenreSelect(genre.id)}
                              className="w-full flex items-center gap-3 px-8 py-2 hover:bg-purple-500/20 transition-all"
                            >
                              <span className="text-lg">{genre.emoji}</span>
                              <span className="text-sm text-gray-300">{genre.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Beat Style Submenu */}
                      {item.id === 'ai-beat-generation' && showBeatStyleSubmenu && (
                        <div className="bg-black/60 border-t border-white/10 py-2">
                          {beatStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleBeatStyleSelect(style.id)}
                              className="w-full flex items-center gap-3 px-8 py-2 hover:bg-purple-500/20 transition-all"
                            >
                              <span className="text-lg">{style.emoji}</span>
                              <span className="text-sm text-gray-300">{style.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Instrument Submenu */}
                      {item.id === 'ai-instrument-gen' && showInstrumentSubmenu && (
                        <div className="bg-black/60 border-t border-white/10 py-2">
                          {instrumentTypes.map((instrument) => (
                            <button
                              key={instrument.id}
                              onClick={() => handleInstrumentSelect(instrument.id)}
                              className="w-full flex items-center gap-3 px-8 py-2 hover:bg-purple-500/20 transition-all"
                            >
                              <span className="text-lg">{instrument.emoji}</span>
                              <span className="text-sm text-gray-300">{instrument.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Composition Submenu */}
                      {item.id === 'ai-full-composition' && showCompositionSubmenu && (
                        <div className="bg-black/60 border-t border-white/10 py-2">
                          {compositionStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleCompositionSelect(style.id)}
                              className="w-full flex items-center gap-3 px-8 py-2 hover:bg-purple-500/20 transition-all"
                            >
                              <span className="text-lg">{style.emoji}</span>
                              <span className="text-sm text-gray-300">{style.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
