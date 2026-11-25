import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/entities/transaction.entity';
import { BrandsService } from './brands.service';
import { centsToAmount, toCents } from '../../common/utils/money';

export interface BrandMoneyTotals {
  funded: string; // sum of completed charge rows
  refunded: string; // sum of completed refund rows
  released: string; // sum of completed release rows (includes platform fee, DEC-W303)
  allocated: string; // sum of completed hold rows minus released
  available: string; // funded - refunded - (all holds)
  currency: string;
}

export interface BillingSummary extends BrandMoneyTotals {
  lifetimeSpend: string;
}

export interface BillingLedgerItem {
  id: string;
  type: 'charge' | 'refund' | 'hold' | 'release';
  label: string;
  campaignId: string | null;
  campaignTitle: string | null;
  method: string;
  amount: string; // unchanged sign rule for charge and refund (DEC-W301)
  currency: string;
  createdAt: Date;
  direction: 'in' | 'out' | 'hold'; // escrow view
  escrowAmount: string; // always positive, two decimals
  counterpartName: string | null; // creator display name on hold and release rows
  reference: string; // 'TX-' + first 8 hex of id, upper case
}

const ALLOWED_TYPES = [
  TransactionType.CHARGE,
  TransactionType.REFUND,
  TransactionType.HOLD,
  TransactionType.RELEASE,
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly brandsService: BrandsService,
  ) {}

  /**
   * REQ-W302, TASK-W3-02: Returns brand escrow totals computed from transactions.
   */
  async getTotals(brandId: string): Promise<BrandMoneyTotals> {
    const aggregateQb = this.transactionsRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.campaign', 'campaign')
      .leftJoin('tx.collaboration', 'collab')
      .leftJoin('collab.campaign', 'collabCampaign')
      .select('tx.type', 'type')
      .addSelect('SUM(CAST(tx.amount AS numeric))', 'sum')
      .where(
        '(campaign.brand_id = :brandId OR collabCampaign.brand_id = :brandId)',
        {
          brandId,
        },
      )
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
      .andWhere('tx.type IN (:...types)', { types: ALLOWED_TYPES })
      .groupBy('tx.type');

    const aggregates: { type: TransactionType; sum: string }[] =
      await aggregateQb.getRawMany();

    let fundedCents = 0;
    let refundedCents = 0;
    let releasedCents = 0;
    let holdCents = 0;

    for (const agg of aggregates) {
      const cents = toCents(agg.sum || '0.00');
      if (agg.type === TransactionType.CHARGE) {
        fundedCents = cents;
      } else if (agg.type === TransactionType.REFUND) {
        refundedCents = cents;
      } else if (agg.type === TransactionType.RELEASE) {
        releasedCents = cents;
      } else if (agg.type === TransactionType.HOLD) {
        holdCents = cents;
      }
    }

    let allocatedCents = holdCents - releasedCents;
    if (allocatedCents < 0) {
      this.logger.warn(
        `Negative allocated escrow detected for brand ${brandId}: ${allocatedCents}`,
      );
      allocatedCents = 0;
    }

    const availableCents = Math.max(0, fundedCents - refundedCents - holdCents);

    return {
      funded: centsToAmount(fundedCents),
      refunded: centsToAmount(refundedCents),
      released: centsToAmount(releasedCents),
      allocated: centsToAmount(allocatedCents),
      available: centsToAmount(availableCents),
      currency: 'EGP',
    };
  }

  /**
   * REQ-W303, REQ-W304, TASK-W3-03: Lists brand billing history with direction and escrow amounts.
   */
  async list(
    userId: string,
    page: number = 1,
    perPage: number = 20,
    typeFilter?: string,
  ): Promise<{
    items: BillingLedgerItem[];
    total: number;
    summary: BillingSummary;
  }> {
    const brand = await this.brandsService.findByUserId(userId);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (typeFilter && !ALLOWED_TYPES.includes(typeFilter as TransactionType)) {
      throw new BadRequestException(
        `type must be one of: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    const safePage = Math.max(1, page);
    const safePerPage = Math.max(1, perPage);

    const qb = this.transactionsRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.campaign', 'campaign')
      .leftJoinAndSelect('tx.collaboration', 'collab')
      .leftJoinAndSelect('collab.creator', 'creator')
      .leftJoinAndSelect('collab.campaign', 'collabCampaign')
      .where(
        '(campaign.brand_id = :brandId OR collabCampaign.brand_id = :brandId)',
        {
          brandId: brand.id,
        },
      )
      .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED });

    if (typeFilter) {
      qb.andWhere('tx.type = :typeFilter', { typeFilter });
    } else {
      qb.andWhere('tx.type IN (:...allowedTypes)', {
        allowedTypes: ALLOWED_TYPES,
      });
    }

    qb.orderBy('tx.createdAt', 'DESC')
      .skip((safePage - 1) * safePerPage)
      .take(safePerPage);

    const [transactions, total] = await qb.getManyAndCount();

    const totals = await this.getTotals(brand.id);
    const lifetimeSpendCents = Math.max(
      0,
      toCents(totals.funded) - toCents(totals.refunded),
    );

    const items: BillingLedgerItem[] = transactions.map((tx) => {
      const campaignTitle =
        tx.campaign?.title || tx.collaboration?.campaign?.title || 'Brief';
      const campaignId = tx.campaignId || tx.collaboration?.campaignId || null;
      const creatorName = tx.collaboration?.creator?.displayName || null;

      let direction: 'in' | 'out' | 'hold';
      let signedAmount: string;
      let label: string;

      const rawAmountCents = toCents(tx.amount);
      const positiveAmount = centsToAmount(rawAmountCents);

      switch (tx.type) {
        case TransactionType.CHARGE:
          direction = 'in';
          signedAmount = `-${positiveAmount}`;
          label = 'Escrow funded';
          break;
        case TransactionType.REFUND:
          direction = 'out';
          signedAmount = `+${positiveAmount}`;
          label = 'Refund to payment method';
          break;
        case TransactionType.HOLD:
          direction = 'hold';
          signedAmount = positiveAmount;
          label = creatorName
            ? `Allocated to ${creatorName}`
            : 'Allocated to creator';
          break;
        case TransactionType.RELEASE:
          direction = 'out';
          signedAmount = positiveAmount;
          {
            // Show the split, not "(incl. fee)" (UI audit brand-billing/W1).
            const who = creatorName ?? 'creator';
            const price = tx.collaboration?.creatorPrice;
            const fee = tx.collaboration?.platformFee;
            const egp = (v: string) =>
              `EGP ${(toCents(v) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            label =
              price != null && fee != null
                ? `${egp(price)} to ${who} · ${egp(fee)} ReelPal fee`
                : `Released to ${who} (incl. fee)`;
          }
          break;
        default:
          direction = 'out';
          signedAmount = positiveAmount;
          label = tx.type;
      }

      const method =
        tx.paymentMethodLabel ||
        (tx.type === TransactionType.CHARGE
          ? 'Card'
          : tx.type === TransactionType.REFUND
            ? 'Bank transfer'
            : 'Escrow');

      const hexPart = tx.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      const reference = `TX-${hexPart}`;

      return {
        id: tx.id,
        type: tx.type as 'charge' | 'refund' | 'hold' | 'release',
        label,
        campaignId,
        campaignTitle,
        method,
        amount: signedAmount,
        currency: tx.currency || 'EGP',
        createdAt: tx.createdAt,
        direction,
        escrowAmount: positiveAmount,
        counterpartName: creatorName,
        reference,
      };
    });

    return {
      items,
      total,
      summary: {
        ...totals,
        lifetimeSpend: centsToAmount(lifetimeSpendCents),
      },
    };
  }
}
