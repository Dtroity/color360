import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInstallationServices1738000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем enum для типа цены
    await queryRunner.query(`
      CREATE TYPE "price_type_enum" AS ENUM ('fixed', 'per_unit');
    `);

    // Создаем таблицу installation_services
    await queryRunner.query(`
      CREATE TABLE installation_services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        base_price NUMERIC(10, 2) NOT NULL,
        price_type price_type_enum NOT NULL DEFAULT 'fixed',
        unit_name VARCHAR(50),
        min_quantity INT DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создаем индекс для быстрого поиска активных услуг
    await queryRunner.query(`
      CREATE INDEX idx_installation_services_active ON installation_services(is_active, sort_order);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS installation_services;`);
    await queryRunner.query(`DROP TYPE IF EXISTS price_type_enum;`);
  }
}

