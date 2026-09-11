import { useMutation, useQuery } from '@tanstack/react-query';
import type { ChatTokenResponse, Message, SendMessageRequest } from '@ugcx/shared-types';
import { apiPaginated, apiPost } from '../../services/apiHelpers';

/** TASK-P1-012: DES-P1-006, history fetched once here; live updates come only from Ably. */
export function useMessages(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', collaborationId],
    queryFn: () =>
      apiPaginated<Message>(`/collaborations/${collaborationId}/messages`, { perPage: 100 }),
    enabled: !!collaborationId,
    refetchOnWindowFocus: false,
  });
}

export function useChatToken(collaborationId: string | undefined) {
  return useMutation({
    mutationFn: () => apiPost<ChatTokenResponse>(`/collaborations/${collaborationId}/chat-token`),
  });
}

/**
 * DES-P1-006: this call only persists the message via the REST API; it is
 * never used to re-fetch or display it. ChatScreen renders the sender's
 * own message once Ably echoes it back on the subscribed channel, the
 * same path every other participant's message takes.
 */
export function useSendMessage(collaborationId: string) {
  return useMutation({
    mutationFn: (dto: SendMessageRequest) =>
      apiPost<Message>(`/collaborations/${collaborationId}/messages`, dto),
  });
}
