import { useQuery } from '@tanstack/react-query';
import type { BillingEntry, BillingSummary } from '@ugcx/shared-types';
import { apiClient } from '../../services/apiClient';

export interface BillingResponse {
  data: BillingEntry[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  links: {
    self: string;
    next: string | null;
    last: string;
  };
  summary: BillingSummary;
}

/**
 * TASK-P2-13: Billing ledger hook backing BrandBillingScreen (artboard 4f).
 */
export function useBilling(page: number = 1, perPage: number = 20) {
  return useQuery({
    queryKey: ['billing', 'me', { page, perPage }],
    queryFn: async () => {
      const res = await apiClient.get<BillingResponse>(`/brands/me/billing?page=${page}&perPage=${perPage}`);
      return res.data;
    },
  });
}


