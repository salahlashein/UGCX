import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Deliverable, DeliverableStatus } from './entities/deliverable.entity';
import { DeliverableFeedback } from './entities/deliverable-feedback.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BrandsService } from '../brands/brands.service';
import { R2StorageClient } from '../storage/r2-storage.client';

import { RegisterDeliverableDto } from './dto/register-deliverable.dto';
import { ReviewDeliverableDto } from './dto/review-deliverable.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

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
    private readonly r2StorageClient: R2StorageClient,
  ) {}

  /**
   * REQ-007/SEC-001: creator must own the collaboration, and the fileUrl
   * must belong to this collaboration's presigned-URL namespace (the
   * practical stand-in for "a previously-issued upload URL", since
   * presigned URLs are not tracked statefully - EDGE-P1-003).
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

    // M2: an origin check (startsWith the configured R2/CDN base), not a
    // substring check - `.includes()` would accept an attacker-hosted URL
    // that merely contains the right path segment.
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

    return this.dataSource.transaction(async (manager) => {
      await this.collaborationsService.transitionToDelivered(
        collaborationId,
        manager,
      );

      const repository = manager.getRepository(Deliverable);
      const deliverable = repository.create({
        collaborationId,
        type: dto.type,
        fileUrl: dto.fileUrl,
        durationSeconds: dto.durationSeconds ?? null,
        status: DeliverableStatus.SUBMITTED,
      });
      const saved = await repository.save(deliverable);
      this.logger.log(
        `Deliverable ${saved.id} registered for collaboration ${collaborationId}`,
      );
      return saved;
    });
  }

  /**
   * feature_mobile_app_phase1 addendum: backs TASK-P1-008's deliverable
   * review actions, which otherwise have no way to discover a deliverable
   * id to review. Either participant may read the list; the
   * findOwnedByUser check 404s a non-participant the same way every other
   * cross-tenant read in this module already does.
   */
  async listForCollaboration(
    user: AuthUser,
    collaborationId: string,
  ): Promise<Deliverable[]> {
    await this.collaborationsService.findOwnedByUser(user, collaborationId);
    return this.deliverablesRepository.find({
      where: { collaborationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * TASK-P1-008: approve triggers REQ-008 (release), request_revision
   * triggers REQ-009; decline is treated the same as request_revision at
   * the collaboration level (the escrow state machine only has two
   * branches out of 'delivered' - see plan.md), but keeps its own
   * Deliverable status for history.
   */
  async review(
    userId: string,
    deliverableId: string,
    dto: ReviewDeliverableDto,
  ): Promise<{
    id: string;
    status: DeliverableStatus;
    collaborationStatus: string;
  }> {
    const deliverable = await this.deliverablesRepository.findOne({
      where: { id: deliverableId },
      relations: { collaboration: true },
    });
    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    const brand = await this.brandsService.findByUserId(userId);
    if (deliverable.collaboration.brandId !== brand.id) {
      throw new NotFoundException('Deliverable not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const collaboration = await this.collaborationsService.requireDelivered(
        deliverable.collaborationId,
        manager,
      );
      const repository = manager.getRepository(Deliverable);

      if (dto.action === 'approve') {
        deliverable.status = DeliverableStatus.APPROVED;
        await repository.save(deliverable);
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
      }

      this.logger.log(
        `Deliverable ${deliverable.id} reviewed: action=${dto.action}`,
      );
      return {
        id: deliverable.id,
        status: deliverable.status,
        collaborationStatus: collaboration.status,
      };
    });
  }
}
