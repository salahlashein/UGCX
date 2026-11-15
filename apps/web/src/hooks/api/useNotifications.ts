import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotification, UnreadCountResponse } from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useNotifications(unreadOnly = false, page = 1, perPage = 30) {
  return useQuery({
    queryKey: queryKeys.notifications.list({ unreadOnly, page, perPage }),
    queryFn: () =>
      apiPaginated<AppNotification>('/notifications', {
        page,
        perPage,
        ...(unreadOnly ? { unreadOnly: true } : {}),
      }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => apiGet<UnreadCountResponse>('/notifications/unread-count'),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<void>(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ marked: number }>('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
