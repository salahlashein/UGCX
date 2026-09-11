import { computePaymobHmac, isValidPaymobSignature } from './paymob-signature';
import type { PaymobWebhookTransaction } from './dto/paymob-webhook.dto';

/**
 * RISK-003/TASK-P1-011: dedicated tests for both a valid and a tampered
 * signature, required before this plan is considered done.
 */
describe('Paymob webhook signature verification (REQ-004)', () => {
  const secret = 'test-hmac-secret';

  const transaction: PaymobWebhookTransaction = {
    id: 'txn_123',
    amount_cents: 10000,
    created_at: '2026-08-31T00:00:00Z',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 12345,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 'order_456' },
    owner: 789,
    pending: false,
    source_data: { pan: '1234', sub_type: 'MasterCard', type: 'card' },
    success: true,
  };

  it('accepts a correctly computed signature', () => {
    const validHmac = computePaymobHmac(transaction, secret);
    expect(isValidPaymobSignature(transaction, validHmac, secret)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const validHmac = computePaymobHmac(transaction, secret);
    const lastChar = validHmac[validHmac.length - 1];
    const tamperedHmac = `${validHmac.slice(0, -1)}${lastChar === 'a' ? 'b' : 'a'}`;
    expect(isValidPaymobSignature(transaction, tamperedHmac, secret)).toBe(
      false,
    );
  });

  it('rejects a signature computed with the wrong secret', () => {
    const wrongSecretHmac = computePaymobHmac(transaction, 'wrong-secret');
    expect(isValidPaymobSignature(transaction, wrongSecretHmac, secret)).toBe(
      false,
    );
  });

  it('rejects a missing signature', () => {
    expect(isValidPaymobSignature(transaction, undefined, secret)).toBe(false);
  });

  it('rejects a signature if the transaction payload was tampered with', () => {
    const validHmac = computePaymobHmac(transaction, secret);
    const tamperedTransaction = { ...transaction, success: false };
    expect(isValidPaymobSignature(tamperedTransaction, validHmac, secret)).toBe(
      false,
    );
  });

  it('C1: rejects every request when the configured secret is empty, even a self-forged signature computed with that same empty secret', () => {
    const emptySecret = '';
    // An attacker who knows the secret is unconfigured can compute a
    // "matching" HMAC over an empty key themselves (paymob_order_id is not
    // secret). isValidPaymobSignature must not accept it.
    const forgedHmac = computePaymobHmac(transaction, emptySecret);
    expect(isValidPaymobSignature(transaction, forgedHmac, emptySecret)).toBe(
      false,
    );
  });

  it('C1: rejects when the configured secret is undefined/falsy', () => {
    const forgedHmac = computePaymobHmac(transaction, '');
    expect(
      isValidPaymobSignature(
        transaction,
        forgedHmac,
        undefined as unknown as string,
      ),
    ).toBe(false);
  });
});
