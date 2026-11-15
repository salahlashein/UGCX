import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePortfolioItemRequest,
  Creator,
  CreatorEarnings,
  CreatorLedgerEntry,
  CreatorPayoutDetail,
  CreatorPortfolioItem,
  CreatorStats,
  PayoutRequestSummary,
  UpdateCreatorRequest,
  UpsertPayoutDetailsRequest,
} from '@ugcx/shared-types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useCreatorProfile() {
  return useQuery({
    queryKey: queryKeys.creator.me(),
    queryFn: () => apiGet<Creator>('/creators/me'),
  });
}

export function useCreatorEarnings() {
  return useQuery({
    queryKey: queryKeys.creator.earnings(),
    queryFn: () => apiGet<CreatorEarnings>('/creators/me/earnings'),
  });
}

export function useUpdateCreatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateCreatorRequest) => apiPatch<Creator>('/creators/me', dto),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.creator.me(), data),
  });
}

export function usePortfolioItems() {
  return useQuery({
    queryKey: queryKeys.creator.portfolio(),
    queryFn: () => apiGet<CreatorPortfolioItem[]>('/creators/me/portfolio-items'),
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePortfolioItemRequest) =>
      apiPost<CreatorPortfolioItem>('/creators/me/portfolio-items', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.creator.portfolio() }),
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/creators/me/portfolio-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.creator.portfolio() }),
  });
}

export function usePayoutDetails(creatorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.creator.payoutDetails(creatorId),
    queryFn: () => apiGet<CreatorPayoutDetail>(`/creators/${creatorId}/payout-details`),
    enabled: !!creatorId,
    retry: false,
  });
}

export function useUpsertPayoutDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpsertPayoutDetailsRequest) =>
      apiPut<CreatorPayoutDetail>('/creators/me/payout-details', dto),
    onSuccess: (data) =>
      queryClient.setQueryData(queryKeys.creator.payoutDetails(data.creatorId), data),
  });
}

export function useCreatorLedger() {
  return useQuery({
    queryKey: queryKeys.creator.ledger(),
    queryFn: () => apiGet<CreatorLedgerEntry[]>('/creators/me/ledger'),
  });
}

export function usePayoutRequests() {
  return useQuery({
    queryKey: queryKeys.creator.payoutRequests(),
    queryFn: () => apiGet<PayoutRequestSummary[]>('/creators/me/payout-requests'),
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { amount: string; method: string }) =>
      apiPost<{ success: boolean; message: string }>('/creators/me/payout-requests', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creator.earnings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.creator.ledger() });
      queryClient.invalidateQueries({ queryKey: queryKeys.creator.payoutRequests() });
    },
  });
}

export function useCreatorStats() {
  return useQuery({
    queryKey: queryKeys.creator.stats(),
    queryFn: () => apiGet<CreatorStats>('/creators/me/stats'),
  });
}
