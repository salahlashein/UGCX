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

/** TASK-P1-010 */
@Injectable()
export class AdminPayoutsService {
  private readonly logger = new Logger(AdminPayoutsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly collaborationsService: CollaborationsService,
    private readonly transactionsService: TransactionsService,
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
      return await this.dataSource.transaction(async (manager) => {
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

        this.logger.log(
          `Collaboration ${saved.id} marked paid by admin ${adminUserId}`,
        );
        return {
          transactionId: transaction.id,
          collaborationStatus: saved.status,
        };
      });
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
