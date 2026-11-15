import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignRevisionLimit1788600000010 implements MigrationInterface {
  name = 'AddCampaignRevisionLimit1788600000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "campaigns" ADD "revision_limit" SMALLINT NOT NULL DEFAULT 2;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "campaigns" DROP COLUMN "revision_limit";
    `);
  }
}
