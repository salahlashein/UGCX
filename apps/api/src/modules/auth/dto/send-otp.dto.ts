import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SendOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn([UserRole.BRAND, UserRole.CREATOR])
  role?: UserRole.BRAND | UserRole.CREATOR;
}
