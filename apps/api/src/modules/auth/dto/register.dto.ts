import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';
import { UserLocale, UserRole } from '../../users/entities/user.entity';

const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export class RegisterDto {
  // Admin accounts are provisioned out of band, not through self-registration.
  @IsIn([UserRole.BRAND, UserRole.CREATOR])
  role: UserRole.BRAND | UserRole.CREATOR;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @MinLength(8)
  @Matches(PASSWORD_COMPLEXITY, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password: string;

  @IsIn([UserLocale.AR, UserLocale.EN])
  locale: UserLocale;
}
