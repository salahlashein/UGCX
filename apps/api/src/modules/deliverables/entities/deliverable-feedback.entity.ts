import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Deliverable } from './deliverable.entity';
import { User } from '../../users/entities/user.entity';

/**
 * TASK-P1-008: feedback is a growable thread rather than a single
 * free-text column on Deliverable, so a revision request can be followed
 * by more feedback later without overwriting history.
 */
@Entity('deliverable_feedback')
export class DeliverableFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'deliverable_id' })
  deliverableId: string;

  @ManyToOne(() => Deliverable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable: Deliverable;

  @Column({ name: 'sender_user_id' })
  senderUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  sender: User;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
