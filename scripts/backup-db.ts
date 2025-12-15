/**
 * backup-db.ts
 * Создаёт SQL дамп таблиц products и product_images
 * 
 * Запуск:
 *   pnpm --filter backend run backup:db
 *   или: ts-node scripts/backup-db.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Загружаем .env
const tryEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
];
for (const p of tryEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const pgConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'video_shop',
};

const client = new Client(pgConfig);

async function backupTables() {
  await client.connect();
  console.log('✅ Connected to database');

  try {
    // Создаём папку для бэкапов
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupsDir, `products_product_images_${timestamp}.sql`);

    console.log(`📦 Creating backup: ${backupFile}`);

    // Получаем данные из products
    const productsRes = await client.query('SELECT * FROM products ORDER BY id');
    const products = productsRes.rows;

    // Получаем данные из product_images
    const imagesRes = await client.query('SELECT * FROM product_images ORDER BY id');
    const images = imagesRes.rows;

    // Формируем SQL дамп
    let sql = `-- Backup created at ${new Date().toISOString()}\n`;
    sql += `-- Tables: products, product_images\n\n`;

    // Products
    sql += `-- Table: products (${products.length} rows)\n`;
    sql += `DELETE FROM product_images WHERE "productId" IN (SELECT id FROM products);\n`;
    sql += `DELETE FROM products;\n\n`;

    if (products.length > 0) {
      const columns = Object.keys(products[0]);
      sql += `INSERT INTO products (${columns.map((c) => `"${c}"`).join(', ')}) VALUES\n`;

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const values = columns.map((col) => {
          const val = p[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          return String(val);
        });
        sql += `  (${values.join(', ')})`;
        if (i < products.length - 1) sql += ',\n';
        else sql += ';\n\n';
      }
    }

    // Product images
    sql += `-- Table: product_images (${images.length} rows)\n`;
    if (images.length > 0) {
      const imgColumns = Object.keys(images[0]);
      sql += `INSERT INTO product_images (${imgColumns.map((c) => `"${c}"`).join(', ')}) VALUES\n`;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const values = imgColumns.map((col) => {
          const val = img[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          return String(val);
        });
        sql += `  (${values.join(', ')})`;
        if (i < images.length - 1) sql += ',\n';
        else sql += ';\n\n';
      }
    }

    // Сохраняем файл
    fs.writeFileSync(backupFile, sql, 'utf-8');

    console.log(`✅ Backup saved: ${backupFile}`);
    console.log(`   Products: ${products.length} rows`);
    console.log(`   Product images: ${images.length} rows`);
    console.log(`\n📝 To restore, run:`);
    console.log(`   psql -h ${pgConfig.host} -U ${pgConfig.user} -d ${pgConfig.database} -f ${backupFile}`);

    return backupFile;
  } catch (err) {
    console.error('❌ Error creating backup:', err);
    throw err;
  } finally {
    await client.end();
  }
}

backupTables()
  .then(() => {
    console.log('✅ Backup completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Backup failed:', e);
    process.exit(1);
  });

