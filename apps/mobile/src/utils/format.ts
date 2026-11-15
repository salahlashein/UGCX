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

/** Latin digits, grouped, no currency symbol. RTL rule 5. */
export function formatAmount(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return String(value);
  }
}

/** Latin digits, no grouping or localized count. */
export function formatCount(n: number, locale?: AppLocale): string {
  if (!locale) {
    return `${n}`;
  }
  try {
    return new Intl.NumberFormat(localeTag(locale)).format(n);
  } catch {
    return `${n}`;
  }
}

/** Up to two upper-case initials for an avatar. Works for Arabic names, which have no case. */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]);
  return letters.join('').toUpperCase() || '?';
}
