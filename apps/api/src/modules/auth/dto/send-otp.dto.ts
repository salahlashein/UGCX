import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SendOtpDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsIn([UserRole.BRAND, UserRole.CREATOR])
  role?: UserRole.BRAND | UserRole.CREATOR;
}
