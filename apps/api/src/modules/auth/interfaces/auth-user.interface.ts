import { UserRole } from '../../users/entities/user.entity';

/** Shape attached to `request.user` by JwtStrategy after a valid access token. */
export interface AuthUser {
  userId: string;
  role: UserRole;
}
