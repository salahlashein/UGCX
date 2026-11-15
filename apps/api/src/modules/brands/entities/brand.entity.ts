import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BrandCategory } from '../../../common/enums/brand-category.enum';

export enum BrandVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
}

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Nullable: registration only collects role/email/phone/password/locale;
  // the brand completes this via PATCH /brands/me afterward.
  @Column({ name: 'company_name', type: 'text', nullable: true })
  companyName: string | null;

  @Column({ default: 'EG' })
  country: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({
    type: 'enum',
    enum: BrandCategory,
    enumName: 'brands_category_enum',
    nullable: true,
  })
  category: BrandCategory | null;

  @Column({ name: 'business_document_url', type: 'text', nullable: true })
  businessDocumentUrl: string | null;

  @Index('idx_brands_verification_status')
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: BrandVerificationStatus,
    enumName: 'brands_verification_status_enum',
    default: BrandVerificationStatus.UNVERIFIED,
  })
  verificationStatus: BrandVerificationStatus;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
