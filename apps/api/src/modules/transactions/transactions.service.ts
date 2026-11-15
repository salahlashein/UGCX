import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  PayoutMethod,
  Transaction,
  TransactionType,
} from './entities/transaction.entity';

/**
 * The escrow ledger's write path. Each method is single-purpose (one
 * business event, one Transaction row) per this plan's design note, rather
 * than a generic "insert transaction" method (clean-code SMELL-01).
 * Every insert takes the caller's EntityManager so it commits atomically
 * with the collaboration/proposal state change it accompanies (GEN-09).
 */
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  /** REQ-205: recorded once a webhook confirms a campaign funding charge. */
  async recordCharge(
    campaignId: string,
    amount: string,
    currency: string,
    paymobReference: string,
    manager: EntityManager,
    paymentMethodLabel?: string | null,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      {
        campaignId,
        type: TransactionType.CHARGE,
        amount,
        currency,
        paymobReference,
        paymentMethodLabel: paymentMethodLabel ?? null,
      },
      null,
      campaignId,
    );
  }

  /** REQ-210: recorded once Paymob confirms a refund of unallocated escrow. */
  async recordRefund(
    campaignId: string,
    amount: string,
    currency: string,
    paymobReference: string,
    parentTransactionId: string,
    manager: EntityManager,
    paymentMethodLabel?: string | null,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      {
        campaignId,
        type: TransactionType.REFUND,
        amount,
        currency,
        paymobReference,
        parentTransactionId,
        paymentMethodLabel: paymentMethodLabel ?? null,
      },
      null,
      campaignId,
    );
  }

  /**
   * REQ-207: a hold now carries the campaign as well as the collaboration.
   * paymobReference is nullable for the campaign escrow allocation path.
   */
  async recordHold(
    collaborationId: string,
    amount: string,
    currency: string,
    paymobReference: string | null,
    manager: EntityManager,
    campaignId?: string | null,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      {
        collaborationId,
        campaignId: campaignId ?? null,
        type: TransactionType.HOLD,
        amount,
        currency,
        paymobReference,
      },
      collaborationId,
      campaignId ?? null,
    );
  }

  /** REQ-008: recorded when the brand approves the delivered work. */
  async recordRelease(
    collaborationId: string,
    amount: string,
    currency: string,
    manager: EntityManager,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      { collaborationId, type: TransactionType.RELEASE, amount, currency },
      collaborationId,
    );
  }

  /**
   * M3: recorded alongside recordRelease, for the platform's retained
   * cut. release(totalAmount) = payout(creatorPrice) + fee(platformFee).
   */
  async recordFee(
    collaborationId: string,
    amount: string,
    currency: string,
    manager: EntityManager,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      { collaborationId, type: TransactionType.FEE, amount, currency },
      collaborationId,
    );
  }

  /** REQ-010: recorded when an admin marks a collaboration's payout as paid. */
  async recordPayout(
    collaborationId: string,
    amount: string,
    currency: string,
    adminUserId: string,
    evidence: { method: PayoutMethod; reference: string; paidAt: Date },
    manager: EntityManager,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      {
        collaborationId,
        type: TransactionType.PAYOUT,
        amount,
        currency,
        recordedByUserId: adminUserId,
        payoutMethod: evidence.method,
        payoutReference: evidence.reference,
        paidAt: evidence.paidAt,
      },
      collaborationId,
    );
  }

  private async insert(
    manager: EntityManager,
    fields: Partial<Transaction>,
    collaborationId: string | null,
    campaignId?: string | null,
  ): Promise<Transaction> {
    const repository = manager.getRepository(Transaction);
    const transaction = repository.create(fields);
    const saved = await repository.save(transaction);
    // LOG-02: one structured line per Transaction insert.
    this.logger.log(
      `Transaction recorded: collaborationId=${collaborationId} campaignId=${campaignId ?? saved.campaignId} type=${saved.type} amount=${saved.amount} correlationId=${randomUUID()}`,
    );
    return saved;
  }

  /** REQ-005: the idempotency check a webhook handler runs before insert. */
  async findByPaymobReference(
    paymobReference: string,
    manager?: EntityManager,
  ): Promise<Transaction | null> {
    const repository = manager
      ? manager.getRepository(Transaction)
      : this.transactionsRepository;
    return repository.findOne({ where: { paymobReference } });
  }

  /** REQ-210: finds the newest charge row for a campaign to refund against. */
  async findLatestChargeForCampaign(
    campaignId: string,
    manager?: EntityManager,
  ): Promise<Transaction | null> {
    const repository = manager
      ? manager.getRepository(Transaction)
      : this.transactionsRepository;
    return repository.findOne({
      where: {
        campaignId,
        type: TransactionType.CHARGE,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
