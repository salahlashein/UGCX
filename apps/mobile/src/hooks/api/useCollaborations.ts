import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptProposalResponse,
  Collaboration,
  ConfirmShipmentRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPaginated, apiPost } from '../../services/apiHelpers';

/** TASK-P1-007/TASK-P1-004(collab): accept opens the Paymob checkout. */
export function useAcceptProposal() {
  return useMutation({
    mutationFn: (proposalId: string) =>
      apiPost<AcceptProposalResponse>(`/proposals/${proposalId}/accept`),
  });
}

/**
 * REQ-005: `refetchInterval` drives the poll while `enabled`, so the
 * caller only needs to flip `enabled` off on success or the 60s timeout
 * instead of managing a manual interval.
 */
export function useCollaboration(id: string | undefined, options?: { poll?: boolean }) {
  return useQuery({
    queryKey: ['collaborations', id],
    queryFn: () => apiGet<Collaboration>(`/collaborations/${id}`),
    enabled: !!id,
    refetchInterval: options?.poll ? 3000 : false,
  });
}

export function useMyCollaborations() {
  return useQuery({
    queryKey: ['collaborations', 'mine'],
    queryFn: () => apiPaginated<Collaboration>('/collaborations/mine', { perPage: 50 }),
  });
}

/** TASK-P1-008 */
export function useConfirmShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConfirmShipmentRequest }) =>
      apiPost<Collaboration>(`/collaborations/${id}/confirm-shipment`, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(['collaborations', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['collaborations', 'mine'] });
    },
  });
}
