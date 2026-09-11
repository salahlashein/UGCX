import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProposalRequest,
  Proposal,
  UpdateProposalStatusRequest,
} from '@ugcx/shared-types';
import { apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';

/** TASK-P1-007 */
export function useCampaignProposals(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['proposals', 'campaign', campaignId],
    queryFn: () => apiPaginated<Proposal>(`/campaigns/${campaignId}/proposals`, { perPage: 50 }),
    enabled: !!campaignId,
  });
}

/** TASK-P1-009: creator's own applications. */
export function useMyProposals() {
  return useQuery({
    queryKey: ['proposals', 'mine'],
    queryFn: () => apiPaginated<Proposal>('/proposals/mine', { perPage: 50 }),
  });
}

export function useCreateProposal(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProposalRequest) =>
      apiPost<Proposal>(`/campaigns/${campaignId}/proposals`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proposals', 'mine'] }),
  });
}

export function useUpdateProposalStatus(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProposalStatusRequest }) =>
      apiPatch<Proposal>(`/proposals/${id}/status`, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['proposals', 'campaign', campaignId] }),
  });
}
