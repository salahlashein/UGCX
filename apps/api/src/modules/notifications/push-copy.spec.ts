import { PUSH_COPY, pushCopyFor } from './push-copy';

describe('pushCopyFor', () => {
  it('names the brand when the params carry a brand name', () => {
    expect(
      pushCopyFor('proposal_shortlisted', { brandName: 'Sunleaf Tea' }).body,
    ).toBe('Sunleaf Tea shortlisted your proposal.');
    expect(
      pushCopyFor('revision_requested', { brandName: 'Sunleaf Tea' }).body,
    ).toBe('Sunleaf Tea requested a revision on your deliverable.');
  });

  it('names the creator when the params carry a creator name', () => {
    expect(
      pushCopyFor('deliverable_submitted', { creatorName: 'Hana Samir' }).body,
    ).toBe('Hana Samir submitted a deliverable for review.');
    expect(
      pushCopyFor('shipment_received', { creatorName: 'Hana Samir' }).body,
    ).toBe('Hana Samir confirmed product receipt.');
  });

  it('uses the generic copy when the name is missing or a placeholder', () => {
    expect(pushCopyFor('proposal_declined', {})).toEqual(
      PUSH_COPY.proposal_declined,
    );
    expect(pushCopyFor('proposal_declined', { brandName: 'Brand' })).toEqual(
      PUSH_COPY.proposal_declined,
    );
    expect(pushCopyFor('deliverable_submitted', { creatorName: '  ' })).toEqual(
      PUSH_COPY.deliverable_submitted,
    );
    expect(pushCopyFor('shipment_confirmed', null)).toEqual(
      PUSH_COPY.shipment_confirmed,
    );
  });

  it('keeps the title the same', () => {
    expect(
      pushCopyFor('proposal_shortlisted', { brandName: 'Sunleaf Tea' }).title,
    ).toBe(PUSH_COPY.proposal_shortlisted.title);
  });
});
