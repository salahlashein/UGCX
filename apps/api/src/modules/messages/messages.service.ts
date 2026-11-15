import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import * as Ably from 'ably';
import { Message, MessageKind } from './entities/message.entity';
import { AblyTokenService } from './ably-token.service';
import { ChatProviderError } from './chat-provider.error';
import { CollaborationsService } from '../collaborations/collaborations.service';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UserRole } from '../users/entities/user.entity';
import type { SystemMessagePayload } from './system-message';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';

export interface ChatListItemDto {
  collaborationId: string;
  counterpartName: string;
  counterpartInitials: string;
  campaignTitle: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  collaborationStatus: CollaborationStatus;
}

/** TASK-P1-009, TASK-P3-07, TASK-P4-04 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Collaboration)
    private readonly collaborationsRepository: Repository<Collaboration>,
    @Inject(forwardRef(() => CollaborationsService))
    private readonly collaborationsService: CollaborationsService,
    private readonly ablyTokenService: AblyTokenService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  /** REQ-011/EDGE-P1-006 */
  async createChatToken(
    user: AuthUser,
    collaborationId: string,
  ): Promise<Ably.TokenRequest> {
    const collaboration = await this.requireEligibleParticipant(
      user,
      collaborationId,
    );
    try {
      return await this.ablyTokenService.createTokenForCollaboration(
        user.userId,
        collaboration.id,
      );
    } catch (error) {
      if (error instanceof ChatProviderError) {
        throw new DomainErrorException(
          HttpStatus.BAD_GATEWAY,
          'chat_provider_error',
          'Chat service is unavailable, please try again',
        );
      }
      throw error;
    }
  }

  /**
   * TASK-P3-07: lists messages for collaboration, parsing system payload if kind === 'system'
   */
  async list(
    user: AuthUser,
    collaborationId: string,
    page: number,
    perPage: number,
  ): Promise<[Record<string, unknown>[], number]> {
    await this.requireEligibleParticipant(user, collaborationId);
    const [messages, count] = await this.messagesRepository.findAndCount({
      where: { collaborationId },
      order: { sentAt: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const transformed = messages.map((m) => {
      if (m.kind === MessageKind.SYSTEM) {
        let params: Record<string, unknown> = {};
        try {
          params = m.body ? JSON.parse(m.body) : {};
        } catch {
          params = {};
        }
        return {
          id: m.id,
          collaborationId: m.collaborationId,
          kind: m.kind,
          senderUserId: null,
          event: m.event,
          params,
          body: null,
          sentAt: m.sentAt,
        };
      }
      return {
        id: m.id,
        collaborationId: m.collaborationId,
        kind: m.kind,
        senderUserId: m.senderUserId,
        event: null,
        params: null,
        body: m.body,
        sentAt: m.sentAt,
      };
    });

    return [transformed, count];
  }

  async create(
    user: AuthUser,
    collaborationId: string,
    body: string,
  ): Promise<Message> {
    const collaboration = await this.requireEligibleParticipant(
      user,
      collaborationId,
    );

    const { saved, notifications } = await this.dataSource.transaction(
      async (manager) => {
        const messageRepo = manager.getRepository(Message);
        const message = messageRepo.create({
          collaborationId,
          kind: MessageKind.USER,
          senderUserId: user.userId,
          body,
        });
        const savedMessage = await messageRepo.save(message);

        // TASK-P4-04: Deduplication rule from plan (line 575):
        // Skip the record call when an unread message_received notification
        // already exists for the same recipient and the same collaboration.
        // This removes push bursts during active chats.
        const recipientUserId =
          user.role === UserRole.BRAND
            ? collaboration.creator.userId
            : collaboration.brand.userId;

        let notifs: Notification[] = [];
        const existingUnread = await manager
          .getRepository(Notification)
          .findOne({
            where: {
              userId: recipientUserId,
              collaborationId,
              event: 'message_received',
              readAt: IsNull(),
            },
          });

        if (!existingUnread) {
          const isSenderBrand = user.role === UserRole.BRAND;
          const senderName = isSenderBrand
            ? (collaboration.brand.companyName ?? 'Brand')
            : (collaboration.creator.displayName ?? 'Creator');

          notifs = await this.notificationsService.record(
            {
              event: 'message_received',
              params: {
                senderName,
                preview: body.slice(0, 50),
              },
              explicitUserIds: [recipientUserId],
              collaborationId,
              campaignId: collaboration.campaignId,
              deepLinkByRole: {
                brand: {
                  stack: 'ChatsTab',
                  screen: 'CollaborationChat',
                  params: { collaborationId },
                },
                creator: {
                  stack: 'WorkTab',
                  screen: 'CollaborationChat',
                  params: { collaborationId },
                },
              },
            },
            manager,
          );
        }

        return { saved: savedMessage, notifications: notifs };
      },
    );

    if (notifications?.length) {
      await this.notificationsService.push(notifications);
    }

    this.logger.log(
      `Message ${saved.id} posted to collaboration ${collaborationId}`,
    );
    return saved;
  }

  /**
   * TASK-P3-07: createSystemMessage inserts a system chat message inside the caller's transaction.
   */
  async createSystemMessage(
    collaborationId: string,
    payload: SystemMessagePayload,
    manager?: EntityManager,
  ): Promise<Message> {
    const repo = manager
      ? manager.getRepository(Message)
      : this.messagesRepository;

    const message = repo.create({
      collaborationId,
      kind: MessageKind.SYSTEM,
      senderUserId: null,
      event: payload.event,
      body: JSON.stringify(payload.params),
    });

    const saved = await repo.save(message);
    this.logger.log(
      `System message ${saved.id} (${payload.event}) posted to collaboration ${collaborationId}`,
    );
    return saved;
  }

  /**
   * TASK-P3-07: listChats for brand or creator, showing counterpart info, last message preview, and unread counts.
   */
  async listChats(
    user: AuthUser,
    page: number,
    perPage: number,
  ): Promise<[ChatListItemDto[], number]> {
    // 1. Fetch eligible collaborations
    const qb = this.collaborationsRepository
      .createQueryBuilder('collab')
      .innerJoinAndSelect('collab.campaign', 'campaign')
      .innerJoinAndSelect('collab.brand', 'brand')
      .innerJoinAndSelect('collab.creator', 'creator')
      .where('collab.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          CollaborationStatus.PENDING_PAYMENT,
          CollaborationStatus.PAYMENT_FAILED,
          CollaborationStatus.CANCELLED,
        ],
      });

    if (user.role === UserRole.BRAND) {
      qb.andWhere('brand.user_id = :userId', { userId: user.userId });
    } else {
      qb.andWhere('creator.user_id = :userId', { userId: user.userId });
    }

    const [collabs, count] = await qb
      .orderBy('collab.updated_at', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    if (collabs.length === 0) {
      return [[], 0];
    }

    // 2. Fetch latest message and unread count per collaboration
    // One aggregate query for messages across all collabs in page
    const items: ChatListItemDto[] = [];
    for (const collab of collabs) {
      const lastMessage = await this.messagesRepository.findOne({
        where: { collaborationId: collab.id },
        order: { sentAt: 'DESC' },
      });

      const lastReadAt =
        user.role === UserRole.BRAND
          ? collab.brandLastReadAt
          : collab.creatorLastReadAt;

      let unreadCount = 0;
      if (lastReadAt) {
        unreadCount = await this.messagesRepository
          .createQueryBuilder('m')
          .where('m.collaboration_id = :collabId', { collabId: collab.id })
          .andWhere('m.sent_at > :lastReadAt', { lastReadAt })
          .getCount();
      } else {
        unreadCount = await this.messagesRepository.count({
          where: { collaborationId: collab.id },
        });
      }

      const counterpartName =
        user.role === UserRole.BRAND
          ? collab.creator?.displayName || 'Creator'
          : collab.brand?.companyName || 'Brand';

      const counterpartInitials =
        counterpartName
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0].toUpperCase())
          .slice(0, 2)
          .join('') || 'U';

      let lastMessagePreview: string | null = null;
      if (lastMessage) {
        if (lastMessage.kind === MessageKind.SYSTEM) {
          lastMessagePreview = `[${lastMessage.event}]`;
        } else {
          lastMessagePreview = lastMessage.body;
        }
      }

      items.push({
        collaborationId: collab.id,
        counterpartName,
        counterpartInitials,
        campaignTitle: collab.campaign?.title || 'Brief',
        lastMessagePreview,
        lastMessageAt: lastMessage ? lastMessage.sentAt.toISOString() : null,
        unreadCount,
        collaborationStatus: collab.status,
      });
    }

    return [items, count];
  }

  /**
   * TASK-P3-07: markRead updates caller's last read timestamp to now.
   */
  async markRead(user: AuthUser, collaborationId: string): Promise<void> {
    const collab = await this.collaborationsService.requireParticipant(
      user,
      collaborationId,
    );
    const now = new Date();
    if (user.role === UserRole.BRAND) {
      await this.collaborationsRepository.update(collab.id, {
        brandLastReadAt: now,
      });
    } else {
      await this.collaborationsRepository.update(collab.id, {
        creatorLastReadAt: now,
      });
    }
  }

  private async requireEligibleParticipant(
    user: AuthUser,
    collaborationId: string,
  ) {
    const collaboration = await this.collaborationsService.requireParticipant(
      user,
      collaborationId,
    );
    if (!this.collaborationsService.isChatEligible(collaboration)) {
      throw new DomainErrorException(
        HttpStatus.FORBIDDEN,
        'chat_not_available',
        'Chat opens once the collaboration is funded',
      );
    }
    return collaboration;
  }
}
