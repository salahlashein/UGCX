import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliverableVersionAndSystemMessages1788600000005 implements MigrationInterface {
  name = 'AddDeliverableVersionAndSystemMessages1788600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add version and note on deliverables
    await queryRunner.query(`
      ALTER TABLE "deliverables"
        ADD COLUMN "version" int,
        ADD COLUMN "note" text;
    `);

    // 2. Backfill version with window function
    await queryRunner.query(`
      UPDATE deliverables d SET version = s.rn
      FROM (
        SELECT id, row_number() OVER (PARTITION BY collaboration_id ORDER BY created_at, id) AS rn
        FROM deliverables
      ) s
      WHERE s.id = d.id;
    `);

    // 3. Set version NOT NULL and create unique index
    await queryRunner.query(`
      ALTER TABLE "deliverables" ALTER COLUMN "version" SET NOT NULL;
      CREATE UNIQUE INDEX "uq_deliverables_collaboration_version" ON "deliverables" ("collaboration_id", "version");
    `);

    // 4. Create messages_kind_enum, add kind with default 'user', add event
    await queryRunner.query(`
      CREATE TYPE "messages_kind_enum" AS ENUM ('user', 'system');
      ALTER TABLE "messages"
        ADD COLUMN "kind" "messages_kind_enum" NOT NULL DEFAULT 'user',
        ADD COLUMN "event" text;
    `);

    // 5. Drop NOT NULL from messages.sender_user_id
    await queryRunner.query(`
      ALTER TABLE "messages" ALTER COLUMN "sender_user_id" DROP NOT NULL;
    `);

    // 6. Add check constraint
    await queryRunner.query(`
      ALTER TABLE "messages" ADD CONSTRAINT "chk_messages_sender" CHECK (
        (kind = 'user' AND sender_user_id IS NOT NULL)
        OR
        (kind = 'system' AND sender_user_id IS NULL)
      );
    `);

    // 7. Add collaboration read timestamps (TASK-P3-07)
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD COLUMN "brand_last_read_at" timestamptz,
        ADD COLUMN "creator_last_read_at" timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 0. Drop collaboration read timestamps
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP COLUMN IF EXISTS "creator_last_read_at",
        DROP COLUMN IF EXISTS "brand_last_read_at";
    `);

    // 1. Drop check constraint
    await queryRunner.query(`
      ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "chk_messages_sender";
    `);

    // 2. Delete system messages before restoring NOT NULL
    await queryRunner.query(`
      DELETE FROM "messages" WHERE "kind" = 'system' OR "sender_user_id" IS NULL;
    `);

    // 3. Restore NOT NULL on sender_user_id
    await queryRunner.query(`
      ALTER TABLE "messages" ALTER COLUMN "sender_user_id" SET NOT NULL;
    `);

    // 4. Drop kind and event, drop enum
    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "event",
        DROP COLUMN IF EXISTS "kind";
      DROP TYPE IF EXISTS "messages_kind_enum";
    `);

    // 5. Drop deliverables version and note
    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_deliverables_collaboration_version";
      ALTER TABLE "deliverables"
        DROP COLUMN IF EXISTS "note",
        DROP COLUMN IF EXISTS "version";
    `);
  }
}
