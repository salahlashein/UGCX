import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { AppConfig } from '../../config/configuration';
import { parseDurationMs } from '../../common/utils/duration';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Brand } from '../brands/entities/brand.entity';
import { Creator } from '../creators/entities/creator.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  /**
   * REQ-001: creates the User and the matching Brand or Creator profile row
   * in one transaction, so a User can never exist without its role profile.
   */
  async register(
    dto: RegisterDto,
  ): Promise<{ userId: string; role: UserRole } & TokenPair> {
    const bcryptCost =
      this.configService.get('bcryptCost', { infer: true }) ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, bcryptCost);

    const user = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      let savedUser: User;
      try {
        savedUser = await userRepo.save(
          userRepo.create({
            email: dto.email,
            phone: dto.phone,
            passwordHash,
            role: dto.role,
            locale: dto.locale,
          }),
        );
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          // EDGE-P1-001: generic message, no indication beyond "email".
          throw new ConflictException(
            'An account with this email already exists',
          );
        }
        throw error;
      }

      if (dto.role === UserRole.BRAND) {
        const brandRepo = manager.getRepository(Brand);
        await brandRepo.save(
          brandRepo.create({ userId: savedUser.id, country: 'EG' }),
        );
      } else {
        const creatorRepo = manager.getRepository(Creator);
        await creatorRepo.save(
          creatorRepo.create({
            userId: savedUser.id,
            country: 'EG',
            niches: [],
          }),
        );
      }

      return savedUser;
    });

    this.logger.log(`User ${user.id} registered as ${user.role}`);

    const tokens = await this.issueTokenPair(user);
    return { userId: user.id, role: user.role, ...tokens };
  }

  /** REQ-002/REQ-003: generic failure message, no account-existence leak. */
  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      this.logger.warn('Failed login attempt');
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User ${user.id} logged in`);
    return this.issueTokenPair(user);
  }

  async sendOtp(dto: SendOtpDto): Promise<void> {
    // In a real app, this would generate an OTP and send it via SMS (Twilio/etc).
    // We are hardcoding to 0000.
    this.logger.log(`Sent mock OTP 0000 to ${dto.phone}`);
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ userId: string; role: UserRole } & TokenPair> {
    if (dto.otp !== '0000') {
      throw new UnauthorizedException('Invalid OTP');
    }

    let user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      if (!dto.role) {
        throw new ConflictException(
          'User does not exist. Role is required to register.',
        );
      }

      user = await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const savedUser = await userRepo.save(
          userRepo.create({
            phone: dto.phone,
            role: dto.role,
          }),
        );

        if (dto.role === UserRole.BRAND) {
          const brandRepo = manager.getRepository(Brand);
          await brandRepo.save(
            brandRepo.create({ userId: savedUser.id, country: 'EG' }),
          );
        } else {
          const creatorRepo = manager.getRepository(Creator);
          await creatorRepo.save(
            creatorRepo.create({
              userId: savedUser.id,
              country: 'EG',
              niches: [],
            }),
          );
        }

        return savedUser;
      });

      this.logger.log(`User ${user.id} registered via OTP as ${user.role}`);
    } else {
      this.logger.log(`User ${user.id} logged in via OTP`);
    }

    const tokens = await this.issueTokenPair(user);
    return { userId: user.id, role: user.role, ...tokens };
  }

  /** EDGE-P1-004: reuse of an already-rotated token revokes the family. */
  async refresh(dto: RefreshDto): Promise<TokenPair> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const existing = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      existing.revokedAt !== null ||
      existing.expiresAt.getTime() < Date.now()
    ) {
      await this.revokeAllForUser(existing.userId);
      this.logger.warn(
        `Refresh token reuse detected for user ${existing.userId}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(existing.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(RefreshToken)
        .update(existing.id, { revokedAt: new Date() });
      return this.issueTokenPair(user, manager);
    });
  }

  async logout(userId: string, dto: RefreshDto): Promise<void> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const existing = await this.refreshTokensRepository.findOne({
      where: { tokenHash, userId },
    });

    if (!existing || existing.revokedAt !== null) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokensRepository.update(existing.id, {
      revokedAt: new Date(),
    });
    this.logger.log(`User ${userId} logged out`);
  }

  private async issueTokenPair(
    user: User,
    manager?: EntityManager,
  ): Promise<TokenPair> {
    const accessTtl =
      this.configService.get('jwt.accessTtl', { infer: true }) ?? '15m';
    const refreshTtl =
      this.configService.get('jwt.refreshTtl', { infer: true }) ?? '30d';

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      // jsonwebtoken types expiresIn as a branded "ms" string template
      // literal; JWT_ACCESS_TTL is a plain validated string (e.g. "15m")
      // from config, so the cast only narrows the static type, not the
      // runtime value jsonwebtoken actually parses.
      { expiresIn: accessTtl as unknown as number },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokensRepository;
    await repo.save(
      repo.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDurationMs(refreshTtl)),
      }),
    );

    return { accessToken, refreshToken };
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokensRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }
}
