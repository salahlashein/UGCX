/**
 * GUD-001: no floating-point arithmetic on money. These helpers convert
 * between a numeric(10,2) string (e.g. "123.45") and integer cents using
 * only string parsing and integer math, never float addition/multiplication
 * on the decimal amount itself.
 */

// L5: a malformed amount must never silently become NaN - NaN can flow
// into amount_cents sent to Paymob (a real charge for an undefined amount).
const NUMERIC_AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

/** Converts a numeric(10,2) string like "123.45" to integer cents (12345). */
export function toCents(amount: string): number {
  const trimmed = amount.trim();
  if (!NUMERIC_AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(`toCents: "${amount}" is not a valid numeric(10,2) amount`);
  }

  const [wholePartRaw, fractionPartRaw = ''] = trimmed.split('.');
  const negative = wholePartRaw.startsWith('-');
  const wholePart = wholePartRaw.replace('-', '') || '0';
  const fractionPart = (fractionPartRaw + '00').slice(0, 2);
  const cents = parseInt(wholePart, 10) * 100 + parseInt(fractionPart, 10);
  return negative ? -cents : cents;
}

/** Converts integer cents (12345) back to a numeric(10,2) string ("123.45"). */
export function centsToAmount(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  return `${negative ? '-' : ''}${whole}.${fraction.toString().padStart(2, '0')}`;
}

/**
 * CON-P1-001: platform fee is a configured rate (e.g. 0.10) applied to the
 * creator's price. The rate is converted to integer basis points once, so
 * the per-collaboration fee calculation is pure integer math.
 */
export function calculateFeeCents(priceCents: number, rate: number): number {
  const rateBasisPoints = Math.round(rate * 10000);
  return Math.round((priceCents * rateBasisPoints) / 10000);
}
