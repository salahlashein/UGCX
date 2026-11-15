import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Brand } from './entities/brand.entity';
import {
  Campaign,
  CampaignStatus,
} from '../campaigns/entities/campaign.entity';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import {
  Deliverable,
  DeliverableStatus,
} from '../deliverables/entities/deliverable.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import {
  Proposal,
  ProposalStatus,
} from '../proposals/entities/proposal.entity';
import { BrandsService } from './brands.service';
import { BillingService, BrandMoneyTotals } from './billing.service';
import { centsToAmount, toCents } from '../../common/utils/money';
import type { AppConfig } from '../../config/configuration';

export interface DashboardMonthStats {
  spend: string;
  released: string;
  deliverableCount: number;
  currency: string;
}

export interface DashboardAttentionStats {
  briefsNeedingProposalReview: number;
  deliverablesAwaitingReview: number;
}

export interface DashboardBriefRow {
  id: string;
  title: string;
  meta: string;
  status: CampaignStatus;
  collaborationStatus: CollaborationStatus | null;
  proposalCount: number;
}

export interface DashboardSeriesPoint {
  month: string;      // 'YYYY-MM' in the reporting time zone
  funded: string;     // sum of charge rows (not net of refunds)
  released: string;   // sum of release rows
}

export interface BrandDashboardData {
  brandName: string | null;
  logoUrl: string | null;
  month: DashboardMonthStats;
  attention: DashboardAttentionStats;
  activeBriefs: DashboardBriefRow[];
  activeBriefCount: number;
  series: DashboardSeriesPoint[];
  totals: BrandMoneyTotals;
}

export function normalizeSum(raw: string | null | undefined): string {
  if (!raw || raw === '0') return '0.00';
  return centsToAmount(toCents(raw));
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(Collaboration)
    private readonly collaborationsRepository: Repository<Collaboration>,
    @InjectRepository(Deliverable)
    private readonly deliverablesRepository: Repository<Deliverable>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    private readonly brandsService: BrandsService,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  /**
   * Helper to get start and end of current month in the configured reporting timezone (e.g. Africa/Cairo).
   */
  getMonthBoundsInTimezone(
    now: Date = new Date(),
    timeZone?: string,
  ): { start: Date; end: Date } {
    const tz =
      timeZone ||
      this.configService.get('reportingTimeZone', { infer: true }) ||
      'Africa/Cairo';

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;
    const year = parseInt(getPart('year') || `${now.getFullYear()}`, 10);
    const month = parseInt(getPart('month') || `${now.getMonth() + 1}`, 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startIsoString = `${year}-${pad(month)}-01T00:00:00`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endIsoString = `${nextYear}-${pad(nextMonth)}-01T00:00:00`;

    const tzOffsetStart = this.getTimezoneOffsetMs(startIsoString, tz);
    const tzOffsetEnd = this.getTimezoneOffsetMs(endIsoString, tz);

    const start = new Date(
      new Date(startIsoString + 'Z').getTime() - tzOffsetStart,
    );
    const end = new Date(new Date(endIsoString + 'Z').getTime() - tzOffsetEnd);

    return { start, end };
  }

  getSixMonthKeys(now: Date = new Date(), timeZone?: string): string[] {
    const tz =
      timeZone ||
      this.configService.get('reportingTimeZone', { infer: true }) ||
      'Africa/Cairo';

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;
    const currentYear = parseInt(getPart('year') || `${now.getFullYear()}`, 10);
    const currentMonth = parseInt(getPart('month') || `${now.getMonth() + 1}`, 10);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const result: string[] = [];

    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      result.push(`${y}-${pad(m)}`);
    }

    return result;
  }

  private getTimezoneOffsetMs(isoWithoutTz: string, timeZone: string): number {
    const utcDate = new Date(isoWithoutTz + 'Z');
    const invDate = new Date(utcDate.toLocaleString('en-US', { timeZone }));
    return invDate.getTime() - utcDate.getTime();
  }

  /**
   * TASK-P3-06, TASK-W3-04: GET /api/v1/brands/me/dashboard
   * Aggregates month spend, month released, series, totals, attention count, and active briefs.
   */
  async getDashboard(userId: string): Promise<BrandDashboardData> {
    const brand = await this.brandsService.findByUserId(userId);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const tz =
      this.configService.get('reportingTimeZone', { infer: true }) ||
      'Africa/Cairo';

    const { start: monthStart, end: monthEnd } =
      this.getMonthBoundsInTimezone(new Date(), tz);

    // Query 1: Month spend = sum(charge) - sum(refund), plus month released
    const spendRows = await this.transactionsRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.campaign', 'campaign')
      .leftJoin('tx.collaboration', 'collab')
      .leftJoin('collab.campaign', 'collabCampaign')
      .select('tx.type', 'type')
      .addSelect('SUM(CAST(tx.amount AS numeric))', 'sum')
      .where('(campaign.brand_id = :brandId OR collabCampaign.brand_id = :brandId)', {
        brandId: brand.id,
      })
      .andWhere('tx.status = :txStatus', {
        txStatus: TransactionStatus.COMPLETED,
      })
      .andWhere('tx.created_at >= :monthStart AND tx.created_at < :monthEnd', {
        monthStart,
        monthEnd,
      })
      .andWhere('tx.type IN (:...types)', {
        types: [
          TransactionType.CHARGE,
          TransactionType.REFUND,
          TransactionType.RELEASE,
        ],
      })
      .groupBy('tx.type')
      .getRawMany();

    let chargeCents = 0;
    let refundCents = 0;
    let releasedCents = 0;
    for (const row of spendRows) {
      const cents = toCents(normalizeSum(row.sum));
      if (row.type === TransactionType.CHARGE) {
        chargeCents += cents;
      } else if (row.type === TransactionType.REFUND) {
        refundCents += cents;
      } else if (row.type === TransactionType.RELEASE) {
        releasedCents += cents;
      }
    }
    const netSpendCents = Math.max(0, chargeCents - refundCents);
    const spend = centsToAmount(netSpendCents);
    const released = centsToAmount(releasedCents);

    // Query 2: Month deliverable count = count of approved deliverables on this brand's collabs
    const deliverableCount = await this.deliverablesRepository
      .createQueryBuilder('d')
      .innerJoin('d.collaboration', 'collab')
      .where('collab.brand_id = :brandId', { brandId: brand.id })
      .andWhere('d.status = :status', { status: DeliverableStatus.APPROVED })
      .andWhere('d.created_at >= :monthStart AND d.created_at < :monthEnd', {
        monthStart,
        monthEnd,
      })
      .getCount();

    // Query 3: Attention stats
    const briefsNeedingReviewCount = await this.campaignsRepository
      .createQueryBuilder('c')
      .innerJoin(
        Proposal,
        'p',
        'p.campaign_id = c.id AND p.status = :propStatus',
        { propStatus: ProposalStatus.APPLIED },
      )
      .where('c.brand_id = :brandId', { brandId: brand.id })
      .andWhere('c.status = :campaignStatus', {
        campaignStatus: CampaignStatus.LIVE,
      })
      .select('COUNT(DISTINCT c.id)', 'count')
      .getRawOne();

    const briefsNeedingProposalReview = parseInt(
      briefsNeedingReviewCount?.count || '0',
      10,
    );

    const deliverablesAwaitingReview = await this.collaborationsRepository
      .createQueryBuilder('collab')
      .where('collab.brand_id = :brandId', { brandId: brand.id })
      .andWhere('collab.status = :collabStatus', {
        collabStatus: CollaborationStatus.DELIVERED,
      })
      .getCount();

    // Query 4: Active briefs (status live or paused), ordered by updated_at desc, limit 5 + total count
    const [activeCampaigns, activeBriefCount] = await this.campaignsRepository
      .createQueryBuilder('c')
      .where('c.brand_id = :brandId', { brandId: brand.id })
      .andWhere('c.status IN (:...statuses)', {
        statuses: [CampaignStatus.LIVE, CampaignStatus.PAUSED],
      })
      .orderBy('c.updated_at', 'DESC')
      .take(5)
      .getManyAndCount();

    const activeBriefs: DashboardBriefRow[] = [];
    for (const c of activeCampaigns) {
      const propCount = await this.proposalsRepository.count({
        where: { campaignId: c.id },
      });

      const latestCollab = await this.collaborationsRepository.findOne({
        where: { campaignId: c.id },
        relations: { creator: { user: true } },
        order: { createdAt: 'DESC' },
      });

      let meta = '';
      if (latestCollab) {
        const creatorName = latestCollab.creator?.displayName || 'Creator';
        if (latestCollab.status === CollaborationStatus.FUNDED) {
          meta = `${creatorName} · in escrow`;
        } else if (latestCollab.status === CollaborationStatus.SHIPPED) {
          meta = `${creatorName} · sample sent`;
        } else if (latestCollab.status === CollaborationStatus.DELIVERED) {
          meta = `${creatorName} · awaiting review`;
        } else if (latestCollab.status === CollaborationStatus.APPROVED) {
          meta = `${creatorName} · approved`;
        } else if (
          latestCollab.status === CollaborationStatus.REVISION_REQUESTED
        ) {
          meta = `${creatorName} · revision requested`;
        } else {
          meta = `${creatorName} · ${latestCollab.status}`;
        }
      } else {
        meta = `Open · ${propCount} ${propCount === 1 ? 'proposal' : 'proposals'}`;
      }

      activeBriefs.push({
        id: c.id,
        title: c.title,
        meta,
        status: c.status,
        collaborationStatus: latestCollab ? latestCollab.status : null,
        proposalCount: propCount,
      });
    }

    // Query 5: 6-month series
    const monthKeys = this.getSixMonthKeys(new Date(), tz);
    const seriesQb = this.transactionsRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.campaign', 'campaign')
      .leftJoin('tx.collaboration', 'collab')
      .leftJoin('collab.campaign', 'collabCampaign')
      .select("to_char(tx.createdAt AT TIME ZONE :tz, 'YYYY-MM')", 'month')
      .addSelect('tx.type', 'type')
      .addSelect('SUM(CAST(tx.amount AS numeric))', 'sum')
      .where('(campaign.brand_id = :brandId OR collabCampaign.brand_id = :brandId)', {
        brandId: brand.id,
      })
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .andWhere('tx.type IN (:...types)', {
        types: [TransactionType.CHARGE, TransactionType.RELEASE],
      })
      .groupBy("to_char(tx.createdAt AT TIME ZONE :tz, 'YYYY-MM')")
      .addGroupBy('tx.type')
      .setParameter('tz', tz);

    const rawSeries = await seriesQb.getRawMany();

    const seriesMap = new Map<
      string,
      { fundedCents: number; releasedCents: number }
    >();
    for (const k of monthKeys) {
      seriesMap.set(k, { fundedCents: 0, releasedCents: 0 });
    }

    for (const row of rawSeries) {
      const entry = seriesMap.get(row.month);
      if (entry) {
        const cents = toCents(normalizeSum(row.sum));
        if (row.type === TransactionType.CHARGE) {
          entry.fundedCents += cents;
        } else if (row.type === TransactionType.RELEASE) {
          entry.releasedCents += cents;
        }
      }
    }

    const series: DashboardSeriesPoint[] = monthKeys.map((k) => {
      const entry = seriesMap.get(k)!;
      return {
        month: k,
        funded: centsToAmount(entry.fundedCents),
        released: centsToAmount(entry.releasedCents),
      };
    });

    // Query 6: Totals from billing service
    const totals = await this.billingService.getTotals(brand.id);

    return {
      brandName: brand.companyName,
      logoUrl: brand.logoUrl,
      month: {
        spend,
        released,
        deliverableCount,
        currency: 'EGP',
      },
      attention: {
        briefsNeedingProposalReview,
        deliverablesAwaitingReview,
      },
      activeBriefs,
      activeBriefCount,
      series,
      totals,
    };
  }
}
