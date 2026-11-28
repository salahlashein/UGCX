import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the moment a user finished first sign-up onboarding. A new account
 * starts with NULL, so the web app opens the onboarding flow.
 *
 * Every account that exists before this migration is marked as onboarded
 * with its own created_at. Existing brands and creators must never see the
 * flow, even when their profile has gaps.
 */
export class AddUserOnboardingCompletedAt1788600000016 implements MigrationInterface {
  name = 'AddUserOnboardingCompletedAt1788600000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamptz NULL;
    `);
    await queryRunner.query(`
      UPDATE "users" SET "onboarding_completed_at" = "created_at";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "onboarding_completed_at";
    `);
  }
}
