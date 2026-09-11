/**
 * TASK-P1-005: font family resolution.
 *
 * DES-P1-002 / DES-P1-003: Inter (Latin) + IBM Plex Sans Arabic (Arabic),
 * static weights 400/500 only. Haas is Airtable's licensed face and never
 * ships here. Runtime loading via `useFonts` is the simpler first attempt
 * (per the plan); build-time embedding via the expo-font config plugin is
 * a fallback noted for later if a native surface (e.g. a stack header)
 * fails to pick up the family on Android.
 */

import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { logger } from '../services/logger';

// Arabic line height is Latin line height x 1.15 (DES-P1-003 / R9).
export const LINE_HEIGHT_MULTIPLIER_AR = 1.15;

export interface AppFontsResult {
  loaded: boolean;
  failed: boolean;
}

/**
 * Wraps `useFonts` with both families. Never blocks the app forever
 * (EDGE-P1-002): if loading errors, this still reports `loaded: true` so
 * `App.tsx` can proceed and `AppText` falls back to the platform default
 * family.
 */
export function useAppFonts(): AppFontsResult {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
  });

  if (error) {
    logger.error('Font loading failed; falling back to platform default family', error);
    return { loaded: true, failed: true };
  }

  return { loaded, failed: false };
}

/**
 * Resolves the family name for a given weight and locale direction.
 * `AppText` falls back to `undefined` (platform default) when fonts have
 * not resolved (EDGE-P1-002); `fontWeight` is always set as a second
 * channel by the caller, so text stays legible either way.
 */
export function fontFamilyFor(weight: 400 | 500, isArabic: boolean): string {
  if (isArabic) {
    return weight === 500 ? 'IBMPlexSansArabic_500Medium' : 'IBMPlexSansArabic_400Regular';
  }
  return weight === 500 ? 'Inter_500Medium' : 'Inter_400Regular';
}
