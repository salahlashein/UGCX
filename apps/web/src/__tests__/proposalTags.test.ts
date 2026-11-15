import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareTags } from '../utils/proposalTags';

describe('compareTags', () => {
  it('gives lowest price to lowest price open proposal, and declined proposal never gets a tag', () => {
    const proposals = [
      { id: 'p1', price: '400.00', deliveryDays: 7, status: 'applied' },
      { id: 'p2', price: '300.00', deliveryDays: 5, status: 'declined' },
      { id: 'p3', price: '350.00', deliveryDays: 8, status: 'applied' },
    ];
    const tags = compareTags(proposals);

    assert.equal(tags['p2'].isLowestPrice, false);
    assert.equal(tags['p2'].isFastestDelivery, false);

    assert.equal(tags['p3'].isLowestPrice, true);
    assert.equal(tags['p1'].isLowestPrice, false);
  });

  it('gives fastest delivery to fastest open proposal, and a tie gives both the tag', () => {
    const proposals = [
      { id: 'p1', price: '500.00', deliveryDays: 3, status: 'applied' },
      { id: 'p2', price: '600.00', deliveryDays: 3, status: 'shortlisted' },
      { id: 'p3', price: '450.00', deliveryDays: 5, status: 'applied' },
    ];
    const tags = compareTags(proposals);

    assert.equal(tags['p1'].isFastestDelivery, true);
    assert.equal(tags['p2'].isFastestDelivery, true);
    assert.equal(tags['p3'].isFastestDelivery, false);
  });

  it('gives both tags when there is one open proposal', () => {
    const proposals = [
      { id: 'p1', price: '400.00', deliveryDays: 4, status: 'applied' },
      { id: 'p2', price: '200.00', deliveryDays: 2, status: 'declined' },
    ];
    const tags = compareTags(proposals);

    assert.equal(tags['p1'].isLowestPrice, true);
    assert.equal(tags['p1'].isFastestDelivery, true);
  });
});
