import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runningBalance, runningBalanceAmounts } from '../utils/ledger';
import { centsToAmount } from '../utils/money';

describe('ledger runningBalance', () => {
  it('does not change the balance for a hold row', () => {
    const balances = runningBalance([{ type: 'hold', amount: '500.00' }]);
    assert.deepEqual(balances, [0]);
  });

  it('adds its amount in cents for a release row', () => {
    const balances = runningBalance([{ type: 'release', amount: '250.00' }]);
    assert.deepEqual(balances, [25000]);
  });

  it('subtracts its amount for a payout row', () => {
    const balances = runningBalance([
      { type: 'release', amount: '300.00' },
      { type: 'payout', amount: '100.00' },
    ]);
    assert.deepEqual(balances, [30000, 20000]);
  });

  it('gives the expected balance at each row for a mixed list (hold, release, hold, release, payout)', () => {
    const mixed = [
      { type: 'hold', amount: '100.00' },
      { type: 'release', amount: '150.00' },
      { type: 'hold', amount: '200.00' },
      { type: 'release', amount: '50.00' },
      { type: 'payout', amount: '75.00' },
    ];
    const balances = runningBalance(mixed);
    assert.deepEqual(balances, [0, 15000, 15000, 20000, 12500]);
  });

  it('handles rounding accurately so 0.10 + 0.20 gives 0.30', () => {
    const rows = [
      { type: 'release', amount: '0.10' },
      { type: 'release', amount: '0.20' },
    ];
    const balances = runningBalance(rows);
    assert.deepEqual(balances, [10, 30]);
    assert.equal(centsToAmount(balances[1]), '0.30');
    assert.deepEqual(runningBalanceAmounts(rows), ['0.10', '0.30']);
  });
});
