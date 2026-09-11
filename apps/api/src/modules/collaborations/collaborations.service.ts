import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { AppConfig } from '../../config/configuration';
import {
  Collaboration,
  CollaborationStatus,
} from './entities/collaboration.entity';
import { ProposalStatus } from '../proposals/entities/proposal.entity';
import { ProposalsService } from '../proposals/proposals.service';
import { BrandsService } from '../brands/brands.service';
import { CreatorsService } from '../creators/creators.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymobClient } from '../payments/paymob.client';
import { PaymentProviderError } from '../payments/payment-provider.error';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import {
  calculateFeeCents,
  centsToAmount,
  toCents,
} from '../../common/utils/money';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { ConfirmShipmentDto } from './dto/confirm-shipment.dto';

// EDGE-P1-006: every status from 'funded' onward in the escrow state
// machine; chat is not available before that.
const CHAT_ELIGIBLE_STATUSES = new Set<CollaborationStatus>([
  CollaborationStatus.FUNDED,
  CollaborationStatus.SHIPPED,
  CollaborationStatus.DELIVERED,
  CollaborationStatus.REVISION_REQUESTED,
  CollaborationStatus.APPROVED,
  CollaborationStatus.PAID,
]);

@Injectable()
export class CollaborationsService {
  private readonly logger = new Logger(CollaborationsService.name);

  constructor(
    @InjectRepository(Collaboration)
    private readonly collaborationsRepository: Repository<Collaboration>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AppConfig>,
    private readonly proposalsService: ProposalsService,
    private readonly brandsService: BrandsService,
    private readonly creatorsService: CreatorsService,
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly paymobClient: PaymobClient,
  ) {}

  /**
   * REQ-001/TASK-P1-004/EDGE-P1-001.
   *
   * H2: the Collaboration insert and the Paymob call are deliberately NOT
   * wrapped in one open DB transaction - holding a transaction (and the
   * pooled connection under it) open across an untimed, sequential
   * three-call HTTP round trip lets one hung Paymob connection exhaust the
   * connection pool under concurrent accepts, taking down endpoints that
   * have nothing to do with payments. Instead:
   *   1. Insert the Collaboration (pending_payment) in one short statement.
   *   2. Call Paymob with no DB transaction open.
   *   3a. On success, update the row with the paymob_order_id.
   *   3b. On failure, delete the row we just inserted (a compensating
   *       action) so the unique constraint on proposal_id does not block
   *       a retry, and translate the error to a clean 502.
   * Trade-off: a process crash between 2 and 3a can leave an orphaned
   * pending_payment row with no paymob_order_id that the webhook can never
   * match. That is judged safer than pinning a DB connection for up to
   * REQUEST_TIMEOUT_MS x 3 per accept; EDGE-P1-002-style manual review
   * already exists for orphaned webhook deliveries and covers this too.
   */
  async acceptProposal(
    userId: string,
    proposalId: string,
  ): Promise<{ collaboration: Collaboration; checkoutUrl: string }> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsService.findById(proposalId);

    if (proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }
    if (proposal.status !== ProposalStatus.APPLIED) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Only an applied proposal can be accepted',
      );
    }

    const creatorPriceCents = toCents(proposal.price);
    const platformFeeRate =
      this.configService.get('platformFeeRate', {
        infer: true,
      }) ?? 0.1;
    const platformFeeCents = calculateFeeCents(
      creatorPriceCents,
      platformFeeRate,
    );
    const totalCents = creatorPriceCents + platformFeeCents;

    const brandUser = await this.usersService.findById(brand.userId);
    if (!brandUser) {
      throw new NotFoundException('Brand account not found');
    }

    // Step 1: a single-row insert, its own implicit short transaction.
    let collaboration: Collaboration;
    try {
      collaboration = await this.collaborationsRepository.save(
        this.collaborationsRepository.create({
          campaignId: proposal.campaignId,
          proposalId: proposal.id,
          brandId: brand.id,
          creatorId: proposal.creatorId,
          creatorPrice: proposal.price,
          platformFee: centsToAmount(platformFeeCents),
          totalAmount: centsToAmount(totalCents),
          currency: proposal.currency,
          status: CollaborationStatus.PENDING_PAYMENT,
        }),
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'collaboration_already_exists',
          'This proposal was already accepted',
        );
      }
      throw error;
    }

    // Step 2: the untimed-from-our-side (but now client-timed) external
    // call, with no DB transaction open.
    let checkout;
    try {
      checkout = await this.paymobClient.createCheckout(
        totalCents,
        collaboration.id,
        {
          firstName: brandUser.email
            ? brandUser.email.split('@')[0]
            : 'BrandUser',
          lastName: 'Brand',
          email: brandUser.email || 'billing@ugcx.com',
          phoneNumber: brandUser.phone,
        },
      );
    } catch (error) {
      // Step 3b: compensate by removing the orphaned pending_payment row.
      await this.collaborationsRepository.delete(collaboration.id);
      if (error instanceof PaymentProviderError) {
        throw new DomainErrorException(
          HttpStatus.BAD_GATEWAY,
          'payment_provider_error',
          'Payment provider is unavailable, please try again',
        );
      }
      throw error;
    }

    // Step 3a: a single-row update, its own implicit short transaction.
    collaboration.paymobOrderId = checkout.paymobOrderId;
    const saved = await this.collaborationsRepository.save(collaboration);

    this.logger.log(
      `Collaboration ${saved.id} created pending_payment for proposal ${proposal.id}`,
    );
    return { collaboration: saved, checkoutUrl: checkout.checkoutUrl };
  }

  /**
   * REQ-002/REQ-003/REQ-005/EDGE-P1-002: applies the outcome of a
   * signature-verified Paymob webhook. Resolves normally (does not throw)
   * for every *expected* outcome - unknown order, replay, stale/out-of-
   * order delivery, amount mismatch, refund/void/pending - so the
   * controller can always answer Paymob with 200 and Paymob stops
   * retrying. A genuinely unexpected DB error still propagates.
   *
   * C2: a success delivered while the collaboration is PAYMENT_FAILED is
   * accepted, not dropped - Paymob's own checkout session lets a brand
   * retry a failed card inside the same order, so a later success for the
   * same paymob_order_id is a real, valid funding event, not a replay.
   */
  async applyPaymentWebhook(params: {
    paymobOrderId: string;
    paymobTransactionId: string;
    success: boolean;
    amountCents: number;
    currency: string;
    isRefunded: boolean;
    isVoided: boolean;
    pending: boolean;
    errorOccured: boolean;
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
    } = params;

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Collaboration);
      const collaboration = await repository.findOne({
        where: { paymobOrderId },
      });

      if (!collaboration) {
        // EDGE-P1-002: out-of-order delivery. Do not error - Paymob would
        // otherwise retry indefinitely - just flag it for manual review.
        this.logger.warn(
          `Paymob webhook for unknown paymob_order_id=${paymobOrderId}`,
        );
        return;
      }

      if (success) {
        // REQ-005: idempotency keyed on Paymob's transaction id.
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

        // C2: PENDING_PAYMENT is the normal path; PAYMENT_FAILED is a
        // legitimate late/retried success for the same order id.
        if (
          collaboration.status !== CollaborationStatus.PENDING_PAYMENT &&
          collaboration.status !== CollaborationStatus.PAYMENT_FAILED
        ) {
          this.logger.warn(
            `Ignoring funded webhook for collaboration ${collaboration.id} already in status ${collaboration.status}`,
          );
          return;
        }

        // H1: the webhook is signed, but a signature only proves Paymob
        // sent it - it does not prove it describes *this* charge. Refuse
        // to fund on a refunded/voided/pending/errored transaction, or one
        // whose amount/currency does not match what this collaboration
        // was actually charged.
        if (isRefunded || isVoided || pending || errorOccured) {
          this.logger.warn(
            `Ignoring success webhook for collaboration ${collaboration.id}: ` +
              `isRefunded=${isRefunded} isVoided=${isVoided} pending=${pending} errorOccured=${errorOccured}`,
          );
          return;
        }
        const expectedAmountCents = toCents(collaboration.totalAmount);
        if (
          amountCents !== expectedAmountCents ||
          currency !== collaboration.currency
        ) {
          this.logger.warn(
            `Ignoring success webhook for collaboration ${collaboration.id}: ` +
              `amount/currency mismatch (expected ${expectedAmountCents} ${collaboration.currency}, got ${amountCents} ${currency})`,
          );
          return;
        }

        collaboration.status = CollaborationStatus.FUNDED;
        await repository.save(collaboration);
        await this.proposalsService.markAccepted(
          collaboration.proposalId,
          manager,
        );
        try {
          await this.transactionsService.recordHold(
            collaboration.id,
            collaboration.totalAmount,
            collaboration.currency,
            paymobTransactionId,
            manager,
          );
        } catch (error) {
          // M6-adjacent (kept minimal, in scope per H3 review note): two
          // simultaneous deliveries of the same transaction id both pass
          // the findByPaymobReference check above; the DB's unique
          // constraint on paymob_reference is the real guarantee. Treat a
          // unique violation here the same as the replay case above.
          if (this.isUniqueViolation(error)) {
            this.logger.log(
              `Ignoring concurrently-replayed webhook for paymob transaction ${paymobTransactionId}`,
            );
            return;
          }
          throw error;
        }
        this.logger.log(`Collaboration ${collaboration.id} funded`);
        return;
      }

      // REQ-003: proposal status is left untouched.
      if (collaboration.status !== CollaborationStatus.PENDING_PAYMENT) {
        return;
      }
      collaboration.status = CollaborationStatus.PAYMENT_FAILED;
      await repository.save(collaboration);
      this.logger.log(`Collaboration ${collaboration.id} payment failed`);
    });
  }

  /** REQ-006: brand-only, requires status funded. */
  async confirmShipment(
    userId: string,
    collaborationId: string,
    dto: ConfirmShipmentDto,
  ): Promise<Collaboration> {
    const collaboration = await this.findOwnedByBrand(userId, collaborationId);
    if (collaboration.status !== CollaborationStatus.FUNDED) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Shipment can only be confirmed on a funded collaboration',
      );
    }

    collaboration.shipmentCarrier = dto.carrier;
    collaboration.shipmentTrackingNumber = dto.trackingNumber;
    collaboration.shipmentConfirmedAt = new Date();
    collaboration.status = CollaborationStatus.SHIPPED;
    const saved = await this.collaborationsRepository.save(collaboration);
    this.logger.log(`Collaboration ${saved.id} shipped`);
    return saved;
  }

  /**
   * REQ-007: allowed from 'shipped' (first delivery) or
   * 'revision_requested' (creator re-delivers, see the escrow state
   * machine) - EDGE-P1-004-style explicit check, not implicit from a DB
   * constraint alone.
   */
  async transitionToDelivered(
    collaborationId: string,
    manager: EntityManager,
  ): Promise<Collaboration> {
    const repository = manager.getRepository(Collaboration);
    const collaboration = await repository.findOne({
      where: { id: collaborationId },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    if (
      collaboration.status !== CollaborationStatus.SHIPPED &&
      collaboration.status !== CollaborationStatus.REVISION_REQUESTED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'A deliverable can only be registered once the collaboration has shipped or is awaiting a revision',
      );
    }
    collaboration.status = CollaborationStatus.DELIVERED;
    return repository.save(collaboration);
  }

  /** EDGE-P1-004: the state guard TASK-P1-008's review endpoint requires. */
  async requireDelivered(
    collaborationId: string,
    manager: EntityManager,
  ): Promise<Collaboration> {
    const collaboration = await manager
      .getRepository(Collaboration)
      .findOne({ where: { id: collaborationId } });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    if (collaboration.status !== CollaborationStatus.DELIVERED) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'A deliverable can only be reviewed on a delivered collaboration',
      );
    }
    return collaboration;
  }

  async markApproved(
    collaboration: Collaboration,
    manager: EntityManager,
  ): Promise<Collaboration> {
    collaboration.status = CollaborationStatus.APPROVED;
    return manager.getRepository(Collaboration).save(collaboration);
  }

  async markRevisionRequested(
    collaboration: Collaboration,
    manager: EntityManager,
  ): Promise<Collaboration> {
    collaboration.status = CollaborationStatus.REVISION_REQUESTED;
    return manager.getRepository(Collaboration).save(collaboration);
  }

  /** REQ-010: called by AdminPayoutsService inside its own transaction. */
  async markPaid(
    collaboration: Collaboration,
    manager: EntityManager,
  ): Promise<Collaboration> {
    collaboration.status = CollaborationStatus.PAID;
    return manager.getRepository(Collaboration).save(collaboration);
  }

  /** TASK-P1-010: the admin payout queue. */
  async listApprovedAwaitingPayout(
    page: number,
    perPage: number,
  ): Promise<[Collaboration[], number]> {
    return this.collaborationsRepository
      .createQueryBuilder('collaboration')
      .leftJoin(
        'transactions',
        'payout',
        'payout.collaboration_id = collaboration.id AND payout.type = :payoutType',
        { payoutType: 'payout' },
      )
      .where('collaboration.status = :status', {
        status: CollaborationStatus.APPROVED,
      })
      .andWhere('payout.id IS NULL')
      .orderBy('collaboration.updated_at', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();
  }

  async findById(id: string): Promise<Collaboration> {
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    return collaboration;
  }

  /** SEC-001-style: 404s if the collaboration is not owned by this brand. */
  async findOwnedByBrand(userId: string, id: string): Promise<Collaboration> {
    const brand = await this.brandsService.findByUserId(userId);
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id, brandId: brand.id },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    return collaboration;
  }

  /** SEC-001: 404s if the collaboration is not owned by this creator. */
  async findOwnedByCreator(userId: string, id: string): Promise<Collaboration> {
    const creator = await this.creatorsService.findByUserId(userId);
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id, creatorId: creator.id },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    return collaboration;
  }

  /**
   * feature_mobile_app_phase1 addendum: dispatches to the role-appropriate
   * ownership check. Required for REQ-005's status poll and
   * TASK-P1-008/creator "My Collaborations" screens, neither of which have
   * any other way to read a single collaboration's current status.
   */
  async findOwnedByUser(user: AuthUser, id: string): Promise<Collaboration> {
    return user.role === UserRole.BRAND
      ? this.findOwnedByBrand(user.userId, id)
      : this.findOwnedByCreator(user.userId, id);
  }

  /** feature_mobile_app_phase1 addendum: list endpoint backing "My Collaborations". */
  async listMine(
    user: AuthUser,
    page: number,
    perPage: number,
  ): Promise<[Collaboration[], number]> {
    const where =
      user.role === UserRole.BRAND
        ? { brandId: (await this.brandsService.findByUserId(user.userId)).id }
        : {
            creatorId: (await this.creatorsService.findByUserId(user.userId))
              .id,
          };

    return this.collaborationsRepository.findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }

  /**
   * REQ-011: unlike the 404-for-cross-tenant pattern used elsewhere, the
   * chat Gherkin scenario explicitly requires 403 for a non-participant,
   * since a third party should not be told whether the collaboration
   * exists either way is not the concern here - only that they cannot
   * open the channel.
   */
  async requireParticipant(user: AuthUser, id: string): Promise<Collaboration> {
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id },
      relations: { brand: true, creator: true },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }

    const isBrand =
      user.role === UserRole.BRAND &&
      collaboration.brand.userId === user.userId;
    const isCreator =
      user.role === UserRole.CREATOR &&
      collaboration.creator.userId === user.userId;
    if (!isBrand && !isCreator) {
      throw new ForbiddenException(
        'You are not a participant in this collaboration',
      );
    }
    return collaboration;
  }

  /**
   * EDGE-P1-006: chat opens only once a collaboration is funded, so a
   * creator cannot be contacted before payment is secured.
   */
  isChatEligible(collaboration: Collaboration): boolean {
    return CHAT_ELIGIBLE_STATUSES.has(collaboration.status);
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
