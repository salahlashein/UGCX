import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * TASK-P1-001: reads API_BASE_URL per build profile (EAS sets it as an
 * env var per profile) and falls back to the local-dev default declared
 * in app.json's `extra.apiBaseUrl` when the variable is unset.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.API_BASE_URL ?? config.extra?.apiBaseUrl,
  },
});
