import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Collaboration } from '../../collaborations/entities/collaboration.entity';
import type { DeliverableFeedback } from './deliverable-feedback.entity';

export enum DeliverableType {
  READY_AD = 'ready_ad',
  RAW = 'raw',
  BROLL = 'broll',
  HOOK = 'hook',
  PHOTO = 'photo',
  VOICEOVER = 'voiceover',
}

export enum DeliverableStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
  DECLINED = 'declined',
}

/** A registered file the creator uploaded to R2 (DES-P1-003); the API never stores video bytes. */
@Entity('deliverables')
@Index(
  'uq_deliverables_collaboration_version',
  ['collaborationId', 'version'],
  { unique: true },
)
export class Deliverable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'collaboration_id' })
  collaborationId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @ManyToOne(() => Collaboration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaboration_id' })
  collaboration: Collaboration;

  @OneToMany('DeliverableFeedback', 'deliverable')
  feedback: DeliverableFeedback[];

  @Column({
    type: 'enum',
    enum: DeliverableType,
    enumName: 'deliverables_type_enum',
  })
  type: DeliverableType;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({
    type: 'enum',
    enum: DeliverableStatus,
    enumName: 'deliverables_status_enum',
    default: DeliverableStatus.SUBMITTED,
  })
  status: DeliverableStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
