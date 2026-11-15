import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import type {
  NotificationDeepLink,
  NotificationEvent,
} from '@ugcx/shared-types';
import { Notification } from './entities/notification.entity';
import { ExpoPushClient } from './expo-push.client';
import { EVENT_AUDIENCE } from './notification-events';
import { PUSH_COPY } from './push-copy';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from '../brands/entities/brand-member.entity';

export interface RecordNotificationInput {
  event: NotificationEvent;
  params?: Record<string, string | number>;
  paramsByRole?: {
    brand?: Record<string, string | number>;
    creator?: Record<string, string | number>;
  };
  brandId?: string;
  creatorUserId?: string;
  explicitUserIds?: string[];
  collaborationId?: string;
  campaignId?: string;
  deepLinkByRole: {
    brand?: NotificationDeepLink;
    creator?: NotificationDeepLink;
  };
}

/**
 * REQ-402, GUD-401: NotificationsService.
 * record() writes notification rows inside the caller transaction.
 * push() sends pushes via ExpoPushClient after commit.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly expoPushClient: ExpoPushClient,
    private readonly usersService: UsersService,
  ) {}

  async record(
    input: RecordNotificationInput,
    manager: EntityManager,
  ): Promise<Notification[]> {
    const recipients = await this.resolveRecipients(input, manager);
    if (recipients.length === 0) return [];

    // Cap fan out at 20 (ASM-P4-401)
    const cappedRecipients = recipients.slice(0, 20);
    if (recipients.length > 20) {
      this.logger.warn(
        `Recipient fan-out for event ${input.event} exceeded 20 (${recipients.length}); capped at 20`,
      );
    }

    const notifRepo = manager.getRepository(Notification);
    const notificationsToCreate: Notification[] = [];

    for (const recipient of cappedRecipients) {
      const deepLink =
        recipient.role === 'brand'
          ? (input.deepLinkByRole.brand ?? null)
          : (input.deepLinkByRole.creator ?? null);

      const params =
        (recipient.role === 'brand'
          ? input.paramsByRole?.brand
          : input.paramsByRole?.creator) ??
        input.params ??
        {};

      const notif = notifRepo.create({
        userId: recipient.userId,
        event: input.event,
        params,
        deepLink,
        collaborationId: input.collaborationId ?? null,
        campaignId: input.campaignId ?? null,
      });

      notificationsToCreate.push(notif);
    }

    return notifRepo.save(notificationsToCreate);
  }

  async push(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return;

    try {
      const userIds = [...new Set(notifications.map((n) => n.userId))];
      const users = await this.usersRepository.findBy({ id: In(userIds) });
      const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

      const messages: {
        to: string;
        title: string;
        body: string;
        data: { notificationId: string; deepLink: NotificationDeepLink | null };
        userId: string;
        notificationId: string;
      }[] = [];

      for (const notif of notifications) {
        const user = userMap.get(notif.userId);
        if (user?.expoPushToken) {
          const copy = PUSH_COPY[notif.event] ?? {
            title: 'Notification',
            body: 'You have a new update',
          };

          messages.push({
            to: user.expoPushToken,
            title: copy.title,
            body: copy.body,
            data: {
              notificationId: notif.id,
              deepLink: notif.deepLink,
            },
            userId: user.id,
            notificationId: notif.id,
          });
        }
      }

      if (messages.length === 0) return;

      const tickets = await this.expoPushClient.send(
        messages.map((m) => ({
          to: m.to,
          title: m.title,
          body: m.body,
          data: m.data,
          sound: 'default',
        })),
      );

      // Walk tickets to clear dead tokens (REQ-405) and mark pushed_at
      const pushedNotifIds: string[] = [];
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const msg = messages[i];
        if (!ticket || !msg) continue;

        if (ticket.status === 'ok') {
          pushedNotifIds.push(msg.notificationId);
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.usersService.clearPushToken(msg.userId);
        }
      }

      if (pushedNotifIds.length > 0) {
        await this.notificationsRepository.update(
          { id: In(pushedNotifIds) },
          { pushedAt: new Date() },
        );
      }
    } catch (err) {
      this.logger.warn(
        `Push notifications send failed: ${(err as Error)?.message}`,
      );
    }
  }

  async list(
    userId: string,
    page = 1,
    perPage = 30,
    unreadOnly = false,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const where: FindOptionsWhere<Notification> = { userId };
    if (unreadOnly) {
      where.readAt = IsNull();
    }

    const [data, total] = await this.notificationsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, readAt: IsNull() },
    });
  }

  async markRead(userId: string, id: string): Promise<void> {
    const notif = await this.notificationsRepository.findOne({ where: { id } });
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    if (!notif.readAt) {
      await this.notificationsRepository.update({ id }, { readAt: new Date() });
    }
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationsRepository.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
    return result.affected ?? 0;
  }

  private async resolveRecipients(
    input: RecordNotificationInput,
    manager: EntityManager,
  ): Promise<{ userId: string; role: 'brand' | 'creator' }[]> {
    const audiences = EVENT_AUDIENCE[input.event];
    const results: { userId: string; role: 'brand' | 'creator' }[] = [];

    if (input.explicitUserIds) {
      for (const uid of input.explicitUserIds) {
        results.push({ userId: uid, role: 'brand' });
      }
    }

    if (input.creatorUserId && audiences.includes('creator')) {
      results.push({ userId: input.creatorUserId, role: 'creator' });
    }

    if (
      input.brandId &&
      (audiences.includes('brand_team') ||
        audiences.includes('brand_owner_approver'))
    ) {
      const memberRepo = manager.getRepository(BrandMember);
      const rolesToQuery = audiences.includes('brand_team')
        ? [
            BrandMemberRole.OWNER,
            BrandMemberRole.APPROVER,
            BrandMemberRole.VIEWER,
          ]
        : [BrandMemberRole.OWNER, BrandMemberRole.APPROVER];

      const members = await memberRepo.find({
        where: {
          brandId: input.brandId,
          status: BrandMemberStatus.ACTIVE,
          role: In(rolesToQuery),
        },
      });

      for (const m of members) {
        if (m.userId) {
          results.push({ userId: m.userId, role: 'brand' });
        }
      }
    }

    // Deduplicate by userId
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });
  }
}
