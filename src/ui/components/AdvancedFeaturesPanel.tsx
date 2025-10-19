/**
 * Advanced Features Panel
 *
 * Unified panel for all advanced AI features:
 * 1. Live Vocal Analysis
 * 2. Stem Separation
 * 3. Budget Alerts
 * 4. Freestyle Session
 * 5. AI Memory
 * 6. Melody-to-Vocals
 * 7. AI Mastering
 * 8. Voice Commands
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  Scissors,
  DollarSign,
  Zap,
  Brain,
  Music,
  Sparkles,
  Volume2,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { LivePitchDisplay } from './LivePitchDisplay';
import { apiClient } from '../../api/client';

interface AdvancedFeaturesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  currentProject?: any;
  isRecording?: boolean;
  websocketUrl?: string;
}

interface FeatureStatus {
  enabled: boolean;
  active: boolean;
  lastUsed?: Date;
}

interface BudgetStatus {
  current: number;
  limit: number;
  percentage: number;
  alerts: string[];
}

export const AdvancedFeaturesPanel: React.FC<AdvancedFeaturesPanelProps> = ({
  isOpen,
  onClose,
  projectId,
  userId,
  currentProject,
  isRecording = false,
  websocketUrl = 'http://localhost:3001'
}) => {
  // Feature statuses
  const [features, setFeatures] = useState<Record<string, FeatureStatus>>({
    liveVocalAnalysis: { enabled: true, active: false },
    stemSeparation: { enabled: true, active: false },
    budgetAlerts: { enabled: true, active: true },
    freestyleMode: { enabled: true, active: false },
    aiMemory: { enabled: true, active: true },
    melodyToVocals: { enabled: true, active: false },
    aiMastering: { enabled: true, active: false },
    voiceCommands: { enabled: false, active: false }
  });

  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['liveVocalAnalysis']));
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>({
    current: 0,
    limit: 100,
    percentage: 0,
    alerts: []
  });

  // Live Vocal Analysis state
  const [showPitchDisplay, setShowPitchDisplay] = useState(false);
  const [vocalAnalysisData, setVocalAnalysisData] = useState<any>(null);

  // Stem Separation state
  const [stemSeparationProgress, setStemSeparationProgress] = useState<number>(0);
  const [separatedStems, setSeparatedStems] = useState<any>(null);

  // AI Memory state
  const [userPreferences, setUserPreferences] = useState<any[]>([]);
  const [memoryStats, setMemoryStats] = useState({ total: 0, thisSession: 0 });

  // Voice Commands state
  const [listeningForCommand, setListeningForCommand] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Feature toggle handlers
  const toggleFeature = (featureName: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: {
        ...prev[featureName],
        enabled: !prev[featureName].enabled
      }
    }));

    // Save preference to AI Memory
    if (features.aiMemory.enabled) {
      savePreferenceToMemory(featureName, !features[featureName].enabled);
    }
  };

  // Auto-enable live vocal analysis when recording starts
  useEffect(() => {
    if (isRecording && features.liveVocalAnalysis.enabled) {
      setShowPitchDisplay(true);
      setFeatures(prev => ({
        ...prev,
        liveVocalAnalysis: { ...prev.liveVocalAnalysis, active: true }
      }));
      toast.success('🎤 Live Vocal Analysis Active');
    } else if (!isRecording) {
      setShowPitchDisplay(false);
      setFeatures(prev => ({
        ...prev,
        liveVocalAnalysis: { ...prev.liveVocalAnalysis, active: false }
      }));
    }
  }, [isRecording, features.liveVocalAnalysis.enabled]);

  // Load user preferences from AI Memory
  useEffect(() => {
    if (features.aiMemory.enabled) {
      loadUserPreferences();
    }
  }, [features.aiMemory.enabled]);

  // Budget monitoring
  useEffect(() => {
    if (features.budgetAlerts.enabled) {
      monitorBudget();
      const interval = setInterval(monitorBudget, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [features.budgetAlerts.enabled]);

  // Save preference to AI Memory
  const savePreferenceToMemory = async (preference: string, value: any) => {
    try {
      await apiClient.request('POST', '/ai/memory', {
        userId,
        type: 'preference',
        category: 'features',
        content: `${preference}: ${value}`,
        importance: 7
      });
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  };

  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const response = await apiClient.request('GET', `/ai/memory/${userId}?category=features&limit=20`);
      setUserPreferences(response.memories || []);
      setMemoryStats({
        total: response.total || 0,
        thisSession: response.sessionCount || 0
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  // Monitor budget
  const monitorBudget = async () => {
    try {
      const response = await apiClient.request('GET', `/billing/usage/${userId}/current`);
      const { current, limit } = response;
      const percentage = (current / limit) * 100;

      setBudgetStatus({
        current,
        limit,
        percentage,
        alerts: []
      });

      // Show alerts
      if (percentage >= 90 && percentage < 100) {
        toast.warning(`⚠️ Budget Alert: ${percentage.toFixed(0)}% used (${current.toFixed(2)}/${limit})`, {
          duration: 5000
        });
      } else if (percentage >= 100) {
        toast.error(`🚨 Budget Limit Reached: $${current.toFixed(2)}/$${limit}`, {
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Failed to check budget:', error);
    }
  };

  // Stem Separation
  const handleStemSeparation = async (audioFile: File) => {
    if (!features.stemSeparation.enabled) return;

    try {
      setStemSeparationProgress(0);
      setFeatures(prev => ({
        ...prev,
        stemSeparation: { ...prev.stemSeparation, active: true }
      }));

      toast.info('🎵 Separating stems... This may take a minute');

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('projectId', projectId);

      const response = await apiClient.request('POST', '/audio/separate-stems', formData);

      setSeparatedStems(response.stems);
      setStemSeparationProgress(100);

      toast.success('✅ Stems separated! Check the track list');

      // Save preference
      if (features.aiMemory.enabled) {
        savePreferenceToMemory('lastStemSeparation', new Date().toISOString());
      }
    } catch (error: any) {
      toast.error(`Stem separation failed: ${error.message}`);
    } finally {
      setFeatures(prev => ({
        ...prev,
        stemSeparation: { ...prev.stemSeparation, active: false }
      }));
    }
  };

  // Melody to Vocals
  const handleMelodyToVocals = async (melodyFile: File, prompt: string, genre: string = 'pop') => {
    if (!features.melodyToVocals.enabled) return;

    try {
      setFeatures(prev => ({
        ...prev,
        melodyToVocals: { ...prev.melodyToVocals, active: true }
      }));

      toast.info('🎤 Converting melody to vocals...');

      const formData = new FormData();
      formData.append('audio', melodyFile);
      formData.append('prompt', prompt);
      formData.append('genre', genre);
      formData.append('projectId', projectId);

      const response = await apiClient.request('POST', '/ai/melody-to-vocals', formData);

      toast.success('✅ Vocals generated! Added to project');

      // Save to memory
      if (features.aiMemory.enabled) {
        savePreferenceToMemory('favoriteGenre', genre);
      }

      return response;
    } catch (error: any) {
      toast.error(`Melody-to-vocals failed: ${error.message}`);
    } finally {
      setFeatures(prev => ({
        ...prev,
        melodyToVocals: { ...prev.melodyToVocals, active: false }
      }));
    }
  };

  // AI Mastering
  const handleAIMastering = async (loudnessTarget: number = -14) => {
    if (!features.aiMastering.enabled) return;

    try {
      setFeatures(prev => ({
        ...prev,
        aiMastering: { ...prev.aiMastering, active: true }
      }));

      toast.info('✨ Applying AI mastering...');

      const response = await apiClient.request('POST', '/ai/master', {
        projectId,
        targetLoudness: loudnessTarget,
        genre: currentProject?.genre
      });

      toast.success(`✅ Mastered to ${loudnessTarget} LUFS!`);

      return response;
    } catch (error: any) {
      toast.error(`AI mastering failed: ${error.message}`);
    } finally {
      setFeatures(prev => ({
        ...prev,
        aiMastering: { ...prev.aiMastering, active: false }
      }));
    }
  };

  // Voice Commands
  const toggleVoiceCommands = () => {
    const newState = !features.voiceCommands.enabled;
    toggleFeature('voiceCommands');

    if (newState) {
      toast.success('🎙️ Voice commands enabled! Say "Hey DAWG" to activate');
    } else {
      toast.info('Voice commands disabled');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Advanced Features</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Features List */}
      <div className="p-4 space-y-3">

        {/* 1. Live Vocal Analysis */}
        <FeatureCard
          title="Live Vocal Analysis"
          icon={<Mic className="w-5 h-5" />}
          enabled={features.liveVocalAnalysis.enabled}
          active={features.liveVocalAnalysis.active}
          onToggle={() => toggleFeature('liveVocalAnalysis')}
          isExpanded={expandedSections.has('liveVocalAnalysis')}
          onToggleExpand={() => toggleSection('liveVocalAnalysis')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Real-time pitch tracking, sharp/flat detection, and vocal coaching during recording
            </p>
            {isRecording && features.liveVocalAnalysis.enabled && showPitchDisplay && (
              <div className="mt-2">
                <LivePitchDisplay
                  isVisible={true}
                  trackId="current"
                  projectId={projectId}
                  userId={userId}
                  websocketUrl={websocketUrl}
                  expectedKey={currentProject?.key || 'C'}
                  showHistory={true}
                />
              </div>
            )}
            {!isRecording && (
              <div className="bg-gray-800 p-3 rounded text-sm text-gray-400">
                Start recording to see live pitch analysis
              </div>
            )}
          </div>
        </FeatureCard>

        {/* 2. Stem Separation */}
        <FeatureCard
          title="Stem Separation"
          icon={<Scissors className="w-5 h-5" />}
          enabled={features.stemSeparation.enabled}
          active={features.stemSeparation.active}
          onToggle={() => toggleFeature('stemSeparation')}
          isExpanded={expandedSections.has('stemSeparation')}
          onToggleExpand={() => toggleSection('stemSeparation')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Separate any song into vocals, drums, bass, and other instruments
            </p>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              id="stem-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleStemSeparation(file);
              }}
            />
            <button
              onClick={() => document.getElementById('stem-upload')?.click()}
              disabled={!features.stemSeparation.enabled || features.stemSeparation.active}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
            >
              {features.stemSeparation.active ? 'Separating...' : 'Upload & Separate'}
            </button>
            {stemSeparationProgress > 0 && stemSeparationProgress < 100 && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${stemSeparationProgress}%` }}
                />
              </div>
            )}
          </div>
        </FeatureCard>

        {/* 3. Budget Alerts */}
        <FeatureCard
          title="Budget Alerts"
          icon={<DollarSign className="w-5 h-5" />}
          enabled={features.budgetAlerts.enabled}
          active={features.budgetAlerts.active}
          onToggle={() => toggleFeature('budgetAlerts')}
          isExpanded={expandedSections.has('budgetAlerts')}
          onToggleExpand={() => toggleSection('budgetAlerts')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Track API costs and get alerts when approaching budget limits
            </p>
            <div className="bg-gray-800 p-3 rounded space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Current Usage:</span>
                <span className="text-white font-semibold">${budgetStatus.current.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Budget Limit:</span>
                <span className="text-white font-semibold">${budgetStatus.limit.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    budgetStatus.percentage >= 90 ? 'bg-red-600' :
                    budgetStatus.percentage >= 75 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-center">
                {budgetStatus.percentage.toFixed(1)}% used
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 4. Freestyle Session */}
        <FeatureCard
          title="Freestyle Session"
          icon={<Zap className="w-5 h-5" />}
          enabled={features.freestyleMode.enabled}
          active={features.freestyleMode.active}
          onToggle={() => toggleFeature('freestyleMode')}
          isExpanded={expandedSections.has('freestyleMode')}
          onToggleExpand={() => toggleSection('freestyleMode')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Record freestyles with beat playback, live transcription, and voice commands
            </p>
            <button
              onClick={() => {
                setFeatures(prev => ({
                  ...prev,
                  freestyleMode: { ...prev.freestyleMode, active: !prev.freestyleMode.active }
                }));
                toast.info('Freestyle mode ' + (features.freestyleMode.active ? 'disabled' : 'enabled'));
              }}
              disabled={!features.freestyleMode.enabled}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
            >
              {features.freestyleMode.active ? 'Stop Freestyle' : 'Start Freestyle Session'}
            </button>
          </div>
        </FeatureCard>

        {/* 5. AI Memory */}
        <FeatureCard
          title="AI Memory"
          icon={<Brain className="w-5 h-5" />}
          enabled={features.aiMemory.enabled}
          active={features.aiMemory.active}
          onToggle={() => toggleFeature('aiMemory')}
          isExpanded={expandedSections.has('aiMemory')}
          onToggleExpand={() => toggleSection('aiMemory')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              AI remembers your preferences and learns from your workflow
            </p>
            <div className="bg-gray-800 p-3 rounded space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Memories:</span>
                <span className="text-white">{memoryStats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">This Session:</span>
                <span className="text-white">{memoryStats.thisSession}</span>
              </div>
            </div>
            {userPreferences.slice(0, 3).map((pref, idx) => (
              <div key={idx} className="bg-gray-800 p-2 rounded text-xs text-gray-400">
                {pref.content}
              </div>
            ))}
          </div>
        </FeatureCard>

        {/* 6. Melody-to-Vocals */}
        <FeatureCard
          title="Melody-to-Vocals"
          icon={<Music className="w-5 h-5" />}
          enabled={features.melodyToVocals.enabled}
          active={features.melodyToVocals.active}
          onToggle={() => toggleFeature('melodyToVocals')}
          isExpanded={expandedSections.has('melodyToVocals')}
          onToggleExpand={() => toggleSection('melodyToVocals')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Hum a melody and AI will turn it into full vocals with lyrics
            </p>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              id="melody-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const prompt = window.prompt('What should the song be about?');
                  if (prompt) handleMelodyToVocals(file, prompt);
                }
              }}
            />
            <button
              onClick={() => document.getElementById('melody-upload')?.click()}
              disabled={!features.melodyToVocals.enabled || features.melodyToVocals.active}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded transition-colors"
            >
              {features.melodyToVocals.active ? 'Generating...' : 'Upload Melody'}
            </button>
          </div>
        </FeatureCard>

        {/* 7. AI Mastering */}
        <FeatureCard
          title="AI Mastering"
          icon={<Sparkles className="w-5 h-5" />}
          enabled={features.aiMastering.enabled}
          active={features.aiMastering.active}
          onToggle={() => toggleFeature('aiMastering')}
          isExpanded={expandedSections.has('aiMastering')}
          onToggleExpand={() => toggleSection('aiMastering')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Professional mastering to industry loudness standards
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleAIMastering(-14)}
                disabled={!features.aiMastering.enabled || features.aiMastering.active}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Streaming (-14 LUFS)
              </button>
              <button
                onClick={() => handleAIMastering(-9)}
                disabled={!features.aiMastering.enabled || features.aiMastering.active}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Club/EDM (-9 LUFS)
              </button>
              <button
                onClick={() => handleAIMastering(-6)}
                disabled={!features.aiMastering.enabled || features.aiMastering.active}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Aggressive (-6 LUFS)
              </button>
            </div>
          </div>
        </FeatureCard>

        {/* 8. Voice Commands */}
        <FeatureCard
          title="Voice Commands"
          icon={<Volume2 className="w-5 h-5" />}
          enabled={features.voiceCommands.enabled}
          active={features.voiceCommands.active}
          onToggle={toggleVoiceCommands}
          isExpanded={expandedSections.has('voiceCommands')}
          onToggleExpand={() => toggleSection('voiceCommands')}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Control the DAW hands-free with voice commands
            </p>
            <div className="bg-gray-800 p-3 rounded space-y-2 text-xs">
              <div className="text-gray-400">Available commands:</div>
              <div className="text-white">"Start recording"</div>
              <div className="text-white">"Stop recording"</div>
              <div className="text-white">"Play" / "Pause"</div>
              <div className="text-white">"Generate beat"</div>
              <div className="text-white">"Save project"</div>
            </div>
            {lastCommand && (
              <div className="bg-blue-900 p-2 rounded text-xs text-blue-300">
                Last command: {lastCommand}
              </div>
            )}
          </div>
        </FeatureCard>

      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
        <div className="text-xs text-gray-500 text-center">
          {Object.values(features).filter(f => f.enabled).length} of 8 features enabled
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  active: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  icon,
  enabled,
  active,
  onToggle,
  isExpanded,
  onToggleExpand,
  children
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg border ${active ? 'border-purple-500' : 'border-gray-700'} transition-all`}>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${enabled ? 'text-purple-400' : 'text-gray-600'}`}>
            {icon}
          </div>
          <span className={`font-semibold ${enabled ? 'text-white' : 'text-gray-500'}`}>
            {title}
          </span>
          {active && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`w-10 h-6 rounded-full transition-colors ${
              enabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};
