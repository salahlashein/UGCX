// Mirrors apps/api/src/modules/messages (feature_backend_escrow_payments).

export interface Message {
  id: string;
  collaborationId: string;
  senderUserId: string;
  body: string;
  sentAt: string;
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
