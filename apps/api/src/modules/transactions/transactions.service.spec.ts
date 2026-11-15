import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let mockManager: {
    getRepository: jest.Mock;
  };
  let managerRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    transactionsRepository = {
      findOne: jest.fn(),
      save: jest.fn((t) => Promise.resolve(t)),
      create: jest.fn((t) => t),
    };

    managerRepo = {
      create: jest.fn((fields) => ({ id: 'tx-1', ...fields })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    mockManager = {
      getRepository: jest.fn().mockReturnValue(managerRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionsRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('recordCharge inserts one row with a campaign_id and a null collaboration_id', async () => {
    const tx = await service.recordCharge(
      'campaign-1',
      '3200.00',
      'EGP',
      'paymob-ref-1',
      mockManager as unknown as EntityManager,
      'Corporate card •• 4471',
    );

    expect(managerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'campaign-1',
        type: TransactionType.CHARGE,
        amount: '3200.00',
        currency: 'EGP',
        paymobReference: 'paymob-ref-1',
        paymentMethodLabel: 'Corporate card •• 4471',
      }),
    );
    expect(tx.collaborationId).toBeUndefined();
    expect(tx.campaignId).toBe('campaign-1');
  });

  it('recordHold inserts one row with both ids', async () => {
    const tx = await service.recordHold(
      'collab-1',
      '3080.00',
      'EGP',
      null,
      mockManager as unknown as EntityManager,
      'campaign-1',
    );

    expect(managerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaborationId: 'collab-1',
        campaignId: 'campaign-1',
        type: TransactionType.HOLD,
        amount: '3080.00',
        currency: 'EGP',
        paymobReference: null,
      }),
    );
    expect(tx.collaborationId).toBe('collab-1');
    expect(tx.campaignId).toBe('campaign-1');
  });

  it('recordRefund sets parent_transaction_id', async () => {
    const tx = await service.recordRefund(
      'campaign-1',
      '120.00',
      'EGP',
      'paymob-refund-ref-1',
      'tx-parent-charge-1',
      mockManager as unknown as EntityManager,
      'Corporate card •• 4471',
    );

    expect(managerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'campaign-1',
        type: TransactionType.REFUND,
        amount: '120.00',
        currency: 'EGP',
        paymobReference: 'paymob-refund-ref-1',
        parentTransactionId: 'tx-parent-charge-1',
      }),
    );
    expect(tx.parentTransactionId).toBe('tx-parent-charge-1');
  });

  it('findByPaymobReference finds a charge row by its reference', async () => {
    const expectedTx = { id: 'tx-1', paymobReference: 'paymob-ref-123' };
    transactionsRepository.findOne.mockResolvedValue(expectedTx);

    const found = await service.findByPaymobReference('paymob-ref-123');
    expect(transactionsRepository.findOne).toHaveBeenCalledWith({
      where: { paymobReference: 'paymob-ref-123' },
    });
    expect(found).toEqual(expectedTx);
  });

  it('every insert logs one structured line', async () => {
    const logSpy = jest.spyOn((service as any).logger, 'log');

    await service.recordCharge(
      'campaign-1',
      '500.00',
      'EGP',
      'ref-xyz',
      mockManager as unknown as EntityManager,
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Transaction recorded: .*campaign-1.*charge.*500.00/,
      ),
    );
  });
});
