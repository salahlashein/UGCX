/**
 * TASK-P1-003: thrown by PaymobClient for any failed auth-token,
 * order-registration, or payment-key call. Carries only a safe summary —
 * never Paymob's raw response body — so it can be logged and turned into a
 * clean error response without leaking provider internals (GEN-08).
 */
export class PaymentProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}
