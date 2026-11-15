import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lifecycleSteps } from '../utils/briefLifecycle';

describe('lifecycleSteps', () => {
  it('has Created done and every other step todo for a draft brief', () => {
    const steps = lifecycleSteps({ status: 'draft', createdAt: '2026-10-01' }, []);
    assert.equal(steps[0].key, 'created');
    assert.equal(steps[0].state, 'done');
    assert.equal(steps[1].key, 'funded');
    assert.equal(steps[1].state, 'todo');
    assert.equal(steps[2].key, 'live');
    assert.equal(steps[2].state, 'todo');
    assert.equal(steps[3].key, 'hired');
    assert.equal(steps[3].state, 'todo');
    assert.equal(steps[4].key, 'delivered');
    assert.equal(steps[4].state, 'todo');
    assert.equal(steps[5].key, 'closed');
    assert.equal(steps[5].state, 'todo');
  });

  it('has Created, Funded, and Live done for a funded and published brief', () => {
    const steps = lifecycleSteps(
      {
        status: 'live',
        createdAt: '2026-10-01',
        publishedAt: '2026-10-02',
        escrowFundedAmount: '1000.00',
        slots: 3,
      },
      [],
    );
    assert.equal(steps[0].key, 'created');
    assert.equal(steps[0].state, 'done');
    assert.equal(steps[1].key, 'funded');
    assert.equal(steps[1].state, 'done');
    assert.equal(steps[2].key, 'live');
    assert.equal(steps[2].state, 'done');
  });

  it('marks hired step as current and shows 1 / 3 when 1 of 3 slots hired', () => {
    const steps = lifecycleSteps(
      {
        status: 'live',
        createdAt: '2026-10-01',
        publishedAt: '2026-10-02',
        escrowFundedAmount: '1000.00',
        slots: 3,
      },
      [{ id: 'c1', status: 'funded' }],
    );
    assert.equal(steps[3].key, 'hired');
    assert.equal(steps[3].state, 'current');
    assert.equal(steps[3].detail, '1 / 3');
  });

  it('marks every step done for a completed brief', () => {
    const steps = lifecycleSteps(
      {
        status: 'completed',
        createdAt: '2026-10-01',
        publishedAt: '2026-10-02',
        slots: 2,
      },
      [
        { id: 'c1', status: 'paid' },
        { id: 'c2', status: 'approved' },
      ],
    );
    for (const step of steps) {
      assert.equal(step.state, 'done');
    }
  });

  it('marks Closed done and skips Delivered for a cancelled brief', () => {
    const steps = lifecycleSteps(
      {
        status: 'cancelled',
        createdAt: '2026-10-01',
        publishedAt: '2026-10-02',
        escrowFundedAmount: '1000.00',
        slots: 2,
      },
      [],
    );
    assert.equal(steps.find((s) => s.key === 'closed')?.state, 'done');
    assert.equal(steps.find((s) => s.key === 'delivered')?.state, 'todo');
  });
});
