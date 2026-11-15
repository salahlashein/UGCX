import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can, type BrandAction } from '../utils/permissions';
import type { BrandMemberRole } from '@ugcx/shared-types';

describe('Brand Role Permissions Matrix (TASK-W1-07)', () => {
  it('correctly evaluates owner vs approver vs viewer capabilities', () => {
    assert.equal(can('viewer', 'acceptProposal'), false);
    assert.equal(can('approver', 'acceptProposal'), true);
    assert.equal(can('owner', 'acceptProposal'), true);

    assert.equal(can('approver', 'fundEscrow'), false);
    assert.equal(can('owner', 'fundEscrow'), true);
    assert.equal(can('viewer', 'fundEscrow'), false);

    assert.equal(can('viewer', 'viewBilling'), false);
    assert.equal(can('approver', 'viewBilling'), true);
    assert.equal(can('owner', 'viewBilling'), true);

    assert.equal(can(undefined, 'fundEscrow'), false);
    assert.equal(can(undefined, 'viewDashboard'), true);
  });

  it('guarantees every action has defined entries for all 3 brand roles', () => {
    const roles: BrandMemberRole[] = ['owner', 'approver', 'viewer'];
    const actions: BrandAction[] = [
      'viewDashboard',
      'viewBrief',
      'viewProposals',
      'viewEscrow',
      'viewBilling',
      'createBrief',
      'editBrief',
      'publishBrief',
      'pauseBrief',
      'resumeBrief',
      'shortlistProposal',
      'declineProposal',
      'acceptProposal',
      'confirmShipment',
      'reviewDeliverable',
      'fundEscrow',
      'topUpEscrow',
      'closeBrief',
      'editBrand',
      'manageTeam',
    ];

    for (const action of actions) {
      for (const role of roles) {
        const allowed = can(role, action);
        assert.equal(typeof allowed, 'boolean', `can(${role}, ${action}) must return a boolean`);
      }
    }
  });
});
