import * as Ably from 'ably';
import type { ChatTokenResponse } from '@ugcx/shared-types';
import { apiClient } from './apiClient';

/**
 * TASK-P1-012/SEC (security skill): the app never holds an Ably API key.
 * `authCallback` re-requests a fresh collaboration-scoped TokenRequest
 * from the API every time the SDK needs one, including on the 1-hour TTL
 * renewal — so a stale connection is never held past token expiry.
 */
export function createAblyClient(collaborationId: string): Ably.Realtime {
  return new Ably.Realtime({
    authCallback: async (_params, callback) => {
      try {
        const response = await apiClient.post<{ data: ChatTokenResponse }>(
          `/collaborations/${collaborationId}/chat-token`,
        );
        callback(null, response.data.data as Ably.TokenRequest);
      } catch (error) {
        callback(error as Ably.ErrorInfo, null);
      }
    },
  });
}

export function channelNameFor(collaborationId: string): string {
  return `collaboration:${collaborationId}`;
}
