import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProposalRequest,
  CreatorProfilePreview,
  Proposal,
  ProposalQuote,
  UpdateProposalStatusRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useCampaignProposals(
  campaignId: string | undefined,
  params?: { perPage?: number; status?: string },
) {
  return useQuery({
    queryKey: queryKeys.proposals.byCampaign(campaignId, params),
    queryFn: () =>
      apiPaginated<Proposal>(`/campaigns/${campaignId}/proposals`, {
        perPage: params?.perPage ?? 50,
        ...(params?.status ? { status: params.status } : {}),
      }),
    enabled: !!campaignId,
  });
}

export function useMyProposals() {
  return useQuery({
    queryKey: queryKeys.proposals.mine(),
    queryFn: () => apiPaginated<Proposal>('/proposals/mine', { perPage: 50 }),
  });
}

export function useCreateProposal(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProposalRequest) =>
      apiPost<Proposal>(`/campaigns/${campaignId}/proposals`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.byCampaign(campaignId) });
    },
  });
}

export function useUpdateProposalStatus(campaignId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id?: string;
      proposalId?: string;
      dto: UpdateProposalStatusRequest;
    }) => {
      const pid = params.id ?? params.proposalId;
      return apiPatch<Proposal>(`/proposals/${pid}/status`, params.dto);
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.proposals.byCampaign(campaignId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useCreatorProfilePreview(proposalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.proposals.creatorProfile(proposalId),
    queryFn: () => apiGet<CreatorProfilePreview>(`/proposals/${proposalId}/creator-profile`),
    enabled: !!proposalId,
  });
}

export function useProposalQuote(proposalId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.proposals.quote(proposalId),
    queryFn: () => apiGet<ProposalQuote>(`/proposals/${proposalId}/quote`),
    enabled: !!proposalId,
  });
}
