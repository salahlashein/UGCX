// Mirrors apps/api/src/modules/transactions (feature_backend_escrow_payments).
// This is the escrow ledger; no endpoint returns a raw Transaction list in
// this plan, so these types back the admin payout endpoints only.

export type TransactionType = 'charge' | 'hold' | 'release' | 'payout' | 'refund' | 'fee';

// Distinct from creators.ts's PayoutMethod (a creator's on-file payout
// preference): this is the admin's ops evidence trail for one specific
// payout event and allows 'vodafone_cash' instead of 'mobile_wallet'.
export type AdminPayoutMethod = 'bank_transfer' | 'instapay' | 'vodafone_cash';

/** POST /api/v1/admin/payouts/{collaborationId}/mark-paid */
export interface MarkPaidRequest {
  method: AdminPayoutMethod;
  reference: string;
  paidAt: string;
}

export interface MarkPaidResponse {
  transactionId: string;
  collaborationStatus: 'paid';
}
