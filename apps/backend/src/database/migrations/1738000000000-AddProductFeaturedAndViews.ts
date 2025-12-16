import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductFeaturedAndViews1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_views_count ON products(views_count DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_views_count;
      DROP INDEX IF EXISTS idx_products_is_featured;
      ALTER TABLE products 
      DROP COLUMN IF EXISTS views_count,
      DROP COLUMN IF EXISTS is_featured;
    `);
  }
}

