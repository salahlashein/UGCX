import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Brand } from '../brands/entities/brand.entity';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from '../brands/entities/brand-member.entity';
import { Creator, VettingStatus } from '../creators/entities/creator.entity';
import { CreatorPortfolioItem } from '../creators/entities/creator-portfolio-item.entity';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { Niche } from '../../common/enums/niche.enum';

export type OnboardingKind = 'brand_owner' | 'brand_member' | 'creator' | 'admin';

export interface OnboardingStatus {
  kind: OnboardingKind;
  completed: boolean;
  completedAt: string | null;
  displayName: string | null;
  brand: {
    name: string | null;
    category: Niche | null;
    country: string;
    logoUrl: string | null;
    ownerName: string | null;
    memberRole: BrandMemberRole;
  } | null;
  creator: {
    displayName: string | null;
    city: string | null;
    niches: Niche[];
    basePrice: string | null;
    vettingStatus: VettingStatus;
    portfolioCount: number;
  } | null;
}

export interface OnboardingInsights {
  creatorsByNiche: Record<string, number>;
  openBriefsByNiche: Record<string, number>;
  priceBand: { low: number; high: number; basis: 'city' | 'all' | 'default'; city: string | null };
}

/** Below this many priced creators a percentile band is noise, so a wider pool or a default is used. */
export const MIN_PRICE_SAMPLE = 5;
export const DEFAULT_PRICE_BAND = { low: 800, high: 2000 };

/** Rounds a price to the nearest 50 so the band reads like a real asking price. */
export function roundPrice(value: number): number {
  return Math.round(value / 50) * 50;
}

/** Fields each kind must have before onboarding can finish. Returns the names of the missing ones. */
export function missingOnboardingFields(status: OnboardingStatus): string[] {
  const missing: string[] = [];
  if (status.kind === 'admin') return missing;
  if (status.kind === 'creator') {
    const c = status.creator;
    if (!c?.displayName?.trim()) missing.push('displayName');
    if (!c?.city?.trim()) missing.push('city');
    if (!c || c.niches.length === 0) missing.push('niches');
    if (!c?.basePrice) missing.push('basePrice');
    return missing;
  }
  if (!status.displayName?.trim()) missing.push('displayName');
  if (status.kind === 'brand_owner') {
    if (!status.brand?.name?.trim()) missing.push('brandName');
    if (!status.brand?.category) missing.push('category');
  }
  return missing;
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const base = {
      completed: Boolean(user.onboardingCompletedAt),
      completedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
      displayName: user.displayName,
      brand: null,
      creator: null,
    };

    if (user.role === UserRole.ADMIN) {
      // Admins never see onboarding.
      return { ...base, kind: 'admin', completed: true };
    }

    if (user.role === UserRole.CREATOR) {
      const creator = await this.dataSource.getRepository(Creator).findOne({ where: { userId } });
      const portfolioCount = creator
        ? await this.dataSource
            .getRepository(CreatorPortfolioItem)
            .count({ where: { creatorId: creator.id } })
        : 0;
      return {
        ...base,
        kind: 'creator',
        creator: creator
          ? {
              displayName: creator.displayName,
              city: creator.city,
              niches: creator.niches ?? [],
              basePrice: creator.basePrice,
              vettingStatus: creator.vettingStatus,
              portfolioCount,
            }
          : null,
      };
    }

    // Brand: an active membership decides owner or invited teammate.
    const membership = await this.dataSource.getRepository(BrandMember).findOne({
      where: { userId, status: BrandMemberStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
    const brand = membership
      ? await this.dataSource.getRepository(Brand).findOne({ where: { id: membership.brandId } })
      : await this.dataSource.getRepository(Brand).findOne({ where: { userId } });
    const memberRole = membership?.role ?? BrandMemberRole.OWNER;
    const ownerName =
      brand && brand.userId !== userId
        ? ((await this.usersRepository.findOne({ where: { id: brand.userId } }))?.displayName ?? null)
        : null;

    return {
      ...base,
      kind: memberRole === BrandMemberRole.OWNER ? 'brand_owner' : 'brand_member',
      brand: brand
        ? {
            name: brand.companyName,
            category: brand.category,
            country: brand.country,
            logoUrl: brand.logoUrl,
            ownerName,
            memberRole,
          }
        : null,
    };
  }

  /** Marks onboarding as finished once the required fields are saved. Calling it again changes nothing. */
  async complete(userId: string): Promise<OnboardingStatus> {
    const status = await this.getStatus(userId);
    if (status.completed) return status;

    const missing = missingOnboardingFields(status);
    if (missing.length > 0) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'onboarding_incomplete',
        'Finish the onboarding steps first',
        missing.map((field) => ({ field, message: 'required' })),
      );
    }

    await this.usersRepository.update(userId, { onboardingCompletedAt: new Date() });
    return this.getStatus(userId);
  }

  /** Counts and a price band for the onboarding tiles. Aggregates only, no personal data. */
  async getInsights(city?: string): Promise<OnboardingInsights> {
    const creatorRows: { niche: string; count: string }[] = await this.dataSource.query(
      `SELECT n AS niche, COUNT(*)::int AS count
         FROM creators, unnest(niches) AS n
        WHERE vetting_status = $1
        GROUP BY n`,
      [VettingStatus.APPROVED],
    );
    const briefRows: { niche: string; count: string }[] = await this.dataSource.query(
      `SELECT niche::text AS niche, COUNT(*)::int AS count
         FROM campaigns
        WHERE status = 'live' AND niche IS NOT NULL
        GROUP BY niche`,
    );

    const toMap = (rows: { niche: string; count: string }[]) =>
      Object.fromEntries(rows.map((r) => [r.niche, Number(r.count)]));

    return {
      creatorsByNiche: toMap(creatorRows),
      openBriefsByNiche: toMap(briefRows),
      priceBand: await this.priceBand(city?.trim() || null),
    };
  }

  private async priceBand(city: string | null): Promise<OnboardingInsights['priceBand']> {
    const band = async (forCity: string | null) => {
      const [row]: { low: string | null; high: string | null; n: string }[] = await this.dataSource.query(
        `SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY base_price) AS low,
                percentile_cont(0.75) WITHIN GROUP (ORDER BY base_price) AS high,
                COUNT(*)::int AS n
           FROM creators
          WHERE vetting_status = $1
            AND base_price IS NOT NULL
            AND ($2::text IS NULL OR lower(city) = lower($2::text))`,
        [VettingStatus.APPROVED, forCity],
      );
      return row && Number(row.n) >= MIN_PRICE_SAMPLE && row.low !== null && row.high !== null
        ? { low: roundPrice(Number(row.low)), high: roundPrice(Number(row.high)) }
        : null;
    };

    if (city) {
      const inCity = await band(city);
      if (inCity) return { ...inCity, basis: 'city', city };
    }
    const overall = await band(null);
    if (overall) return { ...overall, basis: 'all', city: null };
    return { ...DEFAULT_PRICE_BAND, basis: 'default', city: null };
  }
}
