import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Brand,
  BrandMe,
  BrandMember,
  BrandStats,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  UpdateBrandRequest,
} from '@ugcx/shared-types';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useBrandProfile() {
  return useQuery({
    queryKey: queryKeys.brand.me(),
    queryFn: () => apiGet<BrandMe>('/brands/me'),
  });
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBrandRequest) => apiPatch<Brand>('/brands/me', dto),
    onSuccess: (data) => {
      // PATCH returns the brand without the caller's memberRole. Replacing the
      // cached /brands/me with it dropped the role, so an owner saw the page
      // as read-only (and lost Billing) until a refresh. Keep the role.
      queryClient.setQueryData<BrandMe>(queryKeys.brand.me(), (old) =>
        old ? { ...old, ...data, memberRole: old.memberRole } : (data as BrandMe),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.dashboard() });
    },
  });
}

export function useBrandMembers() {
  return useQuery({
    queryKey: queryKeys.brand.members(),
    queryFn: () => apiGet<BrandMember[]>('/brands/me/members'),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteMemberRequest) => apiPost<BrandMember>('/brands/me/members', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.members() });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UpdateMemberRoleRequest['role'] }) =>
      apiPatch<BrandMember>(`/brands/me/members/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.members() });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/brands/me/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.members() });
    },
  });
}

export function useBrandStats() {
  return useQuery({
    queryKey: queryKeys.brand.stats(),
    queryFn: () => apiGet<BrandStats>('/brands/me/stats'),
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiPost<{ id: string; lastInvitedAt: string }>(`/brands/me/members/${memberId}/resend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brand.members() });
    },
  });
}
