import type { CollaborationStatus } from './collaborations';

export type MessageKind = 'user' | 'system';

export type SystemMessageEvent =
  | 'escrow_funded'
  | 'shipment_confirmed'
  | 'shipment_received'
  | 'deliverable_submitted'
  | 'revision_requested'
  | 'escrow_released';

export interface Message {
  id: string;
  collaborationId: string;
  kind?: MessageKind;
  event?: SystemMessageEvent | null;
  params?: Record<string, string | number> | null;
  senderUserId: string | null;
  body: string | null;
  sentAt: string;
}

export interface ChatListItem {
  collaborationId: string;
  counterpartName: string;
  counterpartInitials: string;
  campaignTitle: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  collaborationStatus: CollaborationStatus;
}

/** POST /api/v1/collaborations/{id}/messages */
export interface SendMessageRequest {
  body: string;
}

/**
 * POST /api/v1/collaborations/{id}/chat-token response: an Ably
 * TokenRequest the client exchanges for a realtime token. Shape matches
 * Ably's TokenRequest, not redefined field-by-field here.
 */
export interface ChatTokenResponse {
  keyName: string;
  clientId?: string;
  ttl?: number;
  capability: string;
  timestamp: number;
  nonce: string;
  mac: string;
}
