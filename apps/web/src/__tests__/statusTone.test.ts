import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statusTone } from '../utils/statusTone';

describe('Status Tone Mapping (REQ-W105)', () => {
  it('maps all defined status values to their designated tone', () => {
    // ok
    const okValues = [
      'live',
      'open',
      'approved',
      'accepted',
      'funded',
      'paid',
      'verified',
      'cleared',
      'completed',
    ];
    for (const v of okValues) {
      assert.equal(statusTone('campaign', v), 'ok', `status ${v} should map to ok`);
    }

    // pend
    const pendValues = [
      'submitted',
      'delivered',
      'shortlisted',
      'shipped',
      'applied',
      'pending',
      'paused',
    ];
    for (const v of pendValues) {
      assert.equal(statusTone('proposal', v), 'pend', `status ${v} should map to pend`);
    }

    // info (note: in_progress maps to info in Ledger Mono)
    const infoValues = ['in_progress', 'in_production', 'released'];
    for (const v of infoValues) {
      assert.equal(statusTone('collaboration', v), 'info', `status ${v} should map to info`);
    }

    // bad
    const badValues = ['declined', 'cancelled', 'payment_failed', 'rejected', 'revision_requested'];
    for (const v of badValues) {
      assert.equal(statusTone('deliverable', v), 'bad', `status ${v} should map to bad`);
    }

    // neu
    assert.equal(statusTone('campaign', 'draft'), 'neu');
  });

  it('falls back to neu for unknown or empty values', () => {
    assert.equal(statusTone('campaign', 'unknown_status'), 'neu');
    assert.equal(statusTone('campaign', null), 'neu');
    assert.equal(statusTone('campaign', undefined), 'neu');
    assert.equal(statusTone('campaign', ''), 'neu');
  });

  it('performs case-insensitive matching', () => {
    assert.equal(statusTone('campaign', 'LIVE'), 'ok');
    assert.equal(statusTone('campaign', 'SuBmiTTeD'), 'pend');
    assert.equal(statusTone('campaign', 'IN_PROGRESS'), 'info');
    assert.equal(statusTone('campaign', 'DECLINED'), 'bad');
  });
});
