# Отчёт: Исправление синхронизации изображений и статики

**Дата:** 2025-01-27  
**Ветка:** `fix/images-sync-2025-01-27`

## Выполненные задачи

### 1. Замена информации о компании ✅
- Заменено "ИП Холин А.В." на "ИП Визе В.Н." во всех файлах
- Заменено "ИНН 1234567890" на "ИНН 781452869091"
- Удалено " · ОГРНИП 123456789012345" с сайта

**Файлы:**
- `apps/frontend/src/components/layout/Footer.tsx`
- `apps/frontend/src/app/(main)/product/[...slugOrId]/page.tsx`
- `apps/frontend/src/app/(main)/product/[slug]/page.tsx`
- `scripts/seed.ts`

**Коммит:** `chore: replace company info - ИП Визе В.Н. and ИНН 781452869091`

### 2. Исправление package.json ✅
- Исправлена синтаксическая ошибка (отсутствовала запятая после `repair:images`)
- Добавлен скрипт `backup:db` для создания бэкапа БД

**Файл:** `apps/backend/package.json`

**Коммит:** `fix(backend): fix package.json syntax error`

### 3. Исправление статической раздачи uploads ✅
- Обновлён `main.ts` для правильного поиска папки uploads в порядке приоритета:
  1. `apps/backend/uploads`
  2. `apps/frontend/public/uploads`
  3. `uploads` (корень проекта)
- Добавлена раздача frontend public статики

**Файл:** `apps/backend/src/main.ts`

**Коммит:** `fix(backend): correct uploads static paths in main.ts`

### 4. Создание скрипта бэкапа БД ✅
- Создан скрипт `scripts/backup-db.ts` для создания SQL дампа таблиц `products` и `product_images`
- Скрипт создаёт INSERT statements для восстановления данных
- Сохраняет бэкапы в папку `backups/` с timestamp

**Файл:** `scripts/backup-db.ts`

**Коммит:** `feat(scripts): add database backup script`

**Использование:**
```bash
pnpm --filter backend run backup:db
# или
ts-node scripts/backup-db.ts
```

### 5. Обновление repairImages.ts ✅
- Обновлены пути поиска папок с изображениями
- Приоритет: `apps/backend/uploads/products` → `apps/frontend/public/uploads/products`

**Файл:** `apps/backend/src/scripts/repairImages.ts`

**Коммит:** `fix(scripts): update repairImages.ts paths`

**Использование:**
```bash
# Dry-run
pnpm --filter backend run repair:images

# Применить изменения
pnpm --filter backend run repair:images -- --apply
```

## Структура изображений

Изображения находятся в:
- `apps/backend/uploads/products/<id>/` - папки по ID товаров
- Файлы в форматах: `.webp`, `.jpg`, `.jpeg`, `.png`, `.gif`

## Следующие шаги

### A. Создать бэкап БД
```bash
pnpm --filter backend run backup:db
```

### B. Запустить dry-run repairImages
```bash
pnpm --filter backend run repair:images
```

### C. Применить исправления (после проверки dry-run)
```bash
pnpm --filter backend run repair:images -- --apply
```

### D. Проверить пагинацию
- Backend уже настроен на возврат до 10000 товаров по умолчанию
- Frontend использует limit=20 по умолчанию, но может быть изменён через query params

### E. Проверить админ API
- `PATCH /api/products/:id` - обновление товара
- `POST /api/admin/products/import/csv` - импорт CSV
- Админ UI доступен в `/admin/products`

## Коммиты

1. `chore: replace company info - ИП Визе В.Н. and ИНН 781452869091`
2. `fix(backend): fix package.json syntax error`
3. `fix(backend): correct uploads static paths in main.ts`
4. `feat(scripts): add database backup script`
5. `fix(scripts): update repairImages.ts paths`

## Восстановление из бэкапа

Если нужно восстановить данные из бэкапа:
```bash
psql -h localhost -U postgres -d video_shop -f backups/products_product_images_<timestamp>.sql
```

## Примечания

- Изображения в `apps/backend/uploads` не должны быть в git (добавьте в `.gitignore`)
- После применения `repairImages --apply` проверьте, что все URL в БД указывают на существующие файлы
- Backend теперь корректно раздаёт статику из правильных путей

