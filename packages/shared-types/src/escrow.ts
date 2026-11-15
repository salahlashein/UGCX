export interface EscrowBalance {
  funded: string;
  allocated: string;
  refunded: string;
  available: string;
  currency: string;
  fundingInProgress: boolean;
  refundPending: boolean;
}

export type FundEscrowMethod = 'card' | 'bank_transfer';

/** POST /api/v1/campaigns/{id}/escrow/checkout and .../top-up */
export interface FundEscrowRequest {
  amount?: number;
  method?: FundEscrowMethod;
}

export interface FundEscrowResponse {
  campaignId: string;
  amount: string;
  currency: string;
  checkoutUrl: string;
  paymobOrderId: string;
}

/** POST /api/v1/campaigns/{id}/close */
export interface CloseBriefRequest {
  reason?: string;
}

export interface CloseBriefResponse {
  campaignId: string;
  status: 'cancelled';
  refundedAmount: string;
  refundPending: boolean;
  declinedProposalCount: number;
}

export interface ManualEscrowPaymentRequest {
  method: 'instapay' | 'vodafone_cash';
  transactionReference: string;
  senderAccount?: string;
  amount: number;
}

export interface ManualEscrowPaymentResponse {
  success: boolean;
  message: string;
  campaignId: string;
}

