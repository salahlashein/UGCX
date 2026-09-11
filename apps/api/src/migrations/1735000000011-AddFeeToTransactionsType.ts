import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * M3 (post-implementation review fix): 'fee' lets the ledger record the
 * platform's retained cut as its own row alongside 'release', so
 * release = payout + fee reconciles exactly instead of being off by the
 * fee on every collaboration.
 */
export class AddFeeToTransactionsType1735000000011 implements MigrationInterface {
  name = 'AddFeeToTransactionsType1735000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "transactions_type_enum" ADD VALUE IF NOT EXISTS 'fee';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "transactions_type_enum" RENAME TO "transactions_type_enum_old";`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_type_enum" AS ENUM ('charge', 'hold', 'release', 'payout', 'refund');`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "transactions_type_enum" USING "type"::text::"transactions_type_enum";`,
    );
    await queryRunner.query(`DROP TYPE "transactions_type_enum_old";`);
  }
}
