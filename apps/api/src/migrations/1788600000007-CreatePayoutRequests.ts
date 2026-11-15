import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayoutRequests1788600000007 implements MigrationInterface {
  name = 'CreatePayoutRequests1788600000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "payout_requests_status_enum" AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'PAID'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "payout_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "creator_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "method" character varying NOT NULL,
        "status" "payout_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payout_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payout_requests_creator" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_payout_requests_creator" ON "payout_requests" ("creator_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_payout_requests_creator";`);
    await queryRunner.query(`DROP TABLE "payout_requests";`);
    await queryRunner.query(`DROP TYPE "payout_requests_status_enum";`);
  }
}
