import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sign-up is email-only, so a new user has no phone number. The column was
 * NOT NULL from the first migration, which made every new email sign-up fail
 * with a 500 after the OTP was accepted. The unique index stays: Postgres
 * allows any number of NULLs under a unique index.
 */
export class MakeUserPhoneNullable1788600000015 implements MigrationInterface {
  name = 'MakeUserPhoneNullable1788600000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fails while any user has no phone, which is the safe outcome.
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
    `);
  }
}
