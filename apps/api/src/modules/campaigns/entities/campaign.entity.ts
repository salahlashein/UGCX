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
import { Brand } from '../../brands/entities/brand.entity';
import { Product } from '../../products/entities/product.entity';
import { Niche } from '../../../common/enums/niche.enum';
import { Language } from '../../../common/enums/language.enum';
import type { DomainErrorDetail } from '../../../common/exceptions/domain-error.exception';
import { toCents } from '../../../common/utils/money';

export enum CampaignStatus {
  DRAFT = 'draft',
  LIVE = 'live',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VideoType {
  UNBOXING = 'unboxing',
  TESTIMONIAL = 'testimonial',
  DEMO = 'demo',
  TUTORIAL = 'tutorial',
  OTHER = 'other',
  TALKING_HEAD = 'talking_head',
  TRY_ON = 'try_on',
}

export enum ScriptMode {
  BRAND = 'brand',
  CREATOR = 'creator',
  // 'ai' is reserved for Phase 3; intentionally not a valid value yet.
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'brand_id' })
  brandId: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ type: 'text' })
  title: string;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ type: 'text', nullable: true })
  brief: string | null;

  @Column({
    name: 'budget_min',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  budgetMin: string | null;

  @Column({
    name: 'budget_max',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  budgetMax: string | null;

  @Column({ type: 'char', length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Index('idx_campaigns_closes_at')
  @Column({ name: 'closes_at', type: 'timestamptz', nullable: true })
  closesAt: Date | null;

  @Index()
  @Column({
    type: 'enum',
    enum: CampaignStatus,
    enumName: 'campaigns_status_enum',
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Index()
  @Column({
    type: 'enum',
    enum: Niche,
    enumName: 'campaigns_niche_enum',
    nullable: true,
  })
  niche: Niche | null;

  @Column({
    type: 'enum',
    enum: Language,
    enumName: 'campaigns_language_enum',
    nullable: true,
  })
  language: Language | null;

  @Column({
    name: 'video_type',
    type: 'enum',
    enum: VideoType,
    enumName: 'campaigns_video_type_enum',
    nullable: true,
  })
  videoType: VideoType | null;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({
    name: 'script_mode',
    type: 'enum',
    enum: ScriptMode,
    enumName: 'campaigns_script_mode_enum',
    nullable: true,
  })
  scriptMode: ScriptMode | null;

  @Column({ type: 'text', nullable: true })
  script: string | null;

  @Column({ name: 'talking_points', type: 'text', array: true, default: '{}' })
  talkingPoints: string[];

  @Column({ name: 'do_not_say', type: 'text', array: true, default: '{}' })
  doNotSay: string[];

  @Column({ name: 'needs_shipping', type: 'boolean', default: true })
  needsShipping: boolean;

  @Column({ type: 'int', default: 1 })
  slots: number;

  @Column({ name: 'revision_limit', type: 'smallint', default: 2 })
  revisionLimit: number;

  @Column({
    name: 'escrow_funded_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: '0.00',
  })
  escrowFundedAmount: string;

  @Column({
    name: 'escrow_allocated_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: '0.00',
  })
  escrowAllocatedAmount: string;

  @Column({
    name: 'escrow_refunded_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: '0.00',
  })
  escrowRefundedAmount: string;

  @Index('uq_campaigns_funding_order', { unique: true })
  @Column({
    name: 'funding_paymob_order_id',
    type: 'text',
    nullable: true,
  })
  fundingPaymobOrderId: string | null;

  @Column({
    name: 'funding_requested_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  fundingRequestedAmount: string | null;

  @Index('idx_campaigns_refund_pending')
  @Column({
    name: 'refund_pending',
    type: 'boolean',
    default: false,
  })
  refundPending: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** Available escrow in minor units. Reads only, never writes. */
  availableEscrowCents(): number {
    return (
      toCents(this.escrowFundedAmount || '0.00') -
      toCents(this.escrowAllocatedAmount || '0.00') -
      toCents(this.escrowRefundedAmount || '0.00')
    );
  }

  /** REQ-204: a brief may publish only when it can pay its own floor. */
  canPublishWithEscrow(): boolean {
    if (!this.budgetMin) return false;
    return this.availableEscrowCents() >= toCents(this.budgetMin);
  }

  /**
   * REQ-006 & PAT-102 & REQ-204: the fields a campaign must have before it can go live.
   */
  missingPublishFields(): DomainErrorDetail[] {
    const missing: DomainErrorDetail[] = [];
    if (!this.title) {
      missing.push({ field: 'title', message: 'required before publish' });
    }
    if (!this.budgetMin) {
      missing.push({ field: 'budgetMin', message: 'required before publish' });
    }
    if (!this.budgetMax) {
      missing.push({ field: 'budgetMax', message: 'required before publish' });
    }
    if (!this.niche) {
      missing.push({ field: 'niche', message: 'required before publish' });
    }
    if (!this.videoType) {
      missing.push({ field: 'videoType', message: 'required before publish' });
    }
    if (this.durationSeconds === null || this.durationSeconds === undefined) {
      missing.push({
        field: 'durationSeconds',
        message: 'required before publish',
      });
    }
    if (!this.language) {
      missing.push({ field: 'language', message: 'required before publish' });
    }
    if (!this.canPublishWithEscrow()) {
      missing.push({
        field: 'escrow',
        message: 'fund the brief before publishing',
      });
    }
    return missing;
  }

  canPublish(): boolean {
    return this.missingPublishFields().length === 0;
  }

  canPause(): boolean {
    return this.status === CampaignStatus.LIVE;
  }

  canResume(): boolean {
    return this.status === CampaignStatus.PAUSED;
  }

  fundedAt?: string | null;
  proposalCount?: number;
}
