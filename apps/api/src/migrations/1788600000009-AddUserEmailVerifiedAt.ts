import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailVerifiedAt1788600000009 implements MigrationInterface {
  name = 'AddUserEmailVerifiedAt1788600000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "email_verified_at";
    `);
  }
}
