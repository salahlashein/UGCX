export type PaymentIntent = 'campaign_escrow' | 'collaboration_topup';

/** Encodes the intent into the merchant_order_id Paymob echoes back. */
export function encodeMerchantOrderId(
  intent: PaymentIntent,
  id: string,
): string {
  if (intent === 'campaign_escrow') {
    return `cmp_${id}`;
  }
  return `col_${id}`;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Decodes an echoed merchant_order_id. Returns null for an unknown prefix.
 * A bare UUID with no prefix decodes as collaboration_topup for backwards compatibility.
 */
export function decodeMerchantOrderId(
  value: string,
): { intent: PaymentIntent; id: string } | null {
  if (!value) return null;
  if (value.startsWith('cmp_')) {
    return { intent: 'campaign_escrow', id: value.slice(4) };
  }
  if (value.startsWith('col_')) {
    return { intent: 'collaboration_topup', id: value.slice(4) };
  }
  if (UUID_REGEX.test(value)) {
    return { intent: 'collaboration_topup', id: value };
  }
  return null;
}
