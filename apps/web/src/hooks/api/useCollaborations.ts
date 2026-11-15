import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptProposalResponse,
  Collaboration,
  ConfirmShipmentRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useAcceptProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) =>
      apiPost<AcceptProposalResponse>(`/proposals/${proposalId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useCollaboration(id: string | undefined, options?: { poll?: boolean }) {
  return useQuery({
    queryKey: queryKeys.collaborations.detail(id),
    queryFn: () => apiGet<Collaboration>(`/collaborations/${id}`),
    enabled: !!id,
    refetchInterval: options?.poll ? 3000 : false,
  });
}

export function useMyCollaborations() {
  return useQuery({
    queryKey: queryKeys.collaborations.mine(),
    queryFn: () => apiPaginated<Collaboration>('/collaborations/mine', { perPage: 50 }),
  });
}

export function useConfirmShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConfirmShipmentRequest }) =>
      apiPost<Collaboration>(`/collaborations/${id}/confirm-shipment`, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.collaborations.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.mine() });
    },
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Collaboration>(`/collaborations/${id}/confirm-receipt`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.collaborations.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.creator.homeQueue() });
    },
  });
}
