import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDisplayName1788600000014 implements MigrationInterface {
  name = 'AddUserDisplayName1788600000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD "display_name" character varying(80);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "display_name";
    `);
  }
}
