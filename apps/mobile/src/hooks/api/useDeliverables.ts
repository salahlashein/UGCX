import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Deliverable,
  RegisterDeliverableRequest,
  RequestUploadUrlRequest,
  RequestUploadUrlResponse,
  ReviewDeliverableRequest,
  ReviewDeliverableResponse,
} from '@ugcx/shared-types';
import { apiGet, apiPost } from '../../services/apiHelpers';

/** feature_mobile_app_phase1 addendum: GET /collaborations/{id}/deliverables. */
export function useCollaborationDeliverables(collaborationId: string | undefined) {
  return useQuery({
    queryKey: ['collaborations', collaborationId, 'deliverables'],
    queryFn: () => apiGet<Deliverable[]>(`/collaborations/${collaborationId}/deliverables`),
    enabled: !!collaborationId,
  });
}

/** TASK-P1-010 */
export function useRequestUploadUrl(collaborationId: string) {
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['collaborations', collaborationId] }),
  });
}

/** TASK-P1-008 */
export function useReviewDeliverable(collaborationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReviewDeliverableRequest }) =>
      apiPost<ReviewDeliverableResponse>(`/deliverables/${id}/review`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations', collaborationId] });
      queryClient.invalidateQueries({
        queryKey: ['collaborations', collaborationId, 'deliverables'],
      });
    },
  });
}
