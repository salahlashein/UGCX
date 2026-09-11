import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
  async updatePushToken(userId: string, expoPushToken: string): Promise<void> {
    await this.usersRepository.update(userId, { expoPushToken });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
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
}
