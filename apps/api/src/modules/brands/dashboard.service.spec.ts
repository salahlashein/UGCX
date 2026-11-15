import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DashboardService, normalizeSum } from './dashboard.service';
import { Brand } from './entities/brand.entity';
import {
  Campaign,
  CampaignStatus,
} from '../campaigns/entities/campaign.entity';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import {
  Deliverable,
  DeliverableStatus,
} from '../deliverables/entities/deliverable.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import {
  Proposal,
  ProposalStatus,
} from '../proposals/entities/proposal.entity';
import { BrandsService } from './brands.service';
import { BillingService } from './billing.service';

describe('DashboardService (TASK-P3-06, TASK-W3-04)', () => {
  let service: DashboardService;
  let brandsRepository: any;
  let campaignsRepository: any;
  let collaborationsRepository: any;
  let deliverablesRepository: any;
  let transactionsRepository: any;
  let proposalsRepository: any;
  let brandsService: any;
  let billingService: any;
  let configService: any;

  beforeEach(async () => {
    brandsRepository = {};
    campaignsRepository = {
      createQueryBuilder: jest.fn(),
    };
    collaborationsRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
    };
    deliverablesRepository = {
      createQueryBuilder: jest.fn(),
    };
    transactionsRepository = {
      createQueryBuilder: jest.fn(),
    };
    proposalsRepository = {
      count: jest.fn().mockResolvedValue(0),
    };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({
        id: 'brand-1',
        companyName: 'Glow Lab',
        logoUrl: 'https://r2.test/glowlab.png',
      }),
    };
    billingService = {
      getTotals: jest.fn().mockResolvedValue({
        funded: '15000.00',
        refunded: '0.00',
        released: '3520.00',
        allocated: '0.00',
        available: '11480.00',
        currency: 'EGP',
      }),
    };
    configService = {
      get: jest.fn().mockReturnValue('Africa/Cairo'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Brand), useValue: brandsRepository },
        {
          provide: getRepositoryToken(Campaign),
          useValue: campaignsRepository,
        },
        {
          provide: getRepositoryToken(Collaboration),
          useValue: collaborationsRepository,
        },
        {
          provide: getRepositoryToken(Deliverable),
          useValue: deliverablesRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionsRepository,
        },
        {
          provide: getRepositoryToken(Proposal),
          useValue: proposalsRepository,
        },
        { provide: BrandsService, useValue: brandsService },
        { provide: BillingService, useValue: billingService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('1. month.spend calculates net charge minus refund in current month', async () => {
    const mockTxQbMonth = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { type: TransactionType.CHARGE, sum: '20000.00' },
        { type: TransactionType.REFUND, sum: '1600.00' },
        { type: TransactionType.RELEASE, sum: '3200.00' },
      ]),
    };

    const mockTxQbSeries = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    transactionsRepository.createQueryBuilder
      .mockReturnValueOnce(mockTxQbMonth)
      .mockReturnValueOnce(mockTxQbSeries);

    const mockDelivQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(6),
    };
    deliverablesRepository.createQueryBuilder.mockReturnValue(mockDelivQb);

    const mockCampaignQbAttention = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: '2' }),
    };

    const mockCampaignQbActive = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          { id: 'cmp-1', title: 'Serum review', status: CampaignStatus.LIVE },
          { id: 'cmp-2', title: 'Baby wash', status: CampaignStatus.LIVE },
        ],
        2,
      ]),
    };

    campaignsRepository.createQueryBuilder
      .mockReturnValueOnce(mockCampaignQbAttention)
      .mockReturnValueOnce(mockCampaignQbActive);

    const mockCollabQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
    };
    collaborationsRepository.createQueryBuilder.mockReturnValue(mockCollabQb);

    const data = await service.getDashboard('user-1');

    expect(data.brandName).toBe('Glow Lab');
    expect(data.month.spend).toBe('18400.00'); // 20000 - 1600
    expect(data.month.released).toBe('3200.00');
    expect(data.month.deliverableCount).toBe(6);
    expect(data.attention.briefsNeedingProposalReview).toBe(2);
    expect(data.attention.deliverablesAwaitingReview).toBe(1);
    expect(data.activeBriefCount).toBe(2);
    expect(data.activeBriefs).toHaveLength(2);
    expect(data.totals).toEqual(expect.objectContaining({ funded: '15000.00' }));
    expect(data.series).toHaveLength(6);
  });

  it('2. returns empty active briefs array and 0 count when brand has no briefs', async () => {
    const mockTxQb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    transactionsRepository.createQueryBuilder.mockReturnValue(mockTxQb);

    deliverablesRepository.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    campaignsRepository.createQueryBuilder
      .mockReturnValueOnce({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
      })
      .mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      });

    collaborationsRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const data = await service.getDashboard('user-1');

    expect(data.month.spend).toBe('0.00');
    expect(data.month.released).toBe('0.00');
    expect(data.month.deliverableCount).toBe(0);
    expect(data.activeBriefCount).toBe(0);
    expect(data.activeBriefs).toEqual([]);
  });

  it('3. getMonthBoundsInTimezone uses Africa/Cairo reporting timezone', () => {
    const testDate = new Date('2026-09-18T12:00:00Z');
    const { start, end } = service.getMonthBoundsInTimezone(
      testDate,
      'Africa/Cairo',
    );

    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  describe('TASK-W3-04 series and normalizeSum', () => {
    it('1. six points are returned in order, and the last is current month', () => {
      const keys = service.getSixMonthKeys(new Date('2026-10-30T00:00:00Z'), 'Africa/Cairo');
      expect(keys).toHaveLength(6);
      expect(keys[5]).toBe('2026-10');
      expect(keys[0]).toBe('2026-05');
    });

    it('2. month with no rows is 0.00 for both funded and released', async () => {
      transactionsRepository.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      deliverablesRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      campaignsRepository.createQueryBuilder
        .mockReturnValueOnce({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        });

      collaborationsRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      const data = await service.getDashboard('user-1');
      expect(data.series).toHaveLength(6);
      for (const pt of data.series) {
        expect(pt.funded).toBe('0.00');
        expect(pt.released).toBe('0.00');
      }
    });

    it('3. normalizeSum converts raw postgres sum strings correctly', () => {
      expect(normalizeSum('15000')).toBe('15000.00');
      expect(normalizeSum('15000.5')).toBe('15000.50');
      expect(normalizeSum('0')).toBe('0.00');
      expect(normalizeSum(null)).toBe('0.00');
    });
  });
});
