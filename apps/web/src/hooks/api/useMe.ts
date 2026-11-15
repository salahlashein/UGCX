import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateMeRequest, UserMeResponse } from '@ugcx/shared-types';
import { apiGet, apiPatch } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: () => apiGet<UserMeResponse>('/users/me'),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateMeRequest) => apiPatch<UserMeResponse>('/users/me', dto),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.me(), data);
    },
  });
}
