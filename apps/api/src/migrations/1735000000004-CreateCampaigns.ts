import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaigns1735000000004 implements MigrationInterface {
  name = 'CreateCampaigns1735000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "campaigns_status_enum" AS ENUM ('draft', 'live');`,
    );
    await queryRunner.query(`
      CREATE TYPE "campaigns_niche_enum" AS ENUM (
        'beauty_personal_care', 'fashion', 'mom_baby', 'food_fmcg', 'home_lifestyle', 'other'
      );
    `);
    await queryRunner.query(
      `CREATE TYPE "campaigns_language_enum" AS ENUM ('ar', 'en');`,
    );
    await queryRunner.query(`
      CREATE TYPE "campaigns_video_type_enum" AS ENUM (
        'unboxing', 'testimonial', 'demo', 'tutorial', 'other'
      );
    `);
    await queryRunner.query(
      `CREATE TYPE "campaigns_script_mode_enum" AS ENUM ('brand', 'creator');`,
    );

    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "status" "campaigns_status_enum" NOT NULL DEFAULT 'draft',
        "niche" "campaigns_niche_enum",
        "language" "campaigns_language_enum",
        "video_type" "campaigns_video_type_enum",
        "duration_seconds" int,
        "script_mode" "campaigns_script_mode_enum",
        "script" text,
        "talking_points" text[] NOT NULL DEFAULT '{}',
        "do_not_say" text[] NOT NULL DEFAULT '{}',
        "needs_shipping" boolean NOT NULL DEFAULT true,
        "slots" int NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_campaigns_brand_id" ON "campaigns" ("brand_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_campaigns_product_id" ON "campaigns" ("product_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_campaigns_status" ON "campaigns" ("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_campaigns_niche" ON "campaigns" ("niche");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "campaigns";`);
    await queryRunner.query(`DROP TYPE "campaigns_script_mode_enum";`);
    await queryRunner.query(`DROP TYPE "campaigns_video_type_enum";`);
    await queryRunner.query(`DROP TYPE "campaigns_language_enum";`);
    await queryRunner.query(`DROP TYPE "campaigns_niche_enum";`);
    await queryRunner.query(`DROP TYPE "campaigns_status_enum";`);
  }
}
