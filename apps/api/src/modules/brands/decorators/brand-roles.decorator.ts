import { SetMetadata } from '@nestjs/common';
import { BrandMemberRole } from '../entities/brand-member.entity';

export const BRAND_ROLES_KEY = 'brandRoles';
export const BrandRoles = (...roles: BrandMemberRole[]) =>
  SetMetadata(BRAND_ROLES_KEY, roles);
