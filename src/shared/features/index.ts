/**
 * Feature Registry - Public API
 *
 * Centralized feature system for DAWG AI.
 * Import from this module to access feature definitions, types, and hooks.
 *
 * @example
 * import { FEATURE_REGISTRY, useFeature, useHasFeature } from '@/shared/features';
 */

// Types
export type {
  FeatureTier,
  FeatureCategory,
  FeatureStatus,
  FeatureDefinition,
  FeatureAccess,
  UserEntitlements,
} from './types';

// Registry
export {
  FEATURE_REGISTRY,
  getFeature,
  getFeaturesByCategory,
  getFeaturesByTier,
  getPremiumFeatures,
  getAvailableFeatures,
} from './registry';

// React Hooks
export {
  useFeature,
  useFeatureDefinition,
  useFeatureCategory,
  useAvailableFeatures,
  useHasFeature,
  useFeatureGate,
} from './hooks';
