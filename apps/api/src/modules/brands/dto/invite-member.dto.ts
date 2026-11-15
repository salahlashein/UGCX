import { IsEmail, IsIn, MaxLength } from 'class-validator';
import { BrandMemberRole } from '../entities/brand-member.entity';

export class InviteMemberDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsIn([BrandMemberRole.APPROVER, BrandMemberRole.VIEWER], {
    message: 'role must be either approver or viewer',
  })
  role: BrandMemberRole.APPROVER | BrandMemberRole.VIEWER;
}
