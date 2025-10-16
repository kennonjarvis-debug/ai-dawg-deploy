/**
 * Feature Registry
 *
 * Centralized registry of all AI DAWG features.
 * Single source of truth for feature definitions, entitlements, and UI rendering.
 */

import { FeatureDefinition } from './types';

/**
 * Complete feature registry
 *
 * This registry drives:
 * - Feature gate middleware (backend)
 * - Entitlement checks (backend/frontend)
 * - UI feature cards and panels
 * - Pricing page feature lists
 * - Documentation generation
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  // ============================================================================
  // AI AUTOMATION FEATURES
  // ============================================================================

  'auto-comp': {
    id: 'auto-comp',
    name: 'Auto-Comp',
    description: 'Automatically comp the best vocal takes with AI-powered analysis',
    category: 'ai-automation',
    tier: 'STUDIO',
    status: 'available',
    endpoint: '/api/v1/ai/autocomp',
    icon: 'Scissors',
    dailyLimit: 25,
    isPremium: true,
    entitlementKey: 'Auto-Comp',
    docsUrl: '/docs/features/auto-comp',
  },

  'auto-pitch': {
    id: 'auto-pitch',
    name: 'Auto-Pitch',
    description: 'Natural pitch correction that preserves vocal emotion',
    category: 'ai-automation',
    tier: 'STUDIO',
    status: 'available',
    endpoint: '/api/v1/ai/pitchcorrect',
    icon: 'Music',
    dailyLimit: 25,
    isPremium: true,
    entitlementKey: 'Auto-Pitch',
    docsUrl: '/docs/features/auto-pitch',
  },

  'auto-align': {
    id: 'auto-align',
    name: 'Auto-Align',
    description: 'Perfect timing with natural groove preservation',
    category: 'ai-automation',
    tier: 'FREE', // Limited on FREE
    status: 'available',
    endpoint: '/api/v1/ai/timealign',
    icon: 'AlignCenter',
    dailyLimit: 5, // 5 for FREE, 25 for PRO+
    isPremium: false,
    entitlementKey: 'Auto-Align',
    docsUrl: '/docs/features/auto-align',
  },

  'auto-mix': {
    id: 'auto-mix',
    name: 'Auto-Mix',
    description: 'Studio-quality mixing with genre-aware AI processing',
    category: 'ai-automation',
    tier: 'STUDIO',
    status: 'available',
    endpoint: '/api/v1/ai/mix',
    icon: 'Sliders',
    dailyLimit: 25,
    isPremium: true,
    entitlementKey: 'Auto-Mix',
    docsUrl: '/docs/features/auto-mix',
  },

  'auto-master': {
    id: 'auto-master',
    name: 'Auto-Master',
    description: 'Radio-ready mastering for all streaming platforms',
    category: 'ai-automation',
    tier: 'STUDIO',
    status: 'available',
    endpoint: '/api/v1/ai/mastering/process',
    icon: 'Volume2',
    dailyLimit: 25,
    isPremium: true,
    entitlementKey: 'Auto-Master',
    docsUrl: '/docs/features/auto-master',
  },

  'music-generator': {
    id: 'music-generator',
    name: 'Music Generator',
    description: 'Generate full music tracks from text prompts',
    category: 'ai-automation',
    tier: 'STUDIO',
    status: 'available',
    endpoint: '/api/v1/ai/dawg',
    component: 'src/ui/components/MusicGeneratorPanel.tsx',
    icon: 'Wand2',
    dailyLimit: 25,
    isPremium: true,
    entitlementKey: 'Auto-Music',
    docsUrl: '/docs/features/music-generator',
  },

  // ============================================================================
  // AI TOOLS - VOCAL COACH
  // ============================================================================

  'vocal-coach-pitch': {
    id: 'vocal-coach-pitch',
    name: 'Pitch Analysis',
    description: 'Real-time pitch tracking and visualization',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta', // UI not implemented yet
    endpoint: '/api/v1/ai/vocal-coach/analyze-pitch',
    component: 'src/ui/panels/VocalCoachPanel.tsx',
    icon: 'TrendingUp',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach#pitch-analysis',
    dependencies: ['vocal-coach'],
  },

  'vocal-coach-feedback': {
    id: 'vocal-coach-feedback',
    name: 'Performance Feedback',
    description: 'AI-powered vocal performance analysis and suggestions',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/ai/vocal-coach/performance-feedback',
    component: 'src/ui/panels/VocalCoachPanel.tsx',
    icon: 'MessageSquare',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach#feedback',
    dependencies: ['vocal-coach'],
  },

  'vocal-coach-harmony': {
    id: 'vocal-coach-harmony',
    name: 'Harmony Generation',
    description: 'Auto-generate harmonies for your vocals',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/ai/vocal-coach/generate-harmony',
    icon: 'Users',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach#harmony',
    dependencies: ['vocal-coach'],
  },

  'vocal-coach-health': {
    id: 'vocal-coach-health',
    name: 'Vocal Health Monitor',
    description: 'Track vocal strain and get health recommendations',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/ai/vocal-coach/assess-health',
    icon: 'Activity',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach#health',
    dependencies: ['vocal-coach'],
  },

  'vocal-coach-exercise': {
    id: 'vocal-coach-exercise',
    name: 'Exercise Generator',
    description: 'Custom vocal warm-up exercises',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/ai/vocal-coach/generate-exercise',
    icon: 'Zap',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach#exercises',
    dependencies: ['vocal-coach'],
  },

  'vocal-coach': {
    id: 'vocal-coach',
    name: 'Vocal Coach',
    description: 'Complete AI vocal coaching suite',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    component: 'src/ui/panels/VocalCoachPanel.tsx',
    icon: 'Mic',
    isPremium: true,
    docsUrl: '/docs/features/vocal-coach',
  },

  // ============================================================================
  // AI TOOLS - PRODUCER AI
  // ============================================================================

  'producer-chords': {
    id: 'producer-chords',
    name: 'Chord Generation',
    description: 'AI-generated chord progressions for any genre',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'available',
    endpoint: '/api/v1/ai/producer/generate',
    component: 'src/ui/panels/ProducerPanel.tsx',
    icon: 'Music2',
    isPremium: true,
    docsUrl: '/docs/features/producer-ai#chords',
    dependencies: ['producer-ai'],
  },

  'producer-melody': {
    id: 'producer-melody',
    name: 'Melody Generation',
    description: 'Create melodies that fit your chord progressions',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/ai/producer/generate',
    icon: 'Music',
    isPremium: true,
    docsUrl: '/docs/features/producer-ai#melody',
    dependencies: ['producer-ai'],
  },

  'producer-ai': {
    id: 'producer-ai',
    name: 'Producer AI',
    description: 'AI music production assistant',
    category: 'ai-tools',
    tier: 'PRO',
    status: 'available',
    component: 'src/ui/panels/ProducerPanel.tsx',
    icon: 'Sparkles',
    isPremium: true,
    docsUrl: '/docs/features/producer-ai',
  },

  // ============================================================================
  // CORE DAW FEATURES
  // ============================================================================

  'projects': {
    id: 'projects',
    name: 'Project Management',
    description: 'Create and manage music projects',
    category: 'core-daw',
    tier: 'FREE',
    status: 'available',
    endpoint: '/api/v1/projects',
    component: 'src/ui/components/ProjectList.tsx',
    icon: 'Folder',
    isPremium: false,
    docsUrl: '/docs/core/projects',
  },

  'tracks': {
    id: 'tracks',
    name: 'Track Management',
    description: 'Multi-track audio editing',
    category: 'core-daw',
    tier: 'FREE',
    status: 'available',
    endpoint: '/api/v1/tracks',
    component: 'src/ui/components/Track.tsx',
    icon: 'List',
    isPremium: false,
    docsUrl: '/docs/core/tracks',
  },

  'mixer': {
    id: 'mixer',
    name: 'Mixer',
    description: 'Professional mixing console',
    category: 'core-daw',
    tier: 'FREE',
    status: 'available',
    component: 'src/ui/components/MixerPanel.tsx',
    icon: 'Sliders',
    isPremium: false,
    docsUrl: '/docs/core/mixer',
  },

  'timeline': {
    id: 'timeline',
    name: 'Timeline',
    description: 'Visual audio editing timeline',
    category: 'core-daw',
    tier: 'FREE',
    status: 'available',
    component: 'src/ui/components/Timeline.tsx',
    icon: 'GripHorizontal',
    isPremium: false,
    docsUrl: '/docs/core/timeline',
  },

  'export': {
    id: 'export',
    name: 'Export',
    description: 'Export projects to multiple formats',
    category: 'core-daw',
    tier: 'FREE',
    status: 'available',
    endpoint: '/api/v1/exports',
    component: 'src/ui/components/ExportModal.tsx',
    icon: 'Download',
    isPremium: false,
    docsUrl: '/docs/core/export',
  },

  'collaboration': {
    id: 'collaboration',
    name: 'Collaboration',
    description: 'Real-time collaborative music production',
    category: 'core-daw',
    tier: 'PRO',
    status: 'beta',
    endpoint: '/api/v1/projects/:id/collaborators',
    component: 'src/ui/components/CollaboratorList.tsx',
    icon: 'Users',
    isPremium: true,
    docsUrl: '/docs/core/collaboration',
  },
};

/**
 * Get feature definition by ID
 */
export function getFeature(featureId: string): FeatureDefinition | undefined {
  return FEATURE_REGISTRY[featureId];
}

/**
 * Get all features in a category
 */
export function getFeaturesByCategory(category: string): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.category === category);
}

/**
 * Get all features for a tier (includes all lower tiers)
 */
export function getFeaturesByTier(tier: string): FeatureDefinition[] {
  const tierHierarchy: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    STUDIO: 2,
  };

  const userTierLevel = tierHierarchy[tier] || 0;

  return Object.values(FEATURE_REGISTRY).filter(f => {
    const featureTierLevel = tierHierarchy[f.tier] || 0;
    return featureTierLevel <= userTierLevel;
  });
}

/**
 * Get all premium features
 */
export function getPremiumFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.isPremium);
}

/**
 * Get all available (non-beta, non-deprecated) features
 */
export function getAvailableFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.status === 'available');
}
