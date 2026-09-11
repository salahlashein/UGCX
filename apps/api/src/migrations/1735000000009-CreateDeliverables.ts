import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliverables1735000000009 implements MigrationInterface {
  name = 'CreateDeliverables1735000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "deliverables_type_enum" AS ENUM ('ready_ad', 'raw', 'broll', 'hook', 'photo', 'voiceover');`,
    );
    await queryRunner.query(
      `CREATE TYPE "deliverables_status_enum" AS ENUM ('submitted', 'approved', 'revision_requested', 'declined');`,
    );

    await queryRunner.query(`
      CREATE TABLE "deliverables" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "collaboration_id" uuid NOT NULL REFERENCES "collaborations"("id") ON DELETE CASCADE,
        "type" "deliverables_type_enum" NOT NULL,
        "file_url" text NOT NULL,
        "duration_seconds" int,
        "status" "deliverables_status_enum" NOT NULL DEFAULT 'submitted',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_deliverables_collaboration_id" ON "deliverables" ("collaboration_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "deliverable_feedback" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "deliverable_id" uuid NOT NULL REFERENCES "deliverables"("id") ON DELETE CASCADE,
        "sender_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_deliverable_feedback_deliverable_id" ON "deliverable_feedback" ("deliverable_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "deliverable_feedback";`);
    await queryRunner.query(`DROP TABLE "deliverables";`);
    await queryRunner.query(`DROP TYPE "deliverables_status_enum";`);
    await queryRunner.query(`DROP TYPE "deliverables_type_enum";`);
  }
}
