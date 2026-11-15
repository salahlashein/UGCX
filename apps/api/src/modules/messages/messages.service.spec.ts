import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MessagesService } from './messages.service';
import { Message, MessageKind } from './entities/message.entity';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { AblyTokenService } from './ably-token.service';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';

describe('MessagesService (TASK-P3-07, TASK-P4-04)', () => {
  let service: MessagesService;
  let messagesRepository: any;
  let collaborationsRepository: any;
  let collaborationsService: any;
  let ablyTokenService: any;
  let notificationsService: any;
  let dataSource: any;
  let mockEntityManager: any;
  let notifRepo: any;

  beforeEach(async () => {
    messagesRepository = {
      create: jest.fn((m) => ({ ...m })),
      save: jest.fn((m) =>
        Promise.resolve({ id: 'msg-1', sentAt: new Date(), ...m }),
      ),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      }),
    };

    notifRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockEntityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Message) return messagesRepository;
        if (entity === Notification) return notifRepo;
        return {};
      }),
    };

    dataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    collaborationsRepository = {
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    collaborationsService = {
      requireParticipant: jest.fn().mockResolvedValue({
        id: 'collab-1',
        campaignId: 'camp-1',
        brand: { userId: 'brand-user-1', companyName: 'Acme Brand' },
        creator: { userId: 'creator-user-1', displayName: 'Creator One' },
      }),
      isChatEligible: jest.fn().mockReturnValue(true),
    };

    ablyTokenService = {
      createTokenForCollaboration: jest.fn(),
    };

    notificationsService = {
      record: jest.fn().mockResolvedValue([{ id: 'notif-1' }]),
      push: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: messagesRepository },
        {
          provide: getRepositoryToken(Collaboration),
          useValue: collaborationsRepository,
        },
        { provide: CollaborationsService, useValue: collaborationsService },
        { provide: AblyTokenService, useValue: ablyTokenService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(MessagesService);
  });

  it('1. createSystemMessage inserts a row with a null sender, event name, and params in body', async () => {
    const msg = await service.createSystemMessage('collab-1', {
      event: 'escrow_funded',
      params: { total: '2800.00' },
    });

    expect(messagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaborationId: 'collab-1',
        kind: MessageKind.SYSTEM,
        senderUserId: null,
        event: 'escrow_funded',
        body: JSON.stringify({ total: '2800.00' }),
      }),
    );
    expect(msg.event).toBe('escrow_funded');
  });

  it('2. createSystemMessage runs inside the caller manager if provided', async () => {
    const mockManagerRepo = {
      create: jest.fn((m) => ({ ...m })),
      save: jest.fn((m) => Promise.resolve({ id: 'msg-manager', ...m })),
    };
    const mockManager = {
      getRepository: jest.fn().mockReturnValue(mockManagerRepo),
    } as any;

    await service.createSystemMessage(
      'collab-1',
      { event: 'shipment_confirmed', params: {} },
      mockManager,
    );

    expect(mockManager.getRepository).toHaveBeenCalledWith(Message);
    expect(mockManagerRepo.save).toHaveBeenCalled();
  });

  it('3. list returns a system message with a null body and a populated params', async () => {
    messagesRepository.findAndCount.mockResolvedValueOnce([
      [
        {
          id: 'msg-1',
          collaborationId: 'collab-1',
          kind: MessageKind.SYSTEM,
          senderUserId: null,
          event: 'escrow_released',
          body: JSON.stringify({ total: '3080.00' }),
          sentAt: new Date(),
        },
      ],
      1,
    ]);

    const [items, count] = await service.list(
      { userId: 'user-1', role: UserRole.BRAND } as any,
      'collab-1',
      1,
      20,
    );

    expect(count).toBe(1);
    expect(items[0].kind).toBe(MessageKind.SYSTEM);
    expect(items[0].body).toBeNull();
    expect(items[0].senderUserId).toBeNull();
    expect(items[0].params).toEqual({ total: '3080.00' });
    expect(items[0].event).toBe('escrow_released');
  });

  it('4. listChats excludes pending_payment collaborations', async () => {
    const mockCollabQb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'collab-1',
            status: CollaborationStatus.DELIVERED,
            campaign: { title: 'Serum review' },
            creator: { displayName: 'Nour H.' },
            brandLastReadAt: new Date('2026-09-01'),
          },
        ],
        1,
      ]),
    };
    collaborationsRepository.createQueryBuilder.mockReturnValue(mockCollabQb);

    const [chats, count] = await service.listChats(
      { userId: 'brand-user-1', role: UserRole.BRAND } as any,
      1,
      20,
    );

    expect(mockCollabQb.where).toHaveBeenCalledWith(
      'collab.status NOT IN (:...excludedStatuses)',
      expect.objectContaining({
        excludedStatuses: expect.arrayContaining([
          CollaborationStatus.PENDING_PAYMENT,
        ]),
      }),
    );
    expect(count).toBe(1);
    expect(chats[0].counterpartName).toBe('Nour H.');
    expect(chats[0].counterpartInitials).toBe('NH');
  });

  it('5. markRead updates the caller read timestamp', async () => {
    await service.markRead(
      { userId: 'brand-user-1', role: UserRole.BRAND } as any,
      'collab-1',
    );

    expect(collaborationsRepository.update).toHaveBeenCalledWith(
      'collab-1',
      expect.objectContaining({
        brandLastReadAt: expect.any(Date),
      }),
    );
  });

  it('6. create records message_received when no unread notification exists (TASK-P4-04)', async () => {
    notifRepo.findOne.mockResolvedValueOnce(null);

    await service.create(
      { userId: 'brand-user-1', role: UserRole.BRAND } as any,
      'collab-1',
      'Hello there!',
    );

    expect(notificationsService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'message_received',
        explicitUserIds: ['creator-user-1'],
        params: {
          senderName: 'Acme Brand',
          preview: 'Hello there!',
        },
      }),
      mockEntityManager,
    );
    expect(notificationsService.push).toHaveBeenCalledTimes(1);
  });

  it('7. create records nothing when an unread message_received already exists (TASK-P4-04)', async () => {
    notifRepo.findOne.mockResolvedValueOnce({ id: 'existing-unread-notif' });

    await service.create(
      { userId: 'brand-user-1', role: UserRole.BRAND } as any,
      'collab-1',
      'Second message quickly sent',
    );

    expect(notificationsService.record).not.toHaveBeenCalled();
    expect(notificationsService.push).not.toHaveBeenCalled();
  });
});
