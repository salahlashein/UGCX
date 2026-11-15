import { useQuery } from '@tanstack/react-query';
import type {
  BillingEntry,
  BillingEntryType,
  BillingSummary,
  PaginationLinks,
  PaginationMeta,
} from '@ugcx/shared-types';
import { apiClient } from '../../services/apiClient';
import { queryKeys } from '../../services/queryKeys';

export interface BillingResponse {
  data: BillingEntry[];
  meta: PaginationMeta;
  links: PaginationLinks;
  summary: BillingSummary;
}

export interface UseBillingOptions {
  page?: number;
  perPage?: number;
  type?: BillingEntryType;
}

export function useBilling(optionsOrPage: number | UseBillingOptions = 1, perPageArg = 20) {
  const page = typeof optionsOrPage === 'number' ? optionsOrPage : (optionsOrPage?.page ?? 1);
  const perPage = typeof optionsOrPage === 'number' ? perPageArg : (optionsOrPage?.perPage ?? 20);
  const type = typeof optionsOrPage === 'object' ? optionsOrPage?.type : undefined;

  return useQuery({
    queryKey: queryKeys.billing.me({ page, perPage, type }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (type) {
        params.set('type', type);
      }
      const res = await apiClient.get<BillingResponse>(`/brands/me/billing?${params.toString()}`);
      return res.data;
    },
  });
}
