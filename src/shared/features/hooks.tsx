/**
 * Feature Registry - React Hooks
 *
 * Convenient React hooks for checking feature access in components.
 */

import { useMemo } from 'react';
import { getFeature, getFeaturesByCategory, getFeaturesByTier } from './registry';
import type { FeatureDefinition, FeatureAccess, UserEntitlements } from './types';

/**
 * Hook to check if user has access to a feature
 *
 * @example
 * const autoCompAccess = useFeature('auto-comp', entitlements);
 * if (!autoCompAccess.hasAccess) {
 *   return <UpgradePrompt reason={autoCompAccess.reason} />;
 * }
 */
export function useFeature(
  featureId: string,
  entitlements?: UserEntitlements
): FeatureAccess {
  return useMemo(() => {
    const feature = getFeature(featureId);

    if (!feature) {
      return {
        hasAccess: false,
        reason: 'deprecated',
      };
    }

    // Check feature status
    if (feature.status === 'deprecated') {
      return {
        hasAccess: false,
        reason: 'deprecated',
      };
    }

    if (feature.status === 'planned') {
      return {
        hasAccess: false,
        reason: 'beta',
      };
    }

    // If no entitlements provided, assume no access to premium features
    if (!entitlements) {
      return {
        hasAccess: !feature.isPremium,
        reason: feature.isPremium ? 'tier' : undefined,
        upgradeUrl: feature.isPremium ? '/pricing' : undefined,
      };
    }

    // Check if feature is enabled in entitlements
    const entitlementKey = feature.entitlementKey || feature.id;
    const hasEntitlement = entitlements.features[entitlementKey];

    if (!hasEntitlement) {
      return {
        hasAccess: false,
        reason: 'tier',
        upgradeUrl: '/pricing',
      };
    }

    // Check daily limit (if applicable)
    if (feature.dailyLimit && entitlements.limits.daily_ops !== undefined) {
      // TODO: Implement actual usage tracking
      // For now, assume user has access
      return {
        hasAccess: true,
        usage: 0,
        limit: feature.dailyLimit,
      };
    }

    return {
      hasAccess: true,
    };
  }, [featureId, entitlements]);
}

/**
 * Hook to get feature definition
 *
 * @example
 * const feature = useFeatureDefinition('auto-comp');
 * return <FeatureCard name={feature.name} icon={feature.icon} />;
 */
export function useFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return useMemo(() => getFeature(featureId), [featureId]);
}

/**
 * Hook to get all features in a category
 *
 * @example
 * const aiFeatures = useFeatureCategory('ai-automation');
 */
export function useFeatureCategory(category: string): FeatureDefinition[] {
  return useMemo(() => getFeaturesByCategory(category), [category]);
}

/**
 * Hook to get all features available to user's tier
 *
 * @example
 * const myFeatures = useAvailableFeatures('PRO');
 */
export function useAvailableFeatures(tier: string): FeatureDefinition[] {
  return useMemo(() => getFeaturesByTier(tier), [tier]);
}

/**
 * Hook to check if user can use a feature (shorthand)
 *
 * @example
 * const canUseAutoComp = useHasFeature('auto-comp', entitlements);
 * if (canUseAutoComp) {
 *   return <AutoCompButton />;
 * }
 */
export function useHasFeature(
  featureId: string,
  entitlements?: UserEntitlements
): boolean {
  const access = useFeature(featureId, entitlements);
  return access.hasAccess;
}

/**
 * Hook for feature-gated component rendering
 *
 * @example
 * const FeatureGate = useFeatureGate('auto-comp', entitlements);
 * return (
 *   <FeatureGate
 *     fallback={<UpgradePrompt />}
 *   >
 *     <AutoCompPanel />
 *   </FeatureGate>
 * );
 */
export function useFeatureGate(
  featureId: string,
  entitlements?: UserEntitlements
) {
  const access = useFeature(featureId, entitlements);

  return function FeatureGate({
    children,
    fallback,
  }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    if (access.hasAccess) {
      return <>{children}</>;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback - show upgrade prompt
    return (
      <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
        <p className="text-sm text-yellow-200">
          {access.reason === 'tier' && 'Upgrade to access this feature'}
          {access.reason === 'limit' && 'Daily limit reached'}
          {access.reason === 'beta' && 'Coming soon'}
          {access.reason === 'deprecated' && 'Feature no longer available'}
        </p>
        {access.upgradeUrl && (
          <a
            href={access.upgradeUrl}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Learn more
          </a>
        )}
      </div>
    );
  };
}
