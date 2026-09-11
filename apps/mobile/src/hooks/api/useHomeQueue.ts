import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';

export type HomeTask = {
  id: string;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  collaborationId: string;
  theme: 'coral' | 'forest' | 'dark' | 'cream';
};

export type HomeQueueData = {
  urgentTasks: HomeTask[];
  upcomingTasks: HomeTask[];
};

/**
 * Hook to fetch the creator's home queue.
 */
export function useHomeQueue() {
  return useQuery({
    queryKey: ['creator', 'homeQueue'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: HomeQueueData }>('/creators/me/queue');
      return res.data.data;
    },
  });
}
