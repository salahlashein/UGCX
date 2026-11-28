import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { OnboardingStatus } from '@ugcx/shared-types';
import {
  clampPrice,
  initialsFrom,
  MAX_NICHES,
  pricePercent,
  resumeStepIndex,
  stepsFor,
  toggleNiche,
} from '../utils/onboarding';

const status = (over: Partial<OnboardingStatus>): OnboardingStatus => ({
  kind: 'creator',
  completed: false,
  completedAt: null,
  displayName: null,
  brand: null,
  creator: null,
  ...over,
});

const brand = (over: Partial<NonNullable<OnboardingStatus['brand']>> = {}) => ({
  name: null,
  category: null,
  country: 'EG',
  logoUrl: null,
  ownerName: null,
  memberRole: 'owner' as const,
  ...over,
});

const creator = (over: Partial<NonNullable<OnboardingStatus['creator']>> = {}) => ({
  displayName: null,
  city: null,
  niches: [],
  basePrice: null,
  vettingStatus: 'pending' as const,
  portfolioCount: 0,
  ...over,
});

describe('onboarding steps', () => {
  it('gives each kind its own screens', () => {
    assert.equal(stepsFor('brand_owner').length, 4);
    assert.deepEqual(stepsFor('brand_member'), ['member-name']);
    assert.equal(stepsFor('creator').length, 5);
    assert.deepEqual(stepsFor('admin'), []);
  });

  it('starts a brand-new brand on the first screen', () => {
    assert.equal(resumeStepIndex(status({ kind: 'brand_owner', brand: brand() })), 0);
  });

  it('resumes a brand at category, then at the logo', () => {
    const named = status({
      kind: 'brand_owner',
      displayName: 'Salma',
      brand: brand({ name: 'Glow Lab' }),
    });
    assert.equal(resumeStepIndex(named), 1);
    const categorised = status({
      kind: 'brand_owner',
      displayName: 'Salma',
      brand: brand({ name: 'Glow Lab', category: 'beauty_personal_care' }),
    });
    assert.equal(resumeStepIndex(categorised), 2);
  });

  it('treats a whitespace name as missing', () => {
    const blank = status({
      kind: 'brand_owner',
      displayName: '  ',
      brand: brand({ name: 'Glow Lab' }),
    });
    assert.equal(resumeStepIndex(blank), 0);
  });

  it('resumes a creator at niches, then price, then the sample', () => {
    const named = creator({ displayName: 'Mariam', city: 'Cairo' });
    assert.equal(resumeStepIndex(status({ creator: named })), 1);
    const withNiches = { ...named, niches: ['fashion' as const] };
    assert.equal(resumeStepIndex(status({ creator: withNiches })), 2);
    assert.equal(resumeStepIndex(status({ creator: { ...withNiches, basePrice: '1200.00' } })), 3);
  });
});

describe('onboarding inputs', () => {
  it('toggleNiche adds, removes and stops at three', () => {
    assert.deepEqual(toggleNiche([], 'fashion'), ['fashion']);
    assert.deepEqual(toggleNiche(['fashion'], 'fashion'), []);
    const full = toggleNiche(toggleNiche(toggleNiche([], 'fashion'), 'mom_baby'), 'other');
    assert.equal(full.length, MAX_NICHES);
    assert.deepEqual(toggleNiche(full, 'food_fmcg'), full);
  });

  it('clampPrice keeps the price inside 300 to 5,000 on a 50 step', () => {
    assert.equal(clampPrice(1234), 1250);
    assert.equal(clampPrice(50), 300);
    assert.equal(clampPrice(99999), 5000);
    assert.equal(clampPrice(Number.NaN), 300);
  });

  it('pricePercent places the ends of the range at 0 and 100', () => {
    assert.equal(pricePercent(300), 0);
    assert.equal(pricePercent(5000), 100);
  });

  it('initialsFrom works for Latin and Arabic names', () => {
    assert.equal(initialsFrom('Glow Lab'), 'GL');
    assert.equal(initialsFrom('مريم عادل'), 'مع');
    assert.equal(initialsFrom('', 'B'), 'B');
  });
});
