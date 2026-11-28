import type { Niche, OnboardingKind, OnboardingStatus } from '@ugcx/shared-types';

export type OnboardingStep =
  | 'brand-name'
  | 'brand-category'
  | 'brand-logo'
  | 'brand-ready'
  | 'member-name'
  | 'creator-name'
  | 'creator-niches'
  | 'creator-price'
  | 'creator-sample'
  | 'creator-review';

/** The screens of each flow, in order. */
export function stepsFor(kind: OnboardingKind): OnboardingStep[] {
  if (kind === 'brand_owner') return ['brand-name', 'brand-category', 'brand-logo', 'brand-ready'];
  if (kind === 'brand_member') return ['member-name'];
  if (kind === 'creator') {
    return ['creator-name', 'creator-niches', 'creator-price', 'creator-sample', 'creator-review'];
  }
  return [];
}

const filled = (value: string | null | undefined) => Boolean(value && value.trim());

/**
 * The step to open when the user arrives, so a returning user continues where
 * they stopped. Optional steps (logo, sample) count as done once anything after
 * them is saved, so this never sends someone back to a step they skipped.
 */
export function resumeStepIndex(status: OnboardingStatus): number {
  if (status.kind === 'brand_owner') {
    const b = status.brand;
    if (!filled(status.displayName) || !filled(b?.name)) return 0;
    if (!b?.category) return 1;
    return 2;
  }
  if (status.kind === 'creator') {
    const c = status.creator;
    if (!filled(c?.displayName) || !filled(c?.city)) return 0;
    if (!c || c.niches.length === 0) return 1;
    if (!c.basePrice) return 2;
    return 3;
  }
  return 0;
}

export const MAX_NICHES = 3;

/** Adds or removes a niche. A fourth niche is refused, so the list stays at three. */
export function toggleNiche(current: Niche[], niche: Niche): Niche[] {
  if (current.includes(niche)) return current.filter((n) => n !== niche);
  if (current.length >= MAX_NICHES) return current;
  return [...current, niche];
}

export const PRICE_MIN = 300;
export const PRICE_MAX = 5000;
export const PRICE_STEP = 50;

/** Keeps a starting price inside the slider range, on a 50 EGP step. */
export function clampPrice(value: number): number {
  if (!Number.isFinite(value)) return PRICE_MIN;
  const stepped = Math.round(value / PRICE_STEP) * PRICE_STEP;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, stepped));
}

/** Where a value sits on the slider, from 0 to 100, for drawing the market band. */
export function pricePercent(value: number): number {
  return ((clampPrice(value) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
}

/** Up to two initials for an avatar. Works for Arabic names, which have no letter case. */
export function initialsFrom(name: string | null | undefined, fallback = '?'): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = words
    .map((w) => Array.from(w)[0])
    .join('')
    .toUpperCase();
  return letters || fallback;
}
