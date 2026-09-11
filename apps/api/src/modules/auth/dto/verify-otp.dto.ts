import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  otp: string;

  @IsOptional()
  @IsIn([UserRole.BRAND, UserRole.CREATOR])
  role?: UserRole.BRAND | UserRole.CREATOR;
}
