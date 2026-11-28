import type { Niche } from './common';

/** Which onboarding flow a signed-in user gets. */
export type OnboardingKind = 'brand_owner' | 'brand_member' | 'creator' | 'admin';

/** GET /api/v1/onboarding/status and POST /api/v1/onboarding/complete */
export interface OnboardingStatus {
  kind: OnboardingKind;
  completed: boolean;
  completedAt: string | null;
  /** The person's own name (users.display_name). */
  displayName: string | null;
  brand: {
    name: string | null;
    category: Niche | null;
    country: string;
    logoUrl: string | null;
    /** The owner's name, shown to an invited teammate. */
    ownerName: string | null;
    memberRole: 'owner' | 'approver' | 'viewer';
  } | null;
  creator: {
    displayName: string | null;
    city: string | null;
    niches: Niche[];
    /** numeric(10,2) string */
    basePrice: string | null;
    vettingStatus: 'pending' | 'approved' | 'rejected';
    portfolioCount: number;
  } | null;
}

/** GET /api/v1/onboarding/insights?city= */
export interface OnboardingInsights {
  creatorsByNiche: Partial<Record<Niche, number>>;
  openBriefsByNiche: Partial<Record<Niche, number>>;
  /** Middle half of approved creators' starting prices, in EGP. */
  priceBand: { low: number; high: number; basis: 'city' | 'all' | 'default'; city: string | null };
}
