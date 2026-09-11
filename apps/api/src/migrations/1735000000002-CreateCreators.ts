import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreators1735000000002 implements MigrationInterface {
  name = 'CreateCreators1735000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "creators_vetting_status_enum" AS ENUM ('pending', 'approved', 'rejected');`,
    );

    await queryRunner.query(`
      CREATE TABLE "creators" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "display_name" text,
        "city" text,
        "country" text NOT NULL DEFAULT 'EG',
        "niches" text[] NOT NULL DEFAULT '{}',
        "base_price" numeric(10,2),
        "vetting_status" "creators_vetting_status_enum" NOT NULL DEFAULT 'pending',
        "reviewed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "reviewed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_creators_user_id" ON "creators" ("user_id");`,
    );
    // DES-P1-002: GIN index for array-containment niche queries.
    await queryRunner.query(
      `CREATE INDEX "idx_creators_niches" ON "creators" USING GIN ("niches");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_creators_vetting_status" ON "creators" ("vetting_status");`,
    );

    await queryRunner.query(
      `CREATE TYPE "creator_portfolio_items_media_type_enum" AS ENUM ('image', 'video');`,
    );
    await queryRunner.query(`
      CREATE TABLE "creator_portfolio_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "creator_id" uuid NOT NULL REFERENCES "creators"("id") ON DELETE CASCADE,
        "media_url" text NOT NULL,
        "media_type" "creator_portfolio_items_media_type_enum" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_creator_portfolio_items_creator_id" ON "creator_portfolio_items" ("creator_id");`,
    );

    await queryRunner.query(
      `CREATE TYPE "creator_payout_details_method_enum" AS ENUM ('bank_transfer', 'instapay', 'mobile_wallet');`,
    );
    await queryRunner.query(`
      CREATE TABLE "creator_payout_details" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "creator_id" uuid NOT NULL UNIQUE REFERENCES "creators"("id") ON DELETE CASCADE,
        "method" "creator_payout_details_method_enum" NOT NULL,
        "account_identifier" text NOT NULL,
        "holder_name" text NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_creator_payout_details_creator_id" ON "creator_payout_details" ("creator_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "creator_payout_details";`);
    await queryRunner.query(`DROP TYPE "creator_payout_details_method_enum";`);
    await queryRunner.query(`DROP TABLE "creator_portfolio_items";`);
    await queryRunner.query(
      `DROP TYPE "creator_portfolio_items_media_type_enum";`,
    );
    await queryRunner.query(`DROP TABLE "creators";`);
    await queryRunner.query(`DROP TYPE "creators_vetting_status_enum";`);
  }
}
