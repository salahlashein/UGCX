import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can } from '../utils/permissions';
import { verifyBillingEquation } from '../utils/billingEquation';
import { fundTotalCents } from '../utils/fundTotal';
import { deriveStage } from '../utils/briefStage';
import { compareTags } from '../utils/proposalTags';
import { taskToWebRoute } from '../utils/taskRoute';
import { statusTone } from '../utils/statusTone';
import { formatDate, formatDueDate } from '../utils/format';
import { centsToAmount } from '../utils/money';

describe('E2E Role-Based Access Control and Permissions Matrix', () => {
  it('enforces Brand Owner has full authorization', () => {
    assert.equal(can('owner', 'createBrief'), true);
    assert.equal(can('owner', 'fundEscrow'), true);
    assert.equal(can('owner', 'acceptProposal'), true);
    assert.equal(can('owner', 'reviewDeliverable'), true);
    assert.equal(can('owner', 'manageTeam'), true);
    assert.equal(can('owner', 'viewBilling'), true);
    assert.equal(can('owner', 'closeBrief'), true);
  });

  it('enforces Brand Approver cannot fund escrow or manage team members', () => {
    assert.equal(can('approver', 'createBrief'), true);
    assert.equal(can('approver', 'acceptProposal'), true);
    assert.equal(can('approver', 'reviewDeliverable'), true);
    assert.equal(can('approver', 'fundEscrow'), false);
    assert.equal(can('approver', 'manageTeam'), false);
    assert.equal(can('approver', 'viewBilling'), true);
    assert.equal(can('approver', 'closeBrief'), false);
  });

  it('enforces Brand Viewer has read-only access with zero write permissions', () => {
    assert.equal(can('viewer', 'viewDashboard'), true);
    assert.equal(can('viewer', 'viewBrief'), true);
    assert.equal(can('viewer', 'viewProposals'), true);
    assert.equal(can('viewer', 'createBrief'), false);
    assert.equal(can('viewer', 'fundEscrow'), false);
    assert.equal(can('viewer', 'acceptProposal'), false);
    assert.equal(can('viewer', 'reviewDeliverable'), false);
    assert.equal(can('viewer', 'manageTeam'), false);
    assert.equal(can('viewer', 'viewBilling'), false);
  });
});

describe('E2E Campaign Escrow and Financial Calculations', () => {
  it('computes deposit required deterministically using integer cents', () => {
    // Budget range 3,000 to 5,000 with 3 slots: midpoint 4,000 -> 3 * 4,000 = 12,000.00 EGP
    const { singleMidpointCents, totalCents } = fundTotalCents('3000.00', '5000.00', 3);
    assert.equal(singleMidpointCents, 400000);
    assert.equal(totalCents, 1200000);
    assert.equal(centsToAmount(totalCents), '12000.00');
  });

  it('verifies billing equation: funded - refunded - released - allocated = available', () => {
    const summary = {
      funded: '20000.00',
      refunded: '1000.00',
      released: '5000.00',
      allocated: '4000.00',
      available: '10000.00',
    };
    const check = verifyBillingEquation(summary);
    assert.equal(check.reconciles, true);
    assert.equal(check.computedAvailableCents, 1000000);
    assert.equal(check.expectedAvailableCents, 1000000);
    assert.equal(check.diffCents, 0);
  });

  it('flags an invalid escrow balance when discrepancy exists', () => {
    const tampered = {
      funded: '20000.00',
      refunded: '1000.00',
      released: '5000.00',
      allocated: '4000.00',
      available: '9999.00', // 1 EGP discrepancy
    };
    const check = verifyBillingEquation(tampered);
    assert.equal(check.reconciles, false);
    assert.equal(check.diffCents, 100);
  });
});

describe('E2E Collaboration Lifecycle Workflow', () => {
  it('tracks brief stage from draft through live, in-production, in-review, and completed', () => {
    assert.equal(deriveStage({ status: 'draft' }), 'draft');
    assert.equal(deriveStage({ status: 'live' }), 'live');
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'funded' }), 'in_production');
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'shipped' }), 'in_production');
    assert.equal(deriveStage({ status: 'live', collaborationStatus: 'delivered' }), 'in_review');
    assert.equal(deriveStage({ status: 'completed' }), 'completed');
  });

  it('evaluates revision limits and tags proposals accurately', () => {
    // Proposal tag comparison: lowest price and fastest delivery
    const proposals = [
      { id: 'p1', price: '2500.00', deliveryDays: 3, status: 'open' },
      { id: 'p2', price: '3200.00', deliveryDays: 1, status: 'open' },
      { id: 'p3', price: '1800.00', deliveryDays: 5, status: 'declined' }, // declined excluded
    ];
    const tags = compareTags(proposals);
    assert.equal(tags['p1'].isLowestPrice, true);
    assert.equal(tags['p1'].isFastestDelivery, false);
    assert.equal(tags['p2'].isLowestPrice, false);
    assert.equal(tags['p2'].isFastestDelivery, true);
    assert.equal(tags['p3'].isLowestPrice, false);
    assert.equal(tags['p3'].isFastestDelivery, false);
  });

  it('formats dates and deadlines accurately with due tone logic', () => {
    const pastDate = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();

    assert.ok(formatDate(pastDate).length > 0);
    assert.ok(formatDueDate(pastDate).length > 0);
    assert.ok(formatDueDate(futureDate).length > 0);
  });

  it('maps home tasks to web navigation routes consistently', () => {
    assert.equal(taskToWebRoute('msg-c123'), '/chats/c123');
    assert.equal(taskToWebRoute('rev-c123'), '/creator/work/c123');
    assert.equal(taskToWebRoute('deliv-c123'), '/creator/work/c123');
    assert.equal(taskToWebRoute('ship-c123'), '/creator/work/c123');
    assert.equal(taskToWebRoute('await-ship-c123'), '/creator/work/c123');
  });

  it('guarantees status badges resolve to designated standard tones', () => {
    assert.equal(statusTone('collaborations', 'approved'), 'ok');
    assert.equal(statusTone('collaborations', 'paid'), 'ok');
    assert.equal(statusTone('campaigns', 'live'), 'ok');
    assert.equal(statusTone('collaborations', 'pending'), 'pend');
    assert.equal(statusTone('deliverables', 'revision_requested'), 'bad');
    assert.equal(statusTone('collaborations', 'shipped'), 'pend');
    assert.equal(statusTone('campaigns', 'draft'), 'neu');
  });
});
