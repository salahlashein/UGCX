import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  NotificationDeepLink,
  NotificationEvent,
} from '@ugcx/shared-types';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enumName: 'notifications_event_enum' })
  event: NotificationEvent;

  @Column({ type: 'jsonb', default: {} })
  params: Record<string, string | number>;

  @Column({ name: 'deep_link', type: 'jsonb', nullable: true })
  deepLink: NotificationDeepLink | null;

  @Column({ name: 'collaboration_id', type: 'uuid', nullable: true })
  collaborationId: string | null;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ name: 'pushed_at', type: 'timestamptz', nullable: true })
  pushedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
