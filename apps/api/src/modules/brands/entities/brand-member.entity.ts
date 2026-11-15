import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { User } from '../../users/entities/user.entity';

export enum BrandMemberRole {
  OWNER = 'owner',
  APPROVER = 'approver',
  VIEWER = 'viewer',
}

export enum BrandMemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
}

@Entity('brand_members')
@Index('idx_brand_members_brand_id', ['brandId'])
@Index('idx_brand_members_user_id', ['userId'])
@Index('uq_brand_members_brand_user', ['brandId', 'userId'], {
  unique: true,
  where: '"user_id" IS NOT NULL',
})
@Index('uq_brand_members_brand_email', ['brandId', 'invitedEmail'], {
  unique: true,
  where: '"invited_email" IS NOT NULL',
})
export class BrandMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'invited_email', type: 'citext', nullable: true })
  invitedEmail: string | null;

  @Column({
    type: 'enum',
    enum: BrandMemberRole,
    enumName: 'brand_members_role_enum',
    default: BrandMemberRole.VIEWER,
  })
  role: BrandMemberRole;

  @Column({
    type: 'enum',
    enum: BrandMemberStatus,
    enumName: 'brand_members_status_enum',
    default: BrandMemberStatus.INVITED,
  })
  status: BrandMemberStatus;

  @Column({ name: 'invited_by_user_id', type: 'uuid', nullable: true })
  invitedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedByUser: User | null;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'last_invited_at', type: 'timestamptz', nullable: true })
  lastInvitedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
