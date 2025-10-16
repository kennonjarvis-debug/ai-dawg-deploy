/**
 * AI Feature Hub
 *
 * Centralized interface for accessing all AI-powered features.
 * Provides unified access to:
 * - Vocal Coach
 * - Producer AI
 * - Music Generator
 * - Automation tools (Auto-Comp, Auto-Pitch, etc.)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Music2,
  Wand2,
  Scissors,
  Music,
  AlignCenter,
  Sliders,
  Volume2,
  X,
  Lock,
  Zap,
} from 'lucide-react';
import { VocalCoachPanel } from '../panels/VocalCoachPanel';
import { ProducerPanel } from '../panels/ProducerPanel';
import { MusicGeneratorPanel } from './MusicGeneratorPanel';
import { useFeature, FEATURE_REGISTRY } from '../../shared/features';
import type { UserEntitlements } from '../../shared/features';

interface AIFeatureHubProps {
  projectId: string;
  entitlements?: UserEntitlements;
  isOpen: boolean;
  onClose: () => void;
}

type FeatureTab = 'vocal-coach' | 'producer-ai' | 'music-generator' | 'automation';

interface AutomationTool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
  description: string;
  entitlementKey: string;
}

const AUTOMATION_TOOLS: AutomationTool[] = [
  {
    id: 'auto-comp',
    name: 'Auto-Comp',
    icon: Scissors,
    endpoint: '/api/v1/ai/autocomp',
    description: 'Best vocal takes, automatically',
    entitlementKey: 'Auto-Comp',
  },
  {
    id: 'auto-pitch',
    name: 'Auto-Pitch',
    icon: Music,
    endpoint: '/api/v1/ai/pitchcorrect',
    description: 'Natural pitch correction',
    entitlementKey: 'Auto-Pitch',
  },
  {
    id: 'auto-align',
    name: 'Auto-Align',
    icon: AlignCenter,
    endpoint: '/api/v1/ai/timealign',
    description: 'Perfect timing, natural feel',
    entitlementKey: 'Auto-Align',
  },
  {
    id: 'auto-mix',
    name: 'Auto-Mix',
    icon: Sliders,
    endpoint: '/api/v1/ai/mix',
    description: 'Studio-quality mixing',
    entitlementKey: 'Auto-Mix',
  },
  {
    id: 'auto-master',
    name: 'Auto-Master',
    icon: Volume2,
    endpoint: '/api/v1/ai/mastering/process',
    description: 'Radio-ready mastering',
    entitlementKey: 'Auto-Master',
  },
];

export const AIFeatureHub: React.FC<AIFeatureHubProps> = ({
  projectId,
  entitlements,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('automation');

  // Feature access checks
  const vocalCoachAccess = useFeature('vocal-coach', entitlements);
  const producerAccess = useFeature('producer-ai', entitlements);
  const musicGenAccess = useFeature('music-generator', entitlements);

  if (!isOpen) return null;

  /**
   * Render feature tab button with access indicator
   */
  const FeatureTab = ({
    id,
    icon: Icon,
    label,
    hasAccess,
    count,
  }: {
    id: FeatureTab;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    hasAccess: boolean;
    count?: number;
  }) => {
    const isActive = activeTab === id;

    return (
      <button
        onClick={() => hasAccess && setActiveTab(id)}
        disabled={!hasAccess}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all
          ${isActive
            ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300'
            : 'bg-black/20 border border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-300'
          }
          ${!hasAccess && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
        {!hasAccess && <Lock className="w-4 h-4 ml-auto" />}
        {count !== undefined && count > 0 && (
          <span className="ml-auto px-2 py-0.5 bg-blue-500/30 rounded-full text-xs font-semibold">
            {count}
          </span>
        )}
      </button>
    );
  };

  /**
   * Render automation tool quick action
   */
  const AutomationToolCard = ({ tool }: { tool: AutomationTool }) => {
    const access = useFeature(tool.id, entitlements);
    const Icon = tool.icon;

    const handleClick = async () => {
      if (!access.hasAccess) {
        // Show upgrade modal or toast
        return;
      }

      // TODO: Implement automation tool execution
      console.log(`Executing ${tool.name}`);
    };

    return (
      <button
        onClick={handleClick}
        disabled={!access.hasAccess}
        className={`
          p-4 rounded-xl border transition-all text-left
          ${access.hasAccess
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/50'
            : 'bg-black/20 border-white/10 opacity-50 cursor-not-allowed'
          }
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          {!access.hasAccess && (
            <Lock className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">{tool.name}</h4>
        <p className="text-xs text-gray-400">{tool.description}</p>

        {access.hasAccess && access.limit && (
          <div className="mt-3 text-xs text-gray-500">
            {access.usage || 0}/{access.limit} today
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[90vh] bg-daw-surface border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Feature Hub</h2>
                <p className="text-sm text-gray-400">
                  Access all AI-powered production tools
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Feature Tabs */}
          <div className="w-64 flex-shrink-0 border-r border-white/10 p-4 space-y-2 overflow-y-auto">
            <FeatureTab
              id="automation"
              icon={Zap}
              label="Quick Actions"
              hasAccess={true}
              count={AUTOMATION_TOOLS.filter(t => useFeature(t.id, entitlements).hasAccess).length}
            />
            <FeatureTab
              id="vocal-coach"
              icon={Mic}
              label="Vocal Coach"
              hasAccess={vocalCoachAccess.hasAccess}
            />
            <FeatureTab
              id="producer-ai"
              icon={Music2}
              label="Producer AI"
              hasAccess={producerAccess.hasAccess}
            />
            <FeatureTab
              id="music-generator"
              icon={Wand2}
              label="Music Generator"
              hasAccess={musicGenAccess.hasAccess}
            />

            {/* Plan Info */}
            {entitlements && (
              <div className="mt-6 p-3 bg-black/40 border border-white/10 rounded-lg">
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                  Your Plan
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {entitlements.plan}
                  </span>
                  {entitlements.plan !== 'STUDIO' && (
                    <a
                      href="/pricing"
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Upgrade
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'automation' && (
              <div className="h-full p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-2">
                    AI Automation Tools
                  </h3>
                  <p className="text-sm text-gray-400">
                    One-click AI processing for common production tasks
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {AUTOMATION_TOOLS.map(tool => (
                    <AutomationToolCard key={tool.id} tool={tool} />
                  ))}
                </div>

                {/* Upgrade Prompt for Locked Features */}
                {!entitlements || entitlements.plan === 'FREE' ? (
                  <div className="mt-6 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      Unlock All Automation Tools
                    </h4>
                    <p className="text-sm text-gray-300 mb-4">
                      Upgrade to STUDIO plan for unlimited access to all AI automation features
                    </p>
                    <a
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      View Plans
                    </a>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'vocal-coach' && vocalCoachAccess.hasAccess && (
              <VocalCoachPanel projectId={projectId} />
            )}

            {activeTab === 'producer-ai' && producerAccess.hasAccess && (
              <ProducerPanel projectId={projectId} />
            )}

            {activeTab === 'music-generator' && musicGenAccess.hasAccess && (
              <MusicGeneratorPanel projectId={projectId} />
            )}

            {/* No Access Message */}
            {((activeTab === 'vocal-coach' && !vocalCoachAccess.hasAccess) ||
              (activeTab === 'producer-ai' && !producerAccess.hasAccess) ||
              (activeTab === 'music-generator' && !musicGenAccess.hasAccess)) && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-full inline-block mb-4">
                    <Lock className="w-12 h-12 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Upgrade Required
                  </h3>
                  <p className="text-gray-400 mb-6">
                    This feature requires a PRO or STUDIO plan. Upgrade now to unlock powerful AI tools.
                  </p>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    View Plans
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
