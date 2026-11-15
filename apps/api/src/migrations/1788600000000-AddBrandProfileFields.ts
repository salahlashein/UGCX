import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandProfileFields1788600000000 implements MigrationInterface {
  name = 'AddBrandProfileFields1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "brands_category_enum" AS ENUM (
        'beauty_personal_care',
        'fashion',
        'mom_baby',
        'food_fmcg',
        'home_lifestyle',
        'other'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "brands_verification_status_enum" AS ENUM (
        'unverified',
        'pending',
        'verified'
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
        ADD COLUMN "logo_url" text,
        ADD COLUMN "category" "brands_category_enum",
        ADD COLUMN "business_document_url" text,
        ADD COLUMN "verification_status" "brands_verification_status_enum" NOT NULL DEFAULT 'unverified',
        ADD COLUMN "verified_at" timestamptz;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "phone_verified_at" timestamptz;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_brands_verification_status" ON "brands" ("verification_status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_brands_verification_status";
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "phone_verified_at";
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
        DROP COLUMN "verified_at",
        DROP COLUMN "verification_status",
        DROP COLUMN "business_document_url",
        DROP COLUMN "category",
        DROP COLUMN "logo_url";
    `);

    await queryRunner.query(`
      DROP TYPE "brands_verification_status_enum";
    `);

    await queryRunner.query(`
      DROP TYPE "brands_category_enum";
    `);
  }
}
