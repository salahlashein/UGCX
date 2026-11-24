import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPaginated, apiPatch, apiPost } from '../../services/apiHelpers';

// Response shapes of the /admin endpoints. Only an admin token can call them.

export type VettingStatus = 'pending' | 'approved' | 'rejected';
/** Methods for recording a payout (transactions_payout_method_enum). */
export type PayoutMethod = 'bank_transfer' | 'instapay' | 'vodafone_cash';
/** Methods a creator saves for receiving money (creator_payout_details_method_enum). */
export type CreatorPayoutMethod = 'bank_transfer' | 'instapay' | 'mobile_wallet';

/** The payout method that matches a creator's saved account. */
export function payoutMethodFor(method: CreatorPayoutMethod | undefined): PayoutMethod {
  if (method === 'mobile_wallet') return 'vodafone_cash';
  return method ?? 'instapay';
}

export interface AdminCreator {
  id: string;
  displayName: string | null;
  city: string | null;
  niches: string[];
  basePrice: string | null;
  verificationClipUrl: string | null;
  vettingStatus: VettingStatus;
  createdAt: string;
  /** Account email, shown when the creator has no display name yet. */
  user?: { id: string; email: string | null } | null;
}

export interface AdminPendingEscrow {
  id: string;
  title: string;
  currency: string;
  fundingRequestedAmount: string;
  /** `manual:<method>:<transaction reference>` */
  fundingPaymobOrderId: string;
  createdAt: string;
  brand: {
    id: string;
    companyName: string | null;
    user?: { id: string; email: string | null } | null;
  } | null;
}

export interface AdminPayout {
  id: string;
  creatorPrice: string;
  platformFee: string;
  updatedAt: string;
  campaign: { id: string; title: string } | null;
  creator: {
    id: string;
    displayName: string | null;
    user?: { id: string; email: string | null } | null;
    payoutDetail: {
      method: CreatorPayoutMethod;
      accountIdentifier: string;
      holderName: string;
    } | null;
  } | null;
}

const adminKeys = {
  creators: (status: VettingStatus, page: number) => ['admin', 'creators', status, page] as const,
  escrow: (page: number) => ['admin', 'pending-escrow', page] as const,
  payouts: (page: number) => ['admin', 'payouts', page] as const,
};

export function useAdminCreators(status: VettingStatus, page = 1) {
  return useQuery({
    queryKey: adminKeys.creators(status, page),
    queryFn: () =>
      apiPaginated<AdminCreator>('/admin/creators', { vetting_status: status, page, perPage: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useVetCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reason?: string;
    }) => apiPatch<AdminCreator>(`/admin/creators/${id}/vetting`, { status, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  });
}

export function usePendingEscrow(page = 1) {
  return useQuery({
    queryKey: adminKeys.escrow(page),
    queryFn: () =>
      apiPaginated<AdminPendingEscrow>('/admin/campaigns/pending-escrow', { page, perPage: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useVerifyEscrow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved, note }: { id: string; approved: boolean; note?: string }) =>
      apiPost<{ status: string; fundedAmount: string; message: string }>(
        `/admin/campaigns/${id}/verify-escrow`,
        { approved, note },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pending-escrow'] }),
  });
}

export function useAdminPayouts(page = 1) {
  return useQuery({
    queryKey: adminKeys.payouts(page),
    queryFn: () => apiPaginated<AdminPayout>('/admin/payouts', { page, perPage: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collaborationId,
      method,
      reference,
    }: {
      collaborationId: string;
      method: PayoutMethod;
      reference: string;
    }) =>
      apiPost(`/admin/payouts/${collaborationId}/mark-paid`, {
        method,
        reference,
        paidAt: new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  });
}

/** Splits `manual:<method>:<reference>` into its parts. */
export function parseManualPayment(orderId: string): { method: string; reference: string } {
  const [, method = '', ...rest] = orderId.split(':');
  return { method, reference: rest.join(':') };
}
