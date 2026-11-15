import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ExpoPushClient } from './expo-push.client';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from '../brands/entities/brand-member.entity';
import { EVENT_AUDIENCE } from './notification-events';

describe('NotificationsService (TASK-P4-03, TASK-P4-05)', () => {
  let service: NotificationsService;
  let notificationsRepository: any;
  let usersRepository: any;
  let expoPushClient: any;
  let usersService: any;
  let mockEntityManager: any;
  let mockMemberRepo: any;
  let mockNotificationRepo: any;

  beforeEach(async () => {
    mockNotificationRepo = {
      create: jest.fn((n) => ({
        ...n,
        id: `notif-${Math.random().toString(36).substring(7)}`,
      })),
      save: jest.fn((items) =>
        Promise.resolve(Array.isArray(items) ? items : [items]),
      ),
    };

    mockMemberRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockEntityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Notification) return mockNotificationRepo;
        if (entity === BrandMember) return mockMemberRepo;
        return {};
      }),
    };

    notificationsRepository = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    usersRepository = {
      findBy: jest.fn().mockResolvedValue([]),
    };

    expoPushClient = {
      send: jest.fn().mockResolvedValue([]),
    };

    usersService = {
      clearPushToken: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationsRepository,
        },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: ExpoPushClient, useValue: expoPushClient },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('1. record for escrow_released writes two rows, one for the brand approver and one for the creator', async () => {
    mockMemberRepo.find.mockResolvedValueOnce([
      {
        userId: 'brand-approver-1',
        role: BrandMemberRole.APPROVER,
        status: BrandMemberStatus.ACTIVE,
      },
    ]);

    const rows = await service.record(
      {
        event: 'escrow_released',
        params: { total: '3080.00' },
        brandId: 'brand-1',
        creatorUserId: 'creator-user-1',
        deepLinkByRole: {
          brand: {
            stack: 'BriefsTab',
            screen: 'CollaborationDetail',
            params: { id: 'collab-1' },
          },
          creator: { stack: 'EarningsTab', screen: 'Earnings' },
        },
      },
      mockEntityManager,
    );

    expect(rows).toHaveLength(2);
    const userIds = rows.map((r) => r.userId);
    expect(userIds).toContain('brand-approver-1');
    expect(userIds).toContain('creator-user-1');
  });

  it('2. record for a three member brand on brief_published writes three rows', async () => {
    mockMemberRepo.find.mockResolvedValueOnce([
      {
        userId: 'u-1',
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      },
      {
        userId: 'u-2',
        role: BrandMemberRole.APPROVER,
        status: BrandMemberStatus.ACTIVE,
      },
      {
        userId: 'u-3',
        role: BrandMemberRole.VIEWER,
        status: BrandMemberStatus.ACTIVE,
      },
    ]);

    const rows = await service.record(
      {
        event: 'brief_published',
        params: { title: 'New Brief' },
        brandId: 'brand-1',
        deepLinkByRole: {
          brand: { stack: 'BriefsTab', screen: 'MyBriefs' },
        },
      },
      mockEntityManager,
    );

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.userId)).toEqual(['u-1', 'u-2', 'u-3']);
  });

  it('3. record writes with the caller manager repository', async () => {
    mockMemberRepo.find.mockResolvedValueOnce([
      {
        userId: 'u-1',
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      },
    ]);

    await service.record(
      {
        event: 'brief_published',
        params: {},
        brandId: 'brand-1',
        deepLinkByRole: {},
      },
      mockEntityManager,
    );

    expect(mockEntityManager.getRepository).toHaveBeenCalledWith(Notification);
    expect(mockNotificationRepo.save).toHaveBeenCalled();
  });

  it('4. record stores params and deep_link and never a rendered sentence', async () => {
    mockMemberRepo.find.mockResolvedValueOnce([
      {
        userId: 'u-1',
        role: BrandMemberRole.OWNER,
        status: BrandMemberStatus.ACTIVE,
      },
    ]);

    const rows = await service.record(
      {
        event: 'proposal_received',
        params: { count: 3, title: 'Summer Campaign' },
        brandId: 'brand-1',
        deepLinkByRole: {
          brand: {
            stack: 'BriefsTab',
            screen: 'ProposalsInbox',
            params: { campaignId: 'c-1' },
          },
        },
      },
      mockEntityManager,
    );

    expect(rows[0].params).toEqual({ count: 3, title: 'Summer Campaign' });
    expect(rows[0].deepLink).toEqual({
      stack: 'BriefsTab',
      screen: 'ProposalsInbox',
      params: { campaignId: 'c-1' },
    });
    // Ensure no sentence property
    expect((rows[0] as any).body).toBeUndefined();
    expect((rows[0] as any).text).toBeUndefined();
  });

  it('5. push skips a user with a null token', async () => {
    usersRepository.findBy.mockResolvedValueOnce([
      { id: 'u-1', expoPushToken: null },
    ]);

    const notifs = [
      {
        id: 'notif-1',
        userId: 'u-1',
        event: 'proposal_received' as const,
        params: {},
        deepLink: null,
      },
    ] as any;

    await service.push(notifs);

    expect(expoPushClient.send).not.toHaveBeenCalled();
  });

  it('6. push never throws when the client rejects', async () => {
    usersRepository.findBy.mockResolvedValueOnce([
      { id: 'u-1', expoPushToken: 'ExponentPushToken[user1]' },
    ]);
    expoPushClient.send.mockRejectedValueOnce(new Error('Push network error'));

    const notifs = [
      {
        id: 'notif-1',
        userId: 'u-1',
        event: 'proposal_received' as const,
        params: {},
        deepLink: null,
      },
    ] as any;

    await expect(service.push(notifs)).resolves.not.toThrow();
  });

  it('7. The service enum list equals the database enum list', () => {
    const dbEnumList = [
      'brief_published',
      'proposal_received',
      'proposal_shortlisted',
      'proposal_declined',
      'escrow_funded',
      'shipment_confirmed',
      'shipment_received',
      'deliverable_submitted',
      'revision_requested',
      'escrow_released',
      'message_received',
      'payout_sent',
    ];

    const serviceEnumList = Object.keys(EVENT_AUDIENCE);
    expect(serviceEnumList.sort()).toEqual(dbEnumList.sort());
    expect(serviceEnumList).toHaveLength(12);
  });

  it('8. The fan out caps at 20 and logs a warning', async () => {
    const warnSpy = jest
      .spyOn((service as any).logger, 'warn')
      .mockImplementation(() => {});

    // 25 members
    const members = Array.from({ length: 25 }, (_, i) => ({
      userId: `member-${i}`,
      role: BrandMemberRole.APPROVER,
      status: BrandMemberStatus.ACTIVE,
    }));
    mockMemberRepo.find.mockResolvedValueOnce(members);

    const rows = await service.record(
      {
        event: 'brief_published',
        params: {},
        brandId: 'brand-1',
        deepLinkByRole: {},
      },
      mockEntityManager,
    );

    expect(rows).toHaveLength(20);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('capped at 20'),
    );
  });

  describe('Notification endpoints (TASK-P4-05)', () => {
    it('1. list returns only the caller rows', async () => {
      notificationsRepository.findAndCount.mockResolvedValueOnce([
        [{ id: 'n-1', userId: 'user-caller' }],
        1,
      ]);

      const result = await service.list('user-caller', 1, 30, false);

      expect(notificationsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-caller' }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].userId).toBe('user-caller');
    });

    it('2. list with unreadOnly filters on null read_at', async () => {
      notificationsRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.list('user-caller', 1, 30, true);

      expect(notificationsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-caller',
            readAt: expect.anything(),
          }),
        }),
      );
    });

    it('3. markRead on another user row throws NotFoundException', async () => {
      notificationsRepository.findOne.mockResolvedValueOnce({
        id: 'n-1',
        userId: 'other-user',
      });

      await expect(
        service.markRead('user-caller', 'n-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('4. markRead twice leaves the first timestamp', async () => {
      const existingDate = new Date('2026-09-01T12:00:00Z');
      notificationsRepository.findOne.mockResolvedValueOnce({
        id: 'n-1',
        userId: 'user-caller',
        readAt: existingDate,
      });

      await service.markRead('user-caller', 'n-1');

      expect(notificationsRepository.update).not.toHaveBeenCalled();
    });

    it('5. markAllRead returns the affected count', async () => {
      notificationsRepository.update.mockResolvedValueOnce({ affected: 12 });

      const count = await service.markAllRead('user-caller');

      expect(count).toBe(12);
      expect(notificationsRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-caller' }),
        expect.objectContaining({ readAt: expect.any(Date) }),
      );
    });
  });
});
