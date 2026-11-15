'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.json';
import ar from './ar.json';
import type { Locale, TranslateFn, TranslationDictionary, TranslationKey } from './types';

export type { Locale, TranslateFn, TranslationDictionary, TranslationKey };

const STORAGE_KEY = 'ugcx_locale';

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ar: ar as Record<string, unknown>,
};

export function resolveDotPath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number | undefined>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  }, [locale, setLocale]);

  const t: TranslateFn = useCallback(
    (key, defaultValueOrParams, maybeParams) => {
      const defaultValue =
        typeof defaultValueOrParams === 'string' ? defaultValueOrParams : undefined;
      const params = typeof defaultValueOrParams === 'object' ? defaultValueOrParams : maybeParams;

      const localized = resolveDotPath(dictionaries[locale], key);
      const fallback = locale !== 'en' ? resolveDotPath(dictionaries.en, key) : undefined;
      const found = localized ?? fallback ?? defaultValue ?? key;

      return interpolate(found, params);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: locale === 'ar',
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en',
      isRTL: false,
      setLocale: () => undefined,
      toggleLocale: () => undefined,
      t: (key, defaultValueOrParams, maybeParams) => {
        const defaultValue =
          typeof defaultValueOrParams === 'string' ? defaultValueOrParams : undefined;
        const params =
          typeof defaultValueOrParams === 'object' ? defaultValueOrParams : maybeParams;
        const found = resolveDotPath(dictionaries.en, key) ?? defaultValue ?? key;
        return interpolate(found, params);
      },
    };
  }
  return ctx;
}
