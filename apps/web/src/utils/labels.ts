import type { Locale } from '../i18n';

/**
 * Turns an API enum value into words.
 *
 * The API stores snake_case enums such as `talking_head`. A screen must never
 * print the raw value.
 */
export function humanize(value: string | null | undefined): string {
  if (!value) return '';
  const words = String(value).replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const VIDEO_TYPE_AR: Record<string, string> = {
  unboxing: 'فتح المنتج',
  testimonial: 'شهادة عميل',
  demo: 'عرض المنتج',
  tutorial: 'شرح تعليمي',
  talking_head: 'حديث مباشر',
  try_on: 'تجربة المنتج',
  other: 'أخرى',
};

export function videoTypeLabel(value: string | null | undefined, locale: Locale = 'en'): string {
  if (!value) return locale === 'ar' ? 'غير محدد' : 'Not set';
  if (locale === 'ar') return VIDEO_TYPE_AR[value] ?? humanize(value);
  return humanize(value);
}

export function languageLabel(value: string | null | undefined, locale: Locale = 'en'): string {
  const code = (value || '').toLowerCase();
  if (code === 'ar') return locale === 'ar' ? 'العربية' : 'Arabic';
  if (code === 'en') return locale === 'ar' ? 'الإنجليزية' : 'English';
  return locale === 'ar' ? 'غير محدد' : 'Not set';
}

export function shippingLabel(
  needsShipping: boolean | null | undefined,
  locale: Locale = 'en',
): string {
  if (needsShipping) return locale === 'ar' ? 'يُشحن المنتج' : 'Product shipped';
  return locale === 'ar' ? 'بدون شحن' : 'No shipping';
}

/** Picks the singular or the plural form. Arabic uses the plural for 3 and above. */
export function plural(count: number, one: string, many: string, locale: Locale = 'en'): string {
  if (locale === 'ar') {
    return `${count} ${count >= 3 ? many : one}`;
  }
  return `${count} ${count === 1 ? one : many}`;
}

/** An em dash for a value the API does not have yet. */
export const EMPTY_VALUE = '—';

export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE;
  return String(value);
}

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_AR = [
  'ينا',
  'فبر',
  'مار',
  'أبر',
  'ماي',
  'يون',
  'يول',
  'أغس',
  'سبت',
  'أكت',
  'نوف',
  'ديس',
];

/** Turns a "YYYY-MM" bucket into a short month name. */
export function monthLabel(bucket: string | null | undefined, locale: Locale = 'en'): string {
  if (!bucket) return '';
  const month = Number(String(bucket).slice(5, 7));
  if (!Number.isFinite(month) || month < 1 || month > 12) return String(bucket);
  return (locale === 'ar' ? MONTHS_AR : MONTHS_EN)[month - 1];
}
