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
import { Proposal } from '../../proposals/entities/proposal.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Creator } from '../../creators/entities/creator.entity';

/** The escrow state machine (see plan.md "Escrow state machine"). */
export enum CollaborationStatus {
  PENDING_PAYMENT = 'pending_payment',
  FUNDED = 'funded',
  PAYMENT_FAILED = 'payment_failed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  REVISION_REQUESTED = 'revision_requested',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * The anchor entity for every money-touching flow in this plan: charge,
 * hold, release, payout, refund, deliverables, and chat all reference
 * collaboration_id (see plan.md "Impact on system design").
 */
@Entity('collaborations')
export class Collaboration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  // CON-001: a proposal can produce at most one collaboration.
  @Index({ unique: true })
  @Column({ name: 'proposal_id', unique: true })
  proposalId: string;

  @ManyToOne(() => Proposal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Index()
  @Column({ name: 'brand_id' })
  brandId: string;

  @ManyToOne(() => Brand, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Index()
  @Column({ name: 'creator_id' })
  creatorId: string;

  @ManyToOne(() => Creator, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: Creator;

  @Column({
    name: 'creator_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  creatorPrice: string;

  // CON-P1-001: platform fee rate is read from ConfigModule at
  // accept-proposal time, not hard-coded here; this column stores the
  // resulting amount for that specific collaboration.
  @Column({ name: 'platform_fee', type: 'numeric', precision: 10, scale: 2 })
  platformFee: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 10, scale: 2 })
  totalAmount: string;

  @Column({ type: 'char', length: 3, default: 'EGP' })
  currency: string;

  @Index()
  @Column({
    type: 'enum',
    enum: CollaborationStatus,
    enumName: 'collaborations_status_enum',
    default: CollaborationStatus.PENDING_PAYMENT,
  })
  status: CollaborationStatus;

  @Column({ name: 'paymob_order_id', type: 'text', nullable: true })
  paymobOrderId: string | null;

  @Column({ name: 'shipment_carrier', type: 'text', nullable: true })
  shipmentCarrier: string | null;

  @Column({
    name: 'shipment_tracking_number',
    type: 'text',
    nullable: true,
  })
  shipmentTrackingNumber: string | null;

  @Column({
    name: 'shipment_confirmed_at',
    type: 'timestamptz',
    nullable: true,
  })
  shipmentConfirmedAt: Date | null;

  @Column({
    name: 'received_at',
    type: 'timestamptz',
    nullable: true,
  })
  receivedAt: Date | null;

  @Column({
    name: 'brand_last_read_at',
    type: 'timestamptz',
    nullable: true,
  })
  brandLastReadAt: Date | null;

  @Column({
    name: 'creator_last_read_at',
    type: 'timestamptz',
    nullable: true,
  })
  creatorLastReadAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  revisionsUsed?: number;
  revisionLimit?: number;
  dueAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
}
