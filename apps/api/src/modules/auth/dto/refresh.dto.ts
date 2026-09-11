import { IsString, MinLength } from 'class-validator';

/** Used by both POST /auth/refresh and POST /auth/logout. */
export class RefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
