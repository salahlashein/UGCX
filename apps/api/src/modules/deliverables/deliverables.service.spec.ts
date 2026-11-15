import { HttpStatus, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DeliverablesService } from './deliverables.service';
import {
  Deliverable,
  DeliverableStatus,
  DeliverableType,
} from './entities/deliverable.entity';
import { DeliverableFeedback } from './entities/deliverable-feedback.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { Collaboration } from '../collaborations/entities/collaboration.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { BrandsService } from '../brands/brands.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { R2StorageClient } from '../storage/r2-storage.client';
import { UserRole } from '../users/entities/user.entity';
import { Campaign, CampaignStatus } from '../campaigns/entities/campaign.entity';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('DeliverablesService', () => {
  let service: DeliverablesService;
  let deliverablesRepository: any;
  let collaborationsService: any;
  let transactionsService: any;
  let brandsService: any;
  let campaignsService: { completeIfAllSlotsDone: jest.Mock };
  let r2StorageClient: { collaborationUrlPrefix: jest.Mock };
  let messagesService: { createSystemMessage: jest.Mock };
  let notificationsService: { record: jest.Mock; push: jest.Mock };
  let dataSource: any;

  let mockEntityManager: any;

  beforeEach(async () => {
    notificationsService = {
      record: jest.fn().mockResolvedValue([{ id: 'notif-1' }]),
      push: jest.fn().mockResolvedValue(undefined),
    };

    mockEntityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Deliverable) {
          return {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ max: null }),
            })),
            create: jest.fn((dto) => ({ id: 'deliv-new', ...dto })),
            save: jest.fn(async (d) => d),
            count: jest.fn().mockResolvedValue(0),
          };
        }
        if (entity === Campaign) {
          return {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 'camp-1', revisionLimit: 2 }),
          };
        }
        if (entity === DeliverableFeedback) {
          return {
            create: jest.fn((dto) => ({ id: 'fb-new', ...dto })),
            save: jest.fn(async (fb) => fb),
          };
        }
        if (entity === Collaboration) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'collab-1',
              brandId: 'brand-1',
              creatorPrice: '2800.00',
              totalAmount: '3080.00',
              currency: 'EGP',
              campaignId: 'camp-1',
              creator: { userId: 'creator-user-1', displayName: 'Creator One' },
              campaign: { title: 'Test Campaign' },
            }),
          };
        }
        return {};
      }),
    };

    dataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    deliverablesRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    collaborationsService = {
      findOwnedByUser: jest.fn().mockResolvedValue({ id: 'collab-1' }),
      findOwnedByCreator: jest.fn().mockResolvedValue({ id: 'collab-1' }),
      transitionToDelivered: jest.fn().mockResolvedValue(undefined),
      requireDelivered: jest.fn(),
      markApproved: jest.fn().mockResolvedValue(undefined),
      markRevisionRequested: jest.fn().mockResolvedValue(undefined),
    };

    transactionsService = {
      recordRelease: jest.fn().mockResolvedValue({ id: 'tx-rel' }),
      recordFee: jest.fn().mockResolvedValue({ id: 'tx-fee' }),
    };

    brandsService = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'brand-1', companyName: 'Acme Brand' }),
    };

    campaignsService = {
      completeIfAllSlotsDone: jest
        .fn()
        .mockResolvedValue(CampaignStatus.COMPLETED),
    };

    r2StorageClient = {
      collaborationUrlPrefix: jest.fn(
        (id) => `https://cdn.ugcx.io/collaborations/${id}/`,
      ),
    };

    messagesService = {
      createSystemMessage: jest.fn().mockResolvedValue({ id: 'msg-sys' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverablesService,
        {
          provide: getRepositoryToken(Deliverable),
          useValue: deliverablesRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: CollaborationsService, useValue: collaborationsService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: BrandsService, useValue: brandsService },
        { provide: CampaignsService, useValue: campaignsService },
        { provide: R2StorageClient, useValue: r2StorageClient },
        { provide: MessagesService, useValue: messagesService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(DeliverablesService);
  });

  describe('register (TASK-P3-01)', () => {
    it('sets version to 1 on first registration', async () => {
      const result = await service.register('creator-1', 'collab-1', {
        type: DeliverableType.READY_AD,
        fileUrl: 'https://cdn.ugcx.io/collaborations/collab-1/video.mp4',
        durationSeconds: 45,
        note: 'First cut',
      });

      expect(result.version).toBe(1);
      expect(result.note).toBe('First cut');
    });

    it('sets version to 2 on second registration on the same collaboration', async () => {
      mockEntityManager.getRepository = jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: '1' }),
        })),
        create: jest.fn((dto) => ({ id: 'deliv-2', ...dto })),
        save: jest.fn(async (d) => d),
      }));

      const result = await service.register('creator-1', 'collab-1', {
        type: DeliverableType.READY_AD,
        fileUrl: 'https://cdn.ugcx.io/collaborations/collab-1/video-v2.mp4',
      });

      expect(result.version).toBe(2);
    });

    it('maps unique violation on (collaboration_id, version) to 409 duplicate_version', async () => {
      mockEntityManager.getRepository = jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ max: '1' }),
        })),
        create: jest.fn((dto) => dto),
        save: jest.fn(async () => {
          const err: any = new Error('duplicate key');
          err.code = '23505';
          throw err;
        }),
      }));

      await expect(
        service.register('creator-1', 'collab-1', {
          type: DeliverableType.READY_AD,
          fileUrl: 'https://cdn.ugcx.io/collaborations/collab-1/video-v2.mp4',
        }),
      ).rejects.toThrow(DomainErrorException);
    });
  });

  describe('listForCollaboration (TASK-P3-03)', () => {
    it('returns deliverables with feedback thread and senderRole', async () => {
      const mockDeliverables = [
        {
          id: 'del-1',
          version: 1,
          type: DeliverableType.READY_AD,
          fileUrl: 'https://cdn.ugcx.io/collaborations/collab-1/video.mp4',
          durationSeconds: 45,
          status: DeliverableStatus.REVISION_REQUESTED,
          note: 'First cut',
          createdAt: new Date('2026-09-18T10:00:00Z'),
          feedback: [
            {
              id: 'fb-1',
              body: 'Please zoom closer on the product',
              sender: { id: 'user-brand', role: UserRole.BRAND },
              createdAt: new Date('2026-09-18T11:00:00Z'),
            },
          ],
        },
      ];

      deliverablesRepository.createQueryBuilder = jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDeliverables),
      }));

      const list = await service.listForCollaboration(
        { userId: 'creator-1', role: UserRole.CREATOR },
        'collab-1',
      );

      expect(list).toHaveLength(1);
      expect(list[0].feedback).toHaveLength(1);
      expect(list[0].feedback[0].senderRole).toBe('brand');
      expect((list[0].feedback[0] as any).sender).toBeUndefined();
    });
  });

  describe('review (TASK-P3-02, TASK-P3-05)', () => {
    const mockDeliverable = {
      id: 'deliv-1',
      version: 1,
      collaborationId: 'collab-1',
      collaboration: {
        id: 'collab-1',
        brandId: 'brand-1',
        campaignId: 'camp-1',
        totalAmount: '3080.00',
        creatorPrice: '2800.00',
        platformFee: '280.00',
        currency: 'EGP',
        status: 'delivered',
      },
    };

    beforeEach(() => {
      deliverablesRepository.findOne.mockResolvedValue(mockDeliverable);
      collaborationsService.requireDelivered.mockResolvedValue({
        ...mockDeliverable.collaboration,
      });
    });

    it('requireDelivered is called with pessimistic_write lock inside transaction', async () => {
      await service.review('user-brand', 'deliv-1', { action: 'approve' });

      expect(collaborationsService.requireDelivered).toHaveBeenCalledWith(
        'collab-1',
        mockEntityManager,
      );
    });

    it('approve records exactly one release and one fee, returning released amounts', async () => {
      const res = await service.review('user-brand', 'deliv-1', {
        action: 'approve',
      });

      expect(transactionsService.recordRelease).toHaveBeenCalledTimes(1);
      expect(transactionsService.recordRelease).toHaveBeenCalledWith(
        'collab-1',
        '3080.00',
        'EGP',
        mockEntityManager,
      );

      expect(transactionsService.recordFee).toHaveBeenCalledTimes(1);
      expect(transactionsService.recordFee).toHaveBeenCalledWith(
        'collab-1',
        '280.00',
        'EGP',
        mockEntityManager,
      );

      expect(res.releasedAmount).toBe('3080.00');
      expect(res.creatorAmount).toBe('2800.00');
      expect(res.platformFee).toBe('280.00');
      expect(res.currency).toBe('EGP');
      expect(res.campaignStatus).toBe(CampaignStatus.COMPLETED);
    });

    it('approve on an already approved collaboration throws invalid_state_transition', async () => {
      collaborationsService.requireDelivered.mockRejectedValueOnce(
        new DomainErrorException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'invalid_state_transition',
          'A deliverable can only be reviewed on a delivered collaboration',
        ),
      );

      await expect(
        service.review('user-brand', 'deliv-1', { action: 'approve' }),
      ).rejects.toThrow(DomainErrorException);

      expect(transactionsService.recordRelease).not.toHaveBeenCalled();
      expect(transactionsService.recordFee).not.toHaveBeenCalled();
    });

    it('request revision records zero ledger rows and inserts feedback row', async () => {
      const res = await service.review('user-brand', 'deliv-1', {
        action: 'request_revision',
        feedback: 'Please redo the opening hook',
      });

      expect(transactionsService.recordRelease).not.toHaveBeenCalled();
      expect(transactionsService.recordFee).not.toHaveBeenCalled();
      expect(collaborationsService.markRevisionRequested).toHaveBeenCalledTimes(
        1,
      );
      expect(res.status).toBe(DeliverableStatus.REVISION_REQUESTED);
    });

    it('approve records escrow_released notification with total and creator price for brand and price for creator (TASK-P4-04)', async () => {
      deliverablesRepository.findOne.mockResolvedValueOnce({
        id: 'deliv-1',
        version: 1,
        collaborationId: 'collab-1',
        collaboration: { brandId: 'brand-1' },
      });

      await service.review('user-brand', 'deliv-1', { action: 'approve' });

      expect(notificationsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'escrow_released',
          paramsByRole: {
            brand: {
              total: '3080.00',
              creatorPrice: '2800.00',
              currency: 'EGP',
              creatorName: 'Creator One',
            },
            creator: {
              creatorPrice: '2800.00',
              currency: 'EGP',
              brandName: 'Acme Brand',
            },
          },
          brandId: 'brand-1',
          creatorUserId: 'creator-user-1',
        }),
        mockEntityManager,
      );
      expect(notificationsService.push).toHaveBeenCalledTimes(1);
    });

    it('TASK-W4-01: revision request passes when revisionsUsed < revisionLimit', async () => {
      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Campaign) {
          return { findOne: jest.fn().mockResolvedValue({ id: 'camp-1', revisionLimit: 2 }) };
        }
        if (entity === Deliverable) {
          return {
            count: jest.fn().mockResolvedValue(1),
            save: jest.fn().mockResolvedValue({ id: 'deliv-1' }),
          };
        }
        if (entity === DeliverableFeedback) {
          return { create: jest.fn((dto) => dto), save: jest.fn(async (fb) => fb) };
        }
        if (entity === Collaboration) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'collab-1',
              creator: { userId: 'creator-user-1' },
            }),
          };
        }
        return {};
      });

      const res = await service.review('user-brand', 'deliv-1', {
        action: 'request_revision',
        feedback: 'Another tweak please',
      });
      expect(res.status).toBe(DeliverableStatus.REVISION_REQUESTED);
    });

    it('TASK-W4-01: revision request returns 422 when revisionsUsed >= revisionLimit', async () => {
      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Campaign) {
          return { findOne: jest.fn().mockResolvedValue({ id: 'camp-1', revisionLimit: 2 }) };
        }
        if (entity === Deliverable) {
          return { count: jest.fn().mockResolvedValue(2) };
        }
        return {};
      });

      await expect(
        service.review('user-brand', 'deliv-1', {
          action: 'request_revision',
          feedback: 'Too many revisions',
        }),
      ).rejects.toThrow(DomainErrorException);
    });

    it('TASK-W4-01: limit of 0 refuses revision request but approve still passes', async () => {
      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Campaign) {
          return { findOne: jest.fn().mockResolvedValue({ id: 'camp-1', revisionLimit: 0 }) };
        }
        if (entity === Deliverable) {
          return {
            count: jest.fn().mockResolvedValue(0),
            save: jest.fn().mockResolvedValue({ id: 'deliv-1' }),
          };
        }
        if (entity === DeliverableFeedback) {
          return { create: jest.fn((dto) => dto), save: jest.fn(async (fb) => fb) };
        }
        if (entity === Collaboration) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'collab-1',
              creator: { userId: 'creator-user-1' },
            }),
          };
        }
        return {};
      });

      await expect(
        service.review('user-brand', 'deliv-1', {
          action: 'request_revision',
          feedback: 'No revisions allowed',
        }),
      ).rejects.toThrow(DomainErrorException);

      const res = await service.review('user-brand', 'deliv-1', {
        action: 'approve',
      });
      expect(res.status).toBe(DeliverableStatus.APPROVED);
    });

    it('TASK-W4-03: approve with a note writes one deliverable_feedback row', async () => {
      const feedbackSaveMock = jest.fn(async (fb) => fb);
      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Deliverable) {
          return { save: jest.fn().mockResolvedValue({ id: 'deliv-1' }) };
        }
        if (entity === DeliverableFeedback) {
          return { create: jest.fn((dto) => dto), save: feedbackSaveMock };
        }
        if (entity === Collaboration) {
          return {
            findOne: jest.fn().mockResolvedValue({
              id: 'collab-1',
              creator: { userId: 'creator-user-1' },
            }),
          };
        }
        return {};
      });

      await service.review('user-brand', 'deliv-1', {
        action: 'approve',
        feedback: 'Great job on the final cut!',
      });

      expect(feedbackSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deliverableId: 'deliv-1',
          senderUserId: 'user-brand',
          body: 'Great job on the final cut!',
        }),
      );
    });

    it('revision records revision_requested notification for creator only (TASK-P4-04)', async () => {
      deliverablesRepository.findOne.mockResolvedValueOnce({
        id: 'deliv-1',
        version: 1,
        collaborationId: 'collab-1',
        collaboration: { brandId: 'brand-1' },
      });

      await service.review('user-brand', 'deliv-1', {
        action: 'request_revision',
        feedback: 'Please redo hook',
      });

      expect(notificationsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'revision_requested',
          params: {
            brandName: 'Acme Brand',
          },
          creatorUserId: 'creator-user-1',
        }),
        mockEntityManager,
      );
      expect(notificationsService.push).toHaveBeenCalledTimes(1);
    });
  });
});
