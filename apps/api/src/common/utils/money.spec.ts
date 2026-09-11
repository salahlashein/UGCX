import { calculateFeeCents, centsToAmount, toCents } from './money';

describe('money utils (GUD-001: no floating-point arithmetic on money)', () => {
  describe('toCents', () => {
    it('converts a numeric(10,2) string to integer cents', () => {
      expect(toCents('123.45')).toBe(12345);
      expect(toCents('0.10')).toBe(10);
      expect(toCents('100')).toBe(10000);
      expect(toCents('100.1')).toBe(10010);
    });

    it('handles negative amounts', () => {
      expect(toCents('-50.25')).toBe(-5025);
    });
  });

  describe('centsToAmount', () => {
    it('converts integer cents back to a numeric(10,2) string', () => {
      expect(centsToAmount(12345)).toBe('123.45');
      expect(centsToAmount(10)).toBe('0.10');
      expect(centsToAmount(10000)).toBe('100.00');
    });

    it('round-trips through toCents', () => {
      expect(centsToAmount(toCents('999.99'))).toBe('999.99');
    });
  });

  describe('calculateFeeCents (CON-P1-001: 10% platform fee)', () => {
    it('computes a 10% fee on a whole-number price', () => {
      expect(calculateFeeCents(toCents('1000.00'), 0.1)).toBe(10000); // 100.00
    });

    it('computes a 10% fee on a price with cents, rounding once', () => {
      // 123.45 * 0.10 = 12.345 -> rounds to 12.35 in a single rounding step
      expect(calculateFeeCents(toCents('123.45'), 0.1)).toBe(1235);
    });
  });
});
