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
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Creator } from '../../creators/entities/creator.entity';

export enum ProposalStatus {
  APPLIED = 'applied',
  SHORTLISTED = 'shortlisted',
  DECLINED = 'declined',
  // REQ-002: set by CollaborationsService when a Paymob webhook funds the
  // collaboration created from this proposal, never directly by a brand.
  ACCEPTED = 'accepted',
}

@Entity('proposals')
@Index(['campaignId', 'creatorId'], { unique: true })
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Index()
  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => Creator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: Creator;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'char', length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'delivery_days', type: 'int' })
  deliveryDays: number;

  @Column({ type: 'text' })
  pitch: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    enumName: 'proposals_status_enum',
    default: ProposalStatus.APPLIED,
  })
  status: ProposalStatus;

  // EDGE-P1-005: set when an admin's rejection of the creator auto-declines
  // this proposal, so the brand still sees why it disappeared.
  @Column({ name: 'decline_reason', type: 'text', nullable: true })
  declineReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
