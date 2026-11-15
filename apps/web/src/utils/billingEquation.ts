import { toCents } from './money';

export interface BillingEquationResult {
  reconciles: boolean;
  computedAvailableCents: number;
  expectedAvailableCents: number;
  diffCents: number;
}

export function verifyBillingEquation(totals: {
  funded: string;
  refunded: string;
  released: string;
  allocated: string;
  available: string;
}): BillingEquationResult {
  const fundedCents = toCents(totals.funded);
  const refundedCents = toCents(totals.refunded);
  const releasedCents = toCents(totals.released);
  const allocatedCents = toCents(totals.allocated);
  const expectedAvailableCents = toCents(totals.available);

  // funded - refunded - released - allocated
  const computedAvailableCents = fundedCents - refundedCents - releasedCents - allocatedCents;

  const diffCents = Math.abs(computedAvailableCents - expectedAvailableCents);

  return {
    reconciles: diffCents === 0,
    computedAvailableCents,
    expectedAvailableCents,
    diffCents,
  };
}
