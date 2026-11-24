import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fundTotalCents } from '../utils/fundTotal';

describe('fundTotalCents (TASK-W3-08, BG-14)', () => {
  it('1. range 2000 to 3000 with 3 slots gives 750,000 cents (7,500.00 EGP)', () => {
    const { singleMidpointCents, totalCents } = fundTotalCents('2000.00', '3000.00', 3);
    assert.equal(singleMidpointCents, 250000);
    assert.equal(totalCents, 750000);
  });

  it('2. range 2000 to 3001 gives midpoint 250100 cents (rounded to nearest 100), times slots', () => {
    const { singleMidpointCents, totalCents } = fundTotalCents('2000.00', '3001.00', 3);
    assert.equal(singleMidpointCents, 250100);
    assert.equal(totalCents, 750300);
  });

  it('3. slots = 1 gives old midpoint', () => {
    const { singleMidpointCents, totalCents } = fundTotalCents('2500.00', '4000.00', 1);
    assert.equal(singleMidpointCents, 325000);
    assert.equal(totalCents, 325000);
  });

  it('4. adds the platform fee per slot so a midpoint proposal can be accepted', () => {
    const { singleMidpointCents, singleFeeCents, totalCents } = fundTotalCents(
      '100.00',
      '200.00',
      1,
      0.1,
    );
    assert.equal(singleMidpointCents, 15000);
    assert.equal(singleFeeCents, 1500);
    assert.equal(totalCents, 16500);
  });

  it('5. fee is added per slot, then multiplied', () => {
    const { singleFeeCents, totalCents } = fundTotalCents('2000.00', '3000.00', 3, 0.1);
    assert.equal(singleFeeCents, 25000);
    assert.equal(totalCents, 825000);
  });
});
