import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@ugcx/shared-types';

/**
 * DEC-W004: Web Soft Launch feature flags.
 * High-risk features remain gated off in accordance with AGENTS.md Rule 7.
 */
export const FEATURE_FLAGS: FeatureFlags = {
  ...DEFAULT_FEATURE_FLAGS,
};
