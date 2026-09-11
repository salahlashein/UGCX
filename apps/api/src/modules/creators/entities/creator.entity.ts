import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Niche } from '../../../common/enums/niche.enum';

export enum VettingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('creators')
export class Creator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Nullable: registration only collects role/email/phone/password/locale;
  // the creator completes this via PATCH /creators/me afterward.
  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ default: 'EG' })
  country: string;

  // DES-P1-002: text[] with a GIN index (created explicitly in the
  // migration, since synchronize is off), not a join table.
  @Column({ type: 'text', array: true, default: '{}' })
  niches: Niche[];

  @Column({ name: 'verification_clip_url', type: 'text', nullable: true })
  verificationClipUrl: string | null;

  @Column({
    name: 'base_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  basePrice: string | null;

  @Column({
    name: 'vetting_status',
    type: 'enum',
    enum: VettingStatus,
    enumName: 'creators_vetting_status_enum',
    default: VettingStatus.PENDING,
  })
  vettingStatus: VettingStatus;

  // REQ-010: who reviewed the vetting decision and when.
  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedBy: User | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * A creator may only apply to live campaigns whose niche is in their own
   * niche list (used by ProposalsService, keeps the rule with the entity
   * that owns the data instead of an anemic model, SMELL-02).
   */
  hasNiche(niche: Niche): boolean {
    return this.niches.includes(niche);
  }
}
