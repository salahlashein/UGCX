import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePortfolioItemRequest,
  Creator,
  CreatorPayoutDetail,
  CreatorPortfolioItem,
  UpdateCreatorRequest,
  UpsertPayoutDetailsRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPatch, apiPost, apiPut } from '../../services/apiHelpers';

const CREATOR_ME_KEY = ['creator', 'me'];
const PORTFOLIO_KEY = ['creator', 'me', 'portfolio-items'];

/** TASK-P1-011 */
export function useCreatorProfile() {
  return useQuery({
    queryKey: CREATOR_ME_KEY,
    queryFn: () => apiGet<Creator>('/creators/me'),
  });
}

export function useCreatorEarnings() {
  return useQuery({
    queryKey: ['creator', 'me', 'earnings'],
    queryFn: () =>
      apiGet<{ escrowBalance: number; pendingBalance: number; clearedBalance: number }>(
        '/creators/me/earnings',
      ),
  });
}

export function useUpdateCreatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateCreatorRequest) => apiPatch<Creator>('/creators/me', dto),
    onSuccess: (data) => queryClient.setQueryData(CREATOR_ME_KEY, data),
  });
}

export function usePortfolioItems() {
  return useQuery({
    queryKey: PORTFOLIO_KEY,
    queryFn: () => apiGet<CreatorPortfolioItem[]>('/creators/me/portfolio-items'),
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePortfolioItemRequest) =>
      apiPost<CreatorPortfolioItem>('/creators/me/portfolio-items', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY }),
  });
}

/**
 * SEC-002-adjacent (TASK-P1-011): only ever called from the creator's own
 * PayoutDetailsScreen, which is unreachable from the brand navigator
 * (RISK-003 mitigation lives in navigation, not here).
 */
export function usePayoutDetails(creatorId: string | undefined) {
  return useQuery({
    queryKey: ['creator', creatorId, 'payout-details'],
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
      queryClient.setQueryData(['creator', data.creatorId, 'payout-details'], data),
  });
}

export function useCreatorLedger() {
  return useQuery({
    queryKey: ['creator', 'me', 'ledger'],
    queryFn: () => apiGet<any[]>('/creators/me/ledger'),
  });
}

export function useRequestPayout() {
  return useMutation({
    mutationFn: (dto: { amount: string; method: string }) =>
      apiPost<{ success: boolean; message: string }>('/creators/me/payout-requests', dto),
  });
}
