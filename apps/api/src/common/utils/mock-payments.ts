/**
 * True only in local development, where Paymob has no account and a payment
 * is marked complete without a card charge. Staging, production and test
 * all use the real payment client.
 */
export function usesMockPayments(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'development';
}
