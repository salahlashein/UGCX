import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration requires PostgreSQL 14 or higher for transactional DDL with enums.
 * Note: PostgreSQL does not support removing values from an enum type in down migration.
 */
export class AddCampaignEscrowColumns1788600000003 implements MigrationInterface {
  name = 'AddCampaignEscrowColumns1788600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD COLUMN "escrow_funded_amount" numeric(10,2) NOT NULL DEFAULT '0.00',
        ADD COLUMN "escrow_allocated_amount" numeric(10,2) NOT NULL DEFAULT '0.00',
        ADD COLUMN "escrow_refunded_amount" numeric(10,2) NOT NULL DEFAULT '0.00',
        ADD COLUMN "funding_paymob_order_id" text,
        ADD COLUMN "funding_requested_amount" numeric(10,2),
        ADD COLUMN "refund_pending" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD CONSTRAINT "chk_campaigns_escrow_non_negative"
        CHECK (escrow_funded_amount >= 0 AND escrow_allocated_amount >= 0 AND escrow_refunded_amount >= 0);
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD CONSTRAINT "chk_campaigns_escrow_balance"
        CHECK (escrow_allocated_amount + escrow_refunded_amount <= escrow_funded_amount);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_campaigns_funding_order"
      ON "campaigns" ("funding_paymob_order_id")
      WHERE "funding_paymob_order_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_campaigns_refund_pending"
      ON "campaigns" ("refund_pending")
      WHERE "refund_pending" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_campaigns_refund_pending";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_campaigns_funding_order";`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "chk_campaigns_escrow_balance";`,
    );
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "chk_campaigns_escrow_non_negative";`,
    );
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        DROP COLUMN IF EXISTS "refund_pending",
        DROP COLUMN IF EXISTS "funding_requested_amount",
        DROP COLUMN IF EXISTS "funding_paymob_order_id",
        DROP COLUMN IF EXISTS "escrow_refunded_amount",
        DROP COLUMN IF EXISTS "escrow_allocated_amount",
        DROP COLUMN IF EXISTS "escrow_funded_amount";
    `);
  }
}
