import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BrandMember,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '@ugcx/shared-types';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../services/apiHelpers';

const BRAND_MEMBERS_KEY = ['brand', 'members'];

/**
 * TASK-P1-14: Fetch team members for the active brand.
 */
export function useBrandTeam() {
  return useQuery({
    queryKey: BRAND_MEMBERS_KEY,
    queryFn: () => apiGet<BrandMember[]>('/brands/me/members'),
  });
}

/**
 * TASK-P1-14: Invite a new teammate.
 */
export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteMemberRequest) =>
      apiPost<BrandMember>('/brands/me/members', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRAND_MEMBERS_KEY }),
  });
}

/**
 * TASK-P1-14: Update a member's role.
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMemberRoleRequest }) =>
      apiPatch<BrandMember>(`/brands/me/members/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRAND_MEMBERS_KEY }),
  });
}

/**
 * TASK-P1-14: Remove a member from the brand team.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/brands/me/members/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BRAND_MEMBERS_KEY }),
  });
}
