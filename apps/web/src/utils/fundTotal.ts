import { toCents } from './money';

/**
 * Calculates the total funding amount in cents for a campaign brief:
 * midpoint of the single-creator budget range (rounded to the nearest whole
 * EGP), plus the platform fee on that price, multiplied by the number of
 * creator slots.
 *
 * The fee is included because accepting a proposal reserves the creator
 * price plus the platform fee from escrow. Without it, a brand that funds
 * the midpoint cannot accept a proposal at the midpoint.
 */
export function fundTotalCents(
  budgetMin: string | number,
  budgetMax: string | number,
  slots: number = 1,
  feeRate: number = 0,
): {
  singleMidpointCents: number;
  singleFeeCents: number;
  totalCents: number;
} {
  const minCents = typeof budgetMin === 'number' ? Math.round(budgetMin * 100) : toCents(budgetMin);
  const maxCents = typeof budgetMax === 'number' ? Math.round(budgetMax * 100) : toCents(budgetMax);
  const safeSlots = Math.max(1, slots);

  // Exact API midpoint rule: Math.round((minCents + maxCents) / 2 / 100) * 100
  const singleMidpointCents = Math.round((minCents + maxCents) / 2 / 100) * 100;
  // Same rounding as the API's calculateFeeCents.
  const singleFeeCents = Math.round((singleMidpointCents * Math.round(feeRate * 10000)) / 10000);
  const totalCents = (singleMidpointCents + singleFeeCents) * safeSlots;

  return { singleMidpointCents, singleFeeCents, totalCents };
}
