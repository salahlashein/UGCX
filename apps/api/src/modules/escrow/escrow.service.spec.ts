import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { EscrowService } from './escrow.service';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { InsufficientEscrowError } from './escrow.errors';

describe('EscrowService', () => {
  let service: EscrowService;
  let campaignsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let transactionsService: {
    recordHold: jest.Mock;
    recordCharge: jest.Mock;
    recordRefund: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let mockManager: {
    getRepository: jest.Mock;
  };
  let campaignRepoInTx: {
    findOne: jest.Mock;
    save: jest.Mock;
  };

  function createMockCampaign(overrides: Partial<Campaign> = {}): Campaign {
    const campaign = new Campaign();
    Object.assign(campaign, {
      id: 'campaign-1',
      budgetMin: '1000.00',
      budgetMax: '5000.00',
      currency: 'EGP',
      escrowFundedAmount: '0.00',
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
      fundingPaymobOrderId: null,
      refundPending: false,
      ...overrides,
    });
    return campaign;
  }

  beforeEach(async () => {
    campaignsRepository = {
      findOne: jest.fn(),
      save: jest.fn((c) => Promise.resolve(c)),
    };

    transactionsService = {
      recordHold: jest.fn().mockResolvedValue({ id: 'tx-hold-1' }),
      recordCharge: jest.fn().mockResolvedValue({ id: 'tx-charge-1' }),
      recordRefund: jest.fn().mockResolvedValue({ id: 'tx-refund-1' }),
    };

    configService = {
      get: jest.fn().mockReturnValue(0.1),
    };

    campaignRepoInTx = {
      findOne: jest.fn(),
      save: jest.fn((c) => Promise.resolve(c)),
    };

    mockManager = {
      getRepository: jest.fn().mockReturnValue(campaignRepoInTx),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: campaignsRepository,
        },
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
  });

  it('1. quote(2800.00) at a rate of 0.1 returns 280000, 28000, 308000', () => {
    const quote = service.quote('2800.00');
    expect(quote).toEqual({
      priceCents: 280000,
      feeCents: 28000,
      totalCents: 308000,
    });
  });

  it('2. allocate on a campaign funded at 3200.00 with a price of 2800.00 inserts a hold of 3080.00', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '3200.00',
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    const result = await service.allocate(
      'campaign-1',
      'collab-1',
      '2800.00',
      'EGP',
      mockManager as unknown as EntityManager,
    );

    expect(transactionsService.recordHold).toHaveBeenCalledWith(
      'collab-1',
      '3080.00',
      'EGP',
      null,
      mockManager,
      'campaign-1',
    );
    expect(result.totalAmount).toBe('3080.00');
    expect(result.holdTransactionId).toBe('tx-hold-1');
  });

  it('3. allocate increases escrow_allocated_amount to exactly 3080.00', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '3200.00',
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    await service.allocate(
      'campaign-1',
      'collab-1',
      '2800.00',
      'EGP',
      mockManager as unknown as EntityManager,
    );

    expect(campaign.escrowAllocatedAmount).toBe('3080.00');
    expect(campaignRepoInTx.save).toHaveBeenCalledWith(campaign);
  });

  it('4. allocate on a campaign with 1000.00 available throws InsufficientEscrowError with a shortfall of 2080.00', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '1000.00',
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    await expect(
      service.allocate(
        'campaign-1',
        'collab-1',
        '2800.00',
        'EGP',
        mockManager as unknown as EntityManager,
      ),
    ).rejects.toThrow(InsufficientEscrowError);

    try {
      await service.allocate(
        'campaign-1',
        'collab-1',
        '2800.00',
        'EGP',
        mockManager as unknown as EntityManager,
      );
    } catch (err: any) {
      expect(err.shortfall).toEqual({
        requiredCents: 308000,
        availableCents: 100000,
        shortfallCents: 208000,
      });
    }
  });

  it('4b. the shortfall error carries the shortfall amount and the campaign id', async () => {
    campaignRepoInTx.findOne.mockResolvedValue(
      createMockCampaign({
        escrowFundedAmount: '1000.00',
        escrowAllocatedAmount: '0.00',
        escrowRefundedAmount: '0.00',
      }),
    );

    const error = await service
      .allocate(
        'campaign-1',
        'collab-1',
        '2800.00',
        'EGP',
        mockManager as unknown as EntityManager,
      )
      .catch((err: any) => err);

    expect(error).toBeInstanceOf(InsufficientEscrowError);
    expect((error.getResponse() as { details: unknown }).details).toEqual([
      { field: 'shortfall', message: '2080.00' },
      { field: 'campaignId', message: 'campaign-1' },
    ]);
  });

  it('5. allocate requests a pessimistic write lock', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '3200.00',
      escrowAllocatedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    await service.allocate(
      'campaign-1',
      'collab-1',
      '100.00',
      'EGP',
      mockManager as unknown as EntityManager,
    );

    expect(campaignRepoInTx.findOne).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('6. applyFunding increases escrow_funded_amount and inserts one charge row', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '1000.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    await service.applyFunding(
      'campaign-1',
      '2200.00',
      'EGP',
      'paymob-ref-1',
      mockManager as unknown as EntityManager,
      'Corporate card •• 4471',
    );

    expect(transactionsService.recordCharge).toHaveBeenCalledWith(
      'campaign-1',
      '2200.00',
      'EGP',
      'paymob-ref-1',
      mockManager,
      'Corporate card •• 4471',
    );
    expect(campaign.escrowFundedAmount).toBe('3200.00');
    expect(campaignRepoInTx.save).toHaveBeenCalledWith(campaign);
  });

  it('7. applyRefund increases escrow_refunded_amount and links the parent transaction', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '3200.00',
      escrowAllocatedAmount: '3080.00',
      escrowRefundedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    await service.applyRefund(
      'campaign-1',
      '120.00',
      'EGP',
      'paymob-refund-ref-1',
      'tx-parent-1',
      mockManager as unknown as EntityManager,
      'Corporate card •• 4471',
    );

    expect(transactionsService.recordRefund).toHaveBeenCalledWith(
      'campaign-1',
      '120.00',
      'EGP',
      'paymob-refund-ref-1',
      'tx-parent-1',
      mockManager,
      'Corporate card •• 4471',
    );
    expect(campaign.escrowRefundedAmount).toBe('120.00');
    expect(campaignRepoInTx.save).toHaveBeenCalledWith(campaign);
  });

  it('8. cent rounding: a price of 0.05 at a rate of 0.1 produces a fee of 0.01, not 0.005', () => {
    const quote = service.quote('0.05');
    // 5 cents * 1000 / 10000 = 0.5 cents -> Math.round is 1 cent
    expect(quote.priceCents).toBe(5);
    expect(quote.feeCents).toBe(1);
    expect(quote.totalCents).toBe(6);
  });

  it('9. the sum of the three counters never breaks invariant 1 after ten sequential allocations', async () => {
    const campaign = createMockCampaign({
      escrowFundedAmount: '1000.00', // 1000.00 EGP = 100000 cents
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
    });
    campaignRepoInTx.findOne.mockResolvedValue(campaign);

    // Each allocation: price 90.00 + fee 9.00 = 99.00 EGP = 9900 cents
    for (let i = 0; i < 10; i++) {
      await service.allocate(
        'campaign-1',
        `collab-${i}`,
        '90.00',
        'EGP',
        mockManager as unknown as EntityManager,
      );
      const allocatedCents = Number(campaign.escrowAllocatedAmount) * 100;
      const fundedCents = Number(campaign.escrowFundedAmount) * 100;
      const refundedCents = Number(campaign.escrowRefundedAmount) * 100;
      expect(allocatedCents + refundedCents).toBeLessThanOrEqual(fundedCents);
    }
    expect(campaign.escrowAllocatedAmount).toBe('990.00');
    expect(campaign.availableEscrowCents()).toBe(1000); // 10.00 EGP remaining
  });
});
