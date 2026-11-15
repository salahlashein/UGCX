/** The one catalog. Both roles and both apps read it. DEC-007. */
export type NotificationEvent =
  | 'brief_published'
  | 'proposal_received'
  | 'proposal_shortlisted'
  | 'proposal_declined'
  | 'escrow_funded'
  | 'shipment_confirmed'
  | 'shipment_received'
  | 'deliverable_submitted'
  | 'revision_requested'
  | 'escrow_released'
  | 'message_received'
  | 'payout_sent';

export interface NotificationDeepLink {
  stack: string;
  screen: string;
  params?: Record<string, string>;
}

export interface AppNotification {
  id: string;
  event: NotificationEvent;
  params: Record<string, string | number>;
  deepLink: NotificationDeepLink | null;
  collaborationId: string | null;
  campaignId: string | null;
  readAt: string | null;
  createdAt: string;
}

/** GET /api/v1/notifications groups on the client, so the API returns a flat list. */
export interface ListNotificationsRequest {
  page?: number;
  perPage?: number;
  unreadOnly?: boolean;
}

export interface UnreadCountResponse {
  unread: number;
}

export type NotificationCategory =
  | 'money'
  | 'proposals'
  | 'work'
  | 'messages'
  | 'briefs';

export const NOTIFICATION_CATEGORY: Record<NotificationEvent, NotificationCategory> = {
  brief_published: 'briefs',
  proposal_received: 'proposals',
  proposal_shortlisted: 'proposals',
  proposal_declined: 'proposals',
  escrow_funded: 'money',
  shipment_confirmed: 'work',
  shipment_received: 'work',
  deliverable_submitted: 'work',
  revision_requested: 'work',
  escrow_released: 'money',
  message_received: 'messages',
  payout_sent: 'money',
};
