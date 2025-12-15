/**
 * repairImages.ts
 *  - делает dry-run: показывает какие product_images будут обновлены (куда)
 *  - при запуске с флагом --apply выполняет UPDATE в БД
 *
 * Запуск:
 *   pnpm --filter backend run repair:images        # dry-run
 *   pnpm --filter backend run repair:images -- --apply   # применить изменения
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Загружаем .env — пробуем рядом с apps/backend, затем выше
const tryEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
  path.join(process.cwd(), '..', '..', '..', '.env'),
];
for (const p of tryEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

// PG connection (по env или по дефолту)
const pgConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'video_shop',
};

const client = new Client(pgConfig);

// Единый путь к uploads/products (требование)
// Путь должен строиться от корня монорепы, а не от cwd
const repoRoot = path.join(process.cwd(), '..', '..');
const uploadsRoot = path.join(repoRoot, 'apps', 'backend', 'uploads', 'products');

function ensureUploadsRoot(apply: boolean): string {
  if (!fs.existsSync(uploadsRoot)) {
    if (apply) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
      console.log(`✅ Создан каталог uploads: ${uploadsRoot}`);
    } else {
      console.warn(`⚠️ Каталог uploads не найден: ${uploadsRoot} (dry-run, будет создан при --apply)`);
    }
  }
  return uploadsRoot;
}

// какие расширения считаем валидными (в порядке приоритета)
const allowedExt = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];

async function main() {
  // флаг apply
  const apply = process.argv.includes('--apply');
  ensureUploadsRoot(apply);
  console.log('📁 Используем uploads root:', uploadsRoot);

  await client.connect();

  try {
    // Получаем все продукты и текущие записи product_images
    const productsRes = await client.query(`SELECT id, name, slug FROM products ORDER BY id`);
    const products = productsRes.rows as { id: number; name: string; slug: string }[];

    console.log(`ℹ Найдено продуктов в БД: ${products.length}`);

    const summary: Array<{
      productId: number;
      productName: string;
      action: 'update' | 'skip-no-folder' | 'skip-no-file' | 'noop';
      oldUrls?: string[];
      newUrl?: string;
    }> = [];

    for (const p of products) {
      const folder = path.join(uploadsRoot, String(p.id));
      const hasFolder = fs.existsSync(folder) && fs.statSync(folder).isDirectory();

      // чтение текущих url в product_images
      const curRes = await client.query(
        `SELECT id, url, "sortOrder" FROM product_images WHERE "productId" = $1 ORDER BY "sortOrder" ASC, id ASC`,
        [p.id],
      );
      const oldUrls = curRes.rows.map((r) => r.url as string);

      if (!hasFolder) {
        if (apply) {
          fs.mkdirSync(folder, { recursive: true });
        }
      }

      // список файлов в папке
      const files = fs.existsSync(folder)
        ? fs
            .readdirSync(folder)
            .filter((f) => allowedExt.includes(path.extname(f).toLowerCase()))
        : [];

      // Удаляем записи, указывающие на отсутствующие файлы
      const missingRows =
        curRes.rows.filter((r) => {
          const base = path.basename(r.url || '');
          const filePath = path.join(folder, base);
          return !base || !fs.existsSync(filePath);
        }) || [];

      if (apply && missingRows.length) {
        await client.query(
          `DELETE FROM product_images WHERE id = ANY($1::int[])`,
          [missingRows.map((r) => r.id)],
        );
      }

      if (!files.length) {
        summary.push({
          productId: p.id,
          productName: p.name,
          action: 'skip-no-file',
          oldUrls,
        });
        continue;
      }

      // выбираем главный файл — приоритет: 0.webp, 0.jpg, first found
      let chosen = files.find((f) => /^0\.(webp|jpg|jpeg|png|gif)$/i.test(f));
      if (!chosen) {
        chosen = files.find((f) => /thumb|_thumb|_400x|_500x|_800x/i.test(f)) || files[0];
      }

      const targetName = '0.webp';
      const targetPath = path.join(folder, targetName);
      const chosenPath = path.join(folder, chosen);

      // Если главного 0.webp нет — копируем выбранный файл в 0.webp (в apply)
      if (apply && (!fs.existsSync(targetPath) || path.basename(chosenPath) !== targetName)) {
        fs.copyFileSync(chosenPath, targetPath);
        chosen = targetName;
      } else {
        chosen = fs.existsSync(targetPath) ? targetName : chosen;
      }

      const newUrl = `/uploads/products/${p.id}/${chosen}`;

      // Если уже есть запись совпадающая — и первая запись уже указывает на newUrl — пропускаем
      if (oldUrls.length && oldUrls[0] === newUrl && missingRows.length === 0) {
        summary.push({
          productId: p.id,
          productName: p.name,
          action: 'noop',
          oldUrls,
        });
        continue;
      }

      // dry-run: показываем что будем делать
      summary.push({
        productId: p.id,
        productName: p.name,
        action: 'update',
        oldUrls,
        newUrl,
      });

      if (apply) {
        // если нет product_images вообще — вставим новую запись с sortOrder = 0
        const existingAfterDelete = await client.query(
          `SELECT id, "sortOrder" FROM product_images WHERE "productId" = $1 ORDER BY "sortOrder" ASC, id ASC`,
          [p.id],
        );
        if (existingAfterDelete.rows.length === 0) {
          await client.query(
            `INSERT INTO product_images("url","alt","sortOrder","productId","createdAt","updatedAt") VALUES($1,$2,$3,$4,NOW(),NOW())`,
            [newUrl, p.name || '', 0, p.id],
          );
        } else {
          const firstRow =
            existingAfterDelete.rows.find((r) => r.sortOrder === 0) ||
            existingAfterDelete.rows[0];
          await client.query(
            `UPDATE product_images SET url = $1, updatedAt = NOW(), "sortOrder" = 0 WHERE id = $2`,
            [newUrl, firstRow.id],
          );
        }
      }
    }

    // выводим аккуратно сводку
    const toUpdate = summary.filter((s) => s.action === 'update');
    const noop = summary.filter((s) => s.action === 'noop');
    const noFolder = summary.filter((s) => s.action === 'skip-no-folder');
    const noFile = summary.filter((s) => s.action === 'skip-no-file');

    console.log('---- SUMMARY ----');
    console.log(`Will update (found changes): ${toUpdate.length}`);
    if (toUpdate.length) {
      console.table(
        toUpdate.slice(0, 200).map((t) => ({
          id: t.productId,
          name: t.productName,
          old: (t.oldUrls || []).slice(0, 3).join(' | '),
          new: t.newUrl,
        })),
      );
    }
    console.log(`Already OK (noop): ${noop.length}`);
    console.log(`Missing folder: ${noFolder.length}`);
    console.log(`Missing files in folder: ${noFile.length}`);

    if (!apply) {
      console.log('');
      console.log('Dry-run finished. To apply changes run with --apply');
    } else {
      console.log('');
      console.log('✅ Changes applied to DB.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
