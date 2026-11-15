import { useQuery } from '@tanstack/react-query';
import type { CreatorTaskKind } from '@ugcx/shared-types';
import { apiClient } from '../../services/apiClient';
import { queryKeys } from '../../services/queryKeys';

export interface HomeTask {
  id: string;
  kind?: CreatorTaskKind;
  dueAt?: string | null;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  collaborationId: string;
  theme: 'coral' | 'forest' | 'dark' | 'cream';
}

export interface HomeQueueData {
  urgentTasks: HomeTask[];
  upcomingTasks: HomeTask[];
}

export function useHomeQueue() {
  return useQuery({
    queryKey: queryKeys.creator.homeQueue(),
    queryFn: async () => {
      const res = await apiClient.get<{ data: HomeQueueData }>('/creators/me/queue');
      return res.data.data;
    },
  });
}
