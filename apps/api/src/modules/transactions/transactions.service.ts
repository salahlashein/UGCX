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

  /** REQ-002: recorded once the webhook confirms Paymob's charge succeeded. */
  async recordHold(
    collaborationId: string,
    amount: string,
    currency: string,
    paymobReference: string,
    manager: EntityManager,
  ): Promise<Transaction> {
    return this.insert(
      manager,
      {
        collaborationId,
        type: TransactionType.HOLD,
        amount,
        currency,
        paymobReference,
      },
      collaborationId,
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
    collaborationId: string,
  ): Promise<Transaction> {
    const repository = manager.getRepository(Transaction);
    const transaction = repository.create(fields);
    const saved = await repository.save(transaction);
    // LOG-02: one structured line per Transaction insert.
    this.logger.log(
      `Transaction recorded: collaborationId=${collaborationId} type=${saved.type} amount=${saved.amount} correlationId=${randomUUID()}`,
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
}
