import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
import {
  PayoutRequest,
  PayoutRequestStatus,
} from '../creators/entities/payout-request.entity';

/** TASK-P1-010, TASK-P4-04 */
@Injectable()
export class AdminPayoutsService {
  private readonly logger = new Logger(AdminPayoutsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly collaborationsService: CollaborationsService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(
    page: number,
    perPage: number,
  ): Promise<[Collaboration[], number]> {
    return this.collaborationsService.listApprovedAwaitingPayout(page, perPage);
  }

  /**
   * REQ-010/EDGE-P1-005: the partial unique index on
   * transactions(collaboration_id) WHERE type='payout' is the source of
   * truth for "already paid"; this catches that violation and returns a
   * clean 409 instead of a generic 500.
   */
  async markPaid(
    adminUserId: string,
    collaborationId: string,
    dto: MarkPaidDto,
  ): Promise<{
    transactionId: string;
    collaborationStatus: CollaborationStatus;
  }> {
    try {
      const txResult = await this.dataSource.transaction(async (manager) => {
        const collaboration = await manager
          .getRepository(Collaboration)
          .findOne({ where: { id: collaborationId } });
        if (!collaboration) {
          throw new NotFoundException('Collaboration not found');
        }
        // EDGE-P1-005: distinguish "already paid" (409) from any other
        // invalid transition (422). The unique partial index below is
        // still the concurrency-safe backstop for a genuine race between
        // two concurrent mark-paid requests.
        if (collaboration.status === CollaborationStatus.PAID) {
          throw new DomainErrorException(
            HttpStatus.CONFLICT,
            'already_paid',
            'This collaboration has already been paid',
          );
        }
        if (collaboration.status !== CollaborationStatus.APPROVED) {
          throw new DomainErrorException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            'invalid_state_transition',
            'Only an approved collaboration can be marked paid',
          );
        }

        const transaction = await this.transactionsService.recordPayout(
          collaboration.id,
          collaboration.creatorPrice,
          collaboration.currency,
          adminUserId,
          {
            method: dto.method,
            reference: dto.reference,
            paidAt: new Date(dto.paidAt),
          },
          manager,
        );
        const saved = await this.collaborationsService.markPaid(
          collaboration,
          manager,
        );

        // DEC-W003: Close oldest PENDING payout request for this creator
        const payoutReqRepo = manager.getRepository(PayoutRequest);
        const oldestPendingReq = await payoutReqRepo.findOne({
          where: {
            creatorId: collaboration.creatorId,
            status: PayoutRequestStatus.PENDING,
          },
          order: { createdAt: 'ASC' },
        });
        if (oldestPendingReq) {
          oldestPendingReq.status = PayoutRequestStatus.PAID;
          await payoutReqRepo.save(oldestPendingReq);
        }

        // TASK-P4-04: record payout_sent notification for creator
        let notifications: Notification[] = [];
        try {
          const loadedCollab = await manager
            .getRepository(Collaboration)
            .findOne({
              where: { id: collaboration.id },
              relations: { creator: true },
            });

          if (loadedCollab?.creator?.userId) {
            notifications = await this.notificationsService.record(
              {
                event: 'payout_sent',
                params: {
                  amount: collaboration.creatorPrice,
                  currency: collaboration.currency,
                  method: dto.method,
                },
                creatorUserId: loadedCollab.creator.userId,
                collaborationId: collaboration.id,
                campaignId: collaboration.campaignId,
                deepLinkByRole: {
                  creator: {
                    stack: 'EarningsTab',
                    screen: 'Earnings',
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
            `Failed to record payout_sent notification: ${message}`,
          );
        }

        this.logger.log(
          `Collaboration ${saved.id} marked paid by admin ${adminUserId}`,
        );
        return {
          result: {
            transactionId: transaction.id,
            collaborationStatus: saved.status,
          },
          notifications,
        };
      });

      if (txResult.notifications?.length) {
        await this.notificationsService.push(txResult.notifications);
      }

      return txResult.result;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'already_paid',
          'This collaboration has already been paid',
        );
      }
      throw error;
    }
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
