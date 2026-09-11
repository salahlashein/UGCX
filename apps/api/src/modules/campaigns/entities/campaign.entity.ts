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

export enum CampaignStatus {
  DRAFT = 'draft',
  LIVE = 'live',
}

export enum VideoType {
  UNBOXING = 'unboxing',
  TESTIMONIAL = 'testimonial',
  DEMO = 'demo',
  TUTORIAL = 'tutorial',
  OTHER = 'other',
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

  @Index()
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * REQ-006: the fields a campaign must have before it can go live. Kept on
   * the entity so the rule travels with the data it validates (SMELL-02),
   * not scattered across the service.
   */
  missingPublishFields(): DomainErrorDetail[] {
    const missing: DomainErrorDetail[] = [];
    if (!this.niche) {
      missing.push({ field: 'niche', message: 'required before publish' });
    }
    if (!this.videoType) {
      missing.push({ field: 'videoType', message: 'required before publish' });
    }
    if (!this.durationSeconds) {
      missing.push({
        field: 'durationSeconds',
        message: 'required before publish',
      });
    }
    if (!this.language) {
      missing.push({ field: 'language', message: 'required before publish' });
    }
    return missing;
  }

  canPublish(): boolean {
    return this.missingPublishFields().length === 0;
  }
}
