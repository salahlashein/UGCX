import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dueTone, meterWidths, signedAmount, barHeights, barAxis } from '../utils/dataHelpers';

describe('Data Helpers Suite', () => {
  it('dueTone evaluates deadlines accurately based on thresholds', () => {
    const now = new Date('2026-10-30T12:00:00Z');
    const in36Hours = new Date('2026-10-31T24:00:00Z'); // 36 hours
    const in5Days = new Date('2026-11-04T12:00:00Z'); // 5 days
    const in10Days = new Date('2026-11-09T12:00:00Z'); // 10 days

    assert.equal(dueTone(in36Hours, now), 'hot');
    assert.equal(dueTone(in5Days, now), 'warm');
    assert.equal(dueTone(in10Days, now), 'neu');
  });

  it('meterWidths returns segment percentages bounded by 100', () => {
    const segments = [{ cents: 250000 }, { cents: 500000 }, { cents: 250000 }];
    const widths = meterWidths(segments, 1000000);
    assert.equal(widths.length, 3);
    const sum = widths.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) <= 0.1, `Sum ${sum} should be close to 100`);
    assert.ok(sum <= 100.01);
  });

  it('signedAmount formats in, out, and hold amounts accurately', () => {
    assert.equal(signedAmount(320000, 'in'), '+EGP 3,200.00');
    assert.equal(signedAmount(500000, 'out'), '\u2212EGP 5,000.00');
    assert.equal(signedAmount(320000, 'hold'), 'EGP 3,200.00');
  });

  it('barHeights computes percent heights below 100', () => {
    const heights = barHeights([2100, 3400, 10700], 12000);
    assert.equal(heights.length, 3);
    assert.ok(heights[2] < 100);
    assert.equal(heights[2], 89.2);
  });

  it('barAxis formats zero, midpoint, and maximum axis labels compactly', () => {
    const axis = barAxis(12000);
    assert.deepEqual(axis, ['0', '6K', '12K']);
  });
});
