import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Creator } from './creator.entity';

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  INSTAPAY = 'instapay',
  MOBILE_WALLET = 'mobile_wallet',
}

/**
 * Kept as its own table, not columns on Creator, so read access can be
 * restricted at the query level to the owning creator and admins only
 * (SEC-004, DES-P1-004).
 */
@Entity('creator_payout_details')
export class CreatorPayoutDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'creator_id', unique: true })
  creatorId: string;

  @OneToOne(() => Creator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: Creator;

  @Column({
    type: 'enum',
    enum: PayoutMethod,
    enumName: 'creator_payout_details_method_enum',
  })
  method: PayoutMethod;

  @Column({ name: 'account_identifier' })
  accountIdentifier: string;

  @Column({ name: 'holder_name' })
  holderName: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
