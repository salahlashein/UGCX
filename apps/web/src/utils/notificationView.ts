import {
  NOTIFICATION_CATEGORY,
  type NotificationCategory,
  type NotificationEvent,
} from '@ugcx/shared-types';

export interface NotificationLike {
  id?: string;
  event?: NotificationEvent;
  params?: Record<string, string | number | undefined>;
  collaborationId?: string | null;
  campaignId?: string | null;
}

/**
 * Returns the category associated with a notification event.
 */
export function getNotificationCategory(event?: NotificationEvent): NotificationCategory {
  if (!event || !NOTIFICATION_CATEGORY[event]) {
    return 'briefs';
  }
  return NOTIFICATION_CATEGORY[event];
}

/**
 * Extracts and returns the relevant money amount from notification params,
 * or null if no amount is associated.
 */
export function getNotificationAmount(notification: NotificationLike): string | null {
  const params = notification?.params || {};
  // A release goes to the creator, and its sentence names the creator's
  // share, so the amount column shows that figure too (UI audit
  // shared-notifications/C1). Other events lead with the total.
  const raw =
    notification?.event === 'escrow_released'
      ? (params.creatorPrice ?? params.total ?? params.amount)
      : (params.total ?? params.creatorPrice ?? params.amount);
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  return String(raw);
}

/**
 * Maps a notification to its target web route based on user role and linked entities.
 */
export function getNotificationActionRoute(
  notification: NotificationLike,
  role: 'brand' | 'creator' = 'brand',
): string {
  if (notification.event === 'message_received' && notification.collaborationId) {
    return `/chats/${notification.collaborationId}`;
  }

  if (notification.collaborationId) {
    if (role === 'creator') {
      return `/creator/work/${notification.collaborationId}`;
    }
    return `/brand/collaborations/${notification.collaborationId}`;
  }

  if (notification.campaignId) {
    if (role === 'creator') {
      return `/creator/discover/${notification.campaignId}`;
    }
    if (notification.event === 'proposal_received') {
      return `/brand/briefs/${notification.campaignId}/proposals`;
    }
    return `/brand/briefs/${notification.campaignId}`;
  }

  return '/notifications';
}
