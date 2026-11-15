import { displayToCents, centsToAmount } from './money';

export interface LedgerRowLike {
  type: string;
  amount: string | number;
  [key: string]: unknown;
}

/**
 * Calculates the running available balance in cents for a chronological series of ledger rows.
 * - 'hold': Does not change available balance (escrow held).
 * - 'release': Adds amount to available balance.
 * - 'payout': Subtracts amount from available balance.
 */
export function runningBalance(rows: LedgerRowLike[]): number[] {
  let currentCents = 0;
  const balances: number[] = [];

  for (const row of rows) {
    const type = (row.type || '').toLowerCase();
    // The API sends `amount` as a display string with a sign and a space.
    const cents = displayToCents(row.amount);

    if (type === 'release') {
      currentCents += cents;
    } else if (type === 'payout') {
      currentCents -= cents;
    }
    // hold rows do not change the available balance

    balances.push(currentCents);
  }

  return balances;
}

/**
 * Calculates the running available balance formatted as numeric(10,2) strings.
 */
export function runningBalanceAmounts(rows: LedgerRowLike[]): string[] {
  return runningBalance(rows).map(centsToAmount);
}
