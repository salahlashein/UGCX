import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration requires PostgreSQL 14 or higher for transactional DDL with enums.
 * Note: PostgreSQL does not support removing values from an enum type in down migration.
 */
export class AlterTransactionsForCampaignEscrow1788600000004 implements MigrationInterface {
  name = 'AlterTransactionsForCampaignEscrow1788600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "transactions"
        ADD COLUMN "campaign_id" uuid REFERENCES "campaigns"("id") ON DELETE CASCADE,
        ADD COLUMN "parent_transaction_id" uuid REFERENCES "transactions"("id") ON DELETE SET NULL,
        ADD COLUMN "payment_method_label" text;
    `);

    // Backfill campaign_id on existing collaboration transactions
    await queryRunner.query(`
      UPDATE "transactions" t
      SET "campaign_id" = c."campaign_id"
      FROM "collaborations" c
      WHERE c."id" = t."collaboration_id";
    `);

    // Drop NOT NULL on collaboration_id
    await queryRunner.query(`
      ALTER TABLE "transactions" ALTER COLUMN "collaboration_id" DROP NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_transactions_campaign_id" ON "transactions" ("campaign_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions" ADD CONSTRAINT "chk_transactions_parent" CHECK (
        (type IN ('charge','refund') AND campaign_id IS NOT NULL)
        OR
        (type IN ('hold','release','payout','fee') AND collaboration_id IS NOT NULL)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "chk_transactions_parent";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_transactions_campaign_id";`,
    );

    // NOTE: Rollback destroys campaign escrow transaction history that lacks collaboration_id
    await queryRunner.query(
      `DELETE FROM "transactions" WHERE "collaboration_id" IS NULL;`,
    );

    await queryRunner.query(`
      ALTER TABLE "transactions" ALTER COLUMN "collaboration_id" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
        DROP COLUMN IF EXISTS "payment_method_label",
        DROP COLUMN IF EXISTS "parent_transaction_id",
        DROP COLUMN IF EXISTS "campaign_id";
    `);
  }
}
