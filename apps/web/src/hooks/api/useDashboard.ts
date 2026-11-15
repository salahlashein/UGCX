import { useQuery } from '@tanstack/react-query';
import type { BrandDashboard } from '@ugcx/shared-types';
import { apiGet } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';

export function useBrandDashboard() {
  return useQuery({
    queryKey: queryKeys.brand.dashboard(),
    queryFn: () => apiGet<BrandDashboard>('/brands/me/dashboard'),
    staleTime: 1000 * 60 * 2,
  });
}
