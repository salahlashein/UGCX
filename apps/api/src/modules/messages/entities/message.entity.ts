import {
  Check,
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

export enum MessageKind {
  USER = 'user',
  SYSTEM = 'system',
}

/**
 * TASK-P1-009, TASK-P3-01: persisted for history/search even though realtime delivery
 * goes through Ably (DES-P1-004); the API is not on the realtime path.
 * System messages have kind 'system', null senderUserId, and an optional event name.
 */
@Entity('messages')
@Check(
  'chk_messages_sender',
  `(kind = 'user' AND sender_user_id IS NOT NULL) OR (kind = 'system' AND sender_user_id IS NULL)`,
)
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'collaboration_id' })
  collaborationId: string;

  @ManyToOne(() => Collaboration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaboration_id' })
  collaboration: Collaboration;

  @Column({
    type: 'enum',
    enum: MessageKind,
    enumName: 'messages_kind_enum',
    default: MessageKind.USER,
  })
  kind: MessageKind;

  @Column({ name: 'sender_user_id', nullable: true })
  senderUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sender_user_id' })
  sender: User | null;

  @Column({ type: 'text', nullable: true })
  event: string | null;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
