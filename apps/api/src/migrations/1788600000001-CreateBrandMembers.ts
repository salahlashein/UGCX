import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrandMembers1788600000001 implements MigrationInterface {
  name = 'CreateBrandMembers1788600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "brand_members_role_enum" AS ENUM (
        'owner',
        'approver',
        'viewer'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "brand_members_status_enum" AS ENUM (
        'invited',
        'active'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "brand_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "invited_email" citext,
        "role" "brand_members_role_enum" NOT NULL DEFAULT 'viewer',
        "status" "brand_members_status_enum" NOT NULL DEFAULT 'invited',
        "invited_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "accepted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_brand_members_identity" CHECK ("user_id" IS NOT NULL OR "invited_email" IS NOT NULL)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_brand_members_brand_id" ON "brand_members" ("brand_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_brand_members_user_id" ON "brand_members" ("user_id");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_brand_members_brand_user" ON "brand_members" ("brand_id", "user_id") WHERE "user_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_brand_members_brand_email" ON "brand_members" ("brand_id", "invited_email") WHERE "invited_email" IS NOT NULL;
    `);

    await queryRunner.query(`
      INSERT INTO "brand_members" ("brand_id", "user_id", "role", "status", "accepted_at")
      SELECT "id", "user_id", 'owner', 'active', now() FROM "brands";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "brand_members";
    `);

    await queryRunner.query(`
      DROP TYPE "brand_members_status_enum";
    `);

    await queryRunner.query(`
      DROP TYPE "brand_members_role_enum";
    `);
  }
}
