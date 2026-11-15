import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Campaign,
  CreateCampaignRequest,
  QueryCampaignsRequest,
  UpdateCampaignRequest,
  BriefListItem,
  BriefCounts,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';
import { apiClient } from '../../services/apiClient';

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

export type BriefStatusFilter = 'all' | 'draft' | 'open' | 'completed';

export interface MyBriefsResponse {
  data: BriefListItem[];
  meta: any;
  counts: BriefCounts;
}

/**
 * TASK-P1-13: Fetch brand's briefs filtered by status tab with cached counts.
 */
export function useMyBriefs(status: BriefStatusFilter = 'all') {
  return useQuery({
    queryKey: ['campaigns', 'mine', { status }],
    queryFn: async () => {
      const res = await apiClient.get<{ data: BriefListItem[]; meta: any; counts: BriefCounts }>(
        '/campaigns/mine',
        { params: { status, perPage: 50 } },
      );
      return res.data;
    },
  });
}

/**
 * TASK-P1-13: Pause a live brief.
 */
export function usePauseBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/pause`),
    onSuccess: (data) => {
      queryClient.setQueryData(['campaigns', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });
}

/**
 * TASK-P1-13: Resume a paused brief.
 */
export function useResumeBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/resume`),
    onSuccess: (data) => {
      queryClient.setQueryData(['campaigns', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });
}

/**
 * TASK-P1-13: Close a live or paused brief and trigger refund.
 */
export function useCloseBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<any>(`/campaigns/${id}/close`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
    },
  });
}

