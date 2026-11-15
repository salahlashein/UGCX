export type BrandMemberRole = 'owner' | 'approver' | 'viewer';
export type BrandMemberStatus = 'invited' | 'active';

export interface BrandMember {
  id: string;
  brandId: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: BrandMemberRole;
  status: BrandMemberStatus;
  acceptedAt: string | null;
  createdAt: string;
}

/** POST /api/v1/brands/me/members */
export interface InviteMemberRequest {
  email: string;
  role: Exclude<BrandMemberRole, 'owner'>;
}

/** PATCH /api/v1/brands/me/members/{id} */
export interface UpdateMemberRoleRequest {
  role: Exclude<BrandMemberRole, 'owner'>;
}
