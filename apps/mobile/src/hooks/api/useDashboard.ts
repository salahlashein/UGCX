import { useQuery } from '@tanstack/react-query';
import type { BrandDashboard } from '@ugcx/shared-types';
import { apiGet } from '../../services/apiHelpers';

/**
 * TASK-P3-11 / DES-P3-304: Brand dashboard aggregate endpoint.
 * GET /brands/me/dashboard
 */
export function useBrandDashboard() {
  return useQuery({
    queryKey: ['brand', 'dashboard'],
    queryFn: () => apiGet<BrandDashboard>('/brands/me/dashboard'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
