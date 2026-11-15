import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Deliverable,
  DeliverableStatus,
  DeliverableType,
} from './entities/deliverable.entity';
import { DeliverableFeedback } from './entities/deliverable-feedback.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { Collaboration } from '../collaborations/entities/collaboration.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { BrandsService } from '../brands/brands.service';
import { R2StorageClient } from '../storage/r2-storage.client';

import { CampaignsService } from '../campaigns/campaigns.service';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
import { RegisterDeliverableDto } from './dto/register-deliverable.dto';
import { ReviewDeliverableDto } from './dto/review-deliverable.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

export interface DeliverableListItem {
  id: string;
  version: number;
  type: DeliverableType;
  fileUrl: string;
  durationSeconds: number | null;
  status: DeliverableStatus;
  note: string | null;
  createdAt: Date;
  feedback: {
    id: string;
    body: string;
    senderRole: string;
    createdAt: Date;
  }[];
}

@Injectable()
export class DeliverablesService {
  private readonly logger = new Logger(DeliverablesService.name);

  constructor(
    @InjectRepository(Deliverable)
    private readonly deliverablesRepository: Repository<Deliverable>,
    private readonly dataSource: DataSource,
    private readonly collaborationsService: CollaborationsService,
    private readonly transactionsService: TransactionsService,
    private readonly brandsService: BrandsService,
    private readonly campaignsService: CampaignsService,
    private readonly r2StorageClient: R2StorageClient,
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * REQ-007/SEC-001/TASK-P3-01: creator must own the collaboration, and the fileUrl
   * must belong to this collaboration's presigned-URL namespace.
   * Version is incremented atomically inside the transaction.
   */
  async register(
    userId: string,
    collaborationId: string,
    dto: RegisterDeliverableDto,
  ): Promise<Deliverable> {
    await this.collaborationsService.findOwnedByCreator(
      userId,
      collaborationId,
    );

    if (
      !dto.fileUrl.startsWith(
        this.r2StorageClient.collaborationUrlPrefix(collaborationId),
      )
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_file_url',
        'The file URL was not issued for this collaboration',
      );
    }

    const result = await this.dataSource.transaction(async (manager) => {
      await this.collaborationsService.transitionToDelivered(
        collaborationId,
        manager,
      );

      const repository = manager.getRepository(Deliverable);

      // Compute next version number for this collaboration
      const maxVersionResult = await repository
        .createQueryBuilder('deliverable')
        .select('MAX(deliverable.version)', 'max')
        .where('deliverable.collaboration_id = :collaborationId', {
          collaborationId,
        })
        .getRawOne();

      const nextVersion =
        (maxVersionResult?.max ? parseInt(maxVersionResult.max, 10) : 0) + 1;

      const deliverable = repository.create({
        collaborationId,
        version: nextVersion,
        note: dto.note ?? null,
        type: dto.type,
        fileUrl: dto.fileUrl,
        durationSeconds: dto.durationSeconds ?? null,
        status: DeliverableStatus.SUBMITTED,
      });

      try {
        const saved = await repository.save(deliverable);

        // TASK-P3-07: write deliverable_submitted system message
        await this.messagesService.createSystemMessage(
          collaborationId,
          {
            event: 'deliverable_submitted',
            params: {
              version: saved.version,
            },
          },
          manager,
        );

        // TASK-P4-04: record deliverable_submitted notification for brand owner/approver
        let notifications: Notification[] = [];
        try {
          const collab = await manager.getRepository(Collaboration).findOne({
            where: { id: collaborationId },
            relations: { campaign: true, creator: true },
          });

          if (collab) {
            notifications = await this.notificationsService.record(
              {
                event: 'deliverable_submitted',
                params: {
                  creatorName: collab.creator?.displayName ?? 'Creator',
                  title: collab.campaign?.title ?? 'Campaign',
                  version: saved.version,
                },
                brandId: collab.brandId,
                collaborationId: collab.id,
                campaignId: collab.campaignId,
                deepLinkByRole: {
                  brand: {
                    stack: 'BriefsTab',
                    screen: 'ReviewDeliverable',
                    params: { deliverableId: saved.id },
                  },
                },
              },
              manager,
            );
          }
        } catch (notifErr: unknown) {
          const message =
            notifErr instanceof Error ? notifErr.message : String(notifErr);
          this.logger.warn(
            `Failed to record deliverable_submitted notification: ${message}`,
          );
        }

        this.logger.log(
          `Deliverable ${saved.id} (v${saved.version}) registered for collaboration ${collaborationId}`,
        );
        return { deliverable: saved, notifications };
      } catch (error: unknown) {
        if ((error as { code?: string })?.code === '23505') {
          throw new DomainErrorException(
            HttpStatus.CONFLICT,
            'duplicate_version',
            'A deliverable with this version already exists for this collaboration',
          );
        }
        throw error;
      }
    });

    if (result.notifications?.length) {
      await this.notificationsService.push(result.notifications);
    }

    return result.deliverable;
  }

  /**
   * TASK-P1-008, TASK-P3-03: returns deliverables with version, note, and feedback thread
   * ordered oldest first. Feedback includes senderRole ('brand' | 'creator') and never sender emails.
   */
  async listForCollaboration(
    user: AuthUser,
    collaborationId: string,
  ): Promise<DeliverableListItem[]> {
    await this.collaborationsService.findOwnedByUser(user, collaborationId);

    const deliverables = await this.deliverablesRepository
      .createQueryBuilder('deliverable')
      .leftJoinAndSelect('deliverable.feedback', 'feedback')
      .leftJoin('feedback.sender', 'sender')
      .addSelect(['sender.id', 'sender.role'])
      .where('deliverable.collaboration_id = :collaborationId', {
        collaborationId,
      })
      .orderBy('deliverable.created_at', 'DESC')
      .addOrderBy('feedback.created_at', 'ASC')
      .getMany();

    return deliverables.map((d) => ({
      id: d.id,
      version: d.version,
      type: d.type,
      fileUrl: d.fileUrl,
      durationSeconds: d.durationSeconds,
      status: d.status,
      note: d.note,
      createdAt: d.createdAt,
      feedback: (d.feedback || []).map((f: DeliverableFeedback) => ({
        id: f.id,
        body: f.body,
        senderRole: f.sender?.role ?? 'brand',
        createdAt: f.createdAt,
      })),
    }));
  }

  /**
   * TASK-P1-008, TASK-P3-02, TASK-P3-05:
   * approve triggers release + fee + brief auto complete;
   * request_revision / decline inserts DeliverableFeedback and sets collaboration to revision_requested.
   * Takes a pessimistic write lock on the collaboration inside the transaction.
   */
  async review(
    userId: string,
    deliverableId: string,
    dto: ReviewDeliverableDto,
  ): Promise<{
    id: string;
    version: number;
    status: DeliverableStatus;
    collaborationStatus: string;
    releasedAmount?: string;
    creatorAmount?: string;
    platformFee?: string;
    currency?: string;
    campaignStatus?: string;
  }> {
    const deliverable = await this.deliverablesRepository.findOne({
      where: { id: deliverableId },
      relations: { collaboration: { creator: true } },
    });
    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    const brand = await this.brandsService.findByUserId(userId);
    if (deliverable.collaboration.brandId !== brand.id) {
      throw new NotFoundException('Deliverable not found');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      // CRIT-01: Enforce short statement timeout (3000ms) to prevent pool starvation under locks
      if (typeof manager.query === 'function') {
        try {
          await manager.query("SET LOCAL statement_timeout = '3000ms'");
        } catch {
          // ignore when underlying mock runner does not support SET LOCAL
        }
      }

      // Lock collaboration first (EDGE-P3-301)
      const collaboration = await this.collaborationsService.requireDelivered(
        deliverable.collaborationId,
        manager,
      );
      const repository = manager.getRepository(Deliverable);

      let campaignStatus: string | undefined;
      let notifications: Notification[] = [];

      if (dto.action === 'request_revision') {
        const campaign = await manager.getRepository(Campaign).findOne({
          where: { id: collaboration.campaignId },
        });
        const revisionLimit = campaign?.revisionLimit ?? 2;
        const revisionsUsed = await repository.count({
          where: {
            collaborationId: collaboration.id,
            status: DeliverableStatus.REVISION_REQUESTED,
          },
        });
        if (revisionsUsed >= revisionLimit) {
          throw new DomainErrorException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'revision_limit_reached',
            'No revisions left. Approve or decline.',
          );
        }
      }

      if (dto.action === 'approve') {
        deliverable.status = DeliverableStatus.APPROVED;
        await repository.save(deliverable);
        if (dto.feedback && dto.feedback.trim().length > 0) {
          await manager.getRepository(DeliverableFeedback).save(
            manager.getRepository(DeliverableFeedback).create({
              deliverableId: deliverable.id,
              senderUserId: userId,
              body: dto.feedback.trim(),
            }),
          );
        }
        await this.collaborationsService.markApproved(collaboration, manager);

        // M3: release(totalAmount) = payout(creatorPrice) + fee(platformFee).
        await this.transactionsService.recordRelease(
          collaboration.id,
          collaboration.totalAmount,
          collaboration.currency,
          manager,
        );
        await this.transactionsService.recordFee(
          collaboration.id,
          collaboration.platformFee,
          collaboration.currency,
          manager,
        );

        // Auto complete brief if all slots reached approved or paid (TASK-P3-05)
        // Lock order: collaboration first, then campaign inside completeIfAllSlotsDone
        campaignStatus = await this.campaignsService.completeIfAllSlotsDone(
          collaboration.campaignId,
          manager,
        );

        // TASK-P3-07: write escrow_released system message
        await this.messagesService.createSystemMessage(
          collaboration.id,
          {
            event: 'escrow_released',
            params: {
              total: collaboration.totalAmount,
              creatorPrice: collaboration.creatorPrice,
            },
          },
          manager,
        );

        // TASK-P4-04: record escrow_released notification for brand and creator
        try {
          const loadedCollab = await manager
            .getRepository(Collaboration)
            .findOne({
              where: { id: collaboration.id },
              relations: { creator: true },
            });

          notifications = await this.notificationsService.record(
            {
              event: 'escrow_released',
              paramsByRole: {
                brand: {
                  total: collaboration.totalAmount,
                  creatorPrice: collaboration.creatorPrice,
                  currency: collaboration.currency,
                  creatorName: loadedCollab?.creator?.displayName ?? 'Creator',
                },
                creator: {
                  creatorPrice: collaboration.creatorPrice,
                  currency: collaboration.currency,
                  brandName: brand.companyName ?? 'Brand',
                },
              },
              brandId: collaboration.brandId,
              creatorUserId: loadedCollab?.creator?.userId,
              collaborationId: collaboration.id,
              campaignId: collaboration.campaignId,
              deepLinkByRole: {
                brand: {
                  stack: 'BriefsTab',
                  screen: 'CollaborationDetail',
                  params: { id: collaboration.id },
                },
                creator: {
                  stack: 'EarningsTab',
                  screen: 'Earnings',
                },
              },
            },
            manager,
          );
        } catch (notifErr: unknown) {
          const message =
            notifErr instanceof Error ? notifErr.message : String(notifErr);
          this.logger.warn(
            `Failed to record escrow_released notification: ${message}`,
          );
        }
      } else {
        deliverable.status =
          dto.action === 'decline'
            ? DeliverableStatus.DECLINED
            : DeliverableStatus.REVISION_REQUESTED;
        await repository.save(deliverable);
        await manager.getRepository(DeliverableFeedback).save(
          manager.getRepository(DeliverableFeedback).create({
            deliverableId: deliverable.id,
            senderUserId: userId,
            body: dto.feedback as string,
          }),
        );
        await this.collaborationsService.markRevisionRequested(
          collaboration,
          manager,
        );

        // TASK-P3-07: write revision_requested system message
        if (dto.action === 'request_revision') {
          await this.messagesService.createSystemMessage(
            collaboration.id,
            {
              event: 'revision_requested',
              params: {},
            },
            manager,
          );

          // TASK-P4-04: record revision_requested notification for creator
          try {
            const loadedCollab = await manager
              .getRepository(Collaboration)
              .findOne({
                where: { id: collaboration.id },
                relations: { creator: true },
              });

            notifications = await this.notificationsService.record(
              {
                event: 'revision_requested',
                params: {
                  brandName: brand.companyName ?? 'Brand',
                },
                creatorUserId: loadedCollab?.creator?.userId,
                collaborationId: collaboration.id,
                campaignId: collaboration.campaignId,
                deepLinkByRole: {
                  creator: {
                    stack: 'WorkTab',
                    screen: 'DeliverableUpload',
                    params: { collaborationId: collaboration.id },
                  },
                },
              },
              manager,
            );
          } catch (notifErr: unknown) {
            const message =
              notifErr instanceof Error ? notifErr.message : String(notifErr);
            this.logger.warn(
              `Failed to record revision_requested notification: ${message}`,
            );
          }
        }
      }

      this.logger.log(
        `Deliverable ${deliverable.id} (v${deliverable.version}) reviewed: action=${dto.action}`,
      );

      return {
        data: {
          id: deliverable.id,
          version: deliverable.version,
          status: deliverable.status,
          collaborationStatus: collaboration.status,
          ...(dto.action === 'approve'
            ? {
                releasedAmount: collaboration.totalAmount,
                creatorAmount: collaboration.creatorPrice,
                platformFee: collaboration.platformFee,
                currency: collaboration.currency,
                campaignStatus,
              }
            : {}),
        },
        notifications,
      };
    });

    if (result.notifications?.length) {
      await this.notificationsService.push(result.notifications);
    }

    return result.data;
  }
}
