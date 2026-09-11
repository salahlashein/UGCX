import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1735000000003 implements MigrationInterface {
  name = 'CreateProducts1735000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text,
        "value_props" text[] NOT NULL DEFAULT '{}',
        "images" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_products_brand_id" ON "products" ("brand_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products";`);
  }
}
