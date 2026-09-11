import { Injectable, NotFoundException } from '@nestjs/common';
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
import { UserRole } from '../users/entities/user.entity';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { Message } from '../messages/entities/message.entity';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { Deliverable } from '../deliverables/entities/deliverable.entity';

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
      }
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
      relations: { campaign: { product: true }, brand: true },
    });

    const urgentTasks: any[] = [];
    const upcomingTasks: any[] = [];

    for (const c of collabs) {
      // Check for messages from brand
      const msgCount = await this.dataSource.getRepository(Message).count({
        where: { collaborationId: c.id, senderUserId: c.brand.userId },
      });
      if (msgCount > 0) {
        urgentTasks.push({
          id: `msg-${c.id}`,
          title: `Reply to ${c.brand.companyName || 'Brand'}`,
          description: `You have message(s) from the brand`,
          actionText: 'Open Chat',
          actionUrl: `/chat/${c.id}`,
          collaborationId: c.id,
          theme: 'cream',
        });
      }

      // Check for deliverables
      const deliverables = await this.dataSource
        .getRepository(Deliverable)
        .find({
          where: { collaborationId: c.id },
        });
      if (deliverables.length === 0) {
        urgentTasks.push({
          id: `deliv-${c.id}`,
          title: `Upload your video for ${c.campaign.product.name}`,
          description: `EGP ${c.creatorPrice} is held in escrow.`,
          actionText: 'Upload deliverable',
          actionUrl: `/upload/${c.id}`,
          collaborationId: c.id,
          theme: 'coral',
        });
      }

      // Check shipment tracking
      if (
        c.shipmentTrackingNumber &&
        c.status === CollaborationStatus.SHIPPED
      ) {
        upcomingTasks.push({
          id: `ship-${c.id}`,
          title: 'Confirm you received the shipment',
          description: `${c.brand.companyName || 'Brand'} · ${c.shipmentTrackingNumber}`,
          actionText: 'Confirm',
          actionUrl: `/shipment/${c.id}`,
          collaborationId: c.id,
          theme: 'forest',
        });
      }
    }

    return { urgentTasks, upcomingTasks };
  }

  async getEarnings(userId: string) {
    const creator = await this.findByUserId(userId);
    const collabs = await this.dataSource.getRepository(Collaboration).find({
      where: { creatorId: creator.id },
    });

    let escrow = 0;
    let pending = 0;
    let cleared = 0;

    for (const c of collabs) {
      const price = parseFloat(c.creatorPrice);
      if (
        c.status === CollaborationStatus.FUNDED ||
        c.status === CollaborationStatus.SHIPPED ||
        c.status === CollaborationStatus.DELIVERED ||
        c.status === CollaborationStatus.REVISION_REQUESTED
      ) {
        escrow += price;
      } else if (c.status === CollaborationStatus.APPROVED) {
        pending += price;
      } else if (c.status === CollaborationStatus.PAID) {
        cleared += price;
      }
    }

    return {
      escrowBalance: escrow,
      pendingBalance: pending,
      clearedBalance: cleared,
    };
  }

  async getLedger(userId: string) {
    const creator = await this.findByUserId(userId);
    const collabs = await this.dataSource.getRepository(Collaboration).find({
      where: { creatorId: creator.id },
      relations: { brand: true },
      order: { createdAt: 'DESC' },
    });

    return collabs.map((c) => {
      let status = 'Unknown';
      let statusColor = '#9CA3AF'; // muted

      if (
        c.status === CollaborationStatus.FUNDED ||
        c.status === CollaborationStatus.SHIPPED ||
        c.status === CollaborationStatus.DELIVERED ||
        c.status === CollaborationStatus.REVISION_REQUESTED
      ) {
        status = 'In escrow';
        statusColor = '#9CA3AF'; // muted
      } else if (c.status === CollaborationStatus.APPROVED) {
        status = 'Withdrawable';
        statusColor = '#10B981'; // success
      } else if (c.status === CollaborationStatus.PAID) {
        status = 'Paid';
        statusColor = '#10B981'; // success
      }

      const dateStr = c.createdAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });

      return {
        id: c.id,
        title: `${status === 'Paid' ? 'Payout' : status === 'In escrow' ? 'Held' : 'Released'} · ${c.brand?.companyName || 'Brand'}`,
        meta: `${dateStr} · collaboration #${c.id.substring(0, 8)}`,
        amount:
          (status === 'Paid' ? '− ' : '+ ') +
          parseFloat(c.creatorPrice).toLocaleString('en-US'),
        status,
        statusColor,
      };
    });
  }

  async requestPayout(userId: string, amount: string, method: string) {
    const creator = await this.findByUserId(userId);

    const payoutRequest = this.payoutRequestRepository.create({
      creatorId: creator.id,
      amount,
      method,
      status: PayoutRequestStatus.PENDING,
    });
    await this.payoutRequestRepository.save(payoutRequest);

    return {
      success: true,
      message:
        'Payout requested successfully. Admin will review within 2 business days.',
    };
  }
}
