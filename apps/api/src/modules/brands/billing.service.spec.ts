import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BrandsService } from './brands.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';

describe('BillingService (TASK-W3-02, TASK-W3-03)', () => {
  let service: BillingService;
  let transactionsRepo: {
    createQueryBuilder: jest.Mock;
  };
  let brandsService: {
    findByUserId: jest.Mock;
  };

  beforeEach(async () => {
    transactionsRepo = {
      createQueryBuilder: jest.fn(),
    };
    brandsService = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'brand-1', userId: 'user-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionsRepo,
        },
        {
          provide: BrandsService,
          useValue: brandsService,
        },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  describe('getTotals (TASK-W3-02, BG-09)', () => {
    it('1. charge 15,000, hold 3,520, release 3,520, no refund: funded 15,000, released 3,520, allocated 0, available 11,480', async () => {
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: TransactionType.CHARGE, sum: '15000.00' },
          { type: TransactionType.HOLD, sum: '3520.00' },
          { type: TransactionType.RELEASE, sum: '3520.00' },
        ]),
      };
      transactionsRepo.createQueryBuilder.mockReturnValue(aggregateQb);

      const totals = await service.getTotals('brand-1');

      expect(totals.funded).toBe('15000.00');
      expect(totals.refunded).toBe('0.00');
      expect(totals.released).toBe('3520.00');
      expect(totals.allocated).toBe('0.00');
      expect(totals.available).toBe('11480.00');
      expect(totals.currency).toBe('EGP');
    });

    it('2. hold 3,520 and no release: allocated 3,520, available 11,480', async () => {
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: TransactionType.CHARGE, sum: '15000.00' },
          { type: TransactionType.HOLD, sum: '3520.00' },
        ]),
      };
      transactionsRepo.createQueryBuilder.mockReturnValue(aggregateQb);

      const totals = await service.getTotals('brand-1');

      expect(totals.allocated).toBe('3520.00');
      expect(totals.released).toBe('0.00');
      expect(totals.available).toBe('11480.00');
    });

    it('3. with refund of 300: funded - refunded - released - allocated equals available', async () => {
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: TransactionType.CHARGE, sum: '15000.00' },
          { type: TransactionType.REFUND, sum: '300.00' },
          { type: TransactionType.HOLD, sum: '3520.00' },
          { type: TransactionType.RELEASE, sum: '3520.00' },
        ]),
      };
      transactionsRepo.createQueryBuilder.mockReturnValue(aggregateQb);

      const totals = await service.getTotals('brand-1');

      // funded 15000 - refunded 300 - released 3520 - allocated 0 = available 11180
      expect(totals.available).toBe('11180.00');
      expect(totals.refunded).toBe('300.00');
    });

    it('4. equation holds across randomized amounts', async () => {
      const testCases = [
        { charge: '10000.00', refund: '500.00', hold: '2000.00', release: '1000.00' },
        { charge: '5000.00', refund: '0.00', hold: '3000.00', release: '3000.00' },
        { charge: '8500.50', refund: '250.25', hold: '4000.00', release: '2500.00' },
      ];

      for (const tc of testCases) {
        const aggregateQb = {
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { type: TransactionType.CHARGE, sum: tc.charge },
            { type: TransactionType.REFUND, sum: tc.refund },
            { type: TransactionType.HOLD, sum: tc.hold },
            { type: TransactionType.RELEASE, sum: tc.release },
          ]),
        };
        transactionsRepo.createQueryBuilder.mockReturnValue(aggregateQb);

        const totals = await service.getTotals('brand-1');
        const fundedCents = Math.round(parseFloat(totals.funded) * 100);
        const refundedCents = Math.round(parseFloat(totals.refunded) * 100);
        const releasedCents = Math.round(parseFloat(totals.released) * 100);
        const allocatedCents = Math.round(parseFloat(totals.allocated) * 100);
        const availableCents = Math.round(parseFloat(totals.available) * 100);

        expect(fundedCents - refundedCents - releasedCents - allocatedCents).toBe(availableCents);
      }
    });

    it('5. brand with no rows returns six 0.00 values', async () => {
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      transactionsRepo.createQueryBuilder.mockReturnValue(aggregateQb);

      const totals = await service.getTotals('brand-1');

      expect(totals).toEqual({
        funded: '0.00',
        refunded: '0.00',
        released: '0.00',
        allocated: '0.00',
        available: '0.00',
        currency: 'EGP',
      });
    });
  });

  describe('list (TASK-W3-03, BG-10)', () => {
    it('1. hold row appears with direction hold and creator name; release with direction out', async () => {
      const mockTxList = [
        {
          id: '11111111-2222-3333-4444-555555555555',
          type: TransactionType.HOLD,
          amount: '3520.00',
          currency: 'EGP',
          createdAt: new Date(),
          collaboration: {
            campaignId: 'cmp-1',
            campaign: { id: 'cmp-1', title: 'Serum review' },
            creator: { displayName: 'Sara Creator' },
          },
        },
        {
          id: '22222222-3333-4444-5555-666666666666',
          type: TransactionType.RELEASE,
          amount: '3520.00',
          currency: 'EGP',
          createdAt: new Date(),
          collaboration: {
            campaignId: 'cmp-1',
            campaign: { id: 'cmp-1', title: 'Serum review' },
            creator: { displayName: 'Sara Creator' },
          },
        },
      ];

      const listQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTxList, 2]),
      };

      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      transactionsRepo.createQueryBuilder
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(aggregateQb);

      const result = await service.list('user-1');

      expect(result.items.length).toBe(2);
      expect(result.items[0].direction).toBe('hold');
      expect(result.items[0].counterpartName).toBe('Sara Creator');
      expect(result.items[0].label).toBe('Allocated to Sara Creator');
      expect(result.items[0].reference).toBe('TX-11111111');
      expect(result.items[0].escrowAmount).toBe('3520.00');

      expect(result.items[1].direction).toBe('out');
      expect(result.items[1].label).toBe('Released to Sara Creator (incl. fee)');
    });

    it('2. type=release filters only release rows', async () => {
      const listQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      transactionsRepo.createQueryBuilder
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(aggregateQb);

      await service.list('user-1', 1, 20, 'release');

      expect(listQb.andWhere).toHaveBeenCalledWith('tx.type = :typeFilter', {
        typeFilter: 'release',
      });
    });

    it('3. type=foo throws BadRequestException', async () => {
      await expect(
        service.list('user-1', 1, 20, 'foo'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('4. charge is negative, refund is positive', async () => {
      const mockTxList = [
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          type: TransactionType.CHARGE,
          amount: '5000.00',
          currency: 'EGP',
          createdAt: new Date(),
          campaign: { title: 'Camp 1' },
        },
        {
          id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
          type: TransactionType.REFUND,
          amount: '200.00',
          currency: 'EGP',
          createdAt: new Date(),
          campaign: { title: 'Camp 1' },
        },
      ];

      const listQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTxList, 2]),
      };
      const aggregateQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      transactionsRepo.createQueryBuilder
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(aggregateQb);

      const result = await service.list('user-1');

      expect(result.items[0].amount).toBe('-5000.00');
      expect(result.items[0].direction).toBe('in');
      expect(result.items[1].amount).toBe('+200.00');
      expect(result.items[1].direction).toBe('out');
    });

    it('5. throws NotFoundException when brand is not found', async () => {
      brandsService.findByUserId.mockResolvedValueOnce(null);

      await expect(service.list('unknown-user')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
