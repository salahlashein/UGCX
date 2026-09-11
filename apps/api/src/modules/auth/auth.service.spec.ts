import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User, UserRole, UserLocale } from '../users/entities/user.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Creator } from '../creators/entities/creator.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmailWithPassword: jest.Mock; findById: jest.Mock };
  let refreshTokensRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const userRepoSave = jest.fn();
  const userRepoCreate = jest.fn((data) => data);
  const brandRepoSave = jest.fn();
  const brandRepoCreate = jest.fn((data) => data);
  const creatorRepoSave = jest.fn();
  const creatorRepoCreate = jest.fn((data) => data);

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === User)
        return { create: userRepoCreate, save: userRepoSave };
      if (entity === Brand)
        return { create: brandRepoCreate, save: brandRepoSave };
      if (entity === Creator)
        return { create: creatorRepoCreate, save: creatorRepoSave };
      return { update: jest.fn(), save: jest.fn(), create: jest.fn() };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    usersService = { findByEmailWithPassword: jest.fn(), findById: jest.fn() };
    refreshTokensRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokensRepository,
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
});
