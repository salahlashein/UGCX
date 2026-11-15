import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';
import { getItem, setItem, StorageKeys } from '../services/secureStorage';
import { logger } from '../services/logger';

export type AppLocale = 'en' | 'ar';
const RTL_LOCALES: AppLocale[] = ['ar'];

function isRtl(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

function detectDeviceLocale(): AppLocale {
  const tag = Localization.getLocales()[0]?.languageCode;
  return tag === 'ar' ? 'ar' : 'en';
}

/**
 * TASK-P1-004: initializes i18next and applies RTL layout direction
 * before the app renders, since I18nManager.forceRTL only takes effect
 * for layout on the *next* render tree, not text direction alone
 * (REQ-008). Returns whether a reload was just applied, so App.tsx can
 * avoid rendering a half-mirrored tree.
 */
export async function initI18n(): Promise<{ locale: AppLocale }> {
  const stored = await getItem(StorageKeys.LOCALE);
  const locale: AppLocale = stored === 'ar' || stored === 'en' ? stored : detectDeviceLocale();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

  applyLayoutDirection(locale);
  return { locale };
}

/** EDGE-P1-005: caller decides whether the change requires a reload. */
export function applyLayoutDirection(locale: AppLocale): void {
  const rtl = isRtl(locale);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.body?.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}

/** Persists the override and switches i18next; caller reloads the app if direction changed. */
export async function setAppLocale(locale: AppLocale): Promise<{ directionChanged: boolean }> {
  const directionChanged = isRtl(locale) !== I18nManager.isRTL;
  await setItem(StorageKeys.LOCALE, locale);
  await i18n.changeLanguage(locale);
  applyLayoutDirection(locale);
  if (directionChanged) {
    logger.info('Locale direction changed; app reload required for full RTL mirroring');
  }
  return { directionChanged };
}

export default i18n;
