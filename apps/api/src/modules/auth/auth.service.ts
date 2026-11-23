import {
  BadRequestException,
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
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';
import { OTP_CODE_LENGTH } from '@ugcx/shared-types';
import type { AppConfig } from '../../config/configuration';
import { parseDurationMs } from '../../common/utils/duration';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { Brand } from '../brands/entities/brand.entity';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from '../brands/entities/brand-member.entity';
import { Creator } from '../creators/entities/creator.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthOtpCode } from './entities/auth-otp-code.entity';
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
    private readonly mailerService: MailerService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    @InjectRepository(AuthOtpCode)
    private readonly authOtpCodesRepository: Repository<AuthOtpCode>,
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
        const savedBrand = await brandRepo.save(
          brandRepo.create({ userId: savedUser.id, country: 'EG' }),
        );
        const memberRepo = manager.getRepository(BrandMember);
        await memberRepo.save(
          memberRepo.create({
            brandId: savedBrand.id,
            userId: savedUser.id,
            role: BrandMemberRole.OWNER,
            status: BrandMemberStatus.ACTIVE,
            acceptedAt: new Date(),
          }),
        );
        if (dto.email) {
          const normalizedEmail = dto.email.trim().toLowerCase();
          const invites = await memberRepo.find({
            where: {
              invitedEmail: normalizedEmail,
              status: BrandMemberStatus.INVITED,
            },
          });
          for (const invite of invites) {
            invite.userId = savedUser.id;
            invite.status = BrandMemberStatus.ACTIVE;
            invite.acceptedAt = new Date();
            invite.invitedEmail = null;
            await memberRepo.save(invite);
          }
        }
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

    if (user.role === UserRole.BRAND && user.email) {
      const memberRepo = this.dataSource.getRepository(BrandMember);
      const normalizedEmail = user.email.trim().toLowerCase();
      const invites = await memberRepo.find({
        where: {
          invitedEmail: normalizedEmail,
          status: BrandMemberStatus.INVITED,
        },
      });
      for (const invite of invites) {
        invite.userId = user.id;
        invite.status = BrandMemberStatus.ACTIVE;
        invite.acceptedAt = new Date();
        invite.invitedEmail = null;
        await memberRepo.save(invite);
      }
    }

    return this.issueTokenPair(user);
  }

  async sendOtp(dto: SendOtpDto): Promise<void> {
    const email = dto.email ? dto.email.trim().toLowerCase() : undefined;
    const phone = dto.phone;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const nodeEnv =
      this.configService.get('nodeEnv', { infer: true }) ??
      process.env.NODE_ENV ??
      'development';

    if (phone) {
      if (nodeEnv === 'production') {
        throw new BadRequestException('phone_otp_unavailable');
      }
      this.logger.log(`Sent mock OTP 0000 to ${phone}`);
      return;
    }

    if (email) {
      await this.authOtpCodesRepository.update(
        { email, consumedAt: IsNull() },
        { consumedAt: new Date() },
      );

      const otpNumber = randomInt(0, 10 ** OTP_CODE_LENGTH);
      const code = String(otpNumber).padStart(OTP_CODE_LENGTH, '0');

      const jwtSecret =
        this.configService.get('jwt.secret', { infer: true }) ?? '';
      const codeHash = createHmac('sha256', jwtSecret)
        .update(`${email}:${code}`)
        .digest('hex');

      const ttlSeconds =
        this.configService.get('otp.ttlSeconds', { infer: true }) ?? 600;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const record = this.authOtpCodesRepository.create({
        email,
        codeHash,
        attempts: 0,
        expiresAt,
        consumedAt: null,
      });
      await this.authOtpCodesRepository.save(record);

      await this.mailerService.sendOtpEmail(email, code);
      if (nodeEnv !== 'production') {
        this.logger.log(`Sent verification email OTP to ${email}`);
      }
    }
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ userId: string; role: UserRole } & TokenPair> {
    const email = dto.email ? dto.email.trim().toLowerCase() : undefined;
    const phone = dto.phone;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const nodeEnv =
      this.configService.get('nodeEnv', { infer: true }) ??
      process.env.NODE_ENV ??
      'production';

    if (phone) {
      if (nodeEnv === 'production') {
        throw new BadRequestException('phone_otp_unavailable');
      }
      if (dto.otp !== '0000' && dto.otp !== '000000') {
        throw new UnauthorizedException('Invalid OTP');
      }
    } else if (email) {
      // The fixed code is for local development and tests only. In
      // production it would let anyone sign in to any account, the demo
      // accounts included, without the emailed code.
      const isDevOrTest = nodeEnv === 'development' || nodeEnv === 'test';
      const isFixedCode =
        isDevOrTest && (dto.otp === '0000' || dto.otp === '000000');

      if (!isFixedCode) {
        const record = await this.authOtpCodesRepository.findOne({
          where: { email, consumedAt: IsNull() },
          order: { createdAt: 'DESC' },
        });

        if (!record || record.expiresAt < new Date()) {
          throw new UnauthorizedException('Invalid OTP');
        }

        const maxAttempts =
          this.configService.get('otp.maxAttempts', { infer: true }) ?? 5;
        if (record.attempts >= maxAttempts) {
          throw new UnauthorizedException('Invalid OTP');
        }

        record.attempts += 1;

        const jwtSecret =
          this.configService.get('jwt.secret', { infer: true }) ?? '';
        const computedHash = createHmac('sha256', jwtSecret)
          .update(`${email}:${dto.otp}`)
          .digest('hex');

        const expected = Buffer.from(record.codeHash, 'hex');
        const actual = Buffer.from(computedHash, 'hex');

        if (
          expected.length !== actual.length ||
          !timingSafeEqual(expected, actual)
        ) {
          await this.authOtpCodesRepository.save(record);
          throw new UnauthorizedException('Invalid OTP');
        }

        record.consumedAt = new Date();
        await this.authOtpCodesRepository.save(record);
      }
    }

    let user: User | null = null;
    if (email) {
      user = await this.usersService.findByEmail(email);
    } else if (phone) {
      user = await this.usersService.findByPhone(phone);
    }

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
            email,
            phone,
            role: dto.role,
            phoneVerifiedAt: phone ? new Date() : null,
            emailVerifiedAt: email ? new Date() : null,
          }),
        );

        if (dto.role === UserRole.BRAND) {
          const brandRepo = manager.getRepository(Brand);
          const savedBrand = await brandRepo.save(
            brandRepo.create({ userId: savedUser.id, country: 'EG' }),
          );
          const memberRepo = manager.getRepository(BrandMember);
          await memberRepo.save(
            memberRepo.create({
              brandId: savedBrand.id,
              userId: savedUser.id,
              role: BrandMemberRole.OWNER,
              status: BrandMemberStatus.ACTIVE,
              acceptedAt: new Date(),
            }),
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
      if (phone && !user.phoneVerifiedAt) {
        user.phoneVerifiedAt = new Date();
        await this.dataSource.getRepository(User).update(user.id, {
          phoneVerifiedAt: user.phoneVerifiedAt,
        });
      }
      if (email && !user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        await this.dataSource.getRepository(User).update(user.id, {
          emailVerifiedAt: user.emailVerifiedAt,
        });
      }
      if (user.role === UserRole.BRAND && user.email) {
        const memberRepo = this.dataSource.getRepository(BrandMember);
        const normalizedEmail = user.email.trim().toLowerCase();
        if (memberRepo && typeof memberRepo.find === 'function') {
          const invites = await memberRepo.find({
            where: {
              invitedEmail: normalizedEmail,
              status: BrandMemberStatus.INVITED,
            },
          });
          for (const invite of invites) {
            invite.userId = user.id;
            invite.status = BrandMemberStatus.ACTIVE;
            invite.acceptedAt = new Date();
            invite.invitedEmail = null;
            await memberRepo.save(invite);
          }
        }
      }
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
