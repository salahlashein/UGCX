import type { Niche } from './common';
import type { BrandMemberRole } from './brand-members';

export type BrandVerificationStatus = 'unverified' | 'pending' | 'verified';

export interface Brand {
  id: string;
  userId: string;
  companyName: string | null;
  country: string;
  category: Niche | null;
  logoUrl: string | null;
  businessDocumentUrl: string | null;
  verificationStatus: BrandVerificationStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandMe extends Brand {
  memberRole: BrandMemberRole;
}

export interface UpdateBrandRequest {
  companyName?: string;
  country?: string;
  category?: Niche;
  logoUrl?: string;
  businessDocumentUrl?: string;
}

export interface BrandStats {
  briefsPosted: number;
  creatorsHired: number;
  avgApprovalDays: number | null;
}
