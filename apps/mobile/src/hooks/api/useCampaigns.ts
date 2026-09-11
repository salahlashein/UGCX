import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Campaign,
  CreateCampaignRequest,
  QueryCampaignsRequest,
  UpdateCampaignRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';

/** TASK-P1-006: brand's own campaigns (any status). */
export function useMyCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'mine'],
    queryFn: () => apiPaginated<Campaign>('/campaigns/mine', { perPage: 50 }),
  });
}

/** TASK-P1-009: creator browse, live campaigns only. */
export function useLiveCampaigns(query: QueryCampaignsRequest) {
  return useQuery({
    queryKey: ['campaigns', 'live', query],
    queryFn: () => apiPaginated<Campaign>('/campaigns', { ...query, perPage: 20 }),
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => apiGet<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignRequest) => apiPost<Campaign>('/campaigns', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignRequest }) =>
      apiPatch<Campaign>(`/campaigns/${id}`, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(['campaigns', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });
}

/** REQ-004: caller reads the thrown error's `details` for inline field errors. */
export function usePublishCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/publish`),
    onSuccess: (data) => {
      queryClient.setQueryData(['campaigns', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });
}
