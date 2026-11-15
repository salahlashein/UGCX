import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthOtpCodes1788600000008 implements MigrationInterface {
  name = 'CreateAuthOtpCodes1788600000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auth_otp_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "code_hash" character(64) NOT NULL,
        "attempts" smallint NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_otp_codes" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auth_otp_codes_email" ON "auth_otp_codes" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_auth_otp_codes_email";`);
    await queryRunner.query(`DROP TABLE "auth_otp_codes";`);
  }
}
