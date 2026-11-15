import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1788600000006 implements MigrationInterface {
  name = 'CreateNotifications1788600000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "event" "notifications_event_enum" NOT NULL,
        "params" jsonb NOT NULL DEFAULT '{}',
        "deep_link" jsonb,
        "collaboration_id" uuid,
        "campaign_id" uuid,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "pushed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notifications_collaboration" FOREIGN KEY ("collaboration_id") REFERENCES "collaborations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notifications_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user_id", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id") WHERE "read_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_notifications_user_unread";`);
    await queryRunner.query(`DROP INDEX "idx_notifications_user_created";`);
    await queryRunner.query(`DROP TABLE "notifications";`);
    await queryRunner.query(`DROP TYPE "notifications_event_enum";`);
  }
}
