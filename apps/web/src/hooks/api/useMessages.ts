import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatTokenResponse, Message, SendMessageRequest } from '@ugcx/shared-types';
import { apiPaginated, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

const CHAT_POLL_MS = 5_000;

export function useMessages(collaborationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chats.messages(collaborationId),
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

export function useSendMessage(collaborationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SendMessageRequest) =>
      apiPost<Message>(`/collaborations/${collaborationId}/messages`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.messages(collaborationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}
