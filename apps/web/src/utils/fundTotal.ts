import { toCents } from './money';

/**
 * Calculates the total funding amount in cents for a campaign brief:
 * Midpoint of single creator budget range (rounded to nearest whole EGP),
 * multiplied by the number of creator slots.
 */
export function fundTotalCents(
  budgetMin: string | number,
  budgetMax: string | number,
  slots: number = 1,
): {
  singleMidpointCents: number;
  totalCents: number;
} {
  const minCents = typeof budgetMin === 'number' ? Math.round(budgetMin * 100) : toCents(budgetMin);
  const maxCents = typeof budgetMax === 'number' ? Math.round(budgetMax * 100) : toCents(budgetMax);
  const safeSlots = Math.max(1, slots);

  // Exact API midpoint rule: Math.round((minCents + maxCents) / 2 / 100) * 100
  const singleMidpointCents = Math.round((minCents + maxCents) / 2 / 100) * 100;
  const totalCents = singleMidpointCents * safeSlots;

  return { singleMidpointCents, totalCents };
}
