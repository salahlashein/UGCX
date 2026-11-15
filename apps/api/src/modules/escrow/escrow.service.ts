import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { TransactionsService } from '../transactions/transactions.service';
import {
  calculateFeeCents,
  centsToAmount,
  toCents,
} from '../../common/utils/money';
import { InsufficientEscrowError } from './escrow.errors';

export interface AllocationResult {
  creatorPrice: string;
  platformFee: string;
  totalAmount: string;
  currency: string;
  holdTransactionId: string;
}

export interface EscrowBalance {
  funded: string;
  allocated: string;
  refunded: string;
  available: string;
  currency: string;
  fundingInProgress: boolean;
  refundPending: boolean;
}

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
    private readonly transactionsService: TransactionsService,
    private readonly configService: ConfigService,
  ) {}

  /** Computes the price split without touching the database. */
  quote(creatorPrice: string): {
    priceCents: number;
    feeCents: number;
    totalCents: number;
  } {
    const priceCents = toCents(creatorPrice);
    const platformFeeRate =
      this.configService.get<number>('platformFeeRate') ?? 0.1;
    const feeCents = calculateFeeCents(priceCents, platformFeeRate);
    const totalCents = priceCents + feeCents;
    return { priceCents, feeCents, totalCents };
  }

  /** Reads the three counters plus the derived available balance. */
  async getBalance(campaignId: string): Promise<EscrowBalance> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    const availableCents = campaign.availableEscrowCents();
    return {
      funded: campaign.escrowFundedAmount || '0.00',
      allocated: campaign.escrowAllocatedAmount || '0.00',
      refunded: campaign.escrowRefundedAmount || '0.00',
      available: centsToAmount(availableCents),
      currency: campaign.currency,
      fundingInProgress: Boolean(campaign.fundingPaymobOrderId),
      refundPending: campaign.refundPending,
    };
  }

  /**
   * REQ-207. Locks the campaign row, checks the balance, records one hold,
   * and increases escrow_allocated_amount. Runs inside the caller's manager.
   * Throws InsufficientEscrowError with the shortfall when the balance is short.
   */
  async allocate(
    campaignId: string,
    collaborationId: string,
    creatorPrice: string,
    currency: string,
    manager: EntityManager,
  ): Promise<AllocationResult> {
    const campaignRepo = manager.getRepository(Campaign);
    const campaign = await campaignRepo.findOne({
      where: { id: campaignId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const priceCents = toCents(creatorPrice);
    const platformFeeRate =
      this.configService.get<number>('platformFeeRate') ?? 0.1;
    const feeCents = calculateFeeCents(priceCents, platformFeeRate);
    const totalCents = priceCents + feeCents;

    const availableCents = campaign.availableEscrowCents();
    if (totalCents > availableCents) {
      throw new InsufficientEscrowError(
        {
          requiredCents: totalCents,
          availableCents,
          shortfallCents: totalCents - availableCents,
        },
        campaignId,
      );
    }

    const holdTx = await this.transactionsService.recordHold(
      collaborationId,
      centsToAmount(totalCents),
      currency,
      null,
      manager,
      campaignId,
    );

    const currentAllocatedCents = toCents(
      campaign.escrowAllocatedAmount || '0.00',
    );
    const newAllocatedCents = currentAllocatedCents + totalCents;
    campaign.escrowAllocatedAmount = centsToAmount(newAllocatedCents);
    await campaignRepo.save(campaign);

    return {
      creatorPrice: centsToAmount(priceCents),
      platformFee: centsToAmount(feeCents),
      totalAmount: centsToAmount(totalCents),
      currency,
      holdTransactionId: holdTx.id,
    };
  }

  /** REQ-205. Increases escrow_funded_amount and records one charge. */
  async applyFunding(
    campaignId: string,
    amount: string,
    currency: string,
    paymobReference: string,
    manager: EntityManager,
    paymentMethodLabel?: string | null,
  ): Promise<void> {
    const campaignRepo = manager.getRepository(Campaign);
    const campaign = await campaignRepo.findOne({
      where: { id: campaignId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.transactionsService.recordCharge(
      campaignId,
      amount,
      currency,
      paymobReference,
      manager,
      paymentMethodLabel,
    );

    const currentFundedCents = toCents(campaign.escrowFundedAmount || '0.00');
    const addedFundedCents = toCents(amount);
    campaign.escrowFundedAmount = centsToAmount(
      currentFundedCents + addedFundedCents,
    );
    await campaignRepo.save(campaign);
  }

  /** REQ-210. Records one refund and increases escrow_refunded_amount. */
  async applyRefund(
    campaignId: string,
    amount: string,
    currency: string,
    paymobReference: string,
    parentTransactionId: string,
    manager: EntityManager,
    paymentMethodLabel?: string | null,
  ): Promise<void> {
    const campaignRepo = manager.getRepository(Campaign);
    const campaign = await campaignRepo.findOne({
      where: { id: campaignId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.transactionsService.recordRefund(
      campaignId,
      amount,
      currency,
      paymobReference,
      parentTransactionId,
      manager,
      paymentMethodLabel,
    );

    const currentRefundedCents = toCents(
      campaign.escrowRefundedAmount || '0.00',
    );
    const addedRefundedCents = toCents(amount);
    campaign.escrowRefundedAmount = centsToAmount(
      currentRefundedCents + addedRefundedCents,
    );
    await campaignRepo.save(campaign);
  }
}
