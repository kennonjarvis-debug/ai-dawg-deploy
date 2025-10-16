/**
 * Feature Registry - Type Definitions
 *
 * Centralized type system for all AI DAWG features.
 * Used for feature gates, entitlements, and UI rendering.
 */

export type FeatureTier = 'FREE' | 'PRO' | 'STUDIO';

export type FeatureCategory =
  | 'core-daw'
  | 'ai-automation'
  | 'ai-tools'
  | 'business'
  | 'infrastructure';

export type FeatureStatus = 'available' | 'beta' | 'planned' | 'deprecated';

export interface FeatureDefinition {
  /** Unique feature identifier (matches entitlement key) */
  id: string;

  /** Display name for UI */
  name: string;

  /** Short description */
  description: string;

  /** Feature category */
  category: FeatureCategory;

  /** Minimum tier required to access this feature */
  tier: FeatureTier;

  /** Feature status */
  status: FeatureStatus;

  /** Backend API endpoint (if applicable) */
  endpoint?: string;

  /** Frontend component path (if applicable) */
  component?: string;

  /** Icon component name (for UI rendering) */
  icon?: string;

  /** Daily usage limit (if applicable) */
  dailyLimit?: number;

  /** Feature dependencies (other features that must be enabled) */
  dependencies?: string[];

  /** Documentation URL */
  docsUrl?: string;

  /** Is this a premium feature that requires upgrade? */
  isPremium: boolean;

  /** Entitlement key used in backend middleware */
  entitlementKey?: string;
}

export interface FeatureAccess {
  /** Can the user access this feature? */
  hasAccess: boolean;

  /** Reason for no access (if hasAccess is false) */
  reason?: 'tier' | 'limit' | 'beta' | 'deprecated';

  /** Current usage count (if daily limit applies) */
  usage?: number;

  /** Daily limit (if applicable) */
  limit?: number;

  /** Upgrade URL (if user needs to upgrade) */
  upgradeUrl?: string;
}

export interface UserEntitlements {
  plan: FeatureTier;
  features: Record<string, boolean>;
  limits: {
    daily_ops?: number;
    projects?: number;
    tracks?: number;
    storage?: number;
  };
}
