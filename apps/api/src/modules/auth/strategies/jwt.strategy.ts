import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/configuration';
import type { AuthUser } from '../interfaces/auth-user.interface';
import type { UserRole } from '../../users/entities/user.entity';

interface JwtAccessPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<AppConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret', { infer: true }) ?? '',
    });
  }

  validate(payload: JwtAccessPayload): AuthUser {
    return { userId: payload.sub, role: payload.role };
  }
}
