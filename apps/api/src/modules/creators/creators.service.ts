import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Creator } from './entities/creator.entity';
import { CreatorPortfolioItem } from './entities/creator-portfolio-item.entity';
import { CreatorPayoutDetail } from './entities/creator-payout-detail.entity';
import {
  PayoutRequest,
  PayoutRequestStatus,
} from './entities/payout-request.entity';
import { UpdateCreatorDto } from './dto/update-creator.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { UpsertPayoutDetailsDto } from './dto/upsert-payout-details.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { UserRole } from '../users/entities/user.entity';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { Message, MessageKind } from '../messages/entities/message.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import { Deliverable } from '../deliverables/entities/deliverable.entity';
import { centsToAmount, toCents } from '../../common/utils/money';
import { computeDueAt } from '../collaborations/due-at';

export type CreatorTaskKind =
  | 'message'
  | 'revision'
  | 'delivery'
  | 'shipment'
  | 'awaiting_shipment';

export interface CreatorTask {
  id: string;
  kind?: CreatorTaskKind;
  dueAt?: string | null;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  collaborationId: string;
  theme: string;
}

function getTaskKind(id: string): CreatorTaskKind {
  if (id.startsWith('msg-')) return 'message';
  if (id.startsWith('rev-')) return 'revision';
  if (id.startsWith('await-ship-')) return 'awaiting_shipment';
  if (id.startsWith('deliv-')) return 'delivery';
  if (id.startsWith('ship-')) return 'shipment';
  return 'message';
}

@Injectable()
export class CreatorsService {
  constructor(
    @InjectRepository(Creator)
    private readonly creatorsRepository: Repository<Creator>,
    @InjectRepository(CreatorPortfolioItem)
    private readonly portfolioRepository: Repository<CreatorPortfolioItem>,
    @InjectRepository(CreatorPayoutDetail)
    private readonly payoutRepository: Repository<CreatorPayoutDetail>,
    @InjectRepository(PayoutRequest)
    private readonly payoutRequestRepository: Repository<PayoutRequest>,
    private readonly dataSource: DataSource,
  ) {}

  /** Ownership is always derived from the authenticated user (REQ-004 analog). */
  async findByUserId(userId: string): Promise<Creator> {
    const creator = await this.creatorsRepository.findOne({
      where: { userId },
    });
    if (!creator) {
      throw new NotFoundException('Creator profile not found');
    }

    const collabs = await this.dataSource.getRepository(Collaboration).find({
      where: { creatorId: creator.id },
    });

    const approvedCount = collabs.filter(
      (c) =>
        c.status === CollaborationStatus.APPROVED ||
        c.status === CollaborationStatus.PAID,
    ).length;

    Object.assign(creator, {
      stats: {
        collaborations: collabs.length,
        approved: approvedCount,
        revisionsAvg: 0,
      },
    });

    return creator;
  }

  async findById(id: string): Promise<Creator> {
    const creator = await this.creatorsRepository.findOne({ where: { id } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    return creator;
  }

  async updateByUserId(
    userId: string,
    dto: UpdateCreatorDto,
  ): Promise<Creator> {
    const creator = await this.findByUserId(userId);
    if (dto.displayName !== undefined) creator.displayName = dto.displayName;
    if (dto.city !== undefined) creator.city = dto.city;
    if (dto.niches !== undefined) creator.niches = dto.niches;
    if (dto.basePrice !== undefined)
      creator.basePrice = dto.basePrice.toFixed(2);
    if (dto.verificationClipUrl !== undefined)
      creator.verificationClipUrl = dto.verificationClipUrl;
    return this.creatorsRepository.save(creator);
  }

  async listPortfolioItems(userId: string): Promise<CreatorPortfolioItem[]> {
    const creator = await this.findByUserId(userId);
    return this.portfolioRepository.find({
      where: { creatorId: creator.id },
      order: { createdAt: 'DESC' },
    });
  }

  async addPortfolioItem(
    userId: string,
    dto: CreatePortfolioItemDto,
  ): Promise<CreatorPortfolioItem> {
    const creator = await this.findByUserId(userId);
    const item = this.portfolioRepository.create({
      creatorId: creator.id,
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
    });
    return this.portfolioRepository.save(item);
  }

  async deletePortfolioItem(userId: string, id: string): Promise<void> {
    const creator = await this.findByUserId(userId);
    const item = await this.portfolioRepository.findOne({
      where: { id, creatorId: creator.id },
    });
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    await this.portfolioRepository.remove(item);
  }

  async upsertPayoutDetailsForUser(
    userId: string,
    dto: UpsertPayoutDetailsDto,
  ): Promise<CreatorPayoutDetail> {
    const creator = await this.findByUserId(userId);
    const existing = await this.payoutRepository.findOne({
      where: { creatorId: creator.id },
    });
    const details =
      existing ?? this.payoutRepository.create({ creatorId: creator.id });
    details.method = dto.method;
    details.accountIdentifier = dto.accountIdentifier;
    details.holderName = dto.holderName;
    return this.payoutRepository.save(details);
  }

  /**
   * SEC-004: only the owning creator or an admin may read payout details.
   * A creator requesting another creator's details gets 404, not 403
   * (EDGE-P1-002 pattern), so cross-tenant access is never confirmed.
   */
  async getPayoutDetails(
    requester: AuthUser,
    creatorId: string,
  ): Promise<CreatorPayoutDetail | null> {
    const creator = await this.findById(creatorId);
    if (
      requester.role === UserRole.CREATOR &&
      creator.userId !== requester.userId
    ) {
      throw new NotFoundException('Creator not found');
    }

    const details = await this.payoutRepository.findOne({
      where: { creatorId: creator.id },
    });
    if (!details) {
      return null;
    }
    return details;
  }

  async getHomeQueue(userId: string) {
    const creator = await this.findByUserId(userId);

    // Fetch active collaborations for this creator
    const collabs = await this.dataSource.getRepository(Collaboration).find({
      where: [
        { creatorId: creator.id, status: CollaborationStatus.FUNDED },
        { creatorId: creator.id, status: CollaborationStatus.SHIPPED },
        { creatorId: creator.id, status: CollaborationStatus.DELIVERED },
        {
          creatorId: creator.id,
          status: CollaborationStatus.REVISION_REQUESTED,
        },
      ],
      relations: { campaign: { product: true }, brand: true, proposal: true },
    });

    const urgentTasks: CreatorTask[] = [];
    const upcomingTasks: CreatorTask[] = [];

    const addTask = (
      list: CreatorTask[],
      task: Omit<CreatorTask, 'kind' | 'dueAt'>,
      dueAt: string | null,
    ) => {
      list.push({
        ...task,
        kind: getTaskKind(task.id),
        dueAt: dueAt ?? null,
      });
    };

    for (const c of collabs) {
      const dueAt = computeDueAt(c, c.campaign, c.proposal);

      // Ask for a reply only when the brand sent the latest chat message.
      const [latestMessage] = await this.dataSource
        .getRepository(Message)
        .find({
          where: { collaborationId: c.id, kind: MessageKind.USER },
          order: { sentAt: 'DESC' },
          take: 1,
        });
      if (latestMessage && latestMessage.senderUserId === c.brand.userId) {
        addTask(
          urgentTasks,
          {
            id: `msg-${c.id}`,
            title: `Reply to ${c.brand.companyName || 'Brand'}`,
            description: `You have message(s) from the brand`,
            actionText: 'Open Chat',
            actionUrl: `/chat/${c.id}`,
            collaborationId: c.id,
            theme: 'cream',
          },
          dueAt,
        );
      }

      // Check for deliverables
      const deliverables = await this.dataSource
        .getRepository(Deliverable)
        .find({
          where: { collaborationId: c.id },
        });
      if (c.status === CollaborationStatus.REVISION_REQUESTED) {
        addTask(
          urgentTasks,
          {
            id: `rev-${c.id}`,
            title: `Revision requested for ${c.campaign.title}`,
            description: `${c.brand.companyName || 'The brand'} asked for changes. Upload a new version.`,
            actionText: 'Upload new version',
            actionUrl: `/upload/${c.id}`,
            collaborationId: c.id,
            theme: 'coral',
          },
          dueAt,
        );
      } else if (
        deliverables.length === 0 &&
        c.status === CollaborationStatus.FUNDED &&
        c.campaign.needsShipping
      ) {
        // The API refuses uploads until the brand ships the product.
        addTask(
          upcomingTasks,
          {
            id: `await-ship-${c.id}`,
            title: `Waiting for ${c.brand.companyName || 'the brand'} to ship the product`,
            description: `${c.campaign.title} · you can upload your video after it ships.`,
            actionText: 'Open chat',
            actionUrl: `/chat/${c.id}`,
            collaborationId: c.id,
            theme: 'forest',
          },
          dueAt,
        );
      } else if (deliverables.length === 0) {
        addTask(
          urgentTasks,
          {
            id: `deliv-${c.id}`,
            title: `Upload your video for ${c.campaign.title}`,
            description: `EGP ${c.creatorPrice} is held in escrow.`,
            actionText: 'Upload deliverable',
            actionUrl: `/upload/${c.id}`,
            collaborationId: c.id,
            theme: 'coral',
          },
          dueAt,
        );
      }

      // Check shipment tracking
      if (
        c.shipmentTrackingNumber &&
        c.status === CollaborationStatus.SHIPPED
      ) {
        addTask(
          upcomingTasks,
          {
            id: `ship-${c.id}`,
            title: 'Confirm you received the shipment',
            description: `${c.brand.companyName || 'Brand'} · ${c.shipmentTrackingNumber}`,
            actionText: 'Confirm',
            actionUrl: `/shipment/${c.id}`,
            collaborationId: c.id,
            theme: 'forest',
          },
          dueAt,
        );
      }
    }

    return { urgentTasks, upcomingTasks };
  }

  /**
   * TASK-P3-08 / AUD-004:
   * Returns creator earnings built from the transactions ledger, not from collaboration status alone.
   * - escrowBalance: sum of creator_price for collaborations with a 'hold' row and no 'release' row
   * - pendingBalance: sum of creator_price for collaborations with a 'release' row and no 'payout' row
   * - clearedBalance: sum of payout.amount
   * Returned as two-decimal numeric strings with no parseFloat arithmetic.
   */
  async getEarnings(userId: string) {
    const creator = await this.findByUserId(userId);
    const collabRepo = this.dataSource.getRepository(Collaboration);
    const txRepo = this.dataSource.getRepository(Transaction);

    const collabs = await collabRepo.find({
      where: { creatorId: creator.id },
    });

    let escrowCents = 0;
    let pendingCents = 0;
    let clearedCents = 0;

    for (const c of collabs) {
      const priceCents = toCents(c.creatorPrice);

      const txs = await txRepo.find({
        where: { collaborationId: c.id, status: TransactionStatus.COMPLETED },
      });

      const hasHold = txs.some((t) => t.type === TransactionType.HOLD);
      const hasRelease = txs.some((t) => t.type === TransactionType.RELEASE);
      const hasPayout = txs.some((t) => t.type === TransactionType.PAYOUT);

      if (hasHold && !hasRelease) {
        escrowCents += priceCents;
      } else if (hasRelease && !hasPayout) {
        pendingCents += priceCents;
      }

      for (const t of txs) {
        if (t.type === TransactionType.PAYOUT) {
          clearedCents += toCents(t.amount);
        }
      }
    }

    return {
      escrowBalance: centsToAmount(escrowCents),
      pendingBalance: centsToAmount(pendingCents),
      clearedBalance: centsToAmount(clearedCents),
      currency: 'EGP',
    };
  }

  /**
   * TASK-P3-08 / DES-P3-306:
   * Returns creator ledger rows from the transactions table.
   * - hold: 'Held · {brandName}', unsigned, status 'In escrow', statusToken 'muted'
   * - release: 'Released · {brandName}', plus '+', status 'Withdrawable', statusToken 'success'
   * - payout: 'Payout · {method}', minus '−', status 'Paid', statusToken 'success'
   * - never returns a 'fee' row to a creator.
   * - returns token name, never a hex color.
   */
  async getLedger(userId: string) {
    const creator = await this.findByUserId(userId);
    const txRepo = this.dataSource.getRepository(Transaction);

    const txs = await txRepo
      .createQueryBuilder('tx')
      .innerJoinAndSelect('tx.collaboration', 'collab')
      .leftJoinAndSelect('collab.brand', 'brand')
      .leftJoinAndSelect('collab.campaign', 'campaign')
      .where('collab.creator_id = :creatorId', { creatorId: creator.id })
      .andWhere('tx.status = :txStatus', {
        txStatus: TransactionStatus.COMPLETED,
      })
      .andWhere('tx.type IN (:...types)', {
        types: [
          TransactionType.HOLD,
          TransactionType.RELEASE,
          TransactionType.PAYOUT,
        ],
      })
      .orderBy('tx.created_at', 'DESC')
      .getMany();

    return txs.map((tx) => {
      const brandName = tx.collaboration?.brand?.companyName || 'Brand';
      const campaignTitle = tx.collaboration?.campaign?.title || null;
      const dateStr = tx.createdAt.toISOString().slice(0, 10);
      const amountStr =
        tx.type === TransactionType.HOLD || tx.type === TransactionType.RELEASE
          ? tx.collaboration?.creatorPrice || tx.amount
          : tx.amount;

      let title = '';
      let sign: '+' | '−' | '' = '';
      let status = '';
      let statusToken: 'muted' | 'success' = 'muted';

      if (tx.type === TransactionType.HOLD) {
        title = `Held · ${brandName}`;
        sign = '';
        status = 'In escrow';
        statusToken = 'muted';
      } else if (tx.type === TransactionType.RELEASE) {
        title = `Released · ${brandName}`;
        sign = '+';
        status = 'Withdrawable';
        statusToken = 'success';
      } else if (tx.type === TransactionType.PAYOUT) {
        const method = tx.payoutMethod
          ? tx.payoutMethod.replace('_', ' ')
          : 'payout';
        title = `Payout · ${method}`;
        sign = '−';
        status = 'Paid';
        statusToken = 'success';
      }

      const hexPart = tx.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      const reference = `TX-${hexPart}`;

      return {
        id: tx.id,
        title,
        meta: `${dateStr} · collaboration #${tx.collaborationId?.substring(0, 8)}`,
        amount: sign ? `${sign} ${amountStr}` : amountStr,
        sign,
        status,
        statusToken,
        createdAt: tx.createdAt.toISOString(),
        type: tx.type as 'hold' | 'release' | 'payout',
        campaignTitle,
        reference,
      };
    });
  }

  async listPayoutRequests(userId: string): Promise<PayoutRequest[]> {
    const creator = await this.findByUserId(userId);
    return this.payoutRequestRepository.find({
      where: { creatorId: creator.id },
      order: { createdAt: 'DESC' },
    });
  }

  async requestPayout(userId: string, dto: RequestPayoutDto) {
    const creator = await this.findByUserId(userId);

    const payoutDetails = await this.payoutRepository.findOne({
      where: { creatorId: creator.id },
    });
    if (!payoutDetails) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'payout_details_missing',
        'Payout details must be configured first',
      );
    }

    const amountCents = toCents(dto.amount);
    if (amountCents <= 0) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_amount',
        'Amount must be greater than zero',
      );
    }

    const earnings = await this.getEarnings(userId);
    const pendingBalanceCents = toCents(earnings.pendingBalance);
    if (amountCents > pendingBalanceCents) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'insufficient_balance',
        'Insufficient available balance',
      );
    }

    const pendingRequest = await this.payoutRequestRepository.findOne({
      where: { creatorId: creator.id, status: PayoutRequestStatus.PENDING },
    });
    if (pendingRequest) {
      throw new DomainErrorException(
        HttpStatus.CONFLICT,
        'payout_request_open',
        'An open payout request already exists',
      );
    }

    if (dto.method !== payoutDetails.method) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'method_mismatch',
        'Payout method does not match saved payout details',
      );
    }

    const payoutRequest = this.payoutRequestRepository.create({
      creatorId: creator.id,
      amount: dto.amount,
      method: dto.method,
      status: PayoutRequestStatus.PENDING,
    });
    const saved = await this.payoutRequestRepository.save(payoutRequest);

    return {
      id: saved.id,
      amount: saved.amount,
      method: saved.method,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}
