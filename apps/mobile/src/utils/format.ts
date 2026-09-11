import type { AppLocale } from '../i18n';

/**
 * DES-P1-015 / R6: Egyptian bank apps, Paymob checkout, and phone keypads
 * all show Western Arabic numerals. Rendering Arabic-Indic digits in the
 * app while checkout shows Latin digits would make a price look like a
 * different price, so Arabic renders money and counts with Latin digits
 * via the `-u-nu-latn` Unicode extension.
 */
function localeTag(locale: AppLocale): string {
  return locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
}

export function formatMoney(amount: number, currency: string, locale: AppLocale): string {
  try {
    return new Intl.NumberFormat(localeTag(locale), {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatCount(n: number, locale: AppLocale): string {
  try {
    return new Intl.NumberFormat(localeTag(locale)).format(n);
  } catch {
    return `${n}`;
  }
}
