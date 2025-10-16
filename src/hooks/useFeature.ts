import { useMemo } from 'react';

/**
 * Feature gating hook that checks if a feature is available based on entitlements
 * @param featureKey - The feature to check (e.g., 'melody-to-lyrics', 'vocal-coach')
 * @param entitlements - User's entitlement data from API
 * @returns Object with isAvailable (boolean) and requiredTier (string if gated)
 */
export function useFeature(
  featureKey: string,
  entitlements?: { plan: string; features: Record<string, boolean>; limits: any }
) {
  return useMemo(() => {
    // No entitlements = not available
    if (!entitlements) {
      return { isAvailable: false, requiredTier: 'PRO' };
    }

    // Feature map: which tier unlocks which features
    const featureMap: Record<string, string> = {
      'melody-to-lyrics': 'PRO',
      'vocal-coach': 'FREE', // Basic vocal coach is free
      'vocal-coach-advanced': 'PRO',
      'harmony-generation': 'PRO',
      'auto-comp': 'PRO',
      'time-align': 'FREE',
      'pitch-correct': 'PRO',
      'auto-mix': 'STUDIO',
      'ai-mastering': 'STUDIO',
    };

    const requiredTier = featureMap[featureKey] || 'FREE';

    // Check if user's plan includes this feature
    const tierHierarchy = ['FREE', 'PRO', 'STUDIO', 'ENTERPRISE'];
    const userTierIndex = tierHierarchy.indexOf(entitlements.plan);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    const isAvailable = userTierIndex >= requiredTierIndex;

    return {
      isAvailable,
      requiredTier: isAvailable ? null : requiredTier,
      currentTier: entitlements.plan,
    };
  }, [featureKey, entitlements]);
}
