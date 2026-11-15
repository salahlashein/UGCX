import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toCents, centsToAmount, sumCents, subCents } from '../utils/money';
import { formatAmount, formatMoney, formatRef, formatResend } from '../utils/format';

describe('Web Money & Format Helpers', () => {
  it('formats resend timer as 0:42 for 42 and 0:00 for 0', () => {
    assert.equal(formatResend(42), '0:42');
    assert.equal(formatResend(0), '0:00');
    assert.equal(formatResend(-5), '0:00');
  });
  it('converts amounts to integer cents without floating point drift', () => {
    assert.equal(toCents('3200.50'), 320050);
    assert.equal(toCents('0.1') + toCents('0.2'), toCents('0.3'));
    assert.equal(toCents(100.5), 10050);
    assert.equal(toCents(null), 0);
    assert.equal(toCents(undefined), 0);
  });

  it('converts integer cents back to two-decimal numeric strings', () => {
    assert.equal(centsToAmount(320050), '3200.50');
    assert.equal(centsToAmount(5), '0.05');
    assert.equal(centsToAmount(0), '0.00');
    assert.equal(centsToAmount(-12345), '-123.45');
  });

  it('sums and subtracts cents cleanly and throws on invalid formats', () => {
    assert.equal(sumCents(['0.10', '0.20']), 30);
    assert.equal(subCents('100.00', '40.25'), 5975);
    assert.throws(() => toCents('abc'));
    assert.throws(() => toCents('1.234'));
  });

  it('formats money with standard two-decimal precision and thousands separators', () => {
    assert.equal(formatAmount('3500'), '3,500.00');
    assert.equal(formatMoney('2400'), 'EGP 2,400.00');
    assert.equal(formatMoney('-5000'), 'EGP -5,000.00');
    assert.equal(formatMoney(null), 'EGP 0.00');
  });

  it('formats references deterministically with prefix', () => {
    const id = '9f3c2a1b-4d5e-6f7a-8b9c-0d1e2f3a4b5c';
    assert.equal(formatRef(id, 'BR'), 'BR-9F3C2A');
    assert.equal(formatRef(id, 'CP'), 'CP-9F3C2A');
    assert.equal(formatRef(id), formatRef(id));
  });

  it('matches parity with expected cents across 8 benchmark samples', () => {
    const samples: [string, number][] = [
      ['0.00', 0],
      ['1.00', 100],
      ['0.50', 50],
      ['0.05', 5],
      ['999.99', 99999],
      ['2500.00', 250000],
      ['3080.00', 308000],
      ['-150.25', -15025],
    ];

    for (const [amount, expectedCents] of samples) {
      assert.equal(toCents(amount), expectedCents);
      assert.equal(centsToAmount(expectedCents), amount);
    }
  });
});
