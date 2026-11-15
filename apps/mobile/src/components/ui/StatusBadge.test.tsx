import { statusTone } from './StatusBadge';

/** TASK-P1-023 / EDGE-P1-007: the tone map, verbatim from the plan's schema. */
describe('statusTone', () => {
  it.each([
    ['campaign', 'draft', { background: 'surfaceStrong', text: 'body' }],
    ['campaign', 'live', { background: 'signatureMint', text: 'ink' }],
    ['campaign', 'paused', { background: 'signatureYellow', text: 'ink' }],
    ['campaign', 'completed', { background: 'surfaceStrong', text: 'success' }],
    ['campaign', 'cancelled', { background: 'dangerSurface', text: 'danger' }],
    ['proposal', 'applied', { background: 'signatureYellow', text: 'ink' }],
    ['proposal', 'shortlisted', { background: 'signatureMustard', text: 'ink' }],
    ['proposal', 'accepted', { background: 'signatureForest', text: 'onPrimary' }],
    ['proposal', 'declined', { background: 'dangerSurface', text: 'danger' }],
    ['collaboration', 'pending_payment', { background: 'signatureYellow', text: 'ink' }],
    ['collaboration', 'funded', { background: 'signatureForest', text: 'onPrimary' }],
    ['collaboration', 'shipped', { background: 'signatureMint', text: 'ink' }],
    ['collaboration', 'in_progress', { background: 'signatureMint', text: 'ink' }],
    ['collaboration', 'delivered', { background: 'signaturePeach', text: 'ink' }],
    ['collaboration', 'revision_requested', { background: 'signatureMustard', text: 'ink' }],
    ['collaboration', 'approved', { background: 'signatureForest', text: 'onPrimary' }],
    ['collaboration', 'payment_failed', { background: 'dangerSurface', text: 'danger' }],
    ['collaboration', 'cancelled', { background: 'dangerSurface', text: 'danger' }],
    ['deliverable', 'submitted', { background: 'signaturePeach', text: 'ink' }],
    ['deliverable', 'revision_requested', { background: 'signatureMustard', text: 'ink' }],
    ['deliverable', 'approved', { background: 'signatureForest', text: 'onPrimary' }],
    ['deliverable', 'declined', { background: 'dangerSurface', text: 'danger' }],
  ] as const)('%s/%s resolves to %o', (domain, status, expected) => {
    expect(statusTone(domain, status)).toEqual(expected);
  });

  it('falls back to a neutral tone for an unrecognized status, never crashing', () => {
    expect(statusTone('campaign', 'some_future_status')).toEqual({
      background: 'surfaceStrong',
      text: 'body',
    });
  });

  it('falls back to a neutral tone for an unrecognized domain/status pair', () => {
    expect(statusTone('deliverable', 'unknown')).toEqual({
      background: 'surfaceStrong',
      text: 'body',
    });
  });
});
