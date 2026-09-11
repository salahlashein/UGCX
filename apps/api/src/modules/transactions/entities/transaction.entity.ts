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

export enum TransactionType {
  CHARGE = 'charge',
  HOLD = 'hold',
  RELEASE = 'release',
  PAYOUT = 'payout',
  REFUND = 'refund',
  // M3: recorded alongside 'release' so the ledger reconciles exactly.
  // 'release' records the full totalAmount (what leaves escrow custody);
  // 'payout' only ever pays the creator's price. Without a 'fee' row, a
  // sum of release vs. payout+fee is off by the platform fee on every
  // collaboration.
  FEE = 'fee',
}

// DES-P1-005: every Transaction recorded by this plan represents a money
// movement that already happened (Paymob webhook success, brand approval,
// admin-recorded payout evidence); 'completed' is the only status this
// plan's flows ever set. The column exists so a future correction
// (e.g. a reversed payout) has somewhere to live without a schema change.
export enum TransactionStatus {
  COMPLETED = 'completed',
  REVERSED = 'reversed',
}

// TASK-P1-010: the ops evidence trail an admin must supply on mark-paid.
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  INSTAPAY = 'instapay',
  VODAFONE_CASH = 'vodafone_cash',
}

/**
 * The escrow ledger (DES-P1-001). One row per money movement; never
 * updated after insert. `paymobReference` and the partial unique index on
 * `(collaboration_id)` for `type = 'payout'` are what make webhook
 * processing (REQ-005) and payout marking (EDGE-P1-005) idempotent at the
 * database level rather than via an application-level check-then-insert.
 */
@Entity('transactions')
export class Transaction {
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
    enum: TransactionType,
    enumName: 'transactions_type_enum',
  })
  type: TransactionType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'char', length: 3, default: 'EGP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'transactions_status_enum',
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  // REQ-005: unique (where not null) so a repeated webhook delivery for
  // the same Paymob transaction id cannot insert a second row.
  @Column({ name: 'paymob_reference', type: 'text', nullable: true })
  paymobReference: string | null;

  // REQ-010: set for 'payout' transactions to the recording admin's user
  // id; null for system-triggered hold/release rows.
  @Column({ name: 'recorded_by_user_id', type: 'uuid', nullable: true })
  recordedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by_user_id' })
  recordedBy: User | null;

  // REQ-010/TASK-P1-010: ops evidence trail, only populated on 'payout' rows.
  @Column({
    name: 'payout_method',
    type: 'enum',
    enum: PayoutMethod,
    enumName: 'transactions_payout_method_enum',
    nullable: true,
  })
  payoutMethod: PayoutMethod | null;

  @Column({ name: 'payout_reference', type: 'text', nullable: true })
  payoutReference: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
