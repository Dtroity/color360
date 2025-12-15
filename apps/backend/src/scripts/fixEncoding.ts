/**
 * fixEncoding.ts
 * Поиск и исправление строк, повреждённых cp1251 -> UTF-8 (кракозябры вида "ÐœÐ¾Ñ�ÐºÐ²Ð°")
 *
 * Запуск:
 *   pnpm --filter backend run fix:encoding          # dry-run
 *   pnpm --filter backend run fix:encoding -- --apply
 */

import { Client } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Загружаем .env (ищем вверх по дереву)
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
];
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: +(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'video_shop',
});

const apply = process.argv.includes('--apply');

type TableCfg = {
  table: string;
  id: string;
  columns: string[];
};

const targets: TableCfg[] = [
  {
    table: 'products',
    id: 'id',
    columns: ['name', 'shortDescription', 'description', 'availability', 'externalId', 'currency'],
  },
  {
    table: 'product_images',
    id: 'id',
    columns: ['alt', 'url'],
  },
  {
    table: 'categories',
    id: 'id',
    columns: ['name', 'slug'],
  },
  {
    table: 'manufacturers',
    id: 'id',
    columns: ['name', 'slug'],
  },
];

const gibberishRegex = /[ÐÑ�]/g;

function cyrRate(s: string) {
  if (!s) return 0;
  const cyr = (s.match(/[\u0400-\u04FF]/g) || []).length;
  return cyr / s.length;
}

function looksBroken(s: string) {
  if (!s) return false;
  const gib = (s.match(gibberishRegex) || []).length;
  const hasReplacement = s.includes('�');
  return hasReplacement || gib >= Math.max(2, s.length * 0.2);
}

function fixString(s: string) {
  // Интерпретируем символы как latin1 bytes и декодируем в utf8
  return Buffer.from(s, 'binary').toString('utf8');
}

async function processTable(cfg: TableCfg) {
  const res = await client.query(
    `SELECT "${cfg.id}", ${cfg.columns.map((c) => `"${c}"`).join(', ')} FROM ${cfg.table}`,
  );

  const updates: { id: number; col: string; from: string; to: string }[] = [];

  for (const row of res.rows) {
    for (const col of cfg.columns) {
      const value = row[col];
      if (typeof value !== 'string') continue;
      if (!looksBroken(value)) continue;

      const fixed = fixString(value);
      if (fixed === value) continue;

      const scoreBefore = cyrRate(value);
      const scoreAfter = cyrRate(fixed);

      if (scoreAfter > scoreBefore) {
        updates.push({ id: row[cfg.id], col, from: value, to: fixed });
      }
    }
  }

  if (!updates.length) {
    console.log(`ℹ ${cfg.table}: повреждений не найдено`);
    return;
  }

  console.log(`📦 ${cfg.table}: найдено ${updates.length} строк к исправлению`);
  console.table(
    updates.slice(0, 20).map((u) => ({
      id: u.id,
      column: u.col,
      from: u.from.slice(0, 60),
      to: u.to.slice(0, 60),
    })),
  );

  if (apply) {
    // Группируем обновления по id
    const byId = updates.reduce<Record<number, Record<string, string>>>((acc, u) => {
      acc[u.id] = acc[u.id] || {};
      acc[u.id][u.col] = u.to;
      return acc;
    }, {});

    for (const [idStr, cols] of Object.entries(byId)) {
      const id = Number(idStr);
      const setFragments: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [col, val] of Object.entries(cols)) {
        setFragments.push(`"${col}" = $${idx++}`);
        values.push(val);
      }
      values.push(id);
      const sql = `UPDATE ${cfg.table} SET ${setFragments.join(', ')}, "updatedAt" = NOW() WHERE "${
        cfg.id
      }" = $${idx}`;
      await client.query(sql, values);
    }
    console.log(`✅ ${cfg.table}: обновлено ${Object.keys(byId).length} записей`);
  } else {
    console.log('Dry-run: изменений не внесено.');
  }
}

async function main() {
  await client.connect();
  console.log(`✅ Подключено к БД ${process.env.DATABASE_NAME || 'video_shop'}`);

  for (const cfg of targets) {
    await processTable(cfg);
  }

  await client.end();
  console.log(apply ? '✅ Применение завершено.' : 'ℹ Dry-run завершён.');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});

