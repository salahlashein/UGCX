import {
  ForbiddenException,
  forwardRef,
  HttpStatus,
  Inject,
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
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { ProposalStatus } from '../proposals/entities/proposal.entity';
import { ProposalsService } from '../proposals/proposals.service';
import { BrandsService } from '../brands/brands.service';
import { CreatorsService } from '../creators/creators.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymobClient } from '../payments/paymob.client';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { EscrowService } from '../escrow/escrow.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { centsToAmount, toCents } from '../../common/utils/money';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import { ConfirmShipmentDto } from './dto/confirm-shipment.dto';
import { computeDueAt } from './due-at';
import { Deliverable, DeliverableStatus } from '../deliverables/entities/deliverable.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';

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
    private readonly escrowService: EscrowService,
    @Inject(forwardRef(() => MessagesService))
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
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
  /**
   * TASK-P2-08, REQ-207, REQ-402, GUD-201, GUD-401.
   * Allocates escrow from the campaign to the collaboration inside one transaction.
   * Emits escrow_funded notification to both brand and creator.
   */
  async acceptProposal(
    userId: string,
    proposalId: string,
  ): Promise<{ collaboration: Collaboration; checkoutUrl: string | null }> {
    const brand = await this.brandsService.findByUserId(userId);
    const proposal = await this.proposalsService.findById(proposalId);

    if (proposal.campaign.brandId !== brand.id) {
      throw new NotFoundException('Proposal not found');
    }
    if (
      proposal.status !== ProposalStatus.APPLIED &&
      proposal.status !== ProposalStatus.SHORTLISTED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Only an applied or shortlisted proposal can be accepted',
      );
    }

    if (proposal.campaign.status !== CampaignStatus.LIVE) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'campaign_not_open',
        'Campaign is not live',
      );
    }

    const { priceCents, feeCents, totalCents } = this.escrowService.quote(
      proposal.price,
    );

    const { collaboration, notifications } = await this.dataSource.transaction(
      async (manager) => {
        let collab: Collaboration;
        try {
          collab = await manager.getRepository(Collaboration).save(
            manager.getRepository(Collaboration).create({
              campaignId: proposal.campaignId,
              proposalId: proposal.id,
              brandId: brand.id,
              creatorId: proposal.creatorId,
              creatorPrice: centsToAmount(priceCents),
              platformFee: centsToAmount(feeCents),
              totalAmount: centsToAmount(totalCents),
              currency: proposal.currency,
              status: CollaborationStatus.FUNDED,
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

        await this.escrowService.allocate(
          proposal.campaignId,
          collab.id,
          proposal.price,
          proposal.currency,
          manager,
        );

        await this.proposalsService.markAccepted(proposal.id, manager);

        // System chat message
        await this.messagesService.createSystemMessage(
          collab.id,
          {
            event: 'escrow_funded',
            params: {
              total: collab.totalAmount,
              creatorPrice: collab.creatorPrice,
            },
          },
          manager,
        );

        // Notifications for brand & creator
        const notifs = await this.notificationsService.record(
          {
            event: 'escrow_funded',
            params: {
              total: collab.totalAmount,
              creatorPrice: collab.creatorPrice,
              currency: collab.currency,
              title: proposal.campaign.title,
            },
            brandId: brand.id,
            creatorUserId: proposal.creator?.userId,
            collaborationId: collab.id,
            campaignId: proposal.campaignId,
            deepLinkByRole: {
              brand: {
                stack: 'BriefsTab',
                screen: 'CollaborationDetail',
                params: { id: collab.id },
              },
              creator: {
                stack: 'WorkTab',
                screen: 'WorkStatus',
                params: { id: collab.id },
              },
            },
          },
          manager,
        );

        return { collaboration: collab, notifications: notifs };
      },
    );

    // GUD-401, REQ-403: Push after transaction commit
    await this.notificationsService.push(notifications);

    this.logger.log(
      `Collaboration ${collaboration.id} created and funded from campaign ${proposal.campaignId} escrow for proposal ${proposal.id}`,
    );

    return { collaboration, checkoutUrl: null };
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

    const { saved, notifications } = await this.dataSource.transaction(
      async (manager) => {
        const repo = manager.getRepository(Collaboration);
        const savedCollab = await repo.save(collaboration);

        // System message in chat
        await this.messagesService.createSystemMessage(
          savedCollab.id,
          {
            event: 'shipment_confirmed',
            params: {},
          },
          manager,
        );

        // Creator notification
        const notifs = await this.notificationsService.record(
          {
            event: 'shipment_confirmed',
            params: {
              brandName: collaboration.brand?.companyName ?? 'Brand',
              title: collaboration.campaign?.title ?? 'Brief',
            },
            creatorUserId: collaboration.creator?.userId,
            collaborationId: savedCollab.id,
            campaignId: savedCollab.campaignId,
            deepLinkByRole: {
              creator: {
                stack: 'WorkTab',
                screen: 'WorkStatus',
                params: { id: savedCollab.id },
              },
            },
          },
          manager,
        );

        return { saved: savedCollab, notifications: notifs };
      },
    );

    await this.notificationsService.push(notifications);

    this.logger.log(`Collaboration ${saved.id} shipped`);
    return saved;
  }

  /** TASK-W4-02: creator confirms receipt of shipped product. */
  async confirmReceipt(
    userId: string,
    collaborationId: string,
  ): Promise<Collaboration> {
    const collaboration = await this.findOwnedByCreator(userId, collaborationId);
    if (collaboration.status !== CollaborationStatus.SHIPPED) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'Receipt can only be confirmed on a shipped collaboration',
      );
    }
    if (collaboration.receivedAt) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'already_received',
        'Product receipt has already been confirmed',
      );
    }

    collaboration.receivedAt = new Date();

    const { saved, notifications } = await this.dataSource.transaction(
      async (manager) => {
        const repo = manager.getRepository(Collaboration);
        const savedCollab = await repo.save(collaboration);

        // System message in chat
        await this.messagesService.createSystemMessage(
          savedCollab.id,
          {
            event: 'shipment_received',
            params: {},
          },
          manager,
        );

        // Notification to brand owners & approvers
        const notifs = await this.notificationsService.record(
          {
            event: 'shipment_received',
            params: {
              creatorName: collaboration.creator?.displayName ?? 'Creator',
              title: collaboration.campaign?.title ?? 'Brief',
            },
            brandId: collaboration.brandId,
            collaborationId: savedCollab.id,
            campaignId: savedCollab.campaignId,
            deepLinkByRole: {
              brand: {
                stack: 'BriefsTab',
                screen: 'CollaborationDetail',
                params: { id: savedCollab.id },
              },
            },
          },
          manager,
        );

        return { saved: savedCollab, notifications: notifs };
      },
    );

    await this.notificationsService.push(notifications);

    this.logger.log(`Collaboration ${saved.id} receipt confirmed by creator`);
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
      collaboration.status !== CollaborationStatus.REVISION_REQUESTED &&
      collaboration.status !== CollaborationStatus.FUNDED
    ) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'invalid_state_transition',
        'A deliverable can only be registered once the collaboration is funded, shipped, or awaiting a revision',
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
      relations: { campaign: true, creator: true, brand: true, proposal: true },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    const [enriched] = await this.enrichCollaborations([collaboration]);
    return enriched;
  }

  /** SEC-001: 404s if the collaboration is not owned by this creator. */
  async findOwnedByCreator(userId: string, id: string): Promise<Collaboration> {
    const creator = await this.creatorsService.findByUserId(userId);
    const collaboration = await this.collaborationsRepository.findOne({
      where: { id, creatorId: creator.id },
      // campaign.needsShipping drives the upload check. brand and product give the names.
      relations: { campaign: { product: true }, brand: true, proposal: true },
    });
    if (!collaboration) {
      throw new NotFoundException('Collaboration not found');
    }
    const [enriched] = await this.enrichCollaborations([
      this.withPublicParties(collaboration),
    ]);
    return enriched;
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

    const [items, total] = await this.collaborationsRepository.findAndCount({
      where,
      relations: { brand: true, creator: true, campaign: { product: true }, proposal: true },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    const enriched = await this.enrichCollaborations(
      items.map((item) => this.withPublicParties(item)),
    );
    return [enriched, total];
  }

  /** TASK-W4-01, TASK-W4-02, TASK-W4-03: adds revisionsUsed, revisionLimit, dueAt, approvedAt, paidAt. */
  async enrichCollaborations(items: Collaboration[]): Promise<Collaboration[]> {
    if (!items || items.length === 0) return items;
    const ids = items.map((i) => i.id);

    const revMap = new Map<string, number>();
    const releaseMap = new Map<string, string>();
    const payoutMap = new Map<string, string>();

    try {
      if (typeof this.dataSource?.getRepository === 'function') {
        const deliverableRepo = this.dataSource.getRepository(Deliverable);
        if (deliverableRepo && typeof deliverableRepo.createQueryBuilder === 'function') {
          const revRows = await deliverableRepo
            .createQueryBuilder('d')
            .select('d.collaboration_id', 'collaborationId')
            .addSelect('COUNT(*)', 'count')
            .where('d.collaboration_id IN (:...ids)', { ids })
            .andWhere('d.status = :status', {
              status: DeliverableStatus.REVISION_REQUESTED,
            })
            .groupBy('d.collaboration_id')
            .getRawMany();
          for (const r of revRows) {
            revMap.set(r.collaborationId, parseInt(r.count, 10));
          }
        }

        const transactionRepo = this.dataSource.getRepository(Transaction);
        if (transactionRepo && typeof transactionRepo.createQueryBuilder === 'function') {
          const txRows = await transactionRepo
            .createQueryBuilder('t')
            .select('t.collaboration_id', 'collaborationId')
            .addSelect('t.type', 'type')
            .addSelect('t.created_at', 'createdAt')
            .where('t.collaboration_id IN (:...ids)', { ids })
            .andWhere('t.type IN (:...types)', {
              types: [TransactionType.RELEASE, TransactionType.PAYOUT],
            })
            .andWhere('t.status = :txStatus', {
              txStatus: TransactionStatus.COMPLETED,
            })
            .getRawMany();
          for (const tx of txRows) {
            const iso =
              tx.createdAt instanceof Date
                ? tx.createdAt.toISOString()
                : new Date(tx.createdAt).toISOString();
            if (tx.type === TransactionType.RELEASE) {
              releaseMap.set(tx.collaborationId, iso);
            } else if (tx.type === TransactionType.PAYOUT) {
              payoutMap.set(tx.collaborationId, iso);
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to enrich collaborations: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    for (const item of items) {
      item.revisionsUsed = revMap.get(item.id) ?? 0;
      item.revisionLimit = item.campaign?.revisionLimit ?? 2;
      item.dueAt = computeDueAt(item, item.campaign, item.proposal);
      item.approvedAt = releaseMap.get(item.id) ?? null;
      item.paidAt = payoutMap.get(item.id) ?? null;
    }

    return items;
  }

  /**
   * Keeps only the fields the other side may read: the brand's name and logo,
   * the creator's name and city. Private fields such as the business document
   * URL and the vetting data never leave the API.
   */
  private withPublicParties(collaboration: Collaboration): Collaboration {
    const { brand, creator } = collaboration;
    return {
      ...collaboration,
      brand: brand
        ? ({
            id: brand.id,
            companyName: brand.companyName,
            logoUrl: brand.logoUrl,
            country: brand.country,
          } as Collaboration['brand'])
        : brand,
      creator: creator
        ? ({
            id: creator.id,
            displayName: creator.displayName,
            city: creator.city,
          } as Collaboration['creator'])
        : creator,
    } as Collaboration;
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
