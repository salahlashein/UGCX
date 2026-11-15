import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateMeDto } from './dto/update-me.dto';

/**
 * Read-only lookups used by auth and the ownership checks in other
 * modules. User creation happens inside AuthService's transaction (REQ-001)
 * so it is not exposed here as a side-effecting method (FUN-01).
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * feature_mobile_app_phase1 addendum (TASK-P1-013): stores the device's
   * Expo push token so REQ-009 notifications can reach it. Overwrites any
   * previous token for this user, since a device re-registering (e.g.
   * after reinstall) issues a new one.
   */
  async updatePushToken(userId: string, token: string): Promise<void> {
    await this.usersRepository.update(userId, { expoPushToken: token });
  }

  /** REQ-405: clears a dead Expo token so the next event skips the send. */
  async clearPushToken(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { expoPushToken: null });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * password_hash is excluded from default selects (SEC-002); login is the
   * one caller that needs it, via an explicit opt-in.
   */
  async findByEmailWithPassword(
    email: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    const repository = manager
      ? manager.getRepository(User)
      : this.usersRepository;
    return repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  /** TASK-W4-09 (BG-39): Returns current user identity with displayName & locale */
  async getMe(userId: string): Promise<{
    id: string;
    email: string | null;
    role: string;
    displayName: string | null;
    locale: string;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      locale: user.locale,
    };
  }

  /** TASK-W4-09 (BG-39): Updates displayName and/or locale */
  async updateMe(
    userId: string,
    dto: UpdateMeDto,
  ): Promise<{
    id: string;
    email: string | null;
    role: string;
    displayName: string | null;
    locale: string;
  }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }
    if (dto.locale !== undefined) {
      user.locale = dto.locale;
    }
    await this.usersRepository.save(user);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      locale: user.locale,
    };
  }
}
