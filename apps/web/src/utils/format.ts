import { centsToAmount, displayToCents, toCents } from './money';

/**
 * Formatting helpers for money, dates, references, and initials.
 * Money is formatted with exact two-decimal precision using integer cents (REQ-W103).
 */

export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.00';
  // Arithmetic uses the strict parser. Display must not throw, so a value that
  // already carries a sign or a separator falls back to the display parser.
  let cents: number;
  try {
    cents = toCents(value);
  } catch {
    const negative = typeof value === 'string' && /^\s*[-−]/.test(value);
    cents = displayToCents(value) * (negative ? -1 : 1);
  }
  const amountStr = centsToAmount(cents);
  const [intPart, decPart] = amountStr.split('.');
  const negative = intPart.startsWith('-');
  const absInt = intPart.replace('-', '');
  const formattedInt = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${formattedInt}.${decPart}`;
}

/** A non-breaking space. It keeps a currency and its number on one line. */
const NBSP = '\u00a0';

/**
 * A money value for display, such as "EGP 3,200.00".
 *
 * The gap is a non-breaking space, so a narrow table cell never splits the
 * currency from the number across two lines.
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency: string = 'EGP',
): string {
  return `${currency}${NBSP}${formatAmount(value)}`;
}

export function formatRef(id: string | null | undefined, prefix: string = 'BR'): string {
  if (!id) return `${prefix}-000000`;
  const clean = id
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  return `${prefix}-${clean.padEnd(6, '0')}`;
}

export function getInitials(name: string | null | undefined, fallback = 'UG'): string {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function formatDateShort(isoString: string | null | undefined, locale = 'en'): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDate(isoString: string | null | undefined, locale = 'en'): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDueDate(isoString: string | null | undefined, locale = 'en'): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return locale === 'ar'
      ? `متأخر (${formatDateShort(isoString, locale)})`
      : `Overdue (${formatDateShort(isoString, locale)})`;
  }
  if (diffDays === 0) {
    return locale === 'ar' ? 'اليوم' : 'Today';
  }
  if (diffDays === 1) {
    return locale === 'ar' ? 'غداً' : 'Tomorrow';
  }
  return locale === 'ar' ? `خلال ${diffDays} أيام` : `In ${diffDays} days`;
}

export function formatResend(secondsLeft: number): string {
  const safe = Math.max(0, Math.floor(secondsLeft || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
