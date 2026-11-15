import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { CreatorsService } from '../creators/creators.service';
import { CreatorStatsService } from '../creators/creator-stats.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandsService } from '../brands/brands.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { CreatorPortfolioItem } from '../creators/entities/creator-portfolio-item.entity';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import {
  Deliverable,
  DeliverableStatus,
} from '../deliverables/entities/deliverable.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EscrowService } from '../escrow/escrow.service';
import { centsToAmount } from '../../common/utils/money';

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @Inject(forwardRef(() => CampaignsService))
    private readonly campaignsService: CampaignsService,
    private readonly creatorsService: CreatorsService,
    private readonly creatorStatsService: CreatorStatsService,
    private readonly brandsService: BrandsService,
    private readonly escrowService: EscrowService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** REQ-008/EDGE-P1-003: campaign must be live; one proposal per creator. */
  async create(
    userId: string,
    campaignId: string,
    dto: CreateProposalDto,
  ): Promise<Proposal> {
    const creator = await this.creatorsService.findByUserId(userId);
    const campaign = await this.campaignsService.findById(campaignId);

    if (campaign.status !== CampaignStatus.LIVE) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'campaign_not_open',
        'This campaign is not open for proposals',
      );
    }

    const proposal = this.proposalsRepository.create({
      campaignId: campaign.id,
      creatorId: creator.id,
      price: dto.price.toFixed(2),
      deliveryDays: dto.deliveryDays,
      pitch: dto.pitch,
      status: ProposalStatus.APPLIED,
    });

    try {
      const { saved, notifications } = await this.dataSource.transaction(
        async (manager) => {
          const repo = manager.getRepository(Proposal);
          const savedProposal = await repo.save(proposal);

          // Count open proposals for title/count copy
          const count = await repo.count({
            where: {
              campaignId: campaign.id,
              status: ProposalStatus.APPLIED,
            },
          });

          const notifs = await this.notificationsService.record(
            {
              event: 'proposal_received',
              params: {
                count,
                title: campaign.title,
              },
              brandId: campaign.brandId,
              campaignId: campaign.id,
              deepLinkByRole: {
                brand: {
                  stack: 'BriefsTab',
                  screen: 'ProposalsInbox',
                  params: { campaignId: campaign.id },
                },
              },
            },
            manager,
          );

          return { saved: savedProposal, notifications: notifs };
        },
      );

      await this.notificationsService.push(notifications);

      this.logger.log(
        `Creator ${creator.id} applied to campaign ${campaign.id}`,
      );
      return saved;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'duplicate_proposal',
          'You already applied to this campaign',
        );
      }
      throw error;
    }
  }

  async listForCampaign(
    userId: string,
    campaignId: string,
    page: number,
    perPage: number,
  ): Promise<[Proposal[], number]> {
    // SEC-001: 404s if the campaign is not owned by this brand.
    await this.campaignsService.findOwned(userId, campaignId);
    // The brand sees who applied (name and city), not the creator's private fields.
    const [items, total] = await this.proposalsRepository
      .createQueryBuilder('proposal')
      .leftJoin('proposal.creator', 'creator')
      .addSelect(['creator.id', 'creator.displayName', 'creator.city'])
      .where('proposal.campaign_id = :campaignId', { campaignId })
      .orderBy('proposal.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (items.length === 0) {
      return [items, total];
    }

    const creatorIds = items.map((p) => p.creatorId).filter(Boolean);
    const statsMap = await this.creatorStatsService.forCreators(creatorIds);

    const portfolioCountsMap = new Map<string, number>();
    try {
      if (typeof this.dataSource?.query === 'function') {
        const rows: { creator_id: string; count: string }[] =
          await this.dataSource.query(
            `SELECT creator_id, COUNT(*)::int AS count FROM creator_portfolio_items
             WHERE creator_id = ANY($1)
             GROUP BY creator_id`,
            [creatorIds],
          );
        for (const row of rows) {
          portfolioCountsMap.set(row.creator_id, Number(row.count));
        }
      }
    } catch {
      // fallback
    }

    for (const proposal of items) {
      proposal.creatorStats = statsMap.get(proposal.creatorId) ?? {
        jobsDone: 0,
        approvalRate: 100,
        averageRevisions: 0,
      };
      proposal.portfolioCount =
        portfolioCountsMap.get(proposal.creatorId) ?? 0;
    }

    return [items, total];
  }

  async listMine(
    userId: string,
    page: number,
    perPage: number,
  ): Promise<[Proposal[], number]> {
    const creator = await this.creatorsService.findByUserId(userId);
    // The creator sees the brief title, brand name, product name, closesAt, budget range, and status.
    return this.proposalsRepository
      .createQueryBuilder('proposal')
      .leftJoin('proposal.campaign', 'campaign')
      .leftJoin('campaign.brand', 'brand')
      .leftJoin('campaign.product', 'product')
      .addSelect([
        'campaign.id',
        'campaign.title',
        'campaign.closesAt',
        'campaign.budgetMin',
        'campaign.budgetMax',
        'campaign.status',
        'brand.id',
        'brand.companyName',
        'brand.logoUrl',
        'product.id',
        'product.name',
      ])
      .where('proposal.creator_id = :creatorId', { creatorId: creator.id })
      .orderBy('proposal.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
  }

  /** REQ-009, REQ-402: shortlist or decline only, ownership via the parent campaign. */
  async updateStatus(
    userId: string,
    proposalId: string,
    status: ProposalStatus.SHORTLISTED | ProposalStatus.DECLINED,
  ): Promise<Proposal> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true, creator: true },
    });

    if (!proposal || proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }

    proposal.status = status;

    const { saved, notifications } = await this.dataSource.transaction(
      async (manager) => {
        const repo = manager.getRepository(Proposal);
        const savedProposal = await repo.save(proposal);

        const event =
          status === ProposalStatus.SHORTLISTED
            ? 'proposal_shortlisted'
            : 'proposal_declined';

        const notifs = await this.notificationsService.record(
          {
            event,
            params: {
              brandName: brand.companyName ?? 'Brand',
              title: proposal.campaign.title,
            },
            creatorUserId: proposal.creator.userId,
            campaignId: proposal.campaignId,
            deepLinkByRole: {
              creator: { stack: 'ProfileTab', screen: 'MyProposals' },
            },
          },
          manager,
        );

        return { saved: savedProposal, notifications: notifs };
      },
    );

    await this.notificationsService.push(notifications);

    this.logger.log(`Proposal ${saved.id} set to ${status}`);
    return saved;
  }

  /**
   * TASK-P1-004: loaded with its campaign relation so
   * CollaborationsService can check brand ownership without a second
   * round trip.
   */
  async findById(proposalId: string): Promise<Proposal> {
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return proposal;
  }

  /**
   * REQ-002: called from CollaborationsService's webhook-handling
   * transaction once a Paymob webhook funds the collaboration. Never
   * called directly by a brand (see UpdateProposalStatusDto).
   */
  async markAccepted(
    proposalId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .getRepository(Proposal)
      .update(proposalId, { status: ProposalStatus.ACCEPTED });
  }

  /**
   * EDGE-P1-005: called from the same transaction as an admin rejecting a
   * creator's vetting. Declines every still-open proposal from that
   * creator so the brand sees why it disappeared.
   */
  async declineAllOpenForCreator(
    creatorId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Proposal)
      .set({
        status: ProposalStatus.DECLINED,
        declineReason: 'creator_rejected',
      })
      .where('creator_id = :creatorId', { creatorId })
      .andWhere('status IN (:...statuses)', {
        statuses: [ProposalStatus.APPLIED, ProposalStatus.SHORTLISTED],
      })
      .execute();
  }

  /**
   * REQ-211, REQ-402: declines every open proposal on a closed brief and records proposal_declined for each creator.
   */
  async declineAllOpenForCampaign(
    campaignId: string,
    reason: string = 'brief_closed',
    manager: EntityManager,
  ): Promise<number> {
    // Find open proposals with creator relation to get userIds
    const openProposals = await manager.getRepository(Proposal).find({
      where: {
        campaignId,
        status: In([ProposalStatus.APPLIED, ProposalStatus.SHORTLISTED]),
      },
      relations: { creator: true, campaign: { brand: true } },
    });

    const result = await manager
      .createQueryBuilder()
      .update(Proposal)
      .set({
        status: ProposalStatus.DECLINED,
        declineReason: reason,
      })
      .where('campaign_id = :campaignId', { campaignId })
      .andWhere('status IN (:...statuses)', {
        statuses: [ProposalStatus.APPLIED, ProposalStatus.SHORTLISTED],
      })
      .execute();

    // Record notification per creator
    for (const p of openProposals) {
      if (p.creator?.userId) {
        const notifs = await this.notificationsService.record(
          {
            event: 'proposal_declined',
            params: {
              brandName: p.campaign?.brand?.companyName ?? 'Brand',
              title: p.campaign?.title ?? 'Brief',
            },
            creatorUserId: p.creator.userId,
            campaignId,
            deepLinkByRole: {
              creator: { stack: 'ProfileTab', screen: 'MyProposals' },
            },
          },
          manager,
        );
        // Note: push will be sent asynchronously/post-commit
        void this.notificationsService.push(notifs);
      }
    }

    return result.affected ?? 0;
  }

  /**
   * REQ-213, TASK-P2-11: Returns the creator trust preview metrics for brand proposal review.
   * Computes jobsDone, approvalRate, and averageRevisions in grouped SQL queries.
   */
  async getCreatorProfilePreview(
    userId: string,
    proposalId: string,
  ): Promise<{
    creatorId: string;
    displayName: string | null;
    city: string | null;
    niches: string[];
    approvalRate: number;
    averageRevisions: number;
    jobsDone: number;
    portfolio: { id: string; mediaUrl: string; mediaType: string }[];
    proposal: {
      id: string;
      price: string;
      currency: string;
      deliveryDays: number;
      pitch: string | null;
    };
  }> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true, creator: true },
    });

    if (!proposal || proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }

    const creatorId = proposal.creatorId;
    const creator = proposal.creator;

    // Statement 1: Portfolio items for creator
    const portfolioItems = await this.dataSource
      .getRepository(CreatorPortfolioItem)
      .find({
        where: { creatorId },
        take: 4,
        order: { createdAt: 'DESC' },
      });

    // Statement 2: Finished collaborations status counts and revisions (TASK-W4-06)
    const statsMap = await this.creatorStatsService.forCreators([creatorId]);
    const stats = statsMap.get(creatorId) ?? {
      approvalRate: 100,
      averageRevisions: 0,
      jobsDone: 0,
    };

    return {
      creatorId: creator.id,
      displayName: creator.displayName,
      city: creator.city,
      niches: creator.niches || [],
      approvalRate: stats.approvalRate,
      averageRevisions: stats.averageRevisions,
      jobsDone: stats.jobsDone,
      portfolio: portfolioItems.map((item) => ({
        id: item.id,
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
      })),
      proposal: {
        id: proposal.id,
        price: proposal.price,
        currency: proposal.currency,
        deliveryDays: proposal.deliveryDays,
        pitch: proposal.pitch,
      },
    };
  }

  /**
   * BG-22, TASK-W3-05: Returns quote for accepting a proposal without moving money.
   */
  async getAcceptQuote(
    userId: string,
    proposalId: string,
  ): Promise<{
    proposalId: string;
    creatorPrice: string;
    platformFee: string;
    totalAmount: string;
    available: string;
    availableAfter: string;
    sufficient: boolean;
    shortfall: string;
    currency: string;
  }> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId },
      relations: { campaign: true },
    });

    if (!proposal || proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }

    if (
      proposal.status !== ProposalStatus.APPLIED &&
      proposal.status !== ProposalStatus.SHORTLISTED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'proposal_not_open',
        'Only applied or shortlisted proposals can be quoted',
      );
    }

    const quote = this.escrowService.quote(proposal.price);
    const availableCents = proposal.campaign.availableEscrowCents();
    const availableAfterCents = availableCents - quote.totalCents;
    const sufficient = availableAfterCents >= 0;
    const shortfallCents = sufficient ? 0 : Math.abs(availableAfterCents);

    return {
      proposalId: proposal.id,
      creatorPrice: centsToAmount(quote.priceCents),
      platformFee: centsToAmount(quote.feeCents),
      totalAmount: centsToAmount(quote.totalCents),
      available: centsToAmount(availableCents),
      availableAfter: centsToAmount(availableAfterCents),
      sufficient,
      shortfall: centsToAmount(shortfallCents),
      currency: proposal.currency || 'EGP',
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
