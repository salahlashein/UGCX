import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  BRAND = 'brand',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export enum UserLocale {
  AR = 'ar',
  EN = 'en',
}

/**
 * Root identity row. Exactly one role for the lifetime of Phase 1 (CON-001).
 * The matching Brand or Creator profile row is created in the same
 * transaction as this row (REQ-001), never independently.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true, where: 'email IS NOT NULL' })
  @Column({ type: 'citext', unique: true, nullable: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'text' })
  phone: string;

  // Never selected by default; every read must opt in explicitly so a
  // stray `find()` cannot leak a hash into a response body (SEC-002).
  @Column({
    name: 'password_hash',
    type: 'text',
    select: false,
    nullable: true,
  })
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'users_role_enum' })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserLocale,
    enumName: 'users_locale_enum',
    default: UserLocale.EN,
  })
  locale: UserLocale;

  @Column({ name: 'display_name', type: 'varchar', length: 80, nullable: true })
  displayName: string | null;

  // feature_mobile_app_phase1 addendum: the Expo push token for this
  // user's device, used to send REQ-009 notifications. Nullable since not
  // every user has granted push permission (EDGE-P1-003).
  @Column({ name: 'expo_push_token', type: 'text', nullable: true })
  expoPushToken: string | null;

  @Column({ name: 'phone_verified_at', type: 'timestamptz', nullable: true })
  phoneVerifiedAt: Date | null;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
