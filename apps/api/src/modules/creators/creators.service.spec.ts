import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service';
import { Creator } from './entities/creator.entity';
import { CreatorPortfolioItem } from './entities/creator-portfolio-item.entity';
import {
  CreatorPayoutDetail,
  PayoutMethod,
} from './entities/creator-payout-detail.entity';
import {
  PayoutRequest,
  PayoutRequestStatus,
} from './entities/payout-request.entity';
import { DataSource } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { Collaboration } from '../collaborations/entities/collaboration.entity';

describe('CreatorsService', () => {
  let service: CreatorsService;
  let creatorsRepository: { findOne: jest.Mock };
  let payoutRepository: {
    findOne: jest.Mock;
    create?: jest.Mock;
    save?: jest.Mock;
  };
  let portfolioRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let payoutRequestRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: any;

  beforeEach(async () => {
    creatorsRepository = { findOne: jest.fn() };
    payoutRepository = { findOne: jest.fn() };
    portfolioRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ id: 'item-1', ...d })),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    payoutRequestRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) =>
        Promise.resolve({ id: 'req-1', ...d, createdAt: new Date() }),
      ),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        { provide: getRepositoryToken(Creator), useValue: creatorsRepository },
        {
          provide: getRepositoryToken(CreatorPortfolioItem),
          useValue: portfolioRepository,
        },
        {
          provide: getRepositoryToken(CreatorPayoutDetail),
          useValue: payoutRepository,
        },
        {
          provide: getRepositoryToken(PayoutRequest),
          useValue: payoutRequestRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CreatorsService);
  });

  describe('getPayoutDetails (SEC-004)', () => {
    it('allows the owning creator to read their own payout details', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        id: 'payout-1',
        creatorId: 'creator-1',
      });

      const result = await service.getPayoutDetails(
        { userId: 'user-1', role: UserRole.CREATOR },
        'creator-1',
      );
      expect(result?.id).toBe('payout-1');
    });

    it('returns 404, not 403, when a different creator requests them (EDGE-P1-002)', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      await expect(
        service.getPayoutDetails(
          { userId: 'a-different-user', role: UserRole.CREATOR },
          'creator-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows an admin to read any creator payout details', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        id: 'payout-1',
        creatorId: 'creator-1',
      });

      const result = await service.getPayoutDetails(
        { userId: 'admin-1', role: UserRole.ADMIN },
        'creator-1',
      );
      expect(result?.id).toBe('payout-1');
    });
  });

  describe('getHomeQueue (AUD-005)', () => {
    it('uses campaign.title when product is null', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      const collabs = [
        {
          id: 'collab-1',
          creatorId: 'creator-1',
          creatorPrice: '1500.00',
          brand: { userId: 'brand-user-1', companyName: 'GlowLab' },
          campaign: {
            id: 'campaign-1',
            title: 'Try-on Haul',
            product: null,
          },
        },
      ];

      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity?.name === 'Collaboration' || entity === Collaboration) {
            return {
              find: jest.fn().mockResolvedValue(collabs),
            };
          }
          return {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
          };
        }),
      };

      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks[0].title).toBe(
        'Upload your video for Try-on Haul',
      );
    });
  });

  describe('getHomeQueue chat and revision tasks', () => {
    const buildService = (
      collab: Record<string, unknown>,
      latestMessage: Record<string, unknown> | null,
      deliverables: unknown[] = [],
    ) => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Collaboration || entity?.name === 'Collaboration') {
            return {
              find: jest.fn().mockResolvedValue([
                {
                  id: 'collab-1',
                  creatorPrice: '1500.00',
                  brand: { userId: 'brand-user-1', companyName: 'GlowLab' },
                  campaign: { title: 'Try-on Haul' },
                  ...collab,
                },
              ]),
            };
          }
          if (entity?.name === 'Message') {
            return {
              find: jest
                .fn()
                .mockResolvedValue(latestMessage ? [latestMessage] : []),
            };
          }
          return { find: jest.fn().mockResolvedValue(deliverables) };
        }),
      };
    };

    it('asks for a reply when the brand sent the latest message', async () => {
      buildService({ status: 'funded' }, { senderUserId: 'brand-user-1' }, [
        { id: 'd1' },
      ]);
      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks.map((t: any) => t.id)).toEqual([
        'msg-collab-1',
      ]);
    });

    it('does not ask for a reply after the creator answered', async () => {
      buildService({ status: 'funded' }, { senderUserId: 'user-1' }, [
        { id: 'd1' },
      ]);
      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks).toEqual([]);
    });

    it('waits for shipment before asking for a video when the brief ships a product', async () => {
      buildService(
        {
          status: 'funded',
          campaign: { title: 'Try-on Haul', needsShipping: true },
        },
        null,
        [],
      );
      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks).toEqual([]);
      expect(result.upcomingTasks[0]).toMatchObject({
        id: 'await-ship-collab-1',
        actionUrl: '/chat/collab-1',
      });
    });

    it('asks for a video once the product has shipped', async () => {
      buildService(
        {
          status: 'shipped',
          campaign: { title: 'Try-on Haul', needsShipping: true },
        },
        null,
        [],
      );
      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks.map((t: any) => t.id)).toEqual([
        'deliv-collab-1',
      ]);
    });

    it('adds a revision task that links to the upload screen', async () => {
      buildService({ status: 'revision_requested' }, null, [{ id: 'd1' }]);
      const result = await service.getHomeQueue('user-1');
      expect(result.urgentTasks).toHaveLength(1);
      expect(result.urgentTasks[0]).toMatchObject({
        id: 'rev-collab-1',
        title: 'Revision requested for Try-on Haul',
        actionUrl: '/upload/collab-1',
      });
    });
  });

  describe('getEarnings and getLedger (TASK-P3-08, AUD-004)', () => {
    it('1. collaboration with hold and no release counts toward escrowBalance', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      const mockCollabs = [
        { id: 'collab-1', creatorId: 'creator-1', creatorPrice: '2800.00' },
      ];
      const mockTxs = [
        {
          id: 'tx-1',
          collaborationId: 'collab-1',
          type: 'hold',
          status: 'completed',
        },
      ];

      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Collaboration || entity?.name === 'Collaboration') {
            return { find: jest.fn().mockResolvedValue(mockCollabs) };
          }
          return { find: jest.fn().mockResolvedValue(mockTxs) };
        }),
      };

      const earnings = await service.getEarnings('user-1');
      expect(earnings.escrowBalance).toBe('2800.00');
      expect(earnings.pendingBalance).toBe('0.00');
      expect(earnings.clearedBalance).toBe('0.00');
      expect(earnings.currency).toBe('EGP');
    });

    it('2. collaboration with release and no payout counts toward pendingBalance', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      const mockCollabs = [
        { id: 'collab-1', creatorId: 'creator-1', creatorPrice: '2800.00' },
      ];
      const mockTxs = [
        {
          id: 'tx-1',
          collaborationId: 'collab-1',
          type: 'hold',
          status: 'completed',
        },
        {
          id: 'tx-2',
          collaborationId: 'collab-1',
          type: 'release',
          status: 'completed',
        },
      ];

      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Collaboration || entity?.name === 'Collaboration') {
            return { find: jest.fn().mockResolvedValue(mockCollabs) };
          }
          return { find: jest.fn().mockResolvedValue(mockTxs) };
        }),
      };

      const earnings = await service.getEarnings('user-1');
      expect(earnings.escrowBalance).toBe('0.00');
      expect(earnings.pendingBalance).toBe('2800.00');
      expect(earnings.clearedBalance).toBe('0.00');
    });

    it('3. payout row counts toward clearedBalance at payout amount', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      const mockCollabs = [
        { id: 'collab-1', creatorId: 'creator-1', creatorPrice: '2800.00' },
      ];
      const mockTxs = [
        {
          id: 'tx-1',
          collaborationId: 'collab-1',
          type: 'hold',
          status: 'completed',
        },
        {
          id: 'tx-2',
          collaborationId: 'collab-1',
          type: 'release',
          status: 'completed',
        },
        {
          id: 'tx-3',
          collaborationId: 'collab-1',
          type: 'payout',
          amount: '2800.00',
          status: 'completed',
        },
      ];

      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Collaboration || entity?.name === 'Collaboration') {
            return { find: jest.fn().mockResolvedValue(mockCollabs) };
          }
          return { find: jest.fn().mockResolvedValue(mockTxs) };
        }),
      };

      const earnings = await service.getEarnings('user-1');
      expect(earnings.escrowBalance).toBe('0.00');
      expect(earnings.pendingBalance).toBe('0.00');
      expect(earnings.clearedBalance).toBe('2800.00');
    });

    it('4. getLedger never returns fee row and uses statusToken', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      const mockTxs = [
        {
          id: 'tx-rel',
          collaborationId: 'collab-12345678-abcd',
          type: 'release',
          amount: '3080.00',
          createdAt: new Date('2026-09-18T10:00:00Z'),
          collaboration: {
            creatorPrice: '2800.00',
            brand: { companyName: 'Glow Lab' },
          },
        },
      ];

      const mockTxQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTxs),
      };

      (service as any).dataSource = {
        getRepository: jest.fn((entity: any) => {
          if (entity === Collaboration || entity?.name === 'Collaboration') {
            return { find: jest.fn().mockResolvedValue([]) };
          }
          return {
            createQueryBuilder: jest.fn().mockReturnValue(mockTxQb),
          };
        }),
      };

      const ledger = await service.getLedger('user-1');
      expect(ledger).toHaveLength(1);
      expect(ledger[0].title).toBe('Released · Glow Lab');
      expect(ledger[0].sign).toBe('+');
      expect(ledger[0].statusToken).toBe('success');
      expect(ledger[0].status).toBe('Withdrawable');
      expect(ledger[0].amount).toBe('+ 2800.00');
      expect((ledger[0] as any).statusColor).toBeUndefined();
    });

    describe('BG-26 creator ledger fields (TASK-W3-06)', () => {
      it('1. release row has ISO createdAt, type: release, campaign title, and TX-XXXXXXXX reference', async () => {
        creatorsRepository.findOne.mockResolvedValue({
          id: 'creator-1',
          userId: 'user-1',
        });

        const mockTxs = [
          {
            id: '12345678-abcd-ef01-2345-6789abcdef01',
            collaborationId: 'collab-1',
            type: 'release',
            amount: '3080.00',
            createdAt: new Date('2026-09-18T10:00:00.000Z'),
            collaboration: {
              creatorPrice: '2800.00',
              brand: { companyName: 'Glow Lab' },
              campaign: { title: 'Hydra Serum' },
            },
          },
          {
            id: '87654321-fedc-ba98-7654-3210fedcba98',
            collaborationId: 'collab-2',
            type: 'payout',
            payoutMethod: 'instapay',
            amount: '2000.00',
            createdAt: new Date('2026-09-19T12:00:00.000Z'),
            collaboration: {
              brand: { companyName: 'Glow Lab' },
              campaign: null,
            },
          },
        ];

        const mockTxQb = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockTxs),
        };

        (service as any).dataSource = {
          getRepository: jest.fn((entity: any) => {
            if (entity === Collaboration || entity?.name === 'Collaboration') {
              return { find: jest.fn().mockResolvedValue([]) };
            }
            return {
              createQueryBuilder: jest.fn().mockReturnValue(mockTxQb),
            };
          }),
        };

        const ledger = await service.getLedger('user-1');
        expect(ledger).toHaveLength(2);

        // Check release row
        expect(ledger[0].type).toBe('release');
        expect(ledger[0].createdAt).toBe('2026-09-18T10:00:00.000Z');
        expect(ledger[0].campaignTitle).toBe('Hydra Serum');
        expect(ledger[0].reference).toBe('TX-12345678');

        // Check payout row
        expect(ledger[1].type).toBe('payout');
        expect(ledger[1].reference).toBe('TX-87654321');
        expect(ledger[1].sign).toBe('−');
      });
    });
  });

  describe('deletePortfolioItem', () => {
    it('removes item when creator is owner', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      portfolioRepository.findOne.mockResolvedValue({
        id: 'item-1',
        creatorId: 'creator-1',
      });

      await service.deletePortfolioItem('user-1', 'item-1');

      expect(portfolioRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-1' }),
      );
    });

    it('throws 404 when item does not belong to creator', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      portfolioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deletePortfolioItem('user-1', 'item-not-found'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listPayoutRequests', () => {
    it('returns requests for creator', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRequestRepository.find.mockResolvedValue([
        { id: 'req-1', amount: '1000.00', status: PayoutRequestStatus.PENDING },
      ]);

      const result = await service.listPayoutRequests('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('req-1');
      expect(payoutRequestRepository.find).toHaveBeenCalledWith({
        where: { creatorId: 'creator-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('requestPayout', () => {
    it('creates PayoutRequest with status PENDING', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        creatorId: 'creator-1',
        method: PayoutMethod.INSTAPAY,
      });
      payoutRequestRepository.findOne.mockResolvedValue(null);

      jest.spyOn(service, 'getEarnings').mockResolvedValue({
        escrowBalance: '0.00',
        pendingBalance: '2500.00',
        clearedBalance: '0.00',
        currency: 'EGP',
      });

      const result = await service.requestPayout('user-1', {
        amount: '1500.00',
        method: PayoutMethod.INSTAPAY,
      });

      expect(result.status).toBe(PayoutRequestStatus.PENDING);
      expect(result.amount).toBe('1500.00');
      expect(payoutRequestRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: 'creator-1',
          amount: '1500.00',
          method: PayoutMethod.INSTAPAY,
          status: PayoutRequestStatus.PENDING,
        }),
      );
    });

    it('throws 409 when open request already exists', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        creatorId: 'creator-1',
        method: PayoutMethod.INSTAPAY,
      });

      jest.spyOn(service, 'getEarnings').mockResolvedValue({
        escrowBalance: '0.00',
        pendingBalance: '2500.00',
        clearedBalance: '0.00',
        currency: 'EGP',
      });

      payoutRequestRepository.findOne.mockResolvedValue({
        id: 'existing-req',
        status: PayoutRequestStatus.PENDING,
      });

      await expect(
        service.requestPayout('user-1', {
          amount: '500.00',
          method: PayoutMethod.INSTAPAY,
        }),
      ).rejects.toThrow();
    });

    it('throws 422 when amount > available balance', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        creatorId: 'creator-1',
        method: PayoutMethod.INSTAPAY,
      });

      jest.spyOn(service, 'getEarnings').mockResolvedValue({
        escrowBalance: '0.00',
        pendingBalance: '1000.00',
        clearedBalance: '0.00',
        currency: 'EGP',
      });

      await expect(
        service.requestPayout('user-1', {
          amount: '1500.00',
          method: PayoutMethod.INSTAPAY,
        }),
      ).rejects.toThrow();
    });
  });
});
