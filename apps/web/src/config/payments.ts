// Payment settings for the brief funding page. Next.js inlines
// NEXT_PUBLIC_ values at build time, so each value is read by its full name.

export type ManualMethod = 'instapay' | 'vodafone_cash';

/** The V1 launch uses manual payments. Set to "true" only when Paymob is live. */
export const paymobEnabled = process.env.NEXT_PUBLIC_PAYMOB_ENABLED === 'true';

/** The account a brand sends a manual payment to, per method. */
export const manualPayees: Record<ManualMethod, string> = {
  instapay: (process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? '').trim(),
  vodafone_cash: (process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? '').trim(),
};

/** Manual methods that have a payee. A method without one is not offered. */
export const availableManualMethods = (Object.keys(manualPayees) as ManualMethod[]).filter(
  (method) => manualPayees[method] !== '',
);
