import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShipmentReceivedNotificationEvent1788600000012 implements MigrationInterface {
  name = 'AddShipmentReceivedNotificationEvent1788600000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notifications_event_enum" ADD VALUE IF NOT EXISTS 'shipment_received';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notifications_event_enum" RENAME TO "notifications_event_enum_old";`,
    );
    await queryRunner.query(`
      CREATE TYPE "notifications_event_enum" AS ENUM (
        'brief_published',
        'proposal_received',
        'proposal_shortlisted',
        'proposal_declined',
        'escrow_funded',
        'shipment_confirmed',
        'deliverable_submitted',
        'revision_requested',
        'escrow_released',
        'message_received',
        'payout_sent'
      );
    `);
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "event" TYPE "notifications_event_enum" USING "event"::text::"notifications_event_enum";`,
    );
    await queryRunner.query(`DROP TYPE "notifications_event_enum_old";`);
  }
}
