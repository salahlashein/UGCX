import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NOTIFICATION_CATEGORY, type NotificationEvent } from '@ugcx/shared-types';
import {
  getNotificationCategory,
  getNotificationAmount,
  getNotificationActionRoute,
} from '../utils/notificationView';

describe('notifications helper', () => {
  const ALL_EVENTS: NotificationEvent[] = [
    'brief_published',
    'proposal_received',
    'proposal_shortlisted',
    'proposal_declined',
    'escrow_funded',
    'shipment_confirmed',
    'deliverable_submitted',
    'revision_requested',
    'escrow_released',
    'message_received',
    'payout_sent',
  ];

  it('checks that every NotificationEvent value has an entry in NOTIFICATION_CATEGORY', () => {
    for (const ev of ALL_EVENTS) {
      assert.ok(NOTIFICATION_CATEGORY[ev]);
      assert.equal(getNotificationCategory(ev), NOTIFICATION_CATEGORY[ev]);
    }
  });

  it('returns the right param per event and an empty value when none exists', () => {
    assert.equal(
      getNotificationAmount({
        params: { total: '1500.00' },
      }),
      '1500.00',
    );

    assert.equal(
      getNotificationAmount({
        params: { creatorPrice: '800.00' },
      }),
      '800.00',
    );

    assert.equal(
      getNotificationAmount({
        params: { amount: '400.00' },
      }),
      '400.00',
    );

    assert.equal(
      getNotificationAmount({
        event: 'escrow_released',
        params: { total: '1760.00', creatorPrice: '1600.00' },
      }),
      '1600.00',
    );

    assert.equal(
      getNotificationAmount({
        params: { irrelevant: 'abc' },
      }),
      null,
    );

    assert.equal(getNotificationAmount({}), null);
  });

  it('returns target routes appropriately', () => {
    assert.equal(
      getNotificationActionRoute({
        event: 'message_received',
        collaborationId: 'c1',
      }),
      '/chats/c1',
    );

    assert.equal(
      getNotificationActionRoute(
        {
          event: 'deliverable_submitted',
          collaborationId: 'c1',
        },
        'brand',
      ),
      '/brand/collaborations/c1',
    );

    assert.equal(
      getNotificationActionRoute(
        {
          event: 'shipment_confirmed',
          collaborationId: 'c1',
        },
        'creator',
      ),
      '/creator/work/c1',
    );
  });
});
