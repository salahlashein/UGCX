import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyBillingEquation } from '../utils/billingEquation';

describe('verifyBillingEquation (TASK-W3-09, DEC-W302)', () => {
  it('1. sample data: 15,000 funded, 0 refunded, 3,520 released, 0 allocated equals 11,480 available', () => {
    const res = verifyBillingEquation({
      funded: '15000.00',
      refunded: '0.00',
      released: '3520.00',
      allocated: '0.00',
      available: '11480.00',
    });
    assert.equal(res.reconciles, true);
    assert.equal(res.diffCents, 0);
    assert.equal(res.computedAvailableCents, 1148000);
  });

  it('2. with refund of 300: 15000 - 300 - 3520 - 0 = 11180', () => {
    const res = verifyBillingEquation({
      funded: '15000.00',
      refunded: '300.00',
      released: '3520.00',
      allocated: '0.00',
      available: '11180.00',
    });
    assert.equal(res.reconciles, true);
    assert.equal(res.diffCents, 0);
  });

  it('3. mismatch of 1 cent makes reconciles false', () => {
    const res = verifyBillingEquation({
      funded: '15000.00',
      refunded: '300.00',
      released: '3520.00',
      allocated: '0.00',
      available: '11180.01',
    });
    assert.equal(res.reconciles, false);
    assert.equal(res.diffCents, 1);
  });
});
