import type { BrandMemberRole } from '@ugcx/shared-types';

export type BrandAction =
  // View actions
  | 'viewDashboard'
  | 'viewBrief'
  | 'viewProposals'
  | 'viewEscrow'
  | 'viewBilling'
  // Brief management
  | 'createBrief'
  | 'editBrief'
  | 'publishBrief'
  | 'pauseBrief'
  | 'resumeBrief'
  // Proposal & collaboration management
  | 'shortlistProposal'
  | 'declineProposal'
  | 'acceptProposal'
  | 'confirmShipment'
  | 'reviewDeliverable'
  // Financial & Team Admin
  | 'fundEscrow'
  | 'topUpEscrow'
  | 'closeBrief'
  | 'closeAndRefundBrief'
  | 'editBrand'
  | 'manageTeam';

const PERMISSION_MATRIX: Record<BrandAction, Record<BrandMemberRole, boolean>> = {
  // All three roles
  viewDashboard: { owner: true, approver: true, viewer: true },
  viewBrief: { owner: true, approver: true, viewer: true },
  viewProposals: { owner: true, approver: true, viewer: true },
  viewEscrow: { owner: true, approver: true, viewer: true },

  // Owner & Approver
  viewBilling: { owner: true, approver: true, viewer: false },
  createBrief: { owner: true, approver: true, viewer: false },
  editBrief: { owner: true, approver: true, viewer: false },
  publishBrief: { owner: true, approver: true, viewer: false },
  pauseBrief: { owner: true, approver: true, viewer: false },
  resumeBrief: { owner: true, approver: true, viewer: false },
  shortlistProposal: { owner: true, approver: true, viewer: false },
  declineProposal: { owner: true, approver: true, viewer: false },
  acceptProposal: { owner: true, approver: true, viewer: false },
  confirmShipment: { owner: true, approver: true, viewer: false },
  reviewDeliverable: { owner: true, approver: true, viewer: false },

  // Owner only
  fundEscrow: { owner: true, approver: false, viewer: false },
  topUpEscrow: { owner: true, approver: false, viewer: false },
  closeBrief: { owner: true, approver: false, viewer: false },
  closeAndRefundBrief: { owner: true, approver: false, viewer: false },
  editBrand: { owner: true, approver: false, viewer: false },
  manageTeam: { owner: true, approver: false, viewer: false },
};

/**
 * Checks if a brand member role has permission to execute a specific action.
 * If role is undefined (e.g. during profile loading), only safe view actions return true.
 */
export function can(role: BrandMemberRole | undefined, action: BrandAction): boolean {
  if (!role) {
    // Loading default: view actions are safe to preview
    return (
      action === 'viewDashboard' ||
      action === 'viewBrief' ||
      action === 'viewProposals' ||
      action === 'viewEscrow'
    );
  }

  const actionPerms = PERMISSION_MATRIX[action];
  if (!actionPerms) {
    return false;
  }

  return Boolean(actionPerms[role]);
}
