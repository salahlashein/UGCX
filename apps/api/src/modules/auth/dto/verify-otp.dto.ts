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

  @IsOptional()
  @IsIn([UserRole.BRAND, UserRole.CREATOR, UserRole.ADMIN])
  role?: UserRole.BRAND | UserRole.CREATOR | UserRole.ADMIN;
}
