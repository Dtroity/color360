import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1764336931186 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE manufacturers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        logo VARCHAR(255),
        description TEXT,
        country VARCHAR(50),
        website VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255),
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(160) NOT NULL UNIQUE,
        sku VARCHAR(80) NOT NULL UNIQUE,
        short_description TEXT,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        old_price NUMERIC(12, 2),
        currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
        stock INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        availability VARCHAR(120),
        external_id VARCHAR(120),
        attributes JSONB,
        metadata JSONB,
        seo JSONB,
        manufacturer_id INT REFERENCES manufacturers(id) ON DELETE SET NULL,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE product_images (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(60),
        last_name VARCHAR(60),
        role VARCHAR(20) NOT NULL DEFAULT 'customer',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(40) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
        customer_name VARCHAR(120),
        customer_email VARCHAR(120),
        customer_phone VARCHAR(32),
        shipping_address JSONB,
        billing_address JSONB,
        comment TEXT,
        metadata JSONB,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        quantity INT NOT NULL DEFAULT 1,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        snapshot JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(120) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS site_settings;');
    await queryRunner.query('DROP TABLE IF EXISTS order_items;');
    await queryRunner.query('DROP TABLE IF EXISTS orders;');
    await queryRunner.query('DROP TABLE IF EXISTS users;');
    await queryRunner.query('DROP TABLE IF EXISTS product_images;');
    await queryRunner.query('DROP TABLE IF EXISTS products;');
    await queryRunner.query('DROP TABLE IF EXISTS categories;');
    await queryRunner.query('DROP TABLE IF EXISTS manufacturers;');
  }
}
