import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatListItem } from '@ugcx/shared-types';
import { apiPaginated, apiPost } from '../../services/apiHelpers';

/**
 * TASK-P3-11: Chat list and read marker hooks.
 */
export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: () => apiPaginated<ChatListItem>('/chats', { perPage: 50 }),
    refetchInterval: 10000, // 10s poll
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaborationId: string) =>
      apiPost<void>(`/collaborations/${collaborationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
