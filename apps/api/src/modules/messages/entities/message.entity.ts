import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collaboration } from '../../collaborations/entities/collaboration.entity';
import { User } from '../../users/entities/user.entity';

/**
 * TASK-P1-009: persisted for history/search even though realtime delivery
 * goes through Ably (DES-P1-004); the API is not on the realtime path.
 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'collaboration_id' })
  collaborationId: string;

  @ManyToOne(() => Collaboration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaboration_id' })
  collaboration: Collaboration;

  @Column({ name: 'sender_user_id' })
  senderUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
