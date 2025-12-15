/**
 * cleanup-zero-price-products.ts
 * Удаляет все товары с нулевой стоимостью (price = 0)
 * 
 * Запуск:
 *   pnpm --filter backend run cleanup:zero-price        # dry-run
 *   pnpm --filter backend run cleanup:zero-price -- --apply   # применить изменения
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

async function main() {
  const apply = process.argv.includes('--apply');

  try {
    await client.connect();
    console.log('✅ Подключение к БД установлено\n');

    // Находим все товары с price = 0
    const result = await client.query(
      `SELECT id, name, slug, price FROM products WHERE price = 0 OR price IS NULL`
    );

    const zeroPriceProducts = result.rows;

    if (zeroPriceProducts.length === 0) {
      console.log('✅ Товаров с нулевой стоимостью не найдено.');
      return;
    }

    console.log(`📋 Найдено товаров с нулевой стоимостью: ${zeroPriceProducts.length}\n`);
    console.log('Список товаров для удаления:');
    console.table(
      zeroPriceProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
      }))
    );

    if (!apply) {
      console.log('\n⚠️  Dry-run режим. Для удаления запустите с флагом --apply');
      return;
    }

    console.log('\n🗑️  Удаление товаров...');

    // Удаляем изображения товаров
    const productIds = zeroPriceProducts.map((p) => p.id);
    
    // Сначала удаляем изображения
    const imagesResult = await client.query(
      `DELETE FROM product_images WHERE "productId" = ANY($1::int[]) RETURNING id`,
      [productIds]
    );
    console.log(`   ✅ Удалено изображений: ${imagesResult.rowCount}`);

    // Затем удаляем товары
    const productsResult = await client.query(
      `DELETE FROM products WHERE id = ANY($1::int[]) RETURNING id, name`,
      [productIds]
    );
    console.log(`   ✅ Удалено товаров: ${productsResult.rowCount}`);

    console.log('\n✅ Очистка завершена!');
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

