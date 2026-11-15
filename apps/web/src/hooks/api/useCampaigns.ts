import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BriefCounts,
  BriefListItem,
  Campaign,
  CreateCampaignRequest,
  PaginationMeta,
  QueryCampaignsRequest,
  UpdateCampaignRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';
import { apiClient } from '../../services/apiClient';
import { queryKeys } from '../../services/queryKeys';

export function useMyCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns.mine(),
    queryFn: () => apiPaginated<Campaign>('/campaigns/mine', { perPage: 50 }),
  });
}

export function useLiveCampaigns(query: QueryCampaignsRequest = {}) {
  return useQuery({
    queryKey: queryKeys.campaigns.live(query),
    queryFn: () => apiPaginated<Campaign>('/campaigns', { ...query, perPage: 20 }),
  });
}

export type { BriefListItem } from '@ugcx/shared-types';

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => apiGet<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCampaignRequest) => apiPost<Campaign>('/campaigns', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCampaignRequest }) =>
      apiPatch<Campaign>(`/campaigns/${id}`, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.campaigns.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
    },
  });
}

export function usePublishCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/publish`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.campaigns.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export type BriefStatusFilter = 'all' | 'draft' | 'open' | 'completed';

export interface MyBriefsResponse {
  data: BriefListItem[];
  meta: PaginationMeta;
  counts: BriefCounts;
}

export function useMyBriefs(
  statusOrOptions:
    BriefStatusFilter | { status?: BriefStatusFilter; perPage?: number; q?: string } = 'all',
) {
  const status =
    typeof statusOrOptions === 'object' ? (statusOrOptions.status ?? 'all') : statusOrOptions;
  const perPage = typeof statusOrOptions === 'object' ? (statusOrOptions.perPage ?? 50) : 50;
  const q = typeof statusOrOptions === 'object' ? statusOrOptions.q : undefined;
  return useQuery({
    queryKey: queryKeys.campaigns.mine({ status, perPage, q }),
    queryFn: async () => {
      const res = await apiClient.get<MyBriefsResponse>('/campaigns/mine', {
        params: { status, perPage, ...(q ? { q } : {}) },
      });
      return res.data;
    },
  });
}

export function usePauseBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/pause`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.campaigns.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useResumeBrief() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Campaign>(`/campaigns/${id}/resume`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.campaigns.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}
