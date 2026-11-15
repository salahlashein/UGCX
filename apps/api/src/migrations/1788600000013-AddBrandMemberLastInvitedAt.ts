import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandMemberLastInvitedAt1788600000013 implements MigrationInterface {
  name = 'AddBrandMemberLastInvitedAt1788600000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "brand_members" ADD "last_invited_at" TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "brand_members" DROP COLUMN "last_invited_at";
    `);
  }
}
