import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Deliverable,
  PlayUrlResponse,
  RegisterDeliverableRequest,
  RequestUploadUrlRequest,
  RequestUploadUrlResponse,
  ReviewDeliverableRequest,
  ReviewDeliverableResponse,
} from '@ugcx/shared-types';
import { apiGet, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useCollaborationDeliverables(collaborationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.collaborations.deliverables(collaborationId),
    queryFn: () => apiGet<Deliverable[]>(`/collaborations/${collaborationId}/deliverables`),
    enabled: !!collaborationId,
  });
}

export function useDeliverablePlayUrl(deliverableId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.deliverables.playUrl(deliverableId),
    queryFn: () => apiGet<PlayUrlResponse>(`/deliverables/${deliverableId}/play-url`),
    enabled: !!deliverableId,
    staleTime: 60_000,
  });
}

export function useRequestDeliverableUploadUrl(collaborationId: string) {
  return useMutation({
    mutationFn: (dto: RequestUploadUrlRequest) =>
      apiPost<RequestUploadUrlResponse>(
        `/collaborations/${collaborationId}/deliverables/upload-url`,
        dto,
      ),
  });
}

export function useRegisterDeliverable(collaborationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDeliverableRequest) =>
      apiPost<Deliverable>(`/collaborations/${collaborationId}/deliverables`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.detail(collaborationId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collaborations.deliverables(collaborationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.mine() });
    },
  });
}

export function useReviewDeliverable(collaborationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReviewDeliverableRequest }) =>
      apiPost<ReviewDeliverableResponse>(`/deliverables/${id}/review`, dto),
    onSuccess: () => {
      if (collaborationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.collaborations.detail(collaborationId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.collaborations.deliverables(collaborationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.collaborations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.mine() });
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.me() });
    },
  });
}
