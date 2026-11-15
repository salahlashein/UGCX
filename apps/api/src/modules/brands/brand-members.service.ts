import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  BrandMember,
  BrandMemberRole,
  BrandMemberStatus,
} from './entities/brand-member.entity';
import { Brand } from './entities/brand.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

@Injectable()
export class BrandMembersService {
  constructor(
    @InjectRepository(BrandMember)
    private readonly brandMembersRepository: Repository<BrandMember>,
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    brandId: string,
    callerRole: BrandMemberRole,
    callerUserId: string,
  ): Promise<Record<string, unknown>[]> {
    const members = await this.brandMembersRepository.find({
      where: { brandId },
      relations: { user: true },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    const roleOrder: Record<BrandMemberRole, number> = {
      [BrandMemberRole.OWNER]: 0,
      [BrandMemberRole.APPROVER]: 1,
      [BrandMemberRole.VIEWER]: 2,
    };

    members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    return members.map((m) => {
      const email = m.user?.email ?? m.invitedEmail;
      const isCaller = m.userId === callerUserId;
      const isViewer = callerRole === BrandMemberRole.VIEWER;

      return {
        id: m.id,
        brandId: m.brandId,
        userId: m.userId,
        email: isViewer && !isCaller ? null : email,
        displayName:
          m.user?.displayName ??
          (m.user?.email ? m.user.email.split('@')[0] : null),
        role: m.role,
        status: m.status,
        acceptedAt: m.acceptedAt ? m.acceptedAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      };
    });
  }

  async invite(
    actingBrandId: string,
    inviterUserId: string,
    dto: InviteMemberDto,
  ): Promise<BrandMember> {
    if ((dto.role as string) === BrandMemberRole.OWNER) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'cannot_invite_owner',
        'Cannot invite an owner',
      );
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role !== UserRole.BRAND) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'role_conflict',
          'User belongs to a different role',
        );
      }

      const activeMember = await this.brandMembersRepository.findOne({
        where: {
          brandId: actingBrandId,
          userId: existingUser.id,
          status: BrandMemberStatus.ACTIVE,
        },
      });

      if (activeMember) {
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'member_already_exists',
          'User is already an active member of this brand',
        );
      }
    }

    const existingInvite = await this.brandMembersRepository.findOne({
      where: {
        brandId: actingBrandId,
        invitedEmail: email,
        status: BrandMemberStatus.INVITED,
      },
    });

    if (existingInvite) {
      throw new DomainErrorException(
        HttpStatus.CONFLICT,
        'invite_already_sent',
        'An invite has already been sent to this email for this brand',
      );
    }

    const member = this.brandMembersRepository.create({
      brandId: actingBrandId,
      invitedEmail: email,
      role: dto.role,
      status: BrandMemberStatus.INVITED,
      invitedByUserId: inviterUserId,
    });

    try {
      return await this.brandMembersRepository.save(member);
    } catch (error: unknown) {
      const err = error as { code?: string; detail?: string };
      if (err?.code === '23505') {
        if (err?.detail?.includes('invited_email')) {
          throw new DomainErrorException(
            HttpStatus.CONFLICT,
            'invite_already_sent',
            'An invite has already been sent to this email',
          );
        }
        throw new DomainErrorException(
          HttpStatus.CONFLICT,
          'member_already_exists',
          'Member already exists',
        );
      }
      throw error;
    }
  }

  async updateRole(
    actingBrandId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<BrandMember> {
    if ((dto.role as string) === BrandMemberRole.OWNER) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'cannot_change_owner',
        'Cannot change role to owner',
      );
    }

    const member = await this.brandMembersRepository.findOne({
      where: { id: memberId, brandId: actingBrandId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === BrandMemberRole.OWNER) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'cannot_change_owner',
        'Cannot change the role of the brand owner',
      );
    }

    member.role = dto.role;
    return this.brandMembersRepository.save(member);
  }

  async remove(actingBrandId: string, memberId: string): Promise<void> {
    const member = await this.brandMembersRepository.findOne({
      where: { id: memberId, brandId: actingBrandId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === BrandMemberRole.OWNER) {
      const ownerCount = await this.brandMembersRepository.count({
        where: { brandId: actingBrandId, role: BrandMemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new DomainErrorException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'last_owner',
          'Cannot remove the last brand owner',
        );
      }
    }

    await this.brandMembersRepository.delete(member.id);
  }

  async linkPendingInvites(
    userId: string,
    email?: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    if (!email) return;

    const repo = manager
      ? manager.getRepository(BrandMember)
      : this.brandMembersRepository;

    const normalizedEmail = email.trim().toLowerCase();
    const invites = await repo.find({
      where: {
        invitedEmail: normalizedEmail,
        status: BrandMemberStatus.INVITED,
      },
    });

    for (const invite of invites) {
      invite.userId = userId;
      invite.status = BrandMemberStatus.ACTIVE;
      invite.acceptedAt = new Date();
      invite.invitedEmail = null;
      await repo.save(invite);
    }
  }

  /** BG-13, TASK-W4-08: Resends pending invite with 10-minute rate limit */
  async resendInvite(
    actingBrandId: string,
    memberId: string,
  ): Promise<BrandMember> {
    const member = await this.brandMembersRepository.findOne({
      where: { id: memberId, brandId: actingBrandId },
    });

    if (!member) {
      throw new NotFoundException('Invite not found');
    }

    if (member.status !== BrandMemberStatus.INVITED) {
      throw new NotFoundException('Invite not found');
    }

    const lastTime = member.lastInvitedAt
      ? member.lastInvitedAt.getTime()
      : member.createdAt.getTime();
    const now = Date.now();
    const tenMinutesMs = 10 * 60 * 1000;

    if (now - lastTime < tenMinutesMs) {
      throw new DomainErrorException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'resend_too_soon',
        'Please wait 10 minutes before resending the invite',
      );
    }

    member.lastInvitedAt = new Date();
    return this.brandMembersRepository.save(member);
  }
}
