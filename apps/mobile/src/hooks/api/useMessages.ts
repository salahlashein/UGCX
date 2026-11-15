import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatTokenResponse, Message, SendMessageRequest } from '@ugcx/shared-types';
import { apiPaginated, apiPost } from '../../services/apiHelpers';

/** How often an open chat re-reads history. Ably push is not wired in the screen yet. */
const CHAT_POLL_MS = 5_000;

/** TASK-P1-012: history fetch. The open chat polls so both sides see new messages. */
export function useMessages(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', collaborationId],
    queryFn: () =>
      apiPaginated<Message>(`/collaborations/${collaborationId}/messages`, { perPage: 100 }),
    enabled: !!collaborationId,
    refetchOnWindowFocus: false,
    refetchInterval: CHAT_POLL_MS,
  });
}

export function useChatToken(collaborationId: string | undefined) {
  return useMutation({
    mutationFn: () => apiPost<ChatTokenResponse>(`/collaborations/${collaborationId}/chat-token`),
  });
}

/**
 * Persists the message, then re-reads the thread so the sender sees it at once.
 * Without this the sender sees nothing until the next poll.
 */
export function useSendMessage(collaborationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SendMessageRequest) =>
      apiPost<Message>(`/collaborations/${collaborationId}/messages`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', collaborationId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
