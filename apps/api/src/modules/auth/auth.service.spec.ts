import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthOtpCode } from './entities/auth-otp-code.entity';
import { User, UserRole, UserLocale } from '../users/entities/user.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Creator } from '../creators/entities/creator.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmailWithPassword: jest.Mock;
    findById: jest.Mock;
    findByPhone: jest.Mock;
    findByEmail: jest.Mock;
  };
  let refreshTokensRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let authOtpCodesRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mailerService: {
    sendOtpEmail: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const userRepoSave = jest.fn();
  const userRepoCreate = jest.fn((data) => data);
  const brandRepoSave = jest.fn((data) =>
    Promise.resolve({ id: 'brand-1', ...data }),
  );
  const brandRepoCreate = jest.fn((data) => data);
  const creatorRepoSave = jest.fn();
  const creatorRepoCreate = jest.fn((data) => data);
  const brandMemberRepoSave = jest.fn((data) => Promise.resolve(data));
  const brandMemberRepoCreate = jest.fn((data) => data);
  const brandMemberRepoFind = jest.fn().mockResolvedValue([]);

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === User)
        return { create: userRepoCreate, save: userRepoSave };
      if (entity === Brand)
        return { create: brandRepoCreate, save: brandRepoSave };
      if (entity === Creator)
        return { create: creatorRepoCreate, save: creatorRepoSave };
      return {
        update: jest.fn(),
        save: brandMemberRepoSave,
        create: brandMemberRepoCreate,
        find: brandMemberRepoFind,
      };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = {
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
    };
    refreshTokensRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    authOtpCodesRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    mailerService = {
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'test-secret';
        if (key === 'otp.ttlSeconds') return 600;
        if (key === 'otp.maxAttempts') return 5;
        if (key === 'nodeEnv') return 'test';
        return undefined;
      }),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb(manager)),
      getRepository: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(undefined),
        find: jest.fn().mockResolvedValue([]),
      }),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: MailerService,
          useValue: mailerService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokensRepository,
        },
        {
          provide: getRepositoryToken(AuthOtpCode),
          useValue: authOtpCodesRepository,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a User and a Brand row in the same transaction (REQ-001)', async () => {
      userRepoSave.mockResolvedValue({
        id: 'user-1',
        role: UserRole.BRAND,
        email: 'brand@example.com',
      });

      const result = await service.register({
        role: UserRole.BRAND,
        email: 'brand@example.com',
        phone: '+201000000000',
        password: 'Passw0rd1',
        locale: UserLocale.EN,
      });

      expect(brandRepoSave).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', country: 'EG' }),
      );
      expect(creatorRepoSave).not.toHaveBeenCalled();
      expect(result.userId).toBe('user-1');
      expect(result.role).toBe(UserRole.BRAND);
      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('maps a unique-violation to a generic 409 (EDGE-P1-001)', async () => {
      userRepoSave.mockRejectedValue({ code: '23505' });

      await expect(
        service.register({
          role: UserRole.BRAND,
          email: 'dup@example.com',
          phone: '+201000000000',
          password: 'Passw0rd1',
          locale: UserLocale.EN,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('throws a generic invalid-credentials error when the user does not exist (REQ-003)', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws the same generic error on a wrong password, never revealing which failed', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 4);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        role: UserRole.BRAND,
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'brand@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('issues a token pair on a correct password', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 4);
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        role: UserRole.BRAND,
        passwordHash: hash,
      });

      const result = await service.login({
        email: 'brand@example.com',
        password: 'CorrectPass1',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(typeof result.refreshToken).toBe('string');
    });
  });

  describe('refresh', () => {
    it('rejects an unknown refresh token', async () => {
      refreshTokensRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'nope' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes the whole family on reuse of an already-rotated token (EDGE-P1-004)', async () => {
      refreshTokensRepository.findOne.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(
        service.refresh({ refreshToken: 'stolen-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokensRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('rotates a valid, unrevoked token into a new pair', async () => {
      refreshTokensRepository.findOne.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      });
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        role: UserRole.BRAND,
      });

      const result = await service.refresh({ refreshToken: 'valid-token' });

      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('sendOtp', () => {
    it('generates 6-digit code and stores HMAC-SHA256 hash', async () => {
      await service.sendOtp({ email: 'test@example.com' });

      expect(authOtpCodesRepository.update).toHaveBeenCalledWith(
        { email: 'test@example.com', consumedAt: IsNull() },
        { consumedAt: expect.any(Date) },
      );
      expect(authOtpCodesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          attempts: 0,
          codeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      );
    });

    it('sends email with correct code when target is email', async () => {
      await service.sendOtp({ email: 'test@example.com' });

      expect(mailerService.sendOtpEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('throws BadRequestException when neither email nor phone is provided', async () => {
      await expect(service.sendOtp({})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException in production when target is phone', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'nodeEnv') return 'production';
        return undefined;
      });

      await expect(service.sendOtp({ phone: '+201000000000' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('accepts correct 6-digit code', async () => {
      const email = 'brand@example.com';
      const otp = '123456';
      const codeHash = createHmac('sha256', 'test-secret')
        .update(`${email}:${otp}`)
        .digest('hex');

      authOtpCodesRepository.findOne.mockResolvedValue({
        id: 'otp-1',
        email,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: null,
      });

      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email,
        role: UserRole.BRAND,
        emailVerifiedAt: new Date(),
      });

      const result = await service.verifyOtp({ email, otp });

      expect(result.userId).toBe('user-1');
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(authOtpCodesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          consumedAt: expect.any(Date),
        }),
      );
    });

    it('marks user email_verified_at when target is email and unverified', async () => {
      const email = 'brand@example.com';
      const otp = '123456';
      const codeHash = createHmac('sha256', 'test-secret')
        .update(`${email}:${otp}`)
        .digest('hex');

      authOtpCodesRepository.findOne.mockResolvedValue({
        id: 'otp-1',
        email,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: null,
      });

      const mockUser = {
        id: 'user-1',
        email,
        role: UserRole.BRAND,
        emailVerifiedAt: null,
      };
      usersService.findByEmail.mockResolvedValue(mockUser);
      const userRepoUpdate = jest.fn().mockResolvedValue(undefined);
      dataSource.getRepository.mockReturnValue({
        update: userRepoUpdate,
        find: jest.fn().mockResolvedValue([]),
      });

      await service.verifyOtp({ email, otp });

      expect(userRepoUpdate).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          emailVerifiedAt: expect.any(Date),
        }),
      );
    });

    it('marks user phone_verified_at when target is phone in dev/test', async () => {
      const phone = '+201000000000';
      const mockUser = {
        id: 'user-1',
        phone,
        role: UserRole.CREATOR,
        phoneVerifiedAt: null,
      };
      usersService.findByPhone.mockResolvedValue(mockUser);
      const userRepoUpdate = jest.fn().mockResolvedValue(undefined);
      dataSource.getRepository.mockReturnValue({
        update: userRepoUpdate,
      });

      const result = await service.verifyOtp({ phone, otp: '0000' });

      expect(result.userId).toBe('user-1');
      expect(userRepoUpdate).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          phoneVerifiedAt: expect.any(Date),
        }),
      );
    });

    it('rejects the fixed code 000000 for a demo account in production', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'nodeEnv') return 'production';
        if (key === 'jwt.secret') return 'test-secret';
        return undefined;
      });
      authOtpCodesRepository.findOne.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-demo-brand',
        email: 'brand@example.com',
        role: UserRole.BRAND,
        emailVerifiedAt: new Date(),
      });

      await expect(
        service.verifyOtp({ email: 'brand@example.com', otp: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    });

    it('accepts fixed 6-digit mock code 000000 for demo email brand@example.com', async () => {
      const email = 'brand@example.com';
      usersService.findByEmail.mockResolvedValue({
        id: 'user-demo-brand',
        email,
        role: UserRole.BRAND,
        emailVerifiedAt: new Date(),
      });

      const result = await service.verifyOtp({ email, otp: '000000' });

      expect(result.userId).toBe('user-demo-brand');
      expect(result.accessToken).toBe('signed.jwt.token');
      // Fixed code bypasses database otp lookup
      expect(authOtpCodesRepository.findOne).not.toHaveBeenCalled();
    });

    it('accepts fixed 6-digit mock code 000000 for demo email creator@example.com', async () => {
      const email = 'creator@example.com';
      usersService.findByEmail.mockResolvedValue({
        id: 'user-demo-creator',
        email,
        role: UserRole.CREATOR,
        emailVerifiedAt: new Date(),
      });

      const result = await service.verifyOtp({ email, otp: '000000' });

      expect(result.userId).toBe('user-demo-creator');
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(authOtpCodesRepository.findOne).not.toHaveBeenCalled();
    });

    it('increments attempts and throws on wrong code', async () => {
      const email = 'brand@example.com';
      const codeHash = createHmac('sha256', 'test-secret')
        .update(`${email}:654321`)
        .digest('hex');

      const otpRecord = {
        id: 'otp-1',
        email,
        codeHash,
        attempts: 1,
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: null,
      };
      authOtpCodesRepository.findOne.mockResolvedValue(otpRecord);

      await expect(service.verifyOtp({ email, otp: '111111' })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authOtpCodesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          attempts: 2,
        }),
      );
    });

    it('rejects expired code', async () => {
      const email = 'brand@example.com';
      const codeHash = createHmac('sha256', 'test-secret')
        .update(`${email}:123456`)
        .digest('hex');

      authOtpCodesRepository.findOne.mockResolvedValue({
        id: 'otp-1',
        email,
        codeHash,
        attempts: 0,
        expiresAt: new Date(Date.now() - 5000),
        consumedAt: null,
      });

      await expect(service.verifyOtp({ email, otp: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects code after max attempts exceeded', async () => {
      const email = 'brand@example.com';
      const codeHash = createHmac('sha256', 'test-secret')
        .update(`${email}:123456`)
        .digest('hex');

      authOtpCodesRepository.findOne.mockResolvedValue({
        id: 'otp-1',
        email,
        codeHash,
        attempts: 5,
        expiresAt: new Date(Date.now() + 60000),
        consumedAt: null,
      });

      await expect(service.verifyOtp({ email, otp: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
