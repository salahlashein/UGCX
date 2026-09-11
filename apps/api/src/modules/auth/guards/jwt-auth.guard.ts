import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * TASK-P1-003: applied per-controller (not globally) so /health stays
 * public. Delegates to the 'jwt' passport strategy registered by
 * JwtStrategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
