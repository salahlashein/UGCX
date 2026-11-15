import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CloseBriefRequest,
  CloseBriefResponse,
  EscrowBalance,
  FundEscrowRequest,
  FundEscrowResponse,
} from '@ugcx/shared-types';
import { apiGet, apiPost } from '../../services/apiHelpers';
import { centsToAmount, toCents } from '../../utils/money';
import { queryKeys } from '../../services/queryKeys';

export function useEscrowBalance(campaignId: string | undefined, opts?: { poll?: boolean }) {
  return useQuery({
    queryKey: queryKeys.escrow.byCampaign(campaignId),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.escrow.byCampaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useTopUpEscrow(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: FundEscrowRequest) =>
      apiPost<FundEscrowResponse>(`/campaigns/${campaignId}/escrow/top-up`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.escrow.byCampaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.me() });
    },
  });
}

export function useCloseBrief(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CloseBriefRequest) =>
      apiPost<CloseBriefResponse>(`/campaigns/${campaignId}/close`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.escrow.byCampaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export interface ManualEscrowPaymentVariables {
  method: 'instapay' | 'vodafone_cash';
  transactionReference: string;
  senderAccount?: string;
  amount: string | number;
}

export function useManualEscrowPayment(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: ManualEscrowPaymentVariables) => {
      // ManualEscrowPaymentDto.amount requires a number; convert money string at the request edge
      const numAmount =
        typeof variables.amount === 'number'
          ? variables.amount
          : Number(centsToAmount(toCents(variables.amount)));

      return apiPost(`/campaigns/${campaignId}/escrow/manual-payment`, {
        method: variables.method,
        transactionReference: variables.transactionReference,
        senderAccount: variables.senderAccount,
        amount: numAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.escrow.byCampaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.me() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}
