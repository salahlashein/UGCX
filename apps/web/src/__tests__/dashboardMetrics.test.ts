import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStillInEscrowCents, groupBriefsByPipelineStage } from '../utils/dashboardMetrics';

describe('dashboardMetrics Suite', () => {
  describe('calculateStillInEscrowCents', () => {
    it('returns 0 for empty array or missing values', () => {
      assert.equal(calculateStillInEscrowCents([]), 0);
      assert.equal(
        calculateStillInEscrowCents([
          { escrowFundedAmount: null, escrowAllocatedAmount: null, escrowRefundedAmount: null },
        ]),
        0,
      );
    });

    it('correctly calculates remaining escrow balance in integer cents', () => {
      const briefs = [
        {
          escrowFundedAmount: '1000.00',
          escrowAllocatedAmount: '200.00',
          escrowRefundedAmount: '100.00',
        },
        {
          escrowFundedAmount: '500.50',
          escrowAllocatedAmount: '0.00',
          escrowRefundedAmount: '0.00',
        },
      ];

      // Brief 1: 100000 - 20000 - 10000 = 70000 cents
      // Brief 2: 50050 cents
      // Total = 120050 cents
      assert.equal(calculateStillInEscrowCents(briefs), 120050);
    });

    it('ignores non-positive left balance (clamps to 0)', () => {
      const briefs = [
        {
          escrowFundedAmount: '300.00',
          escrowAllocatedAmount: '200.00',
          escrowRefundedAmount: '150.00', // left = -50.00
        },
        {
          escrowFundedAmount: '100.00',
          escrowAllocatedAmount: '50.00',
          escrowRefundedAmount: '0.00', // left = 50.00 (5000 cents)
        },
      ];

      assert.equal(calculateStillInEscrowCents(briefs), 5000);
    });
  });

  describe('groupBriefsByPipelineStage', () => {
    it('returns 5 empty stages with English names by default', () => {
      const stages = groupBriefsByPipelineStage([]);
      assert.equal(stages.length, 5);
      assert.deepEqual(
        stages.map((s) => s.id),
        ['draft', 'live', 'in_production', 'in_review', 'completed'],
      );
      assert.equal(stages[0].name, 'Draft');
      assert.equal(stages[1].name, 'Live');
      assert.equal(stages[0].count, 0);
      assert.equal(stages[1].isHot, false);
    });

    it('localizes stage names to Arabic when locale is ar', () => {
      const stages = groupBriefsByPipelineStage([], 'ar');
      assert.equal(stages[0].name, 'مسودة');
      assert.equal(stages[1].name, 'نشط');
      assert.equal(stages[2].name, 'قيد التنفيذ');
      assert.equal(stages[3].name, 'قيد المراجعة');
      assert.equal(stages[4].name, 'مكتمل');
    });

    it('accurately groups briefs into stages and sets hot flags', () => {
      const briefs = [
        { title: 'Summer Campaign', status: 'draft' },
        { title: 'Fall Campaign', status: 'published', collaborationStatus: null },
        { title: 'Video Ad 1', status: 'published', collaborationStatus: 'shipped' },
        { title: 'Review Video', status: 'published', collaborationStatus: 'delivered' },
        { title: 'Old Archive', status: 'completed' },
      ];

      const stages = groupBriefsByPipelineStage(briefs, 'en');

      const draftStage = stages.find((s) => s.id === 'draft')!;
      assert.equal(draftStage.count, 1);
      assert.deepEqual(draftStage.items, ['Summer Campaign']);

      const liveStage = stages.find((s) => s.id === 'live')!;
      assert.equal(liveStage.count, 1);
      assert.equal(liveStage.isHot, true);

      const inProdStage = stages.find((s) => s.id === 'in_production')!;
      assert.equal(inProdStage.count, 1);

      const inReviewStage = stages.find((s) => s.id === 'in_review')!;
      assert.equal(inReviewStage.count, 1);
      assert.equal(inReviewStage.isHot, true);

      const completedStage = stages.find((s) => s.id === 'completed')!;
      assert.equal(completedStage.count, 1);
    });
  });
});
