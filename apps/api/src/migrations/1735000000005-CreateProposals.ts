import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProposals1735000000005 implements MigrationInterface {
  name = 'CreateProposals1735000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "proposals_status_enum" AS ENUM ('applied', 'shortlisted', 'declined');`,
    );

    await queryRunner.query(`
      CREATE TABLE "proposals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
        "creator_id" uuid NOT NULL REFERENCES "creators"("id") ON DELETE CASCADE,
        "price" numeric(10,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'EGP',
        "delivery_days" int NOT NULL,
        "pitch" text NOT NULL,
        "status" "proposals_status_enum" NOT NULL DEFAULT 'applied',
        "decline_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_proposals_campaign_id" ON "proposals" ("campaign_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_proposals_creator_id" ON "proposals" ("creator_id");`,
    );
    // REQ-008 enforced at the DB level; the service layer maps a violation
    // to a friendly 409 duplicate_proposal response.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_proposals_campaign_creator" ON "proposals" ("campaign_id", "creator_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "proposals";`);
    await queryRunner.query(`DROP TYPE "proposals_status_enum";`);
  }
}
