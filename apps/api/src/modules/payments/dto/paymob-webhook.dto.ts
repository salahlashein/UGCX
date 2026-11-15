/**
 * TASK-P1-005: Paymob's native "Transaction Processed Callback" payload.
 * Declared as an interface (not a class-validator DTO) on purpose: Paymob
 * sends many more fields than this plan consumes, and the global
 * ValidationPipe's forbidNonWhitelisted would reject a real Paymob request
 * outright. This route trusts the HMAC signature (REQ-004) instead of a
 * property whitelist for authenticity.
 */
export interface PaymobWebhookTransaction {
  id: number | string;
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  integration_id: number | string;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  order: { id: number | string; merchant_order_id?: string };
  owner: number | string;
  pending: boolean;
  source_data?: { pan?: string; sub_type?: string; type?: string };
  success: boolean;
}

export interface PaymobWebhookPayload {
  type?: string;
  obj: PaymobWebhookTransaction;
}
