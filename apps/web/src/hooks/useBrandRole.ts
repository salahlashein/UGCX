'use client';

import { useBrandProfile } from './api/useBrand';
import { can, type BrandAction } from '../utils/permissions';
import type { BrandMemberRole } from '@ugcx/shared-types';

export function useBrandRole() {
  const profileQuery = useBrandProfile();
  const role = profileQuery.data?.memberRole;

  return {
    role,
    can: (action: BrandAction) => can(role, action),
    isLoading: profileQuery.isLoading,
  };
}
