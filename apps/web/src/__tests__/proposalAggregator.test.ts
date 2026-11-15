import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tallyProposalStatuses } from '../utils/proposalAggregator';

describe('proposalAggregator - tallyProposalStatuses', () => {
  it('returns zeros and zero win rate for empty array', () => {
    const tally = tallyProposalStatuses([]);
    assert.deepEqual(tally, {
      applied: 0,
      shortlisted: 0,
      won: 0,
      waiting: 0,
      declined: 0,
      total: 0,
      winRate: 0,
    });
  });

  it('accurately tallies distinct statuses and computes win rate', () => {
    const proposals = [
      { status: 'applied' },
      { status: 'APPLIED' },
      { status: 'shortlisted' },
      { status: 'accepted' }, // won
      { status: 'accepted' }, // won
      { status: 'declined' },
    ];

    const tally = tallyProposalStatuses(proposals);

    assert.equal(tally.applied, 2);
    assert.equal(tally.shortlisted, 1);
    assert.equal(tally.waiting, 3); // 2 applied + 1 shortlisted
    assert.equal(tally.won, 2);
    assert.equal(tally.declined, 1);
    assert.equal(tally.total, 6);
    // 2 / 6 = 33%
    assert.equal(tally.winRate, 33);
  });

  it('handles null, undefined, or unknown status strings safely', () => {
    const proposals = [
      { status: null },
      { status: undefined },
      { status: 'unknown_stage' },
      { status: 'accepted' },
    ];

    const tally = tallyProposalStatuses(proposals);

    assert.equal(tally.applied, 0);
    assert.equal(tally.shortlisted, 0);
    assert.equal(tally.won, 1);
    assert.equal(tally.waiting, 0);
    assert.equal(tally.total, 4);
    assert.equal(tally.winRate, 25);
  });
});
