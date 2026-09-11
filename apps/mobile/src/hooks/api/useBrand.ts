import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Brand, UpdateBrandRequest } from '@ugcx/shared-types';
import { apiGet, apiPatch } from '../../services/apiHelpers';

const BRAND_ME_KEY = ['brand', 'me'];

export function useBrandProfile() {
  return useQuery({
    queryKey: BRAND_ME_KEY,
    queryFn: () => apiGet<Brand>('/brands/me'),
  });
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBrandRequest) => apiPatch<Brand>('/brands/me', dto),
    onSuccess: (data) => queryClient.setQueryData(BRAND_ME_KEY, data),
  });
}
