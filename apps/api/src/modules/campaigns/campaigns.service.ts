import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { ListBriefQueryDto } from './dto/list-brief-query.dto';
import { BrandsService } from '../brands/brands.service';
import { ProductsService } from '../products/products.service';
import { User, UserRole } from '../users/entities/user.entity';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { EscrowService } from '../escrow/escrow.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymobClient } from '../payments/paymob.client';
import { encodeMerchantOrderId } from '../payments/merchant-order-id';
import { centsToAmount, toCents } from '../../common/utils/money';
import { usesMockPayments } from '../../common/utils/mock-payments';
import { PaymentProviderError } from '../payments/payment-provider.error';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { ManualEscrowPaymentDto } from './dto/manual-escrow-payment.dto';
import { CloseBriefDto } from './dto/close-brief.dto';
import { ProposalsService } from '../proposals/proposals.service';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface BriefListItem extends Campaign {
  proposalCount: number;
  acceptedCreatorName: string | null;
  collaborationStatus: string | null;
  appliedCount: number;
  shortlistedCount: number;
  totalProposals: number;
  lowestPrice: string | null;
  hiredCount: number;
  hired: Array<{
    creatorId: string;
    displayName: string | null;
    initials: string;
  }>;
  fundedAt: string | null;
}

export interface BriefCounts {
  all: number;
  draft: number;
  open: number;
  completed: number;
}

/** Columns a creator may read from the joined brand and product of a campaign. */
const PUBLIC_BRAND_COLUMNS_ON_CAMPAIGN = [
  'brand.id',
  'brand.companyName',
  'brand.logoUrl',
  'brand.country',
  'product.id',
  'product.name',
];

export function toCreatorView(campaign: Campaign): Campaign {
  const allowList: (keyof Campaign)[] = [
    'id',
    'brandId',
    'brand',
    'title',
    'productId',
    'product',
    'brief',
    'budgetMin',
    'budgetMax',
    'currency',
    'publishedAt',
    'closesAt',
    'status',
    'niche',
    'language',
    'videoType',
    'durationSeconds',
    'scriptMode',
    'script',
    'talkingPoints',
    'doNotSay',
    'needsShipping',
    'slots',
    'revisionLimit',
    'proposalCount',
    'createdAt',
    'updatedAt',
  ];

  const view: Record<string, unknown> = {};
  for (const key of allowList) {
    if (key in campaign) {
      view[key] = campaign[key];
    }
  }
  return view as unknown as Campaign;
}

function computeInitials(
  displayName: string | null,
  email: string | null,
): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const user = email.split('@')[0];
    return user.slice(0, 2).toUpperCase();
  }
  return 'CR';
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly brandsService: BrandsService,
    private readonly productsService: ProductsService,
    private readonly escrowService: EscrowService,
    private readonly transactionsService: TransactionsService,
    @Inject(forwardRef(() => PaymobClient))
    private readonly paymobClient: PaymobClient,
    @Inject(forwardRef(() => ProposalsService))
    private readonly proposalsService: ProposalsService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** REQ-005 & REQ-104: draft status, requires phone or email verification. Product is optional. */
  async create(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || (!user.phoneVerifiedAt && !user.emailVerifiedAt)) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'phone_not_verified',
        'Verify your phone or email before creating a campaign',
      );
    }

    const brand = await this.brandsService.findByUserId(userId);

    let productId: string | null = null;
    if (dto.productId) {
      const product = await this.productsService.findByIdAndBrandId(
        dto.productId,
        brand.id,
      );
      productId = product.id;
    }

    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMax < dto.budgetMin
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
        'Maximum budget cannot be less than minimum budget',
        [
          {
            field: 'budgetMax',
            message: 'Maximum budget cannot be less than minimum budget',
          },
        ],
      );
    }

    const {
      title,
      productId: _productId,
      budgetMin,
      budgetMax,
      closesAt,
      ...rest
    } = dto;

    const campaign = this.campaignsRepository.create({
      brandId: brand.id,
      productId,
      title: title ?? 'Untitled brief',
      status: CampaignStatus.DRAFT,
      ...rest,
    });

    if (budgetMin !== undefined) {
      campaign.budgetMin = budgetMin.toFixed(2);
    }
    if (budgetMax !== undefined) {
      campaign.budgetMax = budgetMax.toFixed(2);
    }
    if (closesAt !== undefined) {
      campaign.closesAt = new Date(closesAt);
    }

    return this.campaignsRepository.save(campaign);
  }

  async listMine(
    userId: string,
    query: ListBriefQueryDto,
  ): Promise<{ items: BriefListItem[]; total: number; counts: BriefCounts }> {
    const brand = await this.brandsService.findByUserId(userId);
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const countsRaw = await this.dataSource.query(
      `
      SELECT
        COUNT(*)::int AS "all",
        COUNT(*) FILTER (WHERE status = 'draft')::int AS "draft",
        COUNT(*) FILTER (WHERE status IN ('live', 'paused'))::int AS "open",
        COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled'))::int AS "completed"
      FROM campaigns
      WHERE brand_id = $1
    `,
      [brand.id],
    );

    const counts: BriefCounts = {
      all: countsRaw[0]?.all ?? 0,
      draft: countsRaw[0]?.draft ?? 0,
      open: countsRaw[0]?.open ?? 0,
      completed: countsRaw[0]?.completed ?? 0,
    };

    const qb = this.campaignsRepository
      .createQueryBuilder('campaign')
      .where('campaign.brandId = :brandId', { brandId: brand.id });

    if (query.status === 'draft') {
      qb.andWhere('campaign.status = :status', {
        status: CampaignStatus.DRAFT,
      });
    } else if (query.status === 'open') {
      qb.andWhere('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.LIVE, CampaignStatus.PAUSED],
      });
    } else if (query.status === 'completed') {
      qb.andWhere('campaign.status IN (:...statuses)', {
        statuses: [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
      });
    }

    if (query.q && query.q.trim().length > 0) {
      const trimmed = query.q.trim();
      const escaped = trimmed.replace(/[%_\\]/g, '\\$&');
      qb.andWhere('campaign.title ILIKE :q', { q: `%${escaped}%` });
    }

    qb.orderBy('campaign.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [campaigns, total] = await qb.getManyAndCount();

    if (campaigns.length === 0) {
      return { items: [], total, counts };
    }

    const campaignIds = campaigns.map((c) => c.id);

    const proposalsRaw: {
      campaign_id: string;
      appliedCount: string;
      shortlistedCount: string;
      totalProposals: string;
      lowestPrice: string | null;
    }[] = await this.dataSource.query(
      `SELECT
         campaign_id,
         COUNT(*) FILTER (WHERE status = 'applied')::int AS "appliedCount",
         COUNT(*) FILTER (WHERE status = 'shortlisted')::int AS "shortlistedCount",
         COUNT(*)::int AS "totalProposals",
         MIN(price) FILTER (WHERE status IN ('applied', 'shortlisted')) AS "lowestPrice"
       FROM proposals
       WHERE campaign_id = ANY($1)
       GROUP BY campaign_id`,
      [campaignIds],
    );

    const proposalStatsMap = new Map<
      string,
      {
        appliedCount: number;
        shortlistedCount: number;
        totalProposals: number;
        lowestPrice: string | null;
      }
    >();
    for (const row of proposalsRaw) {
      proposalStatsMap.set(row.campaign_id, {
        appliedCount: Number(row.appliedCount ?? 0),
        shortlistedCount: Number(row.shortlistedCount ?? 0),
        totalProposals: Number(row.totalProposals ?? 0),
        lowestPrice:
          row.lowestPrice != null
            ? centsToAmount(toCents(row.lowestPrice))
            : null,
      });
    }

    const collaborationsRaw: {
      campaign_id: string;
      status: string;
      creator_id: string;
      display_name: string | null;
      email: string | null;
    }[] = await this.dataSource.query(
      `SELECT col.campaign_id, col.status, col.creator_id, cr.display_name, u.email
       FROM collaborations col
       LEFT JOIN creators cr ON cr.id = col.creator_id
       LEFT JOIN users u ON u.id = cr.user_id
       WHERE col.campaign_id = ANY($1)
       ORDER BY col.created_at DESC`,
      [campaignIds],
    );

    const collaborationMap = new Map<
      string,
      { status: string; creatorName: string | null }
    >();
    const hiredMap = new Map<
      string,
      {
        count: number;
        list: Array<{
          creatorId: string;
          displayName: string | null;
          initials: string;
        }>;
      }
    >();

    for (const row of collaborationsRaw) {
      if (!collaborationMap.has(row.campaign_id)) {
        collaborationMap.set(row.campaign_id, {
          status: row.status,
          creatorName:
            row.display_name ?? (row.email ? row.email.split('@')[0] : null),
        });
      }

      if (row.status !== 'cancelled' && row.status !== 'payment_failed') {
        let entry = hiredMap.get(row.campaign_id);
        if (!entry) {
          entry = { count: 0, list: [] };
          hiredMap.set(row.campaign_id, entry);
        }
        entry.count++;
        if (entry.list.length < 4) {
          entry.list.push({
            creatorId: row.creator_id,
            displayName:
              row.display_name ?? (row.email ? row.email.split('@')[0] : null),
            initials: computeInitials(row.display_name, row.email),
          });
        }
      }
    }

    const fundedRaw: { campaign_id: string; funded_at: string | null }[] =
      await this.dataSource.query(
        `SELECT campaign_id, MIN(created_at) AS funded_at
         FROM transactions
         WHERE campaign_id = ANY($1) AND type = 'charge' AND status = 'completed'
         GROUP BY campaign_id`,
        [campaignIds],
      );
    const fundedMap = new Map<string, string | null>();
    for (const row of fundedRaw) {
      fundedMap.set(
        row.campaign_id,
        row.funded_at ? new Date(row.funded_at).toISOString() : null,
      );
    }

    const items: BriefListItem[] = campaigns.map((c) => {
      const col = collaborationMap.get(c.id);
      const stats = proposalStatsMap.get(c.id);
      const hired = hiredMap.get(c.id);
      const appliedCount = stats?.appliedCount ?? 0;
      const shortlistedCount = stats?.shortlistedCount ?? 0;
      const totalProposals = stats?.totalProposals ?? 0;
      const proposalCount = appliedCount + shortlistedCount;

      return {
        ...c,
        proposalCount,
        appliedCount,
        shortlistedCount,
        totalProposals,
        lowestPrice: stats?.lowestPrice ?? null,
        hiredCount: hired?.count ?? 0,
        hired: hired?.list ?? [],
        fundedAt: fundedMap.get(c.id) ?? null,
        acceptedCreatorName: col?.creatorName ?? null,
        collaborationStatus: col?.status ?? null,
      } as unknown as BriefListItem;
    });

    return { items, total, counts };
  }

  /** REQ-007, TASK-W4-05: only live campaigns, optionally filtered by niche/country/language/minBudget/maxBudget/q/duration/shipping/sort. */
  async listLive(
    query: QueryCampaignDto,
  ): Promise<
    [Campaign[], number, { niches: { value: string; count: number }[] }]
  > {
    if (query.sort === 'match') {
      throw new BadRequestException('sort=match is not supported');
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const applyCommonFilters = (qb: SelectQueryBuilder<Campaign>) => {
      qb.where('campaign.status = :status', { status: CampaignStatus.LIVE });

      if (query.q && query.q.trim().length > 0) {
        const trimmed = query.q.trim();
        const escaped = trimmed.replace(/[%_\\]/g, '\\$&');
        qb.andWhere('(campaign.title ILIKE :q OR brand.companyName ILIKE :q)', {
          q: `%${escaped}%`,
        });
      }

      if (query.language) {
        qb.andWhere('campaign.language = :language', {
          language: query.language,
        });
      }
      if (query.country) {
        qb.andWhere('brand.country = :country', { country: query.country });
      }
      if (query.minBudget !== undefined) {
        qb.andWhere('campaign.budget_max >= :minBudget', {
          minBudget: query.minBudget,
        });
      }
      if (query.maxBudget !== undefined) {
        qb.andWhere('campaign.budget_min <= :maxBudget', {
          maxBudget: query.maxBudget,
        });
      }
      if (query.minDuration !== undefined) {
        qb.andWhere('campaign.durationSeconds >= :minDuration', {
          minDuration: query.minDuration,
        });
      }
      if (query.maxDuration !== undefined) {
        qb.andWhere('campaign.durationSeconds <= :maxDuration', {
          maxDuration: query.maxDuration,
        });
      }
      if (query.needsShipping !== undefined) {
        qb.andWhere('campaign.needsShipping = :needsShipping', {
          needsShipping: query.needsShipping,
        });
      }
    };

    // 1. Niche facets query (ignoring niche filter, DEC-W406)
    let niches: { value: string; count: number }[] = [];
    const facetQb = this.campaignsRepository.createQueryBuilder('campaign');
    if (
      typeof facetQb.select === 'function' &&
      typeof facetQb.groupBy === 'function'
    ) {
      facetQb
        .leftJoin('campaign.brand', 'brand')
        .select('campaign.niche', 'value')
        .addSelect('COUNT(*)::int', 'count');
      applyCommonFilters(facetQb);
      facetQb.andWhere('campaign.niche IS NOT NULL').groupBy('campaign.niche');

      try {
        const facetRows = await facetQb.getRawMany();
        niches = facetRows.map((r) => ({
          value: r.value,
          count: typeof r.count === 'number' ? r.count : parseInt(r.count, 10),
        }));
      } catch {
        niches = [];
      }
    }

    // 2. Main query
    const qb = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.brand', 'brand')
      .leftJoin('campaign.product', 'product')
      // Creators see who is hiring, never the brand's private fields.
      .addSelect(PUBLIC_BRAND_COLUMNS_ON_CAMPAIGN);
    applyCommonFilters(qb);

    if (query.niche) {
      const nicheList = query.niche
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);
      if (nicheList.length === 1) {
        qb.andWhere('campaign.niche = :niche', { niche: nicheList[0] });
      } else if (nicheList.length > 1) {
        qb.andWhere('campaign.niche IN (:...niches)', { niches: nicheList });
      }
    }

    if (query.sort === 'budget') {
      qb.orderBy('campaign.budgetMax', 'DESC');
    } else if (query.sort === 'closing') {
      qb.orderBy('campaign.closesAt', 'ASC', 'NULLS LAST');
    } else {
      qb.orderBy('campaign.createdAt', 'DESC');
    }

    qb.skip((page - 1) * perPage).take(perPage);

    const [campaigns, total] = await qb.getManyAndCount();

    if (campaigns.length === 0) {
      return [[], total, { niches }];
    }

    const campaignIds = campaigns.map((c) => c.id);
    const proposalCountMap = new Map<string, number>();
    try {
      const propCounts: { campaign_id: string; count: string }[] =
        await this.dataSource.query(
          `SELECT campaign_id, COUNT(*)::int AS count FROM proposals
           WHERE campaign_id = ANY($1) AND status != 'declined'
           GROUP BY campaign_id`,
          [campaignIds],
        );
      for (const row of propCounts) {
        proposalCountMap.set(row.campaign_id, Number(row.count));
      }
    } catch {
      // fallback
    }

    const items = campaigns.map((c) => {
      const creatorView = toCreatorView(c);
      creatorView.proposalCount = proposalCountMap.get(c.id) ?? 0;
      return creatorView;
    });

    return [items, total, { niches }];
  }

  /**
   * A brand sees its own campaign at any status; a creator (or admin) only
   * sees it once live. Cross-tenant or not-yet-live reads are 404, never
   * 403 (EDGE-P1-002).
   */
  async findOne(user: AuthUser, id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (user.role === UserRole.BRAND) {
      const brand = await this.brandsService.findByUserId(user.userId);
      if (campaign.brandId !== brand.id) {
        throw new NotFoundException('Campaign not found');
      }
      const charge = await this.dataSource.query(
        `SELECT MIN(created_at) AS funded_at FROM transactions
         WHERE campaign_id = $1 AND type = 'charge' AND status = 'completed'`,
        [campaign.id],
      );
      campaign.fundedAt = charge[0]?.funded_at
        ? new Date(charge[0].funded_at).toISOString()
        : null;
      return campaign;
    }

    if (campaign.status !== CampaignStatus.LIVE) {
      throw new NotFoundException('Campaign not found');
    }

    // Add the public brand and product names for the creator view.
    const withNames = await this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.brand', 'brand')
      .leftJoin('campaign.product', 'product')
      .addSelect(PUBLIC_BRAND_COLUMNS_ON_CAMPAIGN)
      .where('campaign.id = :id', { id })
      .getOne();
    return toCreatorView(withNames ?? campaign);
  }

  async findOwned(userId: string, id: string): Promise<Campaign> {
    const brand = await this.brandsService.findByUserId(userId);
    const campaign = await this.campaignsRepository.findOne({
      where: { id, brandId: brand.id },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  /** Existence lookup by id only, used by ProposalsService's own status check. */
  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Cannot edit a completed or cancelled campaign',
      );
    }

    const min =
      dto.budgetMin !== undefined
        ? dto.budgetMin
        : campaign.budgetMin !== null
          ? Number(campaign.budgetMin)
          : undefined;

    const max =
      dto.budgetMax !== undefined
        ? dto.budgetMax
        : campaign.budgetMax !== null
          ? Number(campaign.budgetMax)
          : undefined;

    if (min !== undefined && max !== undefined && max < min) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
        'Maximum budget cannot be less than minimum budget',
        [
          {
            field: 'budgetMax',
            message: 'Maximum budget cannot be less than minimum budget',
          },
        ],
      );
    }

    const { budgetMin, budgetMax, closesAt, ...rest } = dto;
    Object.assign(campaign, rest);

    if (budgetMin !== undefined) {
      campaign.budgetMin = budgetMin.toFixed(2);
    }
    if (budgetMax !== undefined) {
      campaign.budgetMax = budgetMax.toFixed(2);
    }
    if (closesAt !== undefined) {
      campaign.closesAt = new Date(closesAt);
    }

    return this.campaignsRepository.save(campaign);
  }

  /** REQ-006, REQ-402: rejects the draft-to-live transition unless all required fields are set. Records brief_published. */
  async publish(userId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);
    const missing = campaign.missingPublishFields();
    if (missing.length > 0) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
        'Campaign is missing required fields',
        missing,
      );
    }

    campaign.status = CampaignStatus.LIVE;
    campaign.publishedAt = new Date();
    if (!campaign.closesAt) {
      const openDays =
        this.configService.get<number>('campaignDefaultOpenDays') ?? 14;
      campaign.closesAt = new Date(Date.now() + openDays * 24 * 60 * 60 * 1000);
    }

    const { saved, notifications } = await this.dataSource.transaction(
      async (manager) => {
        const repo = manager.getRepository(Campaign);
        const savedCampaign = await repo.save(campaign);

        const notifs = await this.notificationsService.record(
          {
            event: 'brief_published',
            params: { title: savedCampaign.title },
            brandId: savedCampaign.brandId,
            campaignId: savedCampaign.id,
            deepLinkByRole: {
              brand: { stack: 'BriefsTab', screen: 'MyBriefs' },
            },
          },
          manager,
        );

        return { saved: savedCampaign, notifications: notifs };
      },
    );

    // GUD-401, REQ-403: push outside the transaction
    await this.notificationsService.push(notifications);

    this.logger.log(`Campaign ${saved.id} published`);
    return saved;
  }

  async pause(userId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);
    if (campaign.status === CampaignStatus.PAUSED) {
      return campaign;
    }
    if (!campaign.canPause()) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Only live briefs can be paused',
      );
    }
    campaign.status = CampaignStatus.PAUSED;
    return this.campaignsRepository.save(campaign);
  }

  async resume(userId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOwned(userId, id);
    if (campaign.status === CampaignStatus.LIVE) {
      return campaign;
    }
    if (!campaign.canResume()) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Only paused briefs can be resumed',
      );
    }
    campaign.status = CampaignStatus.LIVE;
    return this.campaignsRepository.save(campaign);
  }

  /**
   * REQ-205, REQ-206, EDGE-P2-203, EDGE-P2-204, EDGE-P2-205.
   * Processes signed Paymob webhooks for campaign escrow funding.
   */
  async applyEscrowWebhook(params: {
    paymobOrderId: string;
    paymobTransactionId: string;
    success: boolean;
    amountCents: number;
    currency: string;
    isRefunded: boolean;
    isVoided: boolean;
    pending: boolean;
    errorOccured: boolean;
    paymentMethodLabel?: string | null;
  }): Promise<void> {
    const {
      paymobOrderId,
      paymobTransactionId,
      success,
      amountCents,
      currency,
      isRefunded,
      isVoided,
      pending,
      errorOccured,
      paymentMethodLabel,
    } = params;

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Campaign);
      const campaign = await repository.findOne({
        where: { fundingPaymobOrderId: paymobOrderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!campaign) {
        this.logger.warn(
          `Ignoring webhook for unknown funding order ${paymobOrderId}`,
        );
        return;
      }

      if (!success) {
        campaign.fundingPaymobOrderId = null;
        campaign.fundingRequestedAmount = null;
        await repository.save(campaign);
        this.logger.log(`Campaign ${campaign.id} funding failed`);
        return;
      }

      const existing = await this.transactionsService.findByPaymobReference(
        paymobTransactionId,
        manager,
      );
      if (existing) {
        this.logger.log(
          `Ignoring replayed webhook for paymob transaction ${paymobTransactionId}`,
        );
        return;
      }

      if (isRefunded || isVoided || pending || errorOccured) {
        this.logger.warn(
          `Ignoring success webhook for campaign ${campaign.id}: ` +
            `isRefunded=${isRefunded} isVoided=${isVoided} pending=${pending} errorOccured=${errorOccured}`,
        );
        return;
      }

      const expectedAmountCents = campaign.fundingRequestedAmount
        ? toCents(campaign.fundingRequestedAmount)
        : 0;

      if (
        amountCents !== expectedAmountCents ||
        currency !== campaign.currency
      ) {
        this.logger.warn(
          `Ignoring success webhook for campaign ${campaign.id}: ` +
            `amount/currency mismatch (expected ${expectedAmountCents} ${campaign.currency}, got ${amountCents} ${currency})`,
        );
        return;
      }

      try {
        await this.escrowService.applyFunding(
          campaign.id,
          campaign.fundingRequestedAmount!,
          currency,
          paymobTransactionId,
          manager,
          paymentMethodLabel,
        );
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          this.logger.log(
            `Ignoring concurrently-replayed webhook for paymob transaction ${paymobTransactionId}`,
          );
          return;
        }
        throw error;
      }

      // Update only the two funding columns. `campaign` was read before
      // applyFunding raised escrow_funded_amount, so save(campaign) would
      // write the old balance back and the paid escrow would read 0.00.
      await repository.update(campaign.id, {
        fundingPaymobOrderId: null,
        fundingRequestedAmount: null,
      });
      this.logger.log(`Campaign ${campaign.id} escrow funded`);
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    );
  }

  /**
   * REQ-201, REQ-202, REQ-203, GUD-201.
   * Registers a Paymob checkout to fund the campaign escrow.
   */
  async fundEscrow(
    userId: string,
    id: string,
    dto: FundEscrowDto,
  ): Promise<{
    campaignId: string;
    amount: string;
    currency: string;
    checkoutUrl: string;
    paymobOrderId: string;
  }> {
    const campaign = await this.findOwned(userId, id);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Cannot fund escrow for a completed or cancelled brief',
      );
    }

    if (!campaign.budgetMin || !campaign.budgetMax) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'budget_not_set',
        'Campaign budget range must be set before funding escrow',
      );
    }

    const slots = campaign.slots ?? 1;
    const minCents = toCents(campaign.budgetMin);
    const maxCents = toCents(campaign.budgetMax) * slots;

    let amountCents: number;
    if (dto.amount !== undefined && dto.amount !== null) {
      amountCents = toCents(dto.amount.toFixed(2));
      if (amountCents < minCents || amountCents > maxCents) {
        throw new DomainErrorException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'validation_error',
          `Funding amount must be between ${centsToAmount(minCents)} and ${centsToAmount(maxCents)}`,
          [
            {
              field: 'amount',
              message: `Amount must be between ${centsToAmount(minCents)} and ${centsToAmount(maxCents)}`,
            },
          ],
        );
      }
    } else {
      // Default: midpoint of single-slot budget range rounded to nearest whole unit, times slots
      const singleMin = toCents(campaign.budgetMin);
      const singleMax = toCents(campaign.budgetMax);
      amountCents = Math.round((singleMin + singleMax) / 2 / 100) * 100 * slots;
    }

    if (campaign.fundingPaymobOrderId) {
      throw new DomainErrorException(
        HttpStatus.CONFLICT,
        'funding_in_progress',
        'A funding checkout is already in progress for this campaign',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const amountStr = centsToAmount(amountCents);

    // Step 4: write funding_requested_amount
    campaign.fundingRequestedAmount = amountStr;
    campaign.fundingPaymobOrderId = null;
    await this.campaignsRepository.save(campaign);

    if (!usesMockPayments()) {
      let checkout;
      try {
        const merchantOrderId = encodeMerchantOrderId(
          'campaign_escrow',
          campaign.id,
        );
        checkout = await this.paymobClient.createCheckout(
          amountCents,
          merchantOrderId,
          {
            firstName: user?.email ? user.email.split('@')[0] : 'BrandUser',
            lastName: 'Brand',
            email: user?.email || 'billing@ugcx.com',
            phoneNumber: user?.phone || '',
          },
        );
      } catch (error) {
        campaign.fundingRequestedAmount = null;
        await this.campaignsRepository.save(campaign);

        if (error instanceof PaymentProviderError) {
          throw new DomainErrorException(
            HttpStatus.BAD_GATEWAY,
            'payment_provider_error',
            'Payment provider is unavailable, please try again',
          );
        }
        throw error;
      }

      campaign.fundingPaymobOrderId = checkout.paymobOrderId;
      await this.campaignsRepository.save(campaign);

      return {
        campaignId: campaign.id,
        amount: amountStr,
        currency: campaign.currency,
        checkoutUrl: checkout.checkoutUrl,
        paymobOrderId: checkout.paymobOrderId,
      };
    }

    // Local development only: mark the payment complete without a card charge.
    const mockTxId = `mock_paymob_${Date.now()}`;
    await this.dataSource.transaction(async (manager) => {
      await this.escrowService.applyFunding(
        campaign.id,
        amountStr,
        campaign.currency,
        mockTxId,
        manager,
        'Mock Card •• 4471',
      );
      await manager.getRepository(Campaign).update(campaign.id, {
        fundingPaymobOrderId: null,
        fundingRequestedAmount: null,
      });
    });

    return {
      campaignId: campaign.id,
      amount: amountStr,
      currency: campaign.currency,
      checkoutUrl: 'ugcx://payment-complete',
      paymobOrderId: `mock_order_${Date.now()}`,
    };
  }

  /**
   * Manual escrow funding submission for InstaPay and Vodafone Cash.
   */
  async submitManualPayment(
    userId: string,
    id: string,
    dto: ManualEscrowPaymentDto,
  ): Promise<{
    success: boolean;
    message: string;
    campaignId: string;
  }> {
    const campaign = await this.findOwned(userId, id);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Cannot fund escrow for a completed or cancelled brief',
      );
    }

    const amountStr = Number(dto.amount).toFixed(2);
    const reference = `manual:${dto.method}:${dto.transactionReference}`;

    // One transfer funds one brief. A reference that already funded a
    // brief, or waits on another brief, is refused with a clear error.
    const duplicate = new DomainErrorException(
      HttpStatus.CONFLICT,
      'duplicate_transaction_reference',
      'This transaction reference was already submitted. Check the reference and try again.',
    );
    if (await this.transactionsService.findByPaymobReference(reference)) {
      throw duplicate;
    }

    campaign.fundingRequestedAmount = amountStr;
    campaign.fundingPaymobOrderId = reference;
    try {
      await this.campaignsRepository.save(campaign);
    } catch (error) {
      // uq_campaigns_funding_order: another brief waits on this reference.
      if (this.isUniqueViolation(error)) throw duplicate;
      throw error;
    }

    return {
      success: true,
      message:
        'Manual payment submitted. Platform admin will verify and activate your brief.',
      campaignId: campaign.id,
    };
  }

  /**
   * REQ-208, DES-P2-206.
   * Registers a Paymob checkout to top up campaign escrow when short.
   */
  async topUpEscrow(
    userId: string,
    id: string,
    dto: { amount: number; method?: 'card' | 'bank_transfer' },
  ): Promise<{
    campaignId: string;
    amount: string;
    currency: string;
    checkoutUrl: string;
    paymobOrderId: string;
  }> {
    const campaign = await this.findOwned(userId, id);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Cannot top up escrow for a completed or cancelled brief',
      );
    }

    const amountCents = Math.round(dto.amount * 100);
    if (amountCents <= 0) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
        'Top up amount must be positive',
        [{ field: 'amount', message: 'Amount must be greater than 0' }],
      );
    }

    if (campaign.fundingPaymobOrderId) {
      throw new DomainErrorException(
        HttpStatus.CONFLICT,
        'funding_in_progress',
        'A funding checkout is already in progress for this campaign',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const amountStr = centsToAmount(amountCents);

    campaign.fundingRequestedAmount = amountStr;
    campaign.fundingPaymobOrderId = null;
    await this.campaignsRepository.save(campaign);

    if (!usesMockPayments()) {
      let checkout;
      try {
        const merchantOrderId = encodeMerchantOrderId(
          'campaign_escrow',
          campaign.id,
        );
        checkout = await this.paymobClient.createCheckout(
          amountCents,
          merchantOrderId,
          {
            firstName: user?.email ? user.email.split('@')[0] : 'BrandUser',
            lastName: 'Brand',
            email: user?.email || 'billing@ugcx.com',
            phoneNumber: user?.phone || '',
          },
        );
      } catch (error) {
        campaign.fundingRequestedAmount = null;
        await this.campaignsRepository.save(campaign);

        if (error instanceof PaymentProviderError) {
          throw new DomainErrorException(
            HttpStatus.BAD_GATEWAY,
            'payment_provider_error',
            'Payment provider is unavailable, please try again',
          );
        }
        throw error;
      }

      campaign.fundingPaymobOrderId = checkout.paymobOrderId;
      await this.campaignsRepository.save(campaign);

      return {
        campaignId: campaign.id,
        amount: amountStr,
        currency: campaign.currency,
        checkoutUrl: checkout.checkoutUrl,
        paymobOrderId: checkout.paymobOrderId,
      };
    }

    const mockTxId = `mock_paymob_${Date.now()}`;
    await this.dataSource.transaction(async (manager) => {
      await this.escrowService.applyFunding(
        campaign.id,
        amountStr,
        campaign.currency,
        mockTxId,
        manager,
        'Mock Card •• 4471',
      );
      await manager.getRepository(Campaign).update(campaign.id, {
        fundingPaymobOrderId: null,
        fundingRequestedAmount: null,
      });
    });

    return {
      campaignId: campaign.id,
      amount: amountStr,
      currency: campaign.currency,
      checkoutUrl: 'ugcx://payment-complete',
      paymobOrderId: `mock_order_${Date.now()}`,
    };
  }

  /**
   * Reads the current campaign escrow balance.
   */
  async getEscrowBalance(userId: string, id: string) {
    const campaign = await this.findOwned(userId, id);
    return this.escrowService.getBalance(campaign.id);
  }

  /**
   * REQ-210, REQ-211, EDGE-P2-206, EDGE-P2-207.
   * Closes a campaign early, declines open proposals, and refunds available escrow.
   */
  async close(
    userId: string,
    id: string,
    dto: CloseBriefDto,
  ): Promise<{
    campaignId: string;
    status: CampaignStatus;
    refundedAmount: string;
    refundPending: boolean;
    declinedProposalCount: number;
  }> {
    // Step 1: Transaction A - lock campaign, check state, check in-flight collabs, cancel, decline proposals
    const { availableCents, currency, declinedProposalCount } =
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Campaign);
        const campaign = await repo.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!campaign) {
          throw new NotFoundException('Campaign not found');
        }

        const brand = await this.brandsService.findByUserId(userId);
        if (campaign.brandId !== brand.id) {
          throw new NotFoundException('Campaign not found');
        }

        if (
          campaign.status !== CampaignStatus.LIVE &&
          campaign.status !== CampaignStatus.PAUSED
        ) {
          throw new DomainErrorException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'invalid_state_transition',
            'Only live or paused briefs can be closed early',
          );
        }

        // Check for in-flight collaborations between funded and revision_requested
        const inFlightCount = await manager
          .getRepository(Collaboration)
          .createQueryBuilder('collab')
          .where('collab.campaign_id = :campaignId', { campaignId: id })
          .andWhere('collab.status IN (:...statuses)', {
            statuses: [
              CollaborationStatus.FUNDED,
              CollaborationStatus.SHIPPED,
              CollaborationStatus.DELIVERED,
              CollaborationStatus.REVISION_REQUESTED,
            ],
          })
          .getCount();

        if (inFlightCount > 0) {
          throw new DomainErrorException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'collaboration_in_flight',
            'Cannot close brief while collaborations are in flight',
          );
        }

        campaign.status = CampaignStatus.CANCELLED;
        await repo.save(campaign);

        const declineReason = dto?.reason || 'brief_closed';
        const declinedCount =
          await this.proposalsService.declineAllOpenForCampaign(
            campaign.id,
            declineReason,
            manager,
          );

        return {
          availableCents: campaign.availableEscrowCents(),
          currency: campaign.currency,
          declinedProposalCount: declinedCount,
        };
      });

    // Step 2: If available escrow is zero, return immediately
    if (availableCents === 0) {
      return {
        campaignId: id,
        status: CampaignStatus.CANCELLED,
        refundedAmount: '0.00',
        refundPending: false,
        declinedProposalCount,
      };
    }

    // Step 3: Outside transaction, find latest charge and call Paymob refund
    const latestCharge =
      await this.transactionsService.findLatestChargeForCampaign(id);

    if (!latestCharge || !latestCharge.paymobReference) {
      this.logger.error(
        `OPERATOR ALERT: Cannot refund campaign ${id}: no valid charge transaction with paymobReference found`,
      );
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Campaign)
          .update(id, { refundPending: true });
      });
      return {
        campaignId: id,
        status: CampaignStatus.CANCELLED,
        refundedAmount: '0.00',
        refundPending: true,
        declinedProposalCount,
      };
    }

    let refundResult: { paymobRefundTransactionId: string } | null = null;
    try {
      refundResult = await this.paymobClient.refundTransaction(
        latestCharge.paymobReference,
        availableCents,
      );
    } catch (error) {
      this.logger.error(
        `OPERATOR ALERT: Paymob refund failed for campaign ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Campaign)
          .update(id, { refundPending: true });
      });
      return {
        campaignId: id,
        status: CampaignStatus.CANCELLED,
        refundedAmount: '0.00',
        refundPending: true,
        declinedProposalCount,
      };
    }

    // Step 4: On success, open transaction B and apply refund
    const refundAmountStr = centsToAmount(availableCents);
    await this.dataSource.transaction(async (manager) => {
      await this.escrowService.applyRefund(
        id,
        refundAmountStr,
        currency,
        refundResult!.paymobRefundTransactionId,
        latestCharge.id,
        manager,
      );
    });

    return {
      campaignId: id,
      status: CampaignStatus.CANCELLED,
      refundedAmount: refundAmountStr,
      refundPending: false,
      declinedProposalCount,
    };
  }

  /**
   * REQ-312, TASK-P3-05: sets the brief to completed when every slot is done. Runs
   * inside the approval transaction, so a partial state never exists.
   * Lock order: review transaction locks collaboration first, then campaign here.
   * Returns the resulting status so the review response can report it.
   */
  async completeIfAllSlotsDone(
    campaignId: string,
    manager: import('typeorm').EntityManager,
  ): Promise<CampaignStatus> {
    const campaignRepo = manager.getRepository(Campaign);
    const campaign = await campaignRepo.findOne({
      where: { id: campaignId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (
      campaign.status !== CampaignStatus.LIVE &&
      campaign.status !== CampaignStatus.PAUSED
    ) {
      return campaign.status;
    }

    const collabRepo = manager.getRepository(Collaboration);
    const doneCollabsCount = await collabRepo.count({
      where: [
        { campaignId, status: CollaborationStatus.APPROVED },
        { campaignId, status: CollaborationStatus.PAID },
      ],
    });

    const targetSlots = campaign.slots || 1;
    if (doneCollabsCount >= targetSlots) {
      campaign.status = CampaignStatus.COMPLETED;
      await campaignRepo.save(campaign);
      this.logger.log(
        `Campaign ${campaignId} auto-completed (${doneCollabsCount}/${targetSlots} slots approved)`,
      );
      return CampaignStatus.COMPLETED;
    }

    return campaign.status;
  }
}
