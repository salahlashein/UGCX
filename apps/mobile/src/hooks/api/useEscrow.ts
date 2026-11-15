import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EscrowBalance,
  FundEscrowRequest,
  FundEscrowResponse,
  CloseBriefRequest,
  CloseBriefResponse,
} from '@ugcx/shared-types';
import { apiGet, apiPost } from '../../services/apiHelpers';

/**
 * TASK-P2-13: Escrow hooks backing funding, top-up, balance polling, and brief close.
 */
export function useEscrowBalance(
  campaignId: string | undefined,
  opts?: { poll?: boolean },
) {
  return useQuery({
    queryKey: ['escrow', campaignId],
    queryFn: () => apiGet<EscrowBalance>(`/campaigns/${campaignId}/escrow`),
    enabled: !!campaignId,
    refetchInterval: opts?.poll ? 3_000 : false,
  });
}

export function useFundEscrow(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: FundEscrowRequest) =>
      apiPost<FundEscrowResponse>(`/campaigns/${campaignId}/escrow/checkout`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    },
  });
}

export function useTopUpEscrow(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: FundEscrowRequest) =>
      apiPost<FundEscrowResponse>(`/campaigns/${campaignId}/escrow/top-up`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    },
  });
}

export function useCloseBrief(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CloseBriefRequest) =>
      apiPost<CloseBriefResponse>(`/campaigns/${campaignId}/close`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    },
  });
}

export function useSubmitManualEscrow(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      method: 'instapay' | 'vodafone_cash';
      transactionReference: string;
      senderAccount?: string;
      amount: number;
    }) =>
      apiPost<{ success: boolean; message: string; campaignId: string }>(
        `/campaigns/${campaignId}/escrow/manual-payment`,
        dto,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId] });
    },
  });
}


