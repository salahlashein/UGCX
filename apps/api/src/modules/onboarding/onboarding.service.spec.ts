import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { UserRole } from '../users/entities/user.entity';
import { BrandMemberRole, BrandMemberStatus } from '../brands/entities/brand-member.entity';
import { VettingStatus } from '../creators/entities/creator.entity';
import { Niche } from '../../common/enums/niche.enum';
import {
  DEFAULT_PRICE_BAND,
  missingOnboardingFields,
  OnboardingService,
  OnboardingStatus,
  roundPrice,
} from './onboarding.service';

const baseStatus = (over: Partial<OnboardingStatus>): OnboardingStatus => ({
  kind: 'creator',
  completed: false,
  completedAt: null,
  displayName: null,
  brand: null,
  creator: null,
  ...over,
});

describe('missingOnboardingFields', () => {
  it('asks a creator for name, city, niches and price', () => {
    expect(missingOnboardingFields(baseStatus({ kind: 'creator' }))).toEqual([
      'displayName',
      'city',
      'niches',
      'basePrice',
    ]);
  });

  it('accepts a complete creator profile', () => {
    const status = baseStatus({
      kind: 'creator',
      creator: {
        displayName: 'Mariam Adel',
        city: 'Cairo',
        niches: [Niche.BEAUTY_PERSONAL_CARE],
        basePrice: '1200.00',
        vettingStatus: VettingStatus.PENDING,
        portfolioCount: 0,
      },
    });
    expect(missingOnboardingFields(status)).toEqual([]);
  });

  it('asks a brand owner for their name, the brand name and a category', () => {
    const status = baseStatus({
      kind: 'brand_owner',
      brand: { name: null, category: null, country: 'EG', logoUrl: null, ownerName: null, memberRole: BrandMemberRole.OWNER },
    });
    expect(missingOnboardingFields(status)).toEqual(['displayName', 'brandName', 'category']);
  });

  it('asks an invited teammate for their name only', () => {
    const status = baseStatus({
      kind: 'brand_member',
      brand: { name: 'Glow Lab', category: null, country: 'EG', logoUrl: null, ownerName: 'Salma', memberRole: BrandMemberRole.APPROVER },
    });
    expect(missingOnboardingFields(status)).toEqual(['displayName']);
  });

  it('never asks an admin for anything', () => {
    expect(missingOnboardingFields(baseStatus({ kind: 'admin' }))).toEqual([]);
  });
});

describe('roundPrice', () => {
  it('rounds to the nearest 50', () => {
    expect(roundPrice(812.5)).toBe(800);
    expect(roundPrice(1990)).toBe(2000);
    expect(roundPrice(1225)).toBe(1250);
  });
});

describe('OnboardingService', () => {
  const makeService = (opts: {
    user: Record<string, unknown> | null;
    creator?: Record<string, unknown> | null;
    membership?: Record<string, unknown> | null;
    brand?: Record<string, unknown> | null;
    queryRows?: unknown[][];
  }) => {
    const usersRepository = {
      findOne: jest.fn().mockResolvedValue(opts.user),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const queryRows = [...(opts.queryRows ?? [])];
    const dataSource = {
      getRepository: jest.fn((entity: { name: string }) => {
        if (entity.name === 'Creator') return { findOne: jest.fn().mockResolvedValue(opts.creator ?? null) };
        if (entity.name === 'CreatorPortfolioItem') return { count: jest.fn().mockResolvedValue(0) };
        if (entity.name === 'BrandMember') return { findOne: jest.fn().mockResolvedValue(opts.membership ?? null) };
        if (entity.name === 'Brand') return { findOne: jest.fn().mockResolvedValue(opts.brand ?? null) };
        throw new Error(`unexpected repository ${entity.name}`);
      }),
      query: jest.fn(() => Promise.resolve(queryRows.shift() ?? [])),
    };
    const service = new OnboardingService(usersRepository as never, dataSource as never);
    return { service, usersRepository, dataSource };
  };

  it('reports an admin as already onboarded', async () => {
    const { service } = makeService({ user: { id: 'u1', role: UserRole.ADMIN, onboardingCompletedAt: null } });
    const status = await service.getStatus('u1');
    expect(status.kind).toBe('admin');
    expect(status.completed).toBe(true);
  });

  it('reports an invited approver as a brand member', async () => {
    const { service } = makeService({
      user: { id: 'u2', role: UserRole.BRAND, onboardingCompletedAt: null, displayName: null },
      membership: { brandId: 'b1', role: BrandMemberRole.APPROVER, status: BrandMemberStatus.ACTIVE },
      brand: { id: 'b1', userId: 'owner', companyName: 'Glow Lab', category: Niche.BEAUTY_PERSONAL_CARE, country: 'EG', logoUrl: null },
    });
    const status = await service.getStatus('u2');
    expect(status.kind).toBe('brand_member');
    expect(status.brand?.name).toBe('Glow Lab');
  });

  it('refuses to finish while required fields are missing and leaves the flag empty', async () => {
    const { service, usersRepository } = makeService({
      user: { id: 'u3', role: UserRole.CREATOR, onboardingCompletedAt: null, displayName: null },
      creator: { id: 'c1', displayName: 'Mariam', city: null, niches: [], basePrice: null, vettingStatus: VettingStatus.PENDING },
    });
    await expect(service.complete('u3')).rejects.toBeInstanceOf(DomainErrorException);
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('sets the flag once every required field is saved', async () => {
    const { service, usersRepository } = makeService({
      user: { id: 'u4', role: UserRole.CREATOR, onboardingCompletedAt: null, displayName: 'Mariam Adel' },
      creator: { id: 'c1', displayName: 'Mariam Adel', city: 'Cairo', niches: [Niche.FASHION], basePrice: '1200.00', vettingStatus: VettingStatus.PENDING },
    });
    await service.complete('u4');
    expect(usersRepository.update).toHaveBeenCalledWith('u4', { onboardingCompletedAt: expect.any(Date) });
  });

  it('does nothing for a user who already finished', async () => {
    const { service, usersRepository } = makeService({
      user: { id: 'u5', role: UserRole.CREATOR, onboardingCompletedAt: new Date('2026-01-01'), displayName: null },
      creator: null,
    });
    const status = await service.complete('u5');
    expect(status.completed).toBe(true);
    expect(usersRepository.update).not.toHaveBeenCalled();
  });

  it('falls back to the default price band when too few creators set a price', async () => {
    const { service } = makeService({
      user: null,
      queryRows: [[], [], [{ low: '900', high: '1500', n: '2' }], [{ low: null, high: null, n: '0' }]],
    });
    const insights = await service.getInsights('Cairo');
    expect(insights.priceBand).toEqual({ ...DEFAULT_PRICE_BAND, basis: 'default', city: null });
  });

  it('uses the city band when the city has enough priced creators', async () => {
    const { service } = makeService({
      user: null,
      queryRows: [
        [{ niche: 'fashion', count: '7' }],
        [{ niche: 'fashion', count: '3' }],
        [{ low: '812', high: '1990', n: '9' }],
      ],
    });
    const insights = await service.getInsights('Cairo');
    expect(insights.creatorsByNiche).toEqual({ fashion: 7 });
    expect(insights.openBriefsByNiche).toEqual({ fashion: 3 });
    expect(insights.priceBand).toEqual({ low: 800, high: 2000, basis: 'city', city: 'Cairo' });
  });
});
