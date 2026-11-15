import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryKeys } from '../services/queryKeys';

describe('queryKeys Factory Suite', () => {
  it('generates consistent campaign query keys', () => {
    assert.deepEqual(queryKeys.campaigns.all, ['campaigns']);
    assert.deepEqual(queryKeys.campaigns.mine(), ['campaigns', 'mine']);
    assert.deepEqual(queryKeys.campaigns.mine({ status: 'open' }), [
      'campaigns',
      'mine',
      { status: 'open' },
    ]);
    assert.deepEqual(queryKeys.campaigns.live(), ['campaigns', 'live']);
    assert.deepEqual(queryKeys.campaigns.live({ niche: 'beauty' }), [
      'campaigns',
      'live',
      { niche: 'beauty' },
    ]);
    assert.deepEqual(queryKeys.campaigns.detail('c-123'), ['campaigns', 'c-123']);
  });

  it('generates consistent collaboration query keys', () => {
    assert.deepEqual(queryKeys.collaborations.all, ['collaborations']);
    assert.deepEqual(queryKeys.collaborations.mine(), ['collaborations', 'mine']);
    assert.deepEqual(queryKeys.collaborations.detail('collab-1'), ['collaborations', 'collab-1']);
    assert.deepEqual(queryKeys.collaborations.deliverables('collab-1'), [
      'collaborations',
      'collab-1',
      'deliverables',
    ]);
  });

  it('generates consistent proposal query keys', () => {
    assert.deepEqual(queryKeys.proposals.all, ['proposals']);
    assert.deepEqual(queryKeys.proposals.mine(), ['proposals', 'mine']);
    assert.deepEqual(queryKeys.proposals.byCampaign('camp-1'), ['proposals', 'campaign', 'camp-1']);
    assert.deepEqual(queryKeys.proposals.byCampaign('camp-1', { status: 'open' }), [
      'proposals',
      'campaign',
      'camp-1',
      { status: 'open' },
    ]);
    assert.deepEqual(queryKeys.proposals.creatorProfile('prop-1'), [
      'proposals',
      'prop-1',
      'creator-profile',
    ]);
    assert.deepEqual(queryKeys.proposals.quote('prop-1'), ['proposals', 'prop-1', 'quote']);
  });

  it('generates consistent creator query keys', () => {
    assert.deepEqual(queryKeys.creator.all, ['creator']);
    assert.deepEqual(queryKeys.creator.me(), ['creator', 'me']);
    assert.deepEqual(queryKeys.creator.earnings(), ['creator', 'me', 'earnings']);
    assert.deepEqual(queryKeys.creator.portfolio(), ['creator', 'me', 'portfolio-items']);
    assert.deepEqual(queryKeys.creator.ledger(), ['creator', 'me', 'ledger']);
    assert.deepEqual(queryKeys.creator.payoutRequests(), ['creator', 'me', 'payout-requests']);
    assert.deepEqual(queryKeys.creator.payoutDetails('cr-1'), [
      'creator',
      'cr-1',
      'payout-details',
    ]);
    assert.deepEqual(queryKeys.creator.stats(), ['creator', 'stats']);
    assert.deepEqual(queryKeys.creator.homeQueue(), ['creator', 'homeQueue']);
  });

  it('generates consistent brand, billing, and notification keys', () => {
    assert.deepEqual(queryKeys.brand.dashboard(), ['brand', 'dashboard']);
    assert.deepEqual(queryKeys.brand.me(), ['brand', 'me']);
    assert.deepEqual(queryKeys.brand.members(), ['brand', 'members']);
    assert.deepEqual(queryKeys.brand.stats(), ['brand', 'stats']);

    assert.deepEqual(queryKeys.billing.me(), ['billing', 'me']);
    assert.deepEqual(queryKeys.billing.me({ page: 2 }), ['billing', 'me', { page: 2 }]);

    assert.deepEqual(queryKeys.notifications.all, ['notifications']);
    assert.deepEqual(queryKeys.notifications.unreadCount(), ['notifications', 'unread-count']);
    assert.deepEqual(queryKeys.notifications.list({ unreadOnly: true }), [
      'notifications',
      { unreadOnly: true },
    ]);

    assert.deepEqual(queryKeys.chats.all, ['chats']);
    assert.deepEqual(queryKeys.chats.messages('collab-99'), ['messages', 'collab-99']);

    assert.deepEqual(queryKeys.escrow.byCampaign('camp-99'), ['escrow', 'camp-99']);
  });
});
