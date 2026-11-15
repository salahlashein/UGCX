import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BrandMembersService } from './brand-members.service';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from './entities/brand-member.entity';
import { Brand } from './entities/brand.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('BrandMembersService', () => {
  let service: BrandMembersService;
  let brandMembersRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  let brandsRepo: {
    findOne: jest.Mock;
  };
  let usersRepo: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    brandMembersRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'member-new-id' })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      count: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    brandsRepo = {
      findOne: jest.fn(),
    };
    usersRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandMembersService,
        {
          provide: getRepositoryToken(BrandMember),
          useValue: brandMembersRepo,
        },
        {
          provide: getRepositoryToken(Brand),
          useValue: brandsRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BrandMembersService>(BrandMembersService);
  });

  describe('invite', () => {
    it('creates a row with status = invited and a null user_id', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      brandMembersRepo.findOne.mockResolvedValue(null);

      const result = await service.invite('brand-1', 'inviter-1', {
        email: 'teammate@example.com',
        role: BrandMemberRole.APPROVER,
      });

      expect(result.status).toBe(BrandMemberStatus.INVITED);
      expect(result.invitedEmail).toBe('teammate@example.com');
      expect(result.role).toBe(BrandMemberRole.APPROVER);
      expect(result.userId).toBeUndefined();
    });

    it('with an existing creator email throws role_conflict', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'user-creator',
        role: UserRole.CREATOR,
      });

      await expect(
        service.invite('brand-1', 'inviter-1', {
          email: 'creator@example.com',
          role: BrandMemberRole.VIEWER,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'role_conflict' }),
      });
    });

    it('with the role owner throws cannot_invite_owner', async () => {
      await expect(
        service.invite('brand-1', 'inviter-1', {
          email: 'someone@example.com',
          role: BrandMemberRole.OWNER as any,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'cannot_invite_owner' }),
      });
    });
  });

  describe('updateRole', () => {
    it('on an owner row throws cannot_change_owner', async () => {
      brandMembersRepo.findOne.mockResolvedValue({
        id: 'member-owner',
        brandId: 'brand-1',
        role: BrandMemberRole.OWNER,
      });

      await expect(
        service.updateRole('brand-1', 'member-owner', {
          role: BrandMemberRole.APPROVER,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'cannot_change_owner' }),
      });
    });
  });

  describe('remove', () => {
    it('on the only owner throws last_owner', async () => {
      brandMembersRepo.findOne.mockResolvedValue({
        id: 'member-owner',
        brandId: 'brand-1',
        role: BrandMemberRole.OWNER,
      });
      brandMembersRepo.count.mockResolvedValue(1);

      await expect(
        service.remove('brand-1', 'member-owner'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'last_owner' }),
      });
    });
  });

  describe('linkPendingInvites', () => {
    it('sets user_id, status, and accepted_at, and clears invited_email', async () => {
      const invite = {
        id: 'invite-1',
        invitedEmail: 'test@example.com',
        userId: null,
        status: BrandMemberStatus.INVITED,
        acceptedAt: null,
      };
      brandMembersRepo.find.mockResolvedValue([invite]);

      await service.linkPendingInvites('user-new-id', 'test@example.com');

      expect(invite.userId).toBe('user-new-id');
      expect(invite.status).toBe(BrandMemberStatus.ACTIVE);
      expect(invite.acceptedAt).toBeInstanceOf(Date);
      expect(invite.invitedEmail).toBeNull();
      expect(brandMembersRepo.save).toHaveBeenCalledWith(invite);
    });
  });

  describe('list', () => {
    it('masks the email of another member for a viewer caller', async () => {
      brandMembersRepo.find.mockResolvedValue([
        {
          id: 'member-1',
          brandId: 'brand-1',
          userId: 'user-owner',
          role: BrandMemberRole.OWNER,
          status: BrandMemberStatus.ACTIVE,
          user: { email: 'owner@example.com' },
          createdAt: new Date(),
        },
        {
          id: 'member-2',
          brandId: 'brand-1',
          userId: 'user-viewer',
          role: BrandMemberRole.VIEWER,
          status: BrandMemberStatus.ACTIVE,
          user: { email: 'viewer@example.com' },
          createdAt: new Date(),
        },
      ]);

      const result = await service.list(
        'brand-1',
        BrandMemberRole.VIEWER,
        'user-viewer',
      );

      const ownerRow = result.find((r) => r.userId === 'user-owner');
      const viewerRow = result.find((r) => r.userId === 'user-viewer');

      expect(ownerRow?.email).toBeNull();
      expect(viewerRow?.email).toBe('viewer@example.com');
    });
  });

  describe('resendInvite', () => {
    it('throws 404 when member is not found', async () => {
      brandMembersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.resendInvite('brand-1', 'member-99'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when member is already active', async () => {
      brandMembersRepo.findOne.mockResolvedValue({
        id: 'member-1',
        brandId: 'brand-1',
        status: BrandMemberStatus.ACTIVE,
      });

      await expect(
        service.resendInvite('brand-1', 'member-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 422 when last invited less than 10 minutes ago', async () => {
      brandMembersRepo.findOne.mockResolvedValue({
        id: 'member-1',
        brandId: 'brand-1',
        status: BrandMemberStatus.INVITED,
        lastInvitedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 mins ago
      });

      await expect(
        service.resendInvite('brand-1', 'member-1'),
      ).rejects.toThrow(DomainErrorException);
    });

    it('updates lastInvitedAt and saves when eligible', async () => {
      const member = {
        id: 'member-1',
        brandId: 'brand-1',
        status: BrandMemberStatus.INVITED,
        lastInvitedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      };
      brandMembersRepo.findOne.mockResolvedValue(member);

      const result = await service.resendInvite('brand-1', 'member-1');
      expect(brandMembersRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('member-1');
    });
  });
});
