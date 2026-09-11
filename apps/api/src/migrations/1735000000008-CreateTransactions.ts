import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactions1735000000008 implements MigrationInterface {
  name = 'CreateTransactions1735000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "transactions_type_enum" AS ENUM ('charge', 'hold', 'release', 'payout', 'refund');`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_status_enum" AS ENUM ('completed', 'reversed');`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_payout_method_enum" AS ENUM ('bank_transfer', 'instapay', 'vodafone_cash');`,
    );

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "collaboration_id" uuid NOT NULL REFERENCES "collaborations"("id") ON DELETE CASCADE,
        "type" "transactions_type_enum" NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'EGP',
        "status" "transactions_status_enum" NOT NULL DEFAULT 'completed',
        "paymob_reference" text,
        "recorded_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "payout_method" "transactions_payout_method_enum",
        "payout_reference" text,
        "paid_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_transactions_collaboration_id" ON "transactions" ("collaboration_id");`,
    );
    // REQ-005: idempotency via a real unique constraint, not an
    // application-level check-then-insert race.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_transactions_paymob_reference" ON "transactions" ("paymob_reference") WHERE "paymob_reference" IS NOT NULL;`,
    );
    // EDGE-P1-005: a collaboration can have at most one payout transaction.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_transactions_one_payout_per_collaboration" ON "transactions" ("collaboration_id") WHERE "type" = 'payout';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions";`);
    await queryRunner.query(`DROP TYPE "transactions_payout_method_enum";`);
    await queryRunner.query(`DROP TYPE "transactions_status_enum";`);
    await queryRunner.query(`DROP TYPE "transactions_type_enum";`);
  }
}
