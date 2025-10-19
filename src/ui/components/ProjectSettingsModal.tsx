import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sparkles,
  Mic,
  Scissors,
  DollarSign,
  Zap,
  Brain,
  Music,
  Volume2
} from 'lucide-react';
import type { Project } from '../../api/types';
import { toast } from 'sonner';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  currentProject: Project | null;
  onClose: () => void;
  onSave: (settings: { bpm?: number; key?: string; timeSignature?: string }) => void;
  userId?: string;
  isRecording?: boolean;
}

const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'C Minor', 'C# Minor', 'D Minor', 'D# Minor', 'E Minor', 'F Minor', 'F# Minor', 'G Minor', 'G# Minor', 'A Minor', 'A# Minor', 'B Minor'
];

const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4'];

type TabType = 'basic' | 'advanced';

interface FeatureStatus {
  enabled: boolean;
  description: string;
  icon: typeof Mic;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  currentProject,
  onClose,
  onSave,
  userId,
  isRecording = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [bpm, setBpm] = useState(currentProject?.bpm || 120);
  const [key, setKey] = useState(currentProject?.key || 'C');
  const [timeSignature, setTimeSignature] = useState(currentProject?.timeSignature || '4/4');

  // Advanced features state
  const [features, setFeatures] = useState<Record<string, FeatureStatus>>({
    liveVocalAnalysis: {
      enabled: true,
      description: 'Real-time pitch detection and vocal coaching during recording',
      icon: Mic
    },
    stemSeparation: {
      enabled: true,
      description: 'Separate vocals, drums, bass, and other instruments from mixed audio',
      icon: Scissors
    },
    budgetAlerts: {
      enabled: true,
      description: 'Track API costs and get notified when approaching budget limits',
      icon: DollarSign
    },
    freestyleMode: {
      enabled: true,
      description: 'Voice-controlled recording and DAW commands for hands-free workflow',
      icon: Zap
    },
    aiMemory: {
      enabled: true,
      description: 'AI learns your preferences and style over time',
      icon: Brain
    },
    melodyToVocals: {
      enabled: true,
      description: 'Convert hummed melodies into full vocal tracks with AI-generated lyrics',
      icon: Music
    },
    aiMastering: {
      enabled: true,
      description: 'Automatic professional mastering with LUFS analysis',
      icon: Sparkles
    },
    voiceCommands: {
      enabled: false,
      description: 'Control DAW with voice commands (experimental)',
      icon: Volume2
    }
  });

  useEffect(() => {
    if (currentProject) {
      setBpm(currentProject.bpm || 120);
      setKey(currentProject.key || 'C');
      setTimeSignature(currentProject.timeSignature || '4/4');
    }
  }, [currentProject]);

  useEffect(() => {
    // Load saved feature preferences from localStorage
    const savedFeatures = localStorage.getItem('advancedFeatures');
    if (savedFeatures) {
      try {
        const parsed = JSON.parse(savedFeatures);
        setFeatures(prev => {
          const updated = { ...prev };
          Object.keys(parsed).forEach(key => {
            if (updated[key]) {
              updated[key].enabled = parsed[key];
            }
          });
          return updated;
        });
      } catch (e) {
        console.error('Failed to load feature preferences:', e);
      }
    }
  }, []);

  if (!isOpen || !currentProject) return null;

  const handleSave = () => {
    onSave({ bpm, key, timeSignature });

    // Save feature preferences to localStorage
    const featurePrefs: Record<string, boolean> = {};
    Object.keys(features).forEach(key => {
      featurePrefs[key] = features[key].enabled;
    });
    localStorage.setItem('advancedFeatures', JSON.stringify(featurePrefs));

    toast.success('Settings saved successfully');
    onClose();
  };

  const toggleFeature = (featureKey: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        enabled: !prev[featureKey].enabled
      }
    }));
  };

  const getFeatureName = (key: string): string => {
    const names: Record<string, string> = {
      liveVocalAnalysis: 'Live Vocal Analysis',
      stemSeparation: 'Stem Separation',
      budgetAlerts: 'Budget Alerts',
      freestyleMode: 'Freestyle Session Mode',
      aiMemory: 'AI Memory',
      melodyToVocals: 'Melody to Vocals',
      aiMastering: 'AI Mastering',
      voiceCommands: 'Voice Commands'
    };
    return names[key] || key;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Project Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-white border-b-2 border-purple-500 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4 inline-block mr-2" />
            Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'text-white border-b-2 border-purple-500 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block mr-2" />
            Advanced Features
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* BPM */}
              <div>
                <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
                  BPM (Tempo)
                </label>
                <input
                  id="bpm"
                  name="bpm"
                  type="number"
                  min="40"
                  max="300"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Musical Key */}
              <div>
                <label htmlFor="key" className="block text-sm font-medium text-gray-300 mb-2">
                  Musical Key
                </label>
                <select
                  id="key"
                  name="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {MUSICAL_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Signature */}
              <div>
                <label htmlFor="timeSignature" className="block text-sm font-medium text-gray-300 mb-2">
                  Time Signature
                </label>
                <select
                  id="timeSignature"
                  name="timeSignature"
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {TIME_SIGNATURES.map((ts) => (
                    <option key={ts} value={ts}>
                      {ts}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Enable or disable advanced AI features for your projects. These settings are saved globally across all projects.
              </p>
              {Object.keys(features).map(featureKey => {
                const feature = features[featureKey];
                const Icon = feature.icon;
                return (
                  <div
                    key={featureKey}
                    className="bg-black/20 border border-white/10 rounded-lg p-4 hover:bg-black/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-1 ${feature.enabled ? 'text-purple-400' : 'text-gray-500'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-white mb-1">
                            {getFeatureName(featureKey)}
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeature(featureKey)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          feature.enabled ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            feature.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
