/**
 * A manual (InstaPay / Vodafone Cash) payment the brand submitted and the
 * admin has not confirmed yet. The API keeps it on the campaign as
 * `fundingPaymobOrderId = manual:<method>:<reference>` with the amount in
 * `fundingRequestedAmount`.
 *
 * Every screen that would otherwise ask the brand to fund the brief checks
 * this first, so a brand is never invited to pay twice (UI audit G8).
 */
export interface PendingPayment {
  method: string;
  reference: string;
  amount: string | null;
}

interface FundingFields {
  fundingPaymobOrderId?: string | null;
  fundingRequestedAmount?: string | null;
}

export function pendingManualPayment(campaign?: FundingFields | null): PendingPayment | null {
  const orderId = campaign?.fundingPaymobOrderId;
  if (!orderId || !orderId.startsWith('manual:')) return null;
  const [, method = '', ...rest] = orderId.split(':');
  return {
    method,
    reference: rest.join(':'),
    amount: campaign?.fundingRequestedAmount ?? null,
  };
}

export function paymentMethodLabel(method: string, isAr: boolean): string {
  if (method === 'instapay') return isAr ? 'إنستاباي' : 'InstaPay';
  if (method === 'vodafone_cash') return isAr ? 'فودافون كاش' : 'Vodafone Cash';
  return method;
}

/** One-line status for a brief whose payment is being checked. */
export function pendingPaymentLine(
  payment: PendingPayment,
  formatAmount: (v: string) => string,
  isAr: boolean,
): string {
  const amount = payment.amount ? formatAmount(payment.amount) : '';
  const via = paymentMethodLabel(payment.method, isAr);
  return isAr
    ? `الدفع بيتراجع · ${amount} ${via} · رقم ${payment.reference}`
    : `Payment being checked · ${amount} by ${via} · ref ${payment.reference}`;
}
