import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@ugcx/shared-types';

/**
 * Mobile application feature flag configuration.
 * Decommissions high-risk/complex features for Release 1.
 */
export const FEATURES: FeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
  // Overrides for local dev/testing if needed can be configured here
};

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return Boolean(FEATURES[flag]);
}
