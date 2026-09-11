import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborations1735000000007 implements MigrationInterface {
  name = 'CreateCollaborations1735000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "collaborations_status_enum" AS ENUM (
        'pending_payment', 'funded', 'payment_failed', 'shipped',
        'delivered', 'revision_requested', 'approved', 'paid', 'cancelled'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "collaborations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE RESTRICT,
        "proposal_id" uuid NOT NULL UNIQUE REFERENCES "proposals"("id") ON DELETE RESTRICT,
        "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE RESTRICT,
        "creator_id" uuid NOT NULL REFERENCES "creators"("id") ON DELETE RESTRICT,
        "creator_price" numeric(10,2) NOT NULL,
        "platform_fee" numeric(10,2) NOT NULL,
        "total_amount" numeric(10,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'EGP',
        "status" "collaborations_status_enum" NOT NULL DEFAULT 'pending_payment',
        "paymob_order_id" text,
        "shipment_carrier" text,
        "shipment_tracking_number" text,
        "shipment_confirmed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // CON-001 is already enforced by the UNIQUE constraint on proposal_id
    // above; these are the remaining FK/status indexes from TASK-P1-001.
    await queryRunner.query(
      `CREATE INDEX "idx_collaborations_campaign_id" ON "collaborations" ("campaign_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_collaborations_brand_id" ON "collaborations" ("brand_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_collaborations_creator_id" ON "collaborations" ("creator_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_collaborations_status" ON "collaborations" ("status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "collaborations";`);
    await queryRunner.query(`DROP TYPE "collaborations_status_enum";`);
  }
}
