import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * One row per issued refresh token. Single-use: rotated (revoked_at set,
 * new row created) on every /auth/refresh call. Reuse of an already-revoked
 * token indicates possible theft and revokes the whole family
 * (EDGE-P1-004).
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // SHA-256 of the opaque token sent to the client. Deterministic (not
  // bcrypt) so it can be looked up by an indexed equality match; safe
  // because the token itself is a high-entropy random value (SEC-002 does
  // not apply here, this is not a password).
  @Index({ unique: true })
  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
