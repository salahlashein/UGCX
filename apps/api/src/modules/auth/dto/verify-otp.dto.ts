import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  otp: string;

  // Self sign-up creates brand and creator accounts only, the same as
  // RegisterDto. An admin account is created with the create-admin script.
  @IsOptional()
  @IsIn([UserRole.BRAND, UserRole.CREATOR])
  role?: UserRole.BRAND | UserRole.CREATOR;
}
