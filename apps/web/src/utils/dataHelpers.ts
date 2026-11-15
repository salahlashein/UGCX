import { centsToAmount } from './money';
import { formatAmount } from './format';

/**
 * Returns due tone: 'hot' under 48h, 'warm' under 7 days, else 'neu'.
 */
export function dueTone(dueAt: string | Date, now: Date = new Date()): 'hot' | 'warm' | 'neu' {
  const target = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 48 * 3600 * 1000) {
    return 'hot';
  }
  if (diffMs <= 7 * 24 * 3600 * 1000) {
    return 'warm';
  }
  return 'neu';
}

/**
 * Computes segment percentage widths that never exceed 100% and sum to <= 100 within 0.1.
 */
export function meterWidths(
  segments: Array<{ cents?: number; value?: number }>,
  total: number,
): number[] {
  if (total <= 0 || segments.length === 0) {
    return segments.map(() => 0);
  }
  const raw = segments.map((s) => Math.max(0, ((s.cents ?? s.value ?? 0) / total) * 100));
  const sumRaw = raw.reduce((a, b) => a + b, 0);

  if (sumRaw <= 100) {
    return raw.map((w) => Number(w.toFixed(1)));
  }

  // scale down so it never exceeds 100
  return raw.map((w) => Number(((w / sumRaw) * 100).toFixed(1)));
}

/**
 * Formats signed mono amount:
 * 'in' -> '+EGP 3,200.00'
 * 'out' -> '−EGP 5,000.00' (U+2212)
 * 'hold' -> 'EGP 3,200.00'
 */
export function signedAmount(
  cents: number,
  direction: 'in' | 'out' | 'hold',
  currency: string = 'EGP',
): string {
  const absAmount = formatAmount(centsToAmount(Math.abs(cents)));
  if (direction === 'in') {
    return `+${currency} ${absAmount}`;
  }
  if (direction === 'out') {
    return `\u2212${currency} ${absAmount}`;
  }
  return `${currency} ${absAmount}`;
}

/**
 * Computes bar chart heights in percent (0 - 100).
 */
export function barHeights(values: number[], max?: number): number[] {
  const effectiveMax = max && max > 0 ? max : Math.max(...values, 1);
  return values.map((v) => {
    const pct = Math.min(100, Math.max(0, (v / effectiveMax) * 100));
    return Number(pct.toFixed(1));
  });
}

/**
 * Formats 3 axis labels: 0, half, max (e.g. ['0', '6K', '12K']).
 */
export function barAxis(max: number): string[] {
  const formatCompact = (num: number): string => {
    if (num === 0) return '0';
    if (num >= 1000000) {
      const m = num / 1000000;
      return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
    }
    if (num >= 1000) {
      const k = num / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return String(Math.round(num));
  };

  const half = Math.round(max / 2);
  return [formatCompact(0), formatCompact(half), formatCompact(max)];
}
