import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollaborationReceivedAt1788600000011 implements MigrationInterface {
  name = 'AddCollaborationReceivedAt1788600000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations" ADD "received_at" TIMESTAMP WITH TIME ZONE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations" DROP COLUMN "received_at";
    `);
  }
}
