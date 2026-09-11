import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * feature_mobile_app_phase1 addendum: stores the Expo push token so the
 * API can send REQ-009 notifications (proposal received, deliverable
 * submitted, collaboration approved) to the owning user's device.
 */
export class AddExpoPushTokenToUsers1735000000012 implements MigrationInterface {
  name = 'AddExpoPushTokenToUsers1735000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "expo_push_token" text;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "expo_push_token";`,
    );
  }
}
