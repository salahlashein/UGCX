import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveStage } from '../utils/briefStage';

describe('deriveStage', () => {
  it('maps draft to draft', () => {
    assert.equal(deriveStage({ status: 'draft' }), 'draft');
  });

  it('maps live with no collaboration to live, and paused with no collaboration to live', () => {
    assert.equal(deriveStage({ status: 'live' }), 'live');
    assert.equal(deriveStage({ status: 'paused' }), 'live');
    assert.equal(deriveStage({ status: 'live', collaborationStatus: null }), 'live');
  });

  it('maps a collaboration funded, shipped, or revision_requested to in_production', () => {
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'funded' }), 'in_production');
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'shipped' }), 'in_production');
    assert.equal(
      deriveStage({ status: 'live', collaborationStatus: 'revision_requested' }),
      'in_production',
    );
  });

  it('maps a collaboration delivered to in_review', () => {
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'delivered' }), 'in_review');
  });

  it('maps completed or cancelled to completed', () => {
    assert.equal(deriveStage({ status: 'completed' }), 'completed');
    assert.equal(deriveStage({ status: 'cancelled' }), 'completed');
  });
});
