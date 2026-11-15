import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../../config/configuration';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../mailer/mailer.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthOtpCode } from './entities/auth-otp-code.entity';
import { BrandMember } from '../brands/entities/brand-member.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    MailerModule,
    TypeOrmModule.forFeature([RefreshToken, AuthOtpCode, BrandMember]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('jwt.secret', { infer: true }),
        signOptions: {
          // See the comment on the sign() call in AuthService for why this
          // needs a cast against jsonwebtoken's branded "ms" string type.
          expiresIn: (configService.get('jwt.accessTtl', { infer: true }) ??
            '15m') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
