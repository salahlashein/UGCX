import { createHmac, timingSafeEqual } from 'crypto';
import type { PaymobWebhookTransaction } from './dto/paymob-webhook.dto';

// REQ-004: exact field order from Paymob's documented HMAC calculation for
// the "Transaction Processed Callback". Order matters; do not resort.
const HMAC_FIELD_ORDER: (keyof PaymobWebhookTransaction | string)[] = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function fieldValue(
  transaction: PaymobWebhookTransaction,
  field: string,
): string {
  if (field === 'order.id') {
    return String(transaction.order?.id ?? '');
  }
  if (field.startsWith('source_data.')) {
    const key = field.split('.')[1] as 'pan' | 'sub_type' | 'type';
    return String(transaction.source_data?.[key] ?? '');
  }
  const value = (transaction as unknown as Record<string, unknown>)[field];
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/**
 * REQ-004: recomputes the HMAC-SHA512 hex digest Paymob's documentation
 * specifies for a "Transaction Processed" webhook, over the concatenated
 * field values in HMAC_FIELD_ORDER.
 */
export function computePaymobHmac(
  transaction: PaymobWebhookTransaction,
  secret: string,
): string {
  const concatenated = HMAC_FIELD_ORDER.map((field) =>
    fieldValue(transaction, field),
  ).join('');
  return createHmac('sha512', secret).update(concatenated).digest('hex');
}

/**
 * REQ-004/RISK-003: constant-time comparison so response timing cannot
 * leak information about a correct signature. Buffers of unequal length
 * are rejected without calling timingSafeEqual (it throws on length
 * mismatch rather than returning false).
 */
export function isValidPaymobSignature(
  transaction: PaymobWebhookTransaction,
  providedHmac: string | undefined,
  secret: string,
): boolean {
  // C1: a missing/empty configured secret must never be treated as "any
  // signature matches". Without this check, HMAC-SHA512 of an empty key
  // still produces a deterministic digest that an attacker can compute
  // themselves (paymob_order_id is not secret - it is returned from
  // confirm-shipment and published in packages/shared-types), so an
  // unconfigured secret would let a forged webhook fund a collaboration.
  if (!secret) {
    return false;
  }
  if (!providedHmac) {
    return false;
  }
  const expected = computePaymobHmac(transaction, secret);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(providedHmac, 'hex');
  if (
    expectedBuffer.length !== providedBuffer.length ||
    expectedBuffer.length === 0
  ) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, providedBuffer);
}
