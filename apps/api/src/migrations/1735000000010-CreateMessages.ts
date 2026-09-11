import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessages1735000000010 implements MigrationInterface {
  name = 'CreateMessages1735000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "collaboration_id" uuid NOT NULL REFERENCES "collaborations"("id") ON DELETE CASCADE,
        "sender_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text NOT NULL,
        "sent_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_messages_collaboration_id" ON "messages" ("collaboration_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages";`);
  }
}
