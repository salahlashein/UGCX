const NUMERIC_AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/;

/**
 * Converts a numeric amount (string, number, or null/undefined) to integer cents.
 * Employs string parsing and integer arithmetic to avoid float precision issues.
 */
export function toCents(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }
  let str: string;
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      throw new Error(`toCents: "${amount}" is not a finite number`);
    }
    str = amount.toFixed(2);
  } else {
    str = amount.trim();
  }

  if (!NUMERIC_AMOUNT_PATTERN.test(str)) {
    throw new Error(`toCents: "${amount}" is not a valid numeric(10,2) amount`);
  }

  const [wholePartRaw, fractionPartRaw = ''] = str.split('.');
  const negative = wholePartRaw.startsWith('-');
  const wholePart = wholePartRaw.replace('-', '') || '0';
  const fractionPart = (fractionPartRaw + '00').slice(0, 2);
  const cents = parseInt(wholePart, 10) * 100 + parseInt(fractionPart, 10);
  return negative ? -cents : cents;
}

/**
 * Converts a display amount to integer cents, without a sign.
 *
 * The creator ledger returns `amount` for display, such as "+ 1,000.00" or
 * "− 5,000.00". `toCents` refuses those on purpose, because a raw money field
 * must never carry formatting. Use this helper only on a display string, and
 * take the direction from the row type.
 */
export function displayToCents(amount: string | number | null | undefined): number {
  if (typeof amount !== 'string') {
    return Math.abs(toCents(amount));
  }
  const cleaned = amount
    .replace(/[^\d.,+\-−]/g, '')
    .replace(/[\s,]/g, '')
    .replace(/^[+−-]+/, '');
  if (cleaned === '') return 0;
  return Math.abs(toCents(cleaned));
}

/**
 * Converts integer cents back to a numeric(10,2) string ("3200.00").
 */
export function centsToAmount(cents: number): string {
  if (!Number.isFinite(cents)) {
    return '0.00';
  }
  const rounded = Math.round(cents);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  return `${negative ? '-' : ''}${whole}.${fraction.toString().padStart(2, '0')}`;
}

/**
 * Computes the sum of cents for an array of values.
 */
export function sumCents(values: Array<string | number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + toCents(v), 0);
}

/**
 * Computes the difference (a - b) in integer cents.
 */
export function subCents(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  return toCents(a) - toCents(b);
}
