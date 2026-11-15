import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatListItem } from '@ugcx/shared-types';
import { apiPaginated, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useChats() {
  return useQuery({
    queryKey: queryKeys.chats.all,
    queryFn: () => apiPaginated<ChatListItem>('/chats', { perPage: 50 }),
    refetchInterval: 10_000,
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaborationId: string) =>
      apiPost<void>(`/collaborations/${collaborationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
    },
  });
}
