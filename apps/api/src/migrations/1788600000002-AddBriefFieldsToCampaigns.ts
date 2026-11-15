import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration requires PostgreSQL 14 or higher for transactional DDL with enums.
 * Note: PostgreSQL does not support removing values from an enum type in down migration.
 */
export class AddBriefFieldsToCampaigns1788600000002 implements MigrationInterface {
  name = 'AddBriefFieldsToCampaigns1788600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "campaigns_status_enum" ADD VALUE IF NOT EXISTS 'paused';`,
    );
    await queryRunner.query(
      `ALTER TYPE "campaigns_status_enum" ADD VALUE IF NOT EXISTS 'completed';`,
    );
    await queryRunner.query(
      `ALTER TYPE "campaigns_status_enum" ADD VALUE IF NOT EXISTS 'cancelled';`,
    );

    await queryRunner.query(
      `ALTER TYPE "campaigns_video_type_enum" ADD VALUE IF NOT EXISTS 'talking_head';`,
    );
    await queryRunner.query(
      `ALTER TYPE "campaigns_video_type_enum" ADD VALUE IF NOT EXISTS 'try_on';`,
    );

    await queryRunner.query(`ALTER TABLE "campaigns" ADD COLUMN "title" text;`);

    await queryRunner.query(`
      UPDATE campaigns
      SET title = COALESCE((SELECT p.name FROM products p WHERE p.id = campaigns.product_id), 'Untitled brief')
      WHERE title IS NULL;
    `);

    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "title" SET NOT NULL;`,
    );

    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD COLUMN "brief" text,
        ADD COLUMN "budget_min" numeric(10,2),
        ADD COLUMN "budget_max" numeric(10,2),
        ADD COLUMN "currency" char(3) NOT NULL DEFAULT 'EGP',
        ADD COLUMN "published_at" timestamptz,
        ADD COLUMN "closes_at" timestamptz;
    `);

    await queryRunner.query(`
      UPDATE campaigns
      SET published_at = updated_at
      WHERE status = 'live' AND published_at IS NULL;
    `);

    await queryRunner.query(
      `ALTER TABLE "campaigns" ALTER COLUMN "product_id" DROP NOT NULL;`,
    );

    await queryRunner.query(`
      ALTER TABLE "campaigns"
      ADD CONSTRAINT "chk_campaigns_budget_range"
      CHECK ("budget_min" IS NULL OR "budget_max" IS NULL OR "budget_min" <= "budget_max");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_campaigns_closes_at" ON "campaigns" ("closes_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_campaigns_closes_at";
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns" DROP CONSTRAINT "chk_campaigns_budget_range";
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns"
        DROP COLUMN "closes_at",
        DROP COLUMN "published_at",
        DROP COLUMN "currency",
        DROP COLUMN "budget_max",
        DROP COLUMN "budget_min",
        DROP COLUMN "brief",
        DROP COLUMN "title";
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns" ALTER COLUMN "product_id" SET NOT NULL;
    `);
  }
}
