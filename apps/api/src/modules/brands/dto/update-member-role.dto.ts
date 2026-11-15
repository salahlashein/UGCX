import { IsIn } from 'class-validator';
import { BrandMemberRole } from '../entities/brand-member.entity';

export class UpdateMemberRoleDto {
  @IsIn([BrandMemberRole.APPROVER, BrandMemberRole.VIEWER], {
    message: 'role must be either approver or viewer',
  })
  role: BrandMemberRole.APPROVER | BrandMemberRole.VIEWER;
}
