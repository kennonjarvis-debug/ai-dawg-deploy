import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Music2, TrendingUp, Sliders, Wand2, ChevronDown, Scissors, AlignCenter, Music, Volume2, Zap } from 'lucide-react';

export interface AIDawgMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  requiresSelection?: boolean;
  category: 'vocal' | 'production' | 'mastering' | 'auto';
}

interface AIDawgMenuProps {
  selectedClipCount: number;
  onAutoComp: () => void;
  onAutoTimeAlign: () => void;
  onAutoPitch: () => void;
  onAutoMix: () => void;
  onAutoMaster: () => void;
  onAutoMusic: () => void;
  onAIDawg: () => void;
  onAnalyzeVocals: () => void;
  onGenerateHarmony: () => void;
  onApplyGenrePreset: (genre: string) => void;
  onGenerateChords: () => void;
  onGenerateMelody: () => void;
}

export const AIDawgMenu: React.FC<AIDawgMenuProps> = ({
  selectedClipCount,
  onAutoComp,
  onAutoTimeAlign,
  onAutoPitch,
  onAutoMix,
  onAutoMaster,
  onAutoMusic,
  onAIDawg,
  onAnalyzeVocals,
  onGenerateHarmony,
  onApplyGenrePreset,
  onGenerateChords,
  onGenerateMelody,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGenreSubmenu, setShowGenreSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const genres = [
    { id: 'morgan-wallen', label: 'Morgan Wallen Style', emoji: '🎸' },
    { id: 'drake', label: 'Drake Style', emoji: '🎤' },
    { id: 'pop', label: 'Modern Pop', emoji: '✨' },
    { id: 'rock', label: 'Rock', emoji: '🤘' },
    { id: 'electronic', label: 'Electronic', emoji: '🎹' },
  ];

  const menuItems: AIDawgMenuItem[] = [
    // AI DAWG Auto Features
    {
      id: 'ai-dawg-full',
      label: '🚀 AI DAWG (Full Auto)',
      icon: <Zap className="w-5 h-5" />,
      action: onAIDawg,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-comp',
      label: 'Auto Comp',
      icon: <Scissors className="w-5 h-5" />,
      action: onAutoComp,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-time-align',
      label: 'Auto Time Align',
      icon: <AlignCenter className="w-5 h-5" />,
      action: onAutoTimeAlign,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-pitch',
      label: 'Auto Pitch Correct',
      icon: <Music className="w-5 h-5" />,
      action: onAutoPitch,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-mix',
      label: 'Auto Mix',
      icon: <Sliders className="w-5 h-5" />,
      action: onAutoMix,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-master',
      label: 'Auto Master',
      icon: <Volume2 className="w-5 h-5" />,
      action: onAutoMaster,
      requiresSelection: true,
      category: 'auto',
    },
    {
      id: 'auto-music',
      label: 'Auto Music Generation',
      icon: <Sparkles className="w-5 h-5" />,
      action: onAutoMusic,
      category: 'auto',
    },
    // Vocal Tools
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
    // Production Tools
    {
      id: 'generate-chords',
      label: 'Generate Chords',
      icon: <Music2 className="w-5 h-5" />,
      action: onGenerateChords,
      category: 'production',
    },
    {
      id: 'generate-melody',
      label: 'Generate Melody',
      icon: <Sparkles className="w-5 h-5" />,
      action: onGenerateMelody,
      category: 'production',
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowGenreSubmenu(false);
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

    if (item.id !== 'apply-genre-preset') {
      item.action();
      setIsOpen(false);
      setShowGenreSubmenu(false);
    }
  };

  const handleGenreSelect = (genreId: string) => {
    onApplyGenrePreset(genreId);
    setIsOpen(false);
    setShowGenreSubmenu(false);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'auto':
        return '⚡ AI DAWG Auto Features';
      case 'vocal':
        return 'Vocal Tools';
      case 'production':
        return 'Production';
      case 'mastering':
        return 'Mastering';
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
        AI Dawg
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
                      </button>

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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              ✨ Powered by AI • {selectedClipCount > 0 ? 'Ready to process' : 'Select clips to begin'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
