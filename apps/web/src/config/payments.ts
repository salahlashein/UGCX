// Payment settings for the brief funding page. Next.js inlines
// NEXT_PUBLIC_ values at build time, so each value is read by its full name.

export type ManualMethod = 'instapay' | 'vodafone_cash';

/** The V1 launch uses manual payments. Set to "true" only when Paymob is live. */
export const paymobEnabled = process.env.NEXT_PUBLIC_PAYMOB_ENABLED === 'true';

/**
 * The platform fee added on top of the creator price. Must match the API's
 * PLATFORM_FEE_RATE, or a funded brief comes up short when a proposal is
 * accepted.
 */
export const platformFeeRate = (() => {
  const rate = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_RATE ?? '0.10');
  return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : 0.1;
})();

/** The account a brand sends a manual payment to, per method. */
export const manualPayees: Record<ManualMethod, string> = {
  instapay: (process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? '').trim(),
  vodafone_cash: (process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? '').trim(),
};

/** Manual methods that have a payee. A method without one is not offered. */
export const availableManualMethods = (Object.keys(manualPayees) as ManualMethod[]).filter(
  (method) => manualPayees[method] !== '',
);
