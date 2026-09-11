import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * REQ-002: a proposal moves to 'accepted' when the collaboration created
 * from it is funded by a Paymob webhook, not directly by a brand action.
 * Postgres cannot drop a single enum value, so `down` recreates the type
 * without it (safe here: no row references 'accepted' before this plan).
 */
export class AddAcceptedToProposalsStatus1735000000006 implements MigrationInterface {
  name = 'AddAcceptedToProposalsStatus1735000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "proposals_status_enum" ADD VALUE IF NOT EXISTS 'accepted';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "proposals_status_enum" RENAME TO "proposals_status_enum_old";`,
    );
    await queryRunner.query(
      `CREATE TYPE "proposals_status_enum" AS ENUM ('applied', 'shortlisted', 'declined');`,
    );
    await queryRunner.query(
      `ALTER TABLE "proposals" ALTER COLUMN "status" DROP DEFAULT;`,
    );
    await queryRunner.query(
      `ALTER TABLE "proposals" ALTER COLUMN "status" TYPE "proposals_status_enum" USING "status"::text::"proposals_status_enum";`,
    );
    await queryRunner.query(
      `ALTER TABLE "proposals" ALTER COLUMN "status" SET DEFAULT 'applied';`,
    );
    await queryRunner.query(`DROP TYPE "proposals_status_enum_old";`);
  }
}
